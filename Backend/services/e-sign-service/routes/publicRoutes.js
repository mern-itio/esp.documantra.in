const express = require('express');
const multer = require('multer');
const path = require('path');
// Configure multer storage (files go to /uploads folder)
const { envelopesDetail,getSignatureFields,addSignature } = require('../controllers/mainController');
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

router.get('/health', (_, res) => res.send('E-Sign Public Service is running...'));
router.get('/envelope/:id', envelopesDetail);
router.get('/document/signature-fields/:id', getSignatureFields);
router.post('/add-signature', addSignature);


module.exports = router;
