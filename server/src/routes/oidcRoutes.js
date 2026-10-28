import express from 'express';
import { OIDCConfig } from '../oidc/oidcConfig.js';
import userRepository from '../repositories/userRepository.js';
import { JWT_SECRET, TOKEN_EXPIRY, ALLOW_NEW_ACCOUNTS, getIdTokenFromRequest, setAuthCookie, clearAuthCookie } from '../middleware/auth.js';
import jwt from 'jsonwebtoken';
import Logger from '../logger.js';
import snippetRepository from '../repositories/snippetRepository.js';
import { isAdmin } from '../middleware/adminAuth.js';

const router = express.Router();

const basePath = process.env.BASE_PATH || '';

function firstHeaderValue(req, name) {
  return req.get(name)?.split(',')[0].trim() || undefined;
}

function getBaseUrl(req, oidc) {
  const publicUrl = oidc.getPublicUrl();
  if (publicUrl) {
    return publicUrl;
  }

  const forwardedProto = firstHeaderValue(req, 'X-Forwarded-Proto');

  const isSecure = req.secure ||
    forwardedProto === 'https' ||
    req.get('X-Forwarded-SSL') === 'on';

  const protocol = isSecure ? 'https' : 'http';

  if (!isSecure && req.get('X-Forwarded-For') && !forwardedProto) {
    Logger.warn(
      'ByteStash is behind a reverse proxy that does not send X-Forwarded-Proto, so OIDC redirect URLs use http. ' +
      'If you open ByteStash over https, set PUBLIC_URL (e.g. https://bytestash.example.com) or forward the header.'
    );
  }

  const host = firstHeaderValue(req, 'X-Forwarded-Host') || req.get('Host');

  Logger.debug('Protocol detection:', {
    secure: req.secure,
    forwardedProto,
    resultingProtocol: protocol,
    host
  });

  const baseUrl = `${protocol}://${host}${basePath}`;
  return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
}

function redirectToLogin(res, error, message) {
  const messageParam = message ? `&message=${encodeURIComponent(message)}` : '';
  res.redirect(`${basePath}/login?error=${error}${messageParam}`);
}

router.get('/config', async (req, res) => {
  const oidc = OIDCConfig.instance || new OIDCConfig();
  res.json(oidc.getConfig(Boolean(getIdTokenFromRequest(req))));
});

router.get('/auth', async (req, res) => {
  try {
    const oidc = await OIDCConfig.getInstance();
    if (!oidc.isEnabled()) {
      return redirectToLogin(res, 'config_error');
    }

    const authUrl = await oidc.getAuthorizationUrl(getBaseUrl(req, oidc));

    Logger.debug('Generated auth URL:', authUrl.href);
    res.redirect(authUrl.href);
  } catch (error) {
    const oidc = OIDCConfig.instance;
    const message = oidc ? oidc.describeError(error) : error.message;
    Logger.error(`OIDC login could not start: ${message}`);
    redirectToLogin(res, 'provider_error', message);
  }
});

router.get('/logout', async (req, res) => {
  try {
    const oidc = await OIDCConfig.getInstance();
    if (!oidc.isEnabled()) {
      return res.redirect('/');
    }

    const idToken = getIdTokenFromRequest(req);

    clearAuthCookie(req, res);

    if (!idToken) {
      return res.redirect(`${basePath}/auth/logout_callback`);
    }

    const logoutUrl = await oidc.getLogoutUrl(getBaseUrl(req, oidc), idToken);

    if (logoutUrl) {
      res.redirect(logoutUrl.href);
    } else {
      // Provider doesn't support end_session_endpoint (e.g., Google)
      // Perform local-only logout
      res.redirect(`${basePath}/auth/logout_callback`);
    }
  } catch (error) {
    Logger.error(`OIDC logout error: ${OIDCConfig.instance?.describeError(error) || error.message}`);
    clearAuthCookie(req, res);
    res.redirect(`${basePath}/auth/logout_callback`);
  }
});

router.get('/callback', async (req, res) => {
  try {
    const oidc = await OIDCConfig.getInstance();
    if (!oidc.isEnabled()) {
      return res.status(404).json({ error: 'OIDC not enabled' });
    }

    const userCount = await userRepository.count();
    const hasUsers = userCount > 0;

    const callbackUrl = oidc.getCallbackUrl(getBaseUrl(req, oidc));
    const currentUrl = new URL(req.originalUrl, callbackUrl).href;

    const { tokens, userInfo } = await oidc.handleCallback(currentUrl);
    Logger.debug('Authentication successful');

    const existingUser = await userRepository.findByOIDCId(
      userInfo.sub,
      oidc.config.serverMetadata().issuer
    );

    if (!hasUsers && !existingUser) {
      const userCount = await userRepository.count();
      const hasUsers = userCount > 0;

      if (hasUsers && !ALLOW_NEW_ACCOUNTS) {
        Logger.error('OIDC registration blocked: New accounts not allowed');
        return redirectToLogin(res, 'registration_disabled');
      }
    }

    const user = await userRepository.findOrCreateOIDCUser(
      userInfo,
      oidc.config.serverMetadata().issuer
    );

    if (user.is_active === 0 || user.is_active === false) {
      Logger.error('OIDC login blocked: Account deactivated');
      return redirectToLogin(res, 'account_deactivated', 'Your account has been deactivated');
    }

    await userRepository.updateLastLogin(user.id);

    if (!hasUsers) {
      await snippetRepository.assignOrphanedSnippets(user.id);
    }

    const token = jwt.sign({
      id: user.id,
      username: user.username
    }, JWT_SECRET, {
      expiresIn: TOKEN_EXPIRY
    });

    setAuthCookie(req, res, token, tokens.id_token);
    res.redirect(`${basePath}/auth/callback`);
  } catch (error) {
    const oidc = OIDCConfig.instance;
    const message = oidc?.describeError(error) || error.message;
    Logger.error(`OIDC login failed: ${message}`);
    Logger.debug('OIDC callback error:', error);
    redirectToLogin(res, oidc?.isExpiredLogin(error) ? 'auth_failed' : 'provider_error', message);
  }
});

export default router;