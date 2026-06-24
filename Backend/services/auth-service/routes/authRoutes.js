const express = require('express');
const rateLimit = require('express-rate-limit');
const { login, googleLogin, verifyTwoFaLogin, getTwoFaRecoveryQuestions, verifyTwoFaRecoverySingleAnswer, verifyTwoFaRecoveryAnswers, verifyTwoFaRecoveryOtp, sendRecoveryEmailOtp, verifyRecoveryEmailOtp, getTwoFaSettings, updateTwoFaSettings, setupAuthenticatorTwoFa, verifyAuthenticatorTwoFaSetup, regenerateAuthenticatorBackupCodes, register, sendSignupEmailOtp, verifySignupEmailOtp, sendSignupPhoneOtp, verifySignupPhoneOtp, getMe, switchAccount, getUsersList, forgotPassword, resetPassword, changePassword, updateProfile, sendProfileEmailOtp, verifyProfileEmailOtp, sendProfilePhoneOtp, verifyProfilePhoneOtp, getSessions, revokeSession, verifyActiveSession, validateSessionEndpoint } = require('../controllers/authController');
const { getMyReferral, listRewards, onFirstDocumentSentInternal } = require('../controllers/referralController');
const {adminLogin, adminForgotPassword, adminResetPassword} = require('../controllers/adminAuthController');
const { userDetails,findUserByEmail,insertNotifications,getNotifications,markNotificationReadById,markAllNotificationAsRead } = require('../controllers/mainController');
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

const resetPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { status: 429, message: 'Too many password reset attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.get('/status', (_, res) => res.send('Auth Service is running and changing'));
router.post('/login', loginLimiter, login);
router.post('/google-login', loginLimiter, googleLogin);
router.post('/2fa/verify-login', loginLimiter, verifyTwoFaLogin);
router.post('/2fa/recovery/questions', loginLimiter, getTwoFaRecoveryQuestions);
router.post('/2fa/recovery/verify-answer', loginLimiter, verifyTwoFaRecoverySingleAnswer);
router.post('/2fa/recovery/verify-answers', loginLimiter, verifyTwoFaRecoveryAnswers);
router.post('/2fa/recovery/verify-otp', loginLimiter, verifyTwoFaRecoveryOtp);
router.post('/admin/login', loginLimiter, adminLogin);
router.post('/admin-forgot-password', otpLimiter, adminForgotPassword);
router.post('/admin-reset-password', resetPasswordLimiter, adminResetPassword);
router.post('/register', otpLimiter, register);
router.post('/signup/send-email-otp', otpLimiter, sendSignupEmailOtp);
router.post('/signup/verify-email-otp', verifySignupEmailOtp);
router.post('/signup/send-phone-otp', otpLimiter, sendSignupPhoneOtp);
router.post('/signup/verify-phone-otp', verifySignupPhoneOtp);
router.post('/forgot-password', otpLimiter, forgotPassword);
router.post('/reset-password', resetPasswordLimiter, resetPassword);
router.post('/change-password', verifyJWT(), verifyActiveSession, changePassword);
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
router.post('/api/auth/2fa/recovery-email/send-otp', verifyJWT(), verifyActiveSession, otpLimiter, sendRecoveryEmailOtp);
router.post('/api/auth/2fa/recovery-email/verify-otp', verifyJWT(), verifyActiveSession, verifyRecoveryEmailOtp);
router.get('/api/auth/2fa/authenticator/setup', verifyJWT(), verifyActiveSession, setupAuthenticatorTwoFa);
router.post('/api/auth/2fa/authenticator/verify-setup', verifyJWT(), verifyActiveSession, verifyAuthenticatorTwoFaSetup);
router.post('/api/auth/2fa/authenticator/regenerate-backup-codes', verifyJWT(), verifyActiveSession, regenerateAuthenticatorBackupCodes);
router.get('/api/auth/switch-account/:accType', verifyJWT(), switchAccount);
router.get('/api/users-list', verifyJWT(), getUsersList);
router.post('/api/notifications/create', verifyJWT(),insertNotifications);
router.post('/api/notifications/:id/read', verifyJWT(),markNotificationReadById);
router.post('/api/notifications/mark-all-read', verifyJWT(),markAllNotificationAsRead);

router.get('/api/user/notifications', verifyJWT(), getNotifications);
router.get('/api/referrals/me', verifyJWT(), verifyActiveSession, getMyReferral);
router.get('/api/rewards', verifyJWT(), verifyActiveSession, listRewards);
router.post('/api/internal/referrals/first-document-sent', onFirstDocumentSentInternal);
module.exports = router;
