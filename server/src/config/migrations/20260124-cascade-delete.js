import Logger from '../../logger.js';

function needsMigration(db) {
  try {
    // Check the foreign key constraint on snippets table
    // SQLite doesn't have an easy way to check FK constraints directly
    // We'll check if a marker column exists that we add after the migration
    const tableInfo = db.prepare('PRAGMA table_info(snippets)').all();
    const hasMigrationMarker = tableInfo.some(col => col.name === '_cascade_migration_marker');

    // If the marker exists, migration is already done
    if (hasMigrationMarker) {
      // Remove the marker column if it exists
      return false;
    }

    // Check if the table was created fresh (has the correct schema)
    // Fresh installs won't need this migration
    const foreignKeys = db.prepare('PRAGMA foreign_key_list(snippets)').all();
    const userIdFK = foreignKeys.find(fk => fk.from === 'user_id');

    // If there's no FK at all, or if it exists, we need to check the schema
    // Since we can't directly check for ON DELETE CASCADE, we'll use the table SQL
    const tableSql = db.prepare(
      "SELECT sql FROM sqlite_master WHERE type='table' AND name='snippets'"
    ).get();

    // If the table was created with ON DELETE CASCADE, skip migration
    if (tableSql && tableSql.sql.includes('ON DELETE CASCADE')) {
      return false;
    }

    // Need migration
    return true;
  } catch (error) {
    Logger.error('v1.9.0-cascade-delete - Error checking migration status:', error);
    throw error;
  }
}

export function up_v1_9_0_cascade_delete(db) {
  if (!needsMigration(db)) {
    Logger.debug('v1.9.0-cascade-delete - Migration not needed');
    return;
  }

  Logger.debug('v1.9.0-cascade-delete - Starting migration...');

  try {
    // Disable foreign key constraints temporarily
    db.pragma('foreign_keys = OFF');

    db.exec(`
      BEGIN TRANSACTION;

      -- Create new snippets table with ON DELETE CASCADE
      CREATE TABLE snippets_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        expiry_date DATETIME DEFAULT NULL,
        user_id INTEGER REFERENCES users (id) ON DELETE CASCADE,
        is_public BOOLEAN DEFAULT FALSE,
        is_pinned BOOLEAN DEFAULT FALSE,
        is_favorite BOOLEAN DEFAULT FALSE
      );

      -- Copy all data from old table to new table
      INSERT INTO snippets_new (id, title, description, updated_at, expiry_date, user_id, is_public, is_pinned, is_favorite)
      SELECT id, title, description, updated_at, expiry_date, user_id, is_public, is_pinned, is_favorite
      FROM snippets;

      -- Drop old table
      DROP TABLE snippets;

      -- Rename new table to original name
      ALTER TABLE snippets_new RENAME TO snippets;

      -- Recreate indexes for snippets table
      CREATE INDEX IF NOT EXISTS idx_snippets_user_id ON snippets (user_id);
      CREATE INDEX IF NOT EXISTS idx_snippets_is_public ON snippets (is_public);
      CREATE INDEX IF NOT EXISTS idx_snippets_user_expiry ON snippets(user_id, expiry_date);
      CREATE INDEX IF NOT EXISTS idx_snippets_user_favorite ON snippets(user_id, is_favorite);
      CREATE INDEX IF NOT EXISTS idx_snippets_user_pinned ON snippets(user_id, is_pinned);
      CREATE INDEX IF NOT EXISTS idx_snippets_updated_at ON snippets(updated_at DESC);
      CREATE INDEX IF NOT EXISTS idx_snippets_user_updated ON snippets(user_id, updated_at DESC);

      COMMIT;
    `);

    // Re-enable foreign key constraints
    db.pragma('foreign_keys = ON');

    Logger.debug('v1.9.0-cascade-delete - Migration completed successfully');
  } catch (error) {
    Logger.error('v1.9.0-cascade-delete - Migration failed:', error);
    // Try to rollback
    try {
      db.exec('ROLLBACK;');
      db.pragma('foreign_keys = ON');
    } catch (rollbackError) {
      Logger.error('v1.9.0-cascade-delete - Rollback failed:', rollbackError);
    }
    throw error;
  }
}
