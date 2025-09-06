import Logger from "../../logger.js";

function needsMigration(db) {
  try {
    const hasPinnedColumn = db
      .prepare(
        `SELECT COUNT(*) as count FROM pragma_table_info('snippets') WHERE name = 'is_pinned'`
      )
      .get();
    const hasFavoriteColumn = db
      .prepare(
        `SELECT COUNT(*) as count FROM pragma_table_info('snippets') WHERE name = 'is_favorite'`
      )
      .get();
    return hasPinnedColumn.count === 0 || hasFavoriteColumn.count === 0;
  } catch (error) {
    Logger.error(
      "v1.7.0-snippet-pin-favorite - Error checking migration status:",
      error
    );
    throw error;
  }
}

async function up_v1_7_0_snippet_pin_favorite(db) {
  if (!needsMigration(db)) {
    Logger.debug("v1.7.0-snippet-pin-favorite - Migration not needed");
    return;
  }

  Logger.debug("v1.7.0-snippet-pin-favorite - Starting migration...");

  try {
    // Add is_pinned column if not exists
    const hasPinnedColumn = db
      .prepare(
        `SELECT COUNT(*) as count FROM pragma_table_info('snippets') WHERE name = 'is_pinned'`
      )
      .get();
    if (hasPinnedColumn.count === 0) {
      db.exec(`ALTER TABLE snippets ADD COLUMN is_pinned INTEGER DEFAULT 0;`);
      Logger.debug("v1.7.0-snippet-pin-favorite - Added is_pinned column");
    }

    // Add is_favorite column if not exists
    const hasFavoriteColumn = db
      .prepare(
        `SELECT COUNT(*) as count FROM pragma_table_info('snippets') WHERE name = 'is_favorite'`
      )
      .get();
    if (hasFavoriteColumn.count === 0) {
      db.exec(`ALTER TABLE snippets ADD COLUMN is_favorite INTEGER DEFAULT 0;`);
      Logger.debug("v1.7.0-snippet-pin-favorite - Added is_favorite column");
    }

    Logger.debug(
      "v1.7.0-snippet-pin-favorite - Migration completed successfully"
    );
  } catch (error) {
    Logger.error("v1.7.0-snippet-pin-favorite - Migration failed:", error);
    throw error;
  }
}

export { up_v1_7_0_snippet_pin_favorite };
