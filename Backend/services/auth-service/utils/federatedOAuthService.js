const axios = require('axios');
const crypto = require('crypto');
const {
  getEffectiveProviders,
  resolveClientId,
  resolveSecret,
} = require('./federatedLoginPolicy');

async function getProviderRow(provider) {
  const providers = await getEffectiveProviders();
  const row = providers.find((p) => p.provider === provider);
  if (!row || !row.enabled) {
    const err = new Error(`${provider} sign-in is not enabled`);
    err.status = 403;
    throw err;
  }
  const clientId = resolveClientId(row);
  const clientSecret = resolveSecret(row);
  if (!clientId) {
    const err = new Error(`${provider} is not configured`);
    err.status = 503;
    throw err;
  }
  return { ...row, clientId, clientSecret };
}

async function verifyGoogleIdToken(idToken) {
  const row = await getProviderRow('google');
  const { OAuth2Client } = require('google-auth-library');
  const client = new OAuth2Client(row.clientId);
  const ticket = await client.verifyIdToken({
    idToken,
    audience: row.clientId,
  });
  const payload = ticket.getPayload();
  if (!payload?.email || !payload?.sub) {
    const err = new Error('Invalid Google token');
    err.status = 400;
    throw err;
  }
  return {
    email: payload.email,
    name: payload.name || 'Google User',
    providerId: payload.sub,
    providerField: 'googleId',
  };
}

async function exchangeFacebookCode(code, redirectUri) {
  const row = await getProviderRow('facebook');
  if (!row.clientSecret) {
    const err = new Error('Facebook app secret is not configured');
    err.status = 503;
    throw err;
  }
  const tokenRes = await axios.get('https://graph.facebook.com/v21.0/oauth/access_token', {
    params: {
      client_id: row.clientId,
      client_secret: row.clientSecret,
      redirect_uri: redirectUri,
      code,
    },
    timeout: 15000,
  });
  const accessToken = tokenRes.data?.access_token;
  if (!accessToken) {
    const err = new Error('Facebook token exchange failed');
    err.status = 400;
    throw err;
  }
  return verifyFacebookAccessToken(accessToken, row);
}

async function verifyFacebookAccessToken(accessToken, rowOverride) {
  const row = rowOverride || (await getProviderRow('facebook'));
  if (!row.clientSecret) {
    const err = new Error('Facebook app secret is not configured');
    err.status = 503;
    throw err;
  }
  const appToken = `${row.clientId}|${row.clientSecret}`;
  await axios.get('https://graph.facebook.com/debug_token', {
    params: { input_token: accessToken, access_token: appToken },
    timeout: 15000,
  });
  const profileRes = await axios.get('https://graph.facebook.com/me', {
    params: { fields: 'id,name,email', access_token: accessToken },
    timeout: 15000,
  });
  const profile = profileRes.data;
  if (!profile?.id) {
    const err = new Error('Invalid Facebook token');
    err.status = 400;
    throw err;
  }
  if (!profile.email) {
    const err = new Error('Facebook account email is required. Grant email permission in your Facebook app.');
    err.status = 400;
    throw err;
  }
  return {
    email: profile.email,
    name: profile.name || 'Facebook User',
    providerId: String(profile.id),
    providerField: 'facebookId',
  };
}

async function exchangeLinkedInCode(code, redirectUri) {
  const row = await getProviderRow('linkedin');
  if (!row.clientSecret) {
    const err = new Error('LinkedIn client secret is not configured');
    err.status = 503;
    throw err;
  }
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    client_id: row.clientId,
    client_secret: row.clientSecret,
  });
  const tokenRes = await axios.post('https://www.linkedin.com/oauth/v2/accessToken', body.toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    timeout: 15000,
  });
  const accessToken = tokenRes.data?.access_token;
  if (!accessToken) {
    const err = new Error('LinkedIn token exchange failed');
    err.status = 400;
    throw err;
  }
  const profileRes = await axios.get('https://api.linkedin.com/v2/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
    timeout: 15000,
  });
  const profile = profileRes.data;
  if (!profile?.sub) {
    const err = new Error('Invalid LinkedIn token');
    err.status = 400;
    throw err;
  }
  if (!profile.email) {
    const err = new Error('LinkedIn account email is required.');
    err.status = 400;
    throw err;
  }
  return {
    email: profile.email,
    name: profile.name || 'LinkedIn User',
    providerId: String(profile.sub),
    providerField: 'linkedinId',
  };
}

async function exchangeTwitterCode(code, redirectUri, codeVerifier) {
  const row = await getProviderRow('twitter');
  if (!row.clientSecret) {
    const err = new Error('X (Twitter) client secret is not configured');
    err.status = 503;
    throw err;
  }
  if (!codeVerifier) {
    const err = new Error('PKCE code verifier is required for X login');
    err.status = 400;
    throw err;
  }
  const credentials = Buffer.from(`${row.clientId}:${row.clientSecret}`).toString('base64');
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    code_verifier: codeVerifier,
  });
  const tokenRes = await axios.post('https://api.twitter.com/2/oauth2/token', body.toString(), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${credentials}`,
    },
    timeout: 15000,
  });
  const accessToken = tokenRes.data?.access_token;
  if (!accessToken) {
    const err = new Error('X token exchange failed');
    err.status = 400;
    throw err;
  }
  const profileRes = await axios.get('https://api.twitter.com/2/users/me', {
    params: { 'user.fields': 'id,name,username,confirmed_email' },
    headers: { Authorization: `Bearer ${accessToken}` },
    timeout: 15000,
  });
  const profile = profileRes.data?.data;
  if (!profile?.id) {
    const err = new Error('Invalid X token');
    err.status = 400;
    throw err;
  }
  const email =
    profile.confirmed_email ||
    (profile.username ? `${profile.username}@twitter.oauth.local` : `twitter-${profile.id}@oauth.local`);
  return {
    email,
    name: profile.name || profile.username || 'X User',
    providerId: String(profile.id),
    providerField: 'twitterId',
    emailFromProvider: Boolean(profile.confirmed_email),
  };
}

function buildOAuthState() {
  return crypto.randomBytes(16).toString('hex');
}

module.exports = {
  getProviderRow,
  verifyGoogleIdToken,
  verifyFacebookAccessToken,
  exchangeFacebookCode,
  exchangeLinkedInCode,
  exchangeTwitterCode,
  buildOAuthState,
};
