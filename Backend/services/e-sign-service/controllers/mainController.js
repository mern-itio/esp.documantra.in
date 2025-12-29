const Envelope = require('../models/Envelope');
const SignatureField = require('../models/SignatureFields');
const Recipient = require('../models/Recipient');
const RecipientPermission = require('../models/RecipientPermission');
const axios = require('axios');
const sendEmail = require('../emails/sendEmail');
const { signRequestTemplate, signReminderTemplate, envelopeCompletedTemplate } = require('../emails/emailTemplates');
const mongoose = require('mongoose');
const SignatureFields = require('../models/SignatureFields');
const { signAndEmbed, initiateRecipientSignature, finalizeSigning, prepareDocumentForFinalSigning } = require('../services/digitalSignatureService');
const { logActivity } = require('../services/activityLogService');
const { ActivityLogs } = require('../models/ActivityLogs');
const Document = require('../models/Document');
const Cycle = require('../models/Cycle');
const { issueCertificate } = require('../services/pkiService');
const { generateAndStoreCompletionCertificate } = require('../services/certificateGenerator');
const fs = require('fs');
const selfSigner = require('../models/selfSigner');
const { sign } = require('crypto');
const { values } = require('pdf-lib');
const Notification = require('../models/Notification');

const envelopesData = async (req, res) => {
  const userId = req?.user?.data?.id;
  const userType = req?.userType;
  const filterUserId = req.query.userId; // optional admin filter

  try {
    // Determine target user (whose "sent" or "received" we're looking at)
    const targetUserId = (userType === 'admin' && filterUserId) ? filterUserId : userId;

    // ----- SENT envelopes query (keep original admin behavior) -----
    let sentQuery = {};
    if (userType === 'admin') {
      if (filterUserId) {
        sentQuery.sender = filterUserId; // fetch only this user's sent envelopes
      }
      // else admin: no sender filter => all envelopes (sentQuery = {})
    } else {
      // non-admin: only their own sent envelopes
      sentQuery.sender = userId;
    }

    const sentEnvelopes = await Envelope.find(sentQuery)
      .sort({ createdAt: -1 })
      .populate('documentIds')
      .populate({
        path: 'recipientIds',
        model: 'Recipient',
        select: 'name email UserId',
      })
      .lean();

    // ----- Find recipient records for the target user (to get recipientIds for "received") -----
    const userRecipients = await Recipient.find({ UserId: targetUserId }).select('_id').lean();
    const userRecipientIds = (userRecipients || []).map(r => r._id);
    // If user has recipient entries, find permissions that reference them
    let receivedEnvelopeIds = [];
    if (userRecipientIds.length > 0) {
      const permsForUser = await RecipientPermission.find({
        recipientId: { $in: userRecipientIds }
      }).select('envelopeId recipientId role order status authLevel').lean();

      receivedEnvelopeIds = [...new Set(permsForUser.map(p => p.envelopeId && p.envelopeId.toString()).filter(Boolean))];
    }

    // Fetch envelopes that were shared/received by the target user
    let receivedEnvelopes = [];
    if (receivedEnvelopeIds.length > 0) {
      receivedEnvelopes = await Envelope.find({ _id: { $in: receivedEnvelopeIds } })
        .sort({ createdAt: -1 })
        .populate('documentIds')
        .populate({
          path: 'recipientIds',
          model: 'Recipient',
          select: 'name email UserId',
        })
        .lean();
    }

    // Combine sent and received, ensuring uniqueness by _id
    const envelopesMap = new Map();
    const allEnvelopesList = [...(sentEnvelopes || []), ...(receivedEnvelopes || [])];
    for (const env of allEnvelopesList) {
      if (!env || !env._id) continue;
      envelopesMap.set(env._id.toString(), env);
    }
    const envelopes = Array.from(envelopesMap.values());

    if (!envelopes || envelopes.length === 0) {
      return res.status(404).json({ message: 'No envelopes found' });
    }

    // ----- Fetch all permissions for these envelopes in a single query -----
    const allEnvelopeIds = envelopes.map(e => e._id);
    const allPermissions = await RecipientPermission.find({
      envelopeId: { $in: allEnvelopeIds }
    }).select('recipientId envelopeId role order status authLevel').lean();

    // Build map: envelopeId -> (recipientId -> permission)
    const permByEnvelope = new Map();
    for (const p of allPermissions) {
      const eid = p.envelopeId?.toString();
      const rid = p.recipientId?.toString();
      if (!eid || !rid) continue;
      if (!permByEnvelope.has(eid)) permByEnvelope.set(eid, new Map());
      permByEnvelope.get(eid).set(rid, p);
    }

    // ----- Collect unique sender IDs to fetch user details -----
    const senderIds = [...new Set(envelopes.map(env => env.sender?.toString()).filter(Boolean))];

    // Fetch sender details in parallel (like before)
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

    // ----- Format envelopes and attachments -----
    const formattedEnvelopes = envelopes.map((envelope) => {
      const eid = envelope._id.toString();
      const sender = senderDetailsMap[envelope.sender?.toString()] || {};

      // Determine direction relative to targetUserId
      const isSender = envelope.sender && envelope.sender.toString() === targetUserId;
      // isReceiver: check if any recipient in envelope has UserId === targetUserId
      const isReceiver = Array.isArray(envelope.recipientIds) && envelope.recipientIds.some(r => r && r.UserId && r.UserId.toString() === targetUserId);


      let direction = 'Sent';
      if (isSender && isReceiver) direction = 'sent_and_received';
      else if (isReceiver && !isSender) direction = 'Received';

      // Attach permissions for recipients from permission map (scoped to this envelope)
      const envelopePermMap = permByEnvelope.get(eid) || new Map();
      const recipients = (envelope.recipientIds || []).map((recipient) => {
        const r = recipient || {};
        const rid = r._id ? r._id.toString() : null;
        const perm = rid ? envelopePermMap.get(rid) : null;
        // convert authLevel (backward compatibility)
        let authentication = 'none';
        if (perm && perm.authLevel) {
          if (Array.isArray(perm.authLevel)) {
            authentication = perm.authLevel.length > 0 ? JSON.stringify(perm.authLevel) : 'none';
          } else {
            authentication = JSON.stringify([perm.authLevel]);
          }
        }
        return {
          id: recipient._id,
          name: recipient.name,
          email: recipient.email,
          role: perm?.role || 'signer',
          order: typeof perm?.order === 'number' ? perm.order : 0,
          status: perm?.status || 'pending',
          authentication,
        };
      });

      return {
        id: envelope._id,
        name: envelope.name,
        subject: envelope.subject,
        status: envelope.status,
        isScheduled: envelope.isScheduled,
        scheduledDate: envelope.scheduledDate,
        scheduledTime: envelope.scheduledTime,
        priority: envelope.priority,
        createdAt: envelope.createdAt,
        sentAt: envelope.updatedAt,
        expiresAt: envelope.expirationDate,
        isPowerForm: envelope.isPowerForm,
        completionCertificate: envelope.completionCertificate,
        // sender info (fallbacks preserved)
        sender: {
          id: sender._id || envelope.sender,
          name: sender.fullname || 'Unknown',
          email: sender.email || 'N/A',
          role: sender.role || 'sender',
          organization: sender.organization || 'ITIO',
          avatar: sender.avatar || '',
        },
        signatureType: envelope.signatureType,
        documents: (envelope.documentIds || []).map((doc) => ({
          id: doc._id,
          name: doc.fileName,
          size: doc.fileSize,
          type: doc.mimeType,
        })),
        recipients,
        direction, // NEW: 'sent' | 'received' | 'sent_and_received'
      };
    });

    // Return combined result
    return res.status(200).json({
      status: 'success',
      data: formattedEnvelopes,
      totalEnvelopes: formattedEnvelopes.length,
    });

  } catch (error) {
    console.error('Error fetching envelopes:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};


const envelopesDetail = async (req, res) => {
  const envelopeId = req.params.id;
  const userId = req?.user?.data?.id;

  try {
    // Step 1: Fetch single envelope by ID
    const envelope = await Envelope.findById(envelopeId)
      .populate("documentIds")   // fetch docs
      .populate({
        path: 'recipientIds',           // populate recipients
        select: 'name email UserId signature initials',    // only global info
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
    let currentRecipient = envelope.recipientIds.find(r => {
      return String(r.UserId) === String(userId);
    });
    let direction = '';
    const senderId = envelope.sender;
    if (senderId == userId) {
      direction = 'Sent';
    } else {
      direction = 'Received';
    }

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
      name: envelope.name,
      subject: envelope.subject,
      message: envelope.message,
      envelopetype: envelope.envelopetype,
      status: envelope.status,
      priority: envelope.priority,
      createdAt: envelope.createdAt,
      sentAt: envelope.updatedAt,
      expiresAt: envelope.expirationDate,
      isPowerForm: envelope.isPowerForm,
      powerFormId: envelope.powerFormId,
      direction: direction,
      currRecipient: currentRecipient?._id || null,
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
          initials: recipient.initials || '',
          role: perm.role,
          order: perm.order,
          status: perm.status,
          authentication: (() => {
            // Handle authLevel: can be array (new) or single value (old data for backward compatibility)
            if (!perm.authLevel) return null;
            if (Array.isArray(perm.authLevel)) {
              return perm.authLevel.length > 0 ? JSON.stringify(perm.authLevel) : null;
            }
            // Old format: single ObjectId - convert to array format for frontend
            return JSON.stringify([perm.authLevel]);
          })(),
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
  console.log("Document ID:", documentId);
  const isSelf = req.params.mode === "self";
  console.log("isSelf:", isSelf);
  try {
    // 1. Fetch signature fields for the document
    const signatureFields = await SignatureField.find({ documentId });
    if (!signatureFields) {
      return res.status(404).json({ message: "Document not found" });
    }

    // Normal mode returns
    if (!isSelf) {
      return res.status(200).json({
        status: "success",
        signatureFields
      });
    }

    // Self mode must receive envelopeId & cycleId
    const { envelopeId, cycleId } = req.query;
    console.log("envelopeId:", envelopeId, "cycleId:", cycleId);
    if (!envelopeId || !cycleId) {
      return res.status(400).json({
        message: "envelopeId and cycleId are required in self mode"
      });
    }

    // 2. Fetch cycle
    const cycle = await Cycle.findOne({ _id: cycleId, envelopeId });
    console.log(cycle);
    if (!cycle) {
      return res.status(404).json({
        message: "Cycle not found or does not belong to this envelope"
      });
    }

    // 3. Fetch only SelfSigners listed in cycle.signers[]
    const selfSigners = await selfSigner.find({
      _id: { $in: cycle.signers }
    });

    if (selfSigners.length === 0) {
      return res.status(200).json({
        status: "success",
        signatureFields, // no override
      });
    }

    // 4. Merge all their nonSignatureFields into a map
    const nonSigMap = new Map();

    selfSigners.forEach((signer) => {
      signer.nonSignatureFields.forEach((field) => {
        if (field.value) {
          nonSigMap.set(String(field.fieldId), field.value);
        }
      });
    });

    // 5. Apply overrides
    const updatedFields = signatureFields.map((field) => {
      const id = String(field._id);

      if (nonSigMap.has(id)) {
        const obj = field.toObject();
        obj.signature = nonSigMap.get(id);
        return obj;
      }

      return field;
    });

    // 6. Final Response
    return res.status(200).json({
      status: "success",
      signatureFields: updatedFields
    });

  } catch (error) {
    console.error("Error fetching signature fields:", error);
    return res.status(500).json({ message: "Internal server error" });
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
      await sendToRecipients(envelope._id, envelope.subject, envelope.message);
      return res.status(200).send("Envelope sent to recipients");
    }
  } catch (error) {
    console.error("Error sending envelope:", error);
    return res.status(500).send("Server error");
  }

}

// Schedule envelope to be sent at a specific date/time
const scheduleEnvelope = async (req, res) => {
  try {
    const { envelopeId } = req.params;
    const { scheduledDate, scheduledTime } = req.body;

    if (!scheduledDate) {
      return res.status(400).json({ message: "Scheduled date is required" });
    }

    const envelope = await Envelope.findById(envelopeId);
    if (!envelope) {
      return res.status(404).json({ message: "Envelope not found" });
    }

    if (envelope.status !== 'draft') {
      return res.status(400).json({ message: "Only draft envelopes can be scheduled" });
    }

    // Combine date and time if time is provided
    let scheduledDateTime = new Date(scheduledDate);
    if (scheduledTime) {
      const [hours, minutes] = scheduledTime.split(':');
      scheduledDateTime.setHours(parseInt(hours) || 0, parseInt(minutes) || 0, 0, 0);
    } else {
      // If no time provided, set to start of day
      scheduledDateTime.setHours(0, 0, 0, 0);
    }

    // Validate that scheduled date is in the future
    if (scheduledDateTime <= new Date()) {
      return res.status(400).json({ message: "Scheduled date must be in the future" });
    }

    envelope.isScheduled = true;
    envelope.scheduledDate = scheduledDateTime;
    envelope.scheduledTime = scheduledTime || null;
    await envelope.save();

    return res.status(200).json({
      message: "Envelope scheduled successfully",
      scheduledDate: envelope.scheduledDate,
      isScheduled: true
    });
  } catch (error) {
    console.error("Error scheduling envelope:", error);
    return res.status(500).json({ message: "Server error" });
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
  try {
    const AllRecipients = await RecipientPermission.find({
      envelopeId: envelope._id
    }).populate('recipientId');
    console.log("AllRecipients:", AllRecipients);
    for (const Recipient of AllRecipients) {
      if (Recipient) {
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

  } catch (error) {
    console.error("Error sending to all recipients:", error);
    return { error: "Internal error while sending recipient email" };
  }
}


const addSignature = async (req, res) => {
  console.log("Add Signature Started...");
  const { fieldId, signatureImageBase64, envelopeId, documentId, recipientId, certificateId, signerName,selfValue,cycleId, initials } = req.body;

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
  
  // Save initials if provided
  if(initials !== undefined && initials !== null && initials.trim() !== ''){
    if(selfValue === "1" || selfValue === 1){
      // Self-signer mode
      const selfSignerUpdate = await selfSigner.findById(recipientId);
      if(selfSignerUpdate){
        selfSignerUpdate.initials = initials.trim().toUpperCase();
        await selfSignerUpdate.save();
      }
    } else {
      // Recipient mode
      const RecipientUpdate = await Recipient.findById(recipientId);
      if(RecipientUpdate){
        RecipientUpdate.initials = initials.trim().toUpperCase();
        await RecipientUpdate.save();
      }
    }
  }
  
  // Check pending recipients and send email to next recipient
    if(selfValue !== "1" && selfValue !== 1){ 
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
                
                // Create notification for envelope creator when envelope is completed
                try {
                  const recipient = await Recipient.findById(recipientId);
                  if (recipient && envelope.sender) {
                    await Notification.create({
                      userId: envelope.sender.toString(),
                      envelopeId: envelope._id,
                      recipientId: recipient._id,
                      recipientName: recipient.name,
                      envelopeSubject: envelope.subject,
                      type: 'envelope_completed',
                      message: `All recipients have signed "${envelope.subject}"`
                    });
                  }
                } catch (notifErr) {
                  console.error('Error creating notification:', notifErr);
                }
                
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
            // Recipient has completed all their signature fields
            const envelope = await Envelope.findById(envelopeId);
            if (envelope) {
              // Create notification for envelope creator when recipient completes signing
              try {
                const recipient = await Recipient.findById(recipientId);
                if (recipient && envelope.sender) {
                  await Notification.create({
                    userId: envelope.sender.toString(),
                    envelopeId: envelope._id,
                    recipientId: recipient._id,
                    recipientName: recipient.name,
                    envelopeSubject: envelope.subject,
                    type: 'signature_completed',
                    message: `${recipient.name} has signed "${envelope.subject}"`
                  });
                }
              } catch (notifErr) {
                console.error('Error creating notification:', notifErr);
              }
              
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
    }else if (selfValue === "1" || selfValue === 1){
      // Find Pending Signers
      const pendingSelfSigners = await Cycle.findById(cycleId)
                 .populate({ path: 'signers', match: { status: { $in: ['pending', 'initiated'] } } });
      
      if(!pendingSelfSigners || pendingSelfSigners.signers.length == 0){
        // All signers have completed, prepare document and finalize
        const envelope = await Envelope.findById(envelopeId);
        if (envelope) {
          // Preprare Document
          // Cryptographical Sign
          // BlockChain anchoring 
          // Generate Certificate
          // Send Email and Certificate
        }
        return res.status(200).json({
          status: 'success',
          message: 'Signature added with compliance',
          fieldRemmaning: false
        });
      }else{
        // Get the current signer and envelope
        const currentSigner = await selfSigner.findById(recipientId);
        const envelope = await Envelope.findById(envelopeId);
        
        if (!currentSigner || !envelope) {
          return res.status(404).json({ message: 'Signer or envelope not found' });
        }
        // 1. Find pending signature fields
        const pendingSignatureField = currentSigner.signatureFields.find(
          f => f.state == 'pending'
        );

        // 2. Find pending non-signature fields
        const pendingNonSignatureField = currentSigner.nonSignatureFields.find(
          f => f.state == 'pending' || f.value === null
        );

        // 3. If ANY pending field exists → redirect back to signing page
        if (pendingSignatureField || pendingNonSignatureField) {
          console.log('Pending fields remain for current self-signer');
          console.log(pendingSignatureField);
          console.log(pendingNonSignatureField);
          // Prepare Email to next self-signer in cycle
          return res.status(200).json({
              status: 'success',
              message: 'Signature added with compliance',
              fieldRemmaning:true
            });
        }else{
            // Find next pending self-signer
            const nextSigner = pendingSelfSigners?.signers?.find(
              s => s.status === 'pending'
            );
            if (!nextSigner) {
              console.log('No next self-signer found');
              return;
            }
            const nextSignerEmail = nextSigner?.data?.email;
            const nextSignerName = nextSigner?.data?.name;
            if (!nextSignerEmail) {
              console.log('Next signer email missing');
              return;
            }
            const nextSignerSignatureLink =
              `${process.env.FRONTEND_URL}/e-sign/signer/${envelopeId}/${nextSigner._id}/${cycleId}/?self=1`;
            const nextSignerSubject =
              `Action Required: ${currentSigner?.data?.name} has completed their signing`;
            const nextSignerMessage =
              'The previous signer has completed their part. Please proceed to sign the document.';
            const html = signRequestTemplate(
              nextSignerName,
              nextSignerSubject,
              nextSignerMessage,
              nextSignerSignatureLink
            );
            await sendEmail(
              nextSignerEmail,
              nextSignerSubject,
              html
            );

            return res.status(200).json({
              status: 'success',
              message: 'Signature added with compliance',
              fieldRemmaning:false
            });
          // All fields completed for this signer
        }
      }
    }
};

const getRecipientByEmail = async (req, res) => {
  const { email } = req.params;
  try {
    const userId = req.user?.data?.id;
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    // Check if recipient exists for this user
    const existingRecipient = await Recipient.findOne({ email, UserId: userId });
    if (existingRecipient) {
      return res.status(200).json({
        recipient: existingRecipient
      });
    } else {
      return res.status(404).json({
        message: "Recipient not found..."
      })
    }

  } catch (err) {
    console.log(`Error in fetching recipient by Email: ${err}`)
    return res.status(500).json({ message: 'Failed to fetch recipient' });
  }

}

const envelopeArchive = async (req, res) => {
  try {
    const envelopeId = req.params.envelopeId;
    const envelope = await Envelope.findById(envelopeId);
    if (envelope) {
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
    const envelope = await Envelope.findById(envelopeId);
    if (envelope) {
      // Update the status to "deleted" (soft delete)
      envelope.status = "deleted";
      await envelope.save();
      return res.status(200).json({ message: "Envelope deleted successfully", envelope });
    } else {
      return res.status(404).json({ message: "Envelope not found" });
    }
  } catch (error) {
    console.error("Error deleting envelope:", error);
    return res.status(500).json({ message: "Failed to delete envelope", error: error.message });
  }
}

const envelopePermanentDelete = async (req, res) => {
  try {
    const envelopeId = req.params.envelopeId;
    // Validate envelopeId is a valid ObjectId
    console.log('Permanently deleting envelope:', envelopeId);
    const envelope = await Envelope.findOneAndDelete({ _id: envelopeId });
    if (envelope) {
      return res.status(200).json({ message: "Envelope permanently deleted successfully", envelope });
    } else {
      return res.status(404).json({ message: "Envelope not found" });
    }
  } catch (error) {
    console.error("Error permanently deleting envelope:", error);
    return res.status(500).json({ message: "Failed to permanently delete envelope", error: error.message });
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
        const html = signReminderTemplate(recipient.name, envelope.subject, envelope.message, signLink);
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
const activityLogs = async (req, res) => {
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
    const { envelopeId, creatorSlotId, firstSigningSlotId, numberOfParties, slots } = req.body;
    if (!envelopeId) {
      return res.status(400).json({ message: "PowerForm ID and Envelope ID are required." });
    }
    const envelope = await Envelope.findById(envelopeId);
    if (!envelope) {
      return res.status(404).json({ message: "Envelope not found." });
    }
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
  try {
    const { powerFormId, envelopeId } = req.params;
    const envelope = await Envelope.findOne({ powerFormId: powerFormId, _id: envelopeId });
    if (!envelope) {
      return res.status(404).json({ message: "Envelope not found." });
    }
    return res.status(200).json({ message: "Power form envelope found", envelope });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
}
const signerInitiate = async (req, res) => {
  try {
    const { envelopeId, data } = req.body;
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
        slotData = {
          name: creatorDetail.data.data.fullname,
          email: creatorDetail.data.data.email,
        };
      }
      // Prepare Signature Fields for each slot
      const fields = await SignatureField.find({ envelopeId: envelope._id, slotId: slot.slotId, type: "signature" });
      // Map them into the lighter structure for SelfSigner
      const signatureFieldsForSigner = fields.map(f => ({
        fieldId: f._id,
        state: f.status = "pending"
      }));
      const nonSignatureFields = await SignatureField.find({ envelopeId: envelope._id, slotId: slot.slotId, type: { $ne: "signature" } });
      // Map non-signature fields into the structure for SelfSigner
      const nonSignatureFieldsForSigner = nonSignatureFields.map(f => ({
        fieldId: f._id,
        state: f.status = "pending"
      }));
      slotRecords.push({
        envelopeId: envelope._id,
        signerSlotId: slot.slotId,
        role: role,
        status: role === "firstSigner" ? "initiated" : "pending",
        signingOrder: slot.index,
        data: slotData,
        signatureFields: signatureFieldsForSigner,
        nonSignatureFields: nonSignatureFieldsForSigner
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
    const cycles = await Cycle.findById({ _id: cycleId })
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

    if (!userType) {
      return res.status(400).json({ message: 'userType is required' });
    }
    let query = {};
    if (userType === 'user') {
      query = { sender: new mongoose.Types.ObjectId(id) };
    } else if (userType === 'admin') {
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

    return res.status(200).json({
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
const getAllRecipients = async (req, res) => {
  try {
    const userId = req.user?.data?.id;
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    const recipients = await Recipient.find({ UserId: userId }).sort({ createdAt: -1 });
    return res.status(200).json({
      recipients
    });
  } catch (err) {
    console.error('getAllRecipients error', err);
    return res.status(500).json({ message: 'Failed to fetch recipients' });
  }
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

        await sendToAllRecipients(envelope, certBuffer, certFilename, signedPdfBuffer, signedPdfFilename);

        console.log(`PDF updated successfully: ${outputPath}`);
      }
    }

    return res.status(200).json({ message: 'Field saved successfully' });
  } catch (err) {
    console.error('saveTextField error:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};
// Get notifications for the logged-in user
const getNotifications = async (req, res) => {
  try {
    const userId = req?.user?.data?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { limit = 50, unreadOnly = false } = req.query;
    const query = { userId: userId.toString() };

    if (unreadOnly === 'true') {
      query.isRead = false;
    }

    const notifications = await Notification.find(query)
      .populate('envelopeId', 'subject status')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    const unreadCount = await Notification.countDocuments({
      userId: userId.toString(),
      isRead: false
    });

    return res.status(200).json({
      status: 'success',
      data: {
        notifications,
        unreadCount
      }
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Mark a notification as read
const markNotificationAsRead = async (req, res) => {
  try {
    const userId = req?.user?.data?.id;
    const { notificationId } = req.params;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const notification = await Notification.findOne({
      _id: notificationId,
      userId: userId.toString()
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();

    return res.status(200).json({
      status: 'success',
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Mark all notifications as read
const markAllNotificationsAsRead = async (req, res) => {
  try {
    const userId = req?.user?.data?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    await Notification.updateMany(
      { userId: userId.toString(), isRead: false },
      { isRead: true, readAt: new Date() }
    );

    return res.status(200).json({
      status: 'success',
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const saveNonSignatureField = async (req, res) => {
  const { envelopeID, recipientId, fields, selfValue, cycleId } = req.body;
  const nonSignatureField = await SignatureField.findById(fields.fieldId);
  console.log(nonSignatureField);
  if (!nonSignatureField) {
    return res.status(404).json({ message: 'Field not found' });
  }
  nonSignatureField.signature = fields.value;
  nonSignatureField.status = 'completed';
  await nonSignatureField.save();

  // Handle self-signer mode: update selfSigner's nonSignatureFields array
  if (selfValue === "1" || selfValue === 1) {
    if (!cycleId || !recipientId) {
      return res.status(400).json({ message: 'cycleId and recipientId are required for self-signer mode' });
    }

    const selfSignerUpdate = await selfSigner.findById(recipientId);
    if (!selfSignerUpdate) {
      return res.status(404).json({ message: 'SelfSigner not found' });
    }

    // Find or create entry in nonSignatureFields array
    const existingFieldEntry = selfSignerUpdate.nonSignatureFields.find(
      (nf) => nf.fieldId && nf.fieldId.toString() === fields.fieldId.toString()
    );

    if (existingFieldEntry) {
      existingFieldEntry.value = fields.value;
      existingFieldEntry.state = 'submited';
      existingFieldEntry.submitedAt = new Date();
    } else {
      selfSignerUpdate.nonSignatureFields.push({
        fieldId: fields.fieldId,
        value: fields.value,
        state: 'submited',
        submitedAt: new Date()
      });
    }

    await selfSignerUpdate.save();
  }

  return res.status(200).json({ message: 'Field saved succesfully' });
}
const saveupdateSignature = async (req, res) => {
  const { recipientId, Signature, mode, envelopeId, selfValue, initials } = req.body;
  if (!recipientId && !Signature) {
    return res.status(401).json({ message: 'Recipient and Signature is required.' });
  }

  // Handle self-signer mode
  if (selfValue === "1" || selfValue === 1) {
    const selfSignerUpdate = await selfSigner.findById(recipientId);
    if (!selfSignerUpdate) {
      return res.status(404).json({ message: 'SelfSigner not found.' });
    }

    // Update signature in selfSigner
    selfSignerUpdate.signature = Signature;
    // Update initials if provided
    if (initials !== undefined && initials !== null && initials.trim() !== '') {
      selfSignerUpdate.initials = initials.trim().toUpperCase();
    }
    await selfSignerUpdate.save();

    if (mode === 'update') {
      // Find all signature fields that belong to this selfSigner (via slotId)
      const signatureFields = await SignatureField.find({
        envelopeId: envelopeId,
        slotId: selfSignerUpdate.signerSlotId,
        type: 'signature',
        signature: { $exists: true, $nin: ['', null] }
      });

      // Update signatureFields array in selfSigner
      const updatedSignatureFields = [];
      for (const field of signatureFields) {
        // Update the field signature
        field.signature = Signature;
        await field.save();

        // Update or add entry in selfSigner's signatureFields array
        const existingFieldEntry = selfSignerUpdate.signatureFields.find(
          (sf) => sf.fieldId && sf.fieldId.toString() === field._id.toString()
        );

        if (existingFieldEntry) {
          existingFieldEntry.state = 'signed';
          existingFieldEntry.signedAt = new Date();
        } else {
          selfSignerUpdate.signatureFields.push({
            fieldId: field._id,
            state: 'signed',
            signedAt: new Date()
          });
        }
        updatedSignatureFields.push(field);
      }

      await selfSignerUpdate.save();

      // Pass field id to front end to re render the signature fields
      return res.status(200).json({
        message: 'Signature updated succesfully',
        mode: mode,
        signatureFields: updatedSignatureFields
      });
    }

    return res.status(200).json({ message: 'Signature saved succesfully', mode: mode });
  }

  // Regular recipient mode
  const RecipientUpdate = await Recipient.findById(recipientId);
  if (!RecipientUpdate) {
    return res.status(404).json({ message: 'Recipient not found.' });
  }
  RecipientUpdate.signature = Signature;
  // Update initials if provided
  if (initials !== undefined && initials !== null && initials.trim() !== '') {
    RecipientUpdate.initials = initials.trim().toUpperCase();
  }
  await RecipientUpdate.save();
  if (mode === 'update') {
    //find all signature fields and update existing signature fields
    const signatureFields = await SignatureField.find({
      envelopeId: envelopeId,
      recipientId: recipientId,
      type: 'signature',
      signature: { $exists: true, $nin: ['', null] } // ensures signature is not empty or null
    });
    if (signatureFields.length > 0) {
      for (const field of signatureFields) {
        field.signature = Signature;
        await field.save();
      }
      // Pass field id to front end to re render the signature fields
      return res.status(200).json({ message: 'Signature updated succesfully', mode: mode, signatureFields: signatureFields });
    }
  }
  return res.status(200).json({ message: 'Signature saved succesfully', mode: mode });
}
const LinkUserRecipient = async (req, res) => {
  const { email, userId } = req.body;
  const RecipientData = await Recipient.findOne({ email: email });
  if (RecipientData) {
    RecipientData.UserId = userId;
    await RecipientData.save();
    return res.status(200).json({ message: 'Recipient linked to user successfully', Recipient });
  }
}
// Export functions
// Process scheduled envelopes (to be called by a cron job or worker)
const processScheduledEnvelopes = async () => {
  try {
    const now = new Date();
    // Find all envelopes that are scheduled and the scheduled time has passed
    const scheduledEnvelopes = await Envelope.find({
      isScheduled: true,
      status: 'draft',
      scheduledDate: { $lte: now }
    });

    console.log(`Processing ${scheduledEnvelopes.length} scheduled envelope(s)`);

    for (const envelope of scheduledEnvelopes) {
      try {
        // Update status and send
        envelope.status = 'in-progress';
        envelope.isScheduled = false; // Clear scheduling flag
        await envelope.save();

        await sendToRecipients(envelope._id, envelope.subject, envelope.message);

        console.log(`Successfully sent scheduled envelope ${envelope._id}`);
      } catch (error) {
        console.error(`Error processing scheduled envelope ${envelope._id}:`, error);
        // Don't throw - continue with other envelopes
      }
    }

    return { processed: scheduledEnvelopes.length };
  } catch (error) {
    console.error("Error processing scheduled envelopes:", error);
    throw error;
  }
}

// HTTP route handler wrapper for processScheduledEnvelopes
const processScheduledEnvelopesHandler = async (req, res) => {
  try {
    const result = await processScheduledEnvelopes();
    return res.status(200).json({
      success: true,
      message: `Processed ${result.processed} scheduled envelope(s)`,
      processed: result.processed
    });
  } catch (error) {
    console.error("Error in processScheduledEnvelopesHandler:", error);
    return res.status(500).json({
      success: false,
      message: "Error processing scheduled envelopes",
      error: error.message
    });
  }
}

module.exports = {
  getAllRecipients,
  envelopesData,
  envelopesDetail,
  getEnvelopeStats,
  envelopExists,
  getSignatureFields,
  sendEnvelope,
  scheduleEnvelope,
  processScheduledEnvelopes,
  processScheduledEnvelopesHandler,
  addSignature,
  getRecipientByEmail,
  envelopeArchive,
  envelopeDelete,
  envelopePermanentDelete,
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
  saveupdateSignature,
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  LinkUserRecipient
};