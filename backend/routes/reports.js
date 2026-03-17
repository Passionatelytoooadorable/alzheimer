/**
 * routes/reports.js
 * GET    /api/reports      — load all reports for the user
 * POST   /api/reports      — save a new report
 * DELETE /api/reports/:id  — delete a report
 */
const express = require('express');
const { query } = require('../config/database');
const auth   = require('../middleware/auth');
const router = express.Router();

// ── GET /api/reports ─────────────────────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const result = await query(
      `SELECT * FROM scan_reports
       WHERE user_id = $1
       ORDER BY report_date DESC`,
      [userId]
    );

    const reports = result.rows.map(r => ({
      id:        r.id,
      fileName:  r.file_name,
      date:      r.report_date_label,
      timestamp: r.report_date,
      result:    r.result,
      riskScore: r.risk_score,
      findings:  r.findings  ? JSON.parse(r.findings)  : [],
      notes:     r.notes     || '',
      doctor:    r.doctor    || '',
      manual:    r.is_manual || false
    }));

    res.json({ reports });
  } catch (err) {
    console.error('GET /reports error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── POST /api/reports ────────────────────────────────────────────
router.post('/', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { fileName, date, timestamp, result, riskScore, findings, notes, doctor, manual } = req.body;

    const saved = await query(
      `INSERT INTO scan_reports
         (user_id, file_name, report_date_label, report_date,
          result, risk_score, findings, notes, doctor, is_manual)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING id`,
      [
        userId,
        fileName  || 'report.pdf',
        date      || new Date().toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' }),
        timestamp || new Date().toISOString(),
        result    || 'Negative',
        riskScore || 0,
        findings  ? JSON.stringify(findings) : '[]',
        notes     || '',
        doctor    || '',
        manual    || false
      ]
    );

    await query(
      `INSERT INTO user_activities (user_id, activity_type, description)
       VALUES ($1,$2,$3)`,
      [userId, 'report_added', `Scan report saved: ${fileName || 'report.pdf'}`]
    );

    res.status(201).json({ message: 'Report saved', id: saved.rows[0].id });
  } catch (err) {
    console.error('POST /reports error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── DELETE /api/reports/:id ──────────────────────────────────────
router.delete('/:id', auth, async (req, res) => {
  try {
    const userId   = req.user.userId;
    const reportId = req.params.id;

    const result = await query(
      'DELETE FROM scan_reports WHERE id=$1 AND user_id=$2 RETURNING id',
      [reportId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }

    res.json({ message: 'Report deleted' });
  } catch (err) {
    console.error('DELETE /reports error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
