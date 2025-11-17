const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/database');
const router = express.Router();

// Simple sign up route (remove complex tracking temporarily)
router.post('/signup', async (req, res) => {
  try {
    console.log('Signup request received:', req.body);
    
    const { name, email, username, password, phone_number } = req.body;

    // Check if user already exists
    console.log('Checking existing user...');
    const existingUser = await query(
      'SELECT * FROM users WHERE email = $1 OR username = $2',
      [email, username]
    );
    console.log('Existing user check completed');

    if (existingUser.rows.length > 0) {
      console.log('User already exists');
      return res.status(400).json({ 
        error: 'User with this email or username already exists' 
      });
    }

    // Hash password
    console.log('Hashing password...');
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);
    console.log('Password hashed');

    // Insert new user
    console.log('Inserting new user...');
    const newUser = await query(
      `INSERT INTO users (name, email, username, password_hash, phone_number) 
       VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, username, phone_number, created_at`,
      [name, email, username, password_hash, phone_number]
    );
    console.log('User inserted with ID:', newUser.rows[0].id);

    // Generate JWT token
    console.log('Generating JWT token...');
    const token = jwt.sign(
      { userId: newUser.rows[0].id, email: newUser.rows[0].email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    console.log('Token generated');

    res.status(201).json({
      message: 'User created successfully',
      user: newUser.rows[0],
      token
    });

  } catch (error) {
    console.error('SIGNUP ERROR DETAILS:');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Request body:', req.body);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
});

// Simple sign in route
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

module.exports = router;

