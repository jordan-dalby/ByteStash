import fs from 'fs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import Logger from '../logger.js';
import userRepository from '../repositories/userRepository.js';

function getJwtSecret() {
  if (process.env.JWT_SECRET_FILE) {
    try {
      return fs.readFileSync(process.env.JWT_SECRET_FILE, 'utf8').trim();
    } catch (error) {
      console.error('Error reading JWT secret file:', error);
      process.exit(1);
    }
  }
  return process.env.JWT_SECRET || 'your-secret-key';
}

const JWT_SECRET = getJwtSecret();
const ALLOW_NEW_ACCOUNTS = process.env.ALLOW_NEW_ACCOUNTS === 'true';
const TOKEN_EXPIRY = process.env.TOKEN_EXPIRY || '24h';
const DISABLE_ACCOUNTS = process.env.DISABLE_ACCOUNTS === 'true';
const DISABLE_INTERNAL_ACCOUNTS = process.env.DISABLE_INTERNAL_ACCOUNTS === 'true';

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

const authenticateToken = async (req, res, next) => {
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

  // Support both standard Authorization header and custom bytestashauth header
  const authHeader = req.headers['authorization'] || req.headers['bytestashauth'];
  let token;
  
  if (authHeader) {
    // Handle Bearer token format (Authorization: Bearer <token>)
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } 
    // Handle legacy format (bytestashauth: TOKEN <token>)
    else if (authHeader.includes(' ')) {
      token = authHeader.split(' ')[1];
    }
    // Handle direct token (for backwards compatibility)
    else {
      token = authHeader;
    }
  }

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

export { 
  authenticateToken, 
  JWT_SECRET, 
  TOKEN_EXPIRY, 
  ALLOW_NEW_ACCOUNTS, 
  DISABLE_ACCOUNTS,
  DISABLE_INTERNAL_ACCOUNTS,
  getOrCreateAnonymousUser 
};