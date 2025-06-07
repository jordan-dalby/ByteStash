import Logger from '../../logger.js';

/**
 * Migration: Add settings table
 * Date: 2025-01-06
 * Description: Add settings table for storing configuration like Claude API keys
 */

function needsMigration(db) {
  try {
    const tableExists = db.prepare(`
      SELECT COUNT(*) as count 
      FROM sqlite_master 
      WHERE type='table' AND name='settings'
    `).get();

    return tableExists.count === 0;
  } catch (error) {
    Logger.error('settings-table - Error checking migration status:', error);
    throw error;
  }
}

export function up_settings_table(db) {
  if (!needsMigration(db)) {
    Logger.debug('settings-table - Migration not needed');
    return;
  }

  Logger.debug('settings-table - Starting migration...');

  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now', 'utc')),
        updated_at TEXT DEFAULT (datetime('now', 'utc'))
      )
    `);

    Logger.debug('settings-table - Migration completed successfully');
  } catch (error) {
    Logger.error('settings-table - Migration failed:', error);
    throw error;
  }
} 