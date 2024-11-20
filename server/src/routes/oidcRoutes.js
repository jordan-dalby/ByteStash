import express from 'express';
import { OIDCConfig } from '../oidc/oidcConfig.js';
import userRepository from '../repositories/userRepository.js';
import { JWT_SECRET, TOKEN_EXPIRY } from '../middleware/auth.js';
import jwt from 'jsonwebtoken';
import Logger from '../logger.js';

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

    const authUrl = await oidc.getAuthorizationUrl(
      process.env.OIDC_CALLBACK_URL,
      oidc.getScopes().join(' ')
    );

    Logger.debug('Generated auth URL:', authUrl);
    res.redirect(authUrl);
  } catch (error) {
    Logger.error('OIDC auth error:', error);
    res.redirect('/login?error=auth_failed');
  }
});

router.get('/callback', async (req, res) => {
  try {
    const oidc = await OIDCConfig.getInstance();
    if (!oidc.isEnabled()) {
      return res.status(404).json({ error: 'OIDC not enabled' });
    }

    const fullUrl = `${process.env.OIDC_CALLBACK_URL}?${new URLSearchParams(req.query).toString()}`;
    Logger.debug('Full callback URL:', fullUrl);

    const { tokens, userInfo } = await oidc.handleCallback(fullUrl);
    Logger.debug('Authentication successful');

    const user = await userRepository.findOrCreateOIDCUser(
      userInfo,
      oidc.config.serverMetadata().issuer
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

export default router;