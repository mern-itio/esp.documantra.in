// src/webhooks/diditWebhook.js
const express = require('express');
const router = express.Router();

const identityModal = require('../models/identityModal');

router.get('/', (req, res) => {
  console.log("🔥 WEBHOOK HIT");
  res.sendStatus(200);
});

module.exports = router;