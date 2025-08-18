
const { isEmailValid } = require('@draftnsign/validators');//
const Envelope = require('../models/Envelope');
const Document = require('../models/Document');
const Recipient = require('../models/Recipient');
// Documents Upload 
const Upload = async (req, res) => {
    const { files } = req;
    const userId = req.user.data.id;
    if (!files || files.length === 0) {
        console.error('No files uploaded');
        return res.status(400).json({ message: 'No files uploaded' });
    }
    // Step 1: Create empty envelope (or reuse if client sends envelopeId)
    let envelope;
    if (req.body.envelopeId) {
      envelope = await Envelope.findById(req.body.envelopeId);
    } else {
      envelope = new Envelope({
        sender: userId,
      });
      await envelope.save();
    }
    // Step 2: Create document records
    const docs = await Promise.all(
      files.map(async (file) => {
        const doc = new Document({
          envelopeId: envelope._id,
          fileName: file.filename,
          mimeType: file.mimetype,
          filePath: file.path,
          fileSize: file.size
        });
        await doc.save();
        return doc._id;
      })
    );
    // Step 3: Update envelope with doc IDs
    envelope.documentIds.push(...docs);
    await envelope.save();

    return res.status(200).json({
        status: 'success',
        message: 'Files uploaded successfully',
        data: {
          envelopeId: envelope._id
        }
    });
};
const insertRecipient = async (req, res) => {
  const { recipients,envelopeId } = req.body;
  if (!envelopeId) {
    return res.status(400).json({ message: 'Envelope ID is required' });
  }
  if (!recipients || recipients.length === 0) {
    return res.status(400).json({ message: 'No recipients provided' });
  }
  //Step 1: Find envelope by ID
  let envelope = await Envelope.findById(req.body.envelopeId);
  if (!envelope) {
    return res.status(404).json({ message: 'Envelope not found' });
  }
  // Step 2: Create recipient records
  const recps = await Promise.all(
      recipients.map(async (recipient) => {
        const recp = new Recipient({
          envelopeId: envelope._id,
          name: recipient.name,
          email: recipient.email,
          role: recipient.role,
          order: recipient.order,
          status: recipient.status,
          authLevel: recipient.authentication
        });
        await recp.save();
        return recp._id;
      })
    );
  // Step 3: Update envelope with recipient IDs
  envelope.recipientIds.push(...recps);
  await envelope.save();
  return res.status(200).json({
    status: 'success',
    message: 'Recipient added successfully',
    envelopeId: envelope._id
  });
};
const updateEnvelope = async (req, res) => {
   const { envelopeData,envelopeId } = req.body;
    if (!envelopeId) {
      return res.status(400).json({ message: 'Envelope ID is required' });
    }
    // Step 1: Find envelope by ID
    let envelope = await Envelope.findById(envelopeId);
    if (!envelope) {
      return res.status(404).json({ message: 'Envelope not found' });
    }
    // Step 2: Update envelope fields
    envelope.subject = envelopeData.subject || envelope.subject;
    envelope.message = envelopeData.message || envelope.message;
    envelope.priority = envelopeData.priority || envelope.priority;
    envelope.signingOrder = envelopeData.signingOrder || envelope.signingOrder;
    envelope.expirationDate = envelopeData.expiresAt || envelope.expirationDate;
    envelope.isReminder = envelopeData.reminderEnabled || envelope.isReminder;
    envelope.reminderInterval = envelopeData.reminderInterval || envelope.reminderInterval;
    envelope.isAll = envelopeData.requireAllSignatures || envelope.isAll;
    envelope.canDecline = envelopeData.allowDecline || envelope.canDecline;
    envelope.signatureType = envelopeData.signatureType || envelope.signatureType;
    envelope.status = envelopeData.status || envelope.status;
    // Step 3: Save updated envelope
    await envelope.save();
    return res.status(200).json({
      status: 'success',
      message: 'Envelope updated successfully',
      envelopeId: envelope._id
    });
}


// Export functions
module.exports = {
  Upload,
  insertRecipient,
  updateEnvelope
};
