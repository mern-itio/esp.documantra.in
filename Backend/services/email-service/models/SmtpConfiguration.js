const mongoose = require('mongoose');
const SmtpConfigurationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
  },

  provider: {
    type: String,
    enum: ['gmail', 'zoho', 'webmail', 'other'],
    required: true
  },

  // UI / Email identity
  displayName: { type: String },
  fromName: { type: String },
  fromEmail: { type: String, required: true },

  // SMTP server details (used by webmail + fallback)
  smtp: {
    host: { type: String },
    port: { type: Number },
    secure: { type: Boolean, default: true } // true = SSL (465), false = STARTTLS (587)
  },

  // Generic credential container (DO NOT store raw values)
  credentials: {
    username: { type: String },              // email or smtp username
    password: { type: String },             // password
  },

  // Status / health
  isVerified: { type: Boolean, default: false },
  lastTestedAt: { type: Date },
  lastError: { type: String },
  isDefault: { type: Boolean, default: false },
  status: {type: String, enum: ['active', 'inactive'], default: 'inactive' }

}, { timestamps: true });
module.exports = mongoose.model('SmtpConfiguration', SmtpConfigurationSchema);