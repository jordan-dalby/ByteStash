import { getDb } from '../config/database.js';
import bcrypt from 'bcrypt';
import Logger from '../logger.js';

class UserRepository {
  constructor() {
    this.createUserStmt = null;
    this.findByUsernameStmt = null;
    this.findByIdStmt = null;
    this.findByOIDCIdStmt = null;
    this.createUserWithOIDCStmt = null;
  }

  #initializeStatements() {
    if (!this.createUserStmt) {
      const db = getDb();

      this.createUserStmt = db.prepare(`
        INSERT INTO users (username, password_hash)
        VALUES (?, ?)
      `);

      this.findByUsernameStmt = db.prepare(`
        SELECT id, username, password_hash, created_at, email, name, oidc_id, oidc_provider
        FROM users
        WHERE username = ?
      `);

      this.findByIdStmt = db.prepare(`
        SELECT id, username, created_at, email, name
        FROM users
        WHERE id = ?
      `);

      this.findByOIDCIdStmt = db.prepare(`
        SELECT id, username, created_at, email, name
        FROM users
        WHERE oidc_id = ? AND oidc_provider = ?
      `);

      this.createUserWithOIDCStmt = db.prepare(`
        INSERT INTO users (
          username, 
          password_hash, 
          oidc_id, 
          oidc_provider, 
          email, 
          name
        ) VALUES (?, '', ?, ?, ?, ?)
      `);

      this.findUsernameCountStmt = db.prepare(`
        SELECT COUNT(*) as count FROM users WHERE username = ?
      `);
    }
  }

  async create(username, password) {
    this.#initializeStatements();
    
    try {
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      const result = this.createUserStmt.run(username, passwordHash);
      
      return this.findById(result.lastInsertRowid);
    } catch (error) {
      if (error.code === 'SQLITE_CONSTRAINT') {
        throw new Error('Username already exists');
      }
      throw error;
    }
  }

  async findByUsername(username) {
    this.#initializeStatements();
    return this.findByUsernameStmt.get(username);
  }

  async findById(id) {
    this.#initializeStatements();
    return this.findByIdStmt.get(id);
  }

  async verifyPassword(user, password) {
    if (!user?.password_hash) {
      return false;
    }
    return bcrypt.compare(password, user.password_hash);
  }

  async generateUniqueUsername(baseUsername) {
    this.#initializeStatements();
    let username = baseUsername;
    let counter = 1;
    
    while (this.findUsernameCountStmt.get(username).count > 0) {
      username = `${baseUsername}${counter}`;
      counter++;
    }
    
    return username;
  }

  async findOrCreateOIDCUser(profile, provider) {
    this.#initializeStatements();
    
    try {
      const user = this.findByOIDCIdStmt.get(profile.sub, provider);
      if (user) return user;

      const baseUsername = profile.email?.split('@')[0] || 
                          profile.preferred_username ||
                          profile.sub;
                          
      const username = await this.generateUniqueUsername(baseUsername);

      const result = this.createUserWithOIDCStmt.run(
        username,
        profile.sub,
        provider,
        profile.email,
        profile.name
      );
      
      return this.findById(result.lastInsertRowid);
    } catch (error) {
      Logger.error('Error in findOrCreateOIDCUser:', error);
      throw error;
    }
  }
}

export default new UserRepository();