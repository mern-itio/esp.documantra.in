const Document = require("../models/Document");
const RecipientPermission = require("../models/RecipientPermission");
const SignatureFields = require("../models/SignatureFields");
const fs = require('fs');
const path = require('path');

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
async function markRecipientAsCompleted(envelopeId, recipientId) {
    try{
        const recipient  = await RecipientPermission.findOne({ envelopeId: envelopeId, recipientId: recipientId });
        if (!recipient) {
            console.error(`Recipient with ID ${recipientId} not found for envelope ${envelopeId}`);
            return false;
        }
        recipient.status = "completed";
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
async function pendingRecipients(envelopeId){
  const penRecipient = await RecipientPermission.find({
    envelopeId:envelopeId,
    status: { $ne: 'completed' }
  });
  return penRecipient;
}
module.exports = {
  markFieldAsCompleted,
  fetchPendingFields,
  fetchPendingFieldsByRecipient,
  markRecipientAsCompleted,
  fetchRecipientAllFields,
  markAllFieldsOfRecipientAsCompleted,
  updateDocumentWithSignedPdf,
  pendingRecipients
};
