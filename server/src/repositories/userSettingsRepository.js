import { getDb } from '../config/database.js';
import Logger from '../logger.js';

function assertUserId(userId) {
  if (userId === undefined || userId === null) {
    throw new Error('A user id is required to read or write user settings');
  }
}

function parseSettings(raw) {
  if (!raw) return {};

  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {};
    }
    return parsed;
  } catch (error) {
    Logger.error('Error parsing stored user settings, falling back to empty:', error);
    return {};
  }
}

export function getUserSettings(userId) {
  assertUserId(userId);
  const db = getDb();

  try {
    const row = db
      .prepare(`
        SELECT settings, updated_at
        FROM user_settings
        WHERE user_id = ?
      `)
      .get(userId);

    if (!row) {
      return { settings: {}, updatedAt: null };
    }

    return { settings: parseSettings(row.settings), updatedAt: row.updated_at };
  } catch (error) {
    Logger.error('Error fetching user settings:', error);
    throw error;
  }
}

export function mergeUserSettings(userId, partial) {
  assertUserId(userId);
  const db = getDb();

  try {
    const selectStmt = db.prepare(`
      SELECT settings FROM user_settings WHERE user_id = ?
    `);
    const upsertStmt = db.prepare(`
      INSERT INTO user_settings (user_id, settings, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(user_id) DO UPDATE SET
        settings = excluded.settings,
        updated_at = CURRENT_TIMESTAMP
    `);
    const readBackStmt = db.prepare(`
      SELECT settings, updated_at FROM user_settings WHERE user_id = ?
    `);

    const merge = db.transaction((id, incoming) => {
      const existing = parseSettings(selectStmt.get(id)?.settings);
      upsertStmt.run(id, JSON.stringify({ ...existing, ...incoming }));
      return readBackStmt.get(id);
    });

    const row = merge(userId, partial);
    Logger.debug(`Updated settings for user ${userId}`);

    return { settings: parseSettings(row.settings), updatedAt: row.updated_at };
  } catch (error) {
    Logger.error('Error updating user settings:', error);
    throw error;
  }
}

export function deleteUserSettings(userId) {
  assertUserId(userId);
  const db = getDb();

  try {
    const result = db
      .prepare('DELETE FROM user_settings WHERE user_id = ?')
      .run(userId);

    return result.changes > 0;
  } catch (error) {
    Logger.error('Error deleting user settings:', error);
    throw error;
  }
}
