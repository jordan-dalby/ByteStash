import { getDb } from '../config/database.js';
import crypto from 'crypto';
import Logger from '../logger.js';

class ShareRepository {
  constructor() {
    this.createShareStmt = null;
    this.getShareStmt = null;
    this.getSharesBySnippetIdStmt = null;
    this.deleteShareStmt = null;
    this.getSnippetOwnerStmt = null;
  }

  #initializeStatements() {
    const db = getDb();
    
    if (!this.createShareStmt) {
      this.createShareStmt = db.prepare(`
        INSERT INTO shared_snippets (
          id,
          snippet_id,
          requires_auth,
          expires_at
        ) VALUES (?, ?, ?, datetime('now', '+' || ? || ' seconds'))
      `);

      this.getShareStmt = db.prepare(`
        SELECT 
          ss.id as share_id,
          ss.requires_auth,
          ss.expires_at,
          ss.created_at,
          datetime(ss.expires_at) < datetime('now') as expired,
          s.id,
          s.title,
          s.description,
          s.user_id,
          datetime(s.updated_at) || 'Z' as updated_at,
          GROUP_CONCAT(DISTINCT c.name) as categories
        FROM shared_snippets ss
        JOIN snippets s ON s.id = ss.snippet_id
        LEFT JOIN categories c ON s.id = c.snippet_id
        WHERE ss.id = ? AND ss.expiry_date IS NULL
        GROUP BY s.id
      `);

      this.getSharesBySnippetIdStmt = db.prepare(`
        SELECT 
          ss.*,
          datetime(ss.expires_at) < datetime('now') as expired
        FROM shared_snippets ss
        JOIN snippets s ON s.id = ss.snippet_id
        WHERE ss.snippet_id = ? AND s.user_id = ? AND s.expiry_date IS NULL
        ORDER BY ss.created_at DESC
      `);

      this.deleteShareStmt = db.prepare(`
        DELETE FROM shared_snippets 
        WHERE id = ? 
        AND snippet_id IN (
          SELECT id FROM snippets WHERE user_id = ?
        )
      `);

      this.getSnippetOwnerStmt = db.prepare(`
        SELECT user_id FROM snippets WHERE id = ?
      `);

      this.getFragmentsStmt = db.prepare(`
        SELECT id, file_name, code, language, position
        FROM fragments
        WHERE snippet_id = ?
        ORDER BY position
      `);
    }
  }

  #processShare(share) {
    if (!share) return null;

    const fragments = this.getFragmentsStmt.all(share.id);
    
    return {
      id: share.id,
      title: share.title,
      description: share.description,
      updated_at: share.updated_at,
      categories: share.categories ? share.categories.split(',') : [],
      fragments: fragments.sort((a, b) => a.position - b.position),
      share: {
        id: share.share_id,
        requiresAuth: !!share.requires_auth,
        expiresAt: share.expires_at,
        createdAt: share.created_at,
        expired: !!share.expired,
      }
    };
  }

  async createShare({ snippetId, requiresAuth, expiresIn }, userId) {
    this.#initializeStatements();
    
    const snippetIdInt = parseInt(snippetId, 10);
    if (isNaN(snippetIdInt)) {
      throw new Error('Invalid snippet ID');
    }
    
    const owner = this.getSnippetOwnerStmt.get(snippetIdInt);
    if (!owner || owner.user_id !== userId) {
      throw new Error('Unauthorized');
    }

    const shareId = crypto.randomBytes(16).toString('hex');
    
    try {
      this.createShareStmt.run(
        shareId,
        snippetIdInt,
        requiresAuth ? 1 : 0,
        expiresIn
      );
      
      return {
        id: shareId,
        snippetId: snippetIdInt,
        requiresAuth,
        expiresIn
      };
    } catch (error) {
      Logger.error('Error in createShare:', error);
      throw error;
    }
  }

  async getShare(id) {
    this.#initializeStatements();
    try {
      const share = this.getShareStmt.get(id);
      return this.#processShare(share);
    } catch (error) {
      Logger.error('Error in getShare:', error);
      throw error;
    }
  }

  async getSharesBySnippetId(snippetId, userId) {
    this.#initializeStatements();
    try {
      const snippetIdInt = parseInt(snippetId, 10);
      if (isNaN(snippetIdInt)) {
        throw new Error('Invalid snippet ID');
      }
      return this.getSharesBySnippetIdStmt.all(snippetIdInt, userId);
    } catch (error) {
      Logger.error('Error in getSharesBySnippetId:', error);
      throw error;
    }
  }

  async deleteShare(id, userId) {
    this.#initializeStatements();
    try {
      return this.deleteShareStmt.run(id, userId);
    } catch (error) {
      Logger.error('Error in deleteShare:', error);
      throw error;
    }
  }
}

export default new ShareRepository();