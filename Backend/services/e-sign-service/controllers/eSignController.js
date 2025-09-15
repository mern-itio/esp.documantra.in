
const { isEmailValid } = require('@draftnsign/validators');
const Envelope = require('../models/Envelope');
const Document = require('../models/Document');
const Recipient = require('../models/Recipient');
const RecipientPermission = require('../models/RecipientPermission');
const SignatureField = require('../models/SignatureFields');
const { logActivity } = require("../services/activityLogService");
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

      // Log envelope creation
      await logActivity(envelope._id.toString(), "ENVELOPE_CREATED", "Sender", { senderId: userId });
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

        // Log document upload
        await logActivity(envelope._id.toString(), "DOCUMENT_UPLOADED", "Sender", {
          senderId: userId,
          documentId: doc._id,
          fileName: file.filename,
        });

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
  const userId = req.user.data.id;

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
    recipients.map(async (r) => {
      let recipient = await Recipient.findOne({ email: r.email });

      if (!recipient) {
        recipient = await Recipient.create({
          name: r.name,
          email: r.email
        });
        // Log recipient created
        await logActivity(envelopeId, "RECIPIENT_CREATED", "Sender", {
          senderId: userId,
          recipientId: recipient._id,
        });
      }
      // Step 2: Check if this recipient already has permission for this envelope
      let existingPermission = await RecipientPermission.findOne({
        recipientId: recipient._id,
        envelopeId: envelope._id
      });

      if (existingPermission) {
        // optionally update role/order/authLevel
        existingPermission.role = r.role;
        existingPermission.order = r.order ?? existingPermission.order;
        existingPermission.authLevel = r.authentication;
        await existingPermission.save();
        // Log recipient permission updated
        await logActivity(envelopeId, "RECIPIENT_PERMISSION_UPDATED", "Sender", {
          senderId: userId,
          recipientId: recipient._id,
        });
      } else {
        await RecipientPermission.create({
          recipientId: recipient._id,
          envelopeId: envelope._id,
          role: r.role,
          order: r.order,
          status: 'waiting',
          authLevel: r.authentication
        });
        // Log recipient permission created
        await logActivity(envelopeId, "RECIPIENT_PERMISSION_CREATED", "Sender", {
          senderId: userId,
          recipientId: recipient._id,
        });
      }
      // Attach recipient to envelope if not already present
      if (!envelope.recipientIds.includes(recipient._id)) {
        envelope.recipientIds.push(recipient._id);
      }
      return recipient._id;
    })
  );

  // Step 3: Save updated envelope
  await envelope.save();

  // Log envelope updated (recipients added)
  await logActivity(envelopeId, "RECIPIENTS_ADDED_TO_ENVELOPE", "Sender", {
    senderId: userId,
    recipientIds: recps,
  });

  return res.status(200).json({
    status: 'success',
    message: 'Recipients processed successfully',
    envelopeId: envelope._id,
    recipientIds: recps
  });
};

const saveSignatureFields = async (req, res) => {
  const { signatureFields, envelopeId } = req.body;
  const userId = req.user.data.id;

  if (!envelopeId) {
    return res.status(400).json({ message: 'Envelope ID is required' });
  }
  if (!signatureFields || signatureFields.length === 0) {
    return res.status(400).json({ message: 'No signature fields provided' });
  }

  const processedFields = await Promise.all(
    signatureFields.map(async (sf) => {
      if (sf._id) {
        // Update existing field
        const updatedField = await SignatureField.findByIdAndUpdate(
          sf._id,
          {
            envelopeId: envelopeId,
            documentId: sf.documentId,
            recipientId: sf.recipientId,
            page: sf.page,
            x: sf.x,
            y: sf.y,
            width: sf.width,
            height: sf.height,
            type: sf.type,
            status: sf.status || 'pending',
          },
          { new: true }  // Return the updated document
        );

        // Optionally log update activity
        await logActivity(envelopeId, "SIGNATURE_FIELD_UPDATED", "Sender", {
          senderId: userId,
          signatureFieldId: updatedField._id,
          documentId: sf.documentId,
          recipientId: sf.recipientId,
        });

        return updatedField;
      } else {
        // Create new field
        const newField = new SignatureField({
          envelopeId: envelopeId,
          documentId: sf.documentId,
          recipientId: sf.recipientId,
          page: sf.page,
          x: sf.x,
          y: sf.y,
          width: sf.width,
          height: sf.height,
          type: sf.type,
          status: sf.status || 'pending',
        });

        await newField.save();

        // Log creation activity
        await logActivity(envelopeId, "SIGNATURE_FIELD_ADDED", "Sender", {
          senderId: userId,
          signatureFieldId: newField._id,
          documentId: sf.documentId,
          recipientId: sf.recipientId,
        });

        return newField;
      }
    })
  );

  // Log overall save operation
  await logActivity(envelopeId, "ALL_SIGNATURE_FIELDS_SAVED", "Sender", {
    senderId: userId,
  });

  return res.status(200).json({
    status: 'success',
    message: 'Signature fields saved successfully',
    data: {
      envelopeId,
      signatureFields: processedFields,  // Return full array of saved/updated fields
    }
  });
};

const updateEnvelope = async (req, res) => {
   const { envelopeData,envelopeId } = req.body;
   const userId = req.user.data.id;
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
    
    // Log envelope updated
    await logActivity(envelopeId, "ENVELOPE_UPDATED", "Sender", {
      senderId: userId
    });
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
