const CONSENT_TYPES = Object.freeze({
  TERMS_OF_SERVICE: 'terms_of_service',
  PRIVACY_POLICY: 'privacy_policy',
  MARKETING_EMAIL: 'marketing_email',
  ESIGN_ELECTRONIC_RECORDS: 'esign_electronic_records',
});

const SUBJECT_TYPES = Object.freeze({
  USER: 'user',
  RECIPIENT: 'recipient',
  SELF_SIGNER: 'self_signer',
});

const CONSENT_SOURCES = Object.freeze({
  SIGNUP: 'signup',
  PUBLIC_SIGNER: 'public_signer',
  POWERFORM: 'powerform',
  ADMIN: 'admin',
  API: 'api',
});

const DEFAULT_CONSENT_VERSIONS = Object.freeze({
  terms_of_service: 'v1',
  privacy_policy: 'v1',
  marketing_email: 'v1',
  esign_electronic_records: 'v1',
});

function getRequestMeta(req) {
  const forwarded = req?.headers?.['x-forwarded-for'];
  const ipFromForwarded =
    typeof forwarded === 'string' && forwarded.trim()
      ? forwarded.split(',')[0].trim()
      : '';
  const ipAddress =
    ipFromForwarded ||
    req?.ip ||
    req?.socket?.remoteAddress ||
    req?.connection?.remoteAddress ||
    '';
  const userAgent = String(req?.headers?.['user-agent'] || '').slice(0, 512);
  return { ipAddress, userAgent };
}

module.exports = {
  CONSENT_TYPES,
  SUBJECT_TYPES,
  CONSENT_SOURCES,
  DEFAULT_CONSENT_VERSIONS,
  getRequestMeta,
};
