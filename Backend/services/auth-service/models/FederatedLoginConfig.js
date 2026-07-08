const mongoose = require('mongoose');

const FederatedProviderSchema = new mongoose.Schema(
  {
    provider: {
      type: String,
      enum: ['google', 'facebook', 'linkedin', 'twitter'],
      required: true,
    },
    enabled: { type: Boolean, default: false },
    clientId: { type: String, default: '' },
    clientSecret: { type: String, default: '', select: false },
    callbackUrl: { type: String, default: '' },
    scopes: { type: String, default: '' },
  },
  { _id: false }
);

/**
 * Singleton federated login settings (key: 'default') — admin-configurable OAuth providers.
 */
const FederatedLoginConfigSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'default', unique: true, index: true },
    providers: { type: [FederatedProviderSchema], default: [] },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'AdminUser', default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('FederatedLoginConfig', FederatedLoginConfigSchema);
