const { isEmailValid, UPLOAD_PRESETS, validateUploadedFile } = require('@draftnsign/validators');
const Envelope = require('../models/Envelope');
const Document = require('../models/Document');
const Recipient = require('../models/Recipient');
const RecipientPermission = require('../models/RecipientPermission');
const SignatureField = require('../models/SignatureFields');
const { logActivity } = require("../services/activityLogService");
const { normalizeUploadToPdf } = require('../services/convertUploadToPdf');
const {
  getPublicGuestId,
  attachPublicGuestToEnvelope,
} = require('../helpers/publicGuestSend');
const mongoose = require('mongoose');
const axios = require('axios');


/** Client temp ids (e.g. recipient_123) must not crash Mongo ObjectId cast. */
const normalizeRecipientId = (value) => {
  if (value == null || value === '') return null;
  const str = String(value);
  if (
    mongoose.Types.ObjectId.isValid(str) &&
    String(new mongoose.Types.ObjectId(str)) === str
  ) {
    return str;
  }
  return null;
};

/** When client omits recipientId, assign the first signer on the envelope. */
const resolveRecipientIdForField = async (envelopeId, recipientId) => {
  const normalized = normalizeRecipientId(recipientId);
  if (normalized) return normalized;

  const permission = await RecipientPermission.findOne({
    envelopeId,
    role: { $nin: ['carbon_copy', 'cc', 'in_person_signer'] },
  }).sort({ order: 1, createdAt: 1 });

  return permission?.recipientId ? String(permission.recipientId) : null;
};

const parseAuthLevel = (authentication) => {
  if (!authentication) return [];

  let authArray = [];

  // Case 1: already array
  if (Array.isArray(authentication)) {
    authArray = authentication;
  }

  // Case 2: single ObjectId string
  else if (
    typeof authentication === "string" &&
    mongoose.Types.ObjectId.isValid(authentication) &&
    authentication.length === 24
  ) {
    authArray = [authentication];
  }

  // Case 3: JSON string
  else if (typeof authentication === "string") {
    try {
      const parsed = JSON.parse(authentication);

      if (Array.isArray(parsed)) {
        authArray = parsed;
      } else if (mongoose.Types.ObjectId.isValid(parsed)) {
        authArray = [parsed];
      }
    } catch (e) {
      if (mongoose.Types.ObjectId.isValid(authentication)) {
        authArray = [authentication];
      }
    }
  }

  // Final mapping to schema format
  return authArray
    .filter((auth) =>
      mongoose.Types.ObjectId.isValid(
        auth.authMethodId || auth
      )
    )
    .map((auth) => ({
      authMethodId: auth.authMethodId || auth,
      status: auth.status || "pending"
    }));
};
// Documents Upload 
const Upload = async (req, res) => {
    const { files } = req;
    //const userId = req.user?.data?.id || null;
const userId = req.user?.data?.id;
const isPublicUpload = String(req.originalUrl || req.baseUrl || '').includes('/api/e-sign/public/');
const publicGuestId = isPublicUpload && !userId ? getPublicGuestId(req) : null;
 if (!files || files.length === 0) {
        console.error('No files uploaded');
        return res.status(400).json({ message: 'No files uploaded' });
    }
    for (const file of files) {
      const check = validateUploadedFile(file, UPLOAD_PRESETS.ESIGN_DOCUMENTS);
      if (!check.valid) {
        return res.status(400).json({ message: check.message });
      }
    }
    // Step 1: Create empty envelope (or reuse if client sends envelopeId)
    let envelope;
  if (req.body.envelopeId) {
      envelope = await Envelope.findById(req.body.envelopeId);
      if (!envelope) {
        return res.status(404).json({ message: 'Envelope not found' });
      }
      // Update subject/message/name if provided on existing envelope
      const { name, subject, message, envelopetype, isAIGenerated } = req.body || {};
      if (typeof name === 'string' && name.trim().length > 0) {
        envelope.name = name.trim();
      }
      if (typeof subject === 'string' && subject.trim().length > 0) {
        envelope.subject = subject.trim();
      }
      if (typeof envelopetype === 'string' && envelopetype.trim().length > 0) {
        envelope.envelopetype = envelopetype.trim();
      }
      if (typeof message === 'string') {
        envelope.message = message.trim();
      }
      // Handle isAIGenerated update - can come as string 'true'/'false' from FormData or as boolean
      if (isAIGenerated !== undefined) {
        if (typeof isAIGenerated === 'boolean') {
          envelope.isAIGenerated = isAIGenerated;
        } else if (typeof isAIGenerated === 'string') {
          envelope.isAIGenerated = isAIGenerated.toLowerCase() === 'true';
        }
      }
      await envelope.save();
      if (isPublicUpload && !userId) {
        await attachPublicGuestToEnvelope(envelope, req);
      }
    } else {
      // Create a new envelope with optional subject/message/name
      const { name, subject, message, envelopetype, isAIGenerated } = req.body || {};
      const accountType = req.headers['x-account-type'];
      const organizationId = req.headers['x-organization-id'];
      const isOrgContext = accountType === 'organization' && !!organizationId ;
      // Handle isAIGenerated - can come as string 'true'/'false' from FormData or as boolean
      let aiGenerated = false;
      if (typeof isAIGenerated === 'boolean') {
        aiGenerated = isAIGenerated;
      } else if (typeof isAIGenerated === 'string') {
        aiGenerated = isAIGenerated.toLowerCase() === 'true';
      }
      
      envelope = new Envelope({
        sender: userId || null,
        publicGuestId: publicGuestId || null,
     //sender: userId || null,  
 name: typeof name === 'string' && name.trim().length > 0 ? name.trim() : undefined,
        subject: typeof subject === 'string' ? subject.trim() : undefined,
        envelopetype: typeof envelopetype === 'string' && envelopetype.trim().length > 0 ? envelopetype.trim() : (typeof subject === 'string' ? subject.trim() : undefined),
        message: typeof message === 'string' ? message.trim() : undefined,
        isAIGenerated: aiGenerated,
        isOrganization: isOrgContext,
        organizationId: isOrgContext ? organizationId : null
      });
      await envelope.save();

      // Log envelope creation
      await logActivity(envelope._id.toString(), "ENVELOPE_CREATED", "Sender", { senderId: userId });
    }
    // Step 2: Create document records (convert images/docs to PDF when needed)
    const normalizedFiles = [];
    for (const file of files) {
      try {
        normalizedFiles.push(await normalizeUploadToPdf(file));
      } catch (conversionErr) {
        console.error('Upload conversion failed:', conversionErr);
        return res.status(400).json({
          message: conversionErr.message || 'Failed to prepare document for signing',
        });
      }
    }

    const docs = await Promise.all(
      normalizedFiles.map(async (file) => {
        const doc = new Document({
          envelopeId: envelope._id,
          fileName: file.fileName,
          mimeType: file.mimeType,
          filePath: `uploads/${file.fileName}`,
          fileSize: file.size,
        });
        await doc.save();

        // Log document upload
        await logActivity(envelope._id.toString(), "DOCUMENT_UPLOADED", "Sender", {
          senderId: userId,
          documentId: doc._id,
          fileName: file.fileName,
          originalFileName: file.originalName,
          convertedToPdf: Boolean(file.converted),
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
  //const userId = req.user?.data?.id || null;
const userId = req.user?.data?.id || null;
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
      // Check if recipient exists by email
      let recipient = await Recipient.findOne({ 
        email: r.email,
      });

      if (!recipient) {
        let recUserId = null;
        //check if user exists in system with same email
        console.log(`Checking for existing user with email: ${r.email}`);
        try {
        const response = await axios.get(`${process.env.AUTH_URL}/api/find-user/${r.email}`, {
          //headers: { Authorization: req.headers.authorization },
headers: req.headers.authorization
  ? { Authorization: req.headers.authorization }
  : {},
 });
        if (response.data?.data) {
          console.log('User found in auth service:', response.data.data);
          recUserId= response.data.data._id;
        }
      } catch (err) {
        console.warn(`Failed to fetch sender details for ID ${r.email}:`, err.message);
      }
        // If not found, create a new recipient with UserId
        recipient = await Recipient.create({
          authUserId: recUserId,
          name: r.name,
          email: r.email
        });
        // Log recipient created
        await logActivity(envelopeId, "RECIPIENT_CREATED", "Sender", {
          senderId: userId,
          recipientId: recipient._id,
        });
      } else {
        // Existing global recipient: keep display name in sync with what the sender entered for this envelope
        const incomingName = (r.name || '').trim();
        if (incomingName) {
          recipient.name = incomingName;
        }
        if (r.phone !== undefined && r.phone !== null && String(r.phone).trim()) {
          recipient.phone = String(r.phone).trim();
        }
        await recipient.save();
      }
      // Step 2: Check if this   recipient already has permission for this envelope
      let existingPermission = await RecipientPermission.findOne({
        recipientId: recipient._id,
        envelopeId: envelope._id
      });

      if (existingPermission) {
        // optionally update role/order/authLevel
        existingPermission.role = r.role;
        existingPermission.order = r.order ?? existingPermission.order;
        existingPermission.authLevel = parseAuthLevel(r.authentication);
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
role: (r.role || 'signer').toLowerCase(),          
//role: r.role,
          order: r.order,
          status: 'waiting',
          authLevel: parseAuthLevel(r.authentication)
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

  const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/+$/, '');
  const recipientDetails = await Promise.all(
    recps.map(async (id) => {
      const recipient = await Recipient.findById(id);
      if (!recipient) return null;
      return {
        recipientId: recipient._id,
        name: recipient.name,
        email: recipient.email,
        signLink: `${frontendUrl}/e-sign/signer/${envelopeId}/${recipient._id}`,
      };
    })
  );

  return res.status(200).json({
    status: 'success',
    message: 'Recipients processed successfully',
    envelopeId: envelope._id,
    recipientIds: recps,
    signingLinks: recipientDetails.filter(Boolean),
  });
};

const saveSignatureFields = async (req, res) => {
  try {
  const { signatureFields, envelopeId } = req.body;
  const userId = req.user?.data?.id || null;

  console.log('Received signature fields:', JSON.stringify(signatureFields, null, 2));

  if (!envelopeId) {
    return res.status(400).json({ message: 'Envelope ID is required' });
  }
  if (!signatureFields || signatureFields.length === 0) {
    return res.status(400).json({ message: 'No signature fields provided' });
  }

  const processedFields = await Promise.all(
    signatureFields.map(async (sf) => {
      const recipientId = await resolveRecipientIdForField(envelopeId, sf.recipientId);    
  console.log('Processing field with type:', sf.type, 'for field:', sf);
      if (sf._id) {
        // Update existing field
        const updatedField = await SignatureField.findByIdAndUpdate(
          sf._id,
          {
            envelopeId: envelopeId,
            documentId: sf.documentId,
            recipientId: recipientId,
            slotId: sf.slotId || null,
            label: sf.label || '',
            page: sf.page,
            x: sf.x,
            y: sf.y,
            width: sf.width,
            height: sf.height,
            type: sf.type,
            status: sf.status || 'pending',
            fieldId: sf.fieldId || null, // for power form linkage
            option: sf.option || null
          },
          { new: true }  // Return the updated document
        );

        // Optionally log update activity
        await logActivity(envelopeId, "SIGNATURE_FIELD_UPDATED", "Sender", {
          senderId: userId,
          signatureFieldId: updatedField._id,
          documentId: sf.documentId,
          recipientId: recipientId,
        });

        return updatedField;
      } else {
        // Create new field
        console.log('Creating new field with type:', sf.type);
        const newField = new SignatureField({
          envelopeId: envelopeId,
          documentId: sf.documentId,
          recipientId: recipientId,
          slotId: sf.slotId || null,
          label: sf.label || '',
          page: sf.page,
          x: sf.x,
          y: sf.y,
          width: sf.width,
          height: sf.height,
          type: sf.type,
          status: sf.status || 'pending',
          fieldId: sf.fieldId || null, // for power form linkage
          option: sf.option || null
        });

        console.log('About to save field:', newField);
        await newField.save();

        // Log creation activity
        await logActivity(envelopeId, "SIGNATURE_FIELD_ADDED", "Sender", {
          senderId: userId,
          signatureFieldId: newField._id,
          documentId: sf.documentId,
          recipientId: recipientId,
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
  } catch (err) {
    console.error('saveSignatureFields error:', err);
    return res.status(400).json({
      message: err.message || 'Failed to save signature fields',
    });
  }
};

const updateEnvelope = async (req, res) => {
   const { envelopeData,envelopeId } = req.body;
   const userId = req.user?.data?.id || null;
    if (!envelopeId) {
      return res.status(400).json({ message: 'Envelope ID is required' });
    }
    // Step 1: Find envelope by ID
    let envelope = await Envelope.findById(envelopeId);
    if (!envelope) {
      return res.status(404).json({ message: 'Envelope not found' });
    }
    // Step 2: Update envelope fields
    if (typeof envelopeData.name === 'string' && envelopeData.name.trim().length > 0) {
      envelope.name = envelopeData.name.trim();
    }
    envelope.subject = envelopeData.subject || envelope.subject;
    // set envelopetype from provided value if present, else leave unchanged
    if (typeof envelopeData.envelopetype === 'string' && envelopeData.envelopetype.trim().length > 0) {
      envelope.envelopetype = envelopeData.envelopetype.trim();
    }
    envelope.message = envelopeData.message || envelope.message;
    envelope.priority = envelopeData.priority || envelope.priority;
    envelope.signingOrder = envelopeData.signingOrder || envelope.signingOrder;
    envelope.expirationDate = envelopeData.expiresAt || envelope.expirationDate;
    if (typeof envelopeData.expirationAlertDays === 'number') {
      envelope.expirationAlertDays = envelopeData.expirationAlertDays;
    }
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
