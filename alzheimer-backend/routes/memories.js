const express = require('express');
const { query } = require('../config/database');
const auth = require('../middleware/auth');
const router = express.Router();

// Add new memory
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, memory_date, location, media_url } = req.body;
    const userId = req.user.userId;

    const newMemory = await query(
      `INSERT INTO memories (user_id, title, description, memory_date, location, media_url) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [userId, title, description, memory_date, location, media_url]
    );

    // Log activity
    await query(
      'INSERT INTO user_activities (user_id, activity_type, description) VALUES ($1, $2, $3)',
      [userId, 'memory_added', `Added memory: ${title}`]
    );

    res.status(201).json({
      message: 'Memory added successfully',
      memory: newMemory.rows[0]
    });

  } catch (error) {
    console.error('Add memory error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all memories for user
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.userId;

    const memories = await query(
      'SELECT * FROM memories WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );

    res.json({
      memories: memories.rows
    });

  } catch (error) {
    console.error('Get memories error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update memory
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, memory_date, location, media_url } = req.body;
    const userId = req.user.userId;

    const updatedMemory = await query(
      `UPDATE memories 
       SET title = $1, description = $2, memory_date = $3, location = $4, media_url = $5, updated_at = CURRENT_TIMESTAMP
       WHERE id = $6 AND user_id = $7 
       RETURNING *`,
      [title, description, memory_date, location, media_url, id, userId]
    );

    if (updatedMemory.rows.length === 0) {
      return res.status(404).json({ error: 'Memory not found' });
    }

    res.json({
      message: 'Memory updated successfully',
      memory: updatedMemory.rows[0]
    });

  } catch (error) {
    console.error('Update memory error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete memory
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const result = await query(
      'DELETE FROM memories WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Memory not found' });
    }

    res.json({
      message: 'Memory deleted successfully'
    });

  } catch (error) {
    console.error('Delete memory error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;