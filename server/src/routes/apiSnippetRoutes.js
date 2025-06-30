import express from 'express';
import multer from 'multer';
import snippetService from '../services/snippetService.js';
import Logger from '../logger.js';
import {authenticateApiKey} from '../middleware/apiKeyAuth.js';

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

router.get('/search', authenticateApiKey, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'API key required' });
    }
    const snippets = await snippetService.getAllSnippets(req.user.id)
    const { q, sort, searchCode } = req.query;
    const searchTerm = q || '';
    const filteredSnippets = snippets.filter(snippet => {
        const basicMatch = (
            snippet.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            snippet.description.toLowerCase().includes(searchTerm.toLowerCase())
        );

        const fragmentMatch = snippet.fragments.some(fragment =>
            fragment.file_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (searchCode && fragment.code.toLowerCase().includes(searchTerm.toLowerCase()))
        );

        return (basicMatch || fragmentMatch);
      }).sort((a, b) => {
        switch (sort) {
          case 'newest':
            return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
          case 'oldest':
            return new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
          case 'alpha-asc':
            return a.title.localeCompare(b.title);
          case 'alpha-desc':
            return b.title.localeCompare(a.title);
          default:
            return 0;
        }
      });
    res.status(200).json(filteredSnippets);
  } catch (error) {
    Logger.error('Error in GET /api/v1/snippets/search:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
})

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

    const error = validateSnippetData(req);
    if (error) {
      return res.status(error.status).json({ error: error.error });
    }

    const snippetData = extractSnippetData(req);

    const newSnippet = await snippetService.createSnippet(snippetData, req.user.id);
    res.status(201).json(newSnippet);
  } catch (error) {
    Logger.error('Error in POST /api/snippets/push:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', authenticateApiKey, upload.array('files'), async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'API key required' });
    }

    const error = validateSnippetData(req);
    if (error) {
      return res.status(error.status).json({ error: error.error });
    }

    const id = req.params.id;
    const snippetData = extractSnippetData(req);
    const updatedSnippet = await snippetService.updateSnippet(id, snippetData, req.user.id);
    if (!updatedSnippet) {
      return res.status(404).json({ error: 'Snippet not found' });
    } else {
      res.status(200).json(updatedSnippet);
    }
  } catch (error) {
    Logger.error('Error in PUT /api/v1/snippets/:id:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
})

router.delete('/:id', authenticateApiKey, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({error: 'API key required'});
    }
    const id = req.params.id;
    const result = await snippetService.deleteSnippet(id, req.user.id);
    if (!result) {
      res.status(404).json({ error: 'Snippet not found' });
    } else {
      res.json({ id: result.id });
    }
  } catch (error) {
    Logger.error('Error in DELETE /api/v1/snippets/:id:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const validateSnippetData = (req) => {
  const files = req.files || [];
  const { fragments } = req.body;
  
  if (files.length === 0 && !fragments) {
    return { error: 'At least one fragment is required. Provide either files or JSON fragments.', status: 400 };
  }
  
  if (fragments) {
    try {
      const parsedFragments = JSON.parse(fragments);
      if (!Array.isArray(parsedFragments)) {
        return { error: 'Fragments must be an array', status: 400 };
      }
    } catch (e) {
      return { error: 'Invalid JSON format for fragments', status: 400 };
    }
  }
  
  return null;
};

const extractSnippetData = (req) => {
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
      const jsonFragments = JSON.parse(fragmentsField);
      fragments.push(...jsonFragments.map((fragment, index) => ({
          file_name: fragment.file_name || `fragment${fragments.length + index + 1}`,
          code: fragment.code || '',
          language: fragment.language || 'plaintext',
          position: fragments.length + index
      })));
  }

  const parsedCategories = categories ? categories.split(',').map(c => c.trim()) : [];

  return {
    title: title || 'Untitled Snippet',
    description: description || '',
    is_public: is_public === 'true',
    categories: parsedCategories,
    fragments
  };
}

export default router;