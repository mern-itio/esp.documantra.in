const { getRequestMeta } = require('@draftnsign/validators/userConsent');
const { resolveGeoFromIp, sendSignupMarketingEmail } = require('./email');

function trimStr(value, max = 1024) {
  if (value == null) return '';
  return String(value).trim().slice(0, max);
}

/**
 * Build signup attribution from request IP/UA + optional body fields from the SPA.
 */
async function buildSignupAttribution(req, body = {}) {
  const { ipAddress, userAgent } = getRequestMeta(req);
  const geo = await resolveGeoFromIp(ipAddress);

  return {
    signupIp: trimStr(ipAddress, 128) || 'Unknown IP',
    signupUserAgent: trimStr(userAgent || body.userAgent, 512),
    signupHttpReferrer: trimStr(body.httpReferrer || body.signupHttpReferrer || req?.headers?.referer, 1024),
    signupLandingPage: trimStr(body.landingPage || body.signupLandingPage, 1024),
    signupPageUrl: trimStr(body.signupPageUrl || body.signupPage, 1024),
    signupUtmSource: trimStr(body.utmSource || body.utm_source, 128),
    signupUtmMedium: trimStr(body.utmMedium || body.utm_medium, 128),
    signupUtmCampaign: trimStr(body.utmCampaign || body.utm_campaign, 128),
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
    signupLandingPage: attribution.signupLandingPage,
    signupPageUrl: attribution.signupPageUrl,
    signupUtmSource: attribution.signupUtmSource,
    signupUtmMedium: attribution.signupUtmMedium,
    signupUtmCampaign: attribution.signupUtmCampaign,
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
