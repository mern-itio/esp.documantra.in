const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const messageController = require('../controllers/messageController');
const { verifyAdminAuth } = require('../middleware/auth');
const { adminLimiter } = require('../middleware/rateLimiter');
const { sanitizeInput, sanitizeBody } = require('../middleware/sanitize');

// Apply sanitization and auth to all routes
router.use(sanitizeInput);
router.use(sanitizeBody);
router.use(verifyAdminAuth);

// Agent management
router.get('/agents', adminLimiter, adminController.getAllAgents);
router.post('/agents', adminLimiter, adminController.createAgent);
router.put('/agents/:agentId', adminLimiter, adminController.updateAgent);
router.delete('/agents/:agentId', adminLimiter, adminController.deleteAgent);

// Ticket management
router.get('/tickets', adminLimiter, adminController.getAllTickets);
router.post('/tickets/:ticketId/reassign', adminLimiter, adminController.reassignTicket);
router.post('/tickets/:ticketId/close', adminLimiter, adminController.closeTicket);
router.get('/tickets/:ticketId/messages', adminLimiter, messageController.getMessages);

// Analytics
router.get('/analytics', adminLimiter, adminController.getAnalytics);

module.exports = router;

