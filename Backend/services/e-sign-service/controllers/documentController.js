const Document = require('../models/Document');
const archiver = require('archiver');
const path = require('path');
const fs = require('fs');

const downloadSignedDocument = async (req, res) => {
  try {
    const { documentId } = req.params;
    const docRecord = await Document.findById(documentId);
    if (!docRecord || !docRecord.filePath) {
      return res.status(404).json({ message: 'Signed document not found' });
    }

    res.download(docRecord.filePath, docRecord.fileName);
  } catch (err) {
    console.error('Download error:', err);
    res.status(500).json({ message: 'Failed to download document' });
  }
};
const downloadAllSignedDocument = async(req, res) =>{
    try {
    const { envelopeId } = req.params;

    const documents = await Document.find({ envelopeId });
    if (documents.length === 0) {
      return res.status(404).json({ message: 'No signed documents found for this envelope' });
    }

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename=signed_documents_${envelopeId}.zip`);

    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.pipe(res);

    for (const doc of documents) {
      if (fs.existsSync(doc.filePath)) {
        archive.file(doc.filePath, { name: doc.fileName });
      }
    }

    await archive.finalize();
  } catch (err) {
    console.error('Bulk download error:', err);
    res.status(500).json({ message: 'Failed to download signed documents' });
  }
}

module.exports = { downloadSignedDocument, downloadAllSignedDocument};
