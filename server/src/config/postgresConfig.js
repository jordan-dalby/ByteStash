import fs from "fs";

function readSetting(name) {
  const filePath = (process.env[`${name}_FILE`] || "").trim();
  if (filePath) {
    try {
      return fs.readFileSync(filePath, "utf8").trim();
    } catch (error) {
      throw new Error(`Could not read ${name}_FILE at ${filePath}: ${error.message}`);
    }
  }
  return (process.env[name] || "").trim();
}

function getSslConfig() {
  const mode = (process.env.POSTGRES_SSL || "").trim().toLowerCase();

  if (["true", "1", "require", "verify-full"].includes(mode)) {
    return { rejectUnauthorized: true };
  }
  if (mode === "no-verify") {
    // nosemgrep: problem-based-packs.insecure-transport.js-node.bypass-tls-verification.bypass-tls-verification
    return { rejectUnauthorized: false };
  }
  if (["false", "0", "disable"].includes(mode)) {
    return false;
  }
  if (mode) {
    throw new Error(
      `Invalid POSTGRES_SSL value "${mode}". Use true, no-verify or false.`
    );
  }
  return undefined;
}

function getPostgresConfig() {
  const connectionString = readSetting("DATABASE_URL");
  const host = readSetting("POSTGRES_HOST");

  if (!connectionString && !host) {
    return null;
  }

  const ssl = getSslConfig();
  const config = {};

  if (connectionString) {
    if (!/^postgres(ql)?:\/\//i.test(connectionString)) {
      throw new Error(
        "DATABASE_URL must be a PostgreSQL connection string starting with postgres:// or postgresql://"
      );
    }
    config.connectionString = connectionString;
  } else {
    const port = parseInt(readSetting("POSTGRES_PORT") || "5432", 10);
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      throw new Error("POSTGRES_PORT must be a valid port number");
    }
    config.host = host;
    config.port = port;
    config.user = readSetting("POSTGRES_USER") || "bytestash";
    config.password = readSetting("POSTGRES_PASSWORD");
    config.database = readSetting("POSTGRES_DB") || "bytestash";
  }

  if (ssl !== undefined) {
    config.ssl = ssl;
  }

  return config;
}

function describePostgresTarget(config) {
  if (config.connectionString) {
    try {
      const url = new URL(config.connectionString);
      return `${url.hostname}:${url.port || 5432}${url.pathname}`;
    } catch (error) {
      return "the configured DATABASE_URL";
    }
  }
  return `${config.host}:${config.port}/${config.database}`;
}

export { getPostgresConfig, describePostgresTarget };
