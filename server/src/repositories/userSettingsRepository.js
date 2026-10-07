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

export async function getUserSettings(userId) {
  assertUserId(userId);
  const db = getDb();

  try {
    const row = await db.get(`
      SELECT settings, updated_at
      FROM user_settings
      WHERE user_id = ?
    `, [userId]);

    if (!row) {
      return { settings: {}, updatedAt: null };
    }

    return { settings: parseSettings(row.settings), updatedAt: row.updated_at };
  } catch (error) {
    Logger.error('Error fetching user settings:', error);
    throw error;
  }
}

export async function mergeUserSettings(userId, partial) {
  assertUserId(userId);
  const db = getDb();

  try {
    const row = await db.transaction(async (tx) => {
      const { now, forUpdate } = tx.dialect;

      await tx.run(`
        INSERT INTO user_settings (user_id, settings, updated_at)
        VALUES (?, '{}', ${now})
        ON CONFLICT(user_id) DO NOTHING
      `, [userId]);

      const current = await tx.get(`
        SELECT settings FROM user_settings WHERE user_id = ?${forUpdate}
      `, [userId]);
      const existing = parseSettings(current?.settings);

      await tx.run(`
        UPDATE user_settings
        SET settings = ?, updated_at = ${now}
        WHERE user_id = ?
      `, [JSON.stringify({ ...existing, ...partial }), userId]);

      return tx.get(`
        SELECT settings, updated_at FROM user_settings WHERE user_id = ?
      `, [userId]);
    });

    Logger.debug(`Updated settings for user ${userId}`);

    return { settings: parseSettings(row.settings), updatedAt: row.updated_at };
  } catch (error) {
    Logger.error('Error updating user settings:', error);
    throw error;
  }
}

export async function deleteUserSettings(userId) {
  assertUserId(userId);
  const db = getDb();

  try {
    const result = await db.run(
      'DELETE FROM user_settings WHERE user_id = ?',
      [userId]
    );

    return result.changes > 0;
  } catch (error) {
    Logger.error('Error deleting user settings:', error);
    throw error;
  }
}
