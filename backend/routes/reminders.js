const express  = require('express');
const { query } = require('../config/database');
const auth     = require('../middleware/auth');
const router   = express.Router();

// ─── CREATE ───────────────────────────────────────────────────────────────────
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, reminder_date, reminder_time, repeat_type, priority } = req.body;
    const userId = req.user.userId;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const result = await query(
      `INSERT INTO reminders
         (user_id, title, description, reminder_date, reminder_time, repeat_type, priority)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        userId,
        title.trim(),
        description || null,
        reminder_date || new Date().toISOString().split('T')[0],
        reminder_time || null,
        repeat_type   || 'none',
        priority      || 'medium'
      ]
    );

    await query(
      `INSERT INTO user_activities (user_id, activity_type, description) VALUES ($1, $2, $3)`,
      [userId, 'reminder_added', `Added reminder: ${title}`]
    ).catch(() => {});

    res.status(201).json({ message: 'Reminder added successfully', reminder: result.rows[0] });

  } catch (error) {
    console.error('Create reminder error:', error);
    res.status(500).json({ error: 'Failed to create reminder' });
  }
});

// ─── READ ALL ─────────────────────────────────────────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { date, filter } = req.query;

    let queryStr = 'SELECT * FROM reminders WHERE user_id = $1';
    let params   = [userId];

    if (date) {
      params.push(date);
      queryStr += ` AND reminder_date = $${params.length}`;
    } else if (filter === 'today') {
      queryStr += ` AND reminder_date = CURRENT_DATE`;
    } else if (filter === 'upcoming') {
      queryStr += ` AND reminder_date >= CURRENT_DATE`;
    } else if (filter === 'past') {
      queryStr += ` AND reminder_date < CURRENT_DATE`;
    }

    queryStr += ' ORDER BY reminder_date ASC, reminder_time ASC NULLS LAST';

    const reminders = await query(queryStr, params);

    const todayCount = await query(
      `SELECT COUNT(*) AS pending
       FROM reminders
       WHERE user_id = $1 AND reminder_date = CURRENT_DATE AND completed = FALSE`,
      [userId]
    );

    // Compliance stats for caregiver dashboard
    const complianceStats = await query(
      `SELECT
         COUNT(*) FILTER (WHERE reminder_date = CURRENT_DATE) AS today_total,
         COUNT(*) FILTER (WHERE reminder_date = CURRENT_DATE AND completed = TRUE) AS today_done
       FROM reminders WHERE user_id = $1`,
      [userId]
    );

    res.json({
      reminders:     reminders.rows,
      today_pending: parseInt(todayCount.rows[0].pending),
      compliance: {
        today_total: parseInt(complianceStats.rows[0].today_total || 0),
        today_done:  parseInt(complianceStats.rows[0].today_done  || 0)
      }
    });

  } catch (error) {
    console.error('Get reminders error:', error);
    res.status(500).json({ error: 'Failed to load reminders' });
  }
});

// ─── READ ONE ─────────────────────────────────────────────────────────────────
router.get('/:id', auth, async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM reminders WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.userId]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Reminder not found' });
    res.json({ reminder: result.rows[0] });
  } catch (error) {
    console.error('Get reminder error:', error);
    res.status(500).json({ error: 'Failed to load reminder' });
  }
});

// ─── UPDATE ───────────────────────────────────────────────────────────────────
router.put('/:id', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const { title, description, reminder_date, reminder_time, repeat_type, priority } = req.body;

    if (!title || !title.trim()) return res.status(400).json({ error: 'Title is required' });

    const existing = await query(
      'SELECT id FROM reminders WHERE id = $1 AND user_id = $2', [id, userId]
    );
    if (!existing.rows.length) return res.status(404).json({ error: 'Reminder not found' });

    const result = await query(
      `UPDATE reminders
       SET title = $1, description = $2, reminder_date = $3, reminder_time = $4,
           repeat_type = $5, priority = $6, updated_at = NOW()
       WHERE id = $7 AND user_id = $8
       RETURNING *`,
      [title.trim(), description||null, reminder_date, reminder_time||null, repeat_type||'none', priority||'medium', id, userId]
    );

    res.json({ message: 'Reminder updated successfully', reminder: result.rows[0] });

  } catch (error) {
    console.error('Update reminder error:', error);
    res.status(500).json({ error: 'Failed to update reminder' });
  }
});

// ─── TOGGLE COMPLETE (PATCH) — fixed endpoint ─────────────────────────────────
router.patch('/:id/complete', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const current = await query(
      'SELECT completed, title FROM reminders WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    if (!current.rows.length) return res.status(404).json({ error: 'Reminder not found' });

    const newCompleted = !current.rows[0].completed;
    const result = await query(
      `UPDATE reminders
       SET completed = $1, completed_at = $2, updated_at = NOW()
       WHERE id = $3 AND user_id = $4
       RETURNING *`,
      [newCompleted, newCompleted ? new Date() : null, id, userId]
    );

    res.json({
      message:  newCompleted ? 'Reminder completed!' : 'Reminder marked as pending',
      reminder: result.rows[0]
    });

  } catch (error) {
    console.error('Toggle reminder error:', error);
    res.status(500).json({ error: 'Failed to update reminder' });
  }
});

// Also support PUT for complete toggle (frontend compatibility)
router.put('/:id/complete', auth, async (req, res) => {
  req.params.id = req.params.id;
  const userId = req.user.userId;
  const { id } = req.params;

  try {
    const current = await query(
      'SELECT completed FROM reminders WHERE id = $1 AND user_id = $2', [id, userId]
    );
    if (!current.rows.length) return res.status(404).json({ error: 'Reminder not found' });

    const newCompleted = !current.rows[0].completed;
    const result = await query(
      `UPDATE reminders SET completed = $1, completed_at = $2, updated_at = NOW()
       WHERE id = $3 AND user_id = $4 RETURNING *`,
      [newCompleted, newCompleted ? new Date() : null, id, userId]
    );
    res.json({ message: newCompleted ? 'Completed!' : 'Marked pending', reminder: result.rows[0] });
  } catch (e) {
    res.status(500).json({ error: 'Failed to update' });
  }
});

// ─── DELETE ───────────────────────────────────────────────────────────────────
router.delete('/:id', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const existing = await query(
      'SELECT title FROM reminders WHERE id = $1 AND user_id = $2', [id, userId]
    );
    if (!existing.rows.length) return res.status(404).json({ error: 'Reminder not found' });

    await query('DELETE FROM reminders WHERE id = $1 AND user_id = $2', [id, userId]);

    await query(
      `INSERT INTO user_activities (user_id, activity_type, description) VALUES ($1, $2, $3)`,
      [userId, 'reminder_deleted', `Deleted reminder: ${existing.rows[0].title}`]
    ).catch(() => {});

    res.json({ message: 'Reminder deleted successfully' });

  } catch (error) {
    console.error('Delete reminder error:', error);
    res.status(500).json({ error: 'Failed to delete reminder' });
  }
});

module.exports = router;
