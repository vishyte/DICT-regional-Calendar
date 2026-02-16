import Database from 'better-sqlite3';
import path from 'path';

// Use SQLite for local development
const dbPath = path.join(process.cwd(), 'dict_calendar.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Create a pool-like interface for compatibility
class DatabasePool {
  query(sql: string, params: any[] = []) {
    try {
      const normalized = sql.trim();
      const up = normalized.toUpperCase();
      if (up.startsWith('SELECT')) {
        const stmt = db.prepare(sql);
        return {
          rows: stmt.all(...params),
          rowCount: 0
        };
      } else if (up.startsWith('INSERT') || up.startsWith('UPDATE') || up.startsWith('DELETE')) {
        const stmt = db.prepare(sql);
        const info = stmt.run(...params);
        return {
          rows: info.changes ? [{ id: info.lastInsertRowid }] : [],
          rowCount: info.changes
        };
      } else {
        const stmt = db.prepare(sql);
        stmt.run(...params);
        return { rows: [], rowCount: 0 };
      }
    } catch (error: any) {
      throw error;
    }
  }
}

const pool = new DatabasePool();
export default pool;