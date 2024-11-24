import * as client from 'openid-client';
import Logger from '../logger.js';
import crypto from 'crypto';
import { URL } from 'url';

globalThis.crypto = crypto;

class OIDCConfig {
  static instance = null;
  #stateMap = new Map();

  static async getInstance() {
    if (!OIDCConfig.instance) {
      OIDCConfig.instance = new OIDCConfig();
      await OIDCConfig.instance.initialize();
    }
    return OIDCConfig.instance;
  }

  getCallbackUrl(baseUrl) {
    // Ensure baseUrl doesn't end with a slash
    const normalizedBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    return `${normalizedBaseUrl}/api/auth/oidc/callback`;
  }

  async initialize() {
    if (process.env.OIDC_ENABLED !== 'true') {
      Logger.debug('OIDC is disabled');
      return;
    }

    try {
      const discoveryUrl = process.env.OIDC_ISSUER_URL;
      if (!discoveryUrl) {
        throw new Error('OIDC_ISSUER_URL environment variable is not set');
      }

      Logger.debug(`Discovering OIDC configuration from ${discoveryUrl}`);

      try {
        const issuerUrl = new URL(discoveryUrl);
        
        this.config = await client.discovery(
          issuerUrl, 
          process.env.OIDC_CLIENT_ID, 
          process.env.OIDC_CLIENT_SECRET
        );

        Logger.debug('Discovery successful');
        const metadata = this.config.serverMetadata();
        Logger.debug('Discovered issuer:', metadata.issuer);

        this.startStateCleanup();

      } catch (discoveryError) {
        Logger.error('Discovery request failed:', {
          error: discoveryError.message,
          code: discoveryError.code,
          expected: discoveryError?.cause?.expected,
          actual: discoveryError?.cause?.body?.issuer,
          attribute: discoveryError?.cause?.attribute
        });
        throw discoveryError;
      }

      Logger.debug('OIDC client configured successfully');
    } catch (error) {
      Logger.error('Failed to initialize OIDC:', error);
      throw error;
    }
  }

  startStateCleanup() {
    setInterval(() => {
      const now = Date.now();
      for (const [state, data] of this.#stateMap) {
        if (now - data.timestamp > 5 * 60 * 1000) {
          this.#stateMap.delete(state);
        }
      }
    }, 5 * 60 * 1000);
  }

  async generateAuthParameters() {
    const code_verifier = client.randomPKCECodeVerifier();
    const code_challenge = await client.calculatePKCECodeChallenge(code_verifier);
    const state = client.randomState();
    const nonce = client.randomNonce();

    this.#stateMap.set(state, {
      code_verifier,
      nonce,
      timestamp: Date.now()
    });

    return {
      code_challenge,
      state,
      nonce
    };
  }

  async getAuthorizationUrl(baseUrl, scope = 'openid profile email') {
    const callback_url = this.getCallbackUrl(baseUrl);
    const { code_challenge, state, nonce } = await this.generateAuthParameters();

    const parameters = {
      redirect_uri: callback_url,
      scope,
      state,
      nonce,
      response_type: 'code',
      client_id: process.env.OIDC_CLIENT_ID,
      code_challenge,
      code_challenge_method: 'S256'
    };

    if (!this.config.serverMetadata().supportsPKCE) {
      delete parameters.code_challenge;
      delete parameters.code_challenge_method;
    }

    return client.buildAuthorizationUrl(this.config, parameters);
  }

  async handleCallback(currentUrl, callbackUrl) {
    Logger.debug('Handling callback with:', { currentUrl, callbackUrl });
    
    const urlParams = new URL(currentUrl).searchParams;
    const state = urlParams.get('state');

    if (!state || !this.#stateMap.has(state)) {
      throw new Error('Invalid or expired state parameter');
    }

    const { code_verifier, nonce } = this.#stateMap.get(state);
    this.#stateMap.delete(state);

    const checks = {
      pkceCodeVerifier: code_verifier,
      expectedState: state,
      expectedNonce: nonce,
      idTokenExpected: true,
      redirect_uri: callbackUrl
    };

    try {
      const tokens = await client.authorizationCodeGrant(
        this.config,
        new URL(currentUrl),
        checks
      );

      if (!tokens.access_token) {
        throw new Error('No access token received');
      }

      const claims = tokens.claims();
      
      Logger.debug('Token claims received:', {
        sub: claims.sub,
        scope: tokens.scope,
        token_type: tokens.token_type
      });

      try {
        const userInfo = await client.fetchUserInfo(
          this.config,
          tokens.access_token,
          claims.sub,
          {
            headers: {
              'bytestashauth': `Bearer ${tokens.access_token}`,
              'Accept': 'application/json'
            }
          }
        );

        return {
          tokens,
          userInfo
        };

      } catch (userInfoError) {
        Logger.error('Failed to fetch user info:', {
          error: userInfoError.message,
          code: userInfoError.code,
          status: userInfoError?.cause?.state?.status,
          statusText: userInfoError?.cause?.state?.statusText
        });

        return {
          tokens,
          userInfo: {
            sub: claims.sub,
            email: claims.email,
            name: claims.name,
            preferred_username: claims.preferred_username
          }
        };
      }

    } catch (error) {
      Logger.error('Token exchange failed:', {
        error: error.message,
        code: error.code,
        state: state
      });
      throw error;
    }
  }

  getDisplayName() {
    return process.env.OIDC_DISPLAY_NAME || 'Single Sign-On';
  }

  isEnabled() {
    return process.env.OIDC_ENABLED === 'true';
  }

  getScopes() {
    return process.env.OIDC_SCOPES?.split(' ') || ['openid', 'profile', 'email'];
  }

  getConfig() {
    return {
      enabled: this.isEnabled(),
      displayName: this.getDisplayName(),
    };
  }
}

export { OIDCConfig };