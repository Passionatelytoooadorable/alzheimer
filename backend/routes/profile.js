/**
 * routes/profile.js
 * GET  /api/profile          — load profile + medical data
 * POST /api/profile/personal — save personal info
 * POST /api/profile/medical  — save medical info
 */
const express = require('express');
const { query } = require('../config/database');
const auth   = require('../middleware/auth');
const router = express.Router();

// ── GET /api/profile ─────────────────────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const result = await query(
      'SELECT * FROM user_profiles WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.json({ profile: null, medical: null });
    }

    const r = result.rows[0];
    res.json({
      profile: {
        name:          r.name,
        age:           r.age,
        dob:           r.dob,
        gender:        r.gender,
        blood:         r.blood_group,
        phone:         r.phone,
        address:       r.address,
        emergency:     r.emergency_contact,
        joinDate:      r.join_date,
        joinTimestamp: Number(r.join_timestamp)
      },
      medical: {
        doctor:    r.doctor_name,
        hospital:  r.hospital,
        diagnosis: r.diagnosis,
        meds:      r.medications,
        allergies: r.allergies
      }
    });
  } catch (err) {
    console.error('GET /profile error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── POST /api/profile/personal ───────────────────────────────────
router.post('/personal', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { name, age, dob, gender, blood, phone, address, emergency } = req.body;

    const existing = await query(
      'SELECT id FROM user_profiles WHERE user_id = $1', [userId]
    );

    if (existing.rows.length === 0) {
      await query(
        `INSERT INTO user_profiles
           (user_id, name, age, dob, gender, blood_group, phone,
            address, emergency_contact, join_date, join_timestamp)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
        [
          userId, name,
          age  || null, dob  || null, gender || null,
          blood|| null, phone|| null, address|| null, emergency || null,
          new Date().toLocaleDateString('en-US', { year:'numeric', month:'long' }),
          Date.now()
        ]
      );
    } else {
      await query(
        `UPDATE user_profiles SET
           name=$2, age=$3, dob=$4, gender=$5, blood_group=$6,
           phone=$7, address=$8, emergency_contact=$9, updated_at=NOW()
         WHERE user_id=$1`,
        [
          userId, name,
          age  || null, dob  || null, gender   || null,
          blood|| null, phone|| null, address  || null, emergency || null
        ]
      );
    }

    // Keep users.name in sync
    if (name) {
      await query('UPDATE users SET name=$2 WHERE id=$1', [userId, name]);
    }

    res.json({ message: 'Personal info saved' });
  } catch (err) {
    console.error('POST /profile/personal error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── POST /api/profile/medical ────────────────────────────────────
router.post('/medical', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { doctor, hospital, diagnosis, meds, allergies } = req.body;

    const existing = await query(
      'SELECT id FROM user_profiles WHERE user_id = $1', [userId]
    );

    if (existing.rows.length === 0) {
      await query(
        `INSERT INTO user_profiles
           (user_id, doctor_name, hospital, diagnosis, medications, allergies,
            join_date, join_timestamp)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [
          userId,
          doctor || null, hospital || null, diagnosis || null,
          meds   || null, allergies|| null,
          new Date().toLocaleDateString('en-US', { year:'numeric', month:'long' }),
          Date.now()
        ]
      );
    } else {
      await query(
        `UPDATE user_profiles SET
           doctor_name=$2, hospital=$3, diagnosis=$4,
           medications=$5, allergies=$6, updated_at=NOW()
         WHERE user_id=$1`,
        [
          userId,
          doctor || null, hospital || null, diagnosis || null,
          meds   || null, allergies|| null
        ]
      );
    }

    res.json({ message: 'Medical info saved' });
  } catch (err) {
    console.error('POST /profile/medical error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
