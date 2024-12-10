import express from 'express';
import { createApiKey, getApiKeys, deleteApiKey } from '../repositories/apiKeyRepository.js';
import Logger from '../logger.js';

const router = express.Router();

// List all API keys for the authenticated user
router.get('/', async (req, res) => {
  try {
    const keys = getApiKeys(req.user.id);
    res.json(keys);
  } catch (error) {
    Logger.error('Error fetching API keys:', error);
    res.status(500).json({ error: 'Failed to fetch API keys' });
  }
});

// Create a new API key
router.post('/', async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }
    
    const apiKey = createApiKey(req.user.id, name);
    
    if (!apiKey) {
      return res.status(500).json({ error: 'Failed to create API key' });
    }
    
    Logger.debug(`User ${req.user.id} created new API key`);
    res.status(201).json(apiKey);
  } catch (error) {
    Logger.error('Error creating API key:', error);
    res.status(500).json({ error: 'Failed to create API key' });
  }
});

// Delete an API key
router.delete('/:id', async (req, res) => {
  try {
    const success = deleteApiKey(req.user.id, req.params.id);
    
    if (!success) {
      return res.status(404).json({ error: 'API key not found' });
    }
    
    Logger.debug(`User ${req.user.id} deleted API key ${req.params.id}`);
    res.json({ sucess: success });
  } catch (error) {
    Logger.error('Error deleting API key:', error);
    res.status(500).json({ error: 'Failed to delete API key' });
  }
});

export default router;
