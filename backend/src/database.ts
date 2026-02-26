import Database from 'better-sqlite3';
import { Pool } from 'pg';
import path from 'path';

// Determine which database to use based on environment
const usePostgres = process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgres');

// PostgreSQL pool (for Render deployment)
let pgPool: Pool | null = null;

// SQLite database (for local development)
let sqliteDb: Database.Database | null = null;

// Convert SQLite ? placeholders to PostgreSQL $1, $2, etc.
function convertPlaceholders(sql: string): string {
  let result = '';
  let paramIndex = 1;
  
  for (let i = 0; i < sql.length; i++) {
    if (sql[i] === '?') {
      result += '$' + paramIndex;
      paramIndex++;
    } else {
      result += sql[i];
    }
  }
  
  return result;
}

// Create a unified pool interface that works with both databases
class DatabasePool {
  async query(sql: string, params: any[] = []) {
    try {
      const normalized = sql.trim();
      const up = normalized.toUpperCase();

      // Use PostgreSQL if DATABASE_URL is set
      if (usePostgres) {
        if (!pgPool) {
          pgPool = new Pool({
            connectionString: process.env.DATABASE_URL,
          });
        }

        // Convert SQLite ? placeholders to PostgreSQL $1, $2, etc.
        const pgSql = convertPlaceholders(sql);
        
        const result = await pgPool.query(pgSql, params);
        return {
          rows: result.rows,
          rowCount: result.rowCount || 0
        };
      }

      // Fall back to SQLite for local development
      if (!sqliteDb) {
        const dbPath = path.join(process.cwd(), 'dict_calendar.db');
        sqliteDb = new Database(dbPath);
        sqliteDb.pragma('foreign_keys = ON');
      }

      if (up.startsWith('SELECT')) {
        const stmt = sqliteDb.prepare(sql);
        return {
          rows: stmt.all(...params),
          rowCount: 0
        };
      } else if (up.startsWith('INSERT') || up.startsWith('UPDATE') || up.startsWith('DELETE')) {
        const stmt = sqliteDb.prepare(sql);
        const info = stmt.run(...params);
        return {
          rows: info.changes ? [{ id: info.lastInsertRowid }] : [],
          rowCount: info.changes
        };
      } else {
        const stmt = sqliteDb.prepare(sql);
        stmt.run(...params);
        return { rows: [], rowCount: 0 };
      }
    } catch (error: any) {
      throw error;
    }
  }

  // For closing connections (useful for graceful shutdown)
  async end() {
    if (pgPool) {
      await pgPool.end();
    }
    if (sqliteDb) {
      sqliteDb.close();
    }
  }
}

const pool = new DatabasePool();
export default pool;
