const express = require('express');
const { query } = require('../config/database');
const auth = require('../middleware/auth');
const router = express.Router();

// Update user location
router.post('/', auth, async (req, res) => {
  try {
    const { latitude, longitude, address } = req.body;
    const userId = req.user.userId;

    const newLocation = await query(
      `INSERT INTO user_locations (user_id, latitude, longitude, address) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [userId, latitude, longitude, address]
    );

    // Log activity
    await query(
      `INSERT INTO user_activities (user_id, activity_type, description) 
       VALUES ($1, $2, $3)`,
      [userId, 'location_updated', 'User location updated']
    );

    res.status(201).json({
      message: 'Location updated successfully',
      location: newLocation.rows[0]
    });

  } catch (error) {
    console.error('Update location error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's last location
router.get('/last', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const lastLocation = await query(
      `SELECT * FROM user_locations 
       WHERE user_id = $1 
       ORDER BY timestamp DESC 
       LIMIT 1`,
      [userId]
    );
    res.json({ location: lastLocation.rows[0] || null });
  } catch (error) {
    console.error('Get location error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
