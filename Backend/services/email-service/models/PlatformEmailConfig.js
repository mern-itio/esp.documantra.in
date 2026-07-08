const mongoose = require('mongoose');

/**
 * Singleton platform email settings (Mailgun) — admin-configurable.
 */
const PlatformEmailConfigSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'default', unique: true, index: true },
    enabled: { type: Boolean, default: false },
    provider: { type: String, enum: ['mailgun'], default: 'mailgun' },
    mailgunApiKey: { type: String, default: '', select: false },
    mailgunDomain: { type: String, default: '' },
    mailgunRegion: { type: String, enum: ['us', 'eu'], default: 'us' },
    mailgunHost: { type: String, default: '' },
    dmFromEmail: { type: String, default: '' },
    dmFromName: { type: String, default: 'DocuMantra' },
    /** dm = platform address; user = sender's configured from email (via Mailgun) */
    defaultSenderMode: { type: String, enum: ['dm', 'user'], default: 'dm' },
    /** When user mode but no user from-email, fall back to DM + Reply-To */
    userFallbackReplyTo: { type: Boolean, default: true },
    allowUserSmtpFallback: { type: Boolean, default: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PlatformEmailConfig', PlatformEmailConfigSchema);
