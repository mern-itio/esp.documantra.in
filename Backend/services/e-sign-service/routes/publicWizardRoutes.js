const express = require('express');
const multer = require('multer');
const path = require('path');
const {
  publicWizardUpload,
  publicWizardAddRecipients,
} = require('../controllers/publicFlowController');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  },
});

const upload = multer({ storage });
const router = express.Router();

router.get('/health', (_, res) =>
  res.json({ status: 'ok', message: 'Public wizard routes active' })
);
router.post('/upload', upload.array('files'), publicWizardUpload);
router.post('/add-recipients', publicWizardAddRecipients);

module.exports = router;
