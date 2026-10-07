import { getDb } from '../config/database.js';
import crypto from 'crypto';
import Logger from '../logger.js';

class ShareRepository {
  async #processShare(db, share) {
    if (!share) return null;

    const fragments = await db.all(`
      SELECT id, file_name, code, language, position
      FROM fragments
      WHERE snippet_id = ?
      ORDER BY position, id
    `, [share.id]);

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
    const db = getDb();

    const snippetIdInt = parseInt(snippetId, 10);
    if (isNaN(snippetIdInt)) {
      throw new Error('Invalid snippet ID');
    }

    const owner = await db.get(
      `SELECT user_id FROM snippets WHERE id = ?`,
      [db.dialect.id(snippetIdInt)]
    );
    if (!owner || owner.user_id !== userId) {
      throw new Error('Unauthorized');
    }

    const shareId = crypto.randomBytes(16).toString('hex');

    try {
      await db.run(`
        INSERT INTO shared_snippets (
          id,
          snippet_id,
          requires_auth,
          expires_at
        ) VALUES (?, ?, ?, ${db.dialect.nowPlusSecondsParam()})
      `, [
        shareId,
        snippetIdInt,
        requiresAuth ? 1 : 0,
        Number.isFinite(expiresIn) && expiresIn >= 0 ? expiresIn : null
      ]);

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
    try {
      const db = getDb();
      const { dialect } = db;
      const share = await db.get(`
        SELECT
          ss.id as share_id,
          ss.requires_auth,
          ss.expires_at,
          ss.created_at,
          ${dialect.isPast('ss.expires_at')} as expired,
          s.id,
          s.title,
          s.description,
          s.user_id,
          ${dialect.utcString('s.updated_at')} as updated_at,
          ${dialect.groupConcatDistinct('c.name')} as categories
        FROM shared_snippets ss
        JOIN snippets s ON s.id = ss.snippet_id
        LEFT JOIN categories c ON s.id = c.snippet_id
        WHERE ss.id = ? AND s.expiry_date IS NULL
        GROUP BY s.id, ss.id
      `, [id]);
      return await this.#processShare(db, share);
    } catch (error) {
      Logger.error('Error in getShare:', error);
      throw error;
    }
  }

  async getSharesBySnippetId(snippetId, userId) {
    try {
      const db = getDb();
      const snippetIdInt = parseInt(snippetId, 10);
      if (isNaN(snippetIdInt)) {
        throw new Error('Invalid snippet ID');
      }
      return await db.all(`
        SELECT
          ss.*,
          ${db.dialect.isPast('ss.expires_at')} as expired
        FROM shared_snippets ss
        JOIN snippets s ON s.id = ss.snippet_id
        WHERE ss.snippet_id = ? AND s.user_id = ? AND s.expiry_date IS NULL
        ORDER BY ss.created_at DESC, ss.id ASC
      `, [db.dialect.id(snippetIdInt), userId]);
    } catch (error) {
      Logger.error('Error in getSharesBySnippetId:', error);
      throw error;
    }
  }

  async deleteShare(id, userId) {
    try {
      return await getDb().run(`
        DELETE FROM shared_snippets
        WHERE id = ?
        AND snippet_id IN (
          SELECT id FROM snippets WHERE user_id = ?
        )
      `, [id, userId]);
    } catch (error) {
      Logger.error('Error in deleteShare:', error);
      throw error;
    }
  }
}

export default new ShareRepository();
