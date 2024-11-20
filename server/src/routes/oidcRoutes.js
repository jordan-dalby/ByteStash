import express from 'express';
import { OIDCConfig } from '../oidc/oidcConfig.js';
import userRepository from '../repositories/userRepository.js';
import { JWT_SECRET, TOKEN_EXPIRY, ALLOW_NEW_ACCOUNTS } from '../middleware/auth.js';
import jwt from 'jsonwebtoken';
import Logger from '../logger.js';
import { getDb } from '../config/database.js';

const router = express.Router();

function getBaseUrl(req) {
  return `${req.protocol}://${req.get('host')}${process.env.BASE_PATH || ''}`;
}

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

    const baseUrl = getBaseUrl(req);
    const authUrl = await oidc.getAuthorizationUrl(
      baseUrl,
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

    const baseUrl = getBaseUrl(req);
    const callbackUrl = oidc.getCallbackUrl(baseUrl);
    const queryString = new URLSearchParams(req.query).toString();
    const currentUrl = queryString ? `${callbackUrl}?${queryString}` : callbackUrl;
    
    Logger.debug('Full callback URL:', currentUrl);

    const { tokens, userInfo } = await oidc.handleCallback(currentUrl, callbackUrl);
    Logger.debug('Authentication successful');

    const existingUser = await userRepository.findByOIDCId(
      userInfo.sub,
      oidc.config.serverMetadata().issuer
    );

    if (!existingUser) {
      const db = getDb();
      const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
      const hasUsers = userCount > 0;

      if (hasUsers && !ALLOW_NEW_ACCOUNTS) {
        Logger.error('OIDC registration blocked: New accounts not allowed');
        return res.redirect('/login?error=registration_disabled');
      }
    }

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