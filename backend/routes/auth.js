const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/database');
const auth = require('../middleware/auth');
const router = express.Router();

// Sign up route
router.post('/signup', async (req, res) => {
  try {
    const { name, email, username, password, phone_number } = req.body;

    // Check if user already exists
    const existingUser = await query(
      'SELECT * FROM users WHERE email = $1 OR username = $2',
      [email, username]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ 
        error: 'User with this email or username already exists' 
      });
    }

    // Hash password
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Insert new user
    const newUser = await query(
      `INSERT INTO users (name, email, username, password_hash, phone_number) 
       VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, username, phone_number, created_at`,
      [name, email, username, password_hash, phone_number]
    );

    // Create login session
    await query(
      `INSERT INTO user_sessions (user_id, ip_address, login_timestamp) 
       VALUES ($1, $2, CURRENT_TIMESTAMP)`,
      [newUser.rows[0].id, req.ip]
    );

    // Log activity
    await query(
      `INSERT INTO user_activities (user_id, activity_type, description) 
       VALUES ($1, $2, $3)`,
      [newUser.rows[0].id, 'signup', 'User created account']
    );

    // Generate JWT token
    const token = jwt.sign(
      { userId: newUser.rows[0].id, email: newUser.rows[0].email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User created successfully',
      user: newUser.rows[0],
      token
    });

  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Sign in route
router.post('/signin', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const userResult = await query(
      'SELECT * FROM users WHERE email = $1 OR username = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = userResult.rows[0];

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Create login session
    await query(
      `INSERT INTO user_sessions (user_id, ip_address, login_timestamp) 
       VALUES ($1, $2, CURRENT_TIMESTAMP)`,
      [user.id, req.ip]
    );

    // Log activity
    await query(
      `INSERT INTO user_activities (user_id, activity_type, description) 
       VALUES ($1, $2, $3)`,
      [user.id, 'login', 'User logged in']
    );

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Remove password from response
    const { password_hash, ...userWithoutPassword } = user;

    res.json({
      message: 'Login successful',
      user: userWithoutPassword,
      token
    });

  } catch (error) {
    console.error('Signin error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user activities
router.get('/activities', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const activities = await query(
      'SELECT * FROM user_activities WHERE user_id = $1 ORDER BY timestamp DESC LIMIT 50',
      [userId]
    );
    res.json({ activities: activities.rows });
  } catch (error) {
    console.error('Get activities error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
