const express = require('express');
const { Upload, insertRecipient,updateEnvelope,saveSignatureFields } = require('../controllers/eSignController');
const { envelopesData,envelopesDetail, getEnvelopeStats,envelopExists,sendEnvelope,addSignature } = require('../controllers/mainController');
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

router.get('/health', (_, res) => res.send('E-Sign Private Service is running...'));
router.post('/upload', upload.array('files'), Upload);
router.post('/add-recipients',insertRecipient);
router.post('/save-signature-fields', saveSignatureFields);
router.post('/update-envelope', updateEnvelope);
router.post('/add-signature', addSignature);
router.get('/get-envelopes', envelopesData);
router.get('/envelope/:id', envelopesDetail);
router.get('/envelope-exist/:id', envelopExists);
router.get('/analytics/envelope-stats', getEnvelopeStats);
router.post('/send-envelope/:envelopeId',sendEnvelope);

module.exports = router;
