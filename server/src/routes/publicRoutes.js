import express from 'express';
import snippetService from '../services/snippetService.js';
import Logger from '../logger.js';

const router = express.Router();

// Query parameter parser
function parseQueryParams(query) {
  const DEFAULT_LIMIT = 50;
  const MAX_LIMIT = 100;

  let limit = parseInt(query.limit) || DEFAULT_LIMIT;
  let offset = parseInt(query.offset) || 0;

  if (limit < 1) limit = DEFAULT_LIMIT;
  if (limit > MAX_LIMIT) limit = MAX_LIMIT;
  if (offset < 0) offset = 0;

  const categories = query.category
    ? query.category.split(',').map(c => c.trim().toLowerCase())
    : null;

  return {
    limit,
    offset,
    filters: {
      search: query.search || null,
      searchCode: query.searchCode === 'true',
      language: query.language || null,
      categories,
      favorites: query.favorites === 'true',
      pinned: query.pinned === 'true',
      recycled: query.recycled === 'true',
    },
    sort: query.sort || 'newest',
  };
}

router.get('/', async (req, res) => {
  try {
    const { limit, offset, filters, sort } = parseQueryParams(req.query);

    const { snippets, total } = await snippetService.getSnippetsPaginated({
      userId: null,  // null = public only
      filters,
      sort,
      limit,
      offset
    });

    res.json({
      data: snippets,
      pagination: {
        total,
        offset,
        limit,
        hasMore: offset + limit < total
      }
    });
  } catch (error) {
    Logger.error('Error fetching public snippets:', error);
    res.status(500).json({ error: 'Failed to fetch public snippets' });
  }
});

router.get('/metadata', async (req, res) => {
  try {
    const metadata = await snippetService.getMetadata(null);
    res.json(metadata);
  } catch (error) {
    Logger.error('Error fetching public metadata:', error);
    res.status(500).json({ error: 'Failed to fetch metadata' });
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
        // Remove carriage returns to fix bash script execution issues
        const normalizedCode = fragment.code.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
        res.send(normalizedCode);
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