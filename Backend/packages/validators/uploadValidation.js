const path = require('path');

const BLOCKED_EXTENSIONS = new Set([
  '.exe', '.bat', '.cmd', '.com', '.scr', '.pif', '.vbs', '.vbe', '.js', '.jse',
  '.ws', '.wsf', '.wsh', '.ps1', '.psm1', '.msi', '.msp', '.dll', '.jar',
  '.php', '.phtml', '.asp', '.aspx', '.jsp', '.sh', '.bash', '.zsh', '.cgi',
  '.htaccess', '.html', '.htm',
]);

const UPLOAD_PRESETS = {
  ESIGN_DOCUMENTS: {
    allowedMimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'application/rtf',
      'text/rtf',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/bmp',
      'image/tiff',
      'image/webp',
    ],
    allowedExtensions: ['pdf', 'doc', 'docx', 'txt', 'rtf', 'png', 'jpg', 'jpeg', 'gif', 'bmp', 'tiff', 'webp'],
    maxFileSize: 100 * 1024 * 1024,
    maxFiles: 10,
  },
  PDF_ONLY: {
    allowedMimeTypes: ['application/pdf'],
    allowedExtensions: ['pdf'],
    maxFileSize: 100 * 1024 * 1024,
    maxFiles: 1,
  },
  ORGANIZATION_DOCS: {
    allowedMimeTypes: [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
    allowedExtensions: ['pdf', 'png', 'jpg', 'jpeg', 'webp', 'doc', 'docx'],
    maxFileSize: 10 * 1024 * 1024,
    maxFiles: 5,
  },
  SUPPORT_ATTACHMENTS: {
    allowedMimeTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/csv',
      'application/vnd.ms-excel',
    ],
    allowedExtensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf', 'txt', 'doc', 'docx', 'csv', 'xls'],
    maxFileSize: 10 * 1024 * 1024,
    maxFiles: 1,
  },
  DOCUMENT_SERVICE: {
    allowedMimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'application/rtf',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/bmp',
      'image/tiff',
      'text/html',
      'application/xml',
      'application/json',
      'application/zip',
    ],
    allowedExtensions: [
      'pdf', 'doc', 'docx', 'txt', 'rtf', 'xls', 'xlsx', 'csv', 'ppt', 'pptx',
      'jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'html', 'xml', 'json', 'zip',
    ],
    maxFileSize: 50 * 1024 * 1024,
    maxFiles: 10,
  },
};

const sanitizeUploadFilename = (originalName) => {
  if (!originalName || typeof originalName !== 'string') {
    return `file-${Date.now()}`;
  }

  let name = path.basename(originalName.replace(/\0/g, ''));
  name = name.replace(/[/\\]/g, '').replace(/\.\./g, '');
  if (!name || name === '.' || name === '..') {
    return `file-${Date.now()}`;
  }
  return name.slice(0, 200);
};

const getFileExtension = (filename) => path.extname(String(filename || '')).toLowerCase();

const isBlockedExtension = (filename) => {
  const ext = getFileExtension(filename);
  if (ext && BLOCKED_EXTENSIONS.has(ext)) {
    return true;
  }

  const base = path.basename(String(filename || ''), ext).toLowerCase();
  const innerExt = path.extname(base).toLowerCase();
  return Boolean(innerExt && BLOCKED_EXTENSIONS.has(innerExt));
};

const createMulterFileFilter = (options = {}) => {
  const {
    allowedMimeTypes = [],
    allowedExtensions = [],
    allowEmptyMime = false,
  } = options;

  const normalizedExtensions = allowedExtensions.map((entry) =>
    String(entry).toLowerCase().replace(/^\./, '')
  );

  return (req, file, cb) => {
    const original = file.originalname || '';

    if (isBlockedExtension(original)) {
      return cb(new Error('File type not allowed for security reasons'));
    }

    const ext = getFileExtension(original).replace(/^\./, '');
    if (normalizedExtensions.length > 0 && ext && !normalizedExtensions.includes(ext)) {
      return cb(new Error('File extension not allowed'));
    }

    if (allowedMimeTypes.length > 0) {
      const mime = String(file.mimetype || '').toLowerCase();
      const ext = getFileExtension(original).replace(/^\./, '');
      const genericMime =
        !mime ||
        mime === 'application/octet-stream' ||
        mime === 'binary/octet-stream';

      if (!mime && !allowEmptyMime) {
        return cb(new Error('File type could not be determined'));
      }
      if (
        mime &&
        !allowedMimeTypes.includes(mime) &&
        !(genericMime && ext && normalizedExtensions.includes(ext))
      ) {
        return cb(new Error('File type not allowed'));
      }
    }

    return cb(null, true);
  };
};

const getMulterLimits = (preset) => ({
  fileSize: preset.maxFileSize,
  files: preset.maxFiles,
});

const validateUploadedFile = (file, preset) => {
  if (!file) {
    return { valid: false, message: 'No file provided' };
  }
  if (isBlockedExtension(file.originalname)) {
    return { valid: false, message: 'File type not allowed for security reasons' };
  }
  if (file.size > preset.maxFileSize) {
    return {
      valid: false,
      message: `File size must be less than ${Math.round(preset.maxFileSize / (1024 * 1024))}MB`,
    };
  }
  const ext = getFileExtension(file.originalname).replace(/^\./, '');
  if (preset.allowedExtensions?.length && ext && !preset.allowedExtensions.includes(ext)) {
    return { valid: false, message: 'File extension not allowed' };
  }
  if (preset.allowedMimeTypes?.length && file.mimetype) {
    const mime = String(file.mimetype).toLowerCase();
    const genericMime =
      mime === 'application/octet-stream' || mime === 'binary/octet-stream';
    if (
      !preset.allowedMimeTypes.includes(mime) &&
      !(genericMime && ext && preset.allowedExtensions?.includes(ext))
    ) {
      return { valid: false, message: 'File type not allowed' };
    }
  }
  return { valid: true };
};

const createMulterErrorHandler = () => (error, req, res, next) => {
  if (!error) {
    return next();
  }

  if (error.message && /not allowed|security/i.test(error.message)) {
    return res.status(400).json({ success: false, message: error.message });
  }

  if (error.name === 'MulterError') {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ success: false, message: 'File size exceeds the allowed limit' });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ success: false, message: 'Too many files in this upload' });
    }
    return res.status(400).json({ success: false, message: 'File upload error' });
  }

  return next(error);
};

module.exports = {
  BLOCKED_EXTENSIONS,
  UPLOAD_PRESETS,
  sanitizeUploadFilename,
  getFileExtension,
  isBlockedExtension,
  createMulterFileFilter,
  getMulterLimits,
  validateUploadedFile,
  createMulterErrorHandler,
};
