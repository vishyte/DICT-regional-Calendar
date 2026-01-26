import pool from '../database';
import bcrypt from 'bcryptjs';

async function seedDatabase() {
  try {
    // Seed default users
    const hashedPassword1 = await bcrypt.hash('user123', 10);
    const hashedPassword2 = await bcrypt.hash('dict2025', 10);

    await pool.query(`
      INSERT INTO users (username, email, password_hash, first_name, middle_name, last_name, project)
      VALUES
        ('DICT-25-001', 'user@dict.gov.ph', $1, 'Ma. Jessa', 'Garsuta', 'Garsuta', 'IIDB'),
        ('DICT-25-002', 'staff@dict.gov.ph', $2, 'Maria', NULL, 'Santos', 'ILCDB'),
        ('DICT-25-003', 'staff.member@dict.gov.ph', $2, 'John Michael', 'Dela', 'Cruz', 'Free Wi-Fi')
      ON CONFLICT (username) DO NOTHING
    `, [hashedPassword1, hashedPassword2]);

    // Seed sample activities
    await pool.query(`
      INSERT INTO activities (
        name, date, time, end_time, location, venue, sector, project, description,
        participants, facilitator, status, created_by_id
      ) VALUES (
        'Free Wi-Fi Installation Training',
        '2025-10-28',
        '9:00 AM',
        '12:00 PM',
        'Davao City',
        'DICT Regional Office Conference Hall',
        'LGU',
        'IIDB Free Wi-Fi for All',
        'Comprehensive training on the installation and maintenance of free Wi-Fi infrastructure for local government units.',
        45,
        'Engr. Juan Dela Cruz',
        'Scheduled',
        1
      ) ON CONFLICT DO NOTHING
    `);

    console.log('Database seeded successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
}

seedDatabase().then(() => process.exit(0)).catch(() => process.exit(1));