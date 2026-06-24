const multer = require('multer');
const path = require('path');
const fs = require('fs');
const {
  UPLOAD_PRESETS,
  sanitizeUploadFilename,
  createMulterFileFilter,
  getMulterLimits,
  validateUploadedFile,
} = require('@draftnsign/validators');

const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const ticketId = req.body.ticketId || 'general';
    const ticketDir = path.join(uploadsDir, ticketId);

    if (!fs.existsSync(ticketDir)) {
      fs.mkdirSync(ticketDir, { recursive: true });
    }

    cb(null, ticketDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const safeName = sanitizeUploadFilename(file.originalname);
    const ext = path.extname(safeName);
    const name = path.basename(safeName, ext);
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: getMulterLimits(UPLOAD_PRESETS.SUPPORT_ATTACHMENTS),
  fileFilter: createMulterFileFilter(UPLOAD_PRESETS.SUPPORT_ATTACHMENTS),
});

const validateFile = (file) => {
  const result = validateUploadedFile(file, UPLOAD_PRESETS.SUPPORT_ATTACHMENTS);
  return result.valid
    ? { valid: true }
    : { valid: false, error: result.message };
};

module.exports = {
  upload,
  validateFile,
  uploadsDir
};
