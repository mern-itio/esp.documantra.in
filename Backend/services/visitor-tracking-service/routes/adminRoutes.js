const express = require('express');
const { requireInternalSecret } = require('../middleware/internalAuth');
const { getCustomerJourney, getVisitorJourney } = require('../controllers/journeyController');
const { query } = require('../config/db');
const { trimStr } = require('../utils/sanitize');

const router = express.Router();

// Admin BFF should call with internal secret (or later admin JWT).
router.use(requireInternalSecret);

router.get('/v1/customers/:customerId/journey', getCustomerJourney);
router.get('/v1/visitors/:visitorId/journey', getVisitorJourney);

router.get('/v1/settings/retention', async (_req, res) => {
  try {
    const r = await query(`SELECT value FROM tracking_settings WHERE key = 'retention_days'`);
    return res.status(200).json({
      status: 200,
      data: { retentionDays: Number(r.rows[0]?.value || process.env.TRACKING_RETENTION_DAYS || 90) },
    });
  } catch (err) {
    return res.status(500).json({ status: 500, message: err.message });
  }
});

router.put('/v1/settings/retention', async (req, res) => {
  try {
    const days = Number(req.body?.retentionDays);
    if (!Number.isFinite(days) || days < 1 || days > 3650) {
      return res.status(400).json({ status: 400, message: 'retentionDays must be 1–3650' });
    }
    await query(
      `INSERT INTO tracking_settings (key, value, updated_at) VALUES ('retention_days', $1, NOW())
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
      [String(Math.floor(days))],
    );
    return res.status(200).json({ status: 200, data: { retentionDays: Math.floor(days) } });
  } catch (err) {
    return res.status(500).json({ status: 500, message: err.message });
  }
});

router.get('/v1/retention-logs', async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const r = await query(
      `SELECT * FROM retention_cleanup_logs ORDER BY created_at DESC LIMIT $1`,
      [limit],
    );
    return res.status(200).json({ status: 200, data: r.rows });
  } catch (err) {
    return res.status(500).json({ status: 500, message: err.message });
  }
});

module.exports = router;
