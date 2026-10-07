import { getDb } from '../config/database.js';
import Logger from '../logger.js';

async function count(db, sql, params = []) {
  return (await db.get(sql, params)).count;
}

class AdminRepository {
  async getStats() {
    try {
      const db = getDb();

      const totalUsers = await count(db, `SELECT COUNT(*) as count FROM users WHERE id != 0`);
      const internalUsers = await count(db, `SELECT COUNT(*) as count FROM users WHERE id != 0 AND oidc_id IS NULL`);
      const oidcUsers = await count(db, `SELECT COUNT(*) as count FROM users WHERE id != 0 AND oidc_id IS NOT NULL`);
      const totalSnippets = await count(db, `SELECT COUNT(*) as count FROM snippets`);
      const publicSnippets = await count(db, `SELECT COUNT(*) as count FROM snippets WHERE is_public = 1`);
      const activeApiKeys = await count(db, `SELECT COUNT(*) as count FROM api_keys WHERE is_active = 1`);
      const totalShares = await count(db, `SELECT COUNT(*) as count FROM shared_snippets`);

      return {
        users: {
          total: totalUsers,
          internal: internalUsers,
          oidc: oidcUsers
        },
        snippets: {
          total: totalSnippets,
          public: publicSnippets,
          private: totalSnippets - publicSnippets
        },
        apiKeys: {
          active: activeApiKeys
        },
        shares: {
          total: totalShares
        }
      };
    } catch (error) {
      Logger.error('Error getting admin stats:', error);
      throw error;
    }
  }

  async getAllUsers({ offset = 0, limit = 50, search = '', authType = '', isActive = '' }) {
    try {
      const db = getDb();
      const { dialect } = db;
      let query = `
        SELECT
          u.id, u.username, u.email, u.name, u.created_at, u.last_login_at,
          u.oidc_id, u.oidc_provider, u.is_admin, u.is_active,
          (SELECT COUNT(*) FROM snippets WHERE user_id = u.id) as snippet_count,
          (SELECT COUNT(*) FROM api_keys WHERE user_id = u.id) as api_key_count
        FROM users u
        WHERE u.id != 0
      `;
      let countQuery = `SELECT COUNT(*) as count FROM users u WHERE u.id != 0`;

      let filters = '';
      const filterParams = [];

      if (search) {
        filters += ` AND (${dialect.like('u.username')} OR ${dialect.like('u.email')} OR ${dialect.like('u.name')})`;
        const searchPattern = `%${search}%`;
        filterParams.push(searchPattern, searchPattern, searchPattern);
      }

      if (authType === 'internal') {
        filters += ` AND u.oidc_id IS NULL`;
      } else if (authType === 'oidc') {
        filters += ` AND u.oidc_id IS NOT NULL`;
      }

      if (isActive !== '') {
        filters += ` AND u.is_active = ?`;
        filterParams.push(isActive === 'true' ? 1 : 0);
      }

      query += `${filters} ORDER BY u.created_at DESC, u.id ASC LIMIT ? OFFSET ?`;
      countQuery += filters;

      const users = await db.all(query, [...filterParams, limit, offset]);
      const total = await count(db, countQuery, filterParams);

      return { users, total };
    } catch (error) {
      Logger.error('Error getting all users:', error);
      throw error;
    }
  }

  async getUserDetails(userId) {
    try {
      const db = getDb();
      const id = db.dialect.id(userId);

      const user = await db.get(`
        SELECT
          id, username, email, name, created_at,
          oidc_id, oidc_provider, is_admin, is_active, last_login_at
        FROM users
        WHERE id = ?
      `, [id]);
      if (!user) return null;

      const snippetCount = await count(db, `SELECT COUNT(*) as count FROM snippets WHERE user_id = ?`, [id]);
      const apiKeyCount = await count(db, `SELECT COUNT(*) as count FROM api_keys WHERE user_id = ?`, [id]);

      return {
        ...user,
        snippet_count: snippetCount,
        api_key_count: apiKeyCount
      };
    } catch (error) {
      Logger.error('Error getting user details:', error);
      throw error;
    }
  }

  async deleteUser(userId) {
    try {
      const db = getDb();
      const result = await db.run(
        `DELETE FROM users WHERE id = ? AND id != 0`,
        [db.dialect.id(userId)]
      );
      return result.changes > 0;
    } catch (error) {
      Logger.error('Error deleting user:', error);
      throw error;
    }
  }

  async toggleUserActive(userId) {
    try {
      const db = getDb();
      const result = await db.run(`
        UPDATE users
        SET is_active = CASE WHEN is_active = 0 THEN 1 ELSE 0 END
        WHERE id = ? AND id != 0
      `, [db.dialect.id(userId)]);
      if (result.changes === 0) {
        throw new Error('User not found or cannot be modified');
      }
      return this.getUserDetails(userId);
    } catch (error) {
      Logger.error('Error toggling user active status:', error);
      throw error;
    }
  }

  async getAllSnippets({ offset = 0, limit = 50, search = '', userId = '', isPublic = '', language = '', category = '' }) {
    try {
      const db = getDb();
      const { dialect } = db;
      let query = `
        SELECT
          s.id, s.title, s.description, s.updated_at, s.is_public,
          s.user_id, u.username,
          (SELECT COUNT(*) FROM fragments WHERE snippet_id = s.id) as fragment_count
        FROM snippets s
        LEFT JOIN users u ON s.user_id = u.id
        WHERE 1=1
      `;
      let countQuery = `
        SELECT COUNT(*) as count FROM snippets s
        WHERE 1=1
      `;

      let filters = '';
      const filterParams = [];

      if (search) {
        filters += ` AND (${dialect.like('s.title')} OR ${dialect.like('s.description')})`;
        const searchPattern = `%${search}%`;
        filterParams.push(searchPattern, searchPattern);
      }

      if (userId) {
        filters += ` AND s.user_id = ?`;
        filterParams.push(dialect.id(userId));
      }

      if (isPublic !== '') {
        filters += ` AND s.is_public = ?`;
        filterParams.push(isPublic === 'true' ? 1 : 0);
      }

      if (language) {
        filters += ` AND s.id IN (SELECT snippet_id FROM fragments WHERE language = ?)`;
        filterParams.push(language);
      }

      if (category) {
        filters += ` AND s.id IN (SELECT snippet_id FROM categories WHERE name = ?)`;
        filterParams.push(category);
      }

      query += `${filters} ORDER BY s.updated_at DESC, s.id ASC LIMIT ? OFFSET ?`;
      countQuery += filters;

      const snippets = await db.all(query, [...filterParams, limit, offset]);
      const total = await count(db, countQuery, filterParams);

      return { snippets, total };
    } catch (error) {
      Logger.error('Error getting all snippets:', error);
      throw error;
    }
  }

  async deleteSnippetPermanently(snippetId) {
    try {
      const db = getDb();
      const result = await db.run(
        `DELETE FROM snippets WHERE id = ?`,
        [db.dialect.id(snippetId)]
      );
      return result.changes > 0;
    } catch (error) {
      Logger.error('Error deleting snippet:', error);
      throw error;
    }
  }

  async changeSnippetOwner(snippetId, newUserId) {
    try {
      const db = getDb();
      const result = await db.run(
        `UPDATE snippets SET user_id = ? WHERE id = ?`,
        [newUserId, db.dialect.id(snippetId)]
      );
      if (result.changes === 0) {
        throw new Error('Snippet not found');
      }
      return true;
    } catch (error) {
      Logger.error('Error changing snippet owner:', error);
      throw error;
    }
  }

  async toggleSnippetPublic(snippetId) {
    try {
      const db = getDb();
      const result = await db.run(
        `UPDATE snippets SET is_public = CASE WHEN is_public = 1 THEN 0 ELSE 1 END WHERE id = ?`,
        [db.dialect.id(snippetId)]
      );
      if (result.changes === 0) {
        throw new Error('Snippet not found');
      }
      return true;
    } catch (error) {
      Logger.error('Error toggling snippet public status:', error);
      throw error;
    }
  }

  async getAllApiKeys({ offset = 0, limit = 50, userId = '' }) {
    try {
      const db = getDb();
      let query = `
        SELECT
          ak.id, ak.name, ak.created_at, ak.last_used_at, ak.is_active,
          ak.user_id, u.username
        FROM api_keys ak
        LEFT JOIN users u ON ak.user_id = u.id
        WHERE 1=1
      `;
      let countQuery = `SELECT COUNT(*) as count FROM api_keys ak WHERE 1=1`;

      let filters = '';
      const filterParams = [];

      if (userId) {
        filters += ` AND ak.user_id = ?`;
        filterParams.push(db.dialect.id(userId));
      }

      query += `${filters} ORDER BY ak.created_at DESC, ak.id ASC LIMIT ? OFFSET ?`;
      countQuery += filters;

      const apiKeys = await db.all(query, [...filterParams, limit, offset]);
      const total = await count(db, countQuery, filterParams);

      return { apiKeys, total };
    } catch (error) {
      Logger.error('Error getting all API keys:', error);
      throw error;
    }
  }

  async deleteApiKey(keyId) {
    try {
      const db = getDb();
      const result = await db.run(
        `DELETE FROM api_keys WHERE id = ?`,
        [db.dialect.id(keyId)]
      );
      return result.changes > 0;
    } catch (error) {
      Logger.error('Error deleting API key:', error);
      throw error;
    }
  }

  async getAllShares({ offset = 0, limit = 50, userId = '', requiresAuth = '' }) {
    try {
      const db = getDb();
      let query = `
        SELECT
          ss.id, ss.requires_auth, ss.expires_at, ss.created_at,
          ss.snippet_id, s.title as snippet_title,
          s.user_id, u.username
        FROM shared_snippets ss
        LEFT JOIN snippets s ON ss.snippet_id = s.id
        LEFT JOIN users u ON s.user_id = u.id
        WHERE 1=1
      `;
      let countQuery = `
        SELECT COUNT(*) as count
        FROM shared_snippets ss
        LEFT JOIN snippets s ON ss.snippet_id = s.id
        WHERE 1=1
      `;

      let filters = '';
      const filterParams = [];

      if (userId) {
        filters += ` AND s.user_id = ?`;
        filterParams.push(db.dialect.id(userId));
      }

      if (requiresAuth !== '') {
        filters += ` AND ss.requires_auth = ?`;
        filterParams.push(requiresAuth === 'true' ? 1 : 0);
      }

      query += `${filters} ORDER BY ss.created_at DESC, ss.id ASC LIMIT ? OFFSET ?`;
      countQuery += filters;

      const shares = await db.all(query, [...filterParams, limit, offset]);
      const total = await count(db, countQuery, filterParams);

      return { shares, total };
    } catch (error) {
      Logger.error('Error getting all shares:', error);
      throw error;
    }
  }

  async deleteShare(shareId) {
    try {
      const result = await getDb().run(
        `DELETE FROM shared_snippets WHERE id = ?`,
        [shareId]
      );
      return result.changes > 0;
    } catch (error) {
      Logger.error('Error deleting share:', error);
      throw error;
    }
  }

  async scanSnippetsForOffensiveContent(badWordsChecker) {
    try {
      const db = getDb();

      // Get all snippets with their fragments
      const query = `
        SELECT
          s.id, s.title, s.description, s.updated_at, s.is_public,
          s.user_id, u.username,
          ${db.dialect.groupConcat("f.code || ' ' || f.file_name", '|||')} as fragments_content,
          COUNT(f.id) as fragment_count
        FROM snippets s
        LEFT JOIN users u ON s.user_id = u.id
        LEFT JOIN fragments f ON s.id = f.snippet_id
        GROUP BY s.id, u.id
        ORDER BY s.updated_at DESC, s.id ASC
      `;

      const snippets = await db.all(query);
      const flaggedSnippets = [];

      for (const snippet of snippets) {
        const textToCheck = [
          snippet.title || '',
          snippet.description || '',
          snippet.fragments_content || ''
        ].join(' ');

        const foundWords = badWordsChecker.findBadWords(textToCheck);

        if (foundWords.length > 0) {
          flaggedSnippets.push({
            id: snippet.id,
            title: snippet.title,
            description: snippet.description,
            updated_at: snippet.updated_at,
            is_public: snippet.is_public,
            user_id: snippet.user_id,
            username: snippet.username,
            fragment_count: snippet.fragment_count,
            flagged_words: foundWords
          });
        }
      }

      return {
        snippets: flaggedSnippets,
        total: flaggedSnippets.length
      };
    } catch (error) {
      Logger.error('Error scanning snippets for offensive content:', error);
      throw error;
    }
  }

  async getSnippetDetails(snippetId) {
    try {
      const db = getDb();
      const { dialect } = db;
      const id = dialect.id(snippetId);

      // Get snippet with full details (bypassing permission checks for admin)
      const query = `
        SELECT
          s.id,
          s.title,
          s.description,
          ${dialect.utcString('s.updated_at')} as updated_at,
          s.user_id,
          s.is_public,
          s.is_pinned,
          s.is_favorite,
          u.username,
          ${dialect.groupConcatDistinct('c.name')} as categories,
          (SELECT COUNT(*) FROM shared_snippets WHERE snippet_id = s.id) as share_count
        FROM snippets s
        LEFT JOIN categories c ON s.id = c.snippet_id
        LEFT JOIN users u ON s.user_id = u.id
        WHERE s.id = ?
        GROUP BY s.id, u.id
      `;

      const snippet = await db.get(query, [id]);

      if (!snippet) {
        return null;
      }

      // Get fragments
      const fragments = await db.all(`
        SELECT id, file_name, code, language, position
        FROM fragments
        WHERE snippet_id = ?
        ORDER BY position, id
      `, [id]);

      return {
        ...snippet,
        categories: snippet.categories ? snippet.categories.split(',') : [],
        fragments: fragments.sort((a, b) => a.position - b.position),
        share_count: snippet.share_count || 0,
      };
    } catch (error) {
      Logger.error('Error getting snippet details:', error);
      throw error;
    }
  }
}

export default new AdminRepository();
