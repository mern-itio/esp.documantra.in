const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');
const messageController = require('../controllers/messageController');
const { verifyCustomerAuth } = require('../middleware/auth');
const { messageLimiter, apiLimiter } = require('../middleware/rateLimiter');
const { sanitizeInput, sanitizeBody } = require('../middleware/sanitize');
const { upload } = require('../utils/fileUpload');

// Apply sanitization and rate limiting to all routes
router.use(sanitizeInput);
router.use(sanitizeBody);
router.use(verifyCustomerAuth);

// Ticket routes
router.post('/tickets', apiLimiter, ticketController.createTicket);
router.get('/tickets', apiLimiter, ticketController.getCustomerTickets);
router.get('/tickets/:ticketId', apiLimiter, ticketController.getTicket);
router.post('/tickets/:ticketId/close', apiLimiter, ticketController.closeTicket);
router.post('/tickets/:ticketId/rating', apiLimiter, ticketController.submitRating);

// Message routes
router.get('/tickets/:ticketId/messages', apiLimiter, messageController.getMessages);
router.post('/tickets/:ticketId/upload', apiLimiter, upload.single('file'), messageController.uploadFile);

module.exports = router;

