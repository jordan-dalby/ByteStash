import express from 'express';
import snippetService from '../services/snippetService.js';
import Logger from '../logger.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const snippets = await snippetService.getAllPublicSnippets();
    res.json(snippets);
  } catch (error) {
    Logger.error('Error in GET /public/snippets:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Raw public snippet endpoint for plain text access
router.get('/:id/:fragmentId/raw', async (req, res) => {
  try {
    const { id, fragmentId } = req.params;
    const snippet = await snippetService.findById(id);
    if (!snippet) {
      res.status(404).send('Snippet not found');
    } else {
      const fragment = snippet.fragments.find(fragment => fragment.id === parseInt(fragmentId));
      if (!fragment) {
        res.status(404).send('Fragment not found');
      } else {
        res.set('Content-Type', 'text/plain; charset=utf-8');
        res.send(fragment.code);
      }
    }
  } catch (error) {
    Logger.error('Error in GET /public/snippets/:id/raw:', error);
    res.status(500).send('Internal server error');
  }
});

router.get('/:id', async (req, res) => {
  try {
    const snippet = await snippetService.findById(req.params.id);
    if (!snippet) {
      res.status(404).json({ error: 'Snippet not found' });
    } else {
      res.json(snippet);
    }
  } catch (error) {
    Logger.error('Error in GET /public/snippets/:id:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;