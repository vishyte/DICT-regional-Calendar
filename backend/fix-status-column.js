const pg = require('pg');

const connectionString = process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL;
if (!connectionString) {
  console.error('No DATABASE_URL or DATABASE_PUBLIC_URL found in environment');
  process.exit(1);
}

const pool = new pg.Pool({
  connectionString
});

async function fixStatusColumn() {
  try {
    console.log('Connecting to database...');
    const result = await pool.query(
      'ALTER TABLE activities ALTER COLUMN status TYPE VARCHAR(50);'
    );
    console.log('✅ Status column updated successfully to VARCHAR(50)');
    console.log('Result:', result);
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating status column:', error.message);
    if (error.detail) console.error('Detail:', error.detail);
    await pool.end();
    process.exit(1);
  }
}

fixStatusColumn();
