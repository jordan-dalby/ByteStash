import express from 'express';
import { OIDCConfig } from '../oidc/oidcConfig.js';
import userRepository from '../repositories/userRepository.js';
import { JWT_SECRET, TOKEN_EXPIRY, ALLOW_NEW_ACCOUNTS } from '../middleware/auth.js';
import jwt from 'jsonwebtoken';
import Logger from '../logger.js';
import { getDb } from '../config/database.js';
import { up_v1_5_0_snippets } from '../config/migrations/20241117-migration.js';

const router = express.Router();

function getBaseUrl(req) {
  const forwardedProto = req.get('X-Forwarded-Proto');
  
  const isSecure = req.secure || 
                   forwardedProto === 'https' || 
                   req.get('X-Forwarded-SSL') === 'on';

  const protocol = isSecure ? 'https' : 'http';
  
  const host = req.get('X-Forwarded-Host') || req.get('Host');

  Logger.debug('Protocol detection:', {
    secure: req.secure,
    forwardedProto,
    resultingProtocol: protocol,
    host
  });

  const baseUrl = `${protocol}://${host}${process.env.BASE_PATH || ''}`;
  return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
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
      return res.redirect('/login?error=config_error');
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
    const errorMessage = encodeURIComponent(error.message || 'Unknown error');
    res.redirect(`/login?error=provider_error&message=${errorMessage}`);
  }
});

router.get('/callback', async (req, res) => {
  try {
    const oidc = await OIDCConfig.getInstance();
    if (!oidc.isEnabled()) {
      return res.status(404).json({ error: 'OIDC not enabled' });
    }

    const db = getDb();
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
    const hasUsers = userCount > 0;

    const baseUrl = getBaseUrl(req);
    const callbackUrl = oidc.getCallbackUrl(baseUrl);
    const queryString = new URLSearchParams(req.query).toString();
    const currentUrl = queryString ? `${callbackUrl}?${queryString}` : callbackUrl;
    
    Logger.debug('Full callback URL:', currentUrl);

    const { _, userInfo } = await oidc.handleCallback(currentUrl, callbackUrl);
    Logger.debug('Authentication successful');

    const existingUser = await userRepository.findByOIDCId(
      userInfo.sub,
      oidc.config.serverMetadata().issuer
    );

    if (!hasUsers && !existingUser) {
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

    if (!hasUsers) {
      await up_v1_5_0_snippets(db, user.id);
    }

    const token = jwt.sign({ 
      id: user.id,
      username: user.username 
    }, JWT_SECRET, { 
      expiresIn: TOKEN_EXPIRY 
    });

    res.redirect(`/auth/callback?token=${token}`);
  } catch (error) {
    Logger.error('OIDC callback error:', error);
    let errorType = 'auth_failed';
    let errorDetails = '';

    if (error.message?.includes('state parameter')) {
      errorType = 'auth_failed';
      errorDetails = 'Your authentication session has expired';
    } else if (error.message?.includes('accounts disabled')) {
      errorType = 'registration_disabled';
    } else if (error.message?.includes('OIDC configuration')) {
      errorType = 'config_error';
    } else if (error.response?.status === 401 || error.response?.status === 403) {
      errorType = 'provider_error';
      errorDetails = 'Authorization denied by identity provider';
    }

    const messageParam = errorDetails ? `&message=${encodeURIComponent(errorDetails)}` : '';
    res.redirect(`/login?error=${errorType}${messageParam}`);
  }
});

export default router;