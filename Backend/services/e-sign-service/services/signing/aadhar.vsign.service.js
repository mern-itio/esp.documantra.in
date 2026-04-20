const fs = require('fs');
const path = require('path');
const axios = require('axios');
const Document = require('../../models/Document');
const signatureTransactions = require('../../models/signatureTransactions');
const VUTILITY = process.env.UTILITY_URL || 'http://localhost:7077';
const VSIGN_AUTHPAGE = process.env.VSIGN_AUTHPAGE || "https://esignuat.vsign.in/esp";
const ASP_ID = process.env.ASP_ID || "IIPLUAT001";
const signatureOperationServices = require("../signatureOperationServices");
const { fetchRecipientById } = require("../recipientService")
module.exports = {
  aadhaarSignature: async (data) => {
    const { documentId, recipientId, fieldId, signatureImageBase64,envelopeId } = data;
    const time = Date.now();// Use timestamp to generate unique file names and transaction IDs
    // GET DOCUMENT
    const recipient = await fetchRecipientById(recipientId);
    const docRecord = await Document.findById(documentId);// Fetch document record to get file path for signing
    if (!docRecord) return res.status(404).json({ message: "Document not found" });
    // GET ALL FIELDS
    const allFields  = await signatureOperationServices.fetchRecipientAllFields(envelopeId, recipientId,documentId);// Fetch all fields of recipient to get co-ordinates for placing signature in case of multiple signature fields for same recipient. Also required for generating signaturedetailsString for V-Sign in case of multiple fields.
    const signaturedetailsString = allFields.filter(f => f.type === 'signature').map(s => `${s.page}-${s.x},${s.y},250,60`).join(";");// Generate signaturedetailsString in format "page-x,y,width,height;page-x,y,width,height"
    const baseDir = path.join(__dirname, '../..', 'uploads');// Base directory for all file operations, adjust as needed
    const imgPath = path.join(baseDir, 'signImages', `sign_${recipientId}.png`);    // Save Signature Image
    const cleanBase64 = signatureImageBase64.replace(/^data:image\/\w+;base64,/, '');

    fs.writeFileSync(
      imgPath,
      Buffer.from(cleanBase64, 'base64')
    );
    const pdfPath = docRecord?.preparedDoc;// Fetch PDF file path from document record
    const signedPdfPath = path.join(baseDir, 'signed',envelopeId.toString());// Base directory for storing signed PDFs
    const tempInfoPath = path.join(baseDir, 'vSignTemp');// Base directory for temporary V-Sign information
    const SignedfileName = `${time}-signed-${documentId}.pdf`;// Unique name for the signed PDF
    const pdfDestinationPath = path.join(baseDir, 'signed',envelopeId, SignedfileName);// Final destination path for the signed PDF
    const responseUrl = process.env.VSIGN_CALLBACK_URL || "http://localhost:2103/api/e-sign/public/v-sign/response";
    const txn = `${Date.now()}`; // TRANSACTION ID
    const pfxPath = path.join(baseDir, 'vSign', 'signCertificate.pfx');
    const pfxPassword = process.env.PFX_PASSWORD || "abc1234";
    const pfxAlias = process.env.PFX_ALIAS || "{05AE2E10-4F6D-41A6-9F83-4D0025CA28A0}";
    const signingAlgorithm = "RSA";
    const maxWaitPeriod = "1440";
    const ver = "21";
    const AuthMode = "1";
    const fileType = "path";
    const isresponseXML = "0";
    const isrequestXML = "0";
    const pdfdetails = [
      {
        pdfbase64val:pdfPath,
        docInfo:SignedfileName,
        docUrl:"",
        reason:`Signature for ${recipient?.name}`,
        signaturedetails:"",
        signaturedetailsType:"signaturedetailsString",
        signaturedetailsString:signaturedetailsString
      }
    ];
    const payload = {
      signedPdfPath:signedPdfPath,
      tempInfoPath:tempInfoPath,
      pdfDestinationPath:pdfDestinationPath,
      responseUrl:responseUrl,
      txn:txn,
      aspId:ASP_ID,
      pfxPath:pfxPath,
      pfxPassword:pfxPassword,
      pfxAlias:pfxAlias,
      signingAlgorithm:signingAlgorithm,
      maxWaitPeriod:maxWaitPeriod,
      ver:ver,
      AuthMode:AuthMode,
      fileType:fileType,
      isresponseXML:isresponseXML,
      isrequestXML:isrequestXML,
      pdfdetails:pdfdetails
    };
    const response =  await axios.post(`${VUTILITY}/gettxnrefv4_1`, payload);
    const resData = response?.data;
    if(resData?.status == "1"){
        // Create Transaction Record with txnRef with other details like documentId, recipientId, fieldId, envelopeId,signedFilePath etc for future reference.
        const signatureTransaction = new signatureTransactions({
            txn: txn,
            txnRef: resData.txnref,
            documentId: documentId,
            recipientId: recipientId,
            fieldId: fieldId,
            envelopeId: envelopeId,
            signedFilePath: pdfDestinationPath,
            signatureImage: imgPath,
            signBase64: signatureImageBase64
        });
        await signatureTransaction.save();
        const aadhaarNumber = recipient?.aadhaarNumber; // REPLACE WITH ACTUAL AADHAAR NUMBER
        const txnRef = resData.txnref;
        const rowAuthParams = `-|-|${aadhaarNumber}`;
        const base64AuthParams = Buffer.from(rowAuthParams).toString('base64');
        const authUrl = `${VSIGN_AUTHPAGE}/${base64AuthParams}/authpagev4`;
        return {
        status:200,
        response:
            {
                success:true,
                signMethod:"V_Sign",
                message: "V-Sign process initiated",
                authUrl: authUrl,
                txnRef:txnRef
            }
        };
   }
  },
  appendSignature: async (data) => {
    const {tempInfoPath, signedFileParentPath, responseXML, pdfDestinationPath, signatureImagePath, aspLogo, signatureFontSize} = data;
    const base64XML = Buffer.from(responseXML).toString('base64');
    const payload = {
      tempInfoPath: tempInfoPath,
      signedFileParentPath: signedFileParentPath,
      responseXML: base64XML,
      pdfDestinationPath: pdfDestinationPath,
      tickImgPath: signatureImagePath,
      aspLogo: aspLogo,
      signatureFontSize: signatureFontSize
    };
    try{
      const response = await axios.post(`${VUTILITY}/signpdfv4_1`, payload);
      console.log("Append Signature Response:", response.data);
      return response.data;
    }catch (err){
        console.error("Error in appendSignature:", err);
    }
  }

};