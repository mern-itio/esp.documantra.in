const crypto = require('crypto');
const http = require('http');

const FAILED_AUDIT_ACTIONS = new Set([
  'SIGNING_FAILED',
  'PEM_SIGNING_FAILED',
  'P12_SIGNING_FAILED',
  'TSA_REQUEST_FAILED',
  'TSA_VISUAL_FAILED',
  'FINAL_SAVE_FAILED',
  'PREPARED_OVERWRITE_FAILED',
  'PLACEHOLDER_ADD_FAILED',
  'NO_CERT_FOUND',
  'CERT_MALFORMED',
  'NO_SIGNER_FOR_FIELD',
]);

function maskAadhaar(value) {
  const digits = String(value || '').replace(/\D/g, '');
  if (digits.length < 4) return '';
  const tail = digits.slice(-4).split('').join(' ');
  return `XXXX XXXX ${tail}`;
}

/** Last 4 digits only — safe to expose in API/UI. */
function extractAadhaarLast4(aadhaarNumber) {
  const digits = String(aadhaarNumber || '').replace(/\D/g, '');
  return digits.length >= 4 ? digits.slice(-4) : '';
}

function resolveAadhaarLast4({ aadhaarNumber, signingEvidence } = {}) {
  const fromEvidence = extractAadhaarLast4(signingEvidence?.aadhaarLast4);
  if (fromEvidence) return fromEvidence;
  return extractAadhaarLast4(aadhaarNumber);
}

function parseClientFromUserAgent(ua = '') {
  const agent = String(ua || '');
  let os = 'Unknown OS';
  if (/Windows NT 10/i.test(agent)) os = 'Windows 10/11';
  else if (/Windows/i.test(agent)) os = 'Windows';
  else if (/Mac OS X/i.test(agent)) os = 'macOS';
  else if (/Android/i.test(agent)) os = 'Android';
  else if (/iPhone|iPad|iOS/i.test(agent)) os = 'iOS';
  else if (/Linux/i.test(agent)) os = 'Linux';

  let browser = 'Unknown Browser';
  if (/Edg\//i.test(agent)) browser = 'Microsoft Edge';
  else if (/Chrome\//i.test(agent) && !/Edg\//i.test(agent)) browser = 'Google Chrome';
  else if (/Firefox\//i.test(agent)) browser = 'Mozilla Firefox';
  else if (/Safari\//i.test(agent) && !/Chrome\//i.test(agent)) browser = 'Apple Safari';

  let device = 'Desktop';
  if (/Mobile|Android|iPhone/i.test(agent)) device = 'Mobile';
  else if (/iPad|Tablet/i.test(agent)) device = 'Tablet';

  return { os, browser, device };
}

function buildEvidenceHash(payload) {
  return crypto
    .createHash('sha256')
    .update(JSON.stringify(payload || {}))
    .digest('hex');
}

function mergeSigningEvidence(existing = {}, incoming = {}, reqMeta = {}) {
  const ua = incoming.userAgent || reqMeta.userAgent || existing.userAgent || '';
  const parsed = parseClientFromUserAgent(ua);
  const merged = {
    ...existing,
    ...incoming,
    device: incoming.device || parsed.device || existing.device,
    os: incoming.os || parsed.os || existing.os,
    browser: incoming.browser || parsed.browser || existing.browser,
    userAgent: ua || existing.userAgent,
    ip: incoming.ip || reqMeta.ip || existing.ip,
    isp: incoming.isp || existing.isp || '',
    location: incoming.location || existing.location || '',
    geoCoords: incoming.geoCoords || existing.geoCoords || '',
    latitude: incoming.latitude ?? existing.latitude,
    longitude: incoming.longitude ?? existing.longitude,
    city: incoming.city || existing.city || '',
    region: incoming.region || existing.region || '',
    country: incoming.country || existing.country || '',
    countryCode: incoming.countryCode || existing.countryCode || '',
    zip: incoming.zip || existing.zip || '',
    timezone: incoming.timezone || existing.timezone || '',
    org: incoming.org || existing.org || '',
    asn: incoming.asn || existing.asn || '',
    openedAt: incoming.openedAt || existing.openedAt,
    notificationSentAt: incoming.notificationSentAt || existing.notificationSentAt,
    documentViewedAt: incoming.documentViewedAt || existing.documentViewedAt,
    signCompletedAt: incoming.signCompletedAt || existing.signCompletedAt || new Date(),
    spokenStatement: incoming.spokenStatement || existing.spokenStatement || '',
    livePic: incoming.livePic || existing.livePic || '',
    idPic: incoming.idPic || existing.idPic || '',
    liveMatchPercent: incoming.liveMatchPercent ?? existing.liveMatchPercent,
    handwrittenSignature: incoming.handwrittenSignature || existing.handwrittenSignature || '',
    aadhaarLast4: incoming.aadhaarLast4 || existing.aadhaarLast4 || '',
    aadhaarSignerName: incoming.aadhaarSignerName || existing.aadhaarSignerName || '',
    dualSignature: Boolean(incoming.dualSignature || existing.dualSignature),
    authMethods: Array.isArray(incoming.authMethods) && incoming.authMethods.length
      ? incoming.authMethods
      : existing.authMethods || [],
    timeline: Array.isArray(incoming.timeline) && incoming.timeline.length
      ? incoming.timeline
      : existing.timeline || [],
  };

  merged.evidenceHash = buildEvidenceHash({
    ip: merged.ip,
    userAgent: merged.userAgent,
    signCompletedAt: merged.signCompletedAt,
    authMethods: merged.authMethods,
  });

  if (Array.isArray(incoming.authMethods) && incoming.authMethods.length) {
    const existing = Array.isArray(merged.authMethods) ? merged.authMethods : [];
    const byId = new Map(existing.map((m) => [String(m.authMethodId || m.name), m]));
    incoming.authMethods.forEach((m) => {
      byId.set(String(m.authMethodId || m.name), { ...byId.get(String(m.authMethodId || m.name)), ...m });
    });
    merged.authMethods = Array.from(byId.values());
  }

  return sanitizeSigningEvidence(merged);
}

function buildDefaultTimeline({
  permission,
  recipient,
  signatureFieldCount = 0,
  signingEvidence = {},
  vsignVerified = false,
  aadhaarVerifiedAt = null,
}) {
  const events = [];
  const push = (event, at) => {
    if (!at) return;
    events.push({ event, at: new Date(at) });
  };

  push('Notification Sent', permission?.createdAt || signingEvidence.notificationSentAt);
  push('Document Viewed', signingEvidence.documentViewedAt || signingEvidence.openedAt);
  if (signatureFieldCount > 0) {
    push(
      `Sign Invited at ${signatureFieldCount} place${signatureFieldCount === 1 ? '' : 's'}`,
      signingEvidence.openedAt,
    );
  }

  (signingEvidence.authMethods || [])
    .filter((m) => m && m.status === 'completed')
    .forEach((m) => {
      const label = getAuthCategory(m) === 'aadhaar'
        ? 'Aadhaar eSign Verified'
        : `${m.name || m.type || 'Authentication'} Verified`;
      push(label, m.completedAt || signingEvidence.aadhaarVerifiedAt || signingEvidence.signCompletedAt);
    });

  const hasAadhaarEvent = events.some((e) => /aadhaar/i.test(String(e.event)));
  const resolvedAadhaarAt =
    aadhaarVerifiedAt ||
    signingEvidence.aadhaarVerifiedAt ||
    signingEvidence.vsignVerifiedAt ||
    null;
  const shouldShowAadhaar =
    !hasAadhaarEvent &&
    (resolvedAadhaarAt || vsignVerified);
  if (shouldShowAadhaar) {
    push(
      'Aadhaar eSign Verified',
      resolvedAadhaarAt ||
        signingEvidence.signCompletedAt ||
        permission?.updatedAt,
    );
  }

  push('Sign Completed', signingEvidence.signCompletedAt || permission?.updatedAt);

  events.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
  return events.length ? events : signingEvidence.timeline || [];
}

function filterCertificateAuditLogs(logs = []) {
  return (logs || []).filter((log) => !FAILED_AUDIT_ACTIONS.has(String(log?.action || '')));
}

function normalizeAuthType(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[\s-]+/g, '_');
}

function getAuthCategory(method = {}) {
  const type = normalizeAuthType(method.type);
  const name = String(method.name || '').toLowerCase();
  if (type.includes('selfie') || name.includes('selfie')) return 'selfie';
  if (type.includes('liveness') || name.includes('liveness')) return 'liveness';
  if (/aadhaar|aadhar|digilocker/.test(type) || /aadhaar|aadhar|digilocker/.test(name)) return 'aadhaar';
  if (/otp|sms/.test(type) || /otp|sms/.test(name)) return 'otp';
  if (type.includes('email') || name.includes('email')) return 'email';
  if (/video|spoken/.test(type) || /video|spoken/.test(name)) return 'video';
  return 'other';
}

function getCompletedAuthMethods(authMethods = []) {
  return (authMethods || []).filter((m) => m && m.status === 'completed');
}

function hasCompletedAuthCategory(authMethods = [], category) {
  return getCompletedAuthMethods(authMethods).some((m) => getAuthCategory(m) === category);
}

function sanitizeSigningEvidence(evidence = {}) {
  const authMethods = getCompletedAuthMethods(evidence.authMethods);
  const sanitized = {
    ...evidence,
    authMethods,
  };

  const showLive = hasCompletedAuthCategory(authMethods, 'selfie') || hasCompletedAuthCategory(authMethods, 'liveness');
  const showId =
    hasCompletedAuthCategory(authMethods, 'liveness') ||
    hasCompletedAuthCategory(authMethods, 'aadhaar');
  const showVideo = hasCompletedAuthCategory(authMethods, 'video');

  if (!showLive) {
    delete sanitized.livePic;
    delete sanitized.livePicUrl;
    delete sanitized.liveMatchPercent;
  }

  if (!showId) {
    delete sanitized.idPic;
    delete sanitized.idPicUrl;
  }

  if (!showVideo) {
    delete sanitized.spokenStatement;
  }

  return sanitized;
}

function buildVerifiedAuthMethodsFromEvidence(evidence = {}, permissionAuthLevel = []) {
  const fromEvidence = getCompletedAuthMethods(evidence.authMethods);
  if (fromEvidence.length) return fromEvidence;

  return (permissionAuthLevel || [])
    .filter((a) => a && a.status === 'completed')
    .map((a) => ({
      authMethodId: String(a.authMethodId || ''),
      name: a.name || 'Authentication',
      type: a.type || 'auth',
      status: 'completed',
      completedAt: evidence.signCompletedAt,
    }));
}

function fetchIpGeoFromApi(ip) {
  return new Promise((resolve) => {
    const cleanIp = String(ip || '').trim();
    if (!cleanIp || /^(127\.|10\.|192\.168\.|::1|localhost)/i.test(cleanIp)) {
      resolve({});
      return;
    }
    const path = `/json/${encodeURIComponent(cleanIp)}?fields=status,country,countryCode,regionName,city,zip,lat,lon,timezone,isp,org,as,query`;
    const req = http.get({ hostname: 'ip-api.com', path, timeout: 5000 }, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          const data = JSON.parse(body);
          if (data?.status !== 'success') {
            resolve({});
            return;
          }
          resolve({
            ip: data.query || cleanIp,
            location: [data.city, data.regionName, data.country].filter(Boolean).join(', '),
            geoCoords: data.lat != null && data.lon != null ? `${data.lat}, ${data.lon}` : '',
            latitude: data.lat,
            longitude: data.lon,
            city: data.city || '',
            region: data.regionName || '',
            country: data.country || '',
            countryCode: data.countryCode || '',
            zip: data.zip || '',
            timezone: data.timezone || '',
            isp: data.isp || '',
            org: data.org || '',
            asn: data.as || '',
          });
        } catch {
          resolve({});
        }
      });
    });
    req.on('error', () => resolve({}));
    req.on('timeout', () => {
      req.destroy();
      resolve({});
    });
  });
}

async function enrichEvidenceWithIpGeo(evidence = {}) {
  if (!evidence?.ip) return evidence;
  const hasGeo = evidence.latitude != null || evidence.location || evidence.city;
  if (hasGeo) return evidence;
  const geo = await fetchIpGeoFromApi(evidence.ip);
  const merged = { ...evidence };
  Object.entries(geo).forEach(([key, value]) => {
    if (value != null && value !== '' && !merged[key]) merged[key] = value;
  });
  return merged;
}

function isAadhaarSigningVerified(evidence) {
  if (!evidence || typeof evidence !== 'object') return false;
  if (evidence.aadhaarVerifiedAt || evidence.vsignVerifiedAt) return true;
  return (evidence.authMethods || []).some(
    (m) => m?.type === 'aadhaar' && m?.status === 'completed',
  );
}

module.exports = {
  FAILED_AUDIT_ACTIONS,
  maskAadhaar,
  extractAadhaarLast4,
  resolveAadhaarLast4,
  parseClientFromUserAgent,
  buildEvidenceHash,
  mergeSigningEvidence,
  buildDefaultTimeline,
  filterCertificateAuditLogs,
  normalizeAuthType,
  getAuthCategory,
  getCompletedAuthMethods,
  hasCompletedAuthCategory,
  sanitizeSigningEvidence,
  buildVerifiedAuthMethodsFromEvidence,
  enrichEvidenceWithIpGeo,
  isAadhaarSigningVerified,
};
