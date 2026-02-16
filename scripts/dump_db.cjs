const path = require('path');
let Database;
try {
  Database = require('better-sqlite3');
} catch (e) {
  // Fallback to backend's node_modules if running from project root
  Database = require(path.join(__dirname, '..', 'backend', 'node_modules', 'better-sqlite3'));
}
const dbPath = path.join(__dirname, '..', 'backend', 'dict_calendar.db');
console.log('DB path:', dbPath);
try {
  const db = new Database(dbPath, { readonly: true });
  const users = db.prepare('SELECT id, username, email, first_name, last_name FROM users').all();
  const activities = db.prepare('SELECT id, name, date, time, end_time, created_by_id FROM activities').all();
  console.log('Users:', users.length);
  console.table(users);
  console.log('Activities:', activities.length);
  console.table(activities);
  const joined = db.prepare(`SELECT a.*, u.username AS created_by_username, u.first_name, u.last_name
    FROM activities a JOIN users u ON a.created_by_id = u.id ORDER BY a.date, a.time`).all();
  console.log('Joined rows:', joined.length);
  console.table(joined);
  db.close();
} catch (e) {
  console.error('Error reading DB:', e.message);
  process.exit(1);
}
