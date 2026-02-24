const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User  = require('../models/User');
const { isEmailValid } = require('@draftnsign/validators');
const { sendPasswordResetEmail } = require('../utils/email');
// const { verifyJWT } = require('@draftnsign/auth-lib');
const bcrypt = require('bcrypt');
const axios = require('axios');
// Login Controller
const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email) return res.status(400).json({ message: 'Email required' });
  if (!password) return res.status(400).json({ message: 'Password required' });
  if (!isEmailValid(email)) {
    return res.status(400).json({ message: 'Invalid email format' });
  }

  let user = await User.findOne({ email });
  if (!user) {
    return res.status(401).json({
      status: 401,
      message: "User is not exists with Us! Please check your Email Id",
      data: null
    });
  }

  if (user?.status === false) {
    return res.status(401).json({
      status: 401,
      message: "Your Account has been suspended, please contact the Admin",
      data: null
    });
  }

  const isPasswdCorrect = await bcrypt.compare(password, user.password);
  if (!isPasswdCorrect) {
    return res.status(401).json({
      status: 401,
      message: "Invalid Credentials!!!",
      data: null
    });
  }

  // If first login, set isFirstLogin to false after login
  let isFirstLogin = user.isFirstLogin;
  if (user.isFirstLogin) {
    user.isFirstLogin = false;
    await user.save();
  }

  const expireIn = process.env.ACCESS_TOKEN_EXPIRY || '12h';
  const generateToken = await generateAccessTokenUser(user, expireIn);
  const options = {
    httpOnly: true,
    expiresIn: expireIn
  };

  return res.cookie('accessToken', generateToken, options).status(200).json({
    status: 201,
    message: "User is logged in successfully",
    user_id: user._id,
    token: generateToken,
    type: 'user',
    phone: user.phone,
    plan: user.plan || 'free',
    isFirstLogin: isFirstLogin
  });
};

// Register Controller
const register = async (req, res) => {
  const { fullname, email, phone, password, company, address } = req.body;

  if (!fullname || !email || !phone || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  if (!isEmailValid(email)) {
    return res.status(400).json({ message: 'Invalid email format' });
  }

  try {
    // Default plan is free on first registration
    const user = await User.create({ fullname, email, phone, password, company, address, plan: 'free' });
      await axios.post(`${process.env.ESING_SERVICE_URL}/api/e-sign/public/link-user-recipient`, {
        email: email,
        userId: user._id
      });
    res.status(201).json({ message: 'User registered successfully', user });
  } catch (error) {
    if (error.code === 11000) {
      console.error('Email or phone already exists');
      return res.status(400).json({ message: 'Email or phone already exists' });
    }
    console.error('Server error', error);
    return res.status(500).json({ message: 'Server error', error });
  }
};

// Access Token Generator
async function generateAccessTokenUser(user, expireIn) {
  const dataSend = {
    id: user._id,
    email: user.email,
    fullname: user.fullname,
    phone: user.phone,
    company: user.company,
    address: user.address,
    type: 'user'
  };

  try {
    return jwt.sign(
      {
        expiresIn: expireIn,
        exp: Math.floor(Date.now() / 1000) + 43200,
        data: dataSend
      },
      process.env.ACCESS_TOKEN_SECRET
    );
  } catch (error) {
    console.log("Error while generating Access Token", error);
  }
};

// Get current user details
const getMe = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    if (!userId) {
      return res.status(401).json({
        status: 401,
        message: "User not authenticated",
        data: null
      });
    }

    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({
        status: 404,
        message: "User not found",
        data: null
      });
    }

    return res.status(200).json({
      status: 200,
      message: "User details retrieved successfully",
      data: {
        id: user._id,
        email: user.email,
        fullname: user.fullname,
        phone: user.phone,
        company: user.company,
        address: user.address,
        plan: user.plan || 'free',
        status: user.status,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    return res.status(500).json({
      status: 500,
      message: "Internal server error",
      data: null
    });
  }
};
// Switch account (user <-> organization)
const switchAccount = async (req, res) => {
  try {
    const requestingUser = req.user;
    if (!requestingUser) {
      return res.status(401).json({ status: 401, message: 'Not authenticated' });
    }
    const organizationId = req?.query?.orgId || null;
    const accountType = req?.params?.accType;
    if (!accountType || (accountType !== 'user' && accountType !== 'organization')) {
      return res.status(400).json({ status: 400, message: 'Invalid account type' });
    }
    // If switching to organization, organizationId must be present
    if (!organizationId && accountType === 'organization') {
      return res.status(400).json({ status: 400, message: 'organizationId required for organization account' });
    }
    if (accountType === 'user') {
      return res.status(200).json({ status: 200, message: 'Switched to user account successfully',accountType: 'user' });
    }
    if (accountType === 'organization' && organizationId) {
      //post request to organization service with userid in body and token in header
      const orgResp = await axios.get(`${process.env.ORGANIZATION_SERVICE_URL}/api/organization/details-and-permission/${organizationId}`,{
        headers: {
          Authorization: req.headers.authorization  
        }
      });
      console.log("Organization Service Response: ",orgResp.data);
      const organization = orgResp.data.organization;

      if (!organization) {
        return res.status(404).json({ status: 404, message: 'Organization not found' });
      }
      return res.status(200).json({ status: 200, message: 'Switched to organization account successfully', accountType: 'organization', organizationId: organizationId, organization: organization });
    }
  } catch (error) {
    return res.status(500).json({ status: 500, message: 'Internal server error' });
  }
   
};
const getUsersList = async (req, res) => {
  try {
    const users = await User.aggregate([
      {
        $project: {
          _id: 1,
          name: "$fullname",
          email: 1
        }
      }
    ]);
    return res.status(200).json({
      status: 200,
      message: "Users list retrieved successfully",
      data: users
    });
  } catch (error) {
    return res.status(500).json({
      status: 500,
      message: "Internal server error",
      data: null
    });
  }
};
// Forgot password: generate token and save; optionally send email later
const forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required' });
  if (!isEmailValid(email)) return res.status(400).json({ message: 'Invalid email format' });

  try {
    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      return res.status(404).json({
        status: 404,
        message: 'We don\'t find any account with this email address. Please check the email or sign up for a new account.',
      });
    }

    // Already have an active reset link (within 1 hour)
    if (user.resetPasswordToken && user.resetPasswordExpires && user.resetPasswordExpires > new Date()) {
      return res.status(429).json({
        status: 429,
        message: 'You already have a password reset link. Please check your email and use that link to reset your password. You can request a new link only after 1 hour.',
      });
    }

    // Max 2 reset requests per 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentRequests = (user.resetPasswordRequestLog || []).filter(
      (entry) => entry.requestedAt && new Date(entry.requestedAt) > twentyFourHoursAgo
    );
    if (recentRequests.length >= 2) {
      return res.status(429).json({
        status: 429,
        message: 'You can only request a password reset 2 times in 24 hours. Please try again later.',
      });
    }

    const token = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = token;
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    const prunedLog = recentRequests.concat([{ requestedAt: new Date() }]);
    user.resetPasswordRequestLog = prunedLog;
    await user.save({ validateBeforeSave: false });

    const frontendBase = process.env.FRONTEND_BASE_URL || process.env.BASE_URL || 'http://165.22.215.73:8081/';
    const resetLink = `${frontendBase.replace(/\/$/, '')}/reset-password?token=${token}`;

    await sendPasswordResetEmail(user.email, resetLink, user.fullname || null);

    return res.status(200).json({
      status: 200,
      message: 'If an account exists with this email, you will receive a password reset link shortly.',
    });
  } catch (err) {
    console.error('Forgot password error:', err);
    return res.status(500).json({ message: 'Something went wrong. Please try again later.' });
  }
};

// Reset password: verify token and set new password
const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;
  if (!token) return res.status(400).json({ message: 'Reset token is required' });
  if (!newPassword || newPassword.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });

  try {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() },
    });
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset link. Please request a new one.' });
    }

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return res.status(200).json({
      status: 200,
      message: 'Password has been reset successfully. You can now sign in.',
    });
  } catch (err) {
    console.error('Reset password error:', err);
    return res.status(500).json({ message: 'Something went wrong. Please try again later.' });
  }
};

// Export functions
module.exports = {
  login,
  register,
  getMe,
  switchAccount,
  getUsersList,
  forgotPassword,
  resetPassword,
};
