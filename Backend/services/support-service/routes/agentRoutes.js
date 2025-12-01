const express = require('express');
const router = express.Router();
const agentController = require('../controllers/agentController');
const ticketController = require('../controllers/ticketController');
const messageController = require('../controllers/messageController');
const { verifyAgentAuth } = require('../middleware/auth');
const { messageLimiter, apiLimiter, authLimiter } = require('../middleware/rateLimiter');
const { sanitizeInput, sanitizeBody } = require('../middleware/sanitize');
const { upload } = require('../utils/fileUpload');

// Authentication routes (no auth required)
router.post('/auth/login', authLimiter, agentController.login);

// Apply sanitization and auth to all other routes
router.use(sanitizeInput);
router.use(sanitizeBody);
router.use(verifyAgentAuth);

// Agent profile routes
router.get('/profile', apiLimiter, agentController.getProfile);
router.put('/profile', apiLimiter, agentController.updateProfile);
router.put('/status', apiLimiter, agentController.updateStatus);

// Dashboard
router.get('/dashboard', apiLimiter, agentController.getDashboard);

// Ticket routes
router.get('/tickets', apiLimiter, ticketController.getAssignedTickets);
router.get('/tickets/:ticketId', apiLimiter, ticketController.getTicket);
router.post('/tickets/:ticketId/close', apiLimiter, ticketController.agentCloseTicket);
router.post('/tickets/:ticketId/transfer', apiLimiter, ticketController.transferTicket);

// Message routes
router.get('/tickets/:ticketId/messages', apiLimiter, messageController.getMessages);
router.post('/tickets/:ticketId/upload', apiLimiter, upload.single('file'), messageController.uploadFile);

module.exports = router;

