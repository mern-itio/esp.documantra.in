const fs = require('fs');
const path = require('path');

const SignatureFields = require('../models/SignatureFields');
const Document = require('../models/Document');

const VUTILITY = "http://localhost:7077";
const VSIGN_AUTHPAGE = "https://esignuat.vsign.in/esp/authpage";
const ASP_ID = "IIPLUAT001";

const Sessions = {};

// Ensure folder exists
function ensureDir(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// ----------------------------------
// START ESIGN
// ----------------------------------
exports.startEsign = async (req, res) => {
  try {
    const { documentId, recipientId, fieldId, signatureImageBase64 } = req.body;

    // GET DOCUMENT
    const docRecord = await Document.findById(documentId);
    if (!docRecord) return res.status(404).json({ message: "Document not found" });

    // GET FIELD
    const field = await SignatureFields.findById(fieldId);
    if (!field) return res.status(400).send("Invalid field");

    // -----------------------------
    // PATHS (KEEP SIMPLE IF POSSIBLE)
    // -----------------------------
    const baseDir = path.join(__dirname, '..', 'uploads');

    const imgPath = path.join(baseDir, 'signImages', `sign_${recipientId}.png`);
    const tempInfoPath = path.join(baseDir, 'vSignTemp', `signinfo_${recipientId}.txt`);
    const signedFolder = path.join(baseDir, 'signData');
    const pfxPath = path.join(baseDir, 'vSign', 'signCertificate.pfx');

    // Ensure directories
    ensureDir(imgPath);
    ensureDir(tempInfoPath);
    if (!fs.existsSync(signedFolder)) {
      fs.mkdirSync(signedFolder, { recursive: true });
    }

    // SAVE SIGNATURE IMAGE
    fs.writeFileSync(imgPath, Buffer.from(signatureImageBase64, 'base64'));

    // TRANSACTION ID
    const txn = `${documentId}_${recipientId}_${Date.now()}`;

    // SAVE SESSION
    Sessions[txn] = {
      documentId,
      recipientId,
      fieldId,
      tempInfoPath,
      signedFolder
    };

    // -----------------------------
    // DEBUG LOG
    // -----------------------------
    console.log("Calling gettxnrefv4 with:");
    console.log({
      pdf: docRecord.filePath,
      pfx: pfxPath,
      temp: tempInfoPath,
      signed: signedFolder,
      img: imgPath
    });

    // -----------------------------
    // CALL VUTILITY
    // -----------------------------
    const response = await fetch(`${VUTILITY}/gettxnrefv4`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        aspId: ASP_ID,
        ver: "2.1",
        txn,
        AuthMode: "1",
        signingAlgorithm: "SHA256",
        maxWaitPeriod: "1440",

        tempInfoPath,
        responseUrl: "http://localhost:2103/api/e-sign/public/v-sign/response",

        pfxPassword: "abc1234", // 🔴 CHANGE THIS
        pfxPath,
        pfxAlias: "05AE2E10-4F6D-41A6-9F83-4D0025CA28A0",

        isrequestXML: "1",
        isresponseXML: "1",

        signedPdfPath: signedFolder,

        fileType: "path",
        signerName: "Signer",

        tickImgPath: imgPath,

        pdfdetails: [
          {
            pdfbase64val: docRecord.filePath,   // ✔ DO NOT CHANGE
            docInfo: path.basename(docRecord.filePath),
            docUrl: "",                         // ✔ REQUIRED
            reason: "Signed via system",
            pagenos: String(field.page),        // ✔ REQUIRED

            signaturedetailsType: "signaturedetails", // ✔ REQUIRED

            signaturedetails: [
              {
                page: String(field.page),
                coordinates: [
                  {
                    x: String(field.x),
                    y: String(field.y),
                    w: String(field.width),
                    h: String(field.height)
                  }
                ]
              }
            ]
          }
        ]
      })
    });

    // -----------------------------
    // HANDLE RESPONSE SAFELY
    // -----------------------------
    const text = await response.text();

    console.log("Utility response status:", response.status);
    console.log("Utility raw response:", text);

    if (!text) {
      return res.status(500).json({
        message: "Empty response from VSign utility",
        hint: "Check PFX, paths, alias, or utility logs"
      });
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch (err) {
      return res.status(500).json({
        message: "Invalid JSON from VSign utility",
        raw: text
      });
    }

    console.log("gettxnrefv4 parsed response:", data);

    if (data.status !== "1") {
      return res.status(500).json(data);
    }

    // SEND TO FRONTEND
    return res.json({
      txnref: data.txnref,
      authUrl: VSIGN_AUTHPAGE
    });

  } catch (err) {
    console.error(err);
    res.status(500).send("start-esign error");
  }
};

// ----------------------------------
// RESPONSE HANDLER
// ----------------------------------
exports.esignResponse = async (req, res) => {
  try {
    const { responseXML, txn } = req.body;

    const session = Sessions[txn];
    if (!session) return res.status(400).send("Invalid txn");

    // -----------------------------
    // CALL SIGN PDF
    // -----------------------------
    const signResp = await fetch(`${VUTILITY}/signpdfv4`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tempInfoPath: session.tempInfoPath,
        signedFileParentPath: session.signedFolder,
        responseXML
      })
    });

    const text = await signResp.text();

    console.log("signpdfv4 raw response:", text);

    if (!text) {
      return res.status(500).send("Empty response from signpdfv4");
    }

    let signData;
    try {
      signData = JSON.parse(text);
    } catch (err) {
      return res.status(500).send("Invalid JSON from signpdfv4");
    }

    console.log("signpdfv4 parsed response:", signData);

    if (signData.status !== "1") {
      return res.status(500).json(signData);
    }

    // UPDATE DOCUMENT
    const doc = await Document.findById(session.documentId);
    doc.filePath = signData.signDocumentPath1;
    await doc.save();

    res.send("Signed successfully");

  } catch (err) {
    console.error(err);
    res.status(500).send("response error");
  }
};