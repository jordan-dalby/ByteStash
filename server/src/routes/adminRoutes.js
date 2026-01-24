import express from 'express';
import adminRepository from '../repositories/adminRepository.js';
import badWordsChecker from '../utils/badWords.js';
import Logger from '../logger.js';

const router = express.Router();

// Dashboard stats
router.get('/stats', async (req, res) => {
  try {
    const stats = await adminRepository.getStats();
    res.json(stats);
  } catch (error) {
    Logger.error('Error getting admin stats:', error);
    res.status(500).json({ message: 'Failed to retrieve statistics' });
  }
});

// User management
router.get('/users', async (req, res) => {
  try {
    const { offset = 0, limit = 50, search = '', authType = '', isActive = '' } = req.query;
    const result = await adminRepository.getAllUsers({
      offset: parseInt(offset),
      limit: parseInt(limit),
      search,
      authType,
      isActive
    });
    res.json(result);
  } catch (error) {
    Logger.error('Error getting users:', error);
    res.status(500).json({ message: 'Failed to retrieve users' });
  }
});

router.get('/users/:id', async (req, res) => {
  try {
    const user = await adminRepository.getUserDetails(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    Logger.error('Error getting user details:', error);
    res.status(500).json({ message: 'Failed to retrieve user details' });
  }
});

router.delete('/users/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    if (userId === req.user.id) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    if (userId === 0) {
      return res.status(400).json({ message: 'Cannot delete anonymous user' });
    }

    const deleted = await adminRepository.deleteUser(userId);
    if (!deleted) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    Logger.error('Error deleting user:', error);
    res.status(500).json({ message: 'Failed to delete user' });
  }
});

router.patch('/users/:id/toggle-active', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    if (userId === req.user.id) {
      return res.status(400).json({ message: 'Cannot modify your own active status' });
    }

    if (userId === 0) {
      return res.status(400).json({ message: 'Cannot modify anonymous user' });
    }

    const user = await adminRepository.toggleUserActive(userId);
    res.json(user);
  } catch (error) {
    Logger.error('Error toggling user active status:', error);
    res.status(500).json({ message: 'Failed to update user status' });
  }
});

// Snippet management
router.get('/snippets', async (req, res) => {
  try {
    const { offset = 0, limit = 50, search = '', userId = '', isPublic = '', language = '', category = '' } = req.query;
    const result = await adminRepository.getAllSnippets({
      offset: parseInt(offset),
      limit: parseInt(limit),
      search,
      userId,
      isPublic,
      language,
      category
    });
    res.json(result);
  } catch (error) {
    Logger.error('Error getting snippets:', error);
    res.status(500).json({ message: 'Failed to retrieve snippets' });
  }
});

router.delete('/snippets/:id', async (req, res) => {
  try {
    const deleted = await adminRepository.deleteSnippetPermanently(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Snippet not found' });
    }
    res.json({ message: 'Snippet deleted successfully' });
  } catch (error) {
    Logger.error('Error deleting snippet:', error);
    res.status(500).json({ message: 'Failed to delete snippet' });
  }
});

router.patch('/snippets/:id/owner', async (req, res) => {
  try {
    const { newUserId } = req.body;

    if (!newUserId) {
      return res.status(400).json({ message: 'newUserId is required' });
    }

    await adminRepository.changeSnippetOwner(req.params.id, newUserId);
    res.json({ message: 'Snippet owner changed successfully' });
  } catch (error) {
    Logger.error('Error changing snippet owner:', error);
    res.status(500).json({ message: 'Failed to change snippet owner' });
  }
});

router.patch('/snippets/:id/toggle-public', async (req, res) => {
  try {
    await adminRepository.toggleSnippetPublic(req.params.id);
    res.json({ message: 'Snippet visibility toggled successfully' });
  } catch (error) {
    Logger.error('Error toggling snippet public status:', error);
    res.status(500).json({ message: 'Failed to toggle snippet visibility' });
  }
});

router.get('/snippets/scan/offensive', async (req, res) => {
  try {
    const result = await adminRepository.scanSnippetsForOffensiveContent(badWordsChecker);
    res.json(result);
  } catch (error) {
    Logger.error('Error scanning snippets for offensive content:', error);
    res.status(500).json({ message: 'Failed to scan snippets for offensive content' });
  }
});

// API Key management
router.get('/api-keys', async (req, res) => {
  try {
    const { offset = 0, limit = 50, userId = '' } = req.query;
    const result = await adminRepository.getAllApiKeys({
      offset: parseInt(offset),
      limit: parseInt(limit),
      userId
    });
    res.json(result);
  } catch (error) {
    Logger.error('Error getting API keys:', error);
    res.status(500).json({ message: 'Failed to retrieve API keys' });
  }
});

router.delete('/api-keys/:id', async (req, res) => {
  try {
    const deleted = await adminRepository.deleteApiKey(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'API key not found' });
    }
    res.json({ message: 'API key deleted successfully' });
  } catch (error) {
    Logger.error('Error deleting API key:', error);
    res.status(500).json({ message: 'Failed to delete API key' });
  }
});

// Share management
router.get('/shares', async (req, res) => {
  try {
    const { offset = 0, limit = 50, userId = '', requiresAuth = '' } = req.query;
    const result = await adminRepository.getAllShares({
      offset: parseInt(offset),
      limit: parseInt(limit),
      userId,
      requiresAuth
    });
    res.json(result);
  } catch (error) {
    Logger.error('Error getting shares:', error);
    res.status(500).json({ message: 'Failed to retrieve shares' });
  }
});

router.delete('/shares/:id', async (req, res) => {
  try {
    const deleted = await adminRepository.deleteShare(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Share not found' });
    }
    res.json({ message: 'Share deleted successfully' });
  } catch (error) {
    Logger.error('Error deleting share:', error);
    res.status(500).json({ message: 'Failed to delete share' });
  }
});

export default router;
