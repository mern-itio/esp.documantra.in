const multer = require('multer');
const path = require('path');
const fs = require('fs');
const {
  UPLOAD_PRESETS,
  sanitizeUploadFilename,
  createMulterFileFilter,
  getMulterLimits,
} = require('@draftnsign/validators');

const uploadsDir = path.join(__dirname, '../uploads/organization-docs');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${sanitizeUploadFilename(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  fileFilter: createMulterFileFilter(UPLOAD_PRESETS.ORGANIZATION_DOCS),
  limits: getMulterLimits(UPLOAD_PRESETS.ORGANIZATION_DOCS),
});

module.exports = upload;
