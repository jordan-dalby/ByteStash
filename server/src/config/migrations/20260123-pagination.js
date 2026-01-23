import Logger from '../../logger.js';

function needsMigration(db) {
  try {
    // Check if indexes already exist
    const indexCheck = db
      .prepare(`
        SELECT COUNT(*) as count
        FROM sqlite_master
        WHERE type = 'index' AND name = 'idx_fragments_language'
      `)
      .get();

    return indexCheck.count === 0;
  } catch (error) {
    Logger.error('v1.8.0-pagination - Error checking migration status:', error);
    throw error;
  }
}

export function up_v1_8_0_pagination(db) {
  if (!needsMigration(db)) {
    Logger.debug('v1.8.0-pagination - Migration not needed');
    return;
  }

  Logger.debug('v1.8.0-pagination - Starting migration...');

  try {
    db.exec(`
      -- Optimize language filtering
      CREATE INDEX IF NOT EXISTS idx_fragments_language ON fragments(language);

      -- Optimize category filtering
      CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);

      -- Optimize common filter combinations
      CREATE INDEX IF NOT EXISTS idx_snippets_user_expiry ON snippets(user_id, expiry_date);
      CREATE INDEX IF NOT EXISTS idx_snippets_user_favorite ON snippets(user_id, is_favorite);
      CREATE INDEX IF NOT EXISTS idx_snippets_user_pinned ON snippets(user_id, is_pinned);

      -- Optimize sorting by date
      CREATE INDEX IF NOT EXISTS idx_snippets_updated_at ON snippets(updated_at DESC);
      CREATE INDEX IF NOT EXISTS idx_snippets_user_updated ON snippets(user_id, updated_at DESC);
    `);

    Logger.debug('v1.8.0-pagination - Migration completed successfully');
  } catch (error) {
    Logger.error('v1.8.0-pagination - Migration failed:', error);
    throw error;
  }
}
