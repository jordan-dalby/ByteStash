import Logger from '../../logger.js';

function needsMigration(db) {
  try {
    const hasExpiryColumn = db
      .prepare(`
        SELECT COUNT(*) as count 
        FROM pragma_table_info('snippets') 
        WHERE name = 'expiry_date'
      `)
      .get();

    return hasExpiryColumn.count === 0;
  } catch (error) {
    Logger.error('v1.6.0-snippet-expiry - Error checking migration status:', error);
    throw error;
  }
}

async function up_v1_6_0_snippet_expiry(db) {
  if (!needsMigration(db)) {
    Logger.debug('v1.6.0-snippet-expiry - Migration not needed');
    return;
  }

  Logger.debug('v1.6.0-snippet-expiry - Starting migration...');

  try {
    db.exec(`
      ALTER TABLE snippets ADD COLUMN expiry_date DATETIME DEFAULT NULL;
    `);

    Logger.debug('v1.6.0-snippet-expiry - Migration completed successfully');
  } catch (error) {
    Logger.error('v1.6.0-snippet-expiry - Migration failed:', error);
    throw error;
  }
}

export { up_v1_6_0_snippet_expiry };
