import express from 'express';
import multer from 'multer';
import snippetService from '../services/snippetService.js';
import Logger from '../logger.js';
import { authenticateApiKey } from '../middleware/apiKeyAuth.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/push', authenticateApiKey, upload.array('files'), async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'API key required' });
    }

    const { title, description, isPublic, categories } = req.body;
    const files = req.files || [];
    let fragments = [];

    if (files.length > 0) {
      fragments = files.map((file, index) => ({
        file_name: file.originalname,
        code: file.buffer.toString('utf-8'),
        language: file.originalname.split('.').pop() || 'plaintext',
        position: index
      }));
    }

    const fragmentsField = req.body.fragments;
    if (fragmentsField && typeof fragmentsField === 'string') {
      try {
        const jsonFragments = JSON.parse(fragmentsField);
        if (Array.isArray(jsonFragments)) {
          fragments.push(...jsonFragments.map((fragment, index) => ({
            file_name: fragment.file_name || `fragment${fragments.length + index + 1}`,
            code: fragment.code || '',
            language: fragment.language || 'plaintext',
            position: fragments.length + index
          })));
        } else {
          return res.status(400).json({ error: 'Fragments must be an array' });
        }
      } catch (error) {
        Logger.error('Error parsing JSON fragments:', error);
        return res.status(400).json({ error: 'Invalid JSON fragments format' });
      }
    }

    if (fragments.length === 0) {
      return res.status(400).json({ 
        error: 'At least one fragment is required. Provide either files or JSON fragments.' 
      });
    }

    const parsedCategories = categories ? categories.split(',').map(c => c.trim()) : [];

    const snippetData = {
      title: title || 'Untitled Snippet',
      description: description || '',
      isPublic: isPublic === 'true',
      categories: parsedCategories,
      fragments
    };

    const newSnippet = await snippetService.createSnippet(snippetData, req.user.id);
    res.status(201).json(newSnippet);
  } catch (error) {
    Logger.error('Error in POST /api/snippets/push:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
