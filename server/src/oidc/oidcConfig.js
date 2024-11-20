const Logger = require('../logger');

class OIDCConfig {
  static instance = null;

  static async getInstance() {
    if (!OIDCConfig.instance) {
      OIDCConfig.instance = new OIDCConfig();
      await OIDCConfig.instance.initialize();
    }
    return OIDCConfig.instance;
  }

  async initialize() {
    if (process.env.OIDC_ENABLED !== 'true') {
      Logger.debug('OIDC is disabled');
      return;
    }

    try {
      const { Issuer } = await import('openid-client');

      let issuer;

      if (process.env.OIDC_AUTH_URL && process.env.OIDC_TOKEN_URL) {
        issuer = new Issuer({
          issuer: process.env.OIDC_ISSUER_URL,
          authorization_endpoint: process.env.OIDC_AUTH_URL,
          token_endpoint: process.env.OIDC_TOKEN_URL,
          userinfo_endpoint: process.env.OIDC_USERINFO_URL,
        });
      } else {
        issuer = await Issuer.discover(process.env.OIDC_ISSUER_URL);
      }

      this.client = new issuer.Client({
        client_id: process.env.OIDC_CLIENT_ID,
        client_secret: process.env.OIDC_CLIENT_SECRET,
        redirect_uris: [process.env.OIDC_CALLBACK_URL],
        response_types: ['code'],
      });

      Logger.debug('OIDC client configured successfully');
    } catch (error) {
      Logger.error('Failed to initialize OIDC:', error);
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

module.exports = { OIDCConfig };
