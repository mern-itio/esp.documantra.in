const fs = require('fs');
const { assertUploadFileAccess } = require('../helpers/documentDownloadAccess');

const serveUploadFile = async (req, res, next) => {
  try {
    const filename = req.params.filename;
    const access = await assertUploadFileAccess(req, filename);
    if (!access.ok) {
      return res.status(access.status).json({
        status: access.status,
        message: access.message,
        data: null,
      });
    }

    if (!fs.existsSync(access.localPath)) {
      return res.status(404).json({
        status: 404,
        message: 'File not found',
        data: null,
      });
    }

    return res.sendFile(access.localPath);
  } catch (err) {
    return next(err);
  }
};

module.exports = { serveUploadFile };
