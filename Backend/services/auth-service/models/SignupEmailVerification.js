const mongoose = require('mongoose');

const SignupEmailVerificationSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true, index: true, unique: true },
    otpHash: { type: String, default: null },
    otpExpires: { type: Date, default: null },
    verified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SignupEmailVerification', SignupEmailVerificationSchema);
