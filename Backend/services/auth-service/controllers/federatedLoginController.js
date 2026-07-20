const User = require('../models/User');
const axios = require('axios');
const { attachReferralOnSignup } = require('./referralController');
const { getAccessTokenCookieOptions } = require('../utils/cookieOptions');
const { shouldRequireTwoFaSetup } = require('../utils/twoFaPolicy');
const {
  verifyGoogleIdToken,
  exchangeGoogleCode,
  verifyFacebookAccessToken,
  exchangeFacebookCode,
  exchangeLinkedInCode,
  exchangeTwitterCode,
} = require('../utils/federatedOAuthService');

async function linkEsignRecipient(user) {
  try {
    await axios.post(
      `${process.env.ESING_SERVICE_URL}/api/e-sign/public/link-user-recipient`,
      { email: user.email, userId: user._id },
      { timeout: 5000 }
    );
  } catch (linkErr) {
    console.warn('E-sign link-user-recipient failed:', linkErr?.message);
  }
}

async function findOrCreateOAuthUser({
  email,
  name,
  providerId,
  providerField,
  emailFromProvider = true,
}) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (!normalizedEmail) {
    const err = new Error('Email is required from identity provider');
    err.status = 400;
    throw err;
  }

  let user = await User.findOne({ email: normalizedEmail });
  if (!user && providerField) {
    user = await User.findOne({ [providerField]: providerId });
  }

  if (!user) {
    user = await User.create({
      fullname: name || 'OAuth User',
      email: normalizedEmail,
      [providerField]: providerId,
      emailVerified: emailFromProvider,
      phoneVerified: false,
      plan: 'free',
      isFirstLogin: true,
    });
    await linkEsignRecipient(user);
    return { user, isNew: true };
  }

  if (providerField && !user[providerField]) {
    user[providerField] = providerId;
    if (emailFromProvider) user.emailVerified = true;
    await user.save({ validateBeforeSave: false });
  }

  if (user.status === false) {
    const err = new Error('Your Account has been suspended, please contact the Admin');
    err.status = 401;
    throw err;
  }

  return { user, isNew: false };
}

async function issueOAuthLoginResponse(req, res, user, providerLabel) {
  let isFirstLogin = user.isFirstLogin;
  if (user.isFirstLogin) {
    user.isFirstLogin = false;
    await user.save({ validateBeforeSave: false });
  }

  const { generateAccessTokenUser, respondTwoFaSetupRequired } = require('./authController');

  if (shouldRequireTwoFaSetup(user)) {
    return respondTwoFaSetupRequired(req, res, user);
  }

  const expireIn = process.env.ACCESS_TOKEN_EXPIRY || '8h';
  const currentSessionId = req.user?.data?.sessionId || req.user?.sessionId;
  const generateToken = await generateAccessTokenUser(user, expireIn, req, currentSessionId);

  return res
    .cookie('accessToken', generateToken, getAccessTokenCookieOptions(req, expireIn))
    .status(200)
    .json({
      status: 200,
      message: `User is logged in successfully with ${providerLabel}`,
      user_id: user._id,
      email: user.email,
      fullname: user.fullname,
      token: generateToken,
      type: 'user',
      phone: user.phone || '',
      plan: user.plan || 'free',
      isFirstLogin,
    });
}

async function handleOAuthLogin(req, res, identity, providerLabel, referral) {
  const { ref, referrerUserId } = referral || {};
  const { user, isNew } = await findOrCreateOAuthUser(identity);
  if (isNew) {
    try {
      await attachReferralOnSignup(user._id, ref || referrerUserId);
    } catch (refErr) {
      console.warn('Referral attach failed:', refErr?.message);
    }
  }
  return issueOAuthLoginResponse(req, res, user, providerLabel);
}

async function googleLoginFederated(req, res) {
  const { token, code, redirectUri, ref, referrerUserId } = req.body || {};
  try {
    let identity;
    if (code && redirectUri) {
      identity = await exchangeGoogleCode(code, redirectUri);
    } else if (token) {
      identity = await verifyGoogleIdToken(token);
    } else {
      return res.status(400).json({ message: 'Google token or authorization code required' });
    }
    return await handleOAuthLogin(req, res, identity, 'Google', { ref, referrerUserId });
  } catch (error) {
    console.error('Google login error:', error);
    if (!res.headersSent) {
      return res.status(error.status || 500).json({
        message: error.message || 'Google login failed',
      });
    }
  }
}

async function facebookLoginFederated(req, res) {
  const { accessToken, code, redirectUri, ref, referrerUserId } = req.body || {};
  try {
    let identity;
    if (code && redirectUri) {
      identity = await exchangeFacebookCode(code, redirectUri);
    } else if (accessToken) {
      identity = await verifyFacebookAccessToken(accessToken);
    } else {
      return res.status(400).json({ message: 'Facebook access token or authorization code required' });
    }
    return await handleOAuthLogin(req, res, identity, 'Facebook', { ref, referrerUserId });
  } catch (error) {
    console.error('Facebook login error:', error);
    if (!res.headersSent) {
      return res.status(error.status || 500).json({
        message: error.message || 'Facebook login failed',
      });
    }
  }
}

async function linkedinLoginFederated(req, res) {
  const { code, redirectUri, ref, referrerUserId } = req.body || {};
  if (!code || !redirectUri) {
    return res.status(400).json({ message: 'LinkedIn authorization code and redirect URI required' });
  }
  try {
    const identity = await exchangeLinkedInCode(code, redirectUri);
    return await handleOAuthLogin(req, res, identity, 'LinkedIn', { ref, referrerUserId });
  } catch (error) {
    console.error('LinkedIn login error:', error);
    if (!res.headersSent) {
      return res.status(error.status || 500).json({
        message: error.message || 'LinkedIn login failed',
      });
    }
  }
}

async function twitterLoginFederated(req, res) {
  const { code, redirectUri, codeVerifier, ref, referrerUserId } = req.body || {};
  if (!code || !redirectUri) {
    return res.status(400).json({ message: 'X authorization code and redirect URI required' });
  }
  try {
    const identity = await exchangeTwitterCode(code, redirectUri, codeVerifier);
    return await handleOAuthLogin(req, res, identity, 'X', { ref, referrerUserId });
  } catch (error) {
    console.error('X login error:', error);
    if (!res.headersSent) {
      return res.status(error.status || 500).json({
        message: error.message || 'X login failed',
      });
    }
  }
}

module.exports = {
  googleLoginFederated,
  facebookLoginFederated,
  linkedinLoginFederated,
  twitterLoginFederated,
};
