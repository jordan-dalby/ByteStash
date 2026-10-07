import { getDb } from '../config/database.js';
import bcrypt from 'bcrypt';
import Logger from '../logger.js';

class UserRepository {
  #findByOIDCId(db, oidcId, provider) {
    return db.get(`
      SELECT id, username, created_at, email, name, is_admin, is_active
      FROM users
      WHERE oidc_id = ? AND oidc_provider = ?
    `, [oidcId, provider]);
  }

  async create(username, password) {
    const db = getDb();

    try {
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);
      const normalizedUsername = username.toLowerCase();

      const result = await db.get(`
        INSERT INTO users (username, username_normalized, password_hash)
        VALUES (?, ?, ?)
        RETURNING id
      `, [username, normalizedUsername, passwordHash]);

      return this.findById(result.id);
    } catch (error) {
      if (db.dialect.isUniqueViolation(error)) {
        throw new Error('Username already exists');
      }
      throw error;
    }
  }

  async findByUsername(username) {
    const db = getDb();
    return db.get(`
      SELECT id, username, password_hash, created_at, email, name, oidc_id, oidc_provider, is_admin, is_active
      FROM users
      WHERE ${db.dialect.equalsIgnoreCase('username_normalized')}
    `, [username.toLowerCase()]);
  }

  async findById(id) {
    return getDb().get(`
      SELECT id, username, created_at, email, name, oidc_id, is_admin, is_active
      FROM users
      WHERE id = ?
    `, [id]);
  }

  async findByIdWithPassword(id) {
    return getDb().get(`
      SELECT id, username, password_hash, created_at, email, name
      FROM users
      WHERE id = ?
    `, [id]);
  }

  async verifyPassword(user, password) {
    if (!user?.password_hash) {
      return false;
    }
    return bcrypt.compare(password, user.password_hash);
  }

  async generateUniqueUsername(baseUsername) {
    const db = getDb();
    const countSql = `
      SELECT COUNT(*) as count
      FROM users
      WHERE ${db.dialect.equalsIgnoreCase('username_normalized')}
    `;
    let username = baseUsername;
    let counter = 1;

    while ((await db.get(countSql, [username.toLowerCase()])).count > 0) {
      username = `${baseUsername}${counter}`;
      counter++;
    }

    return username;
  }

  async findOrCreateOIDCUser(profile, provider) {
    try {
      const db = getDb();

      const user = await this.#findByOIDCId(db, profile.sub, provider);
      if (user) return user;

      const sanitizeName = (name) => {
        return name
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '')
          .slice(0, 30);
      };

      let baseUsername = profile.preferred_username ? sanitizeName(profile.preferred_username) :
                        profile.email?.split('@')[0] ||
                        profile.name ? sanitizeName(profile.name) :
                        profile.sub;

      const username = await this.generateUniqueUsername(baseUsername);

      const result = await db.get(`
        INSERT INTO users (
          username,
          username_normalized,
          password_hash,
          oidc_id,
          oidc_provider,
          email,
          name
        ) VALUES (?, ?, '', ?, ?, ?, ?)
        RETURNING id
      `, [
        username,
        username.toLowerCase(),
        profile.sub,
        provider,
        profile.email,
        profile.name
      ]);

      return this.findById(result.id);
    } catch (error) {
      Logger.error('Error in findOrCreateOIDCUser:', error);
      throw error;
    }
  }

  async findByOIDCId(oidcId, provider) {
    return this.#findByOIDCId(getDb(), oidcId, provider);
  }

  async createAnonymousUser(username) {
    try {
      const db = getDb();
      await db.run(`
        INSERT INTO users (
          id,
          username,
          username_normalized,
          password_hash,
          created_at
        ) VALUES (0, ?, ?, '', ${db.dialect.now})
        ON CONFLICT(id) DO NOTHING
      `, [username, username.toLowerCase()]);

      return {
        id: 0,
        username,
        created_at: new Date().toISOString()
      };
    } catch (error) {
      Logger.error('Error creating anonymous user:', error);
      throw error;
    }
  }

  async updatePassword(userId, newPassword) {
    try {
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(newPassword, saltRounds);

      const result = await getDb().run(`
        UPDATE users
        SET password_hash = ?
        WHERE id = ?
      `, [passwordHash, userId]);

      if (result.changes === 0) {
        throw new Error('User not found or password not updated');
      }

      return true;
    } catch (error) {
      Logger.error('Error updating password:', error);
      throw error;
    }
  }

  async updateLastLogin(userId) {
    try {
      const db = getDb();
      await db.run(`
        UPDATE users
        SET last_login_at = ${db.dialect.now}
        WHERE id = ?
      `, [userId]);
    } catch (error) {
      Logger.error('Error updating last login:', error);
      throw error;
    }
  }

  async count() {
    return (await getDb().get('SELECT COUNT(*) as count FROM users')).count;
  }
}

export default new UserRepository();
