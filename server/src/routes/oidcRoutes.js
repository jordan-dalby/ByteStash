const express = require('express');
const { OIDCConfig } = require('../oidc/oidcConfig');
const userRepository = require('../repositories/userRepository');
const { JWT_SECRET, TOKEN_EXPIRY } = require('../middleware/auth');
const jwt = require('jsonwebtoken');
const Logger = require('../logger');

const router = express.Router();

router.get('/config', async (req, res) => {
  try {
    const oidc = await OIDCConfig.getInstance();
    res.json(oidc.getConfig());
  } catch (error) {
    Logger.error('OIDC config fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch OIDC configuration' });
  }
});

router.get('/auth', async (req, res) => {
  try {
    const oidc = await OIDCConfig.getInstance();
    if (!oidc.isEnabled()) {
      return res.status(404).json({ error: 'OIDC not enabled' });
    }

    const authUrl = oidc.client.authorizationUrl({
      scope: oidc.getScopes().join(' '),
      state: Math.random().toString(36).substring(7),
    });

    res.redirect(authUrl);
  } catch (error) {
    Logger.error('OIDC auth error:', error);
    res.redirect('/login?error=auth_failed');
  }
});

router.get('/callback', async (req, res) => {
  try {
    const oidc = await OIDCConfig.getInstance();
    const params = oidc.client.callbackParams(req);
    const tokenSet = await oidc.client.callback(
      process.env.OIDC_CALLBACK_URL,
      params
    );

    const userinfo = await oidc.client.userinfo(tokenSet.access_token);
    const user = await userRepository.findOrCreateOIDCUser(
      userinfo,
      oidc.client.issuer.metadata.issuer
    );

    const token = jwt.sign({ 
      id: user.id,
      username: user.username 
    }, JWT_SECRET, { 
      expiresIn: TOKEN_EXPIRY 
    });

    res.redirect(`/auth/callback?token=${token}`);
  } catch (error) {
    Logger.error('OIDC callback error:', error);
    res.redirect('/login?error=auth_failed');
  }
});

module.exports = router;