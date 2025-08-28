const Envelope = require('../models/Envelope');
const SignatureField = require('../models/SignatureFields');
const Recipient = require('../models/Recipient');
const axios = require('axios');
const sendEmail = require('../emails/sendEmail');
const {signRequestTemplate } = require('../emails/emailTemplates');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;

const envelopesData = async (req, res) => {
    const userId = req.user.data.id;
    try {
        // Step 1: Fetch envelopes for the user
        const envelopes = await Envelope.find({ sender: userId })
                        .populate("documentIds")       // fetch docs
                        .populate("recipientIds");     // fetch recipients
        if (!envelopes || envelopes.length === 0) {
            return res.status(404).json({ message: 'No envelopes found' });
        }
        // Fetch sender details from User service
        const senderResponse = await axios.get(
        `${process.env.AUTH_URL}/api/user-details/${userId}`, //
                {
                    headers: {
                    Authorization: req.headers.authorization, // forward toke
                    },
                }
        );
        const senderDetails = senderResponse.data;
        if (!senderDetails || !senderDetails.data) {
            return res.status(404).json({ message: 'Sender not found' });
        }

        // Step 2: Format the response
        const formattedEnvelopes = envelopes.map(envelope => ({
        id: envelope._id,
        subject: envelope.subject,
        status: envelope.status,
        priority: envelope.priority,
        createdAt: envelope.createdAt,
        sentAt: envelope.updatedAt,
        expiresAt: envelope.expirationDate,
        sender:{
            id: senderDetails?.data?._id,
            name: senderDetails?.data?.fullname,
            email: senderDetails?.data?.email,
            role: senderDetails?.data?.role || 'sender',
            organization: "ITIO",
            avatar:""
        },
        signatureType: envelope.signatureType,
        documents: envelope.documentIds.map(doc => ({
            id: doc._id,
            name: doc.fileName,
            size: doc.fileSize,
            type: doc.mimeType
        })),
        recipients: envelope.recipientIds.map(recipient => ({
            id: recipient._id,
            name: recipient.name,
            email: recipient.email,
            role: recipient.role,
            order: recipient.order,
            status: recipient.status,
            authentication: recipient.authLevel
        })),
        }));

        // Step 3: Count the total number of envelopes
        const envelopeCount = envelopes.length;
    
        return res.status(200).json({
        status: 'success',
        data: formattedEnvelopes,
        totalEnvelopes: envelopeCount
        });
    } catch (error) {
        console.error('Error fetching envelopes:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}
const envelopesDetail = async (req, res) => {
    const envelopeId = req.params.id;

    try {
        // Step 1: Fetch single envelope by ID
        const envelope = await Envelope.findById(envelopeId)
            .populate("documentIds")   // fetch docs
            .populate("recipientIds"); // fetch recipients

        if (!envelope) {
            return res.status(404).json({ message: 'Envelope not found' });
        }
        const senderId = envelope.sender;

        // Step 2: Fetch sender details from User service
        const senderResponse = await axios.get(
            `${process.env.AUTH_URL}/api/user-details/${senderId}`,
        );

        const senderDetails = senderResponse.data;
        if (!senderDetails || !senderDetails.data) {
            return res.status(404).json({ message: 'Sender not found' });
        }

        // Step 3: Format the response (single envelope object)
        const formattedEnvelope = {
            id: envelope._id,
            subject: envelope.subject,
            status: envelope.status,
            priority: envelope.priority,
            createdAt: envelope.createdAt,
            sentAt: envelope.updatedAt,
            expiresAt: envelope.expirationDate,
            sender: {
                id: senderDetails?.data?._id,
                name: senderDetails?.data?.fullname,
                email: senderDetails?.data?.email,
                role: senderDetails?.data?.role || 'sender',
                organization: "ITIO",
                avatar: ""
            },
            signatureType: envelope.signatureType,
            documents: envelope.documentIds.map(doc => ({
                id: doc._id,
                name: doc.fileName,
                size: doc.fileSize,
                type: doc.mimeType
            })),
            recipients: envelope.recipientIds.map(recipient => ({
                id: recipient._id,
                name: recipient.name,
                email: recipient.email,
                role: recipient.role,
                order: recipient.order,
                status: recipient.status,
                authentication: recipient.authLevel
            }))
        };

        // Step 4: Return single envelope
        return res.status(200).json({
            status: 'success',
            data: formattedEnvelope
        });

    } catch (error) {
        console.error('Error fetching envelope:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
const getSignatureFields = async (req, res) => {
  const documentId = req.params.id; 
  console.log("Fetching signature fields for document ID:", documentId);
  try {
    const signatureFields = await SignatureField.find({ documentId:documentId });
    if (!signatureFields) {
      return res.status(404).json({ message: 'Document not found' });
    }
    return res.status(200).json({
      status: 'success',
      signatureFields: signatureFields
    });
  } catch (error) {
    console.error('Error fetching signature fields:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
const getEnvelopeStats = async (req, res) => {
  try {
    const now = new Date();

    const stats = await Envelope.aggregate([
      {
        $addFields: {
          derivedStatus: {
            $switch: {
             branches: [
                {
                  case: { $and: [{ $eq: ["$status", "in-progress"] }, { $lt: ["$expirationDate", now] }] },
                  then: "expired"
                },
                { case: { $eq: ["$status", "in-progress"] }, then: "pending" },
                { case: { $eq: ["$status", "draft"] }, then: "draft" },
                { case: { $eq: ["$status", "completed"] }, then: "completed" }
              ],

              default: "unknown"
            }
          }
        }
      },
      {
        $group: {
          _id: "$derivedStatus",
          count: { $sum: 1 }
        }
      }
    ]);

    // Format response
    const response = {
      Completed: 0,
      Pending: 0,
      Expired: 0,
      Draft: 0,
      Total: 0
    };

    stats.forEach(item => {
      const key = item._id.charAt(0).toUpperCase() + item._id.slice(1);
      response[key] = item.count;
      response.Total += item.count;
    });

    return res.status(200).json({
      status: "success",
      data: response
    });
  } catch (error) {
    console.error("Error fetching envelope stats:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
const envelopExists = async (envelopeId) => {
  try {
    const envelope = await Envelope.findById(envelopeId);
    return !!envelope; // Returns true if envelope exists, false otherwise
  } catch (error) {
    console.error("Error checking envelope existence:", error);
    return false; // In case of error, assume envelope does not exist
  }
};
const sendEnvelope = async (req, res) => {
try {
    const { envelopeId } = req.params;
    const envelope = await Envelope.findById(envelopeId);
    if (!envelope) return res.status(404).send("Envelope not found");

    // Update envelope status if draft
    if (envelope.status === 'draft') {
      envelope.status = 'in-progress';
      await envelope.save();
      await sendToRecipients(envelope._id,envelope.subject,envelope.message);
      return res.status(200).send("Envelope sent to recipients");
    }
}catch(error){
    console.error("Error sending envelope:", error);
    return res.status(500).send("Server error"); 
}

}
const sendToRecipients = async (envelopeId, envelopeSubject, envelopeMessage) => {

  try{
        const waitingRecipient = await Recipient.findOne({
        envelopeId,
        status: 'waiting'
      }).sort({ createdAt: 1 });

      if (!waitingRecipient) return { error: "No waiting recipients" };

      // Update recipient status to sent
      waitingRecipient.status = 'sent';
      await waitingRecipient.save();

      // Send email
      const signLink = `${process.env.FRONTEND_URL}/e-sign/signer/${envelopeId}/${waitingRecipient._id}`;
      const html = signRequestTemplate(waitingRecipient.name, envelopeSubject, envelopeMessage, signLink);
      await sendEmail(waitingRecipient.email, `Action Required: Sign "${envelopeSubject}"`, html);

      return { success: true, recipientId: waitingRecipient._id };
  } catch(error){
    console.error("Error sending to recipients:", error);
  }
};
const addSignature = async (req, res) => {
  const { fieldId, signature } = req.body;

  if (!fieldId || !signature) {
    return res.status(400).json({ message: 'Field ID and signature are required' });
  }

  // Step 1: Find the signature field by ID
  let field = await SignatureField.findById(fieldId);
  if (!field) {
    return res.status(404).json({ message: 'Signature field not found' });
  }

  // Step 2: Update the signature field with the provided signature
  field.signature = signature; // Assuming signature is a base64 string or similar
  field.status = 'completed'; // Mark the field as completed
  await field.save();

  // if no more pending fields for the same envelope, mark envelope as completed
  const pendingFields = await SignatureField.find({
    envelopeId: field.envelopeId,
    status: 'pending'
  });
    if (pendingFields.length === 0) {
      const envelope = await Envelope.findById(field.envelopeId);
        if (envelope) {
          envelope.status = 'completed';
          await envelope.save();
        }
    }else{
      const envelope = await Envelope.findById(field.envelopeId);
        if (envelope) {
          await sendToRecipients(envelope._id,envelope.subject,envelope.message);
        }
    }
  return res.status(200).json({
    status: 'success',
    message: 'Signature added successfully',
    data: {
      fieldId: field._id,
      signature: field.signature
    }
  });
};

// Export functions
module.exports = {
  envelopesData,
  envelopesDetail,
  getEnvelopeStats,
  envelopExists,
  getSignatureFields,
  sendEnvelope,
  addSignature
};