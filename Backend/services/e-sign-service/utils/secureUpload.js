const multer = require('multer');
const path = require('path');
const {
  UPLOAD_PRESETS,
  sanitizeUploadFilename,
  createMulterFileFilter,
  getMulterLimits,
} = require('@draftnsign/validators');

const uploadsDir = path.join(__dirname, '..', 'uploads');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${sanitizeUploadFilename(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  fileFilter: createMulterFileFilter(UPLOAD_PRESETS.ESIGN_DOCUMENTS),
  limits: getMulterLimits(UPLOAD_PRESETS.ESIGN_DOCUMENTS),
});

const pdfUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: createMulterFileFilter(UPLOAD_PRESETS.PDF_ONLY),
  limits: getMulterLimits(UPLOAD_PRESETS.PDF_ONLY),
});

module.exports = {
  upload,
  pdfUpload,
  uploadsDir,
};
