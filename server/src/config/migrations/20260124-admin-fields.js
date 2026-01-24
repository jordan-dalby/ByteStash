import Logger from '../../logger.js';

function needsMigration(db) {
  try {
    // Check if is_admin column already exists in users table
    const tableInfo = db.prepare('PRAGMA table_info(users)').all();
    const hasIsAdmin = tableInfo.some(col => col.name === 'is_admin');

    return !hasIsAdmin;
  } catch (error) {
    Logger.error('v1.9.0-admin-fields - Error checking migration status:', error);
    throw error;
  }
}

export function up_v1_9_0_admin_fields(db) {
  if (!needsMigration(db)) {
    Logger.debug('v1.9.0-admin-fields - Migration not needed');
    return;
  }

  Logger.debug('v1.9.0-admin-fields - Starting migration...');

  try {
    db.exec(`
      -- Add admin and activity tracking fields to users table
      ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;
      ALTER TABLE users ADD COLUMN last_login_at DATETIME;
      ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
    `);

    Logger.debug('v1.9.0-admin-fields - Migration completed successfully');
  } catch (error) {
    Logger.error('v1.9.0-admin-fields - Migration failed:', error);
    throw error;
  }
}
