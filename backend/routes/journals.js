const express = require('express');
const { query } = require('../config/database');
const auth = require('../middleware/auth');
const router = express.Router();

// ─── CREATE ───────────────────────────────────────────────────────────────────
router.post('/', auth, async (req, res) => {
  try {
    const { title, content, mood, tags, entry_date, is_voice_entry } = req.body;
    const userId = req.user.userId;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    const newJournal = await query(
      `INSERT INTO journals (user_id, title, content, mood, tags, entry_date, is_voice_entry)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        userId,
        title.trim(),
        content.trim(),
        mood || '😊',
        tags || [],
        entry_date || new Date().toISOString().split('T')[0],
        is_voice_entry || false
      ]
    );

    await query(
      `INSERT INTO user_activities (user_id, activity_type, description)
       VALUES ($1, $2, $3)`,
      [userId, 'journal_added', `Added journal: ${title || 'Untitled'}`]
    );

    res.status(201).json({
      message: 'Journal entry saved successfully',
      journal: newJournal.rows[0]
    });

  } catch (error) {
    console.error('Create journal error:', error);
    res.status(500).json({ error: 'Failed to save journal entry' });
  }
});

// ─── READ ALL ─────────────────────────────────────────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { filter, search } = req.query;

    let queryStr = 'SELECT * FROM journals WHERE user_id = $1';
    let params = [userId];

    // Date filters
    if (filter === 'today') {
      queryStr += ` AND entry_date = CURRENT_DATE`;
    } else if (filter === 'week') {
      queryStr += ` AND entry_date >= CURRENT_DATE - INTERVAL '7 days'`;
    } else if (filter === 'month') {
      queryStr += ` AND entry_date >= CURRENT_DATE - INTERVAL '30 days'`;
    }

    // Search
    if (search && search.trim()) {
      params.push(`%${search.trim()}%`);
      queryStr += ` AND (title ILIKE $${params.length} OR content ILIKE $${params.length})`;
    }

    queryStr += ' ORDER BY entry_date DESC, created_at DESC';

    const journals = await query(queryStr, params);

    // Stats for header
    const stats = await query(
      `SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE entry_date >= CURRENT_DATE - INTERVAL '7 days') AS this_week,
        COUNT(*) FILTER (WHERE entry_date = CURRENT_DATE) AS today
       FROM journals WHERE user_id = $1`,
      [userId]
    );

    res.json({
      journals: journals.rows,
      stats: stats.rows[0]
    });

  } catch (error) {
    console.error('Get journals error:', error);
    res.status(500).json({ error: 'Failed to load journal entries' });
  }
});

// ─── READ ONE ─────────────────────────────────────────────────────────────────
router.get('/:id', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const result = await query(
      'SELECT * FROM journals WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Journal entry not found' });
    }

    res.json({ journal: result.rows[0] });

  } catch (error) {
    console.error('Get journal error:', error);
    res.status(500).json({ error: 'Failed to load journal entry' });
  }
});

// ─── UPDATE ───────────────────────────────────────────────────────────────────
router.put('/:id', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const { title, content, mood, tags, entry_date } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    // Verify ownership
    const existing = await query(
      'SELECT id FROM journals WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Journal entry not found' });
    }

    const updated = await query(
      `UPDATE journals
       SET title = $1, content = $2, mood = $3, tags = $4, entry_date = $5, updated_at = NOW()
       WHERE id = $6 AND user_id = $7
       RETURNING *`,
      [title.trim(), content.trim(), mood || '😊', tags || [], entry_date, id, userId]
    );

    res.json({
      message: 'Journal entry updated successfully',
      journal: updated.rows[0]
    });

  } catch (error) {
    console.error('Update journal error:', error);
    res.status(500).json({ error: 'Failed to update journal entry' });
  }
});

// ─── DELETE ───────────────────────────────────────────────────────────────────
router.delete('/:id', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const existing = await query(
      'SELECT title FROM journals WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Journal entry not found' });
    }

    await query(
      'DELETE FROM journals WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    await query(
      `INSERT INTO user_activities (user_id, activity_type, description)
       VALUES ($1, $2, $3)`,
      [userId, 'journal_deleted', `Deleted journal: ${existing.rows[0].title}`]
    );

    res.json({ message: 'Journal entry deleted successfully' });

  } catch (error) {
    console.error('Delete journal error:', error);
    res.status(500).json({ error: 'Failed to delete journal entry' });
  }
});

// ─── MOOD STATS (for caregiver mood trend chart) ──────────────────────────────
router.get('/stats/moods', auth, async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await query(
      `SELECT mood, entry_date
       FROM journals
       WHERE user_id = $1
         AND entry_date >= CURRENT_DATE - INTERVAL '30 days'
       ORDER BY entry_date ASC`,
      [userId]
    );

    res.json({ moods: result.rows });

  } catch (error) {
    console.error('Mood stats error:', error);
    res.status(500).json({ error: 'Failed to load mood stats' });
  }
});

module.exports = router;
