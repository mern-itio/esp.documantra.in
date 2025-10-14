// AuthProvider.js  (dynamic auth methods)
const mongoose = require('mongoose');

const AuthProviderSchema = new mongoose.Schema({
  _id: String,               // "email", "otp", "aadhaar", "custom:govKyc"
  name: String,
  description: String,
  defaultCredits: { type: Number, default: 1 },
  config: {
    providerType: String,
    apiKeyRef: String, // reference to secrets manager key or env variable
    requiredFields: [String],
    callbackUrl: String,
  }, // e.g. { providerType: "twilio", apiKeyRef: "...", requiredFields: [...] }

  uiSchema: {
      securityLevel: {
        type: String,
        enum: ["Low", "Medium", "High"],
        default: "Medium"
      },
      estimatedTime: { type: String },   // e.g. "30 sec" or "3 min"
      costInfo: { type: String },        // e.g. "6 credits"
      compliance: [String]               // e.g. ["ESIGN", "UETA"]
    },
  enabled: { type: Boolean, default: true },
  constraints: { country: [String], maxAttempts: 3 }
}, { timestamps: true });

module.exports = mongoose.model('AuthProvider', AuthProviderSchema);