import express from 'express';
import multer from 'multer';
import snippetService from '../services/snippetService.js';
import Logger from '../logger.js';
import { authenticateApiKey } from '../middleware/apiKeyAuth.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get('/', authenticateApiKey, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'API key required' });
    }

    const snippets = await snippetService.getAllSnippets(req.user.id);
    res.status(200).json(snippets);
  } catch (error) {
    Logger.error('Error in GET /api/v1/snippets:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', authenticateApiKey, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'API key required' });
    }

    const snippet = await snippetService.findById(req.params.id, req.user.id);
    if (!snippet) {
      res.status(404).json({ error: 'Snippet not found' });
    } else {
      res.status(200).json(snippet);
    }
  } catch (error) {
    Logger.error('Error in GET /api/v1/snippets/:id:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/push', authenticateApiKey, upload.array('files'), async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'API key required' });
    }

    const { title, description, is_public, categories } = req.body;
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
      is_public: is_public === 'true',
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
