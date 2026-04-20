const xml2js = require("xml2js");
const signatureTransactions = require("../models/signatureTransactions");
const signatureOperationServices = require("../services/signatureOperationServices");
const signingServices = require("../services/signing");
const path = require('path');
exports.esignResponse = async (req, res) => {
  try {
    const response = req.body;
    const responseXML = response?.msg;
    let txn;
    xml2js.parseString(responseXML, (err, result) => {
      if (err) {
        console.error("XML Parse Error:", err);
        return;
      }
      txn = result.EsignResp.$.txn;
    });
    const baseDir = path.join(__dirname,'..','uploads');
    const transactionRecord = await signatureTransactions.findOne({ txn: txn });
      if (!transactionRecord) {
        console.error(`Transaction with txn ${txn} not found`);
        return res.status(404).send("Transaction not found");
      }
    const { envelopeId, recipientId, documentId, signBase64,fieldId } = transactionRecord;
    const tempInfoPath = path.join(baseDir, 'vSignTemp');
    const signedFileParentPath = path.join(baseDir, 'signed',envelopeId.toString());
    const pdfDestinationPath = transactionRecord.signedFilePath;
    const signatureImagePath = transactionRecord.signatureImage;
    const aspLogo = path.join(baseDir, 'Logo.png');
    const signatureFontSize = 14;
    // Append Signature on PDF
    const appendSignatureResult = await signingServices.vSign.appendSignature({
      tempInfoPath,
      signedFileParentPath,
      responseXML,
      pdfDestinationPath,
      signatureImagePath,
      aspLogo,
      signatureFontSize
    });
    if(appendSignatureResult?.status !== "1"){
      console.error("Error appending signature:", appendSignatureResult);
      return res.status(500).send("Error appending signature");
    }
    await signatureOperationServices.markAllFieldsOfRecipientAsCompleted(envelopeId, recipientId, documentId, signBase64);// Mark all Signature field as completed
    await signatureOperationServices.updateDocumentWithSignedPdf(documentId, pdfDestinationPath);// Update document collection with signed pdf path and other details.
    const pendingFields = await signatureOperationServices.fetchPendingFields(envelopeId);//Fetch All Pending fileds of Envelope
    if (pendingFields.length === 0) {
      const payload = encodeURIComponent(JSON.stringify({
        status: 200,
        success:true,
        message: "All fields completed. Redirecting to signing complete page.",
        fieldRemmaining: false,
        fieldId
      }));
      res.redirect(`${process.env.FRONTEND_URL}/e-sign/signer/${envelopeId}/${recipientId}?data=${payload}`);
    } else {  
      // Check if current recipient has any pending fields
      const pendingFieldsForRecipient = await signatureOperationServices.fetchPendingFieldsByRecipient(envelopeId, recipientId);
      const remainingFields = pendingFieldsForRecipient.length > 0;
      const payload = encodeURIComponent(JSON.stringify({
        status: 200,
        success:true,
        message: "All fields completed. Redirecting to signing complete page.",
        fieldRemmaining: remainingFields
      }));
     return res.redirect(`${process.env.FRONTEND_URL}/e-sign/signer/${envelopeId}/${recipientId}?data=${payload}`);
    } 
  } catch (err) {
    console.error(err);
    return res.status(500).send("response error");
  }
};