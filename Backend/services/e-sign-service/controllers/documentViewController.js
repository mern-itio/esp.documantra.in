const path = require('path');
const {
  assertDocumentDownloadAccess,
  resolveLocalUploadPath,
} = require('../helpers/documentDownloadAccess');

const viewDocument = async (req, res, next) => {
  try {
    const { documentId } = req.params;
    const access = await assertDocumentDownloadAccess(req, documentId);
    if (!access.ok) {
      return res.status(access.status).json({
        status: access.status,
        message: access.message,
        data: null,
      });
    }

    const localPath = resolveLocalUploadPath(access.doc, access.doc.fileName);
    if (!localPath) {
      return res.status(404).json({
        status: 404,
        message: 'File not found',
        data: null,
      });
    }

    const downloadName = path.basename(access.doc.fileName || 'document.pdf');
    res.setHeader('Content-Type', access.doc.mimeType || 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${downloadName}"`);
    return res.sendFile(localPath);
  } catch (err) {
    return next(err);
  }
};

module.exports = { viewDocument };
