import { getDb } from "../config/database.js";
import Logger from "../logger.js";

const FRAGMENT_BATCH_SIZE = 500;

function snippetSelect(dialect, { withExpiry = false } = {}) {
  return `
    SELECT
      s.id,
      s.title,
      s.description,
      ${dialect.utcString("s.updated_at")} as updated_at,
      ${withExpiry ? `${dialect.utcString("s.expiry_date")} as expiry_date,` : ""}
      s.user_id,
      s.is_public,
      s.is_pinned,
      s.is_favorite,
      u.username,
      ${dialect.groupConcatDistinct("c.name")} as categories,
      (SELECT COUNT(*) FROM shared_snippets WHERE snippet_id = s.id) as share_count
    FROM snippets s
    LEFT JOIN categories c ON s.id = c.snippet_id
    LEFT JOIN users u ON s.user_id = u.id
  `;
}

const INSERT_FRAGMENT_SQL = `
  INSERT INTO fragments (
    snippet_id,
    file_name,
    code,
    language,
    position
  ) VALUES (?, ?, ?, ?, ?)
`;

const INSERT_CATEGORY_SQL = `
  INSERT INTO categories (snippet_id, name) VALUES (?, ?)
`;

class SnippetRepository {
  async #processSnippets(queryable, snippets) {
    if (snippets.length === 0) return [];

    const fragmentsBySnippet = new Map();
    const ids = snippets.map((snippet) => snippet.id);

    for (let start = 0; start < ids.length; start += FRAGMENT_BATCH_SIZE) {
      const batch = ids.slice(start, start + FRAGMENT_BATCH_SIZE);
      const rows = await queryable.all(
        `
          SELECT id, snippet_id, file_name, code, language, position
          FROM fragments
          WHERE snippet_id IN (${batch.map(() => "?").join(",")})
          ORDER BY position, id
        `,
        batch
      );

      for (const { snippet_id, ...fragment } of rows) {
        if (!fragmentsBySnippet.has(snippet_id)) {
          fragmentsBySnippet.set(snippet_id, []);
        }
        fragmentsBySnippet.get(snippet_id).push(fragment);
      }
    }

    return snippets.map((snippet) => ({
      ...snippet,
      categories: snippet.categories ? snippet.categories.split(",") : [],
      fragments: (fragmentsBySnippet.get(snippet.id) || []).sort(
        (a, b) => a.position - b.position
      ),
      share_count: snippet.share_count || 0,
    }));
  }

  async #processSnippet(queryable, snippet) {
    if (!snippet) return null;
    const [processed] = await this.#processSnippets(queryable, [snippet]);
    return processed;
  }

  #selectById(queryable, id, userId) {
    const { dialect } = queryable;
    return queryable.get(
      `
        ${snippetSelect(dialect)}
        WHERE s.id = ? AND (s.user_id = ? OR s.is_public = 1) AND s.expiry_date IS NULL
        GROUP BY s.id, u.id
      `,
      [dialect.id(id), userId]
    );
  }

  async #insertFragments(queryable, snippetId, fragments) {
    for (const [index, fragment] of fragments.entries()) {
      await queryable.run(INSERT_FRAGMENT_SQL, [
        snippetId,
        fragment.file_name || `file${index + 1}`,
        fragment.code || "",
        fragment.language || "plaintext",
        fragment.position || index,
      ]);
    }
  }

  async #insertCategories(queryable, snippetId, categories) {
    for (const category of categories) {
      if (category.trim()) {
        await queryable.run(INSERT_CATEGORY_SQL, [
          snippetId,
          category.trim().toLowerCase(),
        ]);
      }
    }
  }

  async findAll(userId) {
    try {
      const db = getDb();
      const snippets = await db.all(
        `
          ${snippetSelect(db.dialect)}
          WHERE s.user_id = ? AND s.expiry_date IS NULL
          GROUP BY s.id, u.id
          ORDER BY s.updated_at DESC, s.id ASC
        `,
        [userId]
      );
      return this.#processSnippets(db, snippets);
    } catch (error) {
      Logger.error("Error in findAll:", error);
      throw error;
    }
  }

  async findAllPublic() {
    try {
      const db = getDb();
      const snippets = await db.all(`
        ${snippetSelect(db.dialect)}
        WHERE s.is_public = 1 AND s.expiry_date IS NULL
        GROUP BY s.id, u.id
        ORDER BY s.updated_at DESC, s.id ASC
      `);
      return this.#processSnippets(db, snippets);
    } catch (error) {
      Logger.error("Error in findAllPublic:", error);
      throw error;
    }
  }

  async create({
    title,
    description,
    categories = [],
    fragments = [],
    userId,
    isPublic = 0,
  }) {
    try {
      return await getDb().transaction(async (tx) => {
        const inserted = await tx.get(
          `
            INSERT INTO snippets (
              title,
              description,
              updated_at,
              expiry_date,
              user_id,
              is_public
            ) VALUES (?, ?, ${tx.dialect.nowUtc}, NULL, ?, ?)
            RETURNING id
          `,
          [title, description, userId, isPublic ? 1 : 0]
        );
        const snippetId = inserted.id;

        await this.#insertFragments(tx, snippetId, fragments);

        if (categories.length > 0) {
          await this.#insertCategories(tx, snippetId, categories);
        }

        const created = await this.#selectById(tx, snippetId, userId);
        return this.#processSnippet(tx, created);
      });
    } catch (error) {
      Logger.error("Error in create:", error);
      throw error;
    }
  }

  async update(
    id,
    { title, description, categories = [], fragments = [], isPublic = 0 },
    userId
  ) {
    try {
      return await getDb().transaction(async (tx) => {
        const snippetId = tx.dialect.id(id);

        const result = await tx.run(
          `
            UPDATE snippets
            SET title = ?,
                description = ?,
                updated_at = ${tx.dialect.nowUtc},
                is_public = ?
            WHERE id = ? AND user_id = ?
          `,
          [title, description, isPublic ? 1 : 0, snippetId, userId]
        );
        if (result.changes === 0) return null; // not found or not owned by this user

        await tx.run(
          `
            DELETE FROM fragments
            WHERE snippet_id = ?
            AND EXISTS (
              SELECT 1 FROM snippets
              WHERE snippets.id = fragments.snippet_id
              AND snippets.user_id = ?
            )
          `,
          [snippetId, userId]
        );
        await this.#insertFragments(tx, snippetId, fragments);

        await tx.run(
          `
            DELETE FROM categories
            WHERE snippet_id = ?
            AND EXISTS (
              SELECT 1 FROM snippets
              WHERE snippets.id = categories.snippet_id
              AND snippets.user_id = ?
            )
          `,
          [snippetId, userId]
        );
        await this.#insertCategories(tx, snippetId, categories);

        const updated = await this.#selectById(tx, snippetId, userId);
        return this.#processSnippet(tx, updated);
      });
    } catch (error) {
      Logger.error("Error in update:", error);
      throw error;
    }
  }

  async restore(id, userId) {
    try {
      const db = getDb();
      await db.run(
        `
          UPDATE snippets
          SET expiry_date = NULL
          WHERE id = ? AND user_id = ?
        `,
        [db.dialect.id(id), userId]
      );
    } catch (error) {
      Logger.error("Error in restore:", error);
      throw error;
    }
  }

  async moveToRecycle(id, userId) {
    try {
      return await getDb().transaction(async (tx) => {
        const snippet = await this.#selectById(tx, id, userId);
        if (snippet) {
          await tx.run(
            `
              UPDATE snippets
              SET expiry_date = ${tx.dialect.nowPlusDays(30)}
              WHERE id = ? AND user_id = ?
            `,
            [tx.dialect.id(id), userId]
          );
          return this.#processSnippet(tx, snippet);
        }
        return null;
      });
    } catch (error) {
      Logger.error("Error in moving to recycle:", error);
      throw error;
    }
  }

  async findAllDeleted(userId) {
    try {
      const db = getDb();
      const deletedSnippets = await db.all(
        `
          ${snippetSelect(db.dialect, { withExpiry: true })}
          WHERE s.user_id = ? AND s.expiry_date IS NOT NULL
          GROUP BY s.id, u.id
          ORDER BY s.updated_at DESC, s.id ASC
        `,
        [userId]
      );
      return this.#processSnippets(db, deletedSnippets);
    } catch (error) {
      Logger.error("Error in findAllDeleted:", error);
      throw error;
    }
  }

  async delete(id, userId) {
    try {
      const db = getDb();
      const deletedSnippet = await db.get(
        `
          DELETE FROM snippets
          WHERE id = ? AND user_id = ?
          RETURNING *
        `,
        [db.dialect.id(id), userId]
      );
      return deletedSnippet ? this.#processSnippet(db, deletedSnippet) : null;
    } catch (error) {
      Logger.error("Error in delete:", error);
      throw error;
    }
  }

  async deleteExpired() {
    try {
      const db = getDb();
      const currentTime = new Date().toISOString();
      await db.run(
        `
          DELETE FROM snippets
          WHERE expiry_date IS NOT NULL AND ${db.dialect.notAfterIsoParam("expiry_date")}
        `,
        [currentTime]
      );
    } catch (error) {
      Logger.error("Error in deleteExpired:", error);
      throw error;
    }
  }

  async findById(id, userId = null) {
    try {
      const db = getDb();

      if (userId != null) {
        const snippet = await this.#selectById(db, id, userId);
        return this.#processSnippet(db, snippet);
      }

      const snippet = await db.get(
        `
          ${snippetSelect(db.dialect)}
          WHERE s.id = ? AND s.is_public = 1 AND s.expiry_date IS NULL
          GROUP BY s.id, u.id
        `,
        [db.dialect.id(id)]
      );
      return this.#processSnippet(db, snippet);
    } catch (error) {
      Logger.error("Error in findById:", error);
      throw error;
    }
  }

  async #setFlag(column, id, value, userId) {
    const db = getDb();
    const result = await db.run(
      `
        UPDATE snippets
        SET ${column} = ?
        WHERE id = ? AND user_id = ?
      `,
      [value ? 1 : 0, db.dialect.id(id), userId]
    );
    if (result.changes === 0) return null;
    const updated = await this.#selectById(db, id, userId);
    return this.#processSnippet(db, updated);
  }

  async setPinned(id, value, userId) {
    try {
      return await this.#setFlag("is_pinned", id, value, userId);
    } catch (error) {
      Logger.error("Error in setPinned:", error);
      throw error;
    }
  }

  async setFavorite(id, value, userId) {
    try {
      return await this.#setFlag("is_favorite", id, value, userId);
    } catch (error) {
      Logger.error("Error in setFavorite:", error);
      throw error;
    }
  }

  async findAllPaginated({
    userId = null,
    filters = {},
    sort = 'newest',
    limit = 50,
    offset = 0
  }) {
    try {
      const db = getDb();
      const { dialect } = db;

      // Build base query
      let sql = `
        SELECT
          s.id,
          s.title,
          s.description,
          ${dialect.utcString("s.updated_at")} as updated_at,
          CASE WHEN s.expiry_date IS NOT NULL THEN ${dialect.utcString("s.expiry_date")} ELSE NULL END as expiry_date,
          s.user_id,
          s.is_public,
          s.is_pinned,
          s.is_favorite,
          u.username,
          ${dialect.groupConcatDistinct("c.name")} as categories,
          (SELECT COUNT(*) FROM shared_snippets WHERE snippet_id = s.id) as share_count,
          COUNT(*) OVER() as total_count
        FROM snippets s
        LEFT JOIN categories c ON s.id = c.snippet_id
        LEFT JOIN users u ON s.user_id = u.id
        WHERE 1=1
      `;

      const params = [];

      // Apply filters dynamically
      if (userId !== null) {
        sql += ` AND s.user_id = ?`;
        params.push(userId);
      } else {
        sql += ` AND s.is_public = 1`;
      }

      if (filters.recycled) {
        sql += ` AND s.expiry_date IS NOT NULL`;
      } else {
        sql += ` AND s.expiry_date IS NULL`;
      }

      if (filters.favorites) {
        sql += ` AND s.is_favorite = 1`;
      }

      if (filters.pinned) {
        sql += ` AND s.is_pinned = 1`;
      }

      if (filters.search) {
        sql += ` AND (${dialect.like("s.title")} OR ${dialect.like("s.description")}`;
        params.push(`%${filters.search}%`, `%${filters.search}%`);

        if (filters.searchCode) {
          sql += ` OR EXISTS (
            SELECT 1 FROM fragments f
            WHERE f.snippet_id = s.id AND ${dialect.like("f.code")}
          )`;
          params.push(`%${filters.search}%`);
        }
        sql += `)`;
      }

      if (filters.language) {
        sql += ` AND EXISTS (
          SELECT 1 FROM fragments f
          WHERE f.snippet_id = s.id AND f.language = ?
        )`;
        params.push(filters.language);
      }

      sql += ` GROUP BY s.id, u.id`;

      // Category AND logic: must have ALL selected categories
      if (filters.categories && filters.categories.length > 0) {
        sql += ` HAVING COUNT(DISTINCT CASE WHEN c.name IN (${filters.categories.map(() => '?').join(',')}) THEN c.name END) = ?`;
        params.push(...filters.categories, filters.categories.length);
      }

      // Apply sorting - pinned snippets always come first
      sql += ` ORDER BY s.is_pinned DESC, `;
      switch (sort) {
        case 'oldest':
          sql += `s.updated_at ASC`;
          break;
        case 'alpha-asc':
          sql += `s.title ASC`;
          break;
        case 'alpha-desc':
          sql += `s.title DESC`;
          break;
        case 'newest':
        default:
          sql += `s.updated_at DESC`;
      }

      sql += `, s.id ASC LIMIT ? OFFSET ?`;
      params.push(limit, offset);

      const rows = await db.all(sql, params);

      const total = rows.length > 0 ? rows[0].total_count : 0;
      const snippets = await this.#processSnippets(db, rows);

      return { snippets, total };
    } catch (error) {
      Logger.error("Error in findAllPaginated:", error);
      throw error;
    }
  }

  async getMetadata(userId = null) {
    try {
      const db = getDb();

      // Get unique categories
      let categorySql = `
        SELECT DISTINCT c.name
        FROM categories c
        INNER JOIN snippets s ON c.snippet_id = s.id
        WHERE s.expiry_date IS NULL
      `;
      const categoryParams = [];

      if (userId !== null) {
        categorySql += ` AND s.user_id = ?`;
        categoryParams.push(userId);
      } else {
        categorySql += ` AND s.is_public = 1`;
      }
      categorySql += ` ORDER BY c.name`;

      const categories = (await db.all(categorySql, categoryParams)).map(r => r.name);

      // Get unique languages
      let languageSql = `
        SELECT DISTINCT f.language
        FROM fragments f
        INNER JOIN snippets s ON f.snippet_id = s.id
        WHERE s.expiry_date IS NULL
      `;
      const languageParams = [];

      if (userId !== null) {
        languageSql += ` AND s.user_id = ?`;
        languageParams.push(userId);
      } else {
        languageSql += ` AND s.is_public = 1`;
      }
      languageSql += ` ORDER BY f.language`;

      const languages = (await db.all(languageSql, languageParams)).map(r => r.language);

      // Get counts
      let countSql = `SELECT COUNT(*) as count FROM snippets WHERE expiry_date IS NULL`;
      const countParams = [];

      if (userId !== null) {
        countSql += ` AND user_id = ?`;
        countParams.push(userId);
      } else {
        countSql += ` AND is_public = 1`;
      }

      const total = (await db.get(countSql, countParams)).count;

      return { categories, languages, counts: { total } };
    } catch (error) {
      Logger.error("Error in getMetadata:", error);
      throw error;
    }
  }

  async assignOrphanedSnippets(userId) {
    try {
      const result = await getDb().run(
        `UPDATE snippets SET user_id = ? WHERE user_id IS NULL`,
        [userId]
      );
      Logger.debug(
        `Assigned ${result.changes} orphaned snippets to user ${userId}`
      );
      return result.changes;
    } catch (error) {
      Logger.error("Error assigning orphaned snippets:", error);
      throw error;
    }
  }
}

export default new SnippetRepository();
