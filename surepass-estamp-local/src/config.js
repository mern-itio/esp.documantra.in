require('dotenv').config();

const DEFAULT_SANDBOX = 'https://sandbox.surepass.app';
const DEFAULT_PRODUCTION = 'https://kyc-api.surepass.app';

const resolveBaseUrl = () => {
  const fromEnv = process.env.SUREPASS_API_BASE_URL && String(process.env.SUREPASS_API_BASE_URL).trim();
  if (fromEnv) return fromEnv.replace(/\/+$/, '');
  const env = (process.env.SUREPASS_ENV || 'sandbox').toLowerCase();
  return env === 'production' ? DEFAULT_PRODUCTION : DEFAULT_SANDBOX;
};

module.exports = {
  port: Number(process.env.PORT || 5090),
  bearerToken: String(process.env.SUREPASS_BEARER_TOKEN || '').trim(),
  baseUrl: resolveBaseUrl(),
  env: (process.env.SUREPASS_ENV || 'sandbox').toLowerCase(),
};
