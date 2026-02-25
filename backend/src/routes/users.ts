import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import pool from '../database';
import { authenticateToken, AuthRequest } from '../middleware';

const router = express.Router();

// Fallback function to save registration data to JSON file
async function saveRegistrationBackup(userData: any) {
  try {
    const backupDir = path.join(process.cwd(), 'registration_backup');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(backupDir, `registration_${timestamp}_${userData.username}.json`);
    
    const backupData = {
      ...userData,
      password_hash: undefined, // Don't save plain password
      backedUp_at: new Date().toISOString(),
      status: 'pending_database_entry'
    };
    
    fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));
    console.log(`Registration data backed up to: ${backupFile}`);
    return true;
  } catch (backupError) {
    console.error('Failed to backup registration data:', backupError);
    return false;
  }
}

// Register user
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, firstName, middleName, lastName, project } = req.body;

    // Validate required fields
    if (!username || !email || !password || !firstName || !lastName || !project) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if user exists
    const existingUser = await pool.query('SELECT id FROM users WHERE username = ? OR email = ?', [username, email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Insert user (default role = 'user')
    const result = await pool.query(
      `INSERT INTO users (username, email, password_hash, first_name, middle_name, last_name, project, role)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [username, email, passwordHash, firstName, middleName || null, lastName, project, 'user']
    );

    // Fetch inserted user (include role)
    const userResult = await pool.query(
      'SELECT id, username, email, first_name, middle_name, last_name, project, role FROM users WHERE username = ?',
      [username]
    );

    const user = userResult.rows[0];
    if (!user) {
      return res.status(500).json({ error: 'User registration completed but failed to retrieve user data' });
    }
    res.status(201).json({ message: 'User registered successfully', user });
  } catch (error: any) {
    console.error('Registration error:', error);
    // Log the detailed error for debugging
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      detail: error.detail
    });
    
    // Determine error type
    let errorMessage = 'Registration failed. Please try again.';
    if (error.message?.includes('UNIQUE constraint failed')) {
      if (error.message?.includes('username')) {
        errorMessage = 'Username already exists';
      } else if (error.message?.includes('email')) {
        errorMessage = 'Email already registered';
      }
    } else if (error.message?.includes('NOT NULL constraint failed')) {
      errorMessage = 'Missing required information';
    }
    
    // Backup registration data if database fails
    const backupData = {
      username: req.body.username,
      email: req.body.email,
      firstName: req.body.firstName,
      middleName: req.body.middleName,
      lastName: req.body.lastName,
      project: req.body.project
    };
    
    const backedUpSuccessfully = await saveRegistrationBackup(backupData);
    
    res.status(500).json({ 
      error: errorMessage,
      message: backedUpSuccessfully 
        ? 'Registration data has been saved. Please try again later.' 
        : 'Registration failed. Please contact support.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const result = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0] as any;

    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email, role: user.role || 'user' },
      jwtSecret,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        fullName: `${user.first_name} ${user.middle_name ? user.middle_name + ' ' : ''}${user.last_name}`,
        firstName: user.first_name,
        middleName: user.middle_name,
        lastName: user.last_name,
        idNumber: user.username,
        email: user.email,
        project: user.project,
        role: user.role || 'user'
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user profile
router.get('/profile', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const result = await pool.query('SELECT id, username, email, first_name, middle_name, last_name, project, role FROM users WHERE id = ?', [req.user!.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0] as any;
    res.json({
      id: user.id,
      username: user.username,
      fullName: `${user.first_name} ${user.middle_name ? user.middle_name + ' ' : ''}${user.last_name}`,
      firstName: user.first_name,
      middleName: user.middle_name,
      lastName: user.last_name,
      idNumber: user.username,
      email: user.email,
      project: user.project,
      role: user.role || 'user'
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Recovery endpoint - process backed-up registrations
router.post('/recover-backups', async (req, res) => {
  try {
    const backupDir = path.join(process.cwd(), 'registration_backup');
    
    if (!fs.existsSync(backupDir)) {
      return res.json({ 
        message: 'No backup directory found',
        recovered: 0,
        failed: 0
      });
    }
    
    const files = fs.readdirSync(backupDir);
    let recovered = 0;
    let failed = 0;
    const results: any[] = [];
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        try {
          const filePath = path.join(backupDir, file);
          const backupData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
          
          // Hash password (since it wasn't saved)
          // For recovery, we'll use a temporary password that user should change
          const tempPassword = Math.random().toString(36).slice(-8);
          const passwordHash = await bcrypt.hash(tempPassword, 10);
          
          // Try to insert the user
          await pool.query(
            `INSERT INTO users (username, email, password_hash, first_name, middle_name, last_name, project)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [backupData.username, backupData.email, passwordHash, backupData.firstName, 
             backupData.middleName || null, backupData.lastName, backupData.project]
          );
          
          // Move file to processed folder
          const processedDir = path.join(backupDir, 'processed');
          if (!fs.existsSync(processedDir)) {
            fs.mkdirSync(processedDir, { recursive: true });
          }
          
          fs.renameSync(filePath, path.join(processedDir, file));
          recovered++;
          results.push({ username: backupData.username, status: 'recovered' });
          
        } catch (fileError: any) {
          failed++;
          results.push({ 
            file, 
            status: 'failed', 
            error: fileError.message 
          });
          console.error(`Failed to recover ${file}:`, fileError);
        }
      }
    }
    
    res.json({ 
      message: 'Recovery process completed',
      recovered,
      failed,
      results
    });
  } catch (error) {
    console.error('Recovery error:', error);
    res.status(500).json({ error: 'Recovery process failed' });
  }
});

// Check backup status
router.get('/backup-status', async (req, res) => {
  try {
    const backupDir = path.join(process.cwd(), 'registration_backup');
    
    if (!fs.existsSync(backupDir)) {
      return res.json({ 
        pendingBackups: 0,
        backupDirectory: 'not created'
      });
    }
    
    const files = fs.readdirSync(backupDir).filter(f => f.endsWith('.json'));
    
    res.json({ 
      pendingBackups: files.length,
      backupDirectory: backupDir,
      files: files.map(f => ({
        name: f,
        createdAt: fs.statSync(path.join(backupDir, f)).mtime
      }))
    });
  } catch (error) {
    console.error('Backup status error:', error);
    res.status(500).json({ error: 'Failed to get backup status' });
  }
});

// Superadmin login
router.post('/superadmin/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate superadmin credentials
    // TODO: Move these to environment variables or database for production
    const SUPERADMIN_USERNAME = process.env.SUPERADMIN_USERNAME || 'superadmin';
    const SUPERADMIN_PASSWORD = process.env.SUPERADMIN_PASSWORD || 'admin123';

    if (username !== SUPERADMIN_USERNAME || password !== SUPERADMIN_PASSWORD) {
      return res.status(401).json({ error: 'Invalid superadmin credentials' });
    }

    // Create a token for superadmin
    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    const token = jwt.sign(
      { id: 0, username: 'superadmin', email: 'superadmin@dict.gov.ph', role: 'superadmin' },
      jwtSecret,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: 0,
        username: 'superadmin',
        email: 'superadmin@dict.gov.ph',
        role: 'superadmin'
      }
    });
  } catch (error) {
    console.error('Superadmin login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Superadmin endpoints for user management

// Get all users (for superadmin)
router.get('/all', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const result = await pool.query(
      `SELECT id, username, email, first_name, middle_name, last_name, project, role, created_at 
       FROM users 
       ORDER BY created_at DESC`
    );

    const users = result.rows.map((user: any) => ({
      id: user.id,
      username: user.username,
      fullName: `${user.first_name} ${user.middle_name ? user.middle_name + ' ' : ''}${user.last_name}`,
      email: user.email,
      project: user.project,
      role: user.role || 'user',
      createdAt: user.created_at ? new Date(user.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      status: 'active' as const
    }));
    
    res.json(users);
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Create user (for superadmin)
router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { username, email, password, fullName, project, role } = req.body;

    // Validate required fields
    if (!username || !email || !password || !fullName || !project) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Parse full name
    const nameParts = fullName.trim().split(/\s+/);
    const firstName = nameParts[0] || '';
    const middleName = nameParts.length > 2 ? nameParts.slice(1, -1).join(' ') : null;
    const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';

    if (!firstName || !lastName) {
      return res.status(400).json({ error: 'Full name must include at least first and last name' });
    }

    // Check if user exists
    const existingUser = await pool.query('SELECT id FROM users WHERE username = ? OR email = ?', [username, email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Insert user (include role)
    await pool.query(
      `INSERT INTO users (username, email, password_hash, first_name, middle_name, last_name, project, role)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [username, email, passwordHash, firstName, middleName || null, lastName, project, role || 'user']
    );

    // Fetch inserted user
    const userResult = await pool.query(
      'SELECT id, username, email, first_name, middle_name, last_name, project, role, created_at FROM users WHERE username = ?',
      [username]
    );

    const user = userResult.rows[0] as any;
    if (!user) {
      return res.status(500).json({ error: 'User creation completed but failed to retrieve user data' });
    }

    res.status(201).json({
      id: user.id,
      username: user.username,
      fullName: `${user.first_name} ${user.middle_name ? user.middle_name + ' ' : ''}${user.last_name}`,
      email: user.email,
      project: user.project,
      role: user.role || role || 'user',
      createdAt: user.created_at ? new Date(user.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      status: 'active'
    });
  } catch (error: any) {
    console.error('Create user error:', error);
    let errorMessage = 'Failed to create user';
    if (error.message?.includes('UNIQUE constraint failed')) {
      errorMessage = 'Username or email already exists';
    }
    res.status(500).json({ error: errorMessage });
  }
});

// Update user (for superadmin)
router.put('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { username, email, fullName, project, role, password } = req.body;
    console.log(`PUT /users/${userId} payload:`, { username, email, fullName, project, role, password: password ? '[REDACTED]' : undefined });

    // Check if user exists
    const existingUser = await pool.query('SELECT id FROM users WHERE id = ?', [userId]);
    if (existingUser.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Parse full name if provided
    let firstName, middleName, lastName;
    if (fullName) {
      const nameParts = fullName.trim().split(/\s+/);
      firstName = nameParts[0] || '';
      middleName = nameParts.length > 2 ? nameParts.slice(1, -1).join(' ') : null;
      lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
    }

    // Build update query dynamically
    const updates: string[] = [];
    const params: any[] = [];

    if (username) {
      // Check if username is already taken by another user
      const usernameCheck = await pool.query('SELECT id FROM users WHERE username = ? AND id != ?', [username, userId]);
      if (usernameCheck.rows.length > 0) {
        return res.status(400).json({ error: 'Username already taken' });
      }
      updates.push('username = ?');
      params.push(username);
    }

    if (email) {
      // Check if email is already taken by another user
      const emailCheck = await pool.query('SELECT id FROM users WHERE email = ? AND id != ?', [email, userId]);
      if (emailCheck.rows.length > 0) {
        return res.status(400).json({ error: 'Email already taken' });
      }
      updates.push('email = ?');
      params.push(email);
    }

    if (firstName) {
      updates.push('first_name = ?');
      params.push(firstName);
    }

    if (middleName !== undefined) {
      updates.push('middle_name = ?');
      params.push(middleName);
    }

    if (lastName) {
      updates.push('last_name = ?');
      params.push(lastName);
    }

    if (project) {
      updates.push('project = ?');
      params.push(project);
    }

    if (password) {
      const passwordHash = await bcrypt.hash(password, 10);
      updates.push('password_hash = ?');
      params.push(passwordHash);
    }

    if (role) {
      updates.push('role = ?');
      params.push(role);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(userId);

    await pool.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    console.log(`Executed UPDATE users for id=${userId} with updates: ${updates.join(', ')}`);

    // Fetch updated user (include role)
    const userResult = await pool.query(
      'SELECT id, username, email, first_name, middle_name, last_name, project, role, created_at FROM users WHERE id = ?',
      [userId]
    );

    const user = userResult.rows[0] as any;
    if (!user) {
      return res.status(404).json({ error: 'User not found after update' });
    }
    
    res.json({
      id: user.id,
      username: user.username,
      fullName: `${user.first_name} ${user.middle_name ? user.middle_name + ' ' : ''}${user.last_name}`,
      email: user.email,
      project: user.project,
      role: user.role || role || 'user',
      createdAt: user.created_at ? new Date(user.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      status: 'active'
    });
  } catch (error: any) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete user (for superadmin)
router.delete('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = parseInt(req.params.id);

    // Check if user exists
    const existingUser = await pool.query('SELECT id FROM users WHERE id = ?', [userId]);
    if (existingUser.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Nullify any activities.created_by_id referencing this user to avoid FK constraint errors
    try {
      await pool.query('UPDATE activities SET created_by_id = NULL WHERE created_by_id = ?', [userId]);
      console.log(`Cleared created_by_id for activities referencing user id=${userId}`);
    } catch (err) {
      console.warn('Failed to clear activity references before deleting user:', err);
    }

    // Delete user
    await pool.query('DELETE FROM users WHERE id = ?', [userId]);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

export default router;