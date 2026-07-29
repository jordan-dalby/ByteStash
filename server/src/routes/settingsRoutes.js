import express from 'express';
import {
  getUserSettings,
  mergeUserSettings,
  deleteUserSettings,
} from '../repositories/userSettingsRepository.js';
import { validateUserSettings } from '../config/userSettingsSchema.js';
import Logger from '../logger.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const result = getUserSettings(req.user.id);
    res.json(result);
  } catch (error) {
    Logger.error('Error fetching user settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

router.patch('/', async (req, res) => {
  try {
    const incoming = req.body?.settings ?? req.body;
    const { settings, invalidKeys } = validateUserSettings(incoming);

    if (invalidKeys.length > 0) {
      return res.status(400).json({
        error: `Invalid value for setting(s): ${invalidKeys.join(', ')}`,
      });
    }

    if (Object.keys(settings).length === 0) {
      return res.json(getUserSettings(req.user.id));
    }

    const result = mergeUserSettings(req.user.id, settings);
    res.json(result);
  } catch (error) {
    Logger.error('Error updating user settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

router.delete('/', async (req, res) => {
  try {
    deleteUserSettings(req.user.id);
    res.json({ settings: {}, updatedAt: null });
  } catch (error) {
    Logger.error('Error resetting user settings:', error);
    res.status(500).json({ error: 'Failed to reset settings' });
  }
});

export default router;
