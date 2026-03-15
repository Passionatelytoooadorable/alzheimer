/**
 * routes/caregiver.js
 *
 * All caregiver-specific API routes:
 *   POST   /api/caregiver/link-request          patient sends link request to a caregiver
 *   GET    /api/caregiver/link-status            patient checks their own link status
 *   DELETE /api/caregiver/unlink                 patient unlinks from their caregiver
 *   GET    /api/caregiver/patients               caregiver gets their list of linked patients
 *   PUT    /api/caregiver/link/:id/accept        caregiver accepts a pending request
 *   PUT    /api/caregiver/link/:id/reject        caregiver rejects a pending request
 *
 *   -- Patient data proxy (caregiver reads a specific patient's data) --
 *   GET    /api/caregiver/patient/:patientId/stats
 *   GET    /api/caregiver/patient/:patientId/activities
 *   GET    /api/caregiver/patient/:patientId/location
 *   GET    /api/caregiver/patient/:patientId/moods
 *
 *   -- Messages --
 *   POST   /api/caregiver/message                caregiver sends message to a patient
 *   GET    /api/caregiver/messages/patient/:patientId  caregiver views sent messages
 *   GET    /api/caregiver/messages/inbox         patient reads messages from their caregiver
 *   PUT    /api/caregiver/messages/:id/read      patient marks message as read
 */

const express      = require('express');
const { query }    = require('../config/database');
const auth         = require('../middleware/auth');
const router       = express.Router();


// ── Helper: convert Postgres error codes to user-friendly messages ────────────
function pgErrMsg(err) {
  if (err.code === '42P01') return 'A required database table does not exist. Run the migration SQL in your Neon dashboard.';
  if (err.code === '42703') return 'A required database column is missing. Run the migration SQL in your Neon dashboard.';
  return 'Internal server error';
}

// ── Helper: verify caregiver is linked to patient ────────────────────────────
async function assertLinked(caregiverId, patientId) {
  const r = await query(
    `SELECT id FROM caregiver_patient_links
     WHERE caregiver_id = $1 AND patient_id = $2 AND status = 'accepted'`,
    [caregiverId, patientId]
  );
  if (!r.rows.length) throw new Error('NOT_LINKED');
}

// ── Helper: require a specific role ─────────────────────────────────────────
function requireRole(role) {
  return function (req, res, next) {
    if (req.user.role !== role) {
      return res.status(403).json({ error: 'Forbidden: wrong role' });
    }
    next();
  };
}

// ============================================================
// PATIENT → sends link request to a caregiver
// ============================================================
router.post('/link-request', auth, requireRole('patient'), async (req, res) => {
  try {
    const { caregiver_identifier } = req.body; // email or username
    if (!caregiver_identifier) {
      return res.status(400).json({ error: 'caregiver_identifier is required (email or username)' });
    }

    // Find caregiver
    const cg = await query(
      `SELECT id, name, email, role FROM users
       WHERE (email = $1 OR username = $1) AND role = 'caregiver'`,
      [caregiver_identifier]
    );
    if (!cg.rows.length) {
      return res.status(404).json({ error: 'No caregiver found with that email or username' });
    }
    const caregiver = cg.rows[0];

    // Check patient doesn't already have a link
    const existing = await query(
      `SELECT id, status FROM caregiver_patient_links WHERE patient_id = $1`,
      [req.user.userId]
    );
    if (existing.rows.length > 0) {
      const st = existing.rows[0].status;
      if (st === 'accepted') return res.status(400).json({ error: 'You are already linked to a caregiver. Unlink first.' });
      if (st === 'pending')  return res.status(400).json({ error: 'You already have a pending link request.' });
      // If rejected, delete it and allow re-request
      await query('DELETE FROM caregiver_patient_links WHERE patient_id = $1', [req.user.userId]);
    }

    const link = await query(
      `INSERT INTO caregiver_patient_links (caregiver_id, patient_id, status)
       VALUES ($1, $2, 'pending')
       RETURNING id, status, created_at`,
      [caregiver.id, req.user.userId]
    );

    res.status(201).json({
      message: `Link request sent to ${caregiver.name}. Waiting for their approval.`,
      link: link.rows[0],
      caregiver: { id: caregiver.id, name: caregiver.name, email: caregiver.email }
    });
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') console.error('link-request error:', err);
    res.status(500).json({ error: pgErrMsg(err) });
  }
});

// ── PATIENT → check own link status ─────────────────────────────────────────
router.get('/link-status', auth, requireRole('patient'), async (req, res) => {
  try {
    const r = await query(
      `SELECT cpl.id, cpl.status, cpl.created_at,
              u.id AS caregiver_id, u.name AS caregiver_name, u.email AS caregiver_email
       FROM caregiver_patient_links cpl
       JOIN users u ON u.id = cpl.caregiver_id
       WHERE cpl.patient_id = $1`,
      [req.user.userId]
    );
    if (!r.rows.length) return res.json({ link: null });
    res.json({ link: r.rows[0] });
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') console.error('link-status error:', err);
    res.status(500).json({ error: pgErrMsg(err) });
  }
});

// ── PATIENT → unlink from caregiver ──────────────────────────────────────────
router.delete('/unlink', auth, requireRole('patient'), async (req, res) => {
  try {
    await query(
      'DELETE FROM caregiver_patient_links WHERE patient_id = $1',
      [req.user.userId]
    );
    res.json({ message: 'Unlinked successfully' });
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') console.error('unlink error:', err);
    res.status(500).json({ error: pgErrMsg(err) });
  }
});

// ============================================================
// CAREGIVER → get list of linked patients
// ============================================================
router.get('/patients', auth, requireRole('caregiver'), async (req, res) => {
  try {
    const r = await query(
      `SELECT cpl.id AS link_id, cpl.status, cpl.created_at,
              u.id AS patient_id, u.name, u.email, u.username, u.phone_number
       FROM caregiver_patient_links cpl
       JOIN users u ON u.id = cpl.patient_id
       WHERE cpl.caregiver_id = $1
       ORDER BY cpl.status DESC, u.name ASC`,
      [req.user.userId]
    );
    res.json({ patients: r.rows });
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') console.error('get patients error:', err);
    res.status(500).json({ error: pgErrMsg(err) });
  }
});

// ── CAREGIVER → accept a link request ────────────────────────────────────────
router.put('/link/:id/accept', auth, requireRole('caregiver'), async (req, res) => {
  try {
    const r = await query(
      `UPDATE caregiver_patient_links
       SET status = 'accepted'
       WHERE id = $1 AND caregiver_id = $2
       RETURNING *`,
      [req.params.id, req.user.userId]
    );
    if (!r.rows.length) return res.status(404).json({ error: 'Link request not found' });
    res.json({ message: 'Patient accepted', link: r.rows[0] });
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') console.error('accept error:', err);
    res.status(500).json({ error: pgErrMsg(err) });
  }
});

// ── CAREGIVER → reject a link request ────────────────────────────────────────
router.put('/link/:id/reject', auth, requireRole('caregiver'), async (req, res) => {
  try {
    const r = await query(
      `UPDATE caregiver_patient_links
       SET status = 'rejected'
       WHERE id = $1 AND caregiver_id = $2
       RETURNING *`,
      [req.params.id, req.user.userId]
    );
    if (!r.rows.length) return res.status(404).json({ error: 'Link request not found' });
    res.json({ message: 'Request rejected', link: r.rows[0] });
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') console.error('reject error:', err);
    res.status(500).json({ error: pgErrMsg(err) });
  }
});

// ============================================================
// PATIENT DATA PROXY — caregiver reads a specific patient's data
// All routes verify the caregiver is linked to that patient
// ============================================================

// Stats (journals, memories, reminders)
router.get('/patient/:patientId/stats', auth, requireRole('caregiver'), async (req, res) => {
  try {
    const pid = parseInt(req.params.patientId);
    await assertLinked(req.user.userId, pid);

    const today = new Date().toISOString().split('T')[0];

    const [jr, mr, rr, ar] = await Promise.all([
      query('SELECT COUNT(*) AS total FROM journals WHERE user_id = $1', [pid]),
      query('SELECT COUNT(*) AS total FROM memories WHERE user_id = $1', [pid]),
      query(`SELECT COUNT(*) AS total,
                    SUM(CASE WHEN completed THEN 1 ELSE 0 END) AS done
             FROM reminders WHERE user_id = $1 AND DATE(reminder_date) = $2`, [pid, today]),
      query(`SELECT activity_type, description, timestamp
             FROM user_activities WHERE user_id = $1
             ORDER BY timestamp DESC LIMIT 1`, [pid])
    ]);

    const remTotal = parseInt(rr.rows[0].total || 0);
    const remDone  = parseInt(rr.rows[0].done  || 0);

    res.json({
      journals:   parseInt(jr.rows[0].total || 0),
      memories:   parseInt(mr.rows[0].total || 0),
      reminders_today: remTotal,
      reminders_done:  remDone,
      compliance_pct:  remTotal ? Math.round((remDone / remTotal) * 100) : 0,
      last_activity:   ar.rows[0] || null
    });
  } catch (err) {
    if (err.message === 'NOT_LINKED') return res.status(403).json({ error: 'Not linked to this patient' });
    if (process.env.NODE_ENV !== 'production') console.error('patient stats error:', err);
    res.status(500).json({ error: pgErrMsg(err) });
  }
});

// Activities feed
router.get('/patient/:patientId/activities', auth, requireRole('caregiver'), async (req, res) => {
  try {
    const pid = parseInt(req.params.patientId);
    await assertLinked(req.user.userId, pid);

    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    const r = await query(
      `SELECT activity_type, description, timestamp
       FROM user_activities WHERE user_id = $1
       ORDER BY timestamp DESC LIMIT $2`,
      [pid, limit]
    );
    res.json({ activities: r.rows });
  } catch (err) {
    if (err.message === 'NOT_LINKED') return res.status(403).json({ error: 'Not linked to this patient' });
    if (process.env.NODE_ENV !== 'production') console.error('patient activities error:', err);
    res.status(500).json({ error: pgErrMsg(err) });
  }
});

// Last known location
router.get('/patient/:patientId/location', auth, requireRole('caregiver'), async (req, res) => {
  try {
    const pid = parseInt(req.params.patientId);
    await assertLinked(req.user.userId, pid);

    const r = await query(
      `SELECT latitude, longitude, address, timestamp
       FROM locations WHERE user_id = $1
       ORDER BY timestamp DESC LIMIT 1`,
      [pid]
    );
    res.json({ location: r.rows[0] || null });
  } catch (err) {
    if (err.message === 'NOT_LINKED') return res.status(403).json({ error: 'Not linked to this patient' });
    if (process.env.NODE_ENV !== 'production') console.error('patient location error:', err);
    res.status(500).json({ error: pgErrMsg(err) });
  }
});

// Mood data (last 14 days)
router.get('/patient/:patientId/moods', auth, requireRole('caregiver'), async (req, res) => {
  try {
    const pid = parseInt(req.params.patientId);
    await assertLinked(req.user.userId, pid);

    const r = await query(
      `SELECT mood, entry_date::text FROM journals
       WHERE user_id = $1 AND entry_date >= NOW() - INTERVAL '14 days'
       ORDER BY entry_date ASC`,
      [pid]
    );
    res.json({ moods: r.rows });
  } catch (err) {
    if (err.message === 'NOT_LINKED') return res.status(403).json({ error: 'Not linked to this patient' });
    if (process.env.NODE_ENV !== 'production') console.error('patient moods error:', err);
    res.status(500).json({ error: pgErrMsg(err) });
  }
});

// Patient scan reports
router.get('/patient/:patientId/reports', auth, requireRole('caregiver'), async (req, res) => {
  try {
    const pid = parseInt(req.params.patientId);
    await assertLinked(req.user.userId, pid);
    const r = await query(
      `SELECT id, file_name, result, risk_score, findings, doctor, notes, report_date, created_at
       FROM reports WHERE user_id = $1
       ORDER BY created_at DESC`,
      [pid]
    );
    res.json({ reports: r.rows });
  } catch (err) {
    if (err.message === 'NOT_LINKED') return res.status(403).json({ error: 'Not linked to this patient' });
    if (process.env.NODE_ENV !== 'production') console.error('patient reports error:', err);
    res.status(500).json({ error: pgErrMsg(err) });
  }
});

// ============================================================
// MESSAGES
// ============================================================

// CAREGIVER → send message to a patient
router.post('/message', auth, requireRole('caregiver'), async (req, res) => {
  try {
    const { patient_id, message } = req.body;
    if (!patient_id || !message) {
      return res.status(400).json({ error: 'patient_id and message are required' });
    }

    await assertLinked(req.user.userId, patient_id);

    const r = await query(
      `INSERT INTO caregiver_messages (caregiver_id, patient_id, message)
       VALUES ($1, $2, $3) RETURNING id, message, created_at`,
      [req.user.userId, patient_id, message.trim()]
    );

    res.status(201).json({ message: 'Message sent', data: r.rows[0] });
  } catch (err) {
    if (err.message === 'NOT_LINKED') return res.status(403).json({ error: 'Not linked to this patient' });
    if (process.env.NODE_ENV !== 'production') console.error('send message error:', err);
    res.status(500).json({ error: pgErrMsg(err) });
  }
});

// CAREGIVER → view messages sent to a patient
router.get('/messages/patient/:patientId', auth, requireRole('caregiver'), async (req, res) => {
  try {
    const pid = parseInt(req.params.patientId);
    await assertLinked(req.user.userId, pid);

    const r = await query(
      `SELECT id, message, is_read, created_at
       FROM caregiver_messages
       WHERE caregiver_id = $1 AND patient_id = $2
       ORDER BY created_at DESC LIMIT 50`,
      [req.user.userId, pid]
    );
    res.json({ messages: r.rows });
  } catch (err) {
    if (err.message === 'NOT_LINKED') return res.status(403).json({ error: 'Not linked to this patient' });
    if (process.env.NODE_ENV !== 'production') console.error('get messages error:', err);
    res.status(500).json({ error: pgErrMsg(err) });
  }
});

// PATIENT → inbox: read messages from their caregiver
router.get('/messages/inbox', auth, requireRole('patient'), async (req, res) => {
  try {
    const r = await query(
      `SELECT cm.id, cm.message, cm.is_read, cm.created_at,
              u.name AS caregiver_name
       FROM caregiver_messages cm
       JOIN users u ON u.id = cm.caregiver_id
       WHERE cm.patient_id = $1
       ORDER BY cm.created_at DESC LIMIT 20`,
      [req.user.userId]
    );
    const unread = r.rows.filter(m => !m.is_read).length;
    res.json({ messages: r.rows, unread_count: unread });
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') console.error('inbox error:', err);
    res.status(500).json({ error: pgErrMsg(err) });
  }
});

// PATIENT → mark a message as read
router.put('/messages/:id/read', auth, requireRole('patient'), async (req, res) => {
  try {
    await query(
      `UPDATE caregiver_messages SET is_read = TRUE
       WHERE id = $1 AND patient_id = $2`,
      [req.params.id, req.user.userId]
    );
    res.json({ message: 'Marked as read' });
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') console.error('mark read error:', err);
    res.status(500).json({ error: pgErrMsg(err) });
  }
});

module.exports = router;
