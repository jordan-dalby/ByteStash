import express from "express";
import snippetService from "../services/snippetService.js";
import Logger from "../logger.js";

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

// GET all snippets (with pagination and filtering)
router.get("/", async (req, res) => {
  try {
    const { limit, offset, filters, sort } = parseQueryParams(req.query);

    const { snippets, total } = await snippetService.getSnippetsPaginated({
      userId: req.user.id,
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
    Logger.error("Error fetching snippets:", error);
    res.status(500).json({ error: "Failed to fetch snippets" });
  }
});

router.post("/", async (req, res) => {
  try {
    const newSnippet = await snippetService.createSnippet(
      req.body,
      req.user.id
    );
    res.status(201).json(newSnippet);
  } catch (error) {
    Logger.error("Error in POST /snippets:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const result = await snippetService.deleteSnippet(
      req.params.id,
      req.user.id
    );
    if (!result) {
      res.status(404).json({ error: "Snippet not found" });
    } else {
      res.json({ id: result.id });
    }
  } catch (error) {
    Logger.error("Error in DELETE /snippets/:id:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/:id/restore", async (req, res) => {
  try {
    const result = await snippetService.restoreSnippet(
      req.params.id,
      req.user.id
    );
    if (!result) {
      res
        .status(404)
        .json({ error: "Snippet not found or not in recycle bin" });
    } else {
      res.json({ id: result.id });
    }
  } catch (error) {
    Logger.error("Error in PATCH /snippets/:id/restore:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/:id/recycle", async (req, res) => {
  try {
    const result = await snippetService.moveToRecycle(
      req.params.id,
      req.user.id
    );
    if (!result) {
      res
        .status(404)
        .json({ error: "Snippet not found or already moved to recycle bin" });
    } else {
      res.json({ id: result.id });
    }
  } catch (error) {
    Logger.error("Error in POST /snippets/:id/recycle:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET metadata
router.get("/metadata", async (req, res) => {
  try {
    const metadata = await snippetService.getMetadata(req.user.id);
    res.json(metadata);
  } catch (error) {
    Logger.error("Error fetching metadata:", error);
    res.status(500).json({ error: "Failed to fetch metadata" });
  }
});

// Removed /recycled route - use ?recycled=true instead

router.put("/:id", async (req, res) => {
  try {
    const updatedSnippet = await snippetService.updateSnippet(
      req.params.id,
      req.body,
      req.user.id
    );

    if (!updatedSnippet) {
      res.status(404).json({ error: "Snippet not found" });
    } else {
      res.json(updatedSnippet);
    }
  } catch (error) {
    Logger.error("Error in PUT /snippets/:id:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Raw snippet endpoint for plain text access
router.get("/:id/:fragmentId/raw", async (req, res) => {
  try {
    const { id, fragmentId } = req.params;
    const snippet = await snippetService.findById(id, req.user.id);
    if (!snippet) {
      res.status(404).send("Snippet not found");
    } else {
      const fragment = snippet.fragments.find(
        (fragment) => fragment.id === parseInt(fragmentId)
      );
      if (!fragment) {
        res.status(404).send("Fragment not found");
      } else {
        res.set("Content-Type", "text/plain; charset=utf-8");
        // Remove carriage returns to fix bash script execution issues
        const normalizedCode = fragment.code.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
        res.send(normalizedCode);
      }
    }
  } catch (error) {
    Logger.error("Error in GET /snippets/:id/raw:", error);
    res.status(500).send("Internal server error");
  }
});

router.get("/:id", async (req, res) => {
  try {
    const snippet = await snippetService.findById(req.params.id, req.user.id);
    if (!snippet) {
      res.status(404).json({ error: "Snippet not found" });
    } else {
      res.json(snippet);
    }
  } catch (error) {
    Logger.error("Error in GET /snippets/:id:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Pin/unpin snippet
router.patch("/:id/pin", async (req, res) => {
  try {
    const { is_pinned } = req.body;
    const result = await snippetService.setPinned(
      req.params.id,
      is_pinned,
      req.user.id
    );
    if (!result) {
      res.status(404).json({ error: "Snippet not found" });
    } else {
      res.json(result);
    }
  } catch (error) {
    Logger.error("Error in PATCH /snippets/:id/pin:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Favorite/unfavorite snippet
router.patch("/:id/favorite", async (req, res) => {
  try {
    const { is_favorite } = req.body;
    const result = await snippetService.setFavorite(
      req.params.id,
      is_favorite,
      req.user.id
    );
    if (!result) {
      res.status(404).json({ error: "Snippet not found" });
    } else {
      res.json(result);
    }
  } catch (error) {
    Logger.error("Error in PATCH /snippets/:id/favorite:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
