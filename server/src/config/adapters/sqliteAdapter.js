const MAX_CACHED_STATEMENTS = 500;

const sqliteDialect = {
  name: "sqlite",
  now: "datetime('now')",
  nowUtc: "datetime('now', 'utc')",
  forUpdate: "",
  nowPlusDays: (days) => `datetime('now', '+${Number(days)} days')`,
  nowPlusSecondsParam: () => `datetime('now', '+' || ? || ' seconds')`,
  utcString: (column) => `datetime(${column}) || 'Z'`,
  groupConcatDistinct: (expression) => `GROUP_CONCAT(DISTINCT ${expression})`,
  groupConcat: (expression, separator) =>
    `GROUP_CONCAT(${expression}, '${separator}')`,
  like: (column) => `${column} LIKE ?`,
  equalsIgnoreCase: (column) => `${column} = ? COLLATE NOCASE`,
  isPast: (column) => `datetime(${column}) < datetime('now')`,
  notAfterIsoParam: (column) => `datetime(${column}) <= datetime(?, 'utc')`,
  id: (value) => value,
  isUniqueViolation: (error) =>
    error?.code === "SQLITE_CONSTRAINT" ||
    error?.code === "SQLITE_CONSTRAINT_UNIQUE" ||
    error?.code === "SQLITE_CONSTRAINT_PRIMARYKEY",
};

class SqliteAdapter {
  constructor(db) {
    this.db = db;
    this.dialect = sqliteDialect;
    this.statements = new Map();
    this.pending = 0;
    this.tail = Promise.resolve();
    this.tx = {
      dialect: sqliteDialect,
      get: async (sql, params = []) => this.#execute("get", sql, params),
      all: async (sql, params = []) => this.#execute("all", sql, params),
      run: async (sql, params = []) => this.#execute("run", sql, params),
    };
  }

  #prepare(sql) {
    let statement = this.statements.get(sql);
    if (!statement) {
      if (this.statements.size >= MAX_CACHED_STATEMENTS) {
        this.statements.clear();
      }
      statement = this.db.prepare(sql);
      this.statements.set(sql, statement);
    }
    return statement;
  }

  #execute(method, sql, params) {
    const statement = this.#prepare(sql);
    if (method === "run") {
      const result = statement.run(...params);
      return { changes: result.changes };
    }
    return statement[method](...params);
  }

  async #exclusive(fn) {
    const previous = this.tail;
    let release;
    this.tail = new Promise((resolve) => {
      release = resolve;
    });
    this.pending++;

    try {
      await previous;
      return await fn();
    } finally {
      this.pending--;
      release();
    }
  }

  #query(method, sql, params) {
    if (this.pending === 0) {
      return this.#execute(method, sql, params);
    }
    return this.#exclusive(() => this.#execute(method, sql, params));
  }

  async get(sql, params = []) {
    return this.#query("get", sql, params);
  }

  async all(sql, params = []) {
    return this.#query("all", sql, params);
  }

  async run(sql, params = []) {
    return this.#query("run", sql, params);
  }

  transaction(fn) {
    return this.#exclusive(async () => {
      this.db.exec("BEGIN");
      try {
        const result = await fn(this.tx);
        this.db.exec("COMMIT");
        return result;
      } catch (error) {
        if (this.db.inTransaction) {
          this.db.exec("ROLLBACK");
        }
        throw error;
      }
    });
  }

  checkpoint(mode = "PASSIVE") {
    this.db.pragma(`wal_checkpoint(${mode})`);
  }

  close() {
    this.statements.clear();
    this.db.close();
  }
}

export { SqliteAdapter, sqliteDialect };
