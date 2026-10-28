import * as client from 'openid-client';
import Logger from '../logger.js';
import { URL } from 'url';

const DEFAULT_SCOPES = ['openid', 'profile', 'email'];
const STATE_TTL_MS = 10 * 60 * 1000;
const DISCOVERY_RETRY_MS = 10 * 1000;

const CLIENT_AUTH_METHODS = {
  client_secret_basic: client.ClientSecretBasic,
  client_secret_post: client.ClientSecretPost,
  none: client.None,
};

const TLS_ERROR_CODES = new Set([
  'UNABLE_TO_GET_ISSUER_CERT',
  'UNABLE_TO_GET_ISSUER_CERT_LOCALLY',
  'UNABLE_TO_VERIFY_LEAF_SIGNATURE',
  'SELF_SIGNED_CERT_IN_CHAIN',
  'DEPTH_ZERO_SELF_SIGNED_CERT',
  'CERT_HAS_EXPIRED',
  'CERT_NOT_YET_VALID',
  'ERR_TLS_CERT_ALTNAME_INVALID',
]);
const DNS_ERROR_CODES = new Set(['ENOTFOUND', 'EAI_AGAIN']);
const CONNECTION_ERROR_CODES = new Set([
  'ECONNREFUSED',
  'ECONNRESET',
  'EHOSTUNREACH',
  'ENETUNREACH',
  'ETIMEDOUT',
  'UND_ERR_CONNECT_TIMEOUT',
]);

const OAUTH_ERROR_HINTS = {
  invalid_client: 'The provider rejected the client credentials. Check OIDC_CLIENT_ID and OIDC_CLIENT_SECRET.',
  unauthorized_client: 'The provider does not allow this client to use the authorization code flow.',
  invalid_grant: 'The provider rejected the authorization code. This usually means the login took too long, or the redirect URI registered at the provider does not exactly match the one ByteStash uses.',
  invalid_scope: 'The provider rejected the requested scopes, check OIDC_SCOPES.',
  access_denied: 'The provider denied access. Check that your account is allowed to use this application.',
};

function readEnv(name) {
  let value = process.env[name]?.trim();
  if (value && /^(["']).*\1$/.test(value)) {
    value = value.slice(1, -1).trim();
  }
  return value || undefined;
}

function withoutTrailingSlash(value) {
  return value.replace(/\/+$/, '');
}

class OIDCSetupError extends Error {
  constructor(message, code) {
    super(message);
    this.code = code;
  }
}

function findCause(error, predicate) {
  for (let current = error, depth = 0; current && depth < 5; current = current.cause, depth++) {
    if (predicate(current)) {
      return current;
    }
  }
  return undefined;
}

class OIDCConfig {
  static instance = null;
  #stateMap = new Map();
  #discovery = null;
  #lastFailure = null;
  #authMethod = null;
  #authMethodLocked = false;

  static async getInstance() {
    if (!OIDCConfig.instance) {
      OIDCConfig.instance = new OIDCConfig();
      OIDCConfig.instance.startStateCleanup();
    }
    await OIDCConfig.instance.initialize();
    return OIDCConfig.instance;
  }

  getCallbackUrl(baseUrl) {
    return `${withoutTrailingSlash(baseUrl)}/api/auth/oidc/callback`;
  }

  getCallbackLogoutUrl(baseUrl) {
    return `${withoutTrailingSlash(baseUrl)}/auth/logout_callback`;
  }

  async initialize() {
    if (!this.isEnabled() || this.config) {
      return;
    }

    if (!this.#discovery) {
      if (this.#lastFailure && Date.now() - this.#lastFailure.at < DISCOVERY_RETRY_MS) {
        throw this.#lastFailure.error;
      }

      this.#discovery = this.#discover()
        .then((config) => {
          this.config = config;
          this.#lastFailure = null;
        })
        .catch((error) => {
          this.#lastFailure = { at: Date.now(), error };
          Logger.error(`OIDC setup failed: ${this.describeError(error)}`);
          throw error;
        })
        .finally(() => {
          this.#discovery = null;
        });
    }

    await this.#discovery;
  }

  async #discover() {
    const issuer = readEnv('OIDC_ISSUER_URL');
    const clientId = readEnv('OIDC_CLIENT_ID');

    if (!issuer) {
      throw new OIDCSetupError('OIDC_ISSUER_URL is not set.');
    }
    if (!clientId) {
      throw new OIDCSetupError('OIDC_CLIENT_ID is not set.');
    }

    let issuerUrl;
    try {
      issuerUrl = new URL(issuer);
    } catch {
      throw new OIDCSetupError(`OIDC_ISSUER_URL "${issuer}" is not a valid URL.`);
    }

    const insecure = issuerUrl.protocol === 'http:';
    if (insecure) {
      Logger.warn('OIDC_ISSUER_URL uses plain http, tokens will be exchanged with the provider unencrypted.');
    }
    const options = insecure ? { execute: [client.allowInsecureRequests] } : undefined;

    Logger.debug(`Discovering OIDC configuration from ${issuerUrl.href}`);

    let discovered;
    try {
      discovered = await client.discovery(issuerUrl, clientId, undefined, undefined, options);
    } catch (error) {
      const actualIssuer = error?.cause?.attribute === 'issuer' ? error.cause.body?.issuer : undefined;
      if (typeof actualIssuer !== 'string') {
        throw error;
      }
      if (withoutTrailingSlash(actualIssuer) !== withoutTrailingSlash(issuerUrl.href)) {
        throw new OIDCSetupError(
          `The provider reports its issuer as "${actualIssuer}", which does not match OIDC_ISSUER_URL "${issuer}". ` +
          `Set OIDC_ISSUER_URL=${actualIssuer}`
        );
      }
      Logger.info(`Using issuer "${actualIssuer}" as reported by the provider (OIDC_ISSUER_URL is "${issuer}")`);
      discovered = await client.discovery(new URL(actualIssuer), clientId, undefined, undefined, options);
    }

    const metadata = discovered.serverMetadata();
    this.#authMethod = this.#chooseAuthMethod(metadata);
    const config = this.#buildConfig(metadata, insecure);

    const redirectHint = readEnv('PUBLIC_URL')
      ? `Redirect URI: ${this.getCallbackUrl(this.getPublicUrl())}, post-logout redirect URI: ${this.getCallbackLogoutUrl(this.getPublicUrl())}`
      : 'Redirect URIs are derived from request headers, set PUBLIC_URL to pin them';
    Logger.info(`OIDC ready: issuer ${metadata.issuer}, client authentication ${this.#authMethod}. ${redirectHint}`);

    return config;
  }

  #chooseAuthMethod(metadata) {
    const configured = readEnv('OIDC_TOKEN_ENDPOINT_AUTH_METHOD');
    if (configured) {
      if (!CLIENT_AUTH_METHODS[configured]) {
        throw new OIDCSetupError(
          `OIDC_TOKEN_ENDPOINT_AUTH_METHOD "${configured}" is not supported, use one of: ${Object.keys(CLIENT_AUTH_METHODS).join(', ')}.`
        );
      }
      if (configured !== 'none' && !readEnv('OIDC_CLIENT_SECRET')) {
        throw new OIDCSetupError(`OIDC_TOKEN_ENDPOINT_AUTH_METHOD is ${configured} but OIDC_CLIENT_SECRET is not set.`);
      }
      this.#authMethodLocked = true;
      return configured;
    }

    if (!readEnv('OIDC_CLIENT_SECRET')) {
      return 'none';
    }

    const supported = metadata.token_endpoint_auth_methods_supported;
    if (Array.isArray(supported) && !supported.includes('client_secret_post') && supported.includes('client_secret_basic')) {
      return 'client_secret_basic';
    }
    return 'client_secret_post';
  }

  #buildConfig(metadata, insecure = metadata.issuer.startsWith('http:')) {
    const secret = readEnv('OIDC_CLIENT_SECRET');
    const config = new client.Configuration(
      metadata,
      readEnv('OIDC_CLIENT_ID'),
      secret,
      CLIENT_AUTH_METHODS[this.#authMethod](secret)
    );
    if (insecure) {
      client.allowInsecureRequests(config);
    }
    return config;
  }

  async #exchangeCode(currentUrl, checks) {
    try {
      return await client.authorizationCodeGrant(this.config, new URL(currentUrl), checks);
    } catch (error) {
      const alternative = {
        client_secret_post: 'client_secret_basic',
        client_secret_basic: 'client_secret_post',
      }[this.#authMethod];

      if (error?.error !== 'invalid_client' || this.#authMethodLocked || !alternative) {
        throw error;
      }

      const previous = { method: this.#authMethod, config: this.config };
      this.#authMethod = alternative;
      this.config = this.#buildConfig(this.config.serverMetadata());

      try {
        const tokens = await client.authorizationCodeGrant(this.config, new URL(currentUrl), checks);
        this.#authMethodLocked = true;
        Logger.info(
          `The provider rejected ${previous.method} but accepted ${alternative}, ` +
          `set OIDC_TOKEN_ENDPOINT_AUTH_METHOD=${alternative} to skip this retry after restarts`
        );
        return tokens;
      } catch {
        this.#authMethod = previous.method;
        this.config = previous.config;
        throw error;
      }
    }
  }

  startStateCleanup() {
    setInterval(() => {
      const now = Date.now();
      for (const [state, data] of this.#stateMap) {
        if (now - data.timestamp > STATE_TTL_MS) {
          this.#stateMap.delete(state);
        }
      }
    }, STATE_TTL_MS).unref();
  }

  async generateAuthParameters(redirectUri) {
    const code_verifier = client.randomPKCECodeVerifier();
    const code_challenge = await client.calculatePKCECodeChallenge(code_verifier);
    const state = client.randomState();
    const nonce = client.randomNonce();

    this.#stateMap.set(state, {
      code_verifier,
      nonce,
      redirectUri,
      timestamp: Date.now()
    });

    return {
      code_challenge,
      state,
      nonce
    };
  }

  async getAuthorizationUrl(baseUrl, scope = this.getScopes().join(' ')) {
    const callback_url = this.getCallbackUrl(baseUrl);
    const { code_challenge, state, nonce } = await this.generateAuthParameters(callback_url);

    const parameters = {
      redirect_uri: callback_url,
      scope,
      state,
      nonce,
      response_type: 'code',
      code_challenge,
      code_challenge_method: 'S256'
    };

    Logger.info(`Starting OIDC login with redirect URI ${callback_url}`);
    return client.buildAuthorizationUrl(this.config, parameters);
  }

  async getLogoutUrl(baseUrl, id_token) {
    const metadata = this.config.serverMetadata();

    if (!metadata.end_session_endpoint) {
      Logger.debug('Provider does not support end_session_endpoint, using local-only logout');
      return null;
    }

    const callback_url = this.getCallbackLogoutUrl(baseUrl);
    Logger.debug(`Logging out at the provider, post-logout redirect URI ${callback_url}`);

    const parameters = {
      post_logout_redirect_uri: callback_url,
      client_id: this.config.clientMetadata().client_id,
      state: client.randomState(),
      id_token_hint: id_token
    };

    return client.buildEndSessionUrl(this.config, parameters);
  }

  async handleCallback(currentUrl) {
    const urlParams = new URL(currentUrl).searchParams;
    const state = urlParams.get('state');

    if (!state || !this.#stateMap.has(state)) {
      throw new OIDCSetupError(
        'The login session expired or was started on a different address. Start the login again from the ByteStash login page.',
        'login_expired'
      );
    }

    const { code_verifier, nonce, redirectUri } = this.#stateMap.get(state);
    this.#stateMap.delete(state);

    const callbackUrl = new URL(redirectUri);
    callbackUrl.search = urlParams.toString();

    const checks = {
      pkceCodeVerifier: code_verifier,
      expectedState: state,
      expectedNonce: nonce,
      idTokenExpected: true,
    };

    const tokens = await this.#exchangeCode(callbackUrl.href, checks);
    const claims = tokens.claims();

    Logger.debug('Token claims received:', {
      sub: claims.sub,
      scope: tokens.scope,
      token_type: tokens.token_type
    });

    let userInfo = {
      sub: claims.sub,
      email: claims.email,
      name: claims.name,
      preferred_username: claims.preferred_username
    };

    if (tokens.access_token && this.config.serverMetadata().userinfo_endpoint) {
      try {
        userInfo = {
          ...userInfo,
          ...(await client.fetchUserInfo(this.config, tokens.access_token, claims.sub))
        };
      } catch (userInfoError) {
        Logger.warn(`Could not fetch OIDC user info, using ID token claims instead: ${this.describeError(userInfoError)}`);
      }
    }

    return {
      tokens,
      userInfo
    };
  }

  isExpiredLogin(error) {
    return error?.code === 'login_expired' || error?.error === 'access_denied';
  }

  describeError(error) {
    if (error instanceof OIDCSetupError) {
      return error.message;
    }

    if (typeof error?.error === 'string') {
      const providerMessage = [error.error, error.error_description].filter(Boolean).join(': ');
      const hint = OAUTH_ERROR_HINTS[error.error];
      return hint ? `${hint} (provider said "${providerMessage}")` : `The provider returned "${providerMessage}".`;
    }

    let host = 'the OIDC provider';
    try {
      host = new URL(readEnv('OIDC_ISSUER_URL')).host;
    } catch { /* keep the generic name */ }

    const network = findCause(error, (e) => typeof e?.code === 'string' &&
      (TLS_ERROR_CODES.has(e.code) || DNS_ERROR_CODES.has(e.code) || CONNECTION_ERROR_CODES.has(e.code)));
    if (network && TLS_ERROR_CODES.has(network.code)) {
      return `ByteStash does not trust the TLS certificate of ${host} (${network.code}). ` +
        'If it is signed by your own CA, mount the CA certificate into the container and set NODE_EXTRA_CA_CERTS to its path.';
    }
    if (network && DNS_ERROR_CODES.has(network.code)) {
      return `ByteStash could not resolve ${host} (${network.code}). The ByteStash container must be able to resolve and reach the provider.`;
    }
    if (network) {
      return `ByteStash could not connect to ${host} (${network.code}). Check that the provider is running and reachable from the ByteStash container.`;
    }
    if (findCause(error, (e) => e?.name === 'TimeoutError')) {
      return `Timed out contacting ${host}. Check that the provider is reachable from the ByteStash container.`;
    }

    if (error?.code === 'OAUTH_RESPONSE_IS_NOT_CONFORM' && error.cause?.status) {
      const { status, url } = error.cause;
      return status >= 500
        ? `${url || host} answered with HTTP ${status}, the provider (or the proxy in front of it) is not available right now.`
        : `${url || host} answered with HTTP ${status}. Check that OIDC_ISSUER_URL is the issuer URL of your provider.`;
    }
    if (error?.code === 'OAUTH_RESPONSE_IS_NOT_JSON' || error?.code === 'OAUTH_PARSE_ERROR') {
      return 'The provider did not return valid OpenID Connect metadata. Check that OIDC_ISSUER_URL is the issuer URL of your provider.';
    }
    if (findCause(error, (e) => typeof e?.message === 'string' && e.message.includes('"id_token"'))) {
      return 'The provider did not return an ID token. Make sure the "openid" scope is allowed for this client.';
    }

    return error?.message || 'Unknown error';
  }

  getDisplayName() {
    return readEnv('OIDC_DISPLAY_NAME') || 'Single Sign-On';
  }

  isEnabled() {
    return readEnv('OIDC_ENABLED') === 'true';
  }

  getPublicUrl() {
    const publicUrl = readEnv('PUBLIC_URL');
    if (!publicUrl) {
      return undefined;
    }

    const normalized = withoutTrailingSlash(publicUrl);
    const basePath = withoutTrailingSlash(process.env.BASE_PATH || '');
    return basePath && !normalized.endsWith(basePath) ? `${normalized}${basePath}` : normalized;
  }

  getScopes() {
    const scopes = readEnv('OIDC_SCOPES')?.split(/[\s,]+/).filter(Boolean) || DEFAULT_SCOPES;
    return scopes.includes('openid') ? scopes : ['openid', ...scopes];
  }

  getConfig(loggedIn = false) {
    return {
      enabled: this.isEnabled(),
      logged_in: loggedIn,
      displayName: this.getDisplayName(),
    };
  }
}

export { OIDCConfig };
