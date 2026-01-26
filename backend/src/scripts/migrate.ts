import pool from '../database';

async function createTables() {
  try {
    // Users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        middle_name VARCHAR(100),
        last_name VARCHAR(100) NOT NULL,
        project VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Activities table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS activities (
        id SERIAL PRIMARY KEY,
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
        created_by_id INTEGER REFERENCES users(id),
        priority VARCHAR(20) DEFAULT 'Normal',
        partner_institution VARCHAR(255),
        mode VARCHAR(50),
        platform VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Assigned personnel table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS assigned_personnel (
        id SERIAL PRIMARY KEY,
        activity_id INTEGER REFERENCES activities(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        task VARCHAR(255) NOT NULL,
        UNIQUE(activity_id, user_id)
      )
    `);

    // Documents table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS documents (
        id SERIAL PRIMARY KEY,
        activity_id INTEGER REFERENCES activities(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        url TEXT NOT NULL,
        upload_date TIMESTAMP DEFAULT NOW()
      )
    `);

    console.log('Database tables created successfully');
  } catch (error) {
    console.error('Error creating tables:', error);
    throw error;
  }
}

createTables().then(() => process.exit(0)).catch(() => process.exit(1));