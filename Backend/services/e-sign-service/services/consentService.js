const UserConsent = require('../models/UserConsent');
const { getRequestMeta } = require('@draftnsign/validators/userConsent');

async function recordConsentEntries(req, entries) {
  if (!Array.isArray(entries) || entries.length === 0) return [];

  const { ipAddress, userAgent } = getRequestMeta(req);
  const docs = entries.map((entry) => ({
    consentType: entry.consentType,
    consentVersion: entry.consentVersion || 'v1',
    granted: entry.granted !== false,
    subjectType: entry.subjectType,
    subjectId: entry.subjectId,
    userId: entry.userId || null,
    recipientId: entry.recipientId || null,
    envelopeId: entry.envelopeId || null,
    cycleId: entry.cycleId || null,
    source: entry.source,
    ipAddress,
    userAgent,
    metadata: entry.metadata || {},
  }));

  return UserConsent.insertMany(docs);
}

module.exports = { recordConsentEntries };
