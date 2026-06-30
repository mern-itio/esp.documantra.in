const mongoose = require('mongoose');
const User = require('../models/User');
const {
  getOrCreateSessionPolicyDoc,
  refreshSessionPolicyCache,
  getSessionPolicySnapshot,
  clampIdleHours,
  clampMaxSessions,
} = require('../utils/sessionPolicy');

function getAdminId(req) {
  return req.user?.id || req.user?.data?.id || req.user?._id || null;
}

async function getSessionPolicy(req, res) {
  try {
    const doc = await getOrCreateSessionPolicyDoc();
    return res.status(200).json({
      config: doc.toObject(),
      effective: getSessionPolicySnapshot(),
    });
  } catch (err) {
    console.error('getSessionPolicy', err);
    return res.status(500).json({ message: 'Failed to load session policy' });
  }
}

async function updateSessionPolicy(req, res) {
  try {
    const adminId = getAdminId(req);
    const body = req.body || {};
    const doc = await getOrCreateSessionPolicyDoc();

    if (body.sessionIdleTimeoutHours !== undefined) {
      doc.sessionIdleTimeoutHours = clampIdleHours(body.sessionIdleTimeoutHours);
    }
    if (body.maxConcurrentSessions !== undefined) {
      doc.maxConcurrentSessions = clampMaxSessions(body.maxConcurrentSessions);
    }

    if (adminId && mongoose.Types.ObjectId.isValid(String(adminId))) {
      doc.updatedBy = adminId;
    }

    await doc.save();
    await refreshSessionPolicyCache();

    return res.status(200).json({
      config: doc.toObject(),
      effective: getSessionPolicySnapshot(),
      message: 'Session policy updated',
    });
  } catch (err) {
    console.error('updateSessionPolicy', err);
    return res.status(500).json({ message: 'Failed to update session policy' });
  }
}

async function getUserSessionsByEmail(req, res) {
  try {
    const email = String(req.query.email || '').trim().toLowerCase();
    if (!email) {
      return res.status(400).json({ message: 'email query parameter is required' });
    }

    const user = await User.findOne({ email }).select(
      'email fullname activeSessions status'
    );
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const sessions = (user.activeSessions || []).map((session) => ({
      sessionId: session.sessionId,
      deviceInfo: session.deviceInfo,
      ipAddress: session.ipAddress,
      lastActive: session.lastActive,
      createdAt: session.createdAt,
    }));

    return res.status(200).json({
      user: {
        id: user._id,
        email: user.email,
        fullname: user.fullname,
        status: user.status,
      },
      sessions,
      maxConcurrentSessions: getSessionPolicySnapshot().maxConcurrentSessions,
      sessionIdleTimeoutHours: getSessionPolicySnapshot().sessionIdleTimeoutHours,
    });
  } catch (err) {
    console.error('getUserSessionsByEmail', err);
    return res.status(500).json({ message: 'Failed to load user sessions' });
  }
}

async function revokeUserSession(req, res) {
  try {
    const { userId, sessionId } = req.body || {};
    if (!userId || !sessionId) {
      return res.status(400).json({ message: 'userId and sessionId are required' });
    }

    const user = await User.findById(userId).select('activeSessions');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const before = user.activeSessions?.length || 0;
    user.activeSessions = (user.activeSessions || []).filter(
      (session) => session.sessionId !== sessionId
    );

    if (user.activeSessions.length === before) {
      return res.status(404).json({ message: 'Session not found' });
    }

    await user.save({ validateBeforeSave: false });
    return res.status(200).json({ message: 'Session revoked successfully' });
  } catch (err) {
    console.error('revokeUserSession', err);
    return res.status(500).json({ message: 'Failed to revoke session' });
  }
}

async function revokeAllUserSessions(req, res) {
  try {
    const { userId } = req.body || {};
    if (!userId) {
      return res.status(400).json({ message: 'userId is required' });
    }

    const user = await User.findById(userId).select('activeSessions');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.activeSessions = [];
    await user.save({ validateBeforeSave: false });
    return res.status(200).json({ message: 'All sessions revoked for user' });
  } catch (err) {
    console.error('revokeAllUserSessions', err);
    return res.status(500).json({ message: 'Failed to revoke sessions' });
  }
}

module.exports = {
  getSessionPolicy,
  updateSessionPolicy,
  getUserSessionsByEmail,
  revokeUserSession,
  revokeAllUserSessions,
};
