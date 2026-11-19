const { query } = require('../config/db');
const { isUuid, trimStr } = require('../utils/sanitize');

/**
 * POST /internal/v1/link-customer
 * Headers: x-tracking-secret
 * Body: { customerId, visitorId, linkSource? }
 *
 * Does not trust visitorId as proof of ownership alone — only callable from
 * trusted backends after successful registration/login.
 */
async function linkCustomer(req, res) {
  try {
    const customerId = trimStr(req.body?.customerId || req.body?.userId, 64);
    const visitorId = trimStr(req.body?.visitorId, 64);
    const linkSource = trimStr(req.body?.linkSource || 'signup', 64) || 'signup';

    if (!customerId || !isUuid(visitorId)) {
      return res.status(400).json({
        status: 400,
        message: 'customerId and valid visitorId are required',
      });
    }

    const visitor = await query('SELECT visitor_id FROM visitor_profiles WHERE visitor_id = $1', [
      visitorId,
    ]);
    if (!visitor.rowCount) {
      // Create a stub profile so mapping still works if client never flushed events.
      await query(
        `INSERT INTO visitor_profiles (visitor_id, first_seen_at, last_seen_at, first_source, latest_source)
         VALUES ($1, NOW(), NOW(), 'Direct / Unknown', 'Direct / Unknown')
         ON CONFLICT (visitor_id) DO NOTHING`,
        [visitorId],
      );
      await query(
        `INSERT INTO visitor_attribution (visitor_id, first_touch_source, first_touch_at, latest_touch_source, latest_touch_at)
         VALUES ($1, 'Direct / Unknown', NOW(), 'Direct / Unknown', NOW())
         ON CONFLICT (visitor_id) DO NOTHING`,
        [visitorId],
      );
    }

    await query(
      `INSERT INTO customer_visitor_mapping (customer_id, visitor_id, linked_at, link_source)
       VALUES ($1, $2, NOW(), $3)
       ON CONFLICT (customer_id, visitor_id) DO UPDATE SET linked_at = EXCLUDED.linked_at`,
      [customerId, visitorId, linkSource],
    );

    await query(
      `INSERT INTO visitor_events (visitor_id, event_type, page_url, metadata, created_at)
       VALUES ($1, 'registration_completed', $2, $3::jsonb, NOW())`,
      [
        visitorId,
        trimStr(req.body?.signupPageUrl, 2048),
        JSON.stringify({ customerId, linkSource }),
      ],
    );

    return res.status(200).json({
      status: 200,
      message: 'Visitor linked to customer',
      data: { customerId, visitorId },
    });
  } catch (err) {
    console.error('[visitor-tracking] linkCustomer failed', err.message);
    return res.status(500).json({ status: 500, message: 'link failed' });
  }
}

module.exports = { linkCustomer };
