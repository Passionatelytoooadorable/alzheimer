const express = require('express');
const { query } = require('../config/database');
const auth = require('../middleware/auth');
const router = express.Router();

// Add new reminder with tracking
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, reminder_date, priority } = req.body;
    const userId = req.user.userId;

    const newReminder = await query(
      `INSERT INTO reminders (user_id, title, description, reminder_date, priority) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [userId, title, description, reminder_date, priority]
    );

    // Log reminder activity
    await query(
      `INSERT INTO user_activities (user_id, activity_type, description) 
       VALUES ($1, $2, $3)`,
      [userId, 'reminder_added', `Added reminder: ${title}`]
    );

    res.status(201).json({
      message: 'Reminder added successfully',
      reminder: newReminder.rows[0]
    });

  } catch (error) {
    console.error('Add reminder error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all reminders for user
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.userId;

    const reminders = await query(
      'SELECT * FROM reminders WHERE user_id = $1 ORDER BY reminder_date ASC',
      [userId]
    );

    res.json({ reminders: reminders.rows });
  } catch (error) {
    console.error('Get reminders error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
