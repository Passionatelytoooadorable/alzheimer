const express = require('express');
const { query } = require('../config/database');
const auth = require('../middleware/auth');
const router = express.Router();

// Add new reminder
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

    // Log activity
    await query(
      'INSERT INTO user_activities (user_id, activity_type, description) VALUES ($1, $2, $3)',
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

    res.json({
      reminders: reminders.rows
    });

  } catch (error) {
    console.error('Get reminders error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update reminder completion status
router.patch('/:id/complete', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { is_completed } = req.body;
    const userId = req.user.userId;

    const updatedReminder = await query(
      'UPDATE reminders SET is_completed = $1 WHERE id = $2 AND user_id = $3 RETURNING *',
      [is_completed, id, userId]
    );

    if (updatedReminder.rows.length === 0) {
      return res.status(404).json({ error: 'Reminder not found' });
    }

    res.json({
      message: 'Reminder updated successfully',
      reminder: updatedReminder.rows[0]
    });

  } catch (error) {
    console.error('Update reminder error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete reminder
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const result = await query(
      'DELETE FROM reminders WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Reminder not found' });
    }

    res.json({
      message: 'Reminder deleted successfully'
    });

  } catch (error) {
    console.error('Delete reminder error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;