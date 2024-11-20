import Logger from '../../logger.js';

function needsMigration(db) {
  try {
    const hasUsersTable = db.prepare(`
      SELECT name 
      FROM sqlite_master 
      WHERE type='table' AND name='users'
    `).get();

    if (!hasUsersTable) {
      Logger.debug('v1.5.0 - Users table does not exist, migration needed');
      return true;
    }

    const hasUserIdColumn = db.prepare(`
      SELECT COUNT(*) as count 
      FROM pragma_table_info('snippets') 
      WHERE name = 'user_id'
    `).get();

    if (hasUserIdColumn.count === 0) {
      Logger.debug('v1.5.0 - Snippets table missing user_id column, migration needed');
      return true;
    }

    const hasUserIdIndex = db.prepare(`
      SELECT COUNT(*) as count 
      FROM sqlite_master 
      WHERE type='index' AND name='idx_snippets_user_id'
    `).get();

    if (hasUserIdIndex.count === 0) {
      Logger.debug('v1.5.0 - Missing user_id index, migration needed');
      return true;
    }

    Logger.debug('v1.5.0 - Database schema is up to date, no migration needed');
    return false;
  } catch (error) {
    Logger.error('v1.5.0 - Error checking migration status:', error);
    throw error;
  }
}

async function up_v1_5_0(db) {
  if (!needsMigration(db)) {
    Logger.debug('v1.5.0 - Migration is not needed, database is up to date');
    return;
  }
  
  Logger.debug('v1.5.0 - Starting migration: Adding users table and updating snippets...');

  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
    `);

    db.exec(`
      ALTER TABLE snippets ADD COLUMN user_id INTEGER REFERENCES users(id);
      CREATE INDEX idx_snippets_user_id ON snippets(user_id);
    `);

    Logger.debug('v1.5.0 - Migration completed successfully');
  } catch (error) {
    Logger.error('v1.5.0 - Migration failed:', error);
    throw error;
  }
}

async function up_v1_5_0_snippets(db, userId) {
  try {
    Logger.debug(`v1.5.0 - Migrating orphaned snippets to user ${userId}...`);
    
    const updateSnippets = db.prepare(`
      UPDATE snippets SET user_id = ? WHERE user_id IS NULL
    `);

    const result = updateSnippets.run(userId);
    Logger.debug(`v1.5.0 - Successfully migrated ${result.changes} snippets to user ${userId}`);
    
    return result.changes;
  } catch (error) {
    Logger.error('v1.5.0 - Snippet migration failed:', error);
    throw error;
  }
}

export { up_v1_5_0, up_v1_5_0_snippets };