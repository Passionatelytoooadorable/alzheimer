const express = require('express');
const { query } = require('../config/database');
const auth = require('../middleware/auth');
const router = express.Router();

// Add new journal
router.post('/', auth, async (req, res) => {
  try {
    const { title, content, mood, tags } = req.body;
    const userId = req.user.userId;

    const newJournal = await query(
      `INSERT INTO journals (user_id, title, content, mood, tags) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [userId, title, content, mood, tags]
    );

    // Log activity
    await query(
      'INSERT INTO user_activities (user_id, activity_type, description) VALUES ($1, $2, $3)',
      [userId, 'journal_added', `Added journal: ${title || 'Untitled'}`]
    );

    res.status(201).json({
      message: 'Journal added successfully',
      journal: newJournal.rows[0]
    });

  } catch (error) {
    console.error('Add journal error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all journals for user
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.userId;

    const journals = await query(
      'SELECT * FROM journals WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );

    res.json({
      journals: journals.rows
    });

  } catch (error) {
    console.error('Get journals error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update journal
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, mood, tags } = req.body;
    const userId = req.user.userId;

    const updatedJournal = await query(
      `UPDATE journals 
       SET title = $1, content = $2, mood = $3, tags = $4, updated_at = CURRENT_TIMESTAMP
       WHERE id = $5 AND user_id = $6 
       RETURNING *`,
      [title, content, mood, tags, id, userId]
    );

    if (updatedJournal.rows.length === 0) {
      return res.status(404).json({ error: 'Journal not found' });
    }

    res.json({
      message: 'Journal updated successfully',
      journal: updatedJournal.rows[0]
    });

  } catch (error) {
    console.error('Update journal error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;