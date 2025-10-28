const mongoose = require('mongoose');

const AuthProviderSchema = new mongoose.Schema({
  name: String,
  description: String,
  defaultCredits: { type: Number, default: 1 },
  isRecommended: { type: Boolean, default: false },

  // Config object for authentication provider
  config: {
    providerType: String,    // e.g. "twilio", "govKyc"
    apiKeyRef: String,       // reference to secrets manager key or env variable
    requiredFields: [String], // dynamic array of required fields
    callbackUrl: String,
    extraFields: { type: Map, of: String } // <-- dynamic additional config fields
  },

  // UI-specific info for admin
  uiSchema: {
    securityLevel: {
      type: String,
      enum: ["Low", "Medium", "High", "Maximum"],
      default: "Medium"
    },
    estimatedTime: String,    // e.g. "30 sec"
    costInfo: String,         // e.g. "6 credits"
    compliance: [String],     // e.g. ["ESIGN", "UETA"]
    icon: String,            // e.g. "Shield", "Smartphone"
    extraFields: { type: Map, of: String } // <-- dynamic additional UI fields
  },

  enabled: { type: Boolean, default: true },

  constraints: {
    country: { type: [String], default: ['IN','US'] },
    maxAttempts: { type: Number, default: 3 }
  }

}, { timestamps: true });

module.exports = mongoose.model('AuthProvider', AuthProviderSchema);
