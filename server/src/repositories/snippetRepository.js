import { getDb } from '../config/database.js';
import Logger from '../logger.js';

class SnippetRepository {
  constructor() {
    this.selectAllStmt = null;
    this.selectPublicStmt = null;
    this.insertSnippetStmt = null;
    this.insertFragmentStmt = null;
    this.insertCategoryStmt = null;
    this.updateSnippetStmt = null;
    this.deleteFragmentsStmt = null;
    this.deleteCategoriesStmt = null;
    this.selectByIdStmt = null;
    this.selectPublicByIdStmt = null;
    this.deleteSnippetStmt = null;
    this.selectFragmentsStmt = null;
  }

  #initializeStatements() {
    const db = getDb();
    
    if (!this.selectAllStmt) {
      this.selectAllStmt = db.prepare(`
        SELECT 
          s.id,
          s.title,
          s.description,
          datetime(s.updated_at) || 'Z' as updated_at,
          s.user_id,
          s.is_public,
          u.username,
          GROUP_CONCAT(DISTINCT c.name) as categories,
          (SELECT COUNT(*) FROM shared_snippets WHERE snippet_id = s.id) as share_count
        FROM snippets s
        LEFT JOIN categories c ON s.id = c.snippet_id
        LEFT JOIN users u ON s.user_id = u.id
        WHERE s.user_id = ?
        GROUP BY s.id
        ORDER BY s.updated_at DESC
      `);

      this.selectPublicStmt = db.prepare(`
        SELECT 
          s.id,
          s.title,
          s.description,
          datetime(s.updated_at) || 'Z' as updated_at,
          s.user_id,
          s.is_public,
          u.username,
          GROUP_CONCAT(DISTINCT c.name) as categories,
          (SELECT COUNT(*) FROM shared_snippets WHERE snippet_id = s.id) as share_count
        FROM snippets s
        LEFT JOIN categories c ON s.id = c.snippet_id
        LEFT JOIN users u ON s.user_id = u.id
        WHERE s.is_public = TRUE
        GROUP BY s.id
        ORDER BY s.updated_at DESC
      `);

      this.insertSnippetStmt = db.prepare(`
        INSERT INTO snippets (
          title, 
          description, 
          updated_at,
          user_id,
          is_public
        ) VALUES (?, ?, datetime('now', 'utc'), ?, ?)
      `);

      this.insertFragmentStmt = db.prepare(`
        INSERT INTO fragments (
          snippet_id,
          file_name,
          code,
          language,
          position
        ) VALUES (?, ?, ?, ?, ?)
      `);

      this.insertCategoryStmt = db.prepare(`
        INSERT INTO categories (snippet_id, name) VALUES (?, ?)
      `);

      this.updateSnippetStmt = db.prepare(`
        UPDATE snippets 
        SET title = ?, 
            description = ?,
            updated_at = datetime('now', 'utc'),
            is_public = ?
        WHERE id = ? AND user_id = ?
      `);

      this.deleteFragmentsStmt = db.prepare(`
        DELETE FROM fragments 
        WHERE snippet_id = ? 
        AND EXISTS (
          SELECT 1 FROM snippets 
          WHERE snippets.id = fragments.snippet_id 
          AND snippets.user_id = ?
        )
      `);

      this.deleteCategoriesStmt = db.prepare(`
        DELETE FROM categories 
        WHERE snippet_id = ?
        AND EXISTS (
          SELECT 1 FROM snippets 
          WHERE snippets.id = categories.snippet_id 
          AND snippets.user_id = ?
        )
      `);

      this.selectByIdStmt = db.prepare(`
        SELECT 
          s.id,
          s.title,
          s.description,
          datetime(s.updated_at) || 'Z' as updated_at,
          s.user_id,
          s.is_public,
          u.username,
          GROUP_CONCAT(DISTINCT c.name) as categories,
          (SELECT COUNT(*) FROM shared_snippets WHERE snippet_id = s.id) as share_count
        FROM snippets s
        LEFT JOIN categories c ON s.id = c.snippet_id
        LEFT JOIN users u ON s.user_id = u.id
        WHERE s.id = ? AND (s.user_id = ? OR s.is_public = TRUE)
        GROUP BY s.id
      `);

      this.selectPublicByIdStmt = db.prepare(`
        SELECT 
          s.id,
          s.title,
          s.description,
          datetime(s.updated_at) || 'Z' as updated_at,
          s.user_id,
          s.is_public,
          u.username,
          GROUP_CONCAT(DISTINCT c.name) as categories,
          (SELECT COUNT(*) FROM shared_snippets WHERE snippet_id = s.id) as share_count
        FROM snippets s
        LEFT JOIN categories c ON s.id = c.snippet_id
        LEFT JOIN users u ON s.user_id = u.id
        WHERE s.id = ? AND s.is_public = TRUE
        GROUP BY s.id
      `);

      this.deleteSnippetStmt = db.prepare(`
        DELETE FROM snippets 
        WHERE id = ? AND user_id = ?
      `);

      this.selectFragmentsStmt = db.prepare(`
        SELECT id, file_name, code, language, position
        FROM fragments
        WHERE snippet_id = ?
        ORDER BY position
      `);
    }
  }

  #processSnippet(snippet) {
    if (!snippet) return null;

    const fragments = this.selectFragmentsStmt.all(snippet.id);
    
    return {
      ...snippet,
      categories: snippet.categories ? snippet.categories.split(',') : [],
      fragments: fragments.sort((a, b) => a.position - b.position),
      share_count: snippet.share_count || 0
    };
  }

  findAll(userId) {
    this.#initializeStatements();
    try {
      const snippets = this.selectAllStmt.all(userId);
      return snippets.map(this.#processSnippet.bind(this));
    } catch (error) {
      Logger.error('Error in findAll:', error);
      throw error;
    }
  }

  findAllPublic() {
    this.#initializeStatements();
    try {
      const snippets = this.selectPublicStmt.all();
      return snippets.map(this.#processSnippet.bind(this));
    } catch (error) {
      Logger.error('Error in findAllPublic:', error);
      throw error;
    }
  }

  create({ title, description, categories = [], fragments = [], userId, isPublic = false }) {
    this.#initializeStatements();
    try {
      const db = getDb();
      
      return db.transaction(() => {
        const insertResult = this.insertSnippetStmt.run(title, description, userId, isPublic);
        const snippetId = insertResult.lastInsertRowid;
        
        fragments.forEach((fragment, index) => {
          this.insertFragmentStmt.run(
            snippetId,
            fragment.file_name || `file${index + 1}`,
            fragment.code || '',
            fragment.language || 'plaintext',
            fragment.position || index
          );
        });
        
        if (categories.length > 0) {
          for (const category of categories) {
            if (category.trim()) {
              this.insertCategoryStmt.run(snippetId, category.trim().toLowerCase());
            }
          }
        }
        
        const created = this.selectByIdStmt.get(snippetId, userId);
        return this.#processSnippet(created);
      })();
    } catch (error) {
      Logger.error('Error in create:', error);
      throw error;
    }
  }

  update(id, { title, description, categories = [], fragments = [], isPublic = 0 }, userId) {
    this.#initializeStatements();
    try {
      const db = getDb();
      
      return db.transaction(() => {
        this.updateSnippetStmt.run(title, description, isPublic, id, userId);
        
        this.deleteFragmentsStmt.run(id, userId);
        fragments.forEach((fragment, index) => {
          this.insertFragmentStmt.run(
            id,
            fragment.file_name || `file${index + 1}`,
            fragment.code || '',
            fragment.language || 'plaintext',
            fragment.position || index
          );
        });
        
        this.deleteCategoriesStmt.run(id, userId);
        for (const category of categories) {
          if (category.trim()) {
            this.insertCategoryStmt.run(id, category.trim().toLowerCase());
          }
        }
        
        const updated = this.selectByIdStmt.get(id, userId);
        return this.#processSnippet(updated);
      })();
    } catch (error) {
      Logger.error('Error in update:', error);
      throw error;
    }
  }

  delete(id, userId) {
    this.#initializeStatements();
    try {
      const db = getDb();
      
      return db.transaction(() => {
        const snippet = this.selectByIdStmt.get(id, userId);
        if (snippet) {
          this.deleteSnippetStmt.run(id, userId);
          return this.#processSnippet(snippet);
        }
        return null;
      })();
    } catch (error) {
      Logger.error('Error in delete:', error);
      throw error;
    }
  }

  findById(id, userId = null) {
    this.#initializeStatements();
    try {
      if (userId) {
        const snippet = this.selectByIdStmt.get(id, userId);
        return this.#processSnippet(snippet);
      }
      
      const snippet = this.selectPublicByIdStmt.get(id);
      return this.#processSnippet(snippet);
    } catch (error) {
      Logger.error('Error in findById:', error);
      throw error;
    }
  }
}

export default new SnippetRepository();