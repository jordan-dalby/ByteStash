import fs from 'fs';
import { join } from 'path';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import Logger from '../logger.js';
import userRepository from '../repositories/userRepository.js';
import { getDataDirectory } from '../config/database.js';

const KNOWN_DEFAULT_SECRETS = new Set(['your-secret', 'your-secret-key']);
const MIN_SECRET_LENGTH = 32;
const JWT_ALGORITHMS = ['HS256'];

function readConfiguredSecret() {
  if (process.env.JWT_SECRET_FILE) {
    try {
      return fs.readFileSync(process.env.JWT_SECRET_FILE, 'utf8').trim();
    } catch (error) {
      console.error('Error reading JWT secret file:', error);
      process.exit(1);
    }
  }
  return (process.env.JWT_SECRET || '').trim();
}

function readOrCreatePersistedSecret() {
  const secretPath = join(getDataDirectory(), '.jwt_secret');

  try {
    const existing = fs.readFileSync(secretPath, 'utf8').trim();
    if (existing) {
      return existing;
    }
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.error(`Error reading generated JWT secret from ${secretPath}:`, error);
      process.exit(1);
    }
  }

  const secret = crypto.randomBytes(64).toString('hex');
  try {
    fs.writeFileSync(secretPath, secret, { mode: 0o600 });
  } catch (error) {
    console.error(
      `Could not persist a generated JWT secret to ${secretPath}. ` +
      'Make the data directory writable or set JWT_SECRET / JWT_SECRET_FILE ' +
      '(e.g. the output of `openssl rand -hex 32`).',
      error
    );
    process.exit(1);
  }

  Logger.info(`No JWT_SECRET configured, generated a random one and stored it at ${secretPath}`);
  return secret;
}

function getJwtSecret() {
  const configured = readConfiguredSecret();

  if (configured && !KNOWN_DEFAULT_SECRETS.has(configured)) {
    if (configured.length < MIN_SECRET_LENGTH) {
      Logger.warn(
        `JWT secret is shorter than ${MIN_SECRET_LENGTH} characters. ` +
        'Use a long random value, e.g. the output of `openssl rand -hex 32`.'
      );
    }
    return configured;
  }

  if (configured) {
    Logger.warn(
      'JWT secret is set to a publicly known default value and will be ignored, ' +
      'because anyone could use it to forge login tokens. A generated secret is used ' +
      'instead; remove JWT_SECRET or set it to a long random value. Existing sessions ' +
      'will need to log in again.'
    );
  }

  return readOrCreatePersistedSecret();
}

const JWT_SECRET = getJwtSecret();
const ALLOW_NEW_ACCOUNTS = process.env.ALLOW_NEW_ACCOUNTS === 'true';
const TOKEN_EXPIRY = process.env.TOKEN_EXPIRY || '24h';
const DISABLE_ACCOUNTS = process.env.DISABLE_ACCOUNTS === 'true';
const DISABLE_INTERNAL_ACCOUNTS = process.env.DISABLE_INTERNAL_ACCOUNTS === 'true';
const ALLOW_PASSWORD_CHANGES = process.env.ALLOW_PASSWORD_CHANGES === 'true';

function generateAnonymousUsername() {
  return `anon-${crypto.randomBytes(8).toString('hex')}`;
}

async function getOrCreateAnonymousUser() {
  try {
    let existingUser = await userRepository.findById(0);

    if (existingUser) {
      return existingUser;
    }

    return await userRepository.createAnonymousUser(generateAnonymousUsername());
  } catch (error) {
    Logger.error('Error getting/creating anonymous user:', error);
    throw error;
  }
}

async function getUserFromToken(token) {
  let payload;
  try {
    payload = jwt.verify(token, JWT_SECRET, { algorithms: JWT_ALGORITHMS });
  } catch (error) {
    return null;
  }

  if (!Number.isInteger(payload?.id)) {
    return null;
  }

  const user = await userRepository.findById(payload.id);
  if (!user || user.is_active === 0 || user.is_active === false) {
    return null;
  }

  return user;
}

const authenticateToken = async (req, res, next) => {
  if (req.apiKey) {
    return next();
  }

  if (DISABLE_ACCOUNTS) {
    try {
      const anonymousUser = await getOrCreateAnonymousUser();
      req.user = anonymousUser;
      return next();
    } catch (error) {
      Logger.error('Error in anonymous authentication:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Try to get token from header first (for API calls)
  const authHeader = req.headers['bytestashauth'];
  let token = authHeader && authHeader.split(' ')[1];

  // If no header token, try to get from cookie (for browser access)
  if (!token && req.cookies) {
    token = req.cookies.bytestash_token;
  }

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const user = await getUserFromToken(token);
    if (!user) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  } catch (error) {
    Logger.error('Error authenticating token:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export {
  authenticateToken,
  getUserFromToken,
  JWT_SECRET,
  TOKEN_EXPIRY,
  ALLOW_NEW_ACCOUNTS,
  DISABLE_ACCOUNTS,
  DISABLE_INTERNAL_ACCOUNTS,
  ALLOW_PASSWORD_CHANGES,
  getOrCreateAnonymousUser,
};
