const { getRequestMeta } = require('@draftnsign/validators/userConsent');
const { resolveGeoFromIp, sendSignupMarketingEmail } = require('./email');

function trimStr(value, max = 1024) {
  if (value == null) return '';
  return String(value).trim().slice(0, max);
}

function isInternalUrl(url) {
  if (!url) return false;
  try {
    const host = new URL(url).hostname.toLowerCase();
    return host === 'documantra.in' || host.endsWith('.documantra.in') || host === 'localhost' || host === '127.0.0.1';
  } catch {
    return /documantra\.in/i.test(String(url));
  }
}

function isEspSignupUrl(url) {
  if (!url) return false;
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();
    const path = (u.pathname || '').replace(/\/+$/, '') || '/';
    return (host === 'esp.documantra.in' || host === 'esign.documantra.in') && path === '/signup';
  } catch {
    return false;
  }
}

function pickExternalReferrer(body = {}, req) {
  const candidates = [
    body.externalReferrer,
    body.httpReferrer,
    body.signupHttpReferrer,
    body.signupExternalReferrer,
    // Only use request Referer when it is a true external site (never ESP/marketing).
    req?.headers?.referer,
    req?.headers?.referrer,
  ];
  for (const raw of candidates) {
    const value = trimStr(raw, 1024);
    if (!value) continue;
    if (isInternalUrl(value) || isEspSignupUrl(value)) continue;
    return value;
  }
  return '';
}

function pickLandingPage(body = {}) {
  const candidates = [body.landingPage, body.signupLandingPage, body.dm_landing];
  for (const raw of candidates) {
    const value = trimStr(raw, 1024);
    if (!value) continue;
    if (isEspSignupUrl(value)) continue;
    return value;
  }
  // Last resort: accept signup URL only if nothing else exists.
  return trimStr(body.landingPage || body.signupLandingPage, 1024);
}

function normalizeJourney(raw) {
  if (!Array.isArray(raw)) {
    if (typeof raw === 'string' && raw.trim()) {
      try {
        const parsed = JSON.parse(raw);
        return normalizeJourney(parsed);
      } catch {
        return [];
      }
    }
    return [];
  }
  return raw
    .slice(0, 30)
    .map((step) => ({
      url: trimStr(step?.url, 1024),
      title: trimStr(step?.title, 200),
      at: trimStr(step?.at, 64),
      referrer: trimStr(step?.referrer, 1024),
    }))
    .filter((step) => step.url);
}

/**
 * Build signup attribution from request IP/UA + optional body fields from the SPA.
 */
async function buildSignupAttribution(req, body = {}) {
  const { ipAddress, userAgent } = getRequestMeta(req);
  const geo = await resolveGeoFromIp(ipAddress);
  const externalReferrer = pickExternalReferrer(body, req);
  const landingPage = pickLandingPage(body);
  const landingTitle = trimStr(body.landingTitle || body.dm_title || body.signupLandingTitle, 200);

  return {
    signupIp: trimStr(ipAddress, 128) || 'Unknown IP',
    signupUserAgent: trimStr(userAgent || body.userAgent, 512),
    signupHttpReferrer: externalReferrer,
    signupExternalReferrer: externalReferrer,
    signupLandingPage: landingPage,
    signupLandingTitle: landingTitle,
    signupPageUrl: trimStr(body.signupPageUrl || body.signupPage, 1024),
    signupUtmSource: trimStr(body.utmSource || body.utm_source, 128),
    signupUtmMedium: trimStr(body.utmMedium || body.utm_medium, 128),
    signupUtmCampaign: trimStr(body.utmCampaign || body.utm_campaign, 128),
    signupUtmTerm: trimStr(body.utmTerm || body.utm_term, 200),
    signupUtmContent: trimStr(body.utmContent || body.utm_content, 200),
    signupSearchKeyword: trimStr(body.searchKeyword || body.signupSearchKeyword || body.utmTerm, 200),
    signupTrafficSource: trimStr(body.trafficSource || body.signupTrafficSource, 128),
    signupGclid: trimStr(body.gclid || body.signupGclid, 128),
    signupFbclid: trimStr(body.fbclid || body.signupFbclid, 128),
    signupJourney: normalizeJourney(body.journey || body.signupJourney),
    signupGeo: {
      city: geo.city || '',
      region: geo.region || '',
      country: geo.country || '',
      countryCode: geo.countryCode || '',
      timezone: geo.timezone || '',
      isp: geo.isp || '',
      org: geo.org || '',
      lat: geo.lat ?? null,
      lon: geo.lon ?? null,
      rawQuery: geo.query || '',
    },
  };
}

function attributionFieldsForCreate(attribution) {
  if (!attribution) return {};
  return {
    signupIp: attribution.signupIp,
    signupUserAgent: attribution.signupUserAgent,
    signupHttpReferrer: attribution.signupHttpReferrer,
    signupExternalReferrer: attribution.signupExternalReferrer,
    signupLandingPage: attribution.signupLandingPage,
    signupLandingTitle: attribution.signupLandingTitle,
    signupPageUrl: attribution.signupPageUrl,
    signupUtmSource: attribution.signupUtmSource,
    signupUtmMedium: attribution.signupUtmMedium,
    signupUtmCampaign: attribution.signupUtmCampaign,
    signupUtmTerm: attribution.signupUtmTerm,
    signupUtmContent: attribution.signupUtmContent,
    signupSearchKeyword: attribution.signupSearchKeyword,
    signupTrafficSource: attribution.signupTrafficSource,
    signupGclid: attribution.signupGclid,
    signupFbclid: attribution.signupFbclid,
    signupJourney: attribution.signupJourney,
    signupGeo: attribution.signupGeo,
  };
}

/**
 * Persist attribution on an already-created user (OAuth path) and notify marketing.
 * Never throws — signup must not fail because of notification/geo issues.
 */
async function applySignupAttributionAndNotify(user, req, body = {}, signupMethod = 'email') {
  try {
    const attribution = await buildSignupAttribution(req, body);
    const fields = attributionFieldsForCreate(attribution);
    await UserSafeUpdate(user, fields);

    sendSignupMarketingEmail({
      user: {
        _id: user._id,
        fullname: user.fullname,
        email: user.email,
        phone: user.phone,
        company: user.company,
        createdAt: user.createdAt || new Date(),
      },
      attribution,
      signupMethod,
    }).catch((err) => console.warn('Marketing signup email failed:', err?.message || err));

    return attribution;
  } catch (err) {
    console.warn('Signup attribution failed:', err?.message || err);
    return null;
  }
}

async function UserSafeUpdate(user, fields) {
  if (!user?._id) return;
  Object.assign(user, fields);
  if (typeof user.save === 'function') {
    await user.save({ validateBeforeSave: false });
    return;
  }
  const User = require('../models/User');
  await User.updateOne({ _id: user._id }, { $set: fields });
}

module.exports = {
  buildSignupAttribution,
  attributionFieldsForCreate,
  applySignupAttributionAndNotify,
};
