// routes/anchorRoutes.js
const express = require('express');
const router = express.Router();
const { verifyAnchorController } = require('../controllers/anchorController');

// GET verify anchor for a signature id
router.get('/signature/verify/:id', verifyAnchorController);

module.exports = router;
