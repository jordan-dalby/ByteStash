import express from 'express';
import snippetService from '../services/snippetService.js';
import Logger from '../logger.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const snippets = await snippetService.getAllSnippets(req.user.id);
    res.json(snippets);
  } catch (error) {
    Logger.error('Error in GET /snippets:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const newSnippet = await snippetService.createSnippet(req.body, req.user.id);
    res.status(201).json(newSnippet);
  } catch (error) {
    Logger.error('Error in POST /snippets:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await snippetService.deleteSnippet(req.params.id, req.user.id);
    if (!result) {
      res.status(404).json({ error: 'Snippet not found' });
    } else {
      res.json({ id: result.id });
    }
  } catch (error) {
    Logger.error('Error in DELETE /snippets/:id:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/:id/restore',async (req, res) => {
  try{
    const result = await snippetService.restoreSnippet(req.params.id, req.user.id);
    if (!result) {
      res.status(404).json({ error: 'Snippet not found or not in recycle bin' });
    } else {
      res.json({ id: result.id });
    }
  } catch (error){
    Logger.error('Error in PATCH /snippets/:id/restore:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/:id/recycle', async (req, res) => {
  try {
    const result = await snippetService.moveToRecycle(req.params.id, req.user.id);
    if (!result) {
      res.status(404).json({ error: 'Snippet not found or already moved to recycle bin' });
    } else {
      res.json({ id: result.id });
    }
  } catch (error) {
    Logger.error('Error in POST /snippets/:id/recycle:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/recycled', async (req, res) => {
  try {
    const recycledSnippets = await snippetService.getRecycledSnippets(req.user.id);
    res.json(recycledSnippets);
  } catch (error) {
    Logger.error('Error in GET /snippets/recycled:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const updatedSnippet = await snippetService.updateSnippet(
      req.params.id, 
      req.body, 
      req.user.id
    );
    
    if (!updatedSnippet) {
      res.status(404).json({ error: 'Snippet not found' });
    } else {
      res.json(updatedSnippet);
    }
  } catch (error) {
    Logger.error('Error in PUT /snippets/:id:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Raw snippet endpoint for plain text access
router.get('/:id/:fragmentId/raw', async (req, res) => {
  try {
    const { id, fragmentId } = req.params;
    const snippet = await snippetService.findById(id, req.user.id);
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
    Logger.error('Error in GET /snippets/:id/raw:', error);
    res.status(500).send('Internal server error');
  }
});

router.get('/:id', async (req, res) => {
  try {
    const snippet = await snippetService.findById(req.params.id, req.user.id);
    if (!snippet) {
      res.status(404).json({ error: 'Snippet not found' });
    } else {
      res.json(snippet);
    }
  } catch (error) {
    Logger.error('Error in GET /snippets/:id:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;