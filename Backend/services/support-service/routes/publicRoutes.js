const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');
const { apiLimiter } = require('../middleware/rateLimiter');
const { sanitizeInput, sanitizeBody } = require('../middleware/sanitize');

router.use(sanitizeInput);
router.use(sanitizeBody);

// Public help/support form submission
router.post('/tickets', apiLimiter, ticketController.createPublicTicket);
router.post('/queries', apiLimiter, ticketController.createPublicQuery);

module.exports = router;
