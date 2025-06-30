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
    this.moveToRecycleBinStmt = null;
    this.deleteSnippetStmt = null;
    this.selectFragmentsStmt = null;
    this.selectAllDeletedStmt = null;
    this.deleteExpiredSnippetsStmt = null;
    this.restoreSnippetStmt = null;
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
        WHERE s.user_id = ? AND s.expiry_date IS NULL
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
        WHERE s.is_public = 1 AND s.expiry_date IS NULL 
        GROUP BY s.id
        ORDER BY s.updated_at DESC
      `);

      this.insertSnippetStmt = db.prepare(`
        INSERT INTO snippets (
          title, 
          description, 
          updated_at,
          expiry_date,
          user_id,
          is_public
        ) VALUES (?, ?, datetime('now', 'utc'),NULL, ?, ?)
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

      this.restoreSnippetStmt = db.prepare(`
        UPDATE snippets
        SET expiry_date = NULL
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

      this.selectAllDeletedStmt = db.prepare(`
        SELECT 
          s.id,
          s.title,
          s.description,
          datetime(s.updated_at) || 'Z' as updated_at,
          datetime(s.expiry_date) || 'Z' as expiry_date,
          s.user_id,
          s.is_public,
          u.username,
          GROUP_CONCAT(DISTINCT c.name) as categories,
          (SELECT COUNT(*) FROM shared_snippets WHERE snippet_id = s.id) as share_count
        FROM snippets s
        LEFT JOIN categories c ON s.id = c.snippet_id
        LEFT JOIN users u ON s.user_id = u.id
        WHERE s.user_id = ? AND s.expiry_date IS NOT NULL
        GROUP BY s.id
        ORDER BY s.updated_at DESC
      `);

      this.deleteExpiredSnippetsStmt = db.prepare(`
        DELETE FROM snippets
        WHERE expiry_date IS NOT NULL AND datetime(expiry_date) <= datetime(?, 'utc')
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
        WHERE s.id = ? AND (s.user_id = ? OR s.is_public = 1) AND s.expiry_date IS NULL
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
        WHERE s.id = ? AND s.is_public = TRUE AND s.expiry_date IS NULL
        GROUP BY s.id
      `);

      this.moveToRecycleBinStmt = db.prepare(`
        UPDATE snippets
        SET expiry_date = datetime('now', '+30 days')
        WHERE id = ? AND user_id = ?
      `);


      this.deleteSnippetStmt = db.prepare(`
        DELETE FROM snippets 
        WHERE id = ? AND user_id = ?
        RETURNING *                            
      `);        // returns the deleted snippet 

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

  create({ title, description, categories = [], fragments = [], userId, isPublic = 0 }) {
    this.#initializeStatements();
    try {
      const db = getDb();
      
      return db.transaction(() => {
        const insertResult = this.insertSnippetStmt.run(title, description, userId, isPublic ? 1 : 0);
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
        this.updateSnippetStmt.run(title, description, isPublic ? 1 : 0, id, userId);
        
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

  restore(id,userId) {
    this.#initializeStatements();
    try {
      const db = getDb();
      return db.transaction(() => {
        this.restoreSnippetStmt.run(id, userId);
      })();
    } catch (error) {
      Logger.error('Error in restore:', error);
      throw error;
    } 
  }

  moveToRecycle(id,userId) {
    this.#initializeStatements();
    try{
      const db = getDb();
      return db.transaction(() => {
        const snippet = this.selectByIdStmt.get(id,userId);
        if(snippet) {
          this.moveToRecycleBinStmt.run(id,userId);
          return this.#processSnippet(snippet);
        }
        return null;
      })();
    }catch (error){
      Logger.error('Error in moving to recycle:', error);
      throw error;
    }
  }

  findAllDeleted(userId) {
    this.#initializeStatements();
    try {
      const deletedSnippets = this.selectAllDeletedStmt.all(userId);
      return deletedSnippets.map(this.#processSnippet.bind(this));
    } catch (error) {
      Logger.error('Error in findAllDeleted:', error);
      throw error;
    }
  }

  delete(id, userId) {
    this.#initializeStatements();
    try {
      const db = getDb();

      return db.transaction(() => {
        const deletedSnippet = this.deleteSnippetStmt.get(id, userId); // get() will return deleted row
        return deletedSnippet ? this.#processSnippet(deletedSnippet) : null;
      })();
    } catch (error) {
      Logger.error('Error in delete:', error);
      throw error;
    }
  }


  deleteExpired() {
    this.#initializeStatements();
    try {
      const db = getDb();
      const currentTime = new Date().toISOString();
      db.transaction(() => {
        this.deleteExpiredSnippetsStmt.run(currentTime);
      })();
    } catch (error) {
      Logger.error('Error in deleteExpired:', error);
      throw error;
    }
  }

  findById(id, userId = null) {
    this.#initializeStatements();
    try {
      if (userId != null) {
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