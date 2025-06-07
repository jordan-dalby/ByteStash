import express from 'express';
import snippetService from '../services/snippetService.js';
import Logger from '../logger.js';
import { authenticateApiKey } from '../middleware/apiKeyAuth.js';

const router = express.Router();

// Error response helper
const errorResponse = (res, status, error, message, code = null, details = null) => {
  const response = { error, message };
  if (code) response.code = code;
  if (details) response.details = details;
  return res.status(status).json(response);
};

// Validation helper
const validateSnippetData = (data) => {
  const errors = [];
  
  if (!data.title || typeof data.title !== 'string' || data.title.trim().length === 0) {
    errors.push({ field: 'title', reason: 'Title is required and must be a non-empty string' });
  }
  
  if (!data.fragments || !Array.isArray(data.fragments) || data.fragments.length === 0) {
    errors.push({ field: 'fragments', reason: 'At least one fragment is required' });
  } else {
    data.fragments.forEach((fragment, index) => {
      if (!fragment.code || typeof fragment.code !== 'string') {
        errors.push({ field: `fragments[${index}].code`, reason: 'Fragment code is required' });
      }
      if (!fragment.file_name || typeof fragment.file_name !== 'string') {
        errors.push({ field: `fragments[${index}].file_name`, reason: 'Fragment file_name is required' });
      }
    });
  }
  
  return errors;
};

// GET /api/v2/snippets - List all snippets
router.get('/', authenticateApiKey, async (req, res) => {
  try {
    if (!req.user) {
      return errorResponse(res, 401, 'Authentication required', 'Valid API key required', 'AUTH_ERROR');
    }

    const snippets = await snippetService.getAllSnippets(req.user.id);
    res.status(200).json({
      success: true,
      data: snippets,
      count: snippets.length
    });
  } catch (error) {
    Logger.error('Error in GET /api/v2/snippets:', error);
    errorResponse(res, 500, 'Internal server error', 'An unexpected error occurred', 'INTERNAL_ERROR');
  }
});

// GET /api/v2/snippets/:id - Get single snippet
router.get('/:id', authenticateApiKey, async (req, res) => {
  try {
    if (!req.user) {
      return errorResponse(res, 401, 'Authentication required', 'Valid API key required', 'AUTH_ERROR');
    }

    const snippet = await snippetService.findById(req.params.id, req.user.id);
    if (!snippet) {
      return errorResponse(res, 404, 'Snippet not found', `Snippet with ID ${req.params.id} not found`, 'NOT_FOUND');
    }
    
    res.status(200).json({
      success: true,
      data: snippet
    });
  } catch (error) {
    Logger.error('Error in GET /api/v2/snippets/:id:', error);
    errorResponse(res, 500, 'Internal server error', 'An unexpected error occurred', 'INTERNAL_ERROR');
  }
});

// POST /api/v2/snippets - Create new snippet
router.post('/', authenticateApiKey, async (req, res) => {
  try {
    if (!req.user) {
      return errorResponse(res, 401, 'Authentication required', 'Valid API key required', 'AUTH_ERROR');
    }

    // Validate request body
    const validationErrors = validateSnippetData(req.body);
    if (validationErrors.length > 0) {
      return errorResponse(res, 400, 'Validation failed', 'Request data is invalid', 'VALIDATION_ERROR', {
        errors: validationErrors
      });
    }

    // Extract and process data
    const {
      title,
      description = '',
      categories = [],
      isPublic = false,
      locked = false,
      fragments
    } = req.body;

    // Process fragments to ensure they have all required fields
    const processedFragments = fragments.map((fragment, index) => ({
      file_name: fragment.file_name,
      code: fragment.code,
      language: fragment.language || 'plaintext',
      position: fragment.position !== undefined ? fragment.position : index
    }));

    const snippetData = {
      title: title.trim(),
      description: description.trim(),
      categories: Array.isArray(categories) ? categories : [],
      isPublic: Boolean(isPublic),
      locked: Boolean(locked),
      fragments: processedFragments
    };

    const newSnippet = await snippetService.createSnippet(snippetData, req.user.id);
    
    res.status(201).json({
      success: true,
      message: 'Snippet created successfully',
      data: newSnippet
    });
  } catch (error) {
    Logger.error('Error in POST /api/v2/snippets:', error);
    errorResponse(res, 500, 'Internal server error', 'Failed to create snippet', 'INTERNAL_ERROR');
  }
});

// PUT /api/v2/snippets/:id - Update entire snippet
router.put('/:id', authenticateApiKey, async (req, res) => {
  try {
    if (!req.user) {
      return errorResponse(res, 401, 'Authentication required', 'Valid API key required', 'AUTH_ERROR');
    }

    // Validate request body
    const validationErrors = validateSnippetData(req.body);
    if (validationErrors.length > 0) {
      return errorResponse(res, 400, 'Validation failed', 'Request data is invalid', 'VALIDATION_ERROR', {
        errors: validationErrors
      });
    }

    // Extract and process data
    const {
      title,
      description = '',
      categories = [],
      isPublic = false,
      locked = false,
      fragments
    } = req.body;

    // Process fragments
    const processedFragments = fragments.map((fragment, index) => ({
      file_name: fragment.file_name,
      code: fragment.code,
      language: fragment.language || 'plaintext',
      position: fragment.position !== undefined ? fragment.position : index
    }));

    const snippetData = {
      title: title.trim(),
      description: description.trim(),
      categories: Array.isArray(categories) ? categories : [],
      isPublic: Boolean(isPublic),
      locked: Boolean(locked),
      fragments: processedFragments
    };

    const updatedSnippet = await snippetService.updateSnippet(req.params.id, snippetData, req.user.id);
    
    if (!updatedSnippet) {
      return errorResponse(res, 404, 'Snippet not found', `Snippet with ID ${req.params.id} not found`, 'NOT_FOUND');
    }
    
    res.status(200).json({
      success: true,
      message: 'Snippet updated successfully',
      data: updatedSnippet
    });
  } catch (error) {
    Logger.error('Error in PUT /api/v2/snippets/:id:', error);
    errorResponse(res, 500, 'Internal server error', 'Failed to update snippet', 'INTERNAL_ERROR');
  }
});

// DELETE /api/v2/snippets/:id - Delete snippet
router.delete('/:id', authenticateApiKey, async (req, res) => {
  try {
    if (!req.user) {
      return errorResponse(res, 401, 'Authentication required', 'Valid API key required', 'AUTH_ERROR');
    }

    const deletedSnippet = await snippetService.deleteSnippet(req.params.id, req.user.id);
    
    if (!deletedSnippet) {
      return errorResponse(res, 404, 'Snippet not found', `Snippet with ID ${req.params.id} not found`, 'NOT_FOUND');
    }
    
    res.status(200).json({
      success: true,
      message: 'Snippet deleted successfully',
      data: { id: deletedSnippet.id }
    });
  } catch (error) {
    Logger.error('Error in DELETE /api/v2/snippets/:id:', error);
    errorResponse(res, 500, 'Internal server error', 'Failed to delete snippet', 'INTERNAL_ERROR');
  }
});

// PATCH /api/v2/snippets/:id - Partial update
router.patch('/:id', authenticateApiKey, async (req, res) => {
  try {
    if (!req.user) {
      return errorResponse(res, 401, 'Authentication required', 'Valid API key required', 'AUTH_ERROR');
    }

    // For PATCH, we only validate provided fields
    const allowedFields = ['title', 'description', 'categories', 'isPublic', 'locked', 'fragments'];
    const updateData = {};
    
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return errorResponse(res, 400, 'No fields to update', 'At least one field must be provided for update', 'VALIDATION_ERROR');
    }

    // Validate fragments if provided
    if (updateData.fragments) {
      if (!Array.isArray(updateData.fragments) || updateData.fragments.length === 0) {
        return errorResponse(res, 400, 'Invalid fragments', 'Fragments must be a non-empty array', 'VALIDATION_ERROR');
      }
      
      // Process fragments
      updateData.fragments = updateData.fragments.map((fragment, index) => ({
        file_name: fragment.file_name,
        code: fragment.code,
        language: fragment.language || 'plaintext',
        position: fragment.position !== undefined ? fragment.position : index
      }));
    }

    // Get current snippet first
    const currentSnippet = await snippetService.findById(req.params.id, req.user.id);
    if (!currentSnippet) {
      return errorResponse(res, 404, 'Snippet not found', `Snippet with ID ${req.params.id} not found`, 'NOT_FOUND');
    }

    // Merge with current data
    const mergedData = {
      title: updateData.title !== undefined ? updateData.title : currentSnippet.title,
      description: updateData.description !== undefined ? updateData.description : currentSnippet.description,
      categories: updateData.categories !== undefined ? updateData.categories : currentSnippet.categories,
      isPublic: updateData.isPublic !== undefined ? updateData.isPublic : currentSnippet.is_public,
      locked: updateData.locked !== undefined ? updateData.locked : currentSnippet.locked,
      fragments: updateData.fragments !== undefined ? updateData.fragments : currentSnippet.fragments
    };

    const updatedSnippet = await snippetService.updateSnippet(req.params.id, mergedData, req.user.id);
    
    res.status(200).json({
      success: true,
      message: 'Snippet updated successfully',
      data: updatedSnippet
    });
  } catch (error) {
    Logger.error('Error in PATCH /api/v2/snippets/:id:', error);
    errorResponse(res, 500, 'Internal server error', 'Failed to update snippet', 'INTERNAL_ERROR');
  }
});

export default router; 