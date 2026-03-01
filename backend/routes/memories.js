const express = require('express');
const { query } = require('../config/database');
const auth = require('../middleware/auth');
const router = express.Router();

// ─── Helper ────────────────────────────────────────────────────────────────
// base64 data URLs for photos/audio can be large.
// Guard: reject anything over 8 MB per field.
const MAX_BASE64_BYTES = 8 * 1024 * 1024; // 8 MB

function isTooBig(value) {
  return value && Buffer.byteLength(value, 'utf8') > MAX_BASE64_BYTES;
}

// ─── POST /api/memories — Create a memory ─────────────────────────────────
router.post('/', auth, async (req, res) => {
  try {
    const {
      // legacy fields (keep working)
      title,
      description,
      memory_date,
      location,
      media_url,
      // new vault fields
      person_name,
      relationship,
      memory_type,
      photo_data,
      audio_data,
      card_color,
      card_emoji
    } = req.body;

    const userId = req.user.userId;

    // Size guards so Neon doesn't blow up on massive base64 strings
    if (isTooBig(photo_data)) {
      return res.status(413).json({ error: 'Photo is too large. Maximum 8 MB.' });
    }
    if (isTooBig(audio_data)) {
      return res.status(413).json({ error: 'Audio is too large. Maximum 8 MB.' });
    }

    const newMemory = await query(
      `INSERT INTO memories (
          user_id, title, description, memory_date, location, media_url,
          person_name, relationship, memory_type,
          photo_data, audio_data, card_color, card_emoji
       )
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       RETURNING *`,
      [
        userId,
        title       || person_name || 'Untitled',
        description || null,
        memory_date || null,
        location    || null,
        media_url   || null,
        person_name || null,
        relationship || null,
        memory_type || 'general',
        photo_data  || null,
        audio_data  || null,
        card_color  || '#4ecdc4',
        card_emoji  || '👤'
      ]
    );

    // Log activity
    await query(
      `INSERT INTO user_activities (user_id, activity_type, description)
       VALUES ($1, $2, $3)`,
      [userId, 'memory_added', `Added memory: ${person_name || title}`]
    );

    res.status(201).json({
      message: 'Memory saved successfully',
      memory: newMemory.rows[0]
    });

  } catch (error) {
    console.error('Add memory error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── GET /api/memories — Fetch all memories for the user ──────────────────
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const memories = await query(
      `SELECT * FROM memories
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );
    res.json({ memories: memories.rows });
  } catch (error) {
    console.error('Get memories error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── PUT /api/memories/:id — Update a memory ──────────────────────────────
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const {
      title, description, memory_date, location, media_url,
      person_name, relationship, memory_type,
      photo_data, audio_data, card_color, card_emoji
    } = req.body;

    if (isTooBig(photo_data)) {
      return res.status(413).json({ error: 'Photo is too large. Maximum 8 MB.' });
    }
    if (isTooBig(audio_data)) {
      return res.status(413).json({ error: 'Audio is too large. Maximum 8 MB.' });
    }

    const result = await query(
      `UPDATE memories SET
          title        = COALESCE($1, title),
          description  = COALESCE($2, description),
          memory_date  = COALESCE($3, memory_date),
          location     = COALESCE($4, location),
          media_url    = COALESCE($5, media_url),
          person_name  = COALESCE($6, person_name),
          relationship = COALESCE($7, relationship),
          memory_type  = COALESCE($8, memory_type),
          photo_data   = $9,
          audio_data   = $10,
          card_color   = COALESCE($11, card_color),
          card_emoji   = COALESCE($12, card_emoji)
       WHERE id = $13 AND user_id = $14
       RETURNING *`,
      [
        title || person_name || null,
        description || null,
        memory_date || null,
        location    || null,
        media_url   || null,
        person_name || null,
        relationship || null,
        memory_type || null,
        photo_data  ?? null,   // allow explicit null to clear photo
        audio_data  ?? null,
        card_color  || null,
        card_emoji  || null,
        id,
        userId
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Memory not found or not yours' });
    }

    res.json({ message: 'Memory updated', memory: result.rows[0] });

  } catch (error) {
    console.error('Update memory error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── DELETE /api/memories/:id — Delete a memory ───────────────────────────
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const result = await query(
      `DELETE FROM memories
       WHERE id = $1 AND user_id = $2
       RETURNING id`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Memory not found or not yours' });
    }

    await query(
      `INSERT INTO user_activities (user_id, activity_type, description)
       VALUES ($1, $2, $3)`,
      [userId, 'memory_deleted', `Deleted memory ID: ${id}`]
    );

    res.json({ message: 'Memory deleted' });

  } catch (error) {
    console.error('Delete memory error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
