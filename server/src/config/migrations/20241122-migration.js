import Logger from '../../logger.js';

function needsMigration(db) {
  try {
    const tableExists = db.prepare(`
      SELECT COUNT(*) as count 
      FROM sqlite_master 
      WHERE type='table' AND name='api_keys'
    `).get();

    return tableExists.count === 0;
  } catch (error) {
    Logger.error('v1.5.1-api-keys - Error checking migration status:', error);
    throw error;
  }
}

function up_v1_5_1_api_keys(db) {
  if (!needsMigration(db)) {
    Logger.debug('v1.5.1-api-keys - Migration not needed');
    return;
  }

  Logger.debug('v1.5.1-api-keys - Starting migration...');

  try {
    db.transaction(() => {
      db.exec(`
        CREATE TABLE api_keys (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          key TEXT NOT NULL UNIQUE,
          name TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          last_used_at DATETIME,
          is_active BOOLEAN DEFAULT TRUE,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);
        CREATE INDEX idx_api_keys_key ON api_keys(key);
      `);
    })();

    Logger.debug('v1.5.1-api-keys - Migration completed successfully');
  } catch (error) {
    Logger.error('v1.5.1-api-keys - Migration failed:', error);
    throw error;
  }
}

export { up_v1_5_1_api_keys };
