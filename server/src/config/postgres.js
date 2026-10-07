import fs from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import Logger from "../logger.js";
import { PostgresAdapter } from "./adapters/postgresAdapter.js";
import { describePostgresTarget } from "./postgresConfig.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SCHEMA_LOCK_ID = 1113150548;
const MAX_CONNECT_ATTEMPTS = 30;
const CONNECT_RETRY_DELAY_MS = 2000;
const RETRYABLE_CODES = new Set([
  "ECONNREFUSED",
  "ECONNRESET",
  "ENOTFOUND",
  "EAI_AGAIN",
  "ETIMEDOUT",
  "EHOSTUNREACH",
  "57P03",
]);

function isRetryable(error) {
  return (
    RETRYABLE_CODES.has(error?.code) ||
    /timeout|terminated unexpectedly/i.test(error?.message || "")
  );
}

async function waitForConnection(adapter, target) {
  for (let attempt = 1; ; attempt++) {
    try {
      await adapter.withClient((client) => client.query("SELECT 1"));
      return;
    } catch (error) {
      if (!isRetryable(error) || attempt >= MAX_CONNECT_ATTEMPTS) {
        throw error;
      }
      Logger.info(
        `PostgreSQL at ${target} is not reachable yet (${error.code || error.message}), retrying (${attempt}/${MAX_CONNECT_ATTEMPTS})...`
      );
      await new Promise((resolve) => setTimeout(resolve, CONNECT_RETRY_DELAY_MS));
    }
  }
}

async function applySchema(adapter) {
  const schemaSql = fs.readFileSync(
    join(__dirname, "schema/init.postgres.sql"),
    "utf8"
  );

  await adapter.withClient(async (client) => {
    await client.query("BEGIN");
    try {
      await client.query("SELECT pg_advisory_xact_lock($1)", [SCHEMA_LOCK_ID]);
      await client.query(schemaSql);
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK").catch(() => {});
      throw error;
    }
  });
}

async function openPostgresDatabase(config) {
  const target = describePostgresTarget(config);
  Logger.info(`Using PostgreSQL database at ${target}`);

  const adapter = new PostgresAdapter(config);
  try {
    await waitForConnection(adapter, target);
    await applySchema(adapter);
  } catch (error) {
    await adapter.close().catch(() => {});
    throw error;
  }

  return adapter;
}

export { openPostgresDatabase };
