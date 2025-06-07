import express from 'express';
import AIAnalysisService from '../services/aiAnalysisService.js';
import { authenticateToken } from '../middleware/auth.js';
import { getDb } from '../config/database.js';

const router = express.Router();
const aiService = new AIAnalysisService();

/**
 * POST /api/v2/ai/analyze-commands
 * Analyze terminal commands using AI
 */
router.post('/analyze-commands', authenticateToken, async (req, res) => {
  try {
    const { commands, options = {} } = req.body;
    const userId = req.user.id;

    // Validate input
    if (!commands || (!Array.isArray(commands) && typeof commands !== 'string')) {
      return res.status(400).json({
        error: 'Invalid input',
        message: 'Commands must be provided as array or string',
        code: 'VALIDATION_ERROR'
      });
    }

    // Convert string to array if needed
    const commandArray = Array.isArray(commands) ? commands : [commands];
    
    if (commandArray.length === 0) {
      return res.status(400).json({
        error: 'No commands provided',
        message: 'At least one command is required for analysis',
        code: 'VALIDATION_ERROR'
      });
    }

    console.log(`🔍 Starting AI analysis for user ${userId} with ${commandArray.length} commands`);

    // Check command cache first
    const commandHash = aiService.generateCommandHash(commandArray.join('|'));
    const db = getDb();
    const cachedResult = await db.prepare(
      'SELECT * FROM command_analysis_cache WHERE command_hash = ?'
    ).get(commandHash);

    if (cachedResult) {
      console.log('📦 Using cached analysis result');
      
      // Update cache hit count
      await db.prepare(
        'UPDATE command_analysis_cache SET hits = hits + 1, last_hit = ? WHERE command_hash = ?'
      ).run(new Date().toISOString(), commandHash);

      return res.json({
        success: true,
        cached: true,
        analysis: JSON.parse(cachedResult.analysis_result),
        message: 'Analysis retrieved from cache'
      });
    }

    // Create analysis record
    const analysisId = aiService.generateAnalysisId();
    
    await db.prepare(`
      INSERT INTO ai_analyses (id, user_id, commands, status, created_at)
      VALUES (?, ?, ?, 'processing', ?)
    `).run(analysisId, userId, JSON.stringify(commandArray), new Date().toISOString());

    // Perform AI analysis
    const analysisResult = await aiService.analyzeCommands(commandArray, options);

    // Update analysis record with results
    await db.prepare(`
      UPDATE ai_analyses 
      SET status = ?, analysis_result = ?, generated_snippets = ?, tokens_used = ?, 
          cost_usd = ?, completed_at = ?
      WHERE id = ?
    `).run(
      analysisResult.success ? 'completed' : 'failed',
      JSON.stringify(analysisResult),
      analysisResult.validSnippets.length,
      analysisResult.tokensUsed.total,
      analysisResult.costEstimate.total,
      new Date().toISOString(),
      analysisId
    );

    // Record usage statistics
    await db.prepare(`
      INSERT INTO ai_usage (user_id, analysis_id, tokens_input, tokens_output, cost_usd, model_used, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      userId,
      analysisId,
      analysisResult.tokensUsed.input,
      analysisResult.tokensUsed.output,
      analysisResult.costEstimate.total,
      analysisResult.model,
      new Date().toISOString()
    );

    // Cache successful results
    if (analysisResult.success) {
      await db.prepare(`
        INSERT OR REPLACE INTO command_analysis_cache 
        (command_hash, command_text, analysis_result, created_at, hits, last_hit)
        VALUES (?, ?, ?, ?, 1, ?)
      `).run(
        commandHash,
        commandArray.join('\n'),
        JSON.stringify(analysisResult),
        new Date().toISOString(),
        new Date().toISOString()
      );
    }

    console.log(`✅ AI analysis completed for user ${userId}`);
    console.log(`📊 Generated ${analysisResult.validSnippets.length} snippets`);
    console.log(`💰 Cost: $${analysisResult.costEstimate.total.toFixed(4)}`);

    res.json({
      success: true,
      cached: false,
      analysisId,
      analysis: analysisResult,
      snippets: analysisResult.validSnippets,
      message: `Successfully analyzed ${commandArray.length} commands`
    });

  } catch (error) {
    console.error('❌ AI analysis failed:', error);

    // Update analysis record with error
    if (req.body.analysisId) {
      const db = getDb();
      await db.prepare(`
        UPDATE ai_analyses 
        SET status = 'failed', error_message = ?, completed_at = ?
        WHERE id = ?
      `).run(error.message, new Date().toISOString(), req.body.analysisId);
    }

    res.status(500).json({
      error: 'AI analysis failed',
      message: error.message,
      code: 'AI_ERROR'
    });
  }
});

/**
 * GET /api/v2/ai/analysis/:id
 * Get analysis status and results
 */
router.get('/analysis/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const db = getDb();

    const analysis = await db.prepare(`
      SELECT * FROM ai_analyses 
      WHERE id = ? AND user_id = ?
    `).get(id, userId);

    if (!analysis) {
      return res.status(404).json({
        error: 'Analysis not found',
        message: 'Analysis ID not found or access denied',
        code: 'NOT_FOUND'
      });
    }

    const response = {
      id: analysis.id,
      status: analysis.status,
      commands: JSON.parse(analysis.commands),
      generatedSnippets: analysis.generated_snippets,
      tokensUsed: analysis.tokens_used,
      costUsd: analysis.cost_usd,
      createdAt: analysis.created_at,
      completedAt: analysis.completed_at
    };

    if (analysis.analysis_result) {
      response.result = JSON.parse(analysis.analysis_result);
    }

    if (analysis.error_message) {
      response.error = analysis.error_message;
    }

    res.json({
      success: true,
      analysis: response
    });

  } catch (error) {
    console.error('❌ Failed to get analysis:', error);
    res.status(500).json({
      error: 'Failed to retrieve analysis',
      message: error.message,
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * POST /api/v2/ai/generate-snippet
 * Generate a snippet from AI analysis and save to database
 */
router.post('/generate-snippet', authenticateToken, async (req, res) => {
  try {
    const { snippet } = req.body;
    const userId = req.user.id;

    if (!snippet) {
      return res.status(400).json({
        error: 'Snippet data required',
        message: 'Snippet object must be provided',
        code: 'VALIDATION_ERROR'
      });
    }

    // Validate snippet structure
    const validation = aiService.validateSnippetStructure(snippet);
    if (!validation.isValid) {
      return res.status(400).json({
        error: 'Invalid snippet structure',
        message: 'Snippet validation failed',
        code: 'VALIDATION_ERROR',
        details: { errors: validation.errors }
      });
    }

    // Use the snippetService instead for proper snippet creation
    const snippetService = (await import('../services/snippetService.js')).default;
    
    const snippetData = {
      title: snippet.title,
      description: snippet.description,
      categories: snippet.categories,
      isPublic: snippet.isPublic || false,
      locked: snippet.locked || false,
      fragments: snippet.fragments
    };

    const createdSnippet = await snippetService.createSnippet(snippetData, userId);

    res.status(201).json({
      success: true,
      data: createdSnippet,
      message: 'AI-generated snippet created successfully'
    });

  } catch (error) {
    console.error('❌ Failed to create snippet from AI:', error);
    res.status(500).json({
      error: 'Failed to create snippet',
      message: error.message,
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * GET /api/v2/ai/usage
 * Get AI usage statistics for the user
 */
router.get('/usage', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { period = 'month' } = req.query;
    const db = getDb();

    // Calculate date range
    let dateFilter = '';
    const now = new Date();
    
    switch (period) {
      case 'day':
        dateFilter = `AND created_at >= date('now', '-1 day')`;
        break;
      case 'week':
        dateFilter = `AND created_at >= date('now', '-7 days')`;
        break;
      case 'month':
        dateFilter = `AND created_at >= date('now', '-30 days')`;
        break;
      case 'year':
        dateFilter = `AND created_at >= date('now', '-365 days')`;
        break;
    }

    // Get usage statistics
    const usageStats = await db.prepare(`
      SELECT 
        COUNT(*) as total_analyses,
        SUM(tokens_input) as total_input_tokens,
        SUM(tokens_output) as total_output_tokens,
        SUM(cost_usd) as total_cost,
        AVG(cost_usd) as avg_cost_per_analysis
      FROM ai_usage 
      WHERE user_id = ? ${dateFilter}
    `).get(userId);

    // Get recent analyses
    const recentAnalyses = await db.prepare(`
      SELECT id, status, generated_snippets, tokens_used, cost_usd, created_at, completed_at
      FROM ai_analyses 
      WHERE user_id = ? ${dateFilter}
      ORDER BY created_at DESC 
      LIMIT 10
    `).all(userId);

    res.json({
      success: true,
      period,
      usage: {
        totalAnalyses: usageStats.total_analyses || 0,
        totalTokensInput: usageStats.total_input_tokens || 0,
        totalTokensOutput: usageStats.total_output_tokens || 0,
        totalCost: parseFloat(usageStats.total_cost || 0),
        avgCostPerAnalysis: parseFloat(usageStats.avg_cost_per_analysis || 0)
      },
      recentAnalyses: recentAnalyses.map(analysis => ({
        id: analysis.id,
        status: analysis.status,
        generatedSnippets: analysis.generated_snippets,
        tokensUsed: analysis.tokens_used,
        costUsd: parseFloat(analysis.cost_usd || 0),
        createdAt: analysis.created_at,
        completedAt: analysis.completed_at
      }))
    });

  } catch (error) {
    console.error('❌ Failed to get usage stats:', error);
    res.status(500).json({
      error: 'Failed to retrieve usage statistics',
      message: error.message,
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * GET /api/v2/ai/health
 * Get AI service health status
 */
router.get('/health', async (req, res) => {
  try {
    const healthStatus = await aiService.getHealthStatus();
    
    res.json({
      success: true,
      ai: healthStatus
    });

  } catch (error) {
    console.error('❌ Failed to get AI health:', error);
    res.status(500).json({
      error: 'Failed to check AI health',
      message: error.message,
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * GET /api/v2/ai/processor/status
 * Get command processor status
 */
router.get('/processor/status', async (req, res) => {
  try {
    // Access the command processor from the app context
    // This is a bit of a hack, but it works for our purposes
    const processorStatus = global.commandProcessor ? global.commandProcessor.getStatus() : { running: false };
    
    res.json({
      success: true,
      processor: processorStatus
    });

  } catch (error) {
    console.error('❌ Failed to get processor status:', error);
    res.status(500).json({
      error: 'Failed to check processor status',
      message: error.message,
      code: 'INTERNAL_ERROR'
    });
  }
});

export default router; 