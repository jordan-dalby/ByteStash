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
router.get('/:id/raw', async (req, res) => {
  try {
    const snippet = await snippetService.findById(req.params.id);
    if (!snippet) {
      res.status(404).send('Snippet not found');
    } else {
      // Join all fragment code with newlines
      const content = snippet.fragments.map(fragment => fragment.code).join('\n\n');
      res.set('Content-Type', 'text/plain; charset=utf-8');
      res.send(content);
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