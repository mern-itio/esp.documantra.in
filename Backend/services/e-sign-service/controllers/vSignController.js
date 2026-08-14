const util = require('util');
const xml2js = require('xml2js');
const path = require('path');
const signatureTransactions = require('../models/signatureTransactions');
const signatureOperationServices = require('../services/signatureOperationServices');
const signingServices = require('../services/signing');
const RecipientPermission = require('../models/RecipientPermission');
const SignatureFields = require('../models/SignatureFields');
const { mergeSigningEvidence, sanitizeSigningEvidence } = require('../utils/signingEvidenceHelper');
const {
  VSIGN_REFERENCE_APPEARANCE,
  buildVSignAppearanceExtras,
  stageVSignAppearanceAssets,
  resolveVSignSignatureFontSizeForBox,
} = require('../utils/vsignAssets');

const parseStringPromise = util.promisify(xml2js.parseString);
const serviceRoot = path.join(__dirname, '..');

function resolveFrontendUrl() {
  return (process.env.FRONTEND_URL || 'http://127.0.0.1:5173').replace(/\/+$/, '');
}

function extractResponseXml(req) {
  const body = req.body || {};
  const bodyValues =
    body && typeof body === 'object' && !Array.isArray(body) ? Object.values(body) : [];

  const candidates = [
    body.msg,
    body.Msg,
    body.response,
    body.responseXML,
    body.ResponseXML,
    req.query?.msg,
    typeof req.body === 'string' ? req.body : null,
    req.vsignRawBody && Buffer.isBuffer(req.vsignRawBody) ? req.vsignRawBody.toString('utf8') : null,
    ...bodyValues,
  ];

  for (const raw of candidates) {
    if (raw == null) continue;
    let str = String(raw).trim();
    if (!str) continue;

    if (str.startsWith('%3C') || str.startsWith('%3c')) {
      try {
        str = decodeURIComponent(str);
      } catch (_) {
        // keep original
      }
    }

    if (str.startsWith('<')) return str;

    try {
      if (/^[A-Za-z0-9+/=\s]+$/.test(str) && str.length > 40) {
        const decoded = Buffer.from(str.replace(/\s/g, ''), 'base64').toString('utf8').trim();
        if (decoded.startsWith('<') || /esignresp/i.test(decoded)) return decoded;
      }
    } catch (_) {
      // not base64 XML
    }

    if (/esignresp/i.test(str)) return str;
  }
  return null;
}

function extractTxnFromParsedXml(result) {
  if (!result || typeof result !== 'object') return null;

  const esignRespKey = Object.keys(result).find((key) => /esignresp/i.test(key));
  const esignResp =
    result.EsignResp ||
    result['es:EsignResp'] ||
    result.ESignResp ||
    (esignRespKey ? result[esignRespKey] : null);
  const node = Array.isArray(esignResp) ? esignResp[0] : esignResp;
  if (!node) return null;

  if (node.$?.txn) return String(node.$.txn);
  if (typeof node.txn === 'string') return node.txn;
  if (node.txn?._) return String(node.txn._);
  return null;
}

async function extractTxnFromRequest(req, responseXML) {
  if (responseXML) {
    try {
      const result = await parseStringPromise(responseXML, {
        explicitArray: false,
        attrkey: '$',
        trim: true,
      });
      const txn = extractTxnFromParsedXml(result);
      if (txn) return txn;
    } catch (err) {
      console.warn('[VSign callback] XML parse for txn failed:', err.message);
    }
  }

  const body = req.body || {};
  const txnCandidates = [
    req.query?.txn,
    req.query?.transactionId,
    body.txn,
    body.transactionId,
    body.txnId,
  ];
  for (const candidate of txnCandidates) {
    if (candidate != null && String(candidate).trim()) {
      return String(candidate).trim();
    }
  }

  // isresponseXML=0: ESP stores response in utility temp; browser redirect may have empty msg.
  const recent = await signatureTransactions.findOne().sort({ _id: -1 });
  if (recent?.txn) {
    console.log('[VSign callback] resolved txn from latest transaction record:', recent.txn);
    return recent.txn;
  }
  return null;
}

async function completeVSignSigning(transactionRecord, responseXML, res) {
  const { envelopeId, recipientId, documentId, fieldId } = transactionRecord;
  const baseDir = path.join(__dirname, '..', 'uploads');
  const tempInfoPath = path.join(baseDir, 'vSignTemp');
  const signedFileParentPath = path.join(baseDir, 'signed', envelopeId.toString());
  const pdfDestinationPath = transactionRecord.signedFilePath;
  const appearance = stageVSignAppearanceAssets(
    serviceRoot,
    tempInfoPath,
    {
      tickImgPath: transactionRecord.tickImgPath || buildVSignAppearanceExtras(serviceRoot).tickImgPath,
      ...(transactionRecord.aspLogo ? { aspLogo: transactionRecord.aspLogo } : {}),
    },
  );
  const { tickImgPath, aspLogo } = appearance;
  const signatureFontSize =
    transactionRecord.signatureFontSize
    || VSIGN_REFERENCE_APPEARANCE.fontSize
    || resolveVSignSignatureFontSizeForBox(transactionRecord.appearanceHeight, serviceRoot);

  const appendSignatureResult = await signingServices.vSign.appendSignature({
    tempInfoPath,
    signedFileParentPath,
    responseXML: responseXML || '',
    pdfDestinationPath,
    signatureFontSize,
    tickImgPath,
    ...(aspLogo ? { aspLogo } : {}),
    txn: transactionRecord.txn,
    txnRef: transactionRecord.txnRef,
  });

  if (appendSignatureResult?.status !== '1') {
    console.error('[VSign callback] Error appending signature:', appendSignatureResult);
    return res.status(500).send('Error appending signature');
  }

  const verifiedAt = new Date();
  const permission = await RecipientPermission.findOne({ envelopeId, recipientId });
  const signedField = await SignatureFields.findOne({
    envelopeId,
    recipientId,
    documentId,
    type: 'signature',
  });

  if (permission) {
    permission.signingEvidence = sanitizeSigningEvidence(
      mergeSigningEvidence(permission.signingEvidence || {}, {
        aadhaarVerifiedAt: verifiedAt,
        vsignVerifiedAt: verifiedAt,
        handwrittenSignature:
          signedField?.signature || permission.signingEvidence?.handwrittenSignature || '',
        signCompletedAt: permission.signingEvidence?.signCompletedAt || verifiedAt,
        authMethods: [
          {
            authMethodId: 'aadhaar-esign',
            name: 'Aadhaar eSign',
            type: 'aadhaar',
            status: 'completed',
            completedAt: verifiedAt,
          },
        ],
      }),
    );
    await permission.save();
  }

  await signatureOperationServices.markAllFieldsOfRecipientAsCompleted(
    envelopeId,
    recipientId,
    documentId,
    (
      await SignatureFields.findOne({
        envelopeId,
        recipientId,
        documentId,
        type: 'signature',
      })
    )?.signature || null,
  );
  await signatureOperationServices.updateDocumentWithSignedPdf(documentId, pdfDestinationPath);

  const frontendUrl = resolveFrontendUrl();
  const pendingFields = await signatureOperationServices.fetchPendingFields(envelopeId);

  if (pendingFields.length === 0) {
    const payload = encodeURIComponent(
      JSON.stringify({
        status: 200,
        success: true,
        message: 'All fields completed. Redirecting to signing complete page.',
        fieldRemmaining: false,
        fieldId,
      }),
    );
    return res.redirect(`${frontendUrl}/e-sign/signer/${envelopeId}/${recipientId}?data=${payload}`);
  }

  const pendingFieldsForRecipient = await signatureOperationServices.fetchPendingFieldsByRecipient(
    envelopeId,
    recipientId,
  );
  const remainingFields = pendingFieldsForRecipient.length > 0;
  const payload = encodeURIComponent(
    JSON.stringify({
      status: 200,
      success: true,
      message: 'All fields completed. Redirecting to signing complete page.',
      fieldRemmaining: remainingFields,
    }),
  );
  return res.redirect(`${frontendUrl}/e-sign/signer/${envelopeId}/${recipientId}?data=${payload}`);
}

exports.esignResponse = async (req, res) => {
  try {
    const responseXML = extractResponseXml(req);
    console.log('[VSign callback]', req.method, {
      contentType: req.headers['content-type'],
      bodyKeys: req.body && typeof req.body === 'object' ? Object.keys(req.body) : [],
      hasQueryMsg: Boolean(req.query?.msg),
      rawBodyLength: req.vsignRawBody?.length ?? 0,
      msgLength: responseXML?.length ?? 0,
    });

    const txn = await extractTxnFromRequest(req, responseXML);
    if (!txn) {
      console.error('[VSign callback] could not resolve txn', {
        query: req.query,
        body: req.body,
        rawPreview: req.vsignRawBody
          ? req.vsignRawBody.toString('utf8').slice(0, 300)
          : null,
      });
      return res.status(400).send('Could not resolve VSign transaction (txn missing).');
    }

    const transactionRecord = await signatureTransactions.findOne({ txn });
    if (!transactionRecord) {
      console.error(`[VSign callback] Transaction with txn ${txn} not found`);
      return res.status(404).send('Transaction not found');
    }

    if (!responseXML) {
      console.error('[VSign callback] empty msg for txn:', txn, {
        hint:
          'Expected EsignResp XML in POST field msg (isresponseXML=1). Check Cloudflare tunnel matches VSIGN_CALLBACK_URL and OTP completed successfully.',
        rawPreview: req.vsignRawBody
          ? req.vsignRawBody.toString('utf8').slice(0, 200)
          : null,
      });
      return res
        .status(400)
        .send(
          'VSign callback received empty msg. Ensure Cloudflare tunnel is running and matches VSIGN_CALLBACK_URL, then create a new envelope and retry OTP.',
        );
    }

    return completeVSignSigning(transactionRecord, responseXML, res);
  } catch (err) {
    console.error('[VSign callback] unhandled error:', err);
    return res.status(500).send('response error');
  }
};
