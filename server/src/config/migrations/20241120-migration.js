import Logger from '../../logger.js';

function needsMigration(db) {
  try {
    const hasOIDCColumns = db.prepare(`
      SELECT COUNT(*) as count 
      FROM pragma_table_info('users') 
      WHERE name IN ('oidc_id', 'oidc_provider', 'email', 'name')
    `).get();

    return hasOIDCColumns.count !== 4;
  } catch (error) {
    Logger.error('v1.5.0-oidc - Error checking migration status:', error);
    throw error;
  }
}

async function up_v1_5_0_oidc(db) {
  if (!needsMigration(db)) {
    Logger.debug('v1.5.0-oidc - Migration not needed');
    return;
  }
  
  Logger.debug('v1.5.0-oidc - Starting migration...');

  try {
    db.exec(`
      ALTER TABLE users ADD COLUMN oidc_id TEXT;
      ALTER TABLE users ADD COLUMN oidc_provider TEXT;
      ALTER TABLE users ADD COLUMN email TEXT;
      ALTER TABLE users ADD COLUMN name TEXT;
      
      CREATE UNIQUE INDEX IF NOT EXISTS idx_users_oidc 
      ON users(oidc_id, oidc_provider) 
      WHERE oidc_id IS NOT NULL AND oidc_provider IS NOT NULL;
    `);

    Logger.debug('v1.5.0-oidc - Migration completed successfully');
  } catch (error) {
    Logger.error('v1.5.0-oidc - Migration failed:', error);
    throw error;
  }
}

export { up_v1_5_0_oidc };