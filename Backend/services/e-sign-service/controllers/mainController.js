const Envelope = require('../models/Envelope');
const SignatureField = require('../models/SignatureFields');
const Recipient = require('../models/Recipient');
const RecipientPermission = require('../models/RecipientPermission');
const axios = require('axios');
const sendEmail = require('../emails/sendEmail');
const {signRequestTemplate, signReminderTemplate, envelopeCompletedTemplate } = require('../emails/emailTemplates');
const mongoose = require('mongoose');
const SignatureFields = require('../models/SignatureFields');
const ObjectId = mongoose.Types.ObjectId;
const { signAndEmbed, initiateRecipientSignature, finalizeSigning, prepareDocumentForFinalSigning } = require('../services/digitalSignatureService');
const {logActivity} = require('../services/activityLogService');
const { ActivityLogs } = require('../models/ActivityLogs');
const Document = require('../models/Document');
const { issueCertificate } = require('../services/pkiService');
const { generateAndStoreCompletionCertificate } = require('../services/certificateGenerator');
const fs = require('fs');
const selfSigner = require('../models/selfSigner');
const { sign } = require('crypto');

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
        isPowerForm: envelope.isPowerForm,
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
            isPowerForm: envelope.isPowerForm,
            powerFormId:envelope.powerFormId,
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
const sendToAllRecipients = async (envelope, certBuffer, certFilename, signedBuffer, signedFilename) => {
  try{
    const AllRecipients = await RecipientPermission.find({
      envelopeId: envelope._id
    }).populate('recipientId');
    console.log("AllRecipients:", AllRecipients);
    for (const Recipient of AllRecipients) {
        if(Recipient){
          const html = envelopeCompletedTemplate(
            Recipient.recipientId.name,
            envelope.subject
          );
          const attachments = [
                    { filename: certFilename, content: certBuffer, contentType: 'application/pdf' },
                    { filename: signedFilename, content: signedBuffer, contentType: 'application/pdf' }
                  ];
          await sendEmail(
            Recipient.recipientId.email,
            `Document "${envelope.subject}" Completed and Signed`,
            html,
            attachments
          );

        }
      }

  }catch (error){
    console.error("Error sending to all recipients:", error);
    return { error: "Internal error while sending recipient email" };
  }
}

const addSignature = async (req, res) => {
  const { fieldId, signatureImageBase64, envelopeId, documentId, recipientId, certificateId, signerName,selfValue } = req.body;

  if (!fieldId || !signatureImageBase64 || !envelopeId || !documentId || !recipientId || !certificateId) {
    return res.status(400).json({ message: 'All parameters are required' });
  }
  // Call the certificate function
  if(!certificateId){
    const cert = await issueCertificate(recipientId, envelopeId);
    // Log certificate issued action
    await logActivity(envelopeId, "CERTIFICATE_ISSUED", "Sender", {
      recipientId,  
      certificateId: cert.certificateId,
    });
  }
  // Call the initiateRecipientSignature
  const initiateSign = await initiateRecipientSignature({fieldId, envelopeId, documentId, recipientId, signatureImageBase64,selfValue });
  if (!initiateSign) {
    console.log('Failed to initiate recipient signature');
    return res.status(500).json({ message: 'Failed to initiate signature' });
  }
  console.log('Signature field updated:', initiateSign.signatureField);
  // Check pending recipients and send email to next recipient
    try {
    const pendingFields = await SignatureField.find({
      envelopeId: envelopeId,
      status: 'pending'
    });
    if (pendingFields.length === 0) {
      const envelope = await Envelope.findById(envelopeId);
        if (envelope) {
            // prepare document for final signing if all done
            const prepareDoc = await prepareDocumentForFinalSigning(envelopeId, documentId);
            if (!prepareDoc) {
              console.log('Failed to prepare document for final signing');
              return res.status(500).json({ message: 'Failed to prepare document for final signing' });
            }
            console.log('Document prepared for final signing:', prepareDoc);
            // Call the final signing function
            const digiSign = await finalizeSigning(envelopeId, documentId);
            if (!digiSign) {
              console.log('Failed to finalize signing');
              return res.status(500).json({ message: 'Failed to finalize signing' });
            }
            const signedPdfBuffer = fs.readFileSync(digiSign.finalPath);
            const signedPdfFilename = `signed-document-${envelopeId}.pdf`;
            // Update envelope status to completed
            envelope.status = 'completed';
            
            await envelope.save();   
            // Generate Certificate of Completion and send email
            try{
                const { buffer, filename, filepath } = await generateAndStoreCompletionCertificate(envelope._id);
                // Persist reference to the envelope (adapt schema as needed)
                envelope.completionCertificate = {
                  filename,
                  path: filepath,          // server path (or store URL if you upload to S3)
                  mimeType: 'application/pdf',
                  createdAt: new Date()
                };
                await envelope.save();
                //Send completion email to all recipients
                await sendToAllRecipients(envelope,buffer,filename,signedPdfBuffer,signedPdfFilename);

            }catch(err){
                console.error('Error generating completion certificate:', err);
            }

            await logActivity(envelopeId, "ENVELOPE_COMPLETED", "System", {
              subject:envelope.subject,
              message:envelope.message
            });
            return res.status(200).json({
              status: 'success',
              message: 'Envelope signing completed',
              data: finalizeSigning
            }); 
        }
      }else{
      const envelope = await Envelope.findById(envelopeId);
        if (envelope) {
          await sendToRecipients(envelope._id,envelope.subject,envelope.message);
          // Log individual field signature
          await logActivity(envelopeId, "Envelope_Sent_to_next_recipient", "Recipient", {
            subject:envelope.subject,
            message:envelope.message
          });
          console.log('Envelope sent to next recipient');
          return res.status(200).json({
            status: 'success',
            message: 'Signature added with compliance'
          });
        }
    }
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
const addPowerFormSignerSignature = async (req, res) => {
}

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
    delete envelopeData.recipientIds;

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
const activityLogs = async (req, res) =>{
  try {
    const logs = await ActivityLogs.find({ envelopeId: req.params.envelopeId }).sort({ timestamp: -1 });
    res.status(200).json({ logs });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch activity logs' });
  }
}
const removeRecFromEnvelope = async (req, res) => {
  try {
    const { recipientId, envelopeId } = req.params;
    // Validate IDs
    if (!recipientId && !envelopeId) {
      return res.status(400).json({ message: "Invalid recipient or envelope ID." });
    }
    // Remove recipientId from Envelope's recipientIds array
    const envelope = await Envelope.findById(envelopeId);
    if (envelope) {
      envelope.recipientIds = envelope.recipientIds.filter(id => id.toString() !== recipientId);
      await envelope.save();
    //remove record from RecipientPermission
      await RecipientPermission.deleteMany({ recipientId: recipientId, envelopeId: envelopeId });
      return res.status(200).json({ message: "Recipient deleted succesfully..." });
    }
  } catch (error) {
    console.error("Error removing recipient from envelope:", error);
    res.status(500).json({ message: "Server error", error });
  }
};
const removeDocFromEnvelope = async (req, res) => {
  try {
    const { documentId, envelopeId } = req.params;
    // Validate IDs
    if (!documentId && !envelopeId) {
      return res.status(400).json({ message: "Invalid document or envelope ID." });
    }
    // Remove documentId from Envelope's documentIds array
    const envelope = await Envelope.findById(envelopeId);
    if (envelope) {
      envelope.documentIds = envelope.documentIds.filter(id => id.toString() !== documentId);
      await envelope.save();
      await Document.deleteOne({ _id: documentId });
      return res.status(200).json({ message: "Document deleted succesfully..." });
    }
  } catch (error) {
    console.error("Error removing document from envelope:", error);
    res.status(500).json({ message: "Server error", error });
  }
};
const getEnvSignFields = async (req, res) => {
  const { envelopeId } = req.params;
  try {
    const signatureFields = await SignatureField.find({ envelopeId: envelopeId });
    if (!signatureFields) {
      return res.status(404).json({ message: 'Envelope not found' });
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
const removeDocSignField = async (req, res) => {
  try {
    const { fieldId } = req.params;
    // Validate fieldId
    if (!fieldId) {
      return res.status(400).json({ message: "Invalid field ID." });
    }
    // Remove Signature Field by ID
    const field = await SignatureField.findByIdAndDelete(fieldId);
    if (field) {
      return res.status(200).json({ message: "Signature field deleted successfully." });
    } else {
      return res.status(404).json({ message: "Signature field not found." });
    }
  } catch (error) {
    console.error("Error removing signature field:", error);
    res.status(500).json({ message: "Server error", error });
  } 
}
const connectPowerForm = async (req, res) => {
  try {
    const { powerFormId, envelopeId, creatorSlotId, firstSigningSlotId, numberOfParties, slots  } = req.body;
    if (!powerFormId || !envelopeId) {
      return res.status(400).json({ message: "PowerForm ID and Envelope ID are required." });
    }
    const envelope = await Envelope.findById(envelopeId);
    if (!envelope) {
      return res.status(404).json({ message: "Envelope not found." });
    }
    envelope.powerFormId = powerFormId;
    envelope.isPowerForm = true;
    envelope.creatorSlotId = creatorSlotId;
    envelope.firstSigningSlotId = firstSigningSlotId;
    envelope.numberOfParties = numberOfParties;
    envelope.slots = slots; // Array of slot objects with details
    await envelope.save();
    return res.status(200).json({ message: "PowerForm connected to envelope successfully.", envelope });
  }
  catch (error) {
    console.error("Error connecting PowerForm to envelope:", error);
    return res.status(500).json({ message: "Server error", error });
  }
}
const getEnvelopePower = async (req, res) => {
  try{
    const { powerFormId, envelopeId } = req.params;
    const envelope = await Envelope.findOne({powerFormId:powerFormId, _id:envelopeId});
    if (!envelope) {
      return res.status(404).json({ message: "Envelope not found." });
    }
      return res.status(200).json({ message: "Power form envelope found", envelope });
  }catch (err){
    console.log(err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
}
const signerInitiate = async (req, res) =>{
  try{
    const { envelopeId, formId, data } = req.body;
    const envelope = await Envelope.findById(envelopeId);
    if (!envelope) {
      return res.status(404).json({ message: "Envelope not found." });
    }
    // create cycleId server-side
    const cycleId = new mongoose.Types.ObjectId();
    const allSlots = envelope.slots || [];
    const creatorSlot = allSlots.find(s => s.slotId === envelope.creatorSlotId);
    const firstSlot = allSlots.find(s => s.slotId === envelope.firstSigningSlotId);
    let slotRecords = [];
    allSlots.forEach(slot => {
      let role = "other";
      if (slot.slotId === creatorSlot.slotId) {
        role = "creator";
      }
      if (slot.slotId === firstSlot.slotId) {
        role = "firstSigner";
      }
      slotRecords.push({
        envelopeId: envelope._id,
        cycleId: cycleId,
        formId: formId,
        signerSlotId: slot.slotId,
        role: role,
        status: role === "firstSigner" ? "initiated" : "pending",
        signingOrder:slot.index,
        data: role === "firstSigner" ? data : {}, // attach only for first signer
      });
  });
      // Insert all slot records
      const createdSigners = await selfSigner.insertMany(slotRecords);
      // Find the one with role === "firstSigner"
      const initiatedSigner = createdSigners.find(s => s.role === "firstSigner");
    
    return res.status(201).json({message:'Signer Initiated', cycleId:cycleId, signerInitiate: initiatedSigner });
  }catch (err){
    console.log(err);
    return res.status(500).json({message: "Server error", error: err.message});
  }
}
const getSelfSigner = async (req, res) => {
  try {
    const { id } = req.params;  // get the id from URL params
    const selfsigner = await selfSigner.findById(id);

    if (!selfsigner) {
      return res.status(404).json({ message: "Self signer not found" });
    }

    // Successfully found
    return res.status(200).json(selfsigner);

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};
const getSigners = async (req, res) => {
  try {
    const { envelopeId } = req.params;
    const token = req.headers.authorization;

    // 1. Fetch signers for the envelope
    const signers = await selfSigner.find({ envelopeId });

    if (!signers || signers.length === 0) {
      return res.status(404).json({ message: 'No signers found' });
    }
    console.log("Fetched Signers:", signers);

    // 2. Map each signer to human-readable data
    const formattedSigners = await Promise.all(signers.map(async (signer) => {
      // Fetch fields for this form
      const response = await axios.get(
        `${process.env.TEMPLATE_URL}/api/template/get-form-details/${signer.formId}`,
        { headers: { Authorization: token } }
      );
      const form = response.data;

      // Map signer.data keys to field labels
      const mappedData = {};
      for (const field of form.fields) {
        const value = signer.data.get(field._id);
        if (value !== undefined) {
          mappedData[field.label.trim()] = value;
        }
      }

      return {
        signerId: signer._id,
        envelopeId: signer.envelopeId,
        cycleId: signer.cycleId,
        formId: signer.formId,
        data: mappedData,
        status: signer.status,
        signature: signer.signature,
        role: signer.role,
        authentication: signer.authentication,
        createdAt: signer.createdAt,
        updatedAt: signer.updatedAt
      };
    }));

    // 3. Group signers by cycle
    const cyclesMap = {};
    for (const signer of formattedSigners) {
      if (!cyclesMap[signer.cycleId]) {
        cyclesMap[signer.cycleId] = {
          cycleId: signer.cycleId,
          signers: []
        };
      }
      cyclesMap[signer.cycleId].signers.push(signer);
    }

    const cycles = Object.values(cyclesMap);

    return res.status(200).json({ cycles });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error", error: err.message });
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
  duplicateEnvelope,
  activityLogs,
  removeRecFromEnvelope,
  removeDocFromEnvelope,
  getEnvSignFields,
  removeDocSignField,
  connectPowerForm,
  getEnvelopePower,
  signerInitiate,
  getSelfSigner,
  getSigners
};