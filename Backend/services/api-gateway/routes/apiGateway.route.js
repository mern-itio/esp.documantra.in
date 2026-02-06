const express = require('express');
const { getNotifications } = require('../controllers/mainController');
const router = express.Router();
router.get('/status', (_, res) => res.send('Api Gateway Service is running and changing'));
router.get('/get-notifications', getNotifications);
module.exports = router;
