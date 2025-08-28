
const { isEmailValid } = require('@draftnsign/validators');//
const Envelope = require('../models/Envelope');
const Document = require('../models/Document');
const Recipient = require('../models/Recipient');
const SignatureField = require('../models/SignatureFields');
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
  const { recipients, envelopeId } = req.body;

  if (!envelopeId) {
    return res.status(400).json({ message: 'Envelope ID is required' });
  }
  if (!recipients || recipients.length === 0) {
    return res.status(400).json({ message: 'No recipients provided' });
  }

  // Step 1: Find envelope by ID
  let envelope = await Envelope.findById(envelopeId);
  if (!envelope) {
    return res.status(404).json({ message: 'Envelope not found' });
  }

  const recps = await Promise.all(
    recipients.map(async (recipient) => {
      // Step 2: Check if recipient already exists in this envelope
      let existingRecp = await Recipient.findOne({
        envelopeId: envelope._id,
        email: recipient.email
      });

      if (existingRecp) {
        // Update recipient
        existingRecp.name = recipient.name || existingRecp.name;
        existingRecp.role = recipient.role || existingRecp.role;
        existingRecp.order = recipient.order ?? existingRecp.order;
        existingRecp.status = recipient.status || existingRecp.status;
        existingRecp.authLevel =
          recipient.authentication || existingRecp.authLevel;

        await existingRecp.save();
        return existingRecp._id;
      } else {
        // Create new recipient
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

        // Attach recipient to envelope if not already present
        if (!envelope.recipientIds.includes(recp._id)) {
          envelope.recipientIds.push(recp._id);
        }

        return recp._id;
      }
    })
  );

  // Step 3: Save updated envelope
  await envelope.save();

  return res.status(200).json({
    status: 'success',
    message: 'Recipients processed successfully',
    envelopeId: envelope._id,
    recipientIds: recps
  });
};
const saveSignatureFields = async (req, res) => {
  const { signatureFields, envelopeId } = req.body;
  console.log('Signature Fields:', signatureFields);
  if (!envelopeId) {
    return res.status(400).json({ message: 'Envelope ID is required' });
  }
  if (!signatureFields || signatureFields.length === 0) {
    return res.status(400).json({ message: 'No signature fields provided' });
  }
  const fields = await Promise.all(
      signatureFields.map(async (sf) => {
        const field = new SignatureField({
          envelopeId: envelopeId,
          documentId: sf.documentId,
          recipientId: sf.recipientId,
          page: sf.page,
          x: sf.x,
          y:sf.y,
          width:sf.width,
          height:sf.height,
          type:sf.type,
          status:sf.status || 'pending',
        });
        await field.save();
        return field._id;
      })
    );
    return res.status(200).json({
        status: 'success',
        message: 'Signature fields added successfully',
        data: {
          envelopeId: envelopeId,

        }
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
  updateEnvelope,
  saveSignatureFields
};
