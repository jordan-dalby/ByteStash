import Logger from '../../logger.js';

export function up_ai_analysis(db) {
  try {
    Logger.debug('Running AI analysis migration...');

    // Check if ai_analyses table already exists
    const tableExists = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='ai_analyses'
    `).get();

    if (tableExists) {
      Logger.debug('AI analysis tables already exist, skipping migration');
      return;
    }

    // Create AI Analysis tracking table
    db.exec(`
      CREATE TABLE IF NOT EXISTS ai_analyses (
          id VARCHAR(255) PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          commands TEXT NOT NULL,
          status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
          analysis_result TEXT,
          generated_snippets INTEGER DEFAULT 0,
          tokens_used INTEGER,
          cost_usd DECIMAL(10,4),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          completed_at TIMESTAMP,
          error_message TEXT
      )
    `);

    // Create AI Usage tracking table
    db.exec(`
      CREATE TABLE IF NOT EXISTS ai_usage (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          analysis_id VARCHAR(255) REFERENCES ai_analyses(id) ON DELETE CASCADE,
          tokens_input INTEGER NOT NULL,
          tokens_output INTEGER NOT NULL,
          cost_usd DECIMAL(10,4) NOT NULL,
          model_used VARCHAR(100) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create Command analysis cache table
    db.exec(`
      CREATE TABLE IF NOT EXISTS command_analysis_cache (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          command_hash VARCHAR(64) UNIQUE NOT NULL,
          command_text TEXT NOT NULL,
          analysis_result TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          hits INTEGER DEFAULT 1,
          last_hit TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes for performance
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_ai_analyses_user_id ON ai_analyses(user_id);
      CREATE INDEX IF NOT EXISTS idx_ai_analyses_status ON ai_analyses(status);
      CREATE INDEX IF NOT EXISTS idx_ai_analyses_created_at ON ai_analyses(created_at);
      
      CREATE INDEX IF NOT EXISTS idx_ai_usage_user_id ON ai_usage(user_id);
      CREATE INDEX IF NOT EXISTS idx_ai_usage_created_at ON ai_usage(created_at);
      
      CREATE INDEX IF NOT EXISTS idx_command_cache_hash ON command_analysis_cache(command_hash);
      CREATE INDEX IF NOT EXISTS idx_command_cache_created_at ON command_analysis_cache(created_at);
    `);

    Logger.debug('✅ AI analysis migration completed successfully');
  } catch (error) {
    Logger.error('❌ AI analysis migration failed:', error);
    throw error;
  }
} 