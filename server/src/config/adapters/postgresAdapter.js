import pg from "pg";
import Logger from "../../logger.js";

const INT8_OID = 20;
const RAW_TEXT_OIDS = new Set([1082, 1114, 1184]);
const MIN_INT4 = -2147483648;
const MAX_INT4 = 2147483647;
const MAX_CACHED_QUERIES = 500;

const UTC_NOW = "(now() AT TIME ZONE 'utc')";

const types = {
  getTypeParser(oid, format) {
    if (format !== "binary") {
      if (oid === INT8_OID) {
        return (value) => Number(value);
      }
      if (RAW_TEXT_OIDS.has(oid)) {
        return (value) => value;
      }
    }
    return pg.types.getTypeParser(oid, format);
  },
};

function toId(value) {
  if (typeof value === "number") {
    return Number.isInteger(value) && value >= MIN_INT4 && value <= MAX_INT4
      ? value
      : null;
  }
  if (typeof value === "string" && /^-?\d{1,10}$/.test(value)) {
    const parsed = Number(value);
    return parsed >= MIN_INT4 && parsed <= MAX_INT4 ? parsed : null;
  }
  return null;
}

const postgresDialect = {
  name: "postgres",
  now: UTC_NOW,
  nowUtc: UTC_NOW,
  forUpdate: " FOR UPDATE",
  nowPlusDays: (days) => `${UTC_NOW} + interval '${Number(days)} days'`,
  nowPlusSecondsParam: () =>
    `${UTC_NOW} + CAST(? AS double precision) * interval '1 second'`,
  utcString: (column) => `to_char(${column}, 'YYYY-MM-DD HH24:MI:SS') || 'Z'`,
  groupConcatDistinct: (expression) =>
    `string_agg(DISTINCT ${expression}, ',')`,
  groupConcat: (expression, separator) =>
    `string_agg(${expression}, '${separator}')`,
  like: (column) => `${column} ILIKE ? ESCAPE ''`,
  equalsIgnoreCase: (column) => `LOWER(${column}) = LOWER(?)`,
  isPast: (column) =>
    `CASE WHEN ${column} IS NULL THEN NULL WHEN ${column} < ${UTC_NOW} THEN 1 ELSE 0 END`,
  notAfterIsoParam: (column) =>
    `${column} <= (CAST(? AS timestamptz) AT TIME ZONE 'utc')`,
  id: toId,
  isUniqueViolation: (error) => error?.code === "23505",
};

const queryCache = new Map();

function toPositional(sql) {
  let converted = queryCache.get(sql);
  if (converted === undefined) {
    let index = 0;
    converted = sql.replace(/\?/g, () => `$${++index}`);
    if (queryCache.size >= MAX_CACHED_QUERIES) {
      queryCache.clear();
    }
    queryCache.set(sql, converted);
  }
  return converted;
}

function bindParams(params) {
  return params.map((value) => {
    if (value === null || value === undefined) return null;
    if (typeof value === "string") {
      return value.includes("\u0000") ? value.replaceAll("\u0000", "") : value;
    }
    if (typeof value === "number" || typeof value === "bigint") return value;
    throw new TypeError(
      `PostgreSQL can only bind numbers, strings, bigints and null, received ${typeof value}`
    );
  });
}

function createQueryable(executor) {
  const query = (sql, params) => {
    Logger.debug(sql);
    return executor.query(toPositional(sql), bindParams(params));
  };

  return {
    dialect: postgresDialect,
    get: async (sql, params = []) => (await query(sql, params)).rows[0],
    all: async (sql, params = []) => (await query(sql, params)).rows,
    run: async (sql, params = []) => ({
      changes: (await query(sql, params)).rowCount ?? 0,
    }),
  };
}

class PostgresAdapter {
  constructor(config) {
    this.dialect = postgresDialect;
    this.pool = new pg.Pool({
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
      ...config,
      types,
    });
    this.pool.on("error", (error) => {
      Logger.error("Unexpected PostgreSQL connection error:", error);
    });

    const queryable = createQueryable(this.pool);
    this.get = queryable.get;
    this.all = queryable.all;
    this.run = queryable.run;
  }

  async #checkout() {
    const client = await this.pool.connect();
    const onError = (error) => {
      Logger.error("PostgreSQL connection error:", error);
    };
    client.on("error", onError);
    return {
      client,
      release: (failure) => {
        client.removeListener("error", onError);
        client.release(failure);
      },
    };
  }

  async withClient(fn) {
    const { client, release } = await this.#checkout();
    let failure;
    try {
      return await fn(client);
    } catch (error) {
      failure = error;
      throw error;
    } finally {
      release(failure);
    }
  }

  async transaction(fn) {
    const { client, release } = await this.#checkout();
    let broken;
    try {
      await client.query("BEGIN");
      const result = await fn(createQueryable(client));
      await client.query("COMMIT");
      return result;
    } catch (error) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError) {
        broken = rollbackError;
      }
      throw error;
    } finally {
      release(broken);
    }
  }

  async close() {
    await this.pool.end();
  }
}

export { PostgresAdapter, postgresDialect };
