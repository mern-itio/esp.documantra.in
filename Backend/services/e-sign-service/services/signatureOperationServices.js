const Document = require("../models/Document");
const RecipientPermission = require("../models/RecipientPermission");
const SignatureFields = require("../models/SignatureFields");
const fs = require('fs');
const path = require('path');

const NON_SIGNING_ROLES = new Set(['carbon_copy', 'cc', 'in_person_signer']);

function isSigningRole(role) {
  const r = String(role || '').toLowerCase().trim();
  return r && !NON_SIGNING_ROLES.has(r);
}

async function assertSignerTurn(envelopeId, recipientId) {
  const permission = await RecipientPermission.findOne({ envelopeId, recipientId });
  if (!permission) {
    return { ok: false, status: 404, message: 'Recipient not found for this envelope' };
  }

  if (!isSigningRole(permission.role)) {
    return { ok: false, status: 403, message: 'This recipient is not allowed to sign' };
  }

  const status = String(permission.status || '').toLowerCase();
  if (status === 'completed') {
    return { ok: false, status: 403, message: 'You have already completed signing for this envelope' };
  }
  if (status === 'declined') {
    return { ok: false, status: 403, message: 'Signing was declined for this envelope' };
  }
  if (status === 'waiting') {
    return {
      ok: false,
      status: 403,
      message: 'It is not your turn to sign yet. Please wait for the previous signer to finish.',
      code: 'WAITING_FOR_TURN',
    };
  }
  if (status !== 'sent') {
    return { ok: false, status: 403, message: 'You are not authorized to sign at this time' };
  }

  const Envelope = require('../models/Envelope');
  const envelope = await Envelope.findById(envelopeId).lean();
  const isParallel = String(envelope?.signingOrder || '').toLowerCase() === 'parallel';

  if (!isParallel) {
    const priorIncomplete = await RecipientPermission.findOne({
      envelopeId,
      order: { $lt: permission.order ?? 0 },
      role: { $nin: Array.from(NON_SIGNING_ROLES) },
      status: { $ne: 'completed' },
    });
    if (priorIncomplete) {
      return {
        ok: false,
        status: 403,
        message: 'Please wait for previous signers to complete before you sign.',
        code: 'WAITING_FOR_TURN',
      };
    }
  }

  return { ok: true, permission };
}

async function markFieldAsCompleted(fieldId) {
  try {
    const field = await SignatureFields.findById(fieldId);
    if (!field) {
      console.error(`Field with ID ${fieldId} not found`);
      return;
    }
    field.status = "completed";
    await field.save();
    console.log(`Field ${fieldId} marked as completed`);
  } catch (err) {
    console.error(`Error marking field ${fieldId} as completed:`, err);
  }
}
async function markAllFieldsOfRecipientAsCompleted(envelopeId, recipientId, documentId, signBase64) {
  try{
    const result = await SignatureFields.updateMany(
        { envelopeId: envelopeId, recipientId: recipientId, documentId: documentId },
        { $set: { status: "completed", signature: signBase64 } }
    );
    return result;
  }catch (err){
    console.error(`Error marking all fields of recipient ${recipientId} as completed for envelope ${envelopeId} and document ${documentId}:`, err);
    return false;
  }
}
async function fetchPendingFields(envelopeId) {
  try {
    const pendingFields = await SignatureFields.find({ envelopeId: envelopeId, status: "pending" });
    return pendingFields;
  } catch (err) {
    console.error(`Error fetching pending fields for envelope ${envelopeId}:`, err);
    return [];
  }
}
async function fetchPendingFieldsByRecipient(envelopeId, recipientId) {
  try {
    const pendingFields = await SignatureFields.find({
        envelopeId: envelopeId,
        recipientId: recipientId,
        status: "pending"
    });
    return pendingFields;
  } catch (err) {
    console.error(`Error fetching pending fields for envelope ${envelopeId} and recipient ${recipientId}:`, err);
    return [];
  }
}
async function markRecipientAsCompleted(envelopeId, recipientId, signingEvidence = null) {
    try{
        const recipient  = await RecipientPermission.findOne({ envelopeId: envelopeId, recipientId: recipientId });
        if (!recipient) {
            console.error(`Recipient with ID ${recipientId} not found for envelope ${envelopeId}`);
            return false;
        }
        recipient.status = "completed";
        if (signingEvidence && typeof signingEvidence === 'object') {
          recipient.signingEvidence = signingEvidence;
        }
        await recipient.save();
        return recipient;
    }catch (err){
        console.error(`Error marking recipient ${recipientId} as completed for envelope ${envelopeId}:`, err);
    }
}
async function fetchRecipientAllFields(envelopeId, recipientId,documentId){
  try{
    const allFields = await SignatureFields.find({
        envelopeId: envelopeId,
        recipientId: recipientId,
        documentId: documentId
    });
    return allFields;
  }catch(err){
    console.error(`Error fetching all fields for recipient ${recipientId} in envelope ${envelopeId} and document ${documentId}:`, err);
    return [];
  }
}
async function updateDocumentWithSignedPdf(documentId, signedPdfPath){
  try{
    const docRecord = await Document.findById(documentId);
    if(!docRecord){
      console.error(`Document with ID ${documentId} not found`);
      return;
    }
    const finalPath = signedPdfPath.replace(".pdf", "Final.pdf");
    docRecord.preparedDoc = finalPath;
    docRecord.signedFileName = path.basename(finalPath);
    docRecord.signedFilePath = finalPath;
    docRecord.signedFileSize = fs.statSync(finalPath).size;
    await docRecord.save();
    return docRecord;
  }
  catch(err){
    console.error(`Error updating document ${documentId} with signed PDF path:`, err);
  }
}
async function updateDocument(documentId,paylad){
  try{
    const updatedDoc = await Document.findByIdAndUpdate(
        documentId,
        { $set: paylad },
        { new: true }
    );
    return updatedDoc;
  }catch(err){
    console.error(`Error updating document ${documentId} with payload:`, err);

  }
}
async function pendingRecipients(envelopeId) {
  const penRecipient = await RecipientPermission.find({
    envelopeId,
    status: { $in: ['waiting', 'sent'] },
    role: { $nin: Array.from(NON_SIGNING_ROLES) },
  });
  return penRecipient;
}

async function allSigningRecipientsCompleted(envelopeId) {
  const pending = await pendingRecipients(envelopeId);
  return pending.length === 0;
}
async function fetchAllFieldsOfDocument(envelopeId, documentId){
  try{
    const allFields = await SignatureFields.find({
        envelopeId: envelopeId,
        documentId: documentId
    });
    return allFields;
  }catch(err){
    console.error(`Error fetching all fields for document ${documentId} in envelope ${envelopeId}:`, err);
    return [];
  } 
}
module.exports = {
  markFieldAsCompleted,
  fetchPendingFields,
  fetchPendingFieldsByRecipient,
  markRecipientAsCompleted,
  fetchRecipientAllFields,
  markAllFieldsOfRecipientAsCompleted,
  updateDocumentWithSignedPdf,
  pendingRecipients,
  allSigningRecipientsCompleted,
  assertSignerTurn,
  fetchAllFieldsOfDocument,
  updateDocument
};
