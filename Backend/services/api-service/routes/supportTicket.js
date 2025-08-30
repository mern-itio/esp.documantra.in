const express = require('express');
const router = express.Router();
const { createSupportTicket, getAllSupportTickets } = require('../controllers/supportTicket');

router.post('/create', createSupportTicket);
// Get all support tickets
router.get('/all', getAllSupportTickets);

module.exports = router;
