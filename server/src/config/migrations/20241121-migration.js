import Logger from '../../logger.js';

function needsMigration(db) {
  try {
    const hasNormalizedColumn = db.prepare(`
      SELECT COUNT(*) as count 
      FROM pragma_table_info('users') 
      WHERE name = 'username_normalized'
    `).get();

    return hasNormalizedColumn.count === 0;
  } catch (error) {
    Logger.error('v1.5.0-usernames - Error checking migration status:', error);
    throw error;
  }
}

async function up_v1_5_0_usernames(db) {
  if (!needsMigration(db)) {
    Logger.debug('v1.5.0-usernames - Migration not needed');
    return;
  }
  
  Logger.debug('v1.5.0-usernames - Starting migration...');

  try {
    db.transaction(() => {
      db.exec(`
        ALTER TABLE users ADD COLUMN username_normalized TEXT;
        CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username_normalized 
        ON users(username_normalized COLLATE NOCASE);
      `);

      const users = db.prepare('SELECT id, username FROM users').all();
      const updateStmt = db.prepare(
        'UPDATE users SET username_normalized = ? WHERE id = ?'
      );

      for (const user of users) {
        updateStmt.run(user.username.toLowerCase(), user.id);
      }
    })();

    Logger.debug('v1.5.0-usernames - Migration completed successfully');
  } catch (error) {
    Logger.error('v1.5.0-usernames - Migration failed:', error);
    throw error;
  }
}

export { up_v1_5_0_usernames };