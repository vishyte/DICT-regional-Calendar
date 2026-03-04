import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import userRoutes from './routes/users';
import activityRoutes from './routes/activities';
import pool from './database';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Routes
app.use('/api/users', userRoutes);
app.use('/api/activities', activityRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});


async function runMigrations() {
  try {
    console.log('Running database migrations...');
    await pool.query(`CREATE TABLE IF NOT EXISTS users (id SERIAL PRIMARY KEY, username VARCHAR(50) UNIQUE NOT NULL, email VARCHAR(255) UNIQUE NOT NULL, password_hash VARCHAR(255) NOT NULL, first_name VARCHAR(100) NOT NULL, middle_name VARCHAR(100), last_name VARCHAR(100) NOT NULL, project VARCHAR(255) NOT NULL, role VARCHAR(20) DEFAULT 'user', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
    await pool.query(`CREATE TABLE IF NOT EXISTS activities (id SERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL, date DATE NOT NULL, end_date DATE, original_date DATE, time VARCHAR(20) NOT NULL, end_time VARCHAR(20) NOT NULL, location VARCHAR(255) NOT NULL, venue VARCHAR(255) NOT NULL, venue_address TEXT, sector VARCHAR(100) NOT NULL, project VARCHAR(255) NOT NULL, description TEXT, participants INTEGER, facilitator VARCHAR(255), status VARCHAR(20) DEFAULT 'Scheduled', change_reason TEXT, change_date DATE, created_by_id INTEGER, priority VARCHAR(20) DEFAULT 'Normal', partner_institution VARCHAR(255), mode VARCHAR(50), platform VARCHAR(255), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (created_by_id) REFERENCES users(id))`);
    await pool.query(`CREATE TABLE IF NOT EXISTS assigned_personnel (id SERIAL PRIMARY KEY, activity_id INTEGER NOT NULL, user_id INTEGER NOT NULL, task VARCHAR(255) NOT NULL, UNIQUE(activity_id, user_id), FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE, FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE)`);
    await pool.query(`CREATE TABLE IF NOT EXISTS documents (id SERIAL PRIMARY KEY, activity_id INTEGER NOT NULL, name VARCHAR(255) NOT NULL, url TEXT NOT NULL, upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE)`);

    // ensure activity document columns exist (used for attendance & TODA storage)
    try {
      await pool.query(`ALTER TABLE activities ADD COLUMN IF NOT EXISTS attendance_file_name VARCHAR(255)`);
      await pool.query(`ALTER TABLE activities ADD COLUMN IF NOT EXISTS attendance_upload_date TIMESTAMP`);
      await pool.query(`ALTER TABLE activities ADD COLUMN IF NOT EXISTS attendance_file_data BYTEA`);
      await pool.query(`ALTER TABLE activities ADD COLUMN IF NOT EXISTS toda_file_name VARCHAR(255)`);
      await pool.query(`ALTER TABLE activities ADD COLUMN IF NOT EXISTS toda_upload_date TIMESTAMP`);
      await pool.query(`ALTER TABLE activities ADD COLUMN IF NOT EXISTS toda_file_data BYTEA`);
    } catch (err: any) {
      // some SQLite versions do not support IF NOT EXISTS; ignore errors
      console.warn('Could not add document storage columns (they may already exist):', err?.message || err);
    }

    console.log('Database migrations completed successfully');
  } catch (error) {
    console.error('Migration error:', error);
  }
}

app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  await runMigrations();
});
