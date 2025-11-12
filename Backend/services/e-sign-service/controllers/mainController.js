const Envelope = require('../models/Envelope');
const SignatureField = require('../models/SignatureFields');
const Recipient = require('../models/Recipient');
const RecipientPermission = require('../models/RecipientPermission');
const axios = require('axios');
const sendEmail = require('../emails/sendEmail');
const {signRequestTemplate, signReminderTemplate, envelopeCompletedTemplate } = require('../emails/emailTemplates');
const mongoose = require('mongoose');
const SignatureFields = require('../models/SignatureFields');
const { signAndEmbed, initiateRecipientSignature, finalizeSigning, prepareDocumentForFinalSigning } = require('../services/digitalSignatureService');
const {logActivity} = require('../services/activityLogService');
const { ActivityLogs } = require('../models/ActivityLogs');
const Document = require('../models/Document');
const Cycle = require('../models/Cycle');
const { issueCertificate } = require('../services/pkiService');
const { generateAndStoreCompletionCertificate } = require('../services/certificateGenerator');
const fs = require('fs');
const selfSigner = require('../models/selfSigner');
const { sign } = require('crypto');
const { values } = require('pdf-lib');

const envelopesData = async (req, res) => {
  const userId = req?.user?.data?.id;
  const userType = req?.userType;
  const filterUserId = req.query.userId; // <-- new query param
  console.log(filterUserId);

  try {
    // Step 1: Build query
        let query = {};
        if (userType === 'admin') {
          // Admin can either see all envelopes or filter by a particular user
          if (filterUserId) {
            query.sender = filterUserId; // fetch only this user's envelopes
          }
          // else query = {} => fetch all envelopes
        } else {
          // Regular user sees only their own envelopes
          query.sender = userId;
        }

        // Fetch all envelopes with documents and recipients
        const envelopes = await Envelope.find(query)
          .sort({ createdAt: -1 }) // descending by createdAt
          .populate('documentIds') // documents
          .populate({
            path: 'recipientIds',          // recipients
            model: 'Recipient',            // explicit model
            select: 'name email UserId',
          })
          .lean(); // optional, makes it simple to work with

        // For each envelope, fetch only the permissions that belong to that envelope
        // This prevents permission records from other envelopes (same recipient) leaking into results
        for (const envelope of envelopes) {
          if (!envelope || !envelope._id || !Array.isArray(envelope.recipientIds)) continue;

          const envelopeRecipientIds = envelope.recipientIds.map(r => r._id);

          // Fetch permissions scoped to this envelope only
          const envelopePermissions = await RecipientPermission.find({
            envelopeId: envelope._id,
            recipientId: { $in: envelopeRecipientIds }
          }).select('recipientId envelopeId role order status authLevel');

          // Map permissions by recipientId for quick lookup
          const permMap = new Map();
          envelopePermissions.forEach(p => {
            if (p && p.recipientId) permMap.set(p.recipientId.toString(), p);
          });

          // Attach only the matching permission to each recipient for this envelope
          envelope.recipientIds = envelope.recipientIds.map(recipient => {
            const r = recipient || {};
            const rid = r._id ? r._id.toString() : null;
            const permission = rid ? permMap.get(rid) : null;
            // Keep original recipient fields and add permissions array (to keep downstream code unchanged)
            return {
              ...r,
              permissions: permission ? [permission] : []
            };
          });
        }

    if (!envelopes || envelopes.length === 0) {
      return res.status(404).json({ message: 'No envelopes found' });
    }
    // Step 3: Collect unique sender IDs
    const senderIds = [...new Set(envelopes.map(env => env.sender?.toString()).filter(Boolean))];

    // Step 4: Fetch all sender details in parallel
    const senderDetailsMap = {};

    await Promise.all(senderIds.map(async (senderId) => {
      try {
        const response = await axios.get(`${process.env.AUTH_URL}/api/user-details/${senderId}`, {
          headers: { Authorization: req.headers.authorization },
        });
        if (response.data?.data) {
          senderDetailsMap[senderId] = response.data.data;
        }
      } catch (err) {
        console.warn(`Failed to fetch sender details for ID ${senderId}:`, err.message);
      }
    }));

    // Step 5: Format the response
    const formattedEnvelopes = envelopes.map((envelope) => {
      const sender = senderDetailsMap[envelope.sender?.toString()] || {};
      return {
        id: envelope._id,
        subject: envelope.subject,
        status: envelope.status,
        priority: envelope.priority,
        createdAt: envelope.createdAt,
        sentAt: envelope.updatedAt,
        expiresAt: envelope.expirationDate,
        isPowerForm: envelope.isPowerForm,
        completionCertificate:envelope.completionCertificate,
        sender: {
          id: sender._id || envelope.sender,
          name: sender.fullname || 'Unknown',
          email: sender.email || 'N/A',
          role: sender.role || 'sender',
          organization: sender.organization || 'ITIO',
          avatar: sender.avatar || '',
        },
        signatureType: envelope.signatureType,
        documents: envelope.documentIds.map((doc) => ({
          id: doc._id,
          name: doc.fileName,
          size: doc.fileSize,
          type: doc.mimeType,
        })),
        recipients: envelope.recipientIds.map((recipient) => {
          const perm = (recipient && Array.isArray(recipient.permissions) && recipient.permissions[0]) || {};
          return {
            id: recipient._id,
            name: recipient.name,
            email: recipient.email,
            role: perm.role || 'signer',
            order: typeof perm.order === 'number' ? perm.order : 0,
            status: perm.status || 'pending',
            authentication: perm.authLevel || 'none',
          };
        }),
      };
    });

    // Step 6: Respond
    return res.status(200).json({
      status: 'success',
      data: formattedEnvelopes,
      totalEnvelopes: envelopes.length,
    });

  } catch (error) {
    console.error('Error fetching envelopes:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const envelopesDetail = async (req, res) => {
    const envelopeId = req.params.id;

    try {
        // Step 1: Fetch single envelope by ID
        const envelope = await Envelope.findById(envelopeId)
            .populate("documentIds")   // fetch docs
            .populate({
                        path: 'recipientIds',           // populate recipients
                        select: 'name email UserId signature',    // only global info
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
                authentication: perm.authLevel,
                signature: recipient.signature
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
    // 

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
  const { fieldId, signatureImageBase64, envelopeId, documentId, recipientId, certificateId, signerName,selfValue,cycleId } = req.body;

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
  // Check pending recipients and send email to next recipient
    if(selfValue !== "1"){ 
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
                  fieldRemmaning: false,
                  data: finalizeSigning
                }); 
            }
          }else{
          // Check if current user's signature field or anyother field is pending or not
          const pendingFields = await SignatureField.find({
            envelopeId: envelopeId,
            status: 'pending',
            recipientId:recipientId
          });
          if(pendingFields.length === 0){
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
                  message: 'Signature added with compliance',
                  fieldRemmaning: false
                });
              }
          }else{
            return res.status(200).json({
              status: 'success',
              message: 'Signature added with compliance',
              fieldRemmaning:true
            });
          }
        }
      } catch (err) {
        return res.status(500).json({ message: err.message });
      }
    }else if (selfValue == "1"){
      // Find Pending Signers
      const pendingSelfSigners = await Cycle.findById(cycleId)
                 .populate({ path: 'signers', match: { status: { $in: ['pending', 'initiated'] } } });
      
      if(!pendingSelfSigners || pendingSelfSigners.signers.length == 0){
              return res.status(200).json({
                status: 'success',
                message: 'Signature added with compliance'
              });
        // Preprare Document
        // Cryptographical Sign
        // BlockChain anchoring 
        // Generate Certificate
        // Send Email and Certificate
      }else{
        const signer = await selfSigner.findById(recipientId);
        const signerEmail = signer.data['Email'];
        console.log(signerEmail)
        const signLink = `${process.env.FRONTEND_URL}/e-sign/signer/${envelopeId}/${recipient._id}`;
        const html = signReminderTemplate(recipient.name,envelope.subject,envelope.message,signLink);
        return res.status(200).json({
          status: 'success',
          message: 'Signature added with compliance'
        });
        // Send Reminder E-Mail to pending recipients
        // await sendEmail(
        //     recipient.email,
        //   `Reminder: Action Required: Sign "${envelope.subject}"`,
        //   html
        // );
        //Notify Creater or Next Signer
        //Notify Signer 
      }
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
     console.log(envelopeId);
    const envelope = await Envelope.findOneAndDelete({_id:envelopeId});
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
const signerInitiate = async (req, res) => {
  try {
    const { envelopeId, formId, data } = req.body;
    const envelope = await Envelope.findById(envelopeId);
    if (!envelope) {
      return res.status(404).json({ message: "Envelope not found." });
    }

    // create cycleId server-side
    const allSlots = envelope.slots || [];
    const creatorSlot = allSlots.find(s => s.slotId === envelope.creatorSlotId);
    const firstSlot = allSlots.find(s => s.slotId === envelope.firstSigningSlotId);

    let slotRecords = [];

    for (const slot of allSlots) {
      let role = "other";
      if (slot.slotId === creatorSlot.slotId) role = "creator";
      if (slot.slotId === firstSlot.slotId) role = "firstSigner";

      let slotData = {};

      // Attach data based on role
      if (role === "firstSigner") {
        slotData = data || {};
      } else if (role === "creator") {
        // Fetch creator details from your auth service
        const creatorDetail = await axios.get(`${process.env.AUTH_URL}/api/user-details/${envelope.sender}`);
        console.log("Creator Details:", creatorDetail.data);
        slotData = {
          name: creatorDetail.data.data.fullname,
          email: creatorDetail.data.data.email,
        };
      }

      slotRecords.push({
        envelopeId: envelope._id,
        formId: formId,
        signerSlotId: slot.slotId,
        role: role,
        status: role === "firstSigner" ? "initiated" : "pending",
        signingOrder: slot.index,
        data: slotData,
      });
    }

    // Insert all slot records
    const createdSigners = await selfSigner.insertMany(slotRecords);
    // Create a cycle record
    const cycle = new Cycle({
      envelopeId: envelope._id,
      signers: createdSigners.map(s => s._id),
      status: "pending"
    });
    const savedCycle = await cycle.save();
    const cycleId = savedCycle._id;

    // Find the one with role === "firstSigner"
    const initiatedSigner = createdSigners.find(s => s.role === "firstSigner");

    return res.status(201).json({
      message: 'Signer Initiated',
      cycleId: cycleId,
      signerInitiate: initiatedSigner,
    });

  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};


const getSelfSigner = async (req, res) => {

    try {
    const { cycleId } = req.params;  // get the id from URL params

    // Find all cycles for the envelope and populate the signers
    const cycles = await Cycle.findById({ _id:cycleId })
      .populate({
        path: 'signers',
        model: 'SelfSigner',
      })
      .lean();

    if (!cycles || cycles.length === 0) {
      return res.status(404).json({ message: 'No cycles found' });
    }
    const selfSigner = cycles.signers;
    return res.status(200).json({ selfSigner });
  } catch (err) {
    console.error('getSigners error:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }

};
const getCycle = async (req, res) => {
  try {
    const { cycleId } = req.params;  // get the id from URL params
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error", error: err.message });
  } 
};
const getSigners = async (req, res) => {
  try {
    const { envelopeId } = req.params;

    // Find all cycles for the envelope and populate the signers
    const cycles = await Cycle.find({ envelopeId })
      .populate({
        path: 'signers',
        model: 'SelfSigner',
      })
      .lean();

    if (!cycles || cycles.length === 0) {
      return res.status(404).json({ message: 'No cycles found' });
    }

    return res.status(200).json({ cycles });
  } catch (err) {
    console.error('getSigners error:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};
const envelopeStats = async (req, res) => {
  try {
    const { userId, startDate, endDate } = req.query;

    if (!userId) {
      return res.status(400).json({ message: 'userId is required' });
    }

    // Build query
    const query = { sender: userId };

    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else if (startDate) {
      query.createdAt = { $gte: new Date(startDate) };
    } else if (endDate) {
      query.createdAt = { $lte: new Date(endDate) };
    }

    // Count envelopes sent by user
    const count = await Envelope.countDocuments(query);

    return res.status(200).json({
      sender: userId,
      envelopeCount: count
    });

  } catch (error) {
    console.error('Error fetching envelope stats:', error);
    return res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
};
const getAllEnvelopeStats = async (req, res) => {
  try {
    const { userType } = req.params;
    const id = req?.user?.data?.id
    const { startDate, endDate, range } = req.query;

    if (!userType ) {
      return res.status(400).json({ message: 'userType is required' });
    }
    let query = {};
    if (userType === 'user'){
      query = { sender: new mongoose.Types.ObjectId(id) };
    }else if(userType === 'admin'){
      // Admin can see all envelopes, no additional filter needed
      query = {};
    }
    // Count envelopes based on userType
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    const totalEnvelopes = await Envelope.countDocuments(query);
    const completedEnvelopes = await Envelope.countDocuments({ ...query, status: 'completed' });
    const pendingEnvelopes = await Envelope.countDocuments({ ...query, status: 'in-progress' });
    const expiredEnvelopes = await Envelope.countDocuments({ ...query, status: 'expired' });
   //Total Recipients (aggregate from Envelope)
    const recipientAgg = await Envelope.aggregate([
      { $match: query },
      { 
        $group: { 
          _id: null, 
          totalRecipients: { $sum: { $size: { $ifNull: ["$recipientIds", []] } } } 
        } 
      }
    ]);
    const totalRecipients = recipientAgg.length ? recipientAgg[0].totalRecipients : 0;

    return  res.status(200).json({
      totalEnvelopes,
      completedEnvelopes,
      pendingEnvelopes,
      expiredEnvelopes,
      totalRecipients
    });
  } catch (error) {
    console.error('Error fetching envelope stats:', error);
    throw new Error('Internal Server Error');
  }
};
const getAllRecipients = async (req, res) =>{
  const recipients = await Recipient.find();
  return res.status(200).json({
    recipients
  })
}
const saveTextField = async (req, res) => {
  try {
    const { fieldId, textInputValue, envelopeID, documentId } = req.body;
    console.log("Envelope Id: ", envelopeID);
    console.log("Document Id: ", documentId);

    // Validate input
    if (!fieldId || !textInputValue || !envelopeID || !documentId) {
      return res.status(400).json({ message: 'All parameters are required' });
    }

    // Find and update the current field
    const field = await SignatureField.findById(fieldId);
    if (!field) return res.status(404).json({ message: 'Field not found' });

    field.signature = textInputValue;
    field.status = 'completed';
    await field.save();

    // Check for any pending fields
    const pendingFields = await SignatureField.find({
      envelopeId: envelopeID,
      documentId: documentId,
      status: 'pending'
    });

    if (pendingFields.length === 0) {
      console.log('All fields for this document are completed.');

      // Get all fields and check if any signature fields exist
      const allFields = await SignatureField.find({ envelopeId: envelopeID, documentId: documentId });
      const hasSignatureFields = allFields.some(f => f.type === 'signature');

      if (!hasSignatureFields) {
        console.log('No signature fields found, embedding text fields into PDF.');

        // Load the document
        const document = await Document.findById(documentId);
        if (!document || !document.filePath) {
          return res.status(404).json({ message: 'Document not found or missing file path' });
        }

        const pdfPath = path.resolve(document.filePath);
        const pdfBytes = fs.readFileSync(pdfPath);
        const pdfDoc = await PDFDocument.load(pdfBytes);
        const pages = pdfDoc.getPages();
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

        // Draw each non-signature field
        allFields.forEach(f => {
          if (f.type !== 'signature' && f.page && f.page > 0 && f.page <= pages.length) {
            const page = pages[f.page - 1];
            if (!page) return;

            const { width: pageWidth, height: pageHeight } = page.getSize();
            const x = f.x || 0;
            const y = pageHeight - f.y - f.height; // invert Y

            // Draw text inside the field
            page.drawText(f.signature || '', {
              x: x + 2, // small padding
              y: y + 2,
              size: 12,
              font,
              color: rgb(0, 0, 0),
            });

            console.log(`✅ Drawn "${f.signature}" at (${x}, ${y}) on page ${f.page}`);
          } else {
            console.warn(`Skipping field ${f._id}: invalid page or type`);
          }
        });

        // Save updated PDF
        const updatedPdfBytes = await pdfDoc.save();
        const outputPath = path.resolve(`uploads/filled_${documentId}.pdf`);
        fs.writeFileSync(outputPath, updatedPdfBytes);

        // Update document record
        document.signedFilePath = outputPath;
        document.signedFileName = `filled_${document.fileName}`;
        await document.save();
        const envelope = await Envelope.findById(envelopeID);
        envelope.status = 'completed';
        await envelope.save();
        // Send Email to all recipients with updated PDF
        const signedPdfBuffer = fs.readFileSync(outputPath);
        const signedPdfFilename = `signed-document-${envelopeID}.pdf`;
        const certBuffer = null;
        const certFilename = null;

        // Send updated PDF to all recipients

        await sendToAllRecipients(envelope,certBuffer,certFilename,signedPdfBuffer,signedPdfFilename);

        console.log(`PDF updated successfully: ${outputPath}`);
      }
    }

    return res.status(200).json({ message: 'Field saved successfully' });
  } catch (err) {
    console.error('saveTextField error:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};
const saveNonSignatureField = async (req, res) => {
  const {envelopeID, recipientId,fields} = req.body;
  const nonSignatureField = await SignatureField.findById(fields.fieldId);
  console.log(nonSignatureField);
  if(!nonSignatureField){
    return res.status(404).json({message: 'Field not found'});
  }
  nonSignatureField.signature = fields.value;
  nonSignatureField.status = 'completed';
  await nonSignatureField.save();
  return res.status(200).json({message: 'Field saved succesfully'});
}
const saveupdateSignature = async (req, res) =>{
  const {recipientId, Signature} = req.body;
  if(!recipientId && !Signature){
    return res.status(401).json({message: 'Recipient and Signature is required.'});
  }
  const RecipientUpdate = await Recipient.findById(recipientId);
  RecipientUpdate.signature = Signature;
  await RecipientUpdate.save();
  return res.status(200).json({message: 'Signature saved succesfully'})
}

// Export functions
module.exports = {
  getAllRecipients,
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
  getSigners,
  envelopeStats,
  getAllEnvelopeStats,
  saveTextField,
  saveNonSignatureField,
  saveupdateSignature
};