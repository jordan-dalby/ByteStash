import Database from 'better-sqlite3';
import { dirname, join } from 'path';
import fs from 'fs';
import { up_v1_4_0 } from './migrations/20241111-migration.js';
import { up_v1_5_0 } from './migrations/20241117-migration.js';
import Logger from '../logger.js';
import { up_v1_5_0_public } from './migrations/20241119-migration.js';
import { up_v1_5_0_oidc } from './migrations/20241120-migration.js';
import { fileURLToPath } from 'url';
import { up_v1_5_0_usernames } from './migrations/20241121-migration.js';
import { up_v1_5_1_api_keys } from './migrations/20241122-migration.js';

let db = null;
let checkpointInterval = null;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function getDatabasePath() {
  const dbPath = join(__dirname, '../../../data/snippets');
  if (!fs.existsSync(dbPath)) {
    fs.mkdirSync(dbPath, { recursive: true });
  }
  return join(dbPath, 'snippets.db');
}

function checkpointDatabase() {
  if (!db) return;
  
  try {
    Logger.debug('Starting database checkpoint...');
    const start = Date.now();
    
    db.pragma('wal_checkpoint(PASSIVE)');
    
    const duration = Date.now() - start;
    Logger.debug(`Database checkpoint completed in ${duration}ms`);
  } catch (error) {
    Logger.error('Error during database checkpoint:', error);
  }
}

function startCheckpointInterval() {
  const CHECKPOINT_INTERVAL = 5 * 60 * 1000;
  
  if (checkpointInterval) {
    clearInterval(checkpointInterval);
  }

  checkpointInterval = setInterval(checkpointDatabase, CHECKPOINT_INTERVAL);
}

function stopCheckpointInterval() {
  if (checkpointInterval) {
    clearInterval(checkpointInterval);
    checkpointInterval = null;
  }
}

function backupDatabase(dbPath) {
  const baseBackupPath = `${dbPath}.backup`;
  checkpointDatabase();

  try {
    if (fs.existsSync(dbPath)) {
      const dbBackupPath = `${baseBackupPath}.db`;
      fs.copyFileSync(dbPath, dbBackupPath);
      Logger.debug(`Database backed up to: ${dbBackupPath}`);
    } else {
      Logger.error(`Database file not found: ${dbPath}`);
      return false;
    }
    return true;
  } catch (error) {
    Logger.error('Failed to create database backup:', error);
    throw error;
  }
}

function createInitialSchema(db) {
  const initSQL = fs.readFileSync(path.join(__dirname, 'schema/init.sql'), 'utf8');
  db.exec(initSQL);
}

function initializeDatabase() {
  try {
    const dbPath = getDatabasePath();
    Logger.debug(`Initializing SQLite database at: ${dbPath}`);

    const dbExists = fs.existsSync(dbPath);

    db = new Database(dbPath, { 
      verbose: Logger.debug,
      fileMustExist: false
    });

    db.pragma('foreign_keys = ON');
    db.pragma('journal_mode = WAL');

    backupDatabase(dbPath);

    if (!dbExists) {
      Logger.debug('Creating new database with initial schema...');
      createInitialSchema(db);
    } else {
      Logger.debug('Database file exists, checking for needed migrations...');
      
      up_v1_4_0(db);
      up_v1_5_0(db);
      up_v1_5_0_public(db);
      up_v1_5_0_oidc(db);
      up_v1_5_0_usernames(db);
      up_v1_5_1_api_keys(db);
    }

    startCheckpointInterval();

    Logger.debug('Database initialization completed successfully');
    return db;
  } catch (error) {
    Logger.error('Database initialization error:', error);
    throw error;
  }
}

function getDb() {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return db;
}

function shutdownDatabase() {
  if (db) {
    try {
      Logger.debug('Performing final database checkpoint...');
      db.pragma('wal_checkpoint(TRUNCATE)');
      
      stopCheckpointInterval();
      db.close();
      db = null;
      
      Logger.debug('Database shutdown completed successfully');
    } catch (error) {
      Logger.error('Error during database shutdown:', error);
      throw error;
    }
  }
}

export { initializeDatabase, getDb, shutdownDatabase, checkpointDatabase };
