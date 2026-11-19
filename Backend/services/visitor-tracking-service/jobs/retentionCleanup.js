const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const { query, withTransaction } = require('../config/db');

async function getRetentionDays() {
  try {
    const res = await query(`SELECT value FROM tracking_settings WHERE key = 'retention_days'`);
    if (res.rowCount) {
      const n = Number(res.rows[0].value);
      if (Number.isFinite(n) && n > 0) return n;
    }
  } catch {
    /* ignore */
  }
  return Number(process.env.TRACKING_RETENTION_DAYS || 90);
}

async function runRetentionCleanup() {
  const startedAt = new Date();
  const retentionDays = await getRetentionDays();
  const log = {
    deleted_page_views: 0,
    deleted_events: 0,
    deleted_sessions: 0,
    deleted_ip_observations: 0,
    deleted_profiles: 0,
    error_message: null,
  };

  try {
    await withTransaction(async (client) => {
      const cutoffSql = `NOW() - ($1::text || ' days')::interval`;

      const pv = await client.query(
        `DELETE FROM visitor_page_views WHERE entered_at < ${cutoffSql} RETURNING page_view_id`,
        [String(retentionDays)],
      );
      log.deleted_page_views = pv.rowCount;

      const ev = await client.query(
        `DELETE FROM visitor_events WHERE created_at < ${cutoffSql} RETURNING event_id`,
        [String(retentionDays)],
      );
      log.deleted_events = ev.rowCount;

      const ip = await client.query(
        `DELETE FROM visitor_ip_observations WHERE observed_at < ${cutoffSql} RETURNING observation_id`,
        [String(retentionDays)],
      );
      log.deleted_ip_observations = ip.rowCount;

      const sess = await client.query(
        `DELETE FROM visitor_sessions WHERE session_start < ${cutoffSql} RETURNING session_id`,
        [String(retentionDays)],
      );
      log.deleted_sessions = sess.rowCount;

      // Profiles with no remaining activity and last_seen beyond retention
      const profiles = await client.query(
        `DELETE FROM visitor_profiles vp
         WHERE vp.last_seen_at < ${cutoffSql}
           AND NOT EXISTS (SELECT 1 FROM visitor_page_views p WHERE p.visitor_id = vp.visitor_id)
           AND NOT EXISTS (SELECT 1 FROM visitor_events e WHERE e.visitor_id = vp.visitor_id)
           AND NOT EXISTS (SELECT 1 FROM visitor_sessions s WHERE s.visitor_id = vp.visitor_id)
         RETURNING visitor_id`,
        [String(retentionDays)],
      );
      log.deleted_profiles = profiles.rowCount;
    });
  } catch (err) {
    log.error_message = err.message || String(err);
    console.error('[visitor-tracking] retention failed', err);
  }

  await query(
    `INSERT INTO retention_cleanup_logs (
      started_at, finished_at, retention_days,
      deleted_page_views, deleted_events, deleted_sessions, deleted_ip_observations, deleted_profiles, error_message
    ) VALUES ($1, NOW(), $2, $3, $4, $5, $6, $7, $8)`,
    [
      startedAt.toISOString(),
      retentionDays,
      log.deleted_page_views,
      log.deleted_events,
      log.deleted_sessions,
      log.deleted_ip_observations,
      log.deleted_profiles,
      log.error_message,
    ],
  );

  console.log('[visitor-tracking] retention cleanup', { retentionDays, ...log });
  return log;
}

if (require.main === module) {
  runRetentionCleanup()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = { runRetentionCleanup, getRetentionDays };
