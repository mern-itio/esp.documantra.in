const { query } = require('../config/db');
const { trimStr, isUuid } = require('../utils/sanitize');

async function loadJourneyForVisitor(visitorId) {
  const profileRes = await query('SELECT * FROM visitor_profiles WHERE visitor_id = $1', [visitorId]);
  if (!profileRes.rowCount) return null;
  const profile = profileRes.rows[0];

  const attrRes = await query('SELECT * FROM visitor_attribution WHERE visitor_id = $1', [visitorId]);
  const attribution = attrRes.rows[0] || null;

  const sessionsRes = await query(
    `SELECT * FROM visitor_sessions WHERE visitor_id = $1 ORDER BY session_start ASC`,
    [visitorId],
  );
  const sessions = sessionsRes.rows;

  const pageViewsRes = await query(
    `SELECT * FROM visitor_page_views WHERE visitor_id = $1 ORDER BY entered_at ASC`,
    [visitorId],
  );
  const eventsRes = await query(
    `SELECT * FROM visitor_events WHERE visitor_id = $1 ORDER BY created_at ASC`,
    [visitorId],
  );
  const ipRes = await query(
    `SELECT ip_address, country, region, city, isp, observed_at
     FROM visitor_ip_observations WHERE visitor_id = $1
     ORDER BY observed_at DESC LIMIT 20`,
    [visitorId],
  );

  const pagesBySession = new Map();
  for (const pv of pageViewsRes.rows) {
    const key = pv.session_id;
    if (!pagesBySession.has(key)) pagesBySession.set(key, []);
    pagesBySession.get(key).push(pv);
  }

  const timeline = [];
  for (const session of sessions) {
    timeline.push({
      at: session.session_start,
      activity: session === sessions[0] ? 'First Visit' : 'Returning Visit',
      details: session.traffic_source || attribution?.first_touch_source || 'Direct / Unknown',
      sessionId: session.session_id,
    });
    const pages = pagesBySession.get(session.session_id) || [];
    for (const page of pages) {
      timeline.push({
        at: page.entered_at,
        activity: 'Page Viewed',
        details: page.page_path || page.page_url,
        title: page.page_title,
        durationSeconds: page.duration_seconds,
        sessionId: session.session_id,
        pageUrl: page.page_url,
      });
    }
    if (session.session_end) {
      timeline.push({
        at: session.session_end,
        activity: 'Session Ended',
        details: 'Exit / timeout',
        sessionId: session.session_id,
      });
    }
  }
  for (const ev of eventsRes.rows) {
    timeline.push({
      at: ev.created_at,
      activity: ev.event_type === 'registration_completed' ? 'Registration' : 'Event',
      details: ev.event_type,
      pageUrl: ev.page_url,
      metadata: ev.metadata,
      sessionId: ev.session_id,
    });
  }
  timeline.sort((a, b) => new Date(a.at) - new Date(b.at));

  return {
    visitorId,
    overview: {
      firstVisit: profile.first_seen_at,
      lastSeen: profile.last_seen_at,
      originalTrafficSource: attribution?.first_touch_source || profile.first_source,
      originalLandingPage: attribution?.first_touch_landing_url || profile.first_landing_url,
      originalReferrer: attribution?.first_touch_referrer || profile.first_referrer,
      latestTrafficSource: attribution?.latest_touch_source || profile.latest_source,
      totalSessions: sessions.length,
      totalPageViews: pageViewsRes.rowCount,
      browser: [profile.browser_name, profile.browser_version].filter(Boolean).join(' '),
      os: profile.os_name,
      deviceType: profile.device_type,
      userAgent: profile.user_agent,
    },
    attribution,
    sessions: sessions.map((s) => ({
      ...s,
      pageViews: pagesBySession.get(s.session_id) || [],
    })),
    events: eventsRes.rows,
    ipObservations: ipRes.rows,
    timeline,
  };
}

async function getCustomerJourney(req, res) {
  try {
    const customerId = trimStr(req.params.customerId, 64);
    if (!customerId) {
      return res.status(400).json({ status: 400, message: 'customerId required' });
    }

    const maps = await query(
      `SELECT visitor_id, linked_at, link_source
       FROM customer_visitor_mapping WHERE customer_id = $1
       ORDER BY linked_at ASC`,
      [customerId],
    );
    if (!maps.rowCount) {
      return res.status(200).json({
        status: 200,
        data: {
          customerId,
          visitorIds: [],
          journeys: [],
          message: 'No visitor history linked yet',
        },
      });
    }

    const journeys = [];
    for (const row of maps.rows) {
      const journey = await loadJourneyForVisitor(row.visitor_id);
      if (journey) {
        journeys.push({
          linkedAt: row.linked_at,
          linkSource: row.link_source,
          ...journey,
        });
      }
    }

    // Prefer earliest visitor as primary overview
    const primary = journeys[0] || null;

    return res.status(200).json({
      status: 200,
      data: {
        customerId,
        visitorIds: maps.rows.map((r) => r.visitor_id),
        overview: primary
          ? {
              anonymousVisitorId: primary.visitorId,
              firstVisit: primary.overview.firstVisit,
              originalTrafficSource: primary.overview.originalTrafficSource,
              originalLandingPage: primary.overview.originalLandingPage,
              latestTrafficSource: journeys[journeys.length - 1]?.overview.latestTrafficSource,
              totalSessions: journeys.reduce((n, j) => n + j.overview.totalSessions, 0),
              totalPageViews: journeys.reduce((n, j) => n + j.overview.totalPageViews, 0),
              browser: primary.overview.browser,
              os: primary.overview.os,
              deviceType: primary.overview.deviceType,
              ipObservations: journeys.flatMap((j) => j.ipObservations || []).slice(0, 20),
            }
          : null,
        journeys,
        timeline: journeys.flatMap((j) => j.timeline || []).sort((a, b) => new Date(a.at) - new Date(b.at)),
      },
    });
  } catch (err) {
    console.error('[visitor-tracking] getCustomerJourney failed', err.message);
    return res.status(500).json({ status: 500, message: 'journey fetch failed' });
  }
}

async function getVisitorJourney(req, res) {
  try {
    const visitorId = trimStr(req.params.visitorId, 64);
    if (!isUuid(visitorId)) {
      return res.status(400).json({ status: 400, message: 'valid visitorId required' });
    }
    const journey = await loadJourneyForVisitor(visitorId);
    if (!journey) {
      return res.status(404).json({ status: 404, message: 'visitor not found' });
    }
    return res.status(200).json({ status: 200, data: journey });
  } catch (err) {
    console.error('[visitor-tracking] getVisitorJourney failed', err.message);
    return res.status(500).json({ status: 500, message: 'journey fetch failed' });
  }
}

module.exports = { getCustomerJourney, getVisitorJourney, loadJourneyForVisitor };
