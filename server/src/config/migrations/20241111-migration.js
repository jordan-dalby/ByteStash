import Logger from '../../logger.js';

function needsMigration(db) {
  const hasCodeColumn = db.prepare(`
    SELECT COUNT(*) as count 
    FROM pragma_table_info('snippets') 
    WHERE name = 'code'
  `).get().count > 0;

  return hasCodeColumn;
}

async function up_v1_4_0(db) {
  if (!needsMigration(db)) {
    Logger.debug('v1.4.0 - Migration not necessary');
    return;
  }
  
  Logger.debug('v1.4.0 - Starting migration to fragments...');
  
  db.pragma('foreign_keys = OFF');
  
  try {
    db.transaction(() => {
      db.exec(`
        CREATE TABLE IF NOT EXISTS fragments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          snippet_id INTEGER NOT NULL,
          file_name TEXT NOT NULL,
          code TEXT NOT NULL,
          language TEXT NOT NULL,
          position INTEGER NOT NULL,
          FOREIGN KEY (snippet_id) REFERENCES snippets(id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_fragments_snippet_id ON fragments(snippet_id);
      
        CREATE TABLE IF NOT EXISTS shared_snippets (
          id TEXT PRIMARY KEY,
          snippet_id INTEGER NOT NULL,
          requires_auth BOOLEAN NOT NULL DEFAULT false,
          expires_at DATETIME,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (snippet_id) REFERENCES snippets(id) ON DELETE CASCADE
        );
      
        CREATE INDEX IF NOT EXISTS idx_shared_snippets_snippet_id ON shared_snippets(snippet_id);
      `);

      const snippets = db.prepare('SELECT id, code, language FROM snippets').all();
      const insertFragment = db.prepare(
        'INSERT INTO fragments (snippet_id, file_name, code, language, position) VALUES (?, ?, ?, ?, ?)'
      );

      for (const snippet of snippets) {
        insertFragment.run(snippet.id, 'main', snippet.code || '', snippet.language || 'plaintext', 0);
      }

      db.exec(`
        CREATE TABLE snippets_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          description TEXT,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        INSERT INTO snippets_new (id, title, description, updated_at)
        SELECT id, title, description, updated_at FROM snippets;

        DROP TABLE snippets;
        ALTER TABLE snippets_new RENAME TO snippets;
      `);
    })();

    Logger.debug('v1.4.0 - Migration completed successfully');
  } catch (error) {
    Logger.error('v1.4.0 - Migration failed:', error);
    throw error;
  } finally {
    db.pragma('foreign_keys = ON');
  }
}

export { up_v1_4_0 };
