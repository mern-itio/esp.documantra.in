const axios = require('axios');
const https = require('https');

const DEFAULT_SANDBOX_BASE = 'https://sandbox.surepass.app';
const DEFAULT_PRODUCTION_BASE = 'https://kyc-api.surepass.app';

const resolveBearerToken = (apiKeyRef) => {
  if (apiKeyRef && String(apiKeyRef).trim()) {
    return String(apiKeyRef).trim();
  }
  return process.env.SUREPASS_BEARER_TOKEN || '';
};

const resolveBaseUrl = (apiBaseUrl) => {
  const fromConfig = apiBaseUrl && String(apiBaseUrl).trim();
  if (fromConfig) return fromConfig.replace(/\/+$/, '');
  const fromEnv = process.env.SUREPASS_API_BASE_URL && String(process.env.SUREPASS_API_BASE_URL).trim();
  if (fromEnv) return fromEnv.replace(/\/+$/, '');
  const env = (process.env.SUREPASS_ENV || process.env.NODE_ENV || '').toLowerCase();
  return env === 'production' ? DEFAULT_PRODUCTION_BASE : DEFAULT_SANDBOX_BASE;
};

const extractVerificationUrl = (payload) => {
  const data = payload?.data || payload || {};
  return (
    data.url
    || data.link
    || data.verification_url
    || data.redirect_url
    || data.digilocker_url
    || null
  );
};

exports.initializeSession = async ({
  apiKeyRef,
  apiBaseUrl,
  authType = 'link',
  webhookUrl,
  redirectUrl,
  logoUrl,
  skipMainScreen = false,
  signupFlow = true,
  initializePath = '/api/v1/digilocker/initialize',
}) => {
  const bearerToken = resolveBearerToken(apiKeyRef);
  if (!bearerToken) {
    const err = new Error('Surepass bearer token is not configured');
    err.code = 'SUREPASS_TOKEN_MISSING';
    throw err;
  }

  const baseUrl = resolveBaseUrl(apiBaseUrl);
  const endpoint = `${baseUrl}${initializePath.startsWith('/') ? initializePath : `/${initializePath}`}`;

  const body = {
    data: {
      signup_flow: signupFlow,
      skip_main_screen: skipMainScreen,
    },
  };

  // Surepass only accepts auth_type "app" for SDK. Via-link flow omits auth_type.
  if (authType && authType !== 'link') {
    body.data.auth_type = authType;
  }

  if (webhookUrl) body.data.webhook_url = webhookUrl;
  if (redirectUrl) body.data.redirect_url = redirectUrl;
  if (logoUrl) body.data.logo_url = logoUrl;

  try {
    const res = await axios.post(endpoint, body, {
      headers: {
        Authorization: `Bearer ${bearerToken}`,
        'Content-Type': 'application/json',
      },
      timeout: 15000,
      httpsAgent: new https.Agent({ keepAlive: false }),
    });

    return res.data;
  } catch (err) {
    const surepassMessage = err.response?.data?.message
      || err.response?.data?.error
      || err.message;
    const wrapped = new Error(surepassMessage);
    wrapped.code = err.code;
    wrapped.response = err.response;
    throw wrapped;
  }
};

exports.extractVerificationUrl = extractVerificationUrl;

exports.downloadAadhaar = async ({ clientId, apiKeyRef, apiBaseUrl }) => {
  const bearerToken = resolveBearerToken(apiKeyRef);
  if (!bearerToken) {
    const err = new Error('Surepass bearer token is not configured');
    err.code = 'SUREPASS_TOKEN_MISSING';
    throw err;
  }
  if (!clientId) {
    const err = new Error('client_id is required to download Aadhaar');
    err.code = 'SUREPASS_CLIENT_ID_MISSING';
    throw err;
  }

  const baseUrl = resolveBaseUrl(apiBaseUrl);
  const endpoint = `${baseUrl}/api/v1/digilocker/download-aadhaar/${encodeURIComponent(clientId)}`;

  const res = await axios.post(endpoint, {}, {
    headers: {
      Authorization: `Bearer ${bearerToken}`,
      'Content-Type': 'application/json',
    },
    timeout: 20000,
    httpsAgent: new https.Agent({ keepAlive: false }),
  });

  return res.data;
};
