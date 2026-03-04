"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const pg_1 = require("pg");
const path_1 = __importDefault(require("path"));
// PostgreSQL pool (for Render deployment)
let pgPool = null;
// SQLite database (for local development)
let sqliteDb = null;
// Check if we should use PostgreSQL at runtime
function shouldUsePostgres() {
    const dbUrl = process.env.DATABASE_URL;
    return !!(dbUrl && dbUrl.startsWith('postgres'));
}
// Convert SQLite ? placeholders to PostgreSQL $1, $2, etc.
function convertPlaceholders(sql) {
    let paramIndex = 1;
    let result = '';
    for (let i = 0; i < sql.length; i++) {
        if (sql[i] === '?') {
            result += '$' + paramIndex;
            paramIndex++;
        }
        else {
            result += sql[i];
        }
    }
    return result;
}
// Create a unified pool interface that works with both databases
class DatabasePool {
    async query(sql, params = []) {
        const isPg = shouldUsePostgres();
        try {
            const normalized = sql.trim();
            const up = normalized.toUpperCase();
            // Use PostgreSQL if DATABASE_URL is set - check at runtime
            if (isPg) {
                if (!pgPool) {
                    pgPool = new pg_1.Pool({
                        connectionString: process.env.DATABASE_URL,
                    });
                }
                // Convert SQLite ? placeholders to PostgreSQL $1, $2, etc.
                const pgSql = convertPlaceholders(sql);
                console.log('PostgreSQL SQL:', pgSql);
                console.log('Params:', params);
                const result = await pgPool.query(pgSql, params);
                return {
                    rows: result.rows,
                    rowCount: result.rowCount || 0
                };
            }
            // Fall back to SQLite for local development
            if (!sqliteDb) {
                const dbPath = path_1.default.join(process.cwd(), 'dict_calendar.db');
                sqliteDb = new better_sqlite3_1.default(dbPath);
                sqliteDb.pragma('foreign_keys = ON');
            }
            if (up.startsWith('SELECT')) {
                const stmt = sqliteDb.prepare(sql);
                return {
                    rows: stmt.all(...params),
                    rowCount: 0
                };
            }
            else if (up.startsWith('INSERT') || up.startsWith('UPDATE') || up.startsWith('DELETE')) {
                const stmt = sqliteDb.prepare(sql);
                const info = stmt.run(...params);
                return {
                    rows: info.changes ? [{ id: info.lastInsertRowid }] : [],
                    rowCount: info.changes
                };
            }
            else {
                const stmt = sqliteDb.prepare(sql);
                stmt.run(...params);
                return { rows: [], rowCount: 0 };
            }
        }
        catch (error) {
            console.error('Database query error:', error.message);
            console.error('SQL was:', isPg ? convertPlaceholders(sql) : sql);
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
exports.default = pool;
