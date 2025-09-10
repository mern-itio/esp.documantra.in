const Envelope = require('../models/Envelope');
const SignatureField = require('../models/SignatureFields');
const Recipient = require('../models/Recipient');
const RecipientPermission = require('../models/RecipientPermission');
const axios = require('axios');
const sendEmail = require('../emails/sendEmail');
const {signRequestTemplate, signReminderTemplate } = require('../emails/emailTemplates');
const mongoose = require('mongoose');
const SignatureFields = require('../models/SignatureFields');
const ObjectId = mongoose.Types.ObjectId;
const { signAndEmbed } = require('../services/digitalSignatureService');

const envelopesData = async (req, res) => {
    const userId = req.user.data.id;
    try {
        // Step 1: Fetch envelopes for the user
        const envelopes = await Envelope.find({ sender: userId })
                        .populate("documentIds")       // fetch docs
                        .populate({
                                  path: 'recipientIds',           // populate recipients
                                  select: 'name email UserId',    // only global info
                                  populate: {
                                    path: 'permissions',          // populate envelope-specific permissions
                                    model: 'RecipientPermission',
                                    match: function() {
                                      return { envelopeId: this._id };
                                    },
                                    select: 'role order status authLevel'
                                  }
                                })
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
            .populate({
                        path: 'recipientIds',           // populate recipients
                        select: 'name email UserId',    // only global info
                        populate: {
                          path: 'permissions',          // populate envelope-specific permissions
                          model: 'RecipientPermission',
                          match: { envelopeId: envelopeId }, // only permissions for this envelope
                          select: 'role order status authLevel'
                        }
                      });
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
           recipients: envelope.recipientIds.map(recipient => {
              const perm = recipient.permissions?.[0] || {};
              return {
                id: recipient._id,
                name: recipient.name,
                email: recipient.email,
                role: perm.role,
                order: perm.order,
                status: perm.status,
                authentication: perm.authLevel
              };
            })
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
  try {
    // Step 1: Find the first waiting recipientPermission for this envelope
    const waitingPermission = await RecipientPermission.findOne({
      envelopeId,
      status: 'waiting'
    })
      .sort({ order: 1, createdAt: 1 }) // respect signing order
      .populate('recipientId'); // fetch the recipient details (name, email, etc.)

    if (!waitingPermission) {
      return { error: "No waiting recipients" };
    }

    // Step 2: Update permission status
    waitingPermission.status = 'sent';
    await waitingPermission.save();

    // Step 3: Send email
    const signLink = `${process.env.FRONTEND_URL}/e-sign/signer/${envelopeId}/${waitingPermission.recipientId._id}`;
    const html = signRequestTemplate(
      waitingPermission.recipientId.name,
      envelopeSubject,
      envelopeMessage,
      signLink
    );

    await sendEmail(
      waitingPermission.recipientId.email,
      `Action Required: Sign "${envelopeSubject}"`,
      html
    );

    return {
      success: true,
      recipientId: waitingPermission.recipientId._id,
      permissionId: waitingPermission._id
    };
  } catch (error) {
    console.error("Error sending to recipients:", error);
    return { error: "Internal error while sending recipient email" };
  }
};

const addSignature = async (req, res) => {
  const { fieldId, signatureImageBase64, envelopeId, documentId, recipientId, certificateId, signerName } = req.body;

  if (!fieldId || !signatureImageBase64 || !envelopeId || !documentId || !recipientId || !certificateId) {
    return res.status(400).json({ message: 'All parameters are required' });
  }

  try {
    const result = await signAndEmbed({
      envelopeId,
      documentId,
      recipientId,
      certificateId,
      signerName,
      signatureImageBase64
    });
    // Send to next recipient
    const pendingFields = await SignatureField.find({
      envelopeId: envelopeId,
      status: 'pending'
    });
    if (pendingFields.length === 0) {
      // If no more pending fields for the same envelope, mark envelope as completed
      const envelope = await Envelope.findById(envelopeId);
        if (envelope) {
          envelope.status = 'completed';
          await envelope.save();
        }
      }else{
      const envelope = await Envelope.findById(envelopeId);
        if (envelope) {
          await sendToRecipients(envelope._id,envelope.subject,envelope.message);
        }
    }
    res.status(200).json({
      status: 'success',
      message: 'Signature added with compliance',
      data: result
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getRecipientByEmail  = async (req, res)=>{
 const {email} = req.params;
 try{
    // Check if recipient exists in the system
     const existingRecipient = await Recipient.findOne({ email });
     if(existingRecipient){
       return res.status(200).json({
        recipient: existingRecipient
       });
     }else{
      return res.status(404).json({
        message:"Recipient not found..."
      })
     }

 }catch(err){
  console.log(`Error in fetching recipient by Email: ${err}`)
 }

}

const envelopeArchive = async (req, res) => {
  try {
    const envelopeId = req.params.envelopeId; 
    const envelope = await Envelope.findById(envelopeId);
    if(envelope){
    // Update the status to "archived"
    envelope.status = "archived";
    await envelope.save();
    return res.status(200).json({ message: "Envelope archived successfully", envelope });
    }
  } catch (error) {
    console.error("Error checking envelope existence:", error);
    return false; // In case of error, assume envelope does not exist
  }
}
const envelopeDelete = async (req, res) => {
  try {
    const envelopeId = req.params.envelopeId; 
     // Validate envelopeId is a valid ObjectId
    if (!ObjectId.isValid(envelopeId)) {
      return res.status(400).json({ message: "Invalid envelope ID." });
    }
    const envelope = await Envelope.findOneAndDelete({ _id: new ObjectId(envelopeId) });
    if(envelope){
      return res.status(200).json({ message: "Envelope deleted successfully", envelope });
    }
  } catch (error) {
    console.error("Error checking envelope existence:", error);
    return false; // In case of error, assume envelope does not exist
  }
}
const envelopeReminder = async (req, res) => {
  try {
    const envelopeId = req.params.envelopeId;
    const envelope = await Envelope.findById(envelopeId);

    if (envelope && envelope.status === "in-progress") {
      const pendingSignatureFields = await SignatureFields.find({
        envelopeId: envelopeId,
        status: "pending"
      }).populate('recipientId');

      const recipientsMap = new Map();
      pendingSignatureFields.forEach(field => {
        const recipient = field.recipientId;
        if (recipient && !recipientsMap.has(recipient._id.toString())) {
          recipientsMap.set(recipient._id.toString(), recipient);
        }
      });

      const uniqueRecipients = Array.from(recipientsMap.values());

      // Loop through unique recipients
      for (const recipient of uniqueRecipients) {
        const signLink = `${process.env.FRONTEND_URL}/e-sign/signer/${envelope._id}/${recipient._id}`;
        const html = signReminderTemplate(recipient.name,envelope.subject,envelope.message,signLink);
        // Send Reminder E-Mail to pending recipients
        await sendEmail(
            recipient.email,
          `Reminder: Action Required: Sign "${envelope.subject}"`,
          html
        );
      }

      return res.status(200).json({
        success: true,
        message: 'Reminder emails processing initiated',
        recipients: uniqueRecipients,
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Envelope not in progress or not found',
      });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: 'Server Error',
    });
  }
};
const duplicateEnvelope = async (req, res) => {
  try {
    const { envelopeId } = req.params;

    const originalEnvelope = await Envelope.findById(envelopeId);
    if (!originalEnvelope) {
      return res.status(404).json({ message: "Envelope not found" });
    }

    const envelopeData = originalEnvelope.toObject();
    delete envelopeData._id;
    delete envelopeData.createdAt;
    delete envelopeData.updatedAt;

    envelopeData.status = "draft";
    envelopeData.subject = `${originalEnvelope.subject || "Untitled"} (Copy)`;

    const dublicateEnvelope = new Envelope(envelopeData);
    await dublicateEnvelope.save();

    return res.status(201).json({
      message: "Envelope duplicated successfully",
      envelope: dublicateEnvelope
    });
  } catch (error) {
    console.error("Error duplicating envelope:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

// Export functions
module.exports = {
  envelopesData,
  envelopesDetail,
  getEnvelopeStats,
  envelopExists,
  getSignatureFields,
  sendEnvelope,
  addSignature,
  getRecipientByEmail,
  envelopeArchive,
  envelopeDelete,
  envelopeReminder,
  duplicateEnvelope
};