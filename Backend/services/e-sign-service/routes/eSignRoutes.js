const express = require('express');
const { Upload, insertRecipient,updateEnvelope } = require('../controllers/eSignController');
const multer = require('multer');
const path = require('path');
// Configure multer storage (files go to /uploads folder)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads')); // one level up from /routes
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

const router = express.Router();

router.get('/status', (_, res) => res.send('Auth Service is running and changing'));
router.post('/upload', upload.array('files'), Upload);
router.post('/add-recipients',insertRecipient);
router.post('/update-envelope', updateEnvelope);

module.exports = router;
