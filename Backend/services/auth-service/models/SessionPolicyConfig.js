const mongoose = require('mongoose');

/**
 * Singleton session policy (key: 'default') — admin-configurable for VAPT session timeout (#13).
 */
const SessionPolicyConfigSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'default', unique: true, index: true },
    /** Idle timeout before a session is invalidated (hours). */
    sessionIdleTimeoutHours: { type: Number, default: 8, min: 0.25, max: 24 },
    /** Maximum simultaneous logins per user account. */
    maxConcurrentSessions: { type: Number, default: 5, min: 1, max: 20 },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'AdminUser', default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SessionPolicyConfig', SessionPolicyConfigSchema);
