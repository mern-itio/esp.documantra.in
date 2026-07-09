const mongoose = require('mongoose');
const { CONSENT_TYPES, SUBJECT_TYPES, CONSENT_SOURCES } = require('@draftnsign/validators/userConsent');

const consentTypeValues = Object.values(CONSENT_TYPES);
const subjectTypeValues = Object.values(SUBJECT_TYPES);
const sourceValues = Object.values(CONSENT_SOURCES);

const UserConsentSchema = new mongoose.Schema(
  {
    consentType: { type: String, enum: consentTypeValues, required: true, index: true },
    consentVersion: { type: String, default: 'v1', index: true },
    granted: { type: Boolean, required: true },
    subjectType: { type: String, enum: subjectTypeValues, required: true, index: true },
    subjectId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, default: null, index: true },
    recipientId: { type: mongoose.Schema.Types.ObjectId, default: null, index: true },
    envelopeId: { type: mongoose.Schema.Types.ObjectId, default: null, index: true },
    cycleId: { type: mongoose.Schema.Types.ObjectId, default: null },
    source: { type: String, enum: sourceValues, default: CONSENT_SOURCES.PUBLIC_SIGNER },
    ipAddress: { type: String, default: '' },
    userAgent: { type: String, default: '' },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true, collection: 'userconsents' }
);

UserConsentSchema.index({ subjectType: 1, subjectId: 1, consentType: 1, createdAt: -1 });

module.exports = mongoose.model('UserConsent', UserConsentSchema);
