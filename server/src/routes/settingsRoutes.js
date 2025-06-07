import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { getDb } from '../config/database.js';
import Logger from '../logger.js';
import Anthropic from '@anthropic-ai/sdk';

const router = express.Router();

/**
 * GET /api/v2/ai/config - Get AI configuration
 */
router.get('/config', authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    
    // Get Claude API key from settings
    const setting = await db.prepare('SELECT value FROM settings WHERE key = ?').get('claude_api_key');
    
    res.json({
      success: true,
      apiKey: setting?.value ? '***' + setting.value.slice(-8) : null, // Masked for security
      configured: !!setting?.value
    });
  } catch (error) {
    Logger.error('Error getting AI config:', error);
    res.status(500).json({
      error: 'Failed to get AI configuration',
      message: error.message
    });
  }
});

/**
 * POST /api/v2/ai/config - Save AI configuration
 */
router.post('/config', authenticateToken, async (req, res) => {
  try {
    const { apiKey } = req.body;
    
    if (!apiKey || typeof apiKey !== 'string') {
      return res.status(400).json({
        error: 'Invalid API key',
        message: 'API key must be a non-empty string'
      });
    }

    const db = getDb();
    
    // Save Claude API key to settings
    await db.prepare(`
      INSERT OR REPLACE INTO settings (key, value, updated_at) 
      VALUES (?, ?, ?)
    `).run('claude_api_key', apiKey, new Date().toISOString());
    
    Logger.info('Claude API key updated');
    
    res.json({
      success: true,
      message: 'Claude API key saved successfully'
    });
  } catch (error) {
    Logger.error('Error saving AI config:', error);
    res.status(500).json({
      error: 'Failed to save AI configuration',
      message: error.message
    });
  }
});

/**
 * POST /api/v2/ai/test-key - Test Claude API key
 */
router.post('/test-key', authenticateToken, async (req, res) => {
  try {
    const { apiKey } = req.body;
    
    if (!apiKey || typeof apiKey !== 'string') {
      return res.status(400).json({
        error: 'Invalid API key',
        message: 'API key must be provided'
      });
    }

    // Test the API key by making a simple request to Claude
    const anthropic = new Anthropic({ apiKey });
    
    const testResponse = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 10,
      temperature: 0.1,
      messages: [{
        role: 'user',
        content: 'Say "test" if this API key works.'
      }]
    });

    if (testResponse.content && testResponse.content[0]?.text) {
      res.json({
        success: true,
        message: 'Claude API key is valid',
        model: 'claude-3-5-sonnet-20241022'
      });
    } else {
      res.status(400).json({
        error: 'Invalid API key',
        message: 'API key test failed'
      });
    }
  } catch (error) {
    Logger.error('Error testing Claude API key:', error);
    
    if (error.status === 401) {
      res.status(400).json({
        error: 'Invalid API key',
        message: 'Authentication failed with provided API key'
      });
    } else {
      res.status(500).json({
        error: 'Failed to test API key',
        message: error.message
      });
    }
  }
});

export default router; 