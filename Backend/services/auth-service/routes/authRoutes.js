const express = require('express');
const rateLimit = require('express-rate-limit');
const { login, googleLogin, verifyTwoFaLogin, getTwoFaSettings, updateTwoFaSettings, register, sendSignupEmailOtp, verifySignupEmailOtp, sendSignupPhoneOtp, verifySignupPhoneOtp, getMe, switchAccount, getUsersList, forgotPassword, resetPassword, updateProfile, sendProfileEmailOtp, verifyProfileEmailOtp, sendProfilePhoneOtp, verifyProfilePhoneOtp, getSessions, revokeSession, verifyActiveSession, validateSessionEndpoint } = require('../controllers/authController');
const {adminLogin} = require('../controllers/adminAuthController');
const { userDetails,findUserByEmail,insertNotifications,getNotifications } = require('../controllers/mainController');
const verifyJWT  = require('@draftnsign/auth-lib');
const router = express.Router();

// Rate limiters
const loginLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 3, // limit each IP to 3 login requests per windowMs
  message: { status: 429, message: 'Too many login attempts from this IP, please try again after a minute' },
  standardHeaders: true,
  legacyHeaders: false,
});

const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 3, // limit each IP to 3 OTP requests per windowMs
  message: { status: 429, message: 'Too many OTP requests from this IP, please try again after 10 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.get('/status', (_, res) => res.send('Auth Service is running and changing'));
router.post('/login', loginLimiter, login);
router.post('/google-login', loginLimiter, googleLogin);
router.post('/2fa/verify-login', loginLimiter, verifyTwoFaLogin);
router.post('/admin/login', loginLimiter, adminLogin);
router.post('/register', otpLimiter, register);
router.post('/signup/send-email-otp', otpLimiter, sendSignupEmailOtp);
router.post('/signup/verify-email-otp', verifySignupEmailOtp);
router.post('/signup/send-phone-otp', otpLimiter, sendSignupPhoneOtp);
router.post('/signup/verify-phone-otp', verifySignupPhoneOtp);
router.post('/forgot-password', otpLimiter, forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/api/user-details/:id', userDetails);
router.get('/api/find-user/:email', findUserByEmail);
router.get('/api/auth/me', verifyJWT(), verifyActiveSession, getMe);
router.put('/api/auth/profile', verifyJWT(), verifyActiveSession, updateProfile);
router.post('/api/auth/profile/email/send-otp', verifyJWT(), verifyActiveSession, otpLimiter, sendProfileEmailOtp);
router.post('/api/auth/profile/email/verify-otp', verifyJWT(), verifyActiveSession, verifyProfileEmailOtp);
router.post('/api/auth/profile/phone/send-otp', verifyJWT(), verifyActiveSession, otpLimiter, sendProfilePhoneOtp);
router.post('/api/auth/profile/phone/verify-otp', verifyJWT(), verifyActiveSession, verifyProfilePhoneOtp);
router.get('/api/auth/sessions', verifyJWT(), verifyActiveSession, getSessions);
router.post('/api/auth/sessions/revoke', verifyJWT(), verifyActiveSession, revokeSession);
router.get('/api/auth/validate-session', validateSessionEndpoint);
router.get('/api/auth/2fa', verifyJWT(), getTwoFaSettings);
router.post('/api/auth/2fa', verifyJWT(), updateTwoFaSettings);
router.get('/api/auth/switch-account/:accType', verifyJWT(), switchAccount);
router.get('/api/users-list', verifyJWT(), getUsersList);
router.post('/api/notifications/create', verifyJWT(),insertNotifications);
router.get('/api/user/notifications', verifyJWT(), getNotifications);
module.exports = router;
