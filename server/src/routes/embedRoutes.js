import express from 'express';
import shareRepository from '../repositories/shareRepository.js';

const router = express.Router();

router.get('/:shareId', async (req, res) => {
  try {
    const { shareId } = req.params;
    const { showTitle, showDescription, fragmentIndex } = req.query;

    const snippet = await shareRepository.getShare(shareId);
    if (!snippet) {
      return res.status(404).json({ error: 'Snippet not found' });
    }

    if (snippet.share.expired) {
      return res.status(404).json({ error: 'Share link has expired' });
    }

    if (snippet.share.requiresAuth && !req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const embedData = {
      id: snippet.id,
      title: showTitle === 'true' ? snippet.title : undefined,
      description: showDescription === 'true' ? snippet.description : undefined,
      language: snippet.language,
      fragments: fragmentIndex !== undefined ? 
        [snippet.fragments[parseInt(fragmentIndex, 10)]] : 
        snippet.fragments,
      created_at: snippet.created_at,
      updated_at: snippet.updated_at
    };

    res.json(embedData);
  } catch (error) {
    console.error('Error in embed route:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
