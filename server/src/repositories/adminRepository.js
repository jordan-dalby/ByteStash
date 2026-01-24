import { getDb } from '../config/database.js';
import Logger from '../logger.js';

class AdminRepository {
  constructor() {
    this.statements = {};
  }

  #initializeStatements() {
    if (Object.keys(this.statements).length > 0) return;

    const db = getDb();

    // Dashboard stats
    this.statements.getTotalUsers = db.prepare(`
      SELECT COUNT(*) as count FROM users WHERE id != 0
    `);

    this.statements.getInternalUsers = db.prepare(`
      SELECT COUNT(*) as count FROM users WHERE id != 0 AND oidc_id IS NULL
    `);

    this.statements.getOIDCUsers = db.prepare(`
      SELECT COUNT(*) as count FROM users WHERE id != 0 AND oidc_id IS NOT NULL
    `);

    this.statements.getTotalSnippets = db.prepare(`
      SELECT COUNT(*) as count FROM snippets
    `);

    this.statements.getPublicSnippets = db.prepare(`
      SELECT COUNT(*) as count FROM snippets WHERE is_public = 1
    `);

    this.statements.getActiveApiKeys = db.prepare(`
      SELECT COUNT(*) as count FROM api_keys WHERE is_active = 1
    `);

    this.statements.getTotalShares = db.prepare(`
      SELECT COUNT(*) as count FROM shared_snippets
    `);

    // User management - get user details
    this.statements.getUserDetails = db.prepare(`
      SELECT
        id, username, email, name, created_at,
        oidc_id, oidc_provider, is_admin, is_active, last_login_at
      FROM users
      WHERE id = ?
    `);

    // Delete user
    this.statements.deleteUser = db.prepare(`
      DELETE FROM users WHERE id = ? AND id != 0
    `);

    // Toggle user active status
    this.statements.toggleUserActive = db.prepare(`
      UPDATE users
      SET is_active = NOT is_active
      WHERE id = ? AND id != 0
    `);

    // Get user snippet count
    this.statements.getUserSnippetCount = db.prepare(`
      SELECT COUNT(*) as count FROM snippets WHERE user_id = ?
    `);

    // Get user API key count
    this.statements.getUserApiKeyCount = db.prepare(`
      SELECT COUNT(*) as count FROM api_keys WHERE user_id = ?
    `);

    // Delete snippet permanently
    this.statements.deleteSnippet = db.prepare(`
      DELETE FROM snippets WHERE id = ?
    `);

    // Change snippet owner
    this.statements.changeSnippetOwner = db.prepare(`
      UPDATE snippets SET user_id = ? WHERE id = ?
    `);

    // Toggle snippet public status
    this.statements.toggleSnippetPublic = db.prepare(`
      UPDATE snippets SET is_public = NOT is_public WHERE id = ?
    `);

    // Delete API key
    this.statements.deleteApiKey = db.prepare(`
      DELETE FROM api_keys WHERE id = ?
    `);

    // Delete share
    this.statements.deleteShare = db.prepare(`
      DELETE FROM shared_snippets WHERE id = ?
    `);
  }

  async getStats() {
    this.#initializeStatements();

    try {
      const totalUsers = this.statements.getTotalUsers.get().count;
      const internalUsers = this.statements.getInternalUsers.get().count;
      const oidcUsers = this.statements.getOIDCUsers.get().count;
      const totalSnippets = this.statements.getTotalSnippets.get().count;
      const publicSnippets = this.statements.getPublicSnippets.get().count;
      const activeApiKeys = this.statements.getActiveApiKeys.get().count;
      const totalShares = this.statements.getTotalShares.get().count;

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
    this.#initializeStatements();

    try {
      const db = getDb();
      let query = `
        SELECT
          u.id, u.username, u.email, u.name, u.created_at, u.last_login_at,
          u.oidc_id, u.oidc_provider, u.is_admin, u.is_active,
          (SELECT COUNT(*) FROM snippets WHERE user_id = u.id) as snippet_count,
          (SELECT COUNT(*) FROM api_keys WHERE user_id = u.id) as api_key_count
        FROM users u
        WHERE u.id != 0
      `;

      const params = [];

      if (search) {
        query += ` AND (u.username LIKE ? OR u.email LIKE ? OR u.name LIKE ?)`;
        const searchPattern = `%${search}%`;
        params.push(searchPattern, searchPattern, searchPattern);
      }

      if (authType === 'internal') {
        query += ` AND u.oidc_id IS NULL`;
      } else if (authType === 'oidc') {
        query += ` AND u.oidc_id IS NOT NULL`;
      }

      if (isActive !== '') {
        query += ` AND u.is_active = ?`;
        params.push(isActive === 'true' ? 1 : 0);
      }

      query += ` ORDER BY u.created_at DESC LIMIT ? OFFSET ?`;
      params.push(limit, offset);

      const users = db.prepare(query).all(...params);

      let countQuery = `SELECT COUNT(*) as count FROM users u WHERE u.id != 0`;
      const countParams = [];

      if (search) {
        countQuery += ` AND (u.username LIKE ? OR u.email LIKE ? OR u.name LIKE ?)`;
        const searchPattern = `%${search}%`;
        countParams.push(searchPattern, searchPattern, searchPattern);
      }

      if (authType === 'internal') {
        countQuery += ` AND u.oidc_id IS NULL`;
      } else if (authType === 'oidc') {
        countQuery += ` AND u.oidc_id IS NOT NULL`;
      }

      if (isActive !== '') {
        countQuery += ` AND u.is_active = ?`;
        countParams.push(isActive === 'true' ? 1 : 0);
      }

      const total = db.prepare(countQuery).get(...countParams).count;

      return { users, total };
    } catch (error) {
      Logger.error('Error getting all users:', error);
      throw error;
    }
  }

  async getUserDetails(userId) {
    this.#initializeStatements();

    try {
      const user = this.statements.getUserDetails.get(userId);
      if (!user) return null;

      const snippetCount = this.statements.getUserSnippetCount.get(userId).count;
      const apiKeyCount = this.statements.getUserApiKeyCount.get(userId).count;

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
    this.#initializeStatements();

    try {
      const result = this.statements.deleteUser.run(userId);
      return result.changes > 0;
    } catch (error) {
      Logger.error('Error deleting user:', error);
      throw error;
    }
  }

  async toggleUserActive(userId) {
    this.#initializeStatements();

    try {
      const result = this.statements.toggleUserActive.run(userId);
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
    this.#initializeStatements();

    try {
      const db = getDb();
      let query = `
        SELECT
          s.id, s.title, s.description, s.updated_at, s.is_public,
          s.user_id, u.username,
          (SELECT COUNT(*) FROM fragments WHERE snippet_id = s.id) as fragment_count
        FROM snippets s
        LEFT JOIN users u ON s.user_id = u.id
        WHERE 1=1
      `;

      const params = [];

      if (search) {
        query += ` AND (s.title LIKE ? OR s.description LIKE ?)`;
        const searchPattern = `%${search}%`;
        params.push(searchPattern, searchPattern);
      }

      if (userId) {
        query += ` AND s.user_id = ?`;
        params.push(userId);
      }

      if (isPublic !== '') {
        query += ` AND s.is_public = ?`;
        params.push(isPublic === 'true' ? 1 : 0);
      }

      if (language) {
        query += ` AND s.id IN (SELECT snippet_id FROM fragments WHERE language = ?)`;
        params.push(language);
      }

      if (category) {
        query += ` AND s.id IN (SELECT snippet_id FROM categories WHERE name = ?)`;
        params.push(category);
      }

      query += ` ORDER BY s.updated_at DESC LIMIT ? OFFSET ?`;
      params.push(limit, offset);

      const snippets = db.prepare(query).all(...params);

      let countQuery = `
        SELECT COUNT(*) as count FROM snippets s
        WHERE 1=1
      `;
      const countParams = [];

      if (search) {
        countQuery += ` AND (s.title LIKE ? OR s.description LIKE ?)`;
        const searchPattern = `%${search}%`;
        countParams.push(searchPattern, searchPattern);
      }

      if (userId) {
        countQuery += ` AND s.user_id = ?`;
        countParams.push(userId);
      }

      if (isPublic !== '') {
        countQuery += ` AND s.is_public = ?`;
        countParams.push(isPublic === 'true' ? 1 : 0);
      }

      if (language) {
        countQuery += ` AND s.id IN (SELECT snippet_id FROM fragments WHERE language = ?)`;
        countParams.push(language);
      }

      if (category) {
        countQuery += ` AND s.id IN (SELECT snippet_id FROM categories WHERE name = ?)`;
        countParams.push(category);
      }

      const total = db.prepare(countQuery).get(...countParams).count;

      return { snippets, total };
    } catch (error) {
      Logger.error('Error getting all snippets:', error);
      throw error;
    }
  }

  async deleteSnippetPermanently(snippetId) {
    this.#initializeStatements();

    try {
      const result = this.statements.deleteSnippet.run(snippetId);
      return result.changes > 0;
    } catch (error) {
      Logger.error('Error deleting snippet:', error);
      throw error;
    }
  }

  async changeSnippetOwner(snippetId, newUserId) {
    this.#initializeStatements();

    try {
      const result = this.statements.changeSnippetOwner.run(newUserId, snippetId);
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
    this.#initializeStatements();

    try {
      const result = this.statements.toggleSnippetPublic.run(snippetId);
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
    this.#initializeStatements();

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

      const params = [];

      if (userId) {
        query += ` AND ak.user_id = ?`;
        params.push(userId);
      }

      query += ` ORDER BY ak.created_at DESC LIMIT ? OFFSET ?`;
      params.push(limit, offset);

      const apiKeys = db.prepare(query).all(...params);

      let countQuery = `SELECT COUNT(*) as count FROM api_keys WHERE 1=1`;
      const countParams = [];

      if (userId) {
        countQuery += ` AND user_id = ?`;
        countParams.push(userId);
      }

      const total = db.prepare(countQuery).get(...countParams).count;

      return { apiKeys, total };
    } catch (error) {
      Logger.error('Error getting all API keys:', error);
      throw error;
    }
  }

  async deleteApiKey(keyId) {
    this.#initializeStatements();

    try {
      const result = this.statements.deleteApiKey.run(keyId);
      return result.changes > 0;
    } catch (error) {
      Logger.error('Error deleting API key:', error);
      throw error;
    }
  }

  async getAllShares({ offset = 0, limit = 50, userId = '', requiresAuth = '' }) {
    this.#initializeStatements();

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

      const params = [];

      if (userId) {
        query += ` AND s.user_id = ?`;
        params.push(userId);
      }

      if (requiresAuth !== '') {
        query += ` AND ss.requires_auth = ?`;
        params.push(requiresAuth === 'true' ? 1 : 0);
      }

      query += ` ORDER BY ss.created_at DESC LIMIT ? OFFSET ?`;
      params.push(limit, offset);

      const shares = db.prepare(query).all(...params);

      let countQuery = `
        SELECT COUNT(*) as count
        FROM shared_snippets ss
        LEFT JOIN snippets s ON ss.snippet_id = s.id
        WHERE 1=1
      `;
      const countParams = [];

      if (userId) {
        countQuery += ` AND s.user_id = ?`;
        countParams.push(userId);
      }

      if (requiresAuth !== '') {
        countQuery += ` AND ss.requires_auth = ?`;
        countParams.push(requiresAuth === 'true' ? 1 : 0);
      }

      const total = db.prepare(countQuery).get(...countParams).count;

      return { shares, total };
    } catch (error) {
      Logger.error('Error getting all shares:', error);
      throw error;
    }
  }

  async deleteShare(shareId) {
    this.#initializeStatements();

    try {
      const result = this.statements.deleteShare.run(shareId);
      return result.changes > 0;
    } catch (error) {
      Logger.error('Error deleting share:', error);
      throw error;
    }
  }

  async scanSnippetsForOffensiveContent(badWordsChecker) {
    this.#initializeStatements();

    try {
      const db = getDb();

      // Get all snippets with their fragments
      const query = `
        SELECT
          s.id, s.title, s.description, s.updated_at, s.is_public,
          s.user_id, u.username,
          GROUP_CONCAT(f.code || ' ' || f.file_name, '|||') as fragments_content
        FROM snippets s
        LEFT JOIN users u ON s.user_id = u.id
        LEFT JOIN fragments f ON s.id = f.snippet_id
        GROUP BY s.id
        ORDER BY s.updated_at DESC
      `;

      const snippets = db.prepare(query).all();
      const flaggedSnippets = [];

      for (const snippet of snippets) {
        const textToCheck = [
          snippet.title || '',
          snippet.description || '',
          snippet.fragments_content || ''
        ].join(' ');

        const foundWords = badWordsChecker.findBadWords(textToCheck);

        if (foundWords.length > 0) {
          // Get fragment count for display
          const fragmentCount = db.prepare(
            'SELECT COUNT(*) as count FROM fragments WHERE snippet_id = ?'
          ).get(snippet.id).count;

          flaggedSnippets.push({
            id: snippet.id,
            title: snippet.title,
            description: snippet.description,
            updated_at: snippet.updated_at,
            is_public: snippet.is_public,
            user_id: snippet.user_id,
            username: snippet.username,
            fragment_count: fragmentCount,
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
}

export default new AdminRepository();
