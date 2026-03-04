const express  = require('express');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const { query } = require('../config/database');
const auth     = require('../middleware/auth');
const router   = express.Router();

// ── Sign up ───────────────────────────────────────────────────────────────────
router.post('/signup', async (req, res) => {
  try {
    const { name, email, username, password, phone_number } = req.body;

    if (!name || !email || !username || !password) {
      return res.status(400).json({ error: 'Name, email, username, and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1 OR username = $2',
      [email, username]
    );
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'User with this email or username already exists' });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const newUser = await query(
      `INSERT INTO users (name, email, username, password_hash, phone_number)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, email, username, phone_number, created_at`,
      [name, email, username, password_hash, phone_number || null]
    );

    await query(
      `INSERT INTO user_sessions (user_id, ip_address, login_timestamp) VALUES ($1, $2, CURRENT_TIMESTAMP)`,
      [newUser.rows[0].id, req.ip]
    ).catch(() => {}); // non-fatal

    await query(
      `INSERT INTO user_activities (user_id, activity_type, description) VALUES ($1, $2, $3)`,
      [newUser.rows[0].id, 'signup', 'User created account']
    ).catch(() => {});

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

// ── Sign in ───────────────────────────────────────────────────────────────────
router.post('/signin', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const userResult = await query(
      'SELECT * FROM users WHERE email = $1 OR username = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      // Generic message to prevent user enumeration
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = userResult.rows[0];
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    await query(
      `INSERT INTO user_sessions (user_id, ip_address, login_timestamp) VALUES ($1, $2, CURRENT_TIMESTAMP)`,
      [user.id, req.ip]
    ).catch(() => {});

    await query(
      `INSERT INTO user_activities (user_id, activity_type, description) VALUES ($1, $2, $3)`,
      [user.id, 'login', 'User logged in']
    ).catch(() => {});

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    const { password_hash, ...userWithoutPassword } = user;
    res.json({ message: 'Login successful', user: userWithoutPassword, token });

  } catch (error) {
    console.error('Signin error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Forgot password (sends reset link concept) ────────────────────────────────
// NOTE: To send real emails, add nodemailer + an email service (SendGrid, Resend, etc.)
// For now this logs a token and always returns success to prevent email enumeration.
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const result = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (result.rows.length > 0) {
      // Generate a short-lived reset token
      const resetToken = jwt.sign(
        { userId: result.rows[0].id, type: 'password_reset' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
      // TODO: Send email via nodemailer
      // For now, log it for development purposes only
      if (process.env.NODE_ENV !== 'production') {
        console.log('Password reset token for', email, ':', resetToken);
      }
      // Activity log
      await query(
        `INSERT INTO user_activities (user_id, activity_type, description) VALUES ($1, $2, $3)`,
        [result.rows[0].id, 'password_reset_requested', 'Password reset requested']
      ).catch(() => {});
    }

    // Always return success to prevent email enumeration
    res.json({ message: 'If that email exists, a reset link has been sent.' });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Get user activities (for dashboard + caregiver) ──────────────────────────
router.get('/activities', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const limit  = Math.min(parseInt(req.query.limit) || 50, 100);

    const activities = await query(
      `SELECT id, activity_type, description, timestamp
       FROM user_activities
       WHERE user_id = $1
       ORDER BY timestamp DESC
       LIMIT $2`,
      [userId, limit]
    );
    res.json({ activities: activities.rows });
  } catch (error) {
    console.error('Get activities error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Change password (authenticated) ──────────────────────────────────────────
router.post('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    const result = await query('SELECT password_hash FROM users WHERE id = $1', [req.user.userId]);
    if (!result.rows.length) return res.status(404).json({ error: 'User not found' });

    const valid = await bcrypt.compare(currentPassword, result.rows[0].password_hash);
    if (!valid) return res.status(401).json({ error: 'Current password is incorrect' });

    const newHash = await bcrypt.hash(newPassword, 10);
    await query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, req.user.userId]);

    await query(
      `INSERT INTO user_activities (user_id, activity_type, description) VALUES ($1, $2, $3)`,
      [req.user.userId, 'password_changed', 'User changed password']
    ).catch(() => {});

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
