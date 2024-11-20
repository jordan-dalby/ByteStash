import Logger from '../../logger.js';

function needsMigration(db) {
  try {
    const hasPublicColumn = db.prepare(`
      SELECT COUNT(*) as count 
      FROM pragma_table_info('snippets') 
      WHERE name = 'is_public'
    `).get();

    if (hasPublicColumn.count === 0) {
      Logger.debug('v1.5.0-public - Snippets table missing is_public column, migration needed');
      return true;
    }

    const hasPublicIndex = db.prepare(`
      SELECT COUNT(*) as count 
      FROM sqlite_master 
      WHERE type='index' AND name='idx_snippets_is_public'
    `).get();

    if (hasPublicIndex.count === 0) {
      Logger.debug('v1.5.0-public - Missing is_public index, migration needed');
      return true;
    }

    Logger.debug('v1.5.0-public - Database schema is up to date, no migration needed');
    return false;
  } catch (error) {
    Logger.error('v1.5.0-public - Error checking migration status:', error);
    throw error;
  }
}

async function up_v1_5_0_public(db) {
  if (!needsMigration(db)) {
    Logger.debug('v1.5.0-public - Migration is not needed, database is up to date');
    return;
  }
  
  Logger.debug('v1.5.0-public - Starting migration: Adding public snippets support...');

  try {
    db.exec(`
      ALTER TABLE snippets ADD COLUMN is_public BOOLEAN DEFAULT FALSE;
      CREATE INDEX idx_snippets_is_public ON snippets(is_public);
    `);

    Logger.debug('v1.5.0-public - Migration completed successfully');
  } catch (error) {
    Logger.error('v1.5.0-public - Migration failed:', error);
    throw error;
  }
}

export { up_v1_5_0_public };