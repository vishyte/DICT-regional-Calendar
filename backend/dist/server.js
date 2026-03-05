"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const dotenv_1 = __importDefault(require("dotenv"));
const users_1 = __importDefault(require("./routes/users"));
const activities_1 = __importDefault(require("./routes/activities"));
const database_1 = __importDefault(require("./database"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
// Middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: '*',
    credentials: true
}));
app.use(express_1.default.json());
// Rate limiting
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);
// Routes
app.use('/api/users', users_1.default);
app.use('/api/activities', activities_1.default);
// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});
// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});
async function runMigrations() {
    try {
        console.log('Running database migrations...');
        await database_1.default.query(`CREATE TABLE IF NOT EXISTS users (id SERIAL PRIMARY KEY, username VARCHAR(50) UNIQUE NOT NULL, email VARCHAR(255) UNIQUE NOT NULL, password_hash VARCHAR(255) NOT NULL, first_name VARCHAR(100) NOT NULL, middle_name VARCHAR(100), last_name VARCHAR(100) NOT NULL, project VARCHAR(255) NOT NULL, role VARCHAR(20) DEFAULT 'user', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
        await database_1.default.query(`CREATE TABLE IF NOT EXISTS activities (id SERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL, date DATE NOT NULL, end_date DATE, original_date DATE, time VARCHAR(20) NOT NULL, end_time VARCHAR(20) NOT NULL, location VARCHAR(255) NOT NULL, venue VARCHAR(255) NOT NULL, venue_address TEXT, sector VARCHAR(100) NOT NULL, project VARCHAR(255) NOT NULL, description TEXT, participants INTEGER, facilitator VARCHAR(255), status VARCHAR(20) DEFAULT 'Scheduled', change_reason TEXT, change_date DATE, created_by_id INTEGER, priority VARCHAR(20) DEFAULT 'Normal', partner_institution VARCHAR(255), mode VARCHAR(50), platform VARCHAR(255), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (created_by_id) REFERENCES users(id))`);
        await database_1.default.query(`CREATE TABLE IF NOT EXISTS assigned_personnel (id SERIAL PRIMARY KEY, activity_id INTEGER NOT NULL, user_id INTEGER NOT NULL, task VARCHAR(255) NOT NULL, UNIQUE(activity_id, user_id), FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE, FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE)`);
        await database_1.default.query(`CREATE TABLE IF NOT EXISTS documents (id SERIAL PRIMARY KEY, activity_id INTEGER NOT NULL, name VARCHAR(255) NOT NULL, url TEXT NOT NULL, upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE)`);
        // ensure activity document columns exist (used for attendance & TODA storage)
        try {
            await database_1.default.query(`ALTER TABLE activities ADD COLUMN IF NOT EXISTS attendance_file_name VARCHAR(255)`);
            await database_1.default.query(`ALTER TABLE activities ADD COLUMN IF NOT EXISTS attendance_upload_date TIMESTAMP`);
            await database_1.default.query(`ALTER TABLE activities ADD COLUMN IF NOT EXISTS attendance_file_data BYTEA`);
            await database_1.default.query(`ALTER TABLE activities ADD COLUMN IF NOT EXISTS toda_file_name VARCHAR(255)`);
            await database_1.default.query(`ALTER TABLE activities ADD COLUMN IF NOT EXISTS toda_upload_date TIMESTAMP`);
            await database_1.default.query(`ALTER TABLE activities ADD COLUMN IF NOT EXISTS toda_file_data BYTEA`);
        }
        catch (err) {
            // some SQLite versions do not support IF NOT EXISTS; ignore errors
            console.warn('Could not add document storage columns (they may already exist):', err?.message || err);
        }
        // ensure approval columns exist
        try {
            await database_1.default.query(`ALTER TABLE activities ADD COLUMN IF NOT EXISTS approved_by_id INTEGER`);
            await database_1.default.query(`ALTER TABLE activities ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP`);
            await database_1.default.query(`ALTER TABLE activities ADD COLUMN IF NOT EXISTS approval_notes TEXT`);
        }
        catch (err) {
            console.warn('Could not add approval columns (they may already exist):', err?.message || err);
        }
        console.log('Database migrations completed successfully');
    }
    catch (error) {
        console.error('Migration error:', error);
    }
}
app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);
    await runMigrations();
});
