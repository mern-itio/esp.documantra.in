const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  fullname: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  address: { type: String, required: false, default: '' },
  company: { type: String, required: false, default: '' },
  phone: { type: String, required: true, unique: true },
  password: { type: String, required: true },
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
}, { timestamps: true });

// 🔐 Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    this.password = await bcrypt.hash(this.password, 10);
    next();
  } catch (err) {
    next(err);
  }
});

// 🔍 Compare passwords
userSchema.methods.isPasswordCorrect = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};
const User = mongoose.model('User', userSchema);
module.exports = User;   

