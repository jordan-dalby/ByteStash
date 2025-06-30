CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    username_normalized TEXT,
    password_hash TEXT NOT NULL,
    oidc_id TEXT,
    oidc_provider TEXT,
    email TEXT,
    name TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS snippets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expiry_date DATETIME DEFAULT NULL,
    user_id INTEGER REFERENCES users (id),
    is_public BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    snippet_id INTEGER,
    name TEXT NOT NULL,
    FOREIGN KEY (snippet_id) REFERENCES snippets (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS fragments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    snippet_id INTEGER NOT NULL,
    file_name TEXT NOT NULL,
    code TEXT NOT NULL,
    language TEXT NOT NULL,
    position INTEGER NOT NULL,
    FOREIGN KEY (snippet_id) REFERENCES snippets (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS shared_snippets (
    id TEXT PRIMARY KEY,
    snippet_id INTEGER NOT NULL,
    requires_auth BOOLEAN NOT NULL DEFAULT false,
    expires_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (snippet_id) REFERENCES snippets (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS api_keys (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    key TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_used_at DATETIME,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users (username);

CREATE INDEX IF NOT EXISTS idx_snippets_user_id ON snippets (user_id);

CREATE INDEX IF NOT EXISTS idx_categories_snippet_id ON categories (snippet_id);

CREATE INDEX IF NOT EXISTS idx_fragments_snippet_id ON fragments (snippet_id);

CREATE INDEX IF NOT EXISTS idx_shared_snippets_snippet_id ON shared_snippets (snippet_id);

CREATE INDEX idx_snippets_is_public ON snippets (is_public);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username_normalized ON users (
    username_normalized COLLATE NOCASE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_oidc ON users (oidc_id, oidc_provider)
WHERE
    oidc_id IS NOT NULL
    AND oidc_provider IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys (user_id);

CREATE INDEX IF NOT EXISTS idx_api_keys_key ON api_keys (key);