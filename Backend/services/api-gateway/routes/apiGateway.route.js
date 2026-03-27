const express = require('express');
const { getNotifications,markReadById,markReadAll } = require('../controllers/mainController');
const router = express.Router();
router.get('/status', (_, res) => res.send('Api Gateway Service is running and changing'));
router.get('/get-notifications', getNotifications);
router.post('/mark-read/:id',markReadById);
router.post('/mark-read',markReadAll);

module.exports = router;
