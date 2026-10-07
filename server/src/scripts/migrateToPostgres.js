import { getPostgresConfig } from "../config/postgresConfig.js";
import { openPostgresDatabase } from "../config/postgres.js";
import { migrateSqliteToPostgres } from "../config/sqliteToPostgres.js";

async function main() {
  const args = process.argv.slice(2);
  const unknown = args.filter((arg) => arg !== "--force");

  if (unknown.length > 0) {
    console.error(`Unknown argument(s): ${unknown.join(" ")}`);
    console.error("Usage: node src/scripts/migrateToPostgres.js [--force]");
    process.exit(2);
  }

  const config = getPostgresConfig();
  if (!config) {
    console.error(
      "PostgreSQL is not configured. Set DATABASE_URL or POSTGRES_HOST before running the migration."
    );
    process.exit(2);
  }

  const adapter = await openPostgresDatabase(config);
  try {
    const result = await migrateSqliteToPostgres(adapter, {
      force: args.includes("--force"),
    });

    if (!result.migrated) {
      console.error(
        "PostgreSQL already contains data. Re-run with --force to replace it with the SQLite data."
      );
      process.exitCode = 1;
    }
  } finally {
    await adapter.close();
  }
}

main().catch((error) => {
  console.error("Migration failed:", error.message);
  process.exit(1);
});
