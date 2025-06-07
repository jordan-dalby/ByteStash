import AIAnalysisService from './aiAnalysisService.js';
import { getDb } from '../config/database.js';
import Logger from '../logger.js';
import crypto from 'crypto';

class CommandProcessor {
  constructor() {
    this.aiService = new AIAnalysisService();
    this.isProcessing = false;
    this.processInterval = 30000; // Process every 30 seconds
    this.batchSize = 10; // Process up to 10 commands at a time
    this.cleanupRedundantSnippets = process.env.CLEANUP_REDUNDANT_SNIPPETS !== 'false'; // Default: true
  }

  /**
   * Start the background command processor
   */
  start() {
    Logger.info('🤖 Starting automatic command processor...');
    
    // Process immediately on start
    this.processUnprocessedCommands();
    
    // Set up interval processing
    this.intervalId = setInterval(() => {
      this.processUnprocessedCommands();
    }, this.processInterval);
    
    Logger.info(`✅ Command processor started (checking every ${this.processInterval/1000}s)`);
  }

  /**
   * Stop the background processor
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      Logger.info('🛑 Command processor stopped');
    }
  }

  /**
   * Find and process CLI commands that haven't been analyzed by AI yet
   */
  async processUnprocessedCommands() {
    if (this.isProcessing) {
      return; // Avoid overlapping processing
    }

    try {
      this.isProcessing = true;
      const db = getDb();

      // Find snippets created by CLI that haven't been AI-processed
      // CLI snippets have category 'terminal-commands' and title starting with 'Terminal:'
      const unprocessedSnippets = await db.prepare(`
        SELECT DISTINCT s.user_id, s.title, f.code as command, s.id as snippet_id
        FROM snippets s
        JOIN fragments f ON s.id = f.snippet_id
        JOIN categories c ON s.id = c.snippet_id
        WHERE s.title LIKE 'Terminal:%'
        AND c.name = 'terminal-commands'
        AND s.id NOT IN (
          SELECT DISTINCT snippet_id 
          FROM snippet_ai_analysis 
          WHERE snippet_id IS NOT NULL
        )
        ORDER BY s.updated_at DESC
        LIMIT ?
      `).all(this.batchSize * 5); // Get more to group by user

      if (unprocessedSnippets.length === 0) {
        return; // No commands to process
      }

      Logger.info(`🔍 Found ${unprocessedSnippets.length} unprocessed commands`);

      // Group commands by user for batch processing
      const userCommands = {};
      unprocessedSnippets.forEach(snippet => {
        if (!userCommands[snippet.user_id]) {
          userCommands[snippet.user_id] = [];
        }
        userCommands[snippet.user_id].push(snippet.command);
      });

      // Process each user's commands
      for (const [userId, commands] of Object.entries(userCommands)) {
        await this.processUserCommands(parseInt(userId), commands);
        
        // Small delay between users to avoid overwhelming the AI service
        await this.sleep(2000);
      }

    } catch (error) {
      Logger.error('❌ Error in command processor:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Process commands for a specific user
   */
  async processUserCommands(userId, commands) {
    try {
      // Limit batch size to avoid large AI costs
      const batchCommands = commands.slice(0, this.batchSize);
      
      Logger.info(`🚀 Processing ${batchCommands.length} commands for user ${userId}`);

      // Analyze commands with Claude
      let analysisResult;
      try {
        analysisResult = await this.aiService.analyzeCommands(batchCommands, {
          groupSimilar: true,
          maxSnippets: 3 // Limit snippets per batch
        });
      } catch (aiError) {
        Logger.error(`❌ AI Service error for user ${userId}:`, {
          message: aiError?.message || 'Unknown error',
          stack: aiError?.stack,
          error: aiError
        });
        return;
      }

      // Check if analysisResult is undefined
      if (!analysisResult) {
        Logger.error(`❌ Analysis result is undefined for user ${userId}`);
        return;
      }

      // DEBUG: Log the full analysis result
      Logger.info(`🔍 Analysis result:`, JSON.stringify({
        success: analysisResult.success,
        validSnippetsCount: analysisResult.validSnippets?.length || 0,
        validationErrors: analysisResult.validationErrors,
        extractedSnippetsCount: analysisResult.extractedData?.snippets?.length || 0,
        hasRawResponse: !!analysisResult.rawResponse,
        rawResponseLength: analysisResult.rawResponse?.length || 0
      }, null, 2));

      // DEBUG: Log first 300 chars of Claude's actual response
      if (analysisResult.rawResponse) {
        Logger.info(`🔍 Claude raw response preview:`, analysisResult.rawResponse.substring(0, 300));
      }

      if (!analysisResult.success) {
        Logger.error(`❌ AI analysis failed for user ${userId}:`, analysisResult.validationErrors || 'No validation errors provided');
        return;
      }

      // Create professional snippets from analysis
      for (const snippet of analysisResult.validSnippets) {
        await this.createEnhancedSnippet(userId, snippet, batchCommands);
      }

      // Mark original CLI snippets as processed
      await this.markCommandsProcessed(userId, batchCommands);

      Logger.info(`✅ Created ${analysisResult.validSnippets.length} enhanced snippets for user ${userId}`);

    } catch (error) {
      Logger.error(`❌ Error processing commands for user ${userId}:`, error);
    }
  }

  /**
   * Create an enhanced snippet from AI analysis
   */
  async createEnhancedSnippet(userId, aiSnippet, originalCommands) {
    try {
      const db = getDb();
      
      // CHECK FOR DUPLICATES: Don't create if enhanced snippet already exists
      const existingSnippet = await db.prepare(`
        SELECT s.id, s.title FROM snippets s
        WHERE s.user_id = ? 
        AND s.title = ?
        AND s.title NOT LIKE 'Terminal:%'
        LIMIT 1
      `).get(userId, aiSnippet.title);

      if (existingSnippet) {
        Logger.info(`🔄 Skipping duplicate: "${aiSnippet.title}" already exists (ID: ${existingSnippet.id})`);
        return existingSnippet.id;
      }

      // Create the enhanced snippet - let SQLite auto-increment the ID
      const createdAt = new Date().toISOString();

      const snippetResult = await db.prepare(`
        INSERT INTO snippets (user_id, title, description, is_public, locked, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        userId,
        aiSnippet.title || 'Untitled Snippet',
        aiSnippet.description || '',
        aiSnippet.isPublic ? 1 : 0,  // Convert boolean to 0/1 for SQLite
        aiSnippet.locked ? 1 : 0,    // Convert boolean to 0/1 for SQLite
        createdAt
      );

      const snippetId = snippetResult.lastInsertRowid;
      Logger.info(`📝 Created snippet with ID: ${snippetId}`);

      // Add categories to separate table
      if (aiSnippet.categories && Array.isArray(aiSnippet.categories)) {
        for (const category of aiSnippet.categories) {
          await db.prepare(`
            INSERT INTO categories (snippet_id, name)
            VALUES (?, ?)
          `).run(snippetId, category.toString());
        }
      }

      // Add fragments
      if (aiSnippet.fragments && Array.isArray(aiSnippet.fragments)) {
        for (let i = 0; i < aiSnippet.fragments.length; i++) {
          const fragment = aiSnippet.fragments[i];
          
          // Handle different possible field names from Claude
          const fileName = fragment.file_name || fragment.fileName || `snippet_${i + 1}.sh`;
          const code = fragment.code || fragment.content || '';
          const language = fragment.language || 'bash';
          
          await db.prepare(`
            INSERT INTO fragments (snippet_id, file_name, code, language, position)
            VALUES (?, ?, ?, ?, ?)
          `).run(
            snippetId,
            fileName,
            code,
            language,
            i
          );
        }
      }

      // Record the AI analysis
      await db.prepare(`
        INSERT INTO snippet_ai_analysis (snippet_id, original_commands, ai_analysis_id, created_at)
        VALUES (?, ?, ?, ?)
      `).run(
        snippetId.toString(),
        JSON.stringify(originalCommands),
        `auto-${Date.now()}`,
        createdAt
      );

      Logger.info(`✅ Enhanced snippet created: "${aiSnippet.title}" (ID: ${snippetId})`);
      
      // OPTIONAL: Clean up redundant CLI snippets for this command
      if (this.cleanupRedundantSnippets) {
        await this.cleanupRedundantCliSnippets(userId, originalCommands);
      }
      
      return snippetId;

    } catch (error) {
      Logger.error('❌ Error creating enhanced snippet:', error);
      Logger.error('Snippet data:', JSON.stringify(aiSnippet, null, 2));
      throw error;
    }
  }

  /**
   * Clean up redundant CLI snippets when enhanced snippets are created
   */
  async cleanupRedundantCliSnippets(userId, processedCommands) {
    try {
      const db = getDb();
      
      // Find CLI snippets that match the processed commands
      for (const command of processedCommands) {
        // Find CLI snippets with this exact command
        const cliSnippets = await db.prepare(`
          SELECT DISTINCT s.id, s.title
          FROM snippets s
          JOIN fragments f ON s.id = f.snippet_id
          JOIN categories c ON s.id = c.snippet_id
          WHERE s.user_id = ?
          AND s.title LIKE 'Terminal:%'
          AND c.name = 'terminal-commands'
          AND f.code = ?
        `).all(userId, command);

        // Delete redundant CLI snippets (keep the enhanced ones)
        for (const cliSnippet of cliSnippets) {
          await db.prepare('DELETE FROM fragments WHERE snippet_id = ?').run(cliSnippet.id);
          await db.prepare('DELETE FROM categories WHERE snippet_id = ?').run(cliSnippet.id);
          await db.prepare('DELETE FROM snippets WHERE id = ?').run(cliSnippet.id);
          
          Logger.info(`🧹 Cleaned up redundant CLI snippet: "${cliSnippet.title}" (ID: ${cliSnippet.id})`);
        }
      }

    } catch (error) {
      Logger.error('❌ Error cleaning up CLI snippets:', error);
    }
  }

  /**
   * Mark CLI commands as processed to avoid reprocessing
   */
  async markCommandsProcessed(userId, commands) {
    try {
      const db = getDb();
      
      // Create tracking table if it doesn't exist
      await db.prepare(`
        CREATE TABLE IF NOT EXISTS processed_cli_commands (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER,
          command_hash TEXT,
          processed_at TEXT,
          UNIQUE(user_id, command_hash)
        )
      `).run();

      // Mark commands as processed
      for (const command of commands) {
        const commandHash = crypto.createHash('md5').update(command).digest('hex');
        await db.prepare(`
          INSERT OR IGNORE INTO processed_cli_commands (user_id, command_hash, processed_at)
          VALUES (?, ?, ?)
        `).run(userId, commandHash, new Date().toISOString());
      }

    } catch (error) {
      Logger.error('❌ Error marking commands as processed:', error);
    }
  }

  /**
   * Create the snippet_ai_analysis table if it doesn't exist
   */
  async initializeDatabase() {
    try {
      const db = getDb();
      await db.prepare(`
        CREATE TABLE IF NOT EXISTS snippet_ai_analysis (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          snippet_id TEXT,
          original_commands TEXT,
          ai_analysis_id TEXT,
          created_at TEXT
        )
      `).run();
    } catch (error) {
      Logger.error('❌ Error initializing database for command processor:', error);
    }
  }

  /**
   * Sleep utility
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get processor status
   */
  getStatus() {
    return {
      running: !!this.intervalId,
      processing: this.isProcessing,
      processInterval: this.processInterval,
      batchSize: this.batchSize
    };
  }
}

export default CommandProcessor; 