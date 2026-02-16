"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const path_1 = __importDefault(require("path"));
// Use SQLite for local development
const dbPath = path_1.default.join(process.cwd(), 'dict_calendar.db');
const db = new better_sqlite3_1.default(dbPath);
// Enable foreign keys
db.pragma('foreign_keys = ON');
// Create a pool-like interface for compatibility
class DatabasePool {
    query(sql, params = []) {
        try {
            const normalized = sql.trim();
            const up = normalized.toUpperCase();
            if (up.startsWith('SELECT')) {
                const stmt = db.prepare(sql);
                return {
                    rows: stmt.all(...params),
                    rowCount: 0
                };
            }
            else if (up.startsWith('INSERT') || up.startsWith('UPDATE') || up.startsWith('DELETE')) {
                const stmt = db.prepare(sql);
                const info = stmt.run(...params);
                return {
                    rows: info.changes ? [{ id: info.lastInsertRowid }] : [],
                    rowCount: info.changes
                };
            }
            else {
                const stmt = db.prepare(sql);
                stmt.run(...params);
                return { rows: [], rowCount: 0 };
            }
        }
        catch (error) {
            throw error;
        }
    }
}
const pool = new DatabasePool();
exports.default = pool;
