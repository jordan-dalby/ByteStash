import Logger from "../logger.js";
import {
  openSqliteDatabase,
  checkpointSqlite,
  getDataDirectory,
  sqliteDatabaseExists,
} from "./sqlite.js";
import { SqliteAdapter } from "./adapters/sqliteAdapter.js";
import { getPostgresConfig } from "./postgresConfig.js";
import { openPostgresDatabase } from "./postgres.js";
import {
  migrateSqliteToPostgres,
  isPostgresPopulated,
} from "./sqliteToPostgres.js";

let db = null;
let sqliteDb = null;
let checkpointInterval = null;

function checkpointDatabase() {
  if (!sqliteDb) return;
  checkpointSqlite(sqliteDb);
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

function initializeSqlite() {
  sqliteDb = openSqliteDatabase();
  startCheckpointInterval();
  return new SqliteAdapter(sqliteDb);
}

async function initializePostgres(config) {
  const adapter = await openPostgresDatabase(config);

  try {
    if (process.env.MIGRATE_SQLITE_TO_POSTGRES === "true") {
      if (await isPostgresPopulated(adapter)) {
        Logger.info(
          "MIGRATE_SQLITE_TO_POSTGRES is set but PostgreSQL already contains data, skipping the SQLite import"
        );
      } else if (!sqliteDatabaseExists()) {
        Logger.info(
          "MIGRATE_SQLITE_TO_POSTGRES is set but no SQLite database was found, skipping the import"
        );
      } else {
        await migrateSqliteToPostgres(adapter);
      }
    } else if (sqliteDatabaseExists() && !(await isPostgresPopulated(adapter))) {
      Logger.info(
        "An existing SQLite database was found and PostgreSQL is empty. " +
          "Set MIGRATE_SQLITE_TO_POSTGRES=true or run `node src/scripts/migrateToPostgres.js` to copy your data across."
      );
    }
  } catch (error) {
    await adapter.close().catch(() => {});
    throw error;
  }

  return adapter;
}

async function initializeDatabase() {
  try {
    const postgresConfig = getPostgresConfig();

    db = postgresConfig
      ? await initializePostgres(postgresConfig)
      : initializeSqlite();

    Logger.debug("Database initialization completed successfully");
    return db;
  } catch (error) {
    Logger.error("Database initialization error:", error);
    throw error;
  }
}

function getDb() {
  if (!db) {
    throw new Error(
      "Database not initialized. Call initializeDatabase() first."
    );
  }
  return db;
}

async function shutdownDatabase() {
  if (!db) return;

  const current = db;
  db = null;

  try {
    if (sqliteDb) {
      Logger.debug("Performing final database checkpoint...");
      current.checkpoint("TRUNCATE");
      stopCheckpointInterval();
      sqliteDb = null;
    }

    await current.close();
    Logger.debug("Database shutdown completed successfully");
  } catch (error) {
    Logger.error("Error during database shutdown:", error);
    throw error;
  }
}

export {
  initializeDatabase,
  getDb,
  shutdownDatabase,
  checkpointDatabase,
  getDataDirectory,
};
