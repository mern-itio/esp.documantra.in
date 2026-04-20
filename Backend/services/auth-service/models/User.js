const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  fullname: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  address: { type: String, required: false, default: '' },
  company: { type: String, required: false, default: '' },
  phone: { type: String, required: false, sparse: true },
  aadharNumber:{type: String, required:false},
  password: { type: String, required: false },
  googleId: { type: String, required: false, unique: true, sparse: true },
  gender: { type: String, enum: ['male', 'female', 'other'], required: false, default: null },
  dob: { type: Date, required: false, default: null },
  status: { type: Boolean, default: true },
  // User subscription plan indicator (null => treated as Free plan)
  plan: { type: String, enum: ['free', 'pro', 'custom'], default: null },
  // Flag for first login tutorial
  isFirstLogin: { type: Boolean, default: true },
  // Forgot password
  resetPasswordToken: { type: String, default: null },
  resetPasswordExpires: { type: Date, default: null },
  // Log of reset requests (for 24h limit: max 2 per 24 hours)
  resetPasswordRequestLog: [{ requestedAt: { type: Date, required: true } }],
  // Signup verification (email + phone OTP)
  emailVerified: { type: Boolean, default: false },
  phoneVerified: { type: Boolean, default: false },
  emailOtpHash: { type: String, default: null },
  emailOtpExpires: { type: Date, default: null },
  phoneOtpHash: { type: String, default: null },
  phoneOtpExpires: { type: Date, default: null },
  pendingEmail: { type: String, default: null },
  pendingPhone: { type: String, default: null },
  // Two-factor authentication (2FA) - optional after signup
  twoFaEnabled: { type: Boolean, default: false },
  twoFaMethod: { type: String, enum: ['email', 'sms', 'authenticator'], default: 'email' },
  twoFaOtpHash: { type: String, default: null },
  twoFaOtpExpires: { type: Date, default: null },
  twoFaAuthenticatorSecret: { type: String, default: null },
  twoFaAuthenticatorTempSecret: { type: String, default: null },
  twoFaAuthenticatorVerifiedAt: { type: Date, default: null },
  recoveryEmail: { type: String, default: null },
  recoveryEmailVerified: { type: Boolean, default: false },
  pendingRecoveryEmail: { type: String, default: null },
  recoveryEmailOtpHash: { type: String, default: null },
  recoveryEmailOtpExpires: { type: Date, default: null },
  twoFaRecoveryQuestions: [{
    question: { type: String, required: true },
    answerHash: { type: String, required: true },
  }],
  twoFaRecoveryOtpHash: { type: String, default: null },
  twoFaRecoveryOtpExpires: { type: Date, default: null },
  /** SHA-256 hashes of one-time backup codes (8 digits); plain codes shown only once at generation */
  twoFaBackupCodeHashes: { type: [String], default: [] },
  // Trusted devices for 2FA (store hashed device ids)
  trustedDevices: [{
    deviceIdHash: { type: String, required: true },
    label: { type: String, default: '' },
    lastUsedAt: { type: Date, default: null },
    createdAt: { type: Date, default: () => new Date() },
  }],
  // Active sessions (Device / Session Management)
  activeSessions: [{
    sessionId: { type: String, required: true },
    deviceInfo: { type: String, default: 'Unknown Device' },
    ipAddress: { type: String, default: 'Unknown IP' },
    lastActive: { type: Date, default: () => new Date() },
    createdAt: { type: Date, default: () => new Date() },
  }],
  // Known IPs and Devices for Security Alerts
  knownIps: [{ type: String }],
  knownUserAgents: [{ type: String }],
  knownDeviceIds: [{ type: String }],
  // Account locking
  failedLoginAttempts: { type: Number, required: true, default: 0 },
  lockUntil: { type: Date },
  /** Set when this user registered via a referral link (referrer's User id). */
  referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
}, { timestamps: true });

// 🔐 Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  try {
    this.password = await bcrypt.hash(this.password, 10);
    next();
  } catch (err) {
    next(err);
  }
});

// 🔍 Compare passwords
userSchema.methods.isPasswordCorrect = async function (enteredPassword) {
  if (!this.password) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};
const User = mongoose.model('User', userSchema);
module.exports = User;   

