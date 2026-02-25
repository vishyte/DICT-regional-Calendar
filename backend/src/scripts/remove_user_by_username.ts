import pool from '../database';

async function main() {
  const username = process.argv[2];
  if (!username) {
    console.error('Usage: npx tsx src/scripts/remove_user_by_username.ts <username>');
    process.exit(1);
  }

  try {
    const userRes: any = pool.query('SELECT id, username, email FROM users WHERE username = ?', [username]);
    const rows = userRes.rows || userRes;
    if (!rows || rows.length === 0) {
      console.log('User not found:', username);
      process.exit(0);
    }
    const user = rows[0];
    const userId = user.id;

    // Clear created_by_id on activities to avoid FK issues
    pool.query('UPDATE activities SET created_by_id = NULL WHERE created_by_id = ?', [userId]);
    console.log('Cleared activities.created_by_id for user', username);

    // Delete the user
    pool.query('DELETE FROM users WHERE id = ?', [userId]);
    console.log('Deleted user:', username);

    // Show remaining users
    const all: any = pool.query('SELECT id, username, email FROM users');
    const allRows = all.rows || all;
    console.log('Remaining users:');
    for (const r of allRows) {
      console.log(r.id, r.username, r.email);
    }
  } catch (err) {
    console.error('Error removing user:', err);
    process.exit(1);
  }
}

main();
