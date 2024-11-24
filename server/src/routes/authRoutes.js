import express from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET, TOKEN_EXPIRY, ALLOW_NEW_ACCOUNTS, DISABLE_ACCOUNTS, getOrCreateAnonymousUser } from '../middleware/auth.js';
import userService from '../services/userService.js';
import { getDb } from '../config/database.js';
import { up_v1_5_0_snippets } from '../config/migrations/20241117-migration.js';
import Logger from '../logger.js';

const router = express.Router();

router.get('/config', async (req, res) => {
  try {
    const db = getDb();
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
    const hasUsers = userCount > 0;
    
    res.json({ 
      authRequired: true,
      allowNewAccounts: (!hasUsers || ALLOW_NEW_ACCOUNTS) && !DISABLE_ACCOUNTS,
      hasUsers,
      disableAccounts: DISABLE_ACCOUNTS
    });
  } catch (error) {
    Logger.error('Error getting auth config:', error);
    res.status(500).json({ error: 'Failed to get auth configuration' });
  }
});

router.post('/register', async (req, res) => {
  try {
    const db = getDb();
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
    const hasUsers = userCount > 0;
    
    if (hasUsers && !ALLOW_NEW_ACCOUNTS) {
      return res.status(403).json({ error: 'New account registration is disabled' });
    }

    const { username, password } = req.body;
    const user = await userService.createUser(username, password);
    
    if (!hasUsers) {
      await up_v1_5_0_snippets(db, user.id);
    }
    
    const token = jwt.sign({ 
      id: user.id,
      username: user.username 
    }, JWT_SECRET, 
      TOKEN_EXPIRY ? { expiresIn: TOKEN_EXPIRY } : undefined
    );    

    res.json({ 
      token,
      user: {
        id: user.id,
        username: user.username,
        created_at: user.created_at
      }
    });
  } catch (error) {
    Logger.error('Registration error:', error);
    res.status(400).json({ error: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await userService.validateUser(username, password);

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ 
      id: user.id,
      username: user.username 
    }, JWT_SECRET, 
      TOKEN_EXPIRY ? { expiresIn: TOKEN_EXPIRY } : undefined
    );    

    res.json({ token, user });
  } catch (error) {
    Logger.error('Login error:', error);
    res.status(500).json({ error: 'An error occurred during login' });
  }
});

router.get('/verify', async (req, res) => {
  const authHeader = req.headers['bytestashauth'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ valid: false });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await userService.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({ valid: false });
    }

    res.status(200).json({ 
      valid: true,
      user: {
        id: user.id,
        username: user.username,
        created_at: user.created_at
      }
    });
  } catch (err) {
    res.status(401).json({ valid: false });
  }
});

router.post('/anonymous', async (req, res) => {
  if (!DISABLE_ACCOUNTS) {
    return res.status(403).json({ error: 'Anonymous login not allowed' });
  }

  try {
    const anonymousUser = await getOrCreateAnonymousUser();
    const token = jwt.sign({ 
      id: anonymousUser.id,
      username: anonymousUser.username 
    }, JWT_SECRET, {
      expiresIn: TOKEN_EXPIRY
    });

    res.json({ token, user: anonymousUser });
  } catch (error) {
    Logger.error('Error in anonymous login:', error);
    res.status(500).json({ error: 'Failed to create anonymous session' });
  }
});

export default router;