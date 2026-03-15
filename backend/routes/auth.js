const express  = require('express');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const { query } = require('../config/database');
const auth     = require('../middleware/auth');
const router   = express.Router();
const nodemailer = require('nodemailer');

// ── Email transporter (Gmail or any SMTP) ─────────────────────────────────────
// Set these env vars on Render:
//   EMAIL_USER     = your Gmail address  e.g. yourapp@gmail.com
//   EMAIL_PASS     = Gmail App Password  (NOT your normal password)
//   FRONTEND_URL   = https://alzheimer-support.vercel.app
function createTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
}

async function sendResetEmail(toEmail, resetToken) {
  const frontendUrl = process.env.FRONTEND_URL || 'https://alzheimer-support.vercel.app';
  const resetLink   = frontendUrl + '/reset-password.html?token=' + resetToken;

  const transporter = createTransporter();
  await transporter.sendMail({
    from: '"Alzheimer's Support" <' + process.env.EMAIL_USER + '>',
    to:   toEmail,
    subject: 'Reset your password',
    html: [
      '<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:2rem;">',
        '<div style="text-align:center;margin-bottom:1.5rem;">',
          '<span style="font-size:2.5rem;">&#129504;</span>',
          '<h1 style="color:#374785;font-size:1.4rem;margin:0.5rem 0 0;">Alzheimer's Support</h1>',
        '</div>',
        '<h2 style="color:#333;font-size:1.1rem;margin-bottom:0.75rem;">Reset your password</h2>',
        '<p style="color:#555;line-height:1.6;margin-bottom:1.5rem;">',
          'We received a request to reset the password for your account.',
          ' Click the button below to choose a new password.',
          ' This link expires in <strong>1 hour</strong>.',
        '</p>',
        '<div style="text-align:center;margin:2rem 0;">',
          '<a href="' + resetLink + '" ',
             'style="background:#4a86e8;color:white;padding:0.85rem 2rem;',
             'border-radius:50px;text-decoration:none;font-weight:700;font-size:0.95rem;">',
            'Reset Password',
          '</a>',
        '</div>',
        '<p style="color:#aaa;font-size:0.8rem;margin-top:2rem;">',
          'If you did not request this, you can safely ignore this email.',
          '<br>This link will expire automatically after 1 hour.',
        '</p>',
        '<hr style="border:none;border-top:1px solid #eee;margin:1.5rem 0;">',
        '<p style="color:#ccc;font-size:0.75rem;text-align:center;">',
          '&copy; 2025–2026 Alzheimer's Support Platform',
        '</p>',
      '</div>'
    ].join('')
  });
}

// ── Cookie config helper ──────────────────────────────────────────────────────
function cookieOptions() {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure:   isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge:   24 * 60 * 60 * 1000
  };
}

// ── Sign up ───────────────────────────────────────────────────────────────────
router.post('/signup', async (req, res) => {
  try {
    // ADDED: role field (defaults to 'patient' if not provided)
    const { name, email, username, password, phone_number, role } = req.body;

    if (!name || !email || !username || !password) {
      return res.status(400).json({ error: 'Name, email, username, and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // ADDED: validate role value
    const userRole = (role === 'caregiver') ? 'caregiver' : 'patient';

    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1 OR username = $2',
      [email, username]
    );
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'User with this email or username already exists' });
    }

    const password_hash = await bcrypt.hash(password, 10);

    // ADDED: role column inserted into users table
    const newUser = await query(
      `INSERT INTO users (name, email, username, password_hash, phone_number, role)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, email, username, phone_number, role, created_at`,
      [name, email, username, password_hash, phone_number || null, userRole]
    );

    await query(
      `INSERT INTO user_sessions (user_id, ip_address, login_timestamp) VALUES ($1, $2, CURRENT_TIMESTAMP)`,
      [newUser.rows[0].id, req.ip]
    ).catch(() => {});

    await query(
      `INSERT INTO user_activities (user_id, activity_type, description) VALUES ($1, $2, $3)`,
      [newUser.rows[0].id, 'signup', 'User created account']
    ).catch(() => {});

    // ADDED: role included in JWT payload
    const token = jwt.sign(
      { userId: newUser.rows[0].id, email: newUser.rows[0].email, role: userRole },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.cookie('token', token, cookieOptions());

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: newUser.rows[0]

    });

  } catch (error) {
    if (process.env.NODE_ENV !== 'production') console.error('Signup error:', error);
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

    // ADDED: role included in SELECT
    const userResult = await query(
      'SELECT * FROM users WHERE email = $1 OR username = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
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

    // ADDED: role included in JWT payload
    const userRole = user.role || 'patient';
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: userRole },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.cookie('token', token, cookieOptions());

    const { password_hash, ...userWithoutPassword } = user;

    // ADDED: role explicitly included in response so frontend can use it
    res.json({
      message: 'Login successful',
      token,
      user: { ...userWithoutPassword, role: userRole }

    });

  } catch (error) {
    if (process.env.NODE_ENV !== 'production') console.error('Signin error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Logout ────────────────────────────────────────────────────────────────────
router.post('/logout', (req, res) => {
  res.clearCookie('token', cookieOptions());
  res.json({ message: 'Logged out successfully' });
});

// ── Me ────────────────────────────────────────────────────────────────────────
router.get('/me', auth, async (req, res) => {
  try {
    // ADDED: role included in SELECT
    const result = await query(
      'SELECT id, name, email, username, phone_number, role, created_at FROM users WHERE id = $1',
      [req.user.userId]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'User not found' });
    res.json({ user: result.rows[0] });
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') console.error('Get me error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Forgot password ───────────────────────────────────────────────────────────
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const result = await query('SELECT id FROM users WHERE email = $1', [email]);

    // Always respond the same way — don't reveal whether the email exists
    if (result.rows.length > 0) {
      const resetToken = jwt.sign(
        { userId: result.rows[0].id, type: 'password_reset' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      // Send the email (non-blocking — failure is logged but doesn't break the response)
      sendResetEmail(email, resetToken).catch(err => {
        if (process.env.NODE_ENV !== 'production') {
          console.error('Failed to send reset email to', email, ':', err.message);
        }
      });

      await query(
        `INSERT INTO user_activities (user_id, activity_type, description) VALUES ($1, $2, $3)`,
        [result.rows[0].id, 'password_reset_requested', 'Password reset requested']
      ).catch(() => {});
    }

    // Same message regardless — prevents email enumeration
    res.json({ message: 'If that email exists, a reset link has been sent.' });

  } catch (error) {
    if (process.env.NODE_ENV !== 'production') console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Reset password (consume the token from email link) ────────────────────────
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Verify the JWT reset token
    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (e) {
      return res.status(400).json({ error: 'Reset link is invalid or has expired. Please request a new one.' });
    }

    if (payload.type !== 'password_reset') {
      return res.status(400).json({ error: 'Invalid reset token type.' });
    }

    // Hash the new password and update
    const newHash = await bcrypt.hash(newPassword, 10);
    const updated = await query(
      'UPDATE users SET password_hash = $1 WHERE id = $2 RETURNING id',
      [newHash, payload.userId]
    );

    if (!updated.rows.length) {
      return res.status(404).json({ error: 'User not found.' });
    }

    await query(
      `INSERT INTO user_activities (user_id, activity_type, description) VALUES ($1, $2, $3)`,
      [payload.userId, 'password_reset_completed', 'Password reset via email link']
    ).catch(() => {});

    res.json({ message: 'Password reset successfully. You can now sign in.' });

  } catch (error) {
    if (process.env.NODE_ENV !== 'production') console.error('Reset password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Get user activities ───────────────────────────────────────────────────────
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
    if (process.env.NODE_ENV !== 'production') console.error('Get activities error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Change password ───────────────────────────────────────────────────────────
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
    if (process.env.NODE_ENV !== 'production') console.error('Change password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
