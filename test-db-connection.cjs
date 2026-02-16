// Test database connection
const { Pool } = require('pg');

// Try different common password combinations
const testConfigs = [
  { password: 'postgres', desc: 'password: postgres' },
  { password: '', desc: 'password: (empty)' },
  { password: 'admin', desc: 'password: admin' },
  { password: 'password', desc: 'password: password' },
];

async function testConnection(password, desc) {
  try {
    const pool = new Pool({
      user: 'postgres',
      password: password || undefined,
      host: 'localhost',
      port: 5432,
      database: 'postgres'
    });
    
    const result = await pool.query('SELECT version()');
    console.log(`✅ SUCCESS with ${desc}`);
    console.log(`   PostgreSQL Version: ${result.rows[0].version.split(',')[0]}`);
    console.log(`   Use this in .env: postgresql://postgres:${password}@localhost:5432/dict_calendar`);
    await pool.end();
    return true;
  } catch (error) {
    console.log(`❌ FAILED with ${desc}: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('Testing PostgreSQL connections...\n');
  for (const config of testConfigs) {
    await testConnection(config.password, config.desc);
  }
}

main().catch(console.error);
