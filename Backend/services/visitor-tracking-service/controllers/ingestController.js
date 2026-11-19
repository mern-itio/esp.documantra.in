const { randomUUID } = require('crypto');
const { query, withTransaction } = require('../config/db');
const { classifyTrafficSource } = require('../utils/classifySource');
const { parseUserAgent } = require('../utils/uaParse');
const {
  trimStr,
  isUuid,
  sanitizeUrl,
  pagePathFromUrl,
  referringDomain,
} = require('../utils/sanitize');

const SESSION_TIMEOUT_MS =
  Number(process.env.SESSION_TIMEOUT_MINUTES || 30) * 60 * 1000;

function clientIp(req) {
  const xf = req.headers['x-forwarded-for'];
  if (xf) return String(xf).split(',')[0].trim();
  return req.ip || req.socket?.remoteAddress || '';
}

async function ensureVisitor(client, visitorId, meta) {
  const existing = await client.query(
    'SELECT visitor_id, first_landing_url, first_referrer, first_source FROM visitor_profiles WHERE visitor_id = $1',
    [visitorId],
  );
  const ua = parseUserAgent(meta.userAgent);
  if (existing.rowCount === 0) {
    await client.query(
      `INSERT INTO visitor_profiles (
        visitor_id, first_seen_at, last_seen_at,
        first_landing_url, first_referrer, first_referring_domain, first_source, latest_source,
        latest_referrer, latest_landing_url,
        browser_name, browser_version, os_name, device_type, user_agent
      ) VALUES ($1, NOW(), NOW(), $2, $3, $4, $5, $5, $3, $2, $6, $7, $8, $9, $10)`,
      [
        visitorId,
        meta.landingUrl || meta.pageUrl || '',
        meta.referrer || '',
        referringDomain(meta.referrer || ''),
        meta.source,
        ua.browserName,
        ua.browserVersion,
        ua.osName,
        ua.deviceType,
        ua.userAgent,
      ],
    );
    await client.query(
      `INSERT INTO visitor_attribution (
        visitor_id, first_touch_source, first_touch_referrer, first_touch_landing_url,
        first_touch_campaign, first_touch_medium, first_touch_term, first_touch_content,
        first_touch_gclid, first_touch_fbclid, first_touch_at,
        latest_touch_source, latest_touch_referrer, latest_touch_campaign, latest_touch_medium, latest_touch_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW(),$2,$3,$5,$6,NOW())`,
      [
        visitorId,
        meta.source,
        meta.referrer || '',
        meta.landingUrl || meta.pageUrl || '',
        meta.utmCampaign || '',
        meta.utmMedium || '',
        meta.utmTerm || '',
        meta.utmContent || '',
        meta.gclid || '',
        meta.fbclid || '',
      ],
    );
    return { isNew: true };
  }

  await client.query(
    `UPDATE visitor_profiles SET
      last_seen_at = NOW(),
      latest_source = $2,
      latest_referrer = COALESCE(NULLIF($3, ''), latest_referrer),
      latest_landing_url = COALESCE(NULLIF($4, ''), latest_landing_url),
      browser_name = COALESCE(NULLIF($5, ''), browser_name),
      browser_version = COALESCE(NULLIF($6, ''), browser_version),
      os_name = COALESCE(NULLIF($7, ''), os_name),
      device_type = COALESCE(NULLIF($8, ''), device_type),
      user_agent = COALESCE(NULLIF($9, ''), user_agent),
      updated_at = NOW()
     WHERE visitor_id = $1`,
    [
      visitorId,
      meta.source,
      meta.referrer || '',
      meta.pageUrl || '',
      ua.browserName,
      ua.browserVersion,
      ua.osName,
      ua.deviceType,
      ua.userAgent,
    ],
  );
  await client.query(
    `UPDATE visitor_attribution SET
      latest_touch_source = $2,
      latest_touch_referrer = COALESCE(NULLIF($3, ''), latest_touch_referrer),
      latest_touch_campaign = COALESCE(NULLIF($4, ''), latest_touch_campaign),
      latest_touch_medium = COALESCE(NULLIF($5, ''), latest_touch_medium),
      latest_touch_at = NOW(),
      updated_at = NOW()
     WHERE visitor_id = $1`,
    [visitorId, meta.source, meta.referrer || '', meta.utmCampaign || '', meta.utmMedium || ''],
  );
  return { isNew: false };
}

async function ensureSession(client, visitorId, sessionId, meta) {
  let sid = isUuid(sessionId) ? sessionId : randomUUID();
  const found = await client.query(
    `SELECT session_id, last_activity_at, is_active FROM visitor_sessions WHERE session_id = $1`,
    [sid],
  );
  if (found.rowCount) {
    const last = new Date(found.rows[0].last_activity_at).getTime();
    if (Date.now() - last > SESSION_TIMEOUT_MS) {
      await client.query(
        `UPDATE visitor_sessions SET is_active = FALSE, session_end = last_activity_at WHERE session_id = $1`,
        [sid],
      );
      sid = randomUUID();
    } else {
      await client.query(
        `UPDATE visitor_sessions SET last_activity_at = NOW(), is_active = TRUE WHERE session_id = $1`,
        [sid],
      );
      return sid;
    }
  }

  await client.query(
    `INSERT INTO visitor_sessions (
      session_id, visitor_id, session_start, last_activity_at, landing_page, referrer, traffic_source, entry_title, is_active
    ) VALUES ($1,$2,NOW(),NOW(),$3,$4,$5,$6,TRUE)`,
    [
      sid,
      visitorId,
      meta.landingUrl || meta.pageUrl || '',
      meta.referrer || '',
      meta.source,
      meta.pageTitle || '',
    ],
  );
  return sid;
}

async function recordPageView(client, visitorId, sessionId, event) {
  const pageUrl = sanitizeUrl(event.pageUrl || event.url || '');
  if (!pageUrl) return null;
  const seqRes = await client.query(
    `SELECT COALESCE(MAX(sequence_no), 0) + 1 AS n FROM visitor_page_views WHERE session_id = $1`,
    [sessionId],
  );
  const sequenceNo = seqRes.rows[0].n;
  const prev = await client.query(
    `SELECT page_url FROM visitor_page_views WHERE session_id = $1 ORDER BY entered_at DESC LIMIT 1`,
    [sessionId],
  );
  const previousPage = prev.rows[0]?.page_url || trimStr(event.previousPage, 2048) || null;

  // Close previous open page duration if provided / estimate from last enter
  if (prev.rows[0]) {
    await client.query(
      `UPDATE visitor_page_views
       SET duration_seconds = COALESCE(
         duration_seconds,
         GREATEST(0, EXTRACT(EPOCH FROM (NOW() - entered_at))::int)
       )
       WHERE page_view_id = (
         SELECT page_view_id FROM visitor_page_views WHERE session_id = $1 ORDER BY entered_at DESC LIMIT 1
       )`,
      [sessionId],
    );
  }

  const inserted = await client.query(
    `INSERT INTO visitor_page_views (
      visitor_id, session_id, page_url, page_path, page_title, previous_page, entered_at, duration_seconds, sequence_no
    ) VALUES ($1,$2,$3,$4,$5,$6,NOW(),$7,$8)
    RETURNING page_view_id`,
    [
      visitorId,
      sessionId,
      pageUrl,
      pagePathFromUrl(pageUrl),
      trimStr(event.pageTitle || event.title, 300),
      previousPage,
      Number.isFinite(Number(event.durationSeconds)) ? Number(event.durationSeconds) : null,
      sequenceNo,
    ],
  );
  return inserted.rows[0].page_view_id;
}

async function recordEvent(client, visitorId, sessionId, event) {
  const type = trimStr(event.eventType || event.type, 64);
  if (!type) return null;
  await client.query(
    `INSERT INTO visitor_events (visitor_id, session_id, event_type, page_url, metadata, created_at)
     VALUES ($1,$2,$3,$4,$5::jsonb,NOW())`,
    [
      visitorId,
      sessionId || null,
      type,
      sanitizeUrl(event.pageUrl || ''),
      JSON.stringify(event.metadata && typeof event.metadata === 'object' ? event.metadata : {}),
    ],
  );
}

async function recordIp(client, visitorId, sessionId, ip) {
  if (!ip) return;
  await client.query(
    `INSERT INTO visitor_ip_observations (visitor_id, session_id, ip_address, observed_at)
     VALUES ($1,$2,$3,NOW())`,
    [visitorId, sessionId || null, trimStr(ip, 128)],
  );
}

/**
 * POST /track/v1/batch
 * Body: { visitorId, sessionId, events: [...] }
 * Soft-fail: never throw to client as 500 for business logic; return accepted.
 */
async function ingestBatch(req, res) {
  try {
    const body = req.body || {};
    let visitorId = isUuid(body.visitorId) ? body.visitorId : randomUUID();
    let sessionId = isUuid(body.sessionId) ? body.sessionId : randomUUID();
    const events = Array.isArray(body.events) ? body.events.slice(0, 50) : [];
    if (!events.length && body.type) {
      events.push(body);
    }
    if (!events.length) {
      return res.status(200).json({
        status: 200,
        visitorId,
        sessionId,
        accepted: 0,
      });
    }

    const uaHeader = trimStr(req.headers['user-agent'], 512);
    const ip = clientIp(req);

    const result = await withTransaction(async (client) => {
      let accepted = 0;
      let currentSession = sessionId;

      for (const raw of events) {
        const pageUrl = sanitizeUrl(raw.pageUrl || raw.url || body.pageUrl || '');
        const referrer = sanitizeUrl(raw.referrer || body.referrer || '', 2048);
        const landingUrl = sanitizeUrl(raw.landingUrl || body.landingUrl || pageUrl || '');
        const source = classifyTrafficSource({
          referrer,
          utmSource: raw.utmSource || body.utmSource,
          utmMedium: raw.utmMedium || body.utmMedium,
          gclid: raw.gclid || body.gclid,
          fbclid: raw.fbclid || body.fbclid,
        });
        const meta = {
          pageUrl,
          landingUrl,
          referrer: referringDomain(referrer) && !referringDomain(referrer).endsWith('documantra.in')
            ? referrer
            : sanitizeUrl(raw.externalReferrer || body.externalReferrer || referrer),
          source,
          pageTitle: raw.pageTitle || raw.title || '',
          userAgent: raw.userAgent || uaHeader,
          utmCampaign: raw.utmCampaign || body.utmCampaign,
          utmMedium: raw.utmMedium || body.utmMedium,
          utmTerm: raw.utmTerm || body.utmTerm,
          utmContent: raw.utmContent || body.utmContent,
          gclid: raw.gclid || body.gclid,
          fbclid: raw.fbclid || body.fbclid,
        };

        await ensureVisitor(client, visitorId, meta);
        currentSession = await ensureSession(client, visitorId, currentSession, meta);

        const kind = trimStr(raw.type || raw.eventType || 'page_view', 64).toLowerCase();
        if (kind === 'page_view' || kind === 'pageview') {
          await recordPageView(client, visitorId, currentSession, { ...raw, pageUrl, previousPage: raw.previousPage });
          accepted += 1;
        } else if (kind === 'page_leave' || kind === 'heartbeat') {
          const duration = Number(raw.durationSeconds);
          if (Number.isFinite(duration) && duration >= 0) {
            await client.query(
              `UPDATE visitor_page_views SET duration_seconds = $1
               WHERE page_view_id = (
                 SELECT page_view_id FROM visitor_page_views
                 WHERE session_id = $2 AND page_url = $3
                 ORDER BY entered_at DESC LIMIT 1
               )`,
              [Math.min(duration, 86400), currentSession, pageUrl],
            );
          }
          accepted += 1;
        } else {
          await recordEvent(client, visitorId, currentSession, {
            eventType: kind,
            pageUrl,
            metadata: raw.metadata || {
              label: raw.label || null,
            },
          });
          accepted += 1;
        }
      }

      await recordIp(client, visitorId, currentSession, ip);
      return { accepted, sessionId: currentSession };
    });

    return res.status(200).json({
      status: 200,
      visitorId,
      sessionId: result.sessionId,
      accepted: result.accepted,
    });
  } catch (err) {
    console.error('[visitor-tracking] ingest failed', err.message);
    // Soft-fail: browsing must continue
    return res.status(200).json({
      status: 200,
      accepted: 0,
      softError: true,
    });
  }
}

module.exports = { ingestBatch };
