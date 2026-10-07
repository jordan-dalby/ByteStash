import Database from "better-sqlite3";
import { dirname, join } from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import Logger from "../logger.js";
import { up_v1_4_0 } from "./migrations/20241111-migration.js";
import { up_v1_5_0 } from "./migrations/20241117-migration.js";
import { up_v1_5_0_public } from "./migrations/20241119-migration.js";
import { up_v1_5_0_oidc } from "./migrations/20241120-migration.js";
import { up_v1_5_0_usernames } from "./migrations/20241121-migration.js";
import { up_v1_5_1_api_keys } from "./migrations/20241122-migration.js";
import { up_v1_6_0_snippet_expiry } from "./migrations/20250601-migration.js";
import { up_v1_7_0_snippet_pin_favorite } from "./migrations/20250905-migration.js";
import { up_v1_8_0_pagination } from "./migrations/20260123-pagination.js";
import { up_v1_9_0_admin_fields } from "./migrations/20260124-admin-fields.js";
import { up_v1_9_0_cascade_delete } from "./migrations/20260124-cascade-delete.js";
import { up_v1_9_0_user_settings } from "./migrations/20260729-user-settings.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function getDataDirectory() {
  const dataDir = join(__dirname, "../../../data/snippets");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  return dataDir;
}

function getDatabasePath() {
  return join(getDataDirectory(), "snippets.db");
}

function sqliteDatabaseExists() {
  return fs.existsSync(getDatabasePath());
}

function checkpointSqlite(db) {
  try {
    Logger.debug("Starting database checkpoint...");
    const start = Date.now();

    db.pragma("wal_checkpoint(PASSIVE)");

    const duration = Date.now() - start;
    Logger.debug(`Database checkpoint completed in ${duration}ms`);
  } catch (error) {
    Logger.error("Error during database checkpoint:", error);
  }
}

function backupDatabase(db, dbPath) {
  const baseBackupPath = `${dbPath}.backup`;
  checkpointSqlite(db);

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
    Logger.error("Failed to create database backup:", error);
    throw error;
  }
}

function createInitialSchema(db) {
  const initSQL = fs.readFileSync(join(__dirname, "schema/init.sql"), "utf8");
  Logger.debug("Init SQL Path:", join(__dirname, "schema/init.sql"));
  db.exec(initSQL);
  Logger.debug("✅ Initial schema executed");
}

function openSqliteDatabase() {
  const dbPath = getDatabasePath();
  Logger.debug(`Initializing SQLite database at: ${dbPath}`);

  const dbExists = fs.existsSync(dbPath);

  const db = new Database(dbPath, {
    verbose: Logger.debug,
    fileMustExist: false,
  });

  try {
    db.pragma("foreign_keys = ON");
    db.pragma("journal_mode = WAL");

    backupDatabase(db, dbPath);

    if (!dbExists) {
      Logger.debug("Creating new database with initial schema...");
      createInitialSchema(db);
    } else {
      Logger.debug("Database file exists, checking for needed migrations...");
      up_v1_4_0(db);
      up_v1_5_0(db);
      up_v1_5_0_public(db);
      up_v1_5_0_oidc(db);
      up_v1_5_0_usernames(db);
      up_v1_5_1_api_keys(db);
      up_v1_6_0_snippet_expiry(db);
      up_v1_7_0_snippet_pin_favorite(db);
      up_v1_8_0_pagination(db);
      up_v1_9_0_admin_fields(db);
      up_v1_9_0_cascade_delete(db);
      up_v1_9_0_user_settings(db);
      Logger.debug("All migrations applied successfully");
    }
  } catch (error) {
    db.close();
    throw error;
  }

  return db;
}

export {
  openSqliteDatabase,
  checkpointSqlite,
  getDataDirectory,
  getDatabasePath,
  sqliteDatabaseExists,
};
