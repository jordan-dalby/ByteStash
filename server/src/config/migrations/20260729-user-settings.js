import Logger from '../../logger.js';

function needsMigration(db) {
  try {
    const tableCheck = db
      .prepare(`
        SELECT COUNT(*) as count
        FROM sqlite_master
        WHERE type = 'table' AND name = 'user_settings'
      `)
      .get();

    return tableCheck.count === 0;
  } catch (error) {
    Logger.error('v1.9.0-user-settings - Error checking migration status:', error);
    throw error;
  }
}

export function up_v1_9_0_user_settings(db) {
  if (!needsMigration(db)) {
    Logger.debug('v1.9.0-user-settings - Migration not needed');
    return;
  }

  Logger.debug('v1.9.0-user-settings - Starting migration...');

  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS user_settings (
          user_id INTEGER PRIMARY KEY,
          settings TEXT NOT NULL DEFAULT '{}',
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      );
    `);

    Logger.debug('v1.9.0-user-settings - Migration completed successfully');
  } catch (error) {
    Logger.error('v1.9.0-user-settings - Migration failed:', error);
    throw error;
  }
}
