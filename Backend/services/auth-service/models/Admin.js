const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const adminUserSchema = new mongoose.Schema({
  fullname: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['superadmin', 'admin', 'auditor'], default: 'admin' },
  status: { type: Boolean, default: true },
  lastLoginAt: { type: Date, default: null },
  permissions: {
    type: [String], // e.g. ['MANAGE_USERS', 'VIEW_AUDIT_LOGS']
    default: []
  },
  resetPasswordToken: { type: String, default: null },
  resetPasswordExpires: { type: Date, default: null },
  resetPasswordRequestLog: [{ requestedAt: { type: Date, required: true } }],
  passwordChangedAt: { type: Date, default: null },
  twoFaEnabled: { type: Boolean, default: false },
  twoFaAuthenticatorSecret: { type: String, default: null },
  twoFaAuthenticatorTempSecret: { type: String, default: null },
  twoFaAuthenticatorVerifiedAt: { type: Date, default: null },
  twoFaBackupCodeHashes: [{ type: String }],
  passwordHistory: [{
    hash: { type: String, required: true },
    changedAt: { type: Date, default: Date.now },
  }],
}, { timestamps: true });

// 🔐 Hash password before saving
adminUserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    this.password = await bcrypt.hash(this.password, 10);
    next();
  } catch (err) {
    next(err);
  }
});

// 🔍 Compare passwords
adminUserSchema.methods.isPasswordCorrect = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// 🧠 Optional: Update last login
adminUserSchema.methods.updateLastLogin = async function () {
  this.lastLoginAt = new Date();
  await this.save();
};

const AdminUser = mongoose.model('AdminUser', adminUserSchema);
module.exports = AdminUser;
