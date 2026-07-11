const mongoose = require('mongoose');

const RecipientPortalSessionSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true, unique: true, index: true },
    refreshTokenHash: { type: String, required: true },
    recipientName: { type: String, default: '' },
    permissions: {
      type: [String],
      default: ['recipient_portal:view_documents'],
    },
    verifiedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true, index: true },
    lastSeenAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

module.exports = mongoose.model('RecipientPortalSession', RecipientPortalSessionSchema);
