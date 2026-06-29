const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const AdminUser = require('../models/Admin');
const { isEmailValid, getPasswordPolicyError } = require('@draftnsign/validators');
const mongoose = require('mongoose');
const { getAdminAccessTokenCookieOptions } = require('../utils/cookieOptions');
const { sendPasswordResetEmail } = require('../utils/email');
const { getPasswordReuseError, archiveCurrentPassword } = require('../utils/passwordHistory');
const { extractAccessToken } = require('@draftnsign/auth-lib');

const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    if (!email) return res.status(400).json({ message: 'Email required' });
    if (!password) return res.status(400).json({ message: 'Password required' });
    if (!isEmailValid(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    const admin = await AdminUser.findOne({ email: normalizedEmail }); 
    
    if (admin) {
      if (admin.status === false) {
        return res.status(401).json({
          status: 401,
          message: "Your Admin Account has been suspended, please contact the System Owner",
          data: null
        });
      }

      const isPasswdCorrect = await bcrypt.compare(password, admin.password);
      if (!isPasswdCorrect) {
        return res.status(401).json({
          status: 401,
          message: "Invalid Credentials!!!",
          data: null
        });
      }

      const expireIn = process.env.ADMIN_ACCESS_TOKEN_EXPIRY || '8h';
      const token = generateAdminAccessToken(admin, expireIn);

      return res.cookie('adminAccessToken', token, getAdminAccessTokenCookieOptions(req, expireIn)).status(200).json({
        status: 200,
        message: "Admin logged in successfully",
        admin_id: admin._id,
        token,
        type: 'admin',
        admin: {
          id: admin._id,
          fullname: admin.fullname || '',
          email: admin.email,
          role: admin.role || 'admin',
          status: admin.status,
          permissions: Array.isArray(admin.permissions) ? admin.permissions : []
        }
      });
    }
let agent = null;
    let supportServiceAgentId = null;
    let db = null;
    
    try {
      const currentDb = mongoose.connection.db;
      const currentDbName = currentDb.databaseName;
      
      // Check current database for agents
      const currentDbAgentsCollection = currentDb.collection('supportagents');
      const currentDbAgentsCount = await currentDbAgentsCollection.countDocuments();
      
      let allAgents = [];
      db = currentDb; // Set db in outer scope
      let dbName = currentDbName;
      
      if (currentDbAgentsCount > 0) {
        // Agents found in current database
        allAgents = await currentDbAgentsCollection.find({ 
          email: normalizedEmail 
        }).toArray();
      } else {
        // Try support-service database (support-db)
        try {
          const supportDb = mongoose.connection.useDb('support-db');
          db = supportDb.db;
          dbName = 'support-db';
          
          const collections = await db.listCollections().toArray();
          const supportAgentsCollection = db.collection('supportagents');
          const totalAgents = await supportAgentsCollection.countDocuments();
          
          if (totalAgents > 0) {
            allAgents = await supportAgentsCollection.find({ 
              email: normalizedEmail 
            }).toArray();
          }
        } catch (supportDbError) {
          console.error(`[AGENT LOGIN] Error accessing support-db database:`, supportDbError.message);
        }
      }
      
      if (allAgents.length === 0) {
        return res.status(401).json({
          status: 401,     
          message: "Invalid credentials. Please check your Email and Password",
          data: null                                                 
        });
      }
      
      let ticketsCollection = null;
      try {
        ticketsCollection = db.collection('tickets');
      } catch (err) {
        try {
          const supportDb = mongoose.connection.useDb('support-db');
          ticketsCollection = supportDb.db.collection('tickets');
        } catch (supportErr) {
          console.log(`[AGENT LOGIN] Cannot access tickets collection:`, supportErr.message);
        }
      }
      
      let ticketsWithAgent = [];
      if (ticketsCollection) {
        ticketsWithAgent = await ticketsCollection.find({
          assignedAgentId: { $in: allAgents.map(a => a._id) }
        }).limit(1).toArray();
       }
      
      if (ticketsWithAgent.length > 0) {
        supportServiceAgentId = ticketsWithAgent[0].assignedAgentId;
      } else {
        const agentWithTickets = allAgents.find(a => a.currentTickets && Array.isArray(a.currentTickets));
        if (agentWithTickets) {
          supportServiceAgentId = agentWithTickets._id;
       } else {
          allAgents.sort((a, b) => {
            const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return bTime - aTime;
          });
          supportServiceAgentId = allAgents[0]._id;
         }
      }
      
      const agentDoc = allAgents.find(a => a._id.toString() === supportServiceAgentId.toString());
      
      if (!agentDoc) {
        return res.status(401).json({
          status: 401,     
          message: "Invalid credentials. Please check your Email and Password",
          data: null                                                 
        });
      }
      
      agent = agentDoc; 
      
    } catch (dbError) {
      console.error('[AGENT LOGIN] Database error when looking up agent:', dbError);
      console.error('[AGENT LOGIN] Error stack:', dbError.stack);
      return res.status(500).json({
        status: 500,
        message: "Database error. Please try again later.",
        data: null
      });
    }
    
    if (!agent) {
      return res.status(401).json({
        status: 401,     
        message: "Invalid credentials. Please check your Email and Password",
        data: null                                                 
      });
    }

    // Check if agent is active
    if (agent.isActive === false) {
      return res.status(401).json({
        status: 401,
        message: "Your account has been deactivated. Please contact administrator.",
        data: null
      });
    }

    let isPasswordCorrect = false;
    try {
      if (!agent.password) {
        console.error(`[AGENT LOGIN] Agent ${agent.email} has no password field!`);
        return res.status(401).json({
          status: 401,
          message: "Invalid Credentials!!!",
          data: null
        });
      }
      isPasswordCorrect = await bcrypt.compare(password, agent.password);
    } catch (bcryptError) {
      console.error('[AGENT LOGIN] Bcrypt comparison error:', bcryptError);
      return res.status(401).json({
        status: 401,
        message: "Invalid Credentials!!!",
        data: null
      });
    }
    
    if (!isPasswordCorrect) {
      return res.status(401).json({
        status: 401,
        message: "Invalid Credentials!!!",
        data: null
      });
    }
    const expireIn = process.env.AGENT_ACCESS_TOKEN_EXPIRY || process.env.ADMIN_ACCESS_TOKEN_EXPIRY || '8h';
    const secret = process.env.AGENT_ACCESS_TOKEN_SECRET || process.env.ADMIN_ACCESS_TOKEN_SECRET || process.env.ACCESS_TOKEN_SECRET;
    
    if (!secret) {
      console.error('No JWT secret configured for agent tokens!');
      return res.status(500).json({
        status: 500,
        message: 'Server configuration error',
        data: null
      });
    }
 
    const finalSupportServiceAgentId = supportServiceAgentId ? supportServiceAgentId.toString() : agent._id.toString();
    const token = jwt.sign(
      {
        id: finalSupportServiceAgentId, // Support-service agent ID (from ticket assignments)
        email: agent.email,
        fullname: agent.fullname || 'Agent',
        role: agent.role || 'agent',
        type: 'agent'
      },
      secret,
      { expiresIn: expireIn }
    );
     
    try {
      if (db) {
        const supportAgentsCollection = db.collection('supportagents');
        await supportAgentsCollection.updateOne(
          { _id: agent._id },
          { $set: { lastActiveAt: new Date() } }
        );
      }
    } catch (updateError) {
      console.error('[AGENT LOGIN] Error updating agent lastActiveAt:', updateError);
      // Continue anyway - not critical
    }

    const options = getAdminAccessTokenCookieOptions(req, process.env.ADMIN_ACCESS_TOKEN_EXPIRY || '8h');

      const responseData = {
        status: 200,
        message: "Agent logged in successfully",
        admin_id: finalSupportServiceAgentId,  
        agent_id: finalSupportServiceAgentId,  
        token,
        type: 'agent',
        agent: {
          id: finalSupportServiceAgentId,  
          email: agent.email,
          fullname: agent.fullname || 'Agent',
          role: agent.role || 'agent',
          status: agent.status || 'offline',
          avatar: agent.avatar || null
        }
      };   
     
      
      return res.cookie('adminAccessToken', token, options).status(200).json(responseData);

  } catch (error) {
    console.error("Admin/Agent Login Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

function generateAdminAccessToken(admin, expireIn) {
  return jwt.sign(
    {
      id: admin._id,
      role: admin.role || 'admin',
      email: admin.email,
      fullname: admin.fullname || '',
      permissions: Array.isArray(admin.permissions) ? admin.permissions : []
    },
    process.env.ADMIN_ACCESS_TOKEN_SECRET,
    { expiresIn: expireIn }
  );
}

const adminForgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ status: 400, message: 'Email is required', data: null });
  }
  if (!isEmailValid(email)) {
    return res.status(400).json({ status: 400, message: 'Invalid email format', data: null });
  }

  const genericSuccess = {
    status: 200,
    message: 'If an admin account exists with this email, you will receive a password reset link shortly.',
    data: null,
  };

  try {
    const normalizedEmail = email.toLowerCase().trim();
    const admin = await AdminUser.findOne({ email: normalizedEmail });

    if (!admin || admin.status === false) {
      return res.status(200).json(genericSuccess);
    }

    if (admin.resetPasswordToken && admin.resetPasswordExpires && admin.resetPasswordExpires > new Date()) {
      return res.status(429).json({
        status: 429,
        message: 'You already have a password reset link. Please check your email or try again after 1 hour.',
        data: null,
      });
    }

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentRequests = (admin.resetPasswordRequestLog || []).filter(
      (entry) => entry.requestedAt && new Date(entry.requestedAt) > twentyFourHoursAgo
    );
    if (recentRequests.length >= 2) {
      return res.status(429).json({
        status: 429,
        message: 'You can only request a password reset 2 times in 24 hours. Please try again later.',
        data: null,
      });
    }

    const token = crypto.randomBytes(32).toString('hex');
    admin.resetPasswordToken = token;
    admin.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
    admin.resetPasswordRequestLog = recentRequests.concat([{ requestedAt: new Date() }]);
    await admin.save({ validateBeforeSave: false });

    const adminBase = process.env.ADMIN_FRONTEND_BASE_URL || (
      process.env.FRONTEND_BASE_URL
        ? `${String(process.env.FRONTEND_BASE_URL).replace(/\/$/, '')}/admin`
        : 'https://esp.documantra.in/admin'
    );
    const resetLink = `${String(adminBase).replace(/\/$/, '')}/reset-password?token=${token}`;

    await sendPasswordResetEmail(admin.email, resetLink, admin.fullname || null);

    return res.status(200).json(genericSuccess);
  } catch (error) {
    console.error('Admin forgot password error:', error);
    return res.status(500).json({
      status: 500,
      message: 'Something went wrong. Please try again later.',
      data: null,
    });
  }
};

const adminResetPassword = async (req, res) => {
  const { token, newPassword } = req.body;
  if (!token) {
    return res.status(400).json({ status: 400, message: 'Reset token is required', data: null });
  }

  const passwordError = getPasswordPolicyError(newPassword);
  if (passwordError) {
    return res.status(400).json({ status: 400, message: passwordError, data: null });
  }

  try {
    const admin = await AdminUser.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!admin) {
      return res.status(400).json({
        status: 400,
        message: 'Invalid or expired reset link. Please request a new one.',
        data: null,
      });
    }

    const reuseError = await getPasswordReuseError(admin, newPassword);
    if (reuseError) {
      return res.status(400).json({ status: 400, message: reuseError, data: null });
    }

    archiveCurrentPassword(admin);
    admin.password = newPassword;
    admin.resetPasswordToken = undefined;
    admin.resetPasswordExpires = undefined;
    admin.passwordChangedAt = new Date();
    await admin.save();

    return res.status(200).json({
      status: 200,
      message: 'Password has been reset successfully. You can now sign in.',
      data: null,
    });
  } catch (error) {
    console.error('Admin reset password error:', error);
    return res.status(500).json({
      status: 500,
      message: 'Something went wrong. Please try again later.',
      data: null,
    });
  }
};

const adminChangePassword = async (req, res) => {
  const adminId = req.user?.data?.id || req.user?.id || req.user?._id;
  const { currentPassword, newPassword } = req.body;

  if (!adminId) {
    return res.status(401).json({ status: 401, message: 'Not authenticated', data: null });
  }
  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      status: 400,
      message: 'Current and new password are required',
      data: null,
    });
  }

  const passwordError = getPasswordPolicyError(newPassword);
  if (passwordError) {
    return res.status(400).json({ status: 400, message: passwordError, data: null });
  }

  try {
    const admin = await AdminUser.findById(adminId);
    if (!admin || admin.status === false) {
      return res.status(401).json({ status: 401, message: 'Not authenticated', data: null });
    }

    const matches = await bcrypt.compare(currentPassword, admin.password);
    if (!matches) {
      return res.status(401).json({ status: 401, message: 'Current password is incorrect', data: null });
    }

    const reuseError = await getPasswordReuseError(admin, newPassword);
    if (reuseError) {
      return res.status(400).json({ status: 400, message: reuseError, data: null });
    }

    archiveCurrentPassword(admin);
    admin.password = newPassword;
    admin.resetPasswordToken = undefined;
    admin.resetPasswordExpires = undefined;
    admin.passwordChangedAt = new Date();
    await admin.save();

    res.clearCookie('adminAccessToken', getAdminAccessTokenCookieOptions(req));

    return res.status(200).json({
      status: 200,
      message: 'Password changed successfully. Please sign in again.',
      data: null,
    });
  } catch (error) {
    console.error('Admin change password error:', error);
    return res.status(500).json({
      status: 500,
      message: 'Something went wrong. Please try again later.',
      data: null,
    });
  }
};

const getAdminMe = async (req, res) => {
  try {
    const principal = req.user || {};
    const id = principal?.id || principal?._id || principal?.data?.id;
    if (!id) {
      return res.status(401).json({ status: 401, message: 'Not authenticated', data: null });
    }

    const principalType = String(principal?.type || principal?.data?.type || '').toLowerCase();
    if (principalType === 'agent') {
      return res.status(200).json({
        status: 200,
        message: 'Agent session active',
        data: {
          type: 'agent',
          id: String(id),
          email: principal.email || '',
          fullname: principal.fullname || 'Agent',
          role: principal.role || 'agent',
        },
      });
    }

    const admin = await AdminUser.findById(id).select('-password -passwordHistory');
    if (!admin || admin.status === false) {
      return res.status(401).json({ status: 401, message: 'Not authenticated', data: null });
    }

    const tokenIssuedAtSec = principal?.iat;
    if (admin.passwordChangedAt && tokenIssuedAtSec) {
      const tokenIssuedAtMs = tokenIssuedAtSec * 1000;
      if (tokenIssuedAtMs < admin.passwordChangedAt.getTime()) {
        return res.status(401).json({
          status: 401,
          message: 'Session invalidated due to password change',
          data: null,
        });
      }
    }

    return res.status(200).json({
      status: 200,
      message: 'Admin session active',
      data: {
        type: 'admin',
        id: String(admin._id),
        email: admin.email,
        fullname: admin.fullname || '',
        role: admin.role || 'admin',
        permissions: Array.isArray(admin.permissions) ? admin.permissions : [],
      },
    });
  } catch (error) {
    console.error('getAdminMe error:', error);
    return res.status(500).json({ status: 500, message: 'Server error', data: null });
  }
};

/** Called by auth-lib from other microservices to reject stale admin JWTs after password change. */
const validateAdminSessionEndpoint = async (req, res) => {
  const token = extractAccessToken(req, 'admin');
  if (!token) {
    return res.status(401).json({ valid: false, message: 'Missing token' });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.ADMIN_ACCESS_TOKEN_SECRET);
  } catch (err) {
    return res.status(401).json({ valid: false, message: 'Invalid token' });
  }

  const adminId = decoded?.id || decoded?.data?.id;
  if (!adminId) {
    return res.status(200).json({ valid: true });
  }

  try {
    const admin = await AdminUser.findById(adminId).select('status passwordChangedAt');
    if (!admin || admin.status === false) {
      return res.status(401).json({ valid: false, message: 'Admin suspended or not found' });
    }

    if (admin.passwordChangedAt && decoded?.iat) {
      const tokenIssuedAtMs = decoded.iat * 1000;
      if (tokenIssuedAtMs < admin.passwordChangedAt.getTime()) {
        return res.status(401).json({
          valid: false,
          message: 'Session invalidated due to password change',
        });
      }
    }

    return res.status(200).json({ valid: true });
  } catch (error) {
    return res.status(500).json({ valid: false, message: 'Server error' });
  }
};

const adminLogout = async (req, res) => {
  try {
    res.clearCookie('adminAccessToken', { ...getAdminAccessTokenCookieOptions(req), maxAge: 0 });
    return res.status(200).json({ status: 200, message: 'Logged out successfully', data: null });
  } catch (error) {
    console.error('adminLogout error:', error);
    res.clearCookie('adminAccessToken', { ...getAdminAccessTokenCookieOptions(req), maxAge: 0 });
    return res.status(200).json({ status: 200, message: 'Logged out successfully', data: null });
  }
};

/** Short-lived token for WebSocket handshakes — read from httpOnly cookie, never store in localStorage. */
const getAdminSocketToken = async (req, res) => {
  const token = extractAccessToken(req, 'admin');
  if (!token) {
    return res.status(401).json({ status: 401, message: 'Not authenticated', data: null });
  }
  return res.status(200).json({
    status: 200,
    message: 'Socket token issued',
    data: { token },
  });
};

module.exports = { adminLogin, adminForgotPassword, adminResetPassword, adminChangePassword, getAdminMe, adminLogout, getAdminSocketToken, validateAdminSessionEndpoint };
