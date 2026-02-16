"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = __importDefault(require("../database"));
async function createTables() {
    try {
        // Users table
        database_1.default.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        middle_name VARCHAR(100),
        last_name VARCHAR(100) NOT NULL,
        project VARCHAR(255) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
        // Activities table
        database_1.default.query(`
      CREATE TABLE IF NOT EXISTS activities (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(255) NOT NULL,
        date DATE NOT NULL,
        original_date DATE,
        time VARCHAR(20) NOT NULL,
        end_time VARCHAR(20) NOT NULL,
        location VARCHAR(255) NOT NULL,
        venue VARCHAR(255) NOT NULL,
        venue_address TEXT,
        sector VARCHAR(100) NOT NULL,
        project VARCHAR(255) NOT NULL,
        description TEXT,
        participants INTEGER,
        facilitator VARCHAR(255),
        status VARCHAR(20) DEFAULT 'Scheduled',
        change_reason TEXT,
        change_date DATE,
        created_by_id INTEGER,
        priority VARCHAR(20) DEFAULT 'Normal',
        partner_institution VARCHAR(255),
        mode VARCHAR(50),
        platform VARCHAR(255),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by_id) REFERENCES users(id)
      )
    `);
        // Assigned personnel table
        database_1.default.query(`
      CREATE TABLE IF NOT EXISTS assigned_personnel (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        activity_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        task VARCHAR(255) NOT NULL,
        UNIQUE(activity_id, user_id),
        FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
        // Documents table
        database_1.default.query(`
      CREATE TABLE IF NOT EXISTS documents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        activity_id INTEGER NOT NULL,
        name VARCHAR(255) NOT NULL,
        url TEXT NOT NULL,
        upload_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE
      )
    `);
        console.log('✅ Database tables created successfully');
    }
    catch (error) {
        console.error('❌ Error creating tables:', error);
        process.exit(1);
    }
}
createTables();
process.exit(0);
