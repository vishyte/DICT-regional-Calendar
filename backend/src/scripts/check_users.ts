import pool from '../database';

async function main() {
  try {
    const res: any = pool.query('SELECT id, username, email, first_name, last_name, project, role, created_at FROM users');
    const rows = res.rows || res;
    console.log('Found', rows.length, 'users');
    for (const r of rows) {
      const name = `${r.first_name || ''} ${r.last_name || ''}`.trim();
      console.log(`${r.id}\t${name}\t${r.username}\t${r.email}\t${r.project}\tRole(${r.role})`);
    }
  } catch (err) {
    console.error('Error querying users:', err);
    process.exit(1);
  }
}

main();
