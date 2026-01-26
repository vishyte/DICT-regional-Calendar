import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../database';
import { authenticateToken, AuthRequest } from '../middleware';

const router = express.Router();

// Register user
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, firstName, middleName, lastName, project } = req.body;

    // Check if user exists
    const existingUser = await pool.query('SELECT id FROM users WHERE username = $1 OR email = $2', [username, email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Insert user
    const result = await pool.query(
      `INSERT INTO users (username, email, password_hash, first_name, middle_name, last_name, project)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, username, email, first_name, middle_name, last_name, project`,
      [username, email, passwordHash, firstName, middleName || null, lastName, project]
    );

    const user = result.rows[0];
    res.status(201).json({ message: 'User registered successfully', user });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email },
      process.env.JWT_SECRET!,
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
        project: user.project
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
    const result = await pool.query('SELECT id, username, email, first_name, middle_name, last_name, project FROM users WHERE id = $1', [req.user!.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    res.json({
      id: user.id,
      username: user.username,
      fullName: `${user.first_name} ${user.middle_name ? user.middle_name + ' ' : ''}${user.last_name}`,
      firstName: user.first_name,
      middleName: user.middle_name,
      lastName: user.last_name,
      idNumber: user.username,
      email: user.email,
      project: user.project
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;