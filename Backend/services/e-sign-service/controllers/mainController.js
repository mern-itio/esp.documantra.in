const Envelope = require('../models/Envelope');
const SignatureField = require('../models/SignatureFields');
const Recipient = require('../models/Recipient');
const RecipientPermission = require('../models/RecipientPermission');
const axios = require('axios');
const sendEmail = require('../emails/sendEmail');
const { signRequestTemplate, signReminderTemplate, envelopeCompletedTemplate, reassignedSignRequestTemplate, reassignedOwnerCcTemplate } = require('../emails/emailTemplates');
const { fetchUserFullname } = require('../services/envelopeCommentNotifyService');
const mongoose = require('mongoose');
const SignatureFields = require('../models/SignatureFields');
const { signAndEmbed, initiateRecipientSignature, finalizeSigning, prepareDocumentForFinalSigning } = require('../services/digitalSignatureService');
const { logActivity } = require('../services/activityLogService');
const { ActivityLogs } = require('../models/ActivityLogs');
const Document = require('../models/Document');
const Cycle = require('../models/Cycle');
const { evaluateSignerAccess } = require('../helpers/signerAccessGate');
const { buildPublicSignerUrl } = require('../helpers/signerAccessToken');
const { buildRecipientPortalUrl } = require('../helpers/recipientPortalToken');
const { issueCertificate } = require('../services/pkiService');
const { generateAndStoreCompletionCertificate,generateAndStoreCompletionCertificateOfPowerForm } = require('../services/certificateGenerator');
const fs = require('fs');
const path = require('path');
const selfSigner = require('../models/selfSigner');
const { sign } = require('crypto');
const { values } = require('pdf-lib');
const Notification = require('../models/Notification');
const { AuditTrail } = require('../models/AuditTrail');
const archiver = require('archiver');
const { assertEnvelopeDownloadAccess } = require('../helpers/documentDownloadAccess');
const { recordConsentEntries } = require('../services/consentService');
const {
  CONSENT_TYPES,
  SUBJECT_TYPES,
  CONSENT_SOURCES,
  DEFAULT_CONSENT_VERSIONS,
  getRequestMeta,
} = require('@draftnsign/validators/userConsent');
const { json } = require('stream/consumers');
const signingServices = require('../services/signing');
const signatureOperationServices = require('../services/signatureOperationServices');
const {prepareDocForSignature, pdfToBase64, base64ToPdf, embedFieldsValueToPDF} = require('../services/pdfService');
const { x } = require('pdfkit');

const envelopesData = async (req, res) => {
  const userId = req?.user?.data?.id;
  const userType = req?.userType;
  const filterUserId = req.query.userId;

  const accountType = req.headers['x-account-type'];
  const organizationId = req.headers['x-organization-id'];

  const isOrgContext =
    accountType === 'organization' &&
    organizationId ;

  try {
    /* ============================================================
       ================= ORGANIZATION CONTEXT =====================
       ============================================================ */
    if (isOrgContext) {
      const envelopes = await Envelope.find({
        isOrganization: true,
        organizationId,
        sender: userId,
      })
        .sort({ createdAt: -1 })
        .populate('documentIds')
        .populate({
          path: 'recipientIds',
          model: 'Recipient',
          select: 'name email UserId',
        })
        .lean();

      if (!envelopes.length) {
        return res.status(200).json({
          status: 'success',
          data: [],
          totalEnvelopes: 0,
        });
      }

      const envelopeIds = envelopes.map(e => e._id);

      const permissions = await RecipientPermission.find({
        envelopeId: { $in: envelopeIds },
      })
        .select('recipientId envelopeId role order status authLevel')
        .lean();

      const permByEnvelope = new Map();
      for (const p of permissions) {
        const eid = p.envelopeId?.toString();
        const rid = p.recipientId?.toString();
        if (!eid || !rid) continue;

        if (!permByEnvelope.has(eid)) {
          permByEnvelope.set(eid, new Map());
        }
        permByEnvelope.get(eid).set(rid, p);
      }

      let sender = {};
      try {
        const response = await axios.get(
          `${process.env.AUTH_URL}/api/user-details/${userId}`,
          { headers: { Authorization: req.headers.authorization } }
        );
        sender = response.data?.data || {};
      } catch (_) {}

      const formattedEnvelopes = envelopes.map(envelope => {
        const eid = envelope._id.toString();
        const envelopePermMap = permByEnvelope.get(eid) || new Map();

        const recipients = (envelope.recipientIds || []).map(r => {
          const rid = r._id?.toString();
          const perm = rid ? envelopePermMap.get(rid) : null;

          let authentication = 'none';
          if (perm?.authLevel) {
            authentication = Array.isArray(perm.authLevel)
              ? JSON.stringify(perm.authLevel)
              : JSON.stringify([perm.authLevel]);
          }

          return {
            id: r._id,
            name: r.name,
            email: r.email,
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
          isAIGenerated: envelope.isAIGenerated || false,
          completionCertificate: envelope.completionCertificate,
          isOrganization: true,
          organizationId: envelope.organizationId,

          sender: {
            id: sender._id || userId,
            name: sender.fullname || 'Unknown',
            email: sender.email || 'N/A',
            role: sender.role || 'sender',
            organization: sender.organization || 'ITIO',
            avatar: sender.avatar || '',
          },

          signatureType: envelope.signatureType,
          documents: (envelope.documentIds || []).map(doc => ({
            id: doc._id,
            name: doc.fileName,
            size: doc.fileSize,
            type: doc.mimeType,
          })),
          recipients,
          direction: 'organization_sent',
        };
      });

      return res.status(200).json({
        status: 'success',
        data: formattedEnvelopes,
        totalEnvelopes: formattedEnvelopes.length,
      });
    }

    /* ============================================================
       ================= USER / ADMIN CONTEXT =====================
       ============================================================ */

    const targetUserId =
      userType === 'admin' && filterUserId ? filterUserId : userId;

    let sentQuery = {};
    if (userType === 'admin') {
      if (filterUserId) sentQuery.sender = filterUserId;
    } else {
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

    const userRecipients = await Recipient.find({
      UserId: targetUserId,
    })
      .select('_id')
      .lean();

    const recipientIds = userRecipients.map(r => r._id);

    let receivedEnvelopeIds = [];
    if (recipientIds.length) {
      const perms = await RecipientPermission.find({
        recipientId: { $in: recipientIds },
      })
        .select('envelopeId')
        .lean();

      receivedEnvelopeIds = [
        ...new Set(perms.map(p => p.envelopeId?.toString()).filter(Boolean)),
      ];
    }

    let receivedEnvelopes = [];
    if (receivedEnvelopeIds.length) {
      receivedEnvelopes = await Envelope.find({
        _id: { $in: receivedEnvelopeIds },
      })
        .sort({ createdAt: -1 })
        .populate('documentIds')
        .populate({
          path: 'recipientIds',
          model: 'Recipient',
          select: 'name email UserId',
        })
        .lean();
    }

    const envelopesMap = new Map();
    [...sentEnvelopes, ...receivedEnvelopes].forEach(env => {
      if (env?._id) envelopesMap.set(env._id.toString(), env);
    });

    const envelopes = Array.from(envelopesMap.values());

    if (!envelopes.length) {
      return res.status(404).json({ message: 'No envelopes found' });
    }

    const allEnvelopeIds = envelopes.map(e => e._id);

    const allPermissions = await RecipientPermission.find({
      envelopeId: { $in: allEnvelopeIds },
    })
      .select('recipientId envelopeId role order status authLevel')
      .lean();

    const permByEnvelope = new Map();
    for (const p of allPermissions) {
      const eid = p.envelopeId?.toString();
      const rid = p.recipientId?.toString();
      if (!eid || !rid) continue;

      if (!permByEnvelope.has(eid)) {
        permByEnvelope.set(eid, new Map());
      }
      permByEnvelope.get(eid).set(rid, p);
    }

    const senderIds = [
      ...new Set(envelopes.map(e => e.sender?.toString()).filter(Boolean)),
    ];

    const senderDetailsMap = {};
    await Promise.all(
      senderIds.map(async sid => {
        try {
          const response = await axios.get(
            `${process.env.AUTH_URL}/api/user-details/${sid}`,
            { headers: { Authorization: req.headers.authorization } }
          );
          if (response.data?.data) {
            senderDetailsMap[sid] = response.data.data;
          }
        } catch (_) {}
      })
    );

    const formattedEnvelopes = envelopes.map(envelope => {
      const eid = envelope._id.toString();
      const sender = senderDetailsMap[envelope.sender?.toString()] || {};
      const envelopePermMap = permByEnvelope.get(eid) || new Map();

      const isSender = envelope.sender?.toString() === targetUserId;
      const isReceiver = envelope.recipientIds?.some(
        r => r?.UserId?.toString() === targetUserId
      );

      let direction = 'Sent';
      if (isSender && isReceiver) direction = 'sent_and_received';
      else if (isReceiver) direction = 'Received';

      const recipients = (envelope.recipientIds || []).map(r => {
        const rid = r._id?.toString();
        const perm = rid ? envelopePermMap.get(rid) : null;

        let authentication = 'none';
        if (perm?.authLevel) {
          authentication = Array.isArray(perm.authLevel)
            ? JSON.stringify(perm.authLevel)
            : JSON.stringify([perm.authLevel]);
        }

        return {
          id: r._id,
          name: r.name,
          email: r.email,
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
        isAIGenerated: envelope.isAIGenerated || false,
        completionCertificate: envelope.completionCertificate,
        sender: {
          id: sender._id || envelope.sender,
          name: sender.fullname || 'Unknown',
          email: sender.email || 'N/A',
          role: sender.role || 'sender',
          organization: sender.organization || 'ITIO',
          avatar: sender.avatar || '',
        },
        signatureType: envelope.signatureType,
        documents: (envelope.documentIds || []).map(doc => ({
          id: doc._id,
          name: doc.fileName,
          size: doc.fileSize,
          type: doc.mimeType,
        })),
        recipients,
        direction,
      };
    });

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
  const recipientId = req.query.recipientId;

  try {
    if (recipientId) {
      const gate = await evaluateSignerAccess(req, envelopeId, recipientId);
      if (!gate.ok) {
        return res.status(403).json({
          message: gate.message || 'Signer access verification required',
          requiresAccessVerification: !!gate.requiresAccessVerification,
          expired: !!gate.expired,
          maskedEmail: gate.maskedEmail || null,
        });
      }
    }

    // Step 1: Fetch single envelope by ID
    const envelope = await Envelope.findById(envelopeId)
      .populate("documentIds")   // fetch docs
      .populate({
        path: 'recipientIds',           // populate recipients
        select: 'name email phone UserId signature initials',    // only global info
        populate: {
          path: 'permissions',          // populate envelope-specific permissions
          model: 'RecipientPermission',
          match: { envelopeId: envelopeId }, // only permissions for this envelope
          select: 'role order status authLevel signingEvidence'
        }
      });
    if (!envelope) {
      return res.status(404).json({ message: 'Envelope not found' });
    }
    // Fallback for legacy/inconsistent rows where recipientIds wasn't persisted
    // but recipient permissions exist for this envelope.
    if (!Array.isArray(envelope.recipientIds) || envelope.recipientIds.length === 0) {
      const fallbackPerms = await RecipientPermission.find({ envelopeId })
        .populate({
          path: 'recipientId',
          select: 'name email phone UserId signature initials'
        })
        .select('recipientId role order status authLevel signingEvidence')
        .lean();
      envelope.recipientIds = fallbackPerms
        .map((p) => {
          const r = p.recipientId;
          if (!r) return null;
          return {
            ...r,
            permissions: [{ role: p.role, order: p.order, status: p.status, authLevel: p.authLevel, signingEvidence: p.signingEvidence }]
          };
        })
        .filter(Boolean);
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
    //const senderResponse = await axios.get(
      //`${process.env.AUTH_URL}/api/user-details/${senderId}`,
   // );

    //const senderDetails = senderResponse.data;
   // if (!senderDetails || !senderDetails.data) {
     // return res.status(404).json({ message: 'Sender not found' });
   // }

let senderDetails = {
  data: {
    _id: null,
    fullname: 'Public User',
    email: '',
    role: 'sender'
  }
};

if (senderId) {
  try {
    const senderResponse = await axios.get(
      `${process.env.AUTH_URL}/api/user-details/${senderId}`
    );

    if (senderResponse?.data) {
      senderDetails = senderResponse.data;
    }
  } catch (err) {
    console.log('Sender lookup skipped:', err.message);
  }
}

    // Step 3: Collect decline metadata from activity logs (if any)
    const declineLogs = await ActivityLogs.find({
      envelopeId: envelope._id,
      action: 'RECIPIENT_DECLINED',
    })
      .sort({ timestamp: -1 })
      .lean();

    const declineByRecipient = new Map();
    for (const log of declineLogs) {
      const recipientKey = String(log?.details?.recipientId || '');
      if (!recipientKey || declineByRecipient.has(recipientKey)) continue; // keep latest only
      declineByRecipient.set(recipientKey, {
        reason: String(log?.details?.reason || '').trim(),
        timestamp: log?.timestamp || null,
        recipientName: String(log?.details?.recipientName || '').trim(),
        recipientEmail: String(log?.details?.recipientEmail || '').trim(),
      });
    }

    const latestDecline = declineLogs[0] || null;
    const envelopeRejectionReason = String(latestDecline?.details?.reason || '').trim();
    const envelopeRejectedBy = String(
      latestDecline?.details?.recipientName ||
      latestDecline?.details?.recipientEmail ||
      ''
    ).trim();

    // Convert stored local paths to public /uploads URL so browser preview never tries file:// paths.
    const { buildPublicUploadUrl } = require('../helpers/documentDownloadAccess');
    const toPublicUploadUrl = (rawPath, documentId) =>
      buildPublicUploadUrl(rawPath, {
        envelopeId: envelope._id,
        documentId,
        baseUrl: process.env.PUBLIC_ESIGN_URL || `https://${req.get('host')}`,
      });

    // Step 4: Format the response (single envelope object)
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
      rejectionReason: envelopeRejectionReason || null,
      rejectedBy: envelopeRejectedBy || null,
      rejectedAt: latestDecline?.timestamp || null,
      sender: {
        id: senderDetails?.data?._id,
        name: senderDetails?.data?.fullname,
        email: senderDetails?.data?.email,
        role: senderDetails?.data?.role || 'sender',
        organization: "ITIO",
        avatar: ""
      },
      signatureType: envelope.signatureType,
      canDecline: envelope.canDecline !== false,
      documents: envelope.documentIds.map(doc => ({
        id: doc._id,
        name: doc.fileName,
        size: doc.fileSize,
        type: doc.mimeType,
        filePath: toPublicUploadUrl(
          doc.preparedDoc || doc.signedFilePath || doc.filePath,
          doc._id,
        ),
        signedFilePath: toPublicUploadUrl(doc.signedFilePath, doc._id),
        preparedDoc: doc.preparedDoc ? toPublicUploadUrl(doc.preparedDoc, doc._id) : null,
      })),
      recipients: envelope.recipientIds.map(recipient => {
        const perm = recipient.permissions?.[0] || {};
        const declineMeta = declineByRecipient.get(String(recipient._id)) || null;
        return {
          id: recipient._id,
          name: recipient.name,
          email: recipient.email,
          phone: recipient.phone || '',
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
          signature: recipient.signature,
          signingEvidence: perm.signingEvidence || null,
          rejectionReason: declineMeta?.reason || null,
          rejectedAt: declineMeta?.timestamp || null,
        };
      })
    };

    // Step 5: Return single envelope
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
    const recipientId = req.query.recipientId;
    if (!isSelf && recipientId) {
      const doc = await Document.findById(documentId).select('envelopeId').lean();
      if (doc?.envelopeId) {
        const gate = await evaluateSignerAccess(req, doc.envelopeId, recipientId);
        if (!gate.ok) {
          return res.status(403).json({
            message: gate.message || 'Signer access verification required',
            requiresAccessVerification: !!gate.requiresAccessVerification,
            expired: !!gate.expired,
            maskedEmail: gate.maskedEmail || null,
          });
        }
      }
    }

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
    const userId = req?.user?.data?.id || req?.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const now = new Date();

    const stats = await Envelope.aggregate([
      { $match: { sender: userId } },
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
    const userId = req?.user?.data?.id || req?.user?.id;
    const {
      assertPublicSendQuota,
      incrementPublicSendQuota,
      attachPublicGuestToEnvelope,
    } = require('../helpers/publicGuestSend');

    if (!envelope) {
      return res.status(404).json({ message: "Envelope not found" });
    }

    const isPublicSend = String(req.originalUrl || '').includes('/api/e-sign/public/');
    if (isPublicSend) {
      const quota = await assertPublicSendQuota(req);
      if (!quota.ok) {
        return res.status(quota.status).json({
          message: quota.message,
          upgrade: quota.upgrade,
          used: quota.used,
          limit: quota.limit,
          remaining: quota.remaining,
        });
      }
      await attachPublicGuestToEnvelope(envelope, req);
    }

    // Check if envelope is already sent or completed
    if (envelope.status === 'sent' || envelope.status === 'completed' || envelope.status === 'declined') {
      return res.status(400).json({ 
        message: `Envelope is already ${envelope.status}. Cannot send again.` 
      });
    }

    // Send to First recipient in Signing Order
    const sentRecipients = [];
    const mailUserId =
      userId ||
      (envelope.sender && mongoose.Types.ObjectId.isValid(String(envelope.sender))
        ? envelope.sender
        : null);

      const result = await sendToRecipients(
        envelope._id,
        envelope.subject,
        envelope.message,
        mailUserId
      );
      
      if (result.error) {
          console.error("Error sending to recipient:", result.error);
          return res.status(502).json({ message: result.error });
      } else if (result.success) {
        sentRecipients.push({
          recipientId: result.recipientId,
          permissionId: result.permissionId
        });
      }

    // If we sent to at least one recipient, return success
    if (sentRecipients.length > 0) {
      if (envelope.status === 'draft') {
        envelope.status = 'in-progress';
        await envelope.save();
      }
      if (isPublicSend) {
        await incrementPublicSendQuota(req, envelope._id);
      }
      let referralMilestone = null;
      try {
        const uid = userId && String(userId);
        // Prefer AUTH_SERVICE_URL; fall back to AUTH_URL (used everywhere else in this service).
        const authBaseRaw = process.env.AUTH_URL;
        const authBase = authBaseRaw && String(authBaseRaw).replace(/\/+$/, '');
        const internalKey = process.env.INTERNAL_SERVICE_KEY;
        if (uid && authBase && internalKey) {
          const priorSent = await Envelope.countDocuments({
            sender: new mongoose.Types.ObjectId(uid),
            _id: { $ne: envelope._id },
            status: { $nin: ['draft', 'deleted'] },
          });
          if (priorSent === 0) {
            const referralHookResp = await axios.post(
              `${authBase}/api/internal/referrals/first-document-sent`,
              { userId: uid, envelopeId: String(envelope._id) },
              { headers: { 'x-internal-key': internalKey }, timeout: 8000 }
            );
            const action = referralHookResp?.data?.action;
            if (action === 'completed') {
              const d = referralHookResp?.data || {};
              referralMilestone = {
                achieved: true,
                rewardCredits: Number(d.rewardCredits || 0),
                referralId: d.referralId || null,
                rewardSummary: d.rewardSummary || null,
                referrerMilestoneAchieved: !!d.referrerMilestoneAchieved,
              };
            }
          }
        } else if (uid) {
          console.warn(
            'Referral first-send hook skipped: set AUTH_SERVICE_URL or AUTH_URL and INTERNAL_SERVICE_KEY on e-sign-service'
          );
        }
      } catch (refHookErr) {
        console.warn('Referral first-send hook failed:', refHookErr?.message || refHookErr);
      }
      return res.status(200).json({
        message: "Envelope sent to recipients",
        recipientsSent: sentRecipients.length,
        recipients: sentRecipients,
        referralMilestone,
      });
    } else {
      // Check if there are any recipients at all
      const allRecipients = await RecipientPermission.find({ envelopeId: envelope._id });
      if (allRecipients.length === 0) {
        return res.status(400).json({ 
          message: "No recipients found for this envelope" 
        });
      }
      
      // All recipients have already been sent
      return res.status(200).json({
        message: "All recipients have already been notified",
        recipientsSent: 0
      });
    }
  } catch (error) {
    console.error("Error sending envelope:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
}

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
    let scheduledDateTime;
    const timezoneOffset = req.body.timezoneOffset !== undefined 
      ? parseInt(req.body.timezoneOffset) 
      : 330; 
    
    if (typeof scheduledDate === 'string') {
      const dateOnly = scheduledDate.split('T')[0];
      const dateParts = dateOnly.split('-');
      
      if (dateParts.length === 3) {
        const year = parseInt(dateParts[0]);
        const month = parseInt(dateParts[1]) - 1; 
        const day = parseInt(dateParts[2]);
        
        let hours = 0;
        let minutes = 0;
        if (scheduledTime) {
          const timeParts = scheduledTime.split(':');
          hours = parseInt(timeParts[0]) || 0;
          minutes = parseInt(timeParts[1]) || 0;
        }
        const offsetHours = Math.floor(Math.abs(timezoneOffset) / 60);
        const offsetMinutes = Math.abs(timezoneOffset) % 60;
        const isAheadOfUTC = timezoneOffset > 0;
        
        let utcHours, utcMinutes;
        if (isAheadOfUTC) {
          utcHours = hours - offsetHours;
          utcMinutes = minutes - offsetMinutes;
        } else {
          utcHours = hours + offsetHours;
          utcMinutes = minutes + offsetMinutes;
        }
        let utcDay = day;
        let utcMonth = month;
        let utcYear = year;
        
        if (utcMinutes < 0) {
          utcMinutes += 60;
          utcHours -= 1;
        } else if (utcMinutes >= 60) {
          utcMinutes -= 60;
          utcHours += 1;
        }
        if (utcHours < 0) {
          utcHours += 24;
          utcDay -= 1;
          if (utcDay < 1) {
            utcMonth -= 1;
            if (utcMonth < 0) {
              utcMonth = 11;
              utcYear -= 1;
            }
            const daysInMonth = new Date(utcYear, utcMonth + 1, 0).getDate();
            utcDay = daysInMonth;
          }
        } else if (utcHours >= 24) {
          utcHours -= 24;
          utcDay += 1;
          const daysInMonth = new Date(utcYear, utcMonth + 1, 0).getDate();
          if (utcDay > daysInMonth) {
            utcDay = 1;
            utcMonth += 1;
            if (utcMonth >= 12) {
              utcMonth = 0;
              utcYear += 1;
            }
          }
        }
        scheduledDateTime = new Date(Date.UTC(utcYear, utcMonth, utcDay, utcHours, utcMinutes, 0, 0));
        
      } else {
        scheduledDateTime = new Date(scheduledDate);
      }
    } else {
      scheduledDateTime = new Date(scheduledDate);
    }
    const nowUTC = new Date();
    if (scheduledDateTime <= nowUTC) {
      return res.status(400).json({ 
        message: "Scheduled date must be in the future",
        scheduled: scheduledDateTime.toISOString(),
        now: nowUTC.toISOString()
      });
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
const buildSigningLinks = async (envelopeId) => {
  const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/+$/, '');
  const permissions = await RecipientPermission.find({ envelopeId })
    .sort({ order: 1, createdAt: 1 })
    .populate('recipientId');

  return permissions
    .filter((p) => p.recipientId && p.role !== 'in_person_signer')
    .map((p) => ({
      recipientId: p.recipientId._id,
      name: p.recipientId.name,
      email: p.recipientId.email,
      order: p.order,
      signLink: buildPublicSignerUrl(envelopeId, p.recipientId._id),
    }));
};
const dispatchEnvelopeEmail = async ({ userId, toEmail, subject, html, attachments }) => {
  const emailServiceUrl = process.env.EMAIL_SERVICE_URL;
  if (!emailServiceUrl) {
    throw new Error('EMAIL_SERVICE_URL is not configured');
  }

  const validUserId =
    userId &&
    userId !== 'undefined' &&
    userId !== 'null' &&
    mongoose.Types.ObjectId.isValid(String(userId));

  const mailPath = validUserId
    ? `${emailServiceUrl}/mail/send/${userId}`
    : `${emailServiceUrl}/mail/send-by-system`;
  const mailBody = validUserId
    ? { toEmail, subject, html, attachments }
    : { to: toEmail, subject, html, attachments };

  const axiosConfig = { timeout: 90000 };
  const retryable = /ECONNRESET|ETIMEDOUT|ESOCKET|ECONNREFUSED|socket hang up|502|503|504/i;

  let lastErr;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      await axios.post(mailPath, mailBody, axiosConfig);
      return;
    } catch (err) {
      lastErr = err;
      const errText = [
        err?.message,
        err?.response?.data?.message,
        String(err?.response?.status || ''),
      ].join(' ');
      if (!retryable.test(errText) || attempt === 1) {
        throw err;
      }
      await new Promise((resolve) => setTimeout(resolve, 2000 * (attempt + 1)));
    }
  }
  throw lastErr;
};
const isParallelSigningOrder = (signingOrder) => {
  const v = String(signingOrder || '').toLowerCase();
  return v === 'parallel';
};

const sendSignEmailToPermission = async ({
  waitingPermission,
  envelopeId,
  envelopeSubject,
  envelopeMessage,
  userId,
}) => {
  const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/+$/, '');
  const signLink = buildPublicSignerUrl(envelopeId, waitingPermission.recipientId._id);
  const portalLink = buildRecipientPortalUrl(frontendUrl, waitingPermission.recipientId.email);
  const senderName = (await fetchUserFullname(userId)) || undefined;
  const html = signRequestTemplate(
    waitingPermission.recipientId.name,
    envelopeSubject,
    envelopeMessage,
    signLink,
    portalLink,
    senderName,
  );

  await dispatchEnvelopeEmail({
    userId,
    toEmail: waitingPermission.recipientId.email,
    subject: `Action Required: Sign "${envelopeSubject}"`,
    html,
  });

  waitingPermission.status = 'sent';
  await waitingPermission.save();

  return {
    recipientId: waitingPermission.recipientId._id,
    permissionId: waitingPermission._id,
  };
};

const sendToRecipients = async (envelopeId, envelopeSubject, envelopeMessage, userId) => {
  try {
    const envelope = await Envelope.findById(envelopeId).lean();
    const roleFilter = { $nin: ['in_person_signer', 'carbon_copy', 'cc'] };

    if (isParallelSigningOrder(envelope?.signingOrder)) {
      const waitingPermissions = await RecipientPermission.find({
        envelopeId,
        status: 'waiting',
        role: roleFilter,
      })
        .sort({ order: 1, createdAt: 1 })
        .populate('recipientId');

      if (!waitingPermissions.length) {
        return { error: 'No waiting recipients' };
      }

      const sentRecipients = [];
      for (const waitingPermission of waitingPermissions) {
        try {
          const sent = await sendSignEmailToPermission({
            waitingPermission,
            envelopeId,
            envelopeSubject,
            envelopeMessage,
            userId,
          });
          sentRecipients.push(sent);
        } catch (err) {
          console.error('Error sending parallel sign request email:', err.response?.data || err.message);
          const rawMessage = err.response?.data?.message || err.message || 'Failed to send sign request email';
          const friendlyMessage = /ECONNRESET|ETIMEDOUT|ESOCKET|socket hang up/i.test(rawMessage)
            ? 'Email delivery failed due to a temporary connection issue. Please try again.'
            : rawMessage;
          return { error: friendlyMessage };
        }
      }

      return { success: true, sentRecipients };
    }

    const waitingPermission = await RecipientPermission.findOne({
      envelopeId,
      status: 'waiting',
      role: roleFilter,
    })
      .sort({ order: 1, createdAt: 1 })
      .populate('recipientId');

    if (!waitingPermission) {
      return { error: 'No waiting recipients' };
    }

    try {
      const sent = await sendSignEmailToPermission({
        waitingPermission,
        envelopeId,
        envelopeSubject,
        envelopeMessage,
        userId,
      });
      return { success: true, ...sent };
    } catch (err) {
      console.error('Error sending sign request email:', err.response?.data || err.message);
      const rawMessage = err.response?.data?.message || err.message || 'Failed to send sign request email';
      const friendlyMessage = /ECONNRESET|ETIMEDOUT|ESOCKET|socket hang up/i.test(rawMessage)
        ? 'Email delivery failed due to a temporary connection issue. Please try again.'
        : rawMessage;
      return { error: friendlyMessage };
    }
  } catch (error) {
    console.error('Error sending to recipients:', error);
    return { error: 'Internal error while sending recipient email' };
  }
};
const sendToAllSelfSigners = async(envelope,signedFilePath,signedPdfFilename,certFilePath,certFilename,cycleId) => {
  try{
    //Find all self Signers 
    const allSelfSigners = await Cycle.findById(cycleId).populate({ path: 'signers' });
    const selfSigners = allSelfSigners?.signers;
    for(const signer of selfSigners){
      if(signer){
        const html = envelopeCompletedTemplate(signer?.data?.name,envelope?.subject);
        const attachments = [
          {
            filename: signedPdfFilename,
            content: fs.readFileSync(signedFilePath).toString('base64'),
            encoding: 'base64'
          },
          {
            filename: certFilename,
            content: fs.readFileSync(certFilePath).toString('base64'),
            encoding: 'base64'
          }
        ];
        try{
          await axios.post(`${process.env.EMAIL_SERVICE_URL}/mail/send/${envelope?.sender}`, {
            toEmail: signer?.data?.email,
            subject: `Document "${envelope.subject}" Completed and Signed`,
            html: html,
            attachments
          });
        }catch (err){
          console.log("Error sending mail",err);
        }
      }
    }
  }catch (err){
    console.log(err)
  }
}
const sendToAllRecipients = async (
  envelope,
  attachments,
  userId
) => {
  try {
    const allRecipients = await RecipientPermission.find({
      envelopeId: envelope._id
    }).populate('recipientId');

    for (const recipient of allRecipients) {
      if (recipient?.recipientId?.email) {  
        const html = envelopeCompletedTemplate(
          recipient.recipientId.name,
          envelope.subject
        );
        try {
          await dispatchEnvelopeEmail({
            userId,
            toEmail: recipient.recipientId.email,
            subject: `Document "${envelope.subject}" Completed and Signed`,
            html,
            attachments,
          });

          console.log('✅ Recipient Email Sent');
        } catch (err) {
          console.log('Test 4: Recipient Email Sending Failed');
          console.error(err.response?.data || err.message);
        }
      }
    }
  } catch (error) {
    console.error('Error sending to all recipients:', error);
    return { error: 'Internal error while sending recipient email' };
  }
};


const addSignature = async (req, res) => {
  try {
    console.log("Signature Started...");
    const { fieldId, signatureImageBase64, envelopeId, documentId, recipientId, certificateId, signerName, selfValue, cycleId, initials,signatureMethod,signatureProvider } = req.body;

    let mode= "";
    if(selfValue === "1" || selfValue === 1){
      mode = "Self_Signer";
    }else{
      mode = "Recipient";
    }
    // Validation...
    if (!fieldId || !signatureImageBase64 || !envelopeId || !documentId || !recipientId) {
      return res.status(400).json({ message: 'All required parameters are missing' });
    }
    if (mode === 'Recipient') {
      const turnCheck = await signatureOperationServices.assertSignerTurn(envelopeId, recipientId);
      if (!turnCheck.ok) {
        return res.status(turnCheck.status || 403).json({
          message: turnCheck.message,
          code: turnCheck.code || 'SIGNING_NOT_ALLOWED',
        });
      }
    }
    // Prepare PDF
    const document = await Document.findById(documentId);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }
    if(signatureMethod == "aadharSignature"){
    // Fetch Signature Field to get coordinates and page number
    const AllFields = await signatureOperationServices.fetchAllFieldsOfDocument(envelopeId, documentId);
    const withSignatureFlag = false;
    if(!document.preparedDoc){
      const preparePDFPayload = await payloadForPreparePDF(AllFields, withSignatureFlag,document?.filePath);
      const prepareDoc = await prepareDocForSignature(preparePDFPayload);
      if(!prepareDoc || !prepareDoc.pdfBase64){
        return res.status(500).json({ message: 'Failed to prepare PDF for signature' });
      }
      const preparedPDFBase64 = prepareDoc.pdfBase64;
      const preparedDir = path.join(process.cwd(), 'uploads', 'prepared');
      if (!fs.existsSync(preparedDir)) {
        fs.mkdirSync(preparedDir, { recursive: true });
      }
      const outPath = path.join(
        preparedDir,
        `${'prepared'}_${Date.now()}_${path.basename(document.filePath)}`
      );
      // convert back to pdf and save
      const preparedPDF = await base64ToPdf(preparedPDFBase64, outPath);
      if (!preparedPDF) {
        return res.status(500).json({ message: 'Failed to convert prepared PDF' });
      }
      const preparDocUpdateData = {
        preparedDoc: outPath
      }
      const updateDocWithPreparedFile = await signatureOperationServices.updateDocument(documentId, preparDocUpdateData);
      if (!updateDocWithPreparedFile) {
        return res.status(500).json({ message: 'Failed to update document with prepared PDF' });
      }

    }
    // Function to Embed field values to the preared PDF
    const embedFieldsPayload = await payloadForEmbedFieldsValue(AllFields, documentId, recipientId, withSignatureFlag);
    const embedFieldsWithValue = await embedFieldsValueToPDF(embedFieldsPayload);
    console.log("Embedding Step: Field values embedded into PDF", embedFieldsWithValue);
    if(!embedFieldsWithValue || !embedFieldsWithValue.pdfBase64){
      return res.status(500).json({ message: 'Failed to embed field values into PDF' });
    }
    const embeddedPDFBase64 = embedFieldsWithValue.pdfBase64;
    const preparedDir = path.join(process.cwd(), 'uploads', 'prepared');
    const outPath = path.join(
        preparedDir,
        `${'prepared'}_${Date.now()}_${path.basename(document.filePath)}`
      );
    const preparedPDF = await base64ToPdf(embeddedPDFBase64, outPath);
    if (!preparedPDF) {
        return res.status(500).json({ message: 'Failed to convert prepared PDF' });
      }
    const preparDocUpdateData = {
        preparedDoc: outPath
      }
    const updateDocWithPreparedFile = await signatureOperationServices.updateDocument(documentId, preparDocUpdateData);
      if (!updateDocWithPreparedFile) {
        return res.status(500).json({ message: 'Failed to update document with prepared PDF' });
      }
    }
    if(signatureMethod == "Digital_Signature"){
    // Generate certificate if not exist...
      if (!certificateId) {
        const cert = await issueCertificate(recipientId, envelopeId);
        await logActivity(envelopeId, "CERTIFICATE_ISSUED", "Sender", {
          recipientId,
          certificateId: cert.certificateId,
        });
      }
      //Initiate Signature Process (common for both recipient and self-signer)
      const initiateSign = await initiateRecipientSignature({ 
        fieldId, 
        envelopeId, 
        documentId, 
        recipientId, 
        signatureImageBase64, 
        selfValue 
      });
      
      if (!initiateSign) {
        console.log('Failed to initiate recipient signature');
        return res.status(500).json({ message: 'Failed to initiate signature' });
      }
    }
    // Switch case for recipient vs self-signer
    let result;
    switch (mode) {
      case "Self_Signer":
          result = await addDigitalSignatureForSelfSigner({ 
            envelopeId, 
            documentId, 
            recipientId, 
            cycleId 
          });

        break;
      case "Recipient":
        if (signatureMethod === "Digital_Signature") {
          result = await addDigitalSignatureForRecipient({
            envelopeId,
            documentId,
            recipientId,
          });
        } else {
          const providerKey = signatureProvider === "draftnSign" ? "draftAndSign" : signatureProvider;
          const provider = signingServices[providerKey];
          if (!provider || typeof provider[signatureMethod] !== "function") {
            return res.status(400).json({
              message: `Unsupported signature provider/method: ${signatureProvider}/${signatureMethod}`,
            });
          }
          const data = {
            envelopeId,
            documentId,
            recipientId,
            fieldId,
            signatureImageBase64,
          };
          result = await provider[signatureMethod](data);
        }
        break;
      default:
        console.log("Invalid signing mode");
        return res.status(400).json({ message: 'Invalid signing mode' });
    }
    if (!result || typeof result.status !== "number") {
      return res.status(500).json({ message: "Failed to complete signature" });
    }
    return res.status(result.status).json(result.response);

  } catch (err) {
    console.error('addSignature error:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};
const completeSignature = async(req, res)=>{
  const {envelopeId,currentUserId, selfValue, signingContext} = req.body;
  console.log('Envelope Id', envelopeId);
  console.log('currentUserId',currentUserId);
  console.log('Self Value',selfValue);
  if(!envelopeId || !currentUserId){
    return res.status(400).json({ message:"All required parameters are missing"});
  }
  const envelope = await Envelope.findById(envelopeId);
  if (!envelope) {
    return res.status(404).json({ message: 'Envelope not found' });
  }
  let mode= "";
    if(selfValue === "1" || selfValue === 1){
      mode = "Self_Signer";
    }else{
      mode = "Recipient";
    }

  switch (mode) {
    case "Self_Signer":
      break;
    case "Recipient":
      const recipientId = currentUserId;
      const turnCheck = await signatureOperationServices.assertSignerTurn(envelopeId, recipientId);
      // ALREADY_COMPLETED is allowed here: the recipient gets marked completed when
      // their last field is signed (add-signature), but signature-complete must still
      // run to record evidence, notify the next signer, or finalize the envelope.
      if (!turnCheck.ok && turnCheck.code !== 'ALREADY_COMPLETED') {
        return res.status(turnCheck.status || 403).json({
          message: turnCheck.message,
          code: turnCheck.code || 'SIGNING_NOT_ALLOWED',
        });
      }
      if (String(envelope.status || '').toLowerCase() === 'completed') {
        return res.status(200).json({
          success: true,
          message: 'Envelope completed',
          remainingRecipent: false,
        });
      }
      const recipient = await Recipient.findById(recipientId);
      if(!recipient){
        return res.status(200).json({message:"Recipient not found"});
      }
      //Check pending fields of current recipient
      const resPendingFields = await signatureOperationServices.fetchPendingFieldsByRecipient(envelopeId,recipientId);
      console.log(resPendingFields);
      if(resPendingFields.length === 0 ){
        const { mergeSigningEvidence, sanitizeSigningEvidence } = require('../utils/signingEvidenceHelper');
        const RecipientPermission = require('../models/RecipientPermission');
        const permission = await RecipientPermission.findOne({ envelopeId, recipientId });
        const reqMeta = {
          ip: (req.headers['x-forwarded-for'] || '').toString().split(',')[0].trim() || req.socket?.remoteAddress || '',
          userAgent: req.headers['user-agent'] || '',
        };
        const mergedEvidence = sanitizeSigningEvidence(mergeSigningEvidence(
          permission?.signingEvidence || {},
          signingContext || {},
          reqMeta,
        ));
        if (permission) {
          permission.signingEvidence = mergedEvidence;
          await permission.save();
        }

        const markRecComplete = await signatureOperationServices.markRecipientAsCompleted(
          envelopeId,
          recipientId,
          mergedEvidence,
        );
        if(!markRecComplete){
          return res.status(404).json({message:"Recipient not exist"});
        }
        const pendingRecipient = await signatureOperationServices.pendingRecipients(envelopeId);
        if(pendingRecipient.length === 0 ){
          try{
            const documents = await Document.find({ envelopeId });
            for (const doc of documents) {
              const prepared = await prepareDocumentForFinalSigning(envelopeId, doc._id);
              if (prepared) {
                await finalizeSigning(envelopeId, doc._id);
              }
            }

            const { buffer, filename, filepath } = await generateAndStoreCompletionCertificate(envelopeId); // Generate Certificate
            // Mark Envelope Complete
            envelope.completionCertificate = {
              filename,
              path: filepath,
              mimeType: 'application/pdf',
              createdAt: new Date(),
            };
            envelope.status = 'completed';
          await envelope.save();
          // Re-fetch after finalize so signedFilePath is present on each document
          const finalizedDocs = await Document.find({ envelopeId });
          const attachments = [];
          for (const doc of finalizedDocs) {
            if (!doc.signedFilePath || !fs.existsSync(doc.signedFilePath)) continue;

            const pdfBuffer = fs.readFileSync(doc.signedFilePath);

            attachments.push({
              filename: doc.signedFileName || 'signed-document.pdf',
              content: pdfBuffer.toString('base64'),
              encoding: 'base64',
              contentType: 'application/pdf'
            });
          }
          // Add certificate last
          attachments.push({
            filename,
            content: buffer.toString('base64'),
            encoding: 'base64',
            contentType: 'application/pdf'
          });
          await sendToAllRecipients(
            envelope,
            attachments,
            envelope.sender
          );
          await logActivity(envelopeId, "ENVELOPE_COMPLETED", "System", {
            subject: envelope.subject,
            message: envelope.message
          });
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

          return res.status(200).json({
            success:true,
            message:"Envelope completed",
            remainingRecipent:false
          });
          }catch (err){
            console.log("Error In completing the Signature");
            return res.status(400).json({message:"Something went wrong",err});
          }
        }else{
          try{
            await Notification.create({
              userId: envelope.sender.toString(),
              envelopeId: envelope._id,
              recipientId: recipient._id,
              recipientName: recipient.name,
              envelopeSubject: envelope.subject,
              type: 'signature_completed',
              message: `${recipient.name} has signed "${envelope.subject}"`
            });
           // Advance to next signer in sequential mode only
           if (!isParallelSigningOrder(envelope.signingOrder)) {
             await sendToRecipients(envelope._id, envelope.subject, envelope.message, envelope?.sender);
             await logActivity(envelopeId, "Envelope_Sent_to_next_recipient", "Recipient", {
               subject: envelope.subject,
               message: envelope.message,
             });
           }
          return res.status(200).json({
            success:true,
            message:"Signature completed",
            remainingRecipent:true
          });
          }catch(err){
            console.log("Something went wrong",err);
            return res.status(400).json({message:"Something went wrong", err});
          }
        }

      }else{
        return res.status(400).json({message: "Recipient fields are pending."});
      }

  }

}

// ========== RECIPIENT SIGNATURE HANDLER ==========
const addDigitalSignatureForRecipient = async ({ envelopeId, documentId, recipientId }) => {
  try {
    const pendingFields = await SignatureField.find({
      envelopeId: envelopeId,
      status: 'pending'
    });

    // All fields across all documents are completed — defer finalization +
    // completion email to signature-complete. Completing here raced Finish and
    // previously called sendToAllRecipients with the wrong argument order.
    if (pendingFields.length === 0) {
      return {
        status: 200,
        response: {
          status: 200,
          success: true,
          message: 'All your fields are signed. Click Complete to finish.',
          fieldRemmaning: false,
        },
      };
    }

    // Check if current recipient's fields are all completed
    const pendingRecipientFields = await SignatureField.find({
      envelopeId: envelopeId,
      status: 'pending',
      recipientId: recipientId
    });

    if (pendingRecipientFields.length === 0) {
      // Current recipient has completed all their fields
      const envelope = await Envelope.findById(envelopeId);
      if (!envelope) {
        return {
          status: 404,
          response: { message: 'Envelope not found' }
        };
      }

      // Create notification for envelope creator
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

      console.log('Recipient finished all assigned fields; awaiting Complete action');

      return {
        status: 200,
        response: {
          status: 200,
          success: true,
          message: 'All your fields are signed. Click Complete to finish.',
          fieldRemmaning: false,
        },
      };
    }

    // Current recipient still has pending fields
    return {
      status: 200,
      response: {
        status: 200,
        success:true,
        message: 'Signature added with compliance',
        fieldRemmaning: true
      }
    };

  } catch (err) {
    console.error('addDigitalSignatureForRecipient error:', err);
    return {
      status: 500,
      response: { message: 'Server error', error: err.message }
    };
  }
};

// ========== SELF-SIGNER SIGNATURE HANDLER ==========
const addDigitalSignatureForSelfSigner = async ({ envelopeId, documentId, recipientId, cycleId }) => {
  try {
    // Find pending self-signers
    const pendingSelfSigners = await Cycle.findById(cycleId)
      .populate({ path: 'signers', match: { status: { $in: ['pending', 'initiated'] } } });

    if (!pendingSelfSigners || pendingSelfSigners.signers.length === 0) {
      // All signers have completed
      const envelope = await Envelope.findById(envelopeId);
      if (!envelope) {
        return {
          status: 404,
          response: { message: 'Envelope not found' }
        };
      }

      // Prepare document for final signing
      const prepareDoc = await prepareDocumentForFinalSigning(envelopeId, documentId, cycleId, true);
      if (!prepareDoc) {
        console.log('Failed to prepare document for final signing');
        return {
          status: 500,
          response: { message: 'Failed to prepare document for final signing' }
        };
      }

      // Finalize signing
      const digiSign = await finalizeSigning(envelopeId, documentId, cycleId, true);
      if (!digiSign) {
        console.log('Failed to finalize signing');
        return {
          status: 500,
          response: { message: 'Failed to finalize signing' }
        };
      }

      const signedFilePath = digiSign.finalPath;
      const signedPdfFilename = digiSign.signedFileName;

      // Generate completion certificate
      const { filename, filepath } = await generateAndStoreCompletionCertificateOfPowerForm(envelopeId, cycleId);
      const cycleUpdate = await Cycle.findById(cycleId);
      cycleUpdate.completionCertificate = {
        filename,
        path: filepath,
        mimeType: 'application/pdf',
        createdAt: new Date()
      };
      await cycleUpdate.save();

      // Send completion email to all self-signers
      await sendToAllSelfSigners(envelope, signedFilePath, signedPdfFilename, filepath, filename, cycleId);

      return {
        status: 200,
        response: {
          status: 'success',
          message: 'Signature added with compliance',
          fieldRemmaning: false
        }
      };
    }

    // Get current signer and envelope
    const currentSigner = await selfSigner.findById(recipientId);
    const envelope = await Envelope.findById(envelopeId);

    if (!currentSigner || !envelope) {
      return {
        status: 404,
        response: { message: 'Signer or envelope not found' }
      };
    }

    // Check for pending fields
    const pendingSignatureField = currentSigner.signatureFields?.find(f => f.state === 'pending');
    const pendingNonSignatureField = currentSigner.nonSignatureFields?.find(
      f => f.state === 'pending' || f.value === null
    );

    // If any pending field exists, redirect back to signing page
    if (pendingSignatureField || pendingNonSignatureField) {
      return {
        status: 200,
        response: {
          status: 'success',
          message: 'Signature added with compliance',
          fieldRemmaning: true
        }
      };
    }

    // Find and notify next pending signer
    const nextSigner = pendingSelfSigners?.signers
      ?.filter(s => s.status === 'pending')
      ?.sort((a, b) => a.signingOrder - b.signingOrder)[0];

    if (!nextSigner) {
      console.log('No next self-signer found');
      return {
        status: 200,
        response: {
          status: 'success',
          message: 'Signature added with compliance',
          fieldRemmaning: false
        }
      };
    }

    const nextSignerEmail = nextSigner?.data?.email;
    const nextSignerName = nextSigner?.data?.name;

    if (!nextSignerEmail) {
      console.log('Next signer email missing');
      return {
        status: 200,
        response: {
          status: 'success',
          message: 'Signature added with compliance',
          fieldRemmaning: false
        }
      };
    }

    // Send email to next signer
    const nextSignerSignatureLink = `${process.env.FRONTEND_URL}/e-sign/signer/${envelopeId}/${nextSigner._id}/${cycleId}/?self=1`;
    const nextSignerSubject = `Action Required: ${currentSigner?.data?.name} has completed their signing`;
    const nextSignerMessage = 'The previous signer has completed their part. Please proceed to sign the document.';
    const html = signRequestTemplate(
      nextSignerName,
      nextSignerSubject,
      nextSignerMessage,
      nextSignerSignatureLink,
      null,
      currentSigner?.data?.name || undefined,
    );

    try {
      await axios.post(`${process.env.EMAIL_SERVICE_URL}/mail/send/${envelope?.sender}`, {
        toEmail: nextSignerEmail,
        subject: nextSignerSubject,
        html: html
      });
    } catch (err) {
      console.error("Error sending sign link to next self-signer:", err);
    }

    return {
      status: 200,
      response: {
        status: 'success',
        message: 'Signature added with compliance',
        fieldRemmaning: false
      }
    };

  } catch (err) {
    console.error('addDigitalSignatureForSelfSigner error:', err);
    return {
      status: 500,
      response: { message: 'Server error', error: err.message }
    };
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
const sendReminderEmailsForEnvelope = async (envelope) => {
  if (!envelope || String(envelope.status || '').toLowerCase() !== 'in-progress') {
    return { sent: 0, recipients: [] };
  }

  const pendingSignatureFields = await SignatureFields.find({
    envelopeId: envelope._id,
    status: 'pending',
  }).populate('recipientId');

  const recipientsMap = new Map();
  pendingSignatureFields.forEach((field) => {
    const recipient = field.recipientId;
    if (recipient && !recipientsMap.has(recipient._id.toString())) {
      recipientsMap.set(recipient._id.toString(), recipient);
    }
  });

  const uniqueRecipients = Array.from(recipientsMap.values());
  const frontendUrl = String(process.env.FRONTEND_URL || '').replace(/\/+$/, '');
  const senderName = (await fetchUserFullname(envelope.sender)) || undefined;

  for (const recipient of uniqueRecipients) {
    const signLink = buildPublicSignerUrl(envelope._id, recipient._id);
    const portalLink = buildRecipientPortalUrl(frontendUrl, recipient.email);
    const html = signReminderTemplate(
      recipient.name,
      envelope.subject,
      envelope.message,
      signLink,
      portalLink,
      senderName,
    );

    try {
      await dispatchEnvelopeEmail({
        userId: envelope.sender,
        toEmail: recipient.email,
        subject: `Reminder: Action Required: Sign "${envelope.subject}"`,
        html,
      });
    } catch (err) {
      console.error('Error generating reminder email:', err);
    }
  }

  return { sent: uniqueRecipients.length, recipients: uniqueRecipients };
};

const envelopeReminder = async (req, res) => {
  try {
    const envelopeId = req.params.envelopeId;
    const envelope = await Envelope.findById(envelopeId);

    if (envelope && envelope.status === 'in-progress') {
      const result = await sendReminderEmailsForEnvelope(envelope);

      return res.status(200).json({
        success: true,
        message: 'Reminder emails processing initiated',
        recipients: result.recipients,
      });
    }

    return res.status(400).json({
      success: false,
      message: 'Envelope not in progress or not found',
    });
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

    const cycles = await Cycle.find({ envelopeId })
      .sort({ createdAt: -1 }) // 🔥 latest cycle first
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
    const id = req?.user?.data?.id || req?.user?.id;
    const { startDate, endDate } = req.query;
    const organizationId = req.headers['x-organization-id'];

    if (!userType) {
      return res.status(400).json({ message: 'userType is required' });
    }

    let query = {};
    if (userType === 'user') {
      if (!id || !mongoose.Types.ObjectId.isValid(String(id))) {
        return res.status(401).json({ message: 'User not authenticated' });
      }
      query = { sender: new mongoose.Types.ObjectId(String(id)) };
    } else if (userType === 'admin') {
      query = {};
    } else if (userType === 'organization') {
      if (
        !id ||
        !organizationId ||
        !mongoose.Types.ObjectId.isValid(String(id)) ||
        !mongoose.Types.ObjectId.isValid(String(organizationId))
      ) {
        return res.status(400).json({ message: 'Valid organization context required' });
      }
      query = {
        isOrganization: true,
        organizationId: new mongoose.Types.ObjectId(String(organizationId)),
        sender: new mongoose.Types.ObjectId(String(id)),
      };
    } else {
      return res.status(400).json({ message: 'Invalid userType' });
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const totalEnvelopes = await Envelope.countDocuments(query);
    const completedEnvelopes = await Envelope.countDocuments({ ...query, status: 'completed' });
    const pendingEnvelopes = await Envelope.countDocuments({ ...query, status: 'in-progress' });
    const expiredEnvelopes = await Envelope.countDocuments({ ...query, status: 'expired' });
    const recipientAgg = await Envelope.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalRecipients: { $sum: { $size: { $ifNull: ['$recipientIds', []] } } },
        },
      },
    ]);
    const totalRecipients = recipientAgg.length ? recipientAgg[0].totalRecipients : 0;

    return res.status(200).json({
      totalEnvelopes,
      completedEnvelopes,
      pendingEnvelopes,
      expiredEnvelopes,
      totalRecipients,
    });
  } catch (error) {
    console.error('Error fetching envelope stats:', error);
    return res.status(500).json({ message: 'Internal Server Error', error: error.message });
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

        await sendToAllRecipients(envelope, certBuffer, certFilename, signedPdfBuffer, signedPdfFilename,envelope.sender);

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
  if (!nonSignatureField) {
    return res.status(404).json({ message: 'Field not found' });
  }

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
  }else{
    const turnCheck = await signatureOperationServices.assertSignerTurn(envelopeID, recipientId);
    if (!turnCheck.ok) {
      return res.status(turnCheck.status || 403).json({
        message: turnCheck.message,
        code: turnCheck.code || 'SIGNING_NOT_ALLOWED',
      });
    }
    // Handle regular recipient mode: update the SignatureField directly
    nonSignatureField.signature = fields.value;
    nonSignatureField.status = 'completed';
    await nonSignatureField.save();
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
    RecipientData.authUserId = userId;
    await RecipientData.save();
    return res.status(200).json({ message: 'Recipient linked to user successfully', Recipient });
  }
}

const assignEnvelopeToSomeoneElsePublic = async (req, res) => {
  try {
    const { envelopeId, recipientId, newSignerName, newSignerEmail, reason = '' } = req.body || {};

    if (!envelopeId || !recipientId || !newSignerName || !newSignerEmail) {
      return res.status(400).json({
        message: 'envelopeId, recipientId, newSignerName and newSignerEmail are required'
      });
    }

    const email = String(newSignerEmail).trim().toLowerCase();
    const name = String(newSignerName).trim();
    const assignmentReason = String(reason || '').trim();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: 'Enter a valid email address' });
    }
    if (!name) {
      return res.status(400).json({ message: 'New signer name is required' });
    }

    const envelope = await Envelope.findById(envelopeId);
    if (!envelope) {
      return res.status(404).json({ message: 'Envelope not found' });
    }
    if (String(envelope.status || '').toLowerCase() === 'completed') {
      return res.status(400).json({ message: 'This envelope is already completed' });
    }

    const currentRecipient = await Recipient.findById(recipientId);
    if (!currentRecipient) {
      return res.status(404).json({ message: 'Current recipient not found' });
    }

    const currentPermission = await RecipientPermission.findOne({
      envelopeId: envelope._id,
      recipientId: currentRecipient._id,
    });
    if (!currentPermission) {
      return res.status(404).json({ message: 'Recipient permission not found for this envelope' });
    }
    if (['completed', 'declined'].includes(String(currentPermission.status || '').toLowerCase())) {
      return res.status(400).json({ message: 'This recipient already completed/declined and cannot be reassigned' });
    }

    // Resolve or create the replacement signer recipient.
    let replacementRecipient = await Recipient.findOne({ email });
    if (!replacementRecipient) {
      let recUserId = null;
      try {
        const response = await axios.get(`${process.env.AUTH_URL}/api/find-user/${email}`);
        if (response.data?.data?._id) {
          recUserId = response.data.data._id;
        }
      } catch (_) {
        // best effort; recipient can exist without linked auth user
      }
      replacementRecipient = await Recipient.create({
        UserId: recUserId,
        name,
        email,
      });
    } else if (name && replacementRecipient.name !== name) {
      replacementRecipient.name = name;
      await replacementRecipient.save();
    }

    const originalRole = currentPermission.role || 'signer';
    const originalOrder = typeof currentPermission.order === 'number' ? currentPermission.order : 1;
    const originalStatus = currentPermission.status || 'waiting';
    const originalAuth = Array.isArray(currentPermission.authLevel) ? currentPermission.authLevel : [];

    // Turn current signer into carbon copy so they no longer block/receive signer steps.
    currentPermission.role = 'carbon_copy';
    currentPermission.status = 'completed';
    currentPermission.authLevel = [];
    await currentPermission.save();

    // Add/update permission for replacement signer.
    let replacementPermission = await RecipientPermission.findOne({
      envelopeId: envelope._id,
      recipientId: replacementRecipient._id,
    });

    if (replacementPermission) {
      replacementPermission.role = 'signer';
      replacementPermission.order = originalOrder;
      replacementPermission.authLevel = originalAuth;
      replacementPermission.status = originalStatus;
      await replacementPermission.save();
    } else {
      replacementPermission = await RecipientPermission.create({
        recipientId: replacementRecipient._id,
        envelopeId: envelope._id,
        role: 'signer',
        order: originalOrder,
        status: originalStatus,
        authLevel: originalAuth,
      });
    }

    // Keep both in recipientIds: replacement signer + current as CC.
    const hasReplacement = (envelope.recipientIds || []).some(
      (rid) => String(rid) === String(replacementRecipient._id)
    );
    if (!hasReplacement) {
      envelope.recipientIds.push(replacementRecipient._id);
      await envelope.save();
    }

    // Transfer unsigned signature fields assigned to old recipient to the new signer.
    // Deduplicate by geometry (document/page/x/y/width/height/type) to avoid creating two signature boxes
    // for the same reassigned recipient when the recipient already exists in the envelope.
    const geometryKey = (f) =>
      [
        String(f.documentId ?? ''),
        String(f.page ?? ''),
        String(f.x ?? ''),
        String(f.y ?? ''),
        String(f.width ?? ''),
        String(f.height ?? ''),
        String(f.type ?? ''),
      ].join('|');

    const fieldsToMove = await SignatureField.find({
      envelopeId: envelope._id,
      recipientId: currentRecipient._id,
      type: 'signature',
      status: { $ne: 'completed' },
      signature: { $in: [null, ''] },
    }).lean();

    const existingReplacementSignatureFields = await SignatureField.find({
      envelopeId: envelope._id,
      recipientId: replacementRecipient._id,
      type: 'signature',
    }).lean();

    const existingKeys = new Set(
      existingReplacementSignatureFields.map((f) => geometryKey(f))
    );

    for (const f of fieldsToMove) {
      const key = geometryKey(f);
      if (existingKeys.has(key)) {
        // Replacement already has a signature box here; avoid duplication.
        await SignatureField.deleteOne({ _id: f._id });
      } else {
        existingKeys.add(key);
        await SignatureField.updateOne(
          { _id: f._id },
          { $set: { recipientId: replacementRecipient._id } }
        );
      }
    }

    // Transfer other (non-signature) fields that are still not completed.
    await SignatureField.updateMany(
      {
        envelopeId: envelope._id,
        recipientId: currentRecipient._id,
        type: { $ne: 'signature' },
        status: { $ne: 'completed' },
      },
      { $set: { recipientId: replacementRecipient._id } }
    );

    // Notify sender in in-app notifications.
    try {
      if (envelope.sender) {
        await Notification.create({
          userId: envelope.sender.toString(),
          envelopeId: envelope._id,
          recipientId: replacementRecipient._id,
          recipientName: replacementRecipient.name,
          envelopeSubject: envelope.subject || 'Untitled envelope',
          type: 'signature_completed',
          message: `${currentRecipient.name || currentRecipient.email} reassigned signing to ${replacementRecipient.name} (${replacementRecipient.email})`,
        });
      }
    } catch (notifErr) {
      console.error('Error creating reassignment notification:', notifErr);
    }

    // Send signer link immediately if old recipient was currently in "sent" state.
    try {
      if (String(originalStatus).toLowerCase() === 'sent') {
        const signLink = buildPublicSignerUrl(envelope._id, replacementRecipient._id);
        const html = reassignedSignRequestTemplate({
          recipientName: replacementRecipient.name,
          envelopeSubject: envelope.subject,
          envelopeMessage: envelope.message || '',
          signLink,
          reassignedByName: currentRecipient.name || currentRecipient.email || 'Signer',
          reassignedByEmail: currentRecipient.email || '',
          reassignmentReason: assignmentReason || '',
        });
        await axios.post(`${process.env.EMAIL_SERVICE_URL}/mail/send/${envelope.sender}`, {
          toEmail: replacementRecipient.email,
          subject: `Reassigned signing request: "${envelope.subject}"`,
          html,
        });
      }
    } catch (mailErr) {
      console.error('Error sending reassignment signer email:', mailErr?.message || mailErr);
    }

    // Inform old signer they are now CC (best effort).
    try {
      if (currentRecipient.email && currentRecipient.email !== replacementRecipient.email) {
        const viewLink = `${process.env.FRONTEND_URL}/e-sign/signer/${envelope._id}/${currentRecipient._id}`;
        const html = reassignedOwnerCcTemplate({
          ownerName: currentRecipient.name || 'Signer',
          envelopeSubject: envelope.subject || '',
          replacementRecipientName: replacementRecipient.name || '',
          replacementRecipientEmail: replacementRecipient.email || '',
          reassignmentReason: assignmentReason || '',
          viewLink,
        });
        await axios.post(`${process.env.EMAIL_SERVICE_URL}/mail/send/${envelope.sender}`, {
          toEmail: currentRecipient.email,
          subject: `You are now CC for "${envelope.subject}"`,
          html,
        });
      }
    } catch (mailErr) {
      console.error('Error sending reassignment CC email:', mailErr?.message || mailErr);
    }

    await logActivity(envelope._id, 'RECIPIENT_REASSIGNED', 'Recipient', {
      previousRecipientId: currentRecipient._id,
      previousRecipientEmail: currentRecipient.email,
      newRecipientId: replacementRecipient._id,
      newRecipientEmail: replacementRecipient.email,
      reason: assignmentReason,
    });
    await AuditTrail.create({
      envelopeId: envelope._id,
      recipientId: currentRecipient._id,
      action: 'RECIPIENT_REASSIGNED',
      details: {
        previousRecipientId: currentRecipient._id,
        previousRecipientName: currentRecipient.name || '',
        previousRecipientEmail: currentRecipient.email || '',
        newRecipientId: replacementRecipient._id,
        newRecipientName: replacementRecipient.name || '',
        newRecipientEmail: replacementRecipient.email || '',
        reason: assignmentReason,
      },
      ip: req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '',
      userAgent: req.headers['user-agent'] || '',
      timestamp: new Date(),
    });

    return res.status(200).json({
      status: 'success',
      message: 'Envelope recipient reassigned successfully',
      data: {
        envelopeId: envelope._id,
        previousRecipientId: currentRecipient._id,
        newRecipientId: replacementRecipient._id,
      }
    });
  } catch (error) {
    console.error('assignEnvelopeToSomeoneElsePublic error:', error);
    return res.status(500).json({
      message: 'Failed to assign to someone else',
      error: error.message
    });
  }
};

const declineEnvelopePublic = async (req, res) => {
  try {
    const { envelopeId, recipientId, reason = '' } = req.body || {};
    if (!envelopeId || !recipientId) {
      return res.status(400).json({ message: 'envelopeId and recipientId are required' });
    }

    const declineReason = String(reason || '').trim();
    if (!declineReason) {
      return res.status(400).json({ message: 'Decline reason is required' });
    }

    const envelope = await Envelope.findById(envelopeId);
    if (!envelope) {
      return res.status(404).json({ message: 'Envelope not found' });
    }

    if (envelope.canDecline === false) {
      return res.status(403).json({ message: 'Declining is not allowed for this envelope' });
    }

    const recipient = await Recipient.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ message: 'Recipient not found' });
    }

    const permission = await RecipientPermission.findOne({
      envelopeId: envelope._id,
      recipientId: recipient._id,
    });
    if (!permission) {
      return res.status(404).json({ message: 'Recipient permission not found for this envelope' });
    }

    const currentStatus = String(permission.status || '').toLowerCase();
    if (currentStatus === 'completed') {
      return res.status(400).json({ message: 'Completed recipient cannot decline this envelope' });
    }
    if (currentStatus === 'declined' || String(envelope.status || '').toLowerCase() === 'declined') {
      return res.status(200).json({ status: 'success', message: 'Envelope already declined' });
    }

    permission.status = 'declined';
    if (Array.isArray(permission.authLevel) && permission.authLevel.length > 0) {
      permission.authLevel = permission.authLevel.map((a) => ({
        ...a.toObject?.(),
        status: 'rejected',
      }));
    }
    await permission.save();

    envelope.status = 'declined';
    await envelope.save();

    await logActivity(envelope._id, 'RECIPIENT_DECLINED', 'Recipient', {
      recipientId: recipient._id,
      recipientName: recipient.name || '',
      recipientEmail: recipient.email || '',
      reason: declineReason,
    });

    await AuditTrail.create({
      envelopeId: envelope._id,
      recipientId: recipient._id,
      action: 'RECIPIENT_DECLINED',
      details: {
        recipientId: recipient._id,
        recipientName: recipient.name || '',
        recipientEmail: recipient.email || '',
        reason: declineReason,
      },
      ip: req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '',
      userAgent: req.headers['user-agent'] || '',
      timestamp: new Date(),
    });

    try {
      if (envelope.sender) {
        await Notification.create({
          userId: envelope.sender.toString(),
          envelopeId: envelope._id,
          recipientId: recipient._id,
          recipientName: recipient.name || recipient.email || 'Recipient',
          envelopeSubject: envelope.subject || 'Untitled envelope',
          type: 'signature_completed',
          message: `${recipient.name || recipient.email} declined "${envelope.subject || 'envelope'}"`,
        });
      }
    } catch (notifErr) {
      console.error('Error creating decline notification:', notifErr);
    }

    try {
      if (envelope.sender) {
        let ownerEmail = '';
        try {
          const resp = await axios.get(`${process.env.AUTH_URL}/api/user-details/${envelope.sender}`, {
            headers: req.headers?.authorization ? { Authorization: req.headers.authorization } : {}
          });
          ownerEmail = String(resp?.data?.data?.email || '').trim();
        } catch (_) {
          // best effort only
        }

        if (!ownerEmail) {
          console.warn(`declineEnvelopePublic: sender email unavailable for user ${envelope.sender}`);
        } else {
        const safeReason = declineReason
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#039;');
        const html = `
          <div style="font-family:Segoe UI,Arial,sans-serif;max-width:680px;margin:0 auto;background:#fff;border:1px solid #ececf3;border-radius:10px;overflow:hidden">
            <div style="background:linear-gradient(90deg,#4D0080,#8E2DE2);padding:18px 22px;color:#fff">
              <h2 style="margin:0;font-size:18px;font-weight:600;">Recipient Declined to Sign</h2>
            </div>
            <div style="padding:20px 22px;color:#1f2937;font-size:14px;line-height:1.6">
              <p style="margin:0 0 10px 0;">A recipient has declined your envelope.</p>
              <p style="margin:0;"><strong>Envelope:</strong> ${envelope.subject || 'Untitled envelope'}</p>
              <p style="margin:0;"><strong>Recipient:</strong> ${recipient.name || 'Recipient'} (${recipient.email || 'N/A'})</p>
              <p style="margin:10px 0 0 0;"><strong>Reason:</strong></p>
              <div style="background:#f8f8ff;border-left:4px solid #4D0080;padding:10px 12px;border-radius:4px;margin-top:6px;white-space:pre-wrap">${safeReason}</div>
            </div>
          </div>`;
        await axios.post(`${process.env.EMAIL_SERVICE_URL}/mail/send/${envelope.sender}`, {
          toEmail: ownerEmail,
          subject: `Recipient declined: "${envelope.subject || 'Envelope'}"`,
          html,
        });
        }
      }
    } catch (mailErr) {
      console.error('Error sending decline email to owner:', mailErr?.message || mailErr);
    }

    return res.status(200).json({
      status: 'success',
      message: 'Envelope declined successfully'
    });
  } catch (error) {
    console.error('declineEnvelopePublic error:', error);
    return res.status(500).json({
      message: 'Failed to decline envelope',
      error: error.message
    });
  }
};
// Export functions
// Process scheduled envelopes (to be called by a cron job or worker)
const processScheduledEnvelopes = async () => {
  try {
    // Use UTC date for consistent comparison (MongoDB stores dates in UTC)
    const now = new Date();
    
    // Log for debugging
    // console.log(`[processScheduledEnvelopes] Checking for scheduled envelopes at ${now.toISOString()} (${now.toLocaleString()})`);
    
    // First, find ALL scheduled envelopes for debugging
    const allScheduled = await Envelope.find({
      isScheduled: true,
      status: 'draft'
    }).select('_id scheduledDate subject');
    
    if (allScheduled.length > 0) {
      // console.log(`[processScheduledEnvelopes] Found ${allScheduled.length} scheduled envelope(s) in database:`);
      allScheduled.forEach(env => {
        // Ensure scheduledDate is a proper Date object
        const scheduledDate = env.scheduledDate instanceof Date 
          ? env.scheduledDate 
          : (env.scheduledDate ? new Date(env.scheduledDate) : null);
        
        if (scheduledDate) {
          const timeDiffMs = scheduledDate.getTime() - now.getTime();
          const timeDiffMinutes = Math.round(timeDiffMs / 1000 / 60);
          const timeDiffSeconds = Math.round(timeDiffMs / 1000);
          const isPast = scheduledDate <= now;
          
          console.log(`  - Envelope ${env._id}:`, {
            subject: env.subject,
            scheduledDateUTC: scheduledDate.toISOString(),
            scheduledDateLocal: scheduledDate.toLocaleString('en-IN', { timeZone: 'Asia/Calcutta' }),
            nowUTC: now.toISOString(),
            nowLocal: now.toLocaleString('en-IN', { timeZone: 'Asia/Calcutta' }),
            timeDiffSeconds: timeDiffSeconds,
            timeDiffMinutes: timeDiffMinutes,
            isPast: isPast,
            willProcess: isPast
          });
        }
      });
    }
    
    // Find all envelopes that are scheduled and the scheduled time has passed
    // MongoDB compares dates in UTC, so this should work correctly
    // Using $lte (less than or equal) to include envelopes whose time has arrived
    const query = {
      isScheduled: true,
      status: 'draft',
      scheduledDate: { $lte: now }
    };
    
    // console.log(`[processScheduledEnvelopes] MongoDB query:`, {
    //   isScheduled: true,
    //   status: 'draft',
    //   scheduledDate: { $lte: now.toISOString() },
    //   nowType: typeof now,
    //   nowValue: now.toISOString()
    // });
    
    const scheduledEnvelopes = await Envelope.find(query);

    // console.log(`[processScheduledEnvelopes] MongoDB query found ${scheduledEnvelopes.length} envelope(s) with scheduledDate <= ${now.toISOString()}`);
    
    // Debug: Show what MongoDB returned
    if (scheduledEnvelopes.length > 0) {
      scheduledEnvelopes.forEach(env => {
        const scheduledDate = env.scheduledDate instanceof Date 
          ? env.scheduledDate 
          : new Date(env.scheduledDate);
        // console.log(`[processScheduledEnvelopes] MongoDB returned envelope ${env._id}: scheduledDate=${scheduledDate.toISOString()}, type=${typeof env.scheduledDate}`);
      });
    }
    
    // Additional safety check: filter in memory to ensure dates are truly past
    // This handles any edge cases with date comparison
    const readyToProcess = scheduledEnvelopes.filter(env => {
      const scheduledDate = env.scheduledDate instanceof Date 
        ? env.scheduledDate 
        : new Date(env.scheduledDate);
      const isReady = scheduledDate <= now;
      
      if (!isReady) {
        console.log(`[processScheduledEnvelopes] ⚠️ Envelope ${env._id} filtered out: scheduledDate (${scheduledDate.toISOString()}) > now (${now.toISOString()})`);
      }
      
      return isReady;
    });
    
    // console.log(`[processScheduledEnvelopes] After filtering: ${readyToProcess.length} envelope(s) ready to process`);
    
    // Debug: Log envelope details if any found
    if (readyToProcess.length > 0) {
      readyToProcess.forEach(env => {
        // console.log(`[processScheduledEnvelopes] ✅ Processing Envelope ${env._id}: scheduledDate=${env.scheduledDate?.toISOString()}, now=${now.toISOString()}`);
      });
    }

    for (const envelope of readyToProcess) {
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

    return { processed: readyToProcess.length };
  } catch (error) {
    console.error("Error processing scheduled envelopes:", error);
    throw error;
  }
};

const processAutoReminders = async () => {
  try {
    const now = Date.now();
    const envelopes = await Envelope.find({
      isReminder: true,
      status: 'in-progress',
      reminderInterval: { $gte: 1 },
    });

    let processed = 0;
    for (const envelope of envelopes) {
      const intervalDays = Number(envelope.reminderInterval) || 1;
      const intervalMs = intervalDays * 24 * 60 * 60 * 1000;
      const lastSentAt = envelope.lastReminderSentAt
        ? new Date(envelope.lastReminderSentAt).getTime()
        : new Date(envelope.updatedAt || envelope.createdAt).getTime();

      if (now - lastSentAt < intervalMs) {
        continue;
      }

      await sendReminderEmailsForEnvelope(envelope);
      envelope.lastReminderSentAt = new Date();
      await envelope.save();
      processed += 1;
    }

    return { processed };
  } catch (error) {
    console.error('Error processing auto reminders:', error);
    throw error;
  }
};

const processAutoRemindersHandler = async (req, res) => {
  try {
    const result = await processAutoReminders();
    return res.status(200).json({
      success: true,
      message: `Processed ${result.processed} auto reminder envelope(s)`,
      processed: result.processed,
    });
  } catch (error) {
    console.error('Error in processAutoRemindersHandler:', error);
    return res.status(500).json({
      success: false,
      message: 'Error processing auto reminders',
      error: error.message,
    });
  }
};

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
const fetchBulkEnvelopes = async (req, res) => {
  try {
    const { envelopeIds } = req.body;
    if (!envelopeIds || !Array.isArray(envelopeIds) || envelopeIds.length === 0) {
      return res.status(400).json({ message: "envelopeIds must be a non-empty array." });
    }

    const { filterAccessibleEnvelopeIds } = require('../helpers/envelopeAccess');
    const allowedIds = await filterAccessibleEnvelopeIds(req, envelopeIds);
    if (!allowedIds.length) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const envelopes = await Envelope.find({ _id: { $in: allowedIds } })
      .populate({
        path: 'recipientIds',
        select: 'name email title company createdAt'
      })
      .populate({
        path: 'documentIds',
        select: 'fileName filePath mimeType createdAt'
      })
      .lean();

    const envelopeObjectIds = envelopes.map((e) => e._id);
    const allPermissions = await RecipientPermission.find({
      envelopeId: { $in: envelopeObjectIds }
    })
      .select('envelopeId recipientId status')
      .lean();

    const permsByEnvelope = new Map();
    for (const p of allPermissions) {
      const eid = p?.envelopeId?.toString();
      if (!eid) continue;
      if (!permsByEnvelope.has(eid)) permsByEnvelope.set(eid, []);
      permsByEnvelope.get(eid).push(p);
    }

    // Fallback recipients from permissions when recipientIds is empty.
    const missingRecipientEnvelopeIds = envelopes
      .filter((e) => !Array.isArray(e.recipientIds) || e.recipientIds.length === 0)
      .map((e) => e._id);

    if (missingRecipientEnvelopeIds.length) {
      const perms = await RecipientPermission.find({
        envelopeId: { $in: missingRecipientEnvelopeIds }
      })
        .populate({
          path: 'recipientId',
          select: 'name email title company createdAt'
        })
        .select('envelopeId recipientId')
        .lean();

      const recipientsByEnvelope = new Map();
      perms.forEach((p) => {
        const eid = p.envelopeId?.toString();
        const r = p.recipientId;
        if (!eid || !r) return;
        if (!recipientsByEnvelope.has(eid)) recipientsByEnvelope.set(eid, []);
        const list = recipientsByEnvelope.get(eid);
        if (!list.some((x) => x._id?.toString() === r._id?.toString())) {
          list.push(r);
        }
      });

      envelopes.forEach((e) => {
        if (!Array.isArray(e.recipientIds) || e.recipientIds.length === 0) {
          e.recipientIds = recipientsByEnvelope.get(e._id.toString()) || [];
        }
      });
    }

    // Resolve envelope status from recipient completion where possible.
    envelopes.forEach((e) => {
      const eid = e._id.toString();
      const envPerms = permsByEnvelope.get(eid) || [];
      const permStatusMap = new Map();
      envPerms.forEach((p) => {
        const rid = p?.recipientId?.toString();
        if (!rid) return;
        permStatusMap.set(rid, String(p.status || '').toLowerCase());
      });

      // Attach recipient permission status for downstream consumers.
      if (Array.isArray(e.recipientIds)) {
        e.recipientIds = e.recipientIds.map((r) => {
          const rid = r?._id?.toString?.();
          const st = rid ? permStatusMap.get(rid) : null;
          if (!st) return r;
          return { ...r, permissionStatus: st };
        });
      }

      const base = String(e.status || '').toLowerCase();
      const permStatuses = envPerms
        .map((p) => String(p.status || '').toLowerCase())
        .filter(Boolean);

      let resolved = base || 'draft';
      if (permStatuses.some((s) => s === 'declined' || s === 'rejected')) {
        resolved = 'declined';
      } else if (
        permStatuses.length > 0 &&
        permStatuses.every((s) => s === 'completed' || s === 'signed')
      ) {
        resolved = 'completed';
      } else if (base === 'draft' || base === 'deleted' || base === 'archived') {
        resolved = base;
      } else if (permStatuses.length > 0) {
        resolved = 'in-progress';
      }

      e._computedStatus = resolved;
    });
    return res.status(200).json({ envelopes });
  } catch (error) {
    console.error("Error fetching bulk envelopes:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};
const getEnvelopesExcludingIds = async (req, res) => {
  try {
    const { envelopeIds, organizationId } = req.body;
    const userId = req?.user?.data?.id || req?.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    if (!organizationId) {
      return res.status(400).json({ success: false, message: 'organizationId is required' });
    }

    const headerOrgId = req.headers['x-organization-id'];
    if (headerOrgId && String(headerOrgId) !== String(organizationId)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const query = {
      isOrganization: true,
      organizationId: new mongoose.Types.ObjectId(organizationId),
      sender: userId,
    };

    if (envelopeIds?.length) {
      query._id = {
        $nin: envelopeIds.map(id => new mongoose.Types.ObjectId(id))
      };
    }


    const envelopes = await Envelope.find(query);
    console.log(`Found ${envelopes.length} envelopes excluding provided IDs.`);
    return res.status(200).json({
      success: true,
      data: envelopes
    });

  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};
const downloadCompletionZip = async (req, res) =>{
    try {
    const { cycleId } = req.params;

    const cycle = await Cycle.findById(cycleId).lean();
    if (!cycle) {
      return res.status(404).json({ message: "Cycle not found" });
    }

    const access = await assertEnvelopeDownloadAccess(req, cycle.envelopeId);
    if (!access.ok) {
      return res.status(access.status).json({ message: access.message });
    }

    const certPath = cycle.completionCertificate?.path;
    const signedPath = cycle.signedFilePath;

    if (!certPath || !signedPath) {
      return res.status(400).json({ message: "Completion files not available" });
    }

    if (!fs.existsSync(certPath) || !fs.existsSync(signedPath)) {
      return res.status(404).json({ message: "Files missing on server" });
    }

    res.setHeader(
      "Content-Disposition",
      `attachment; filename=cycle-${cycleId}-completion.zip`
    );
    res.setHeader("Content-Type", "application/zip");

    const archive = archiver("zip", { zlib: { level: 9 } });
    archive.pipe(res);

    archive.file(certPath, { name: "completion-certificate.pdf" });
    archive.file(signedPath, { name: "signed-document.pdf" });

    await archive.finalize();
  } catch (err) {
    console.error("downloadCompletionZip error:", err);
    res.status(500).json({ message: "Server error" });
  }
}
 
// GET /api/e-sign/public/envelope/:envelopeId/recipient/:recipientId/audit-trail
// Used by CC recipients (view-only) to display recipient-level audit timeline, including reassignment events.
const getRecipientAuditTrail = async (req, res) => {
  try {
    const { envelopeId, recipientId } = req.params || {};

    if (!envelopeId || !recipientId) {
      return res.status(400).json({
        status: 'error',
        message: 'envelopeId and recipientId are required'
      });
    }

    const auditTrail = await AuditTrail.find({ envelopeId, recipientId })
      .sort({ timestamp: 1 })
      .lean();

    return res.status(200).json({
      status: 'success',
      auditTrail
    });
  } catch (error) {
    console.error('getRecipientAuditTrail error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch recipient audit trail'
    });
  }
};

const acceptTerms = async (req, res) =>{
  const {recipientId, envelopeId,cycleId, consentVersion} = req.body;
  const disclosureVersion = consentVersion || DEFAULT_CONSENT_VERSIONS.esign_electronic_records;
  const requestMeta = getRequestMeta(req);

  const logTermsAcceptance = async ({ subjectType, subjectObjectId, recipientObjectId, envelopeObjectId, cycleObjectId }) => {
    await recordConsentEntries(req, [{
      consentType: CONSENT_TYPES.ESIGN_ELECTRONIC_RECORDS,
      consentVersion: disclosureVersion,
      granted: true,
      subjectType,
      subjectId: subjectObjectId,
      recipientId: recipientObjectId || null,
      envelopeId: envelopeObjectId || null,
      cycleId: cycleObjectId || null,
      source: cycleObjectId ? CONSENT_SOURCES.POWERFORM : CONSENT_SOURCES.PUBLIC_SIGNER,
      metadata: { disclosure: 'electronic_records_and_signatures' },
    }]);

    if (envelopeObjectId) {
      await logActivity(envelopeObjectId, 'TERMS_ACCEPTED', 'Recipient', {
        recipientId: recipientObjectId,
        consentVersion: disclosureVersion,
        subjectType,
      });
      await AuditTrail.create({
        envelopeId: envelopeObjectId,
        recipientId: recipientObjectId || undefined,
        action: 'TERMS_ACCEPTED',
        details: { consentVersion: disclosureVersion, subjectType },
        ip: requestMeta.ipAddress,
        userAgent: requestMeta.userAgent,
      }).catch(() => {});
    }
  };

    if(!cycleId){
      // Accept Term for Recipient Flow
      try{
        const permission = await RecipientPermission.findOneAndUpdate(
          {
            recipientId,
            envelopeId
          },
          {
            accepted_terms: true
          },
          {
            new: true
          }
        );
        if(!permission){
          return res.status(404).json({success:false, message:"Something went wrong, Please try again later!"});
        }
        await logTermsAcceptance({
          subjectType: SUBJECT_TYPES.RECIPIENT,
          subjectObjectId: recipientId,
          recipientObjectId: recipientId,
          envelopeObjectId: envelopeId,
        });
          return res.status(200).json({success:true, message:"Terms and Conditions accepted."});
      }catch (err){
        console.log(err);
          return res.status(500).json({success:false, message:"Something went wrong, with server!"});
      }
    }else{
      // Accept Term for PowerForm Flow
      try{
        // Find Cycle by Id 
        const cycle = await Cycle.findById(cycleId);
        if(!cycle){
          return res.status(404).json({success:false,message:'Cycle not found'});
        }
        const response = await selfSigner.findOneAndUpdate(
          {
            _id:recipientId,
            envelopeId:cycle?.envelopeId
          },
          {
            accepted_terms:true
          },
          {new:true}
        );
        if(!response){
          return res.status(404).json({success:false, message:"Something went wrong, Please try again later!"});
        }
        await logTermsAcceptance({
          subjectType: SUBJECT_TYPES.SELF_SIGNER,
          subjectObjectId: recipientId,
          recipientObjectId: recipientId,
          envelopeObjectId: cycle?.envelopeId,
          cycleObjectId: cycleId,
        });
        return res.status(200).json({success:true, message:"Terms and Conditions accepted."});
      }catch(err){
        console.log(err);
        return res.status(500).json({success:false,message:"Something went wrong, with server!"})
      }
    }
}
const fetchCurrentRecipient = async (req, res) =>{
  const {cycleId, currentRecipientId} = req.body;
  if(cycleId){
    const response = await selfSigner.findById(currentRecipientId);
    if(!response){
      return res.status(404).json({success:false,message:'Current recipient not found'});
    }
    return res.status(200).json({success:true,currentRecipient:response});
  }
}
const validateRecipient = async (req, res) =>{
  const {signatureMethod, currentUserId, selfValue} = req.body;
  if (!signatureMethod || !currentUserId) {
    return res.status(400).json({
      success: false,
      message: 'signatureMethod and currentUserId are required',
    });
  }
  let mode= "";
  if(selfValue === "1" || selfValue === 1){
    mode = "Self_Signer";
  }else{
    mode = "Recipient";
  }
  let result;
  switch (mode){
    case "Self_Signer" :
      return res.status(400).json({
        success: false,
        message: 'Self-signer validation is not supported on this endpoint',
      });
    case "Recipient" :
      const data = {
        recipientId:currentUserId
      }
      try{
        const validator = signingServices.validate?.[signatureMethod];
        if (typeof validator !== 'function') {
          return res.status(400).json({
            success: false,
            message: `Unsupported signature method: ${signatureMethod}`,
          });
        }
        result  = await validator(data);
        return res.status(200).json({
          success: true,
          data: result
        });
      }catch (err){
        console.log(err);
        return res.status(400).json({
          success: false,
          message: err?.message || 'Recipient validation failed',
        });
      }
    default:
      return res.status(400).json({ success: false, message: 'Invalid validation mode' });
  }
}
async function payloadForPreparePDF(AllFields,withSignatureFlag,documentPath){

  let fildData = [];
  const fileBase64 = await pdfToBase64(documentPath);
  if(withSignatureFlag){
        fildData = AllFields
                  .filter(field => field.type!=="signature")
                  .map(field =>({
                  fieldId: field._id,
                  page: field.page,
                  x: field.x,
                  y: field.y,
                  width: field.width,
                  height: field.height,
                  type: field.type,
                  label: field.label,
                  }));
  }else{
        fildData = AllFields
              .filter(field => field.type!=="signature")
              .map(field =>({
              fieldId: field._id,
              page: field.page,
              x: field.x,
              y: field.y,
              width: field.width,
              height: field.height,
              type: field.type,
              label: field.label,
              }));
  }
  return {
    pdfBase64: fileBase64,
    fields: fildData
  }

}
async function payloadForEmbedFieldsValue(AllFields, documentId, recipientId, withSignatureFlag){
  const Documents = await Document.findById(documentId);
  const documentPath = Documents?.preparedDoc;
  const fileBase64 = await pdfToBase64(documentPath);
  try{
    let fieldValues = [];
    if(withSignatureFlag){
      fieldValues = AllFields
                 .filter(field => field.recipientId && field.recipientId.toString() === recipientId.toString())
                  .map(field =>({
                    fieldId: field?._id,
                    value: field?.signature,
                  }));

    }else{
        fieldValues = AllFields
              .filter(field => field.recipientId && field.recipientId.toString() === recipientId.toString())
              .filter(field => field.type !== "signature")
              .map(field =>({
                fieldId: field?._id,
                value: field?.signature,
              }));
    }
    return{
      pdfBase64: fileBase64,
      fieldValues
    }
  }catch (err){
    console.log(err);
    throw new Error("Error occurred while preparing payload for embedding fields value to PDF");
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
  processAutoReminders,
  processAutoRemindersHandler,
  addSignature,
  addDigitalSignatureForRecipient,
  addDigitalSignatureForSelfSigner,
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
  LinkUserRecipient,
  assignEnvelopeToSomeoneElsePublic,
  declineEnvelopePublic,
  fetchBulkEnvelopes,
  getEnvelopesExcludingIds,
  downloadCompletionZip,
  acceptTerms,
  fetchCurrentRecipient,
  getRecipientAuditTrail,
  completeSignature,
  validateRecipient
};
