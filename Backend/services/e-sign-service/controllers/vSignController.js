const util = require('util');
const xml2js = require('xml2js');
const fs = require('fs');
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
  buildVSignSignatureDetailsString,
  stageVSignAppearanceAssets,
  resolveVSignSignatureFontSizeForBox,
} = require('../utils/vsignAssets');
const { fetchRecipientById } = require('../services/recipientService');
const { paintAadhaarAppearanceOnPdf } = require('../services/signing/vsignAppearanceEmbed');

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

  // Do NOT fall back to "latest txn" — empty GET/health probes would steal the
  // in-progress OTP transaction and return 500 to VSign (Internal Server Error).
  return null;
}

function extractAadhaarLast4FromXml(xml) {
  if (!xml || typeof xml !== 'string') return '';
  const text = String(xml);
  const uid =
    text.match(/\buid="(\d{4,12})"/i)?.[1] ||
    text.match(/\buid='(\d{4,12})'/i)?.[1] ||
    text.match(/\baadhaar(?:No|Number)?="(\d{4,12})"/i)?.[1] ||
    text.match(/\b(\d{12})\b/)?.[1] ||
    '';
  const digits = String(uid).replace(/\D/g, '');
  return digits.length >= 4 ? digits.slice(-4) : '';
}

function extractLast4FromSignerName(signerName) {
  const match = String(signerName || '').match(/,\s*(\d{4})\s*$/);
  return match ? match[1] : '';
}

/** VSign returns "Full Name, 8836" — use Aadhaar-verified full name for appearance. */
function extractAadhaarSignerName(signerName) {
  const raw = String(signerName || '').trim();
  if (!raw) return '';
  return raw.replace(/,\s*\d{4}\s*$/, '').trim();
}

function resolveExistingTickPath(recordTick, serviceRoot) {
  const defaultTick = buildVSignAppearanceExtras(serviceRoot).tickImgPath;
  const candidate = recordTick || defaultTick;
  const resolved = String(candidate).replace(/\//g, path.sep);
  if (resolved && fs.existsSync(resolved)) return candidate;
  return defaultTick;
}

/** VSign often writes `...Final.pdf`; paint/download must use the file that actually exists. */
function resolveSignedPdfForAppearance(preferredPath, appendResult) {
  const fromUtility =
    appendResult?.signDocumentPath1 ||
    appendResult?.signDocumentPath ||
    appendResult?.pdfDestinationPath;
  const candidates = [
    fromUtility,
    preferredPath && String(preferredPath).replace(/\.pdf$/i, 'Final.pdf'),
    preferredPath,
  ].filter(Boolean);
  for (const candidate of candidates) {
    const resolved = path.resolve(String(candidate).replace(/\//g, path.sep));
    if (fs.existsSync(resolved)) return resolved;
  }
  return preferredPath ? path.resolve(String(preferredPath).replace(/\//g, path.sep)) : preferredPath;
}

function parseEsignRespMeta(xml) {
  if (!xml || typeof xml !== 'string') return { errCode: null, errMsg: null, status: null };
  const text = String(xml);
  const pick = (pattern) => text.match(pattern)?.[1] ?? null;
  return {
    errCode: pick(/\berrCode="([^"]*)"/i) || pick(/\berrCode='([^']*)'/i),
    errMsg: pick(/\berrMsg="([^"]*)"/i) || pick(/\berrMsg='([^']*)'/i),
    status: pick(/\bstatus="([^"]*)"/i) || pick(/\bstatus='([^']*)'/i),
  };
}

function isEsignRespSuccess(meta) {
  if (!meta?.errCode) return true;
  const code = String(meta.errCode).trim().toUpperCase();
  return code === 'NA' || code === '0' || code === 'SUCCESS';
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
      tickImgPath: resolveExistingTickPath(
        transactionRecord.tickImgPath,
        serviceRoot,
      ),
      ...(transactionRecord.aspLogo ? { aspLogo: transactionRecord.aspLogo } : {}),
    },
    transactionRecord.txn,
  );
  const { tickImgPath, aspLogo } = appearance;
  const signatureFontSize =
    transactionRecord.signatureFontSize
    || VSIGN_REFERENCE_APPEARANCE.fontSize
    || resolveVSignSignatureFontSizeForBox(transactionRecord.appearanceHeight, serviceRoot);

  const signPdf = (xmlForUtility) => signingServices.vSign.appendSignature({
    tempInfoPath,
    signedFileParentPath,
    responseXML: xmlForUtility || '',
    pdfDestinationPath,
    signatureFontSize,
    // Never stamp utility tick/logo — we paint a single dual appearance after sign.
    tickImgPath: null,
    aspLogo: null,
    skipAppearanceAssets: true,
    txn: transactionRecord.txn,
    txnRef: transactionRecord.txnRef,
  });

  // Prefer callback EsignResp when present (isresponseXML=1); fall back to utility temp (isresponseXML=0).
  let appendSignatureResult;
  if (responseXML) {
    console.log('[VSign callback] signpdf with callback EsignResp XML, length:', responseXML.length);
    appendSignatureResult = await signPdf(responseXML);
    if (
      appendSignatureResult?.status !== '1'
      && appendSignatureResult?.status !== 1
      && responseXML.length < 800
    ) {
      console.log('[VSign callback] short callback XML — retrying signpdf from utility temp');
      appendSignatureResult = await signPdf('');
    }
  } else {
    console.log('[VSign callback] empty msg — signpdf from utility temp for txn:', transactionRecord.txn);
    appendSignatureResult = await signPdf('');
  }

  if (appendSignatureResult?.status !== '1' && appendSignatureResult?.status !== 1) {
    console.error('[VSign callback] Error appending signature:', appendSignatureResult);
    const detail = [
      appendSignatureResult?.errorMessage,
      appendSignatureResult?.errorCode,
      appendSignatureResult?.error,
    ].filter(Boolean).join(' — ');
    const hint =
      responseXML && responseXML.length < 800
        ? ' (callback XML too short — create a new envelope after e-sign service restart)'
        : '';
    return res.status(500).send(
      detail ? `Error appending signature: ${detail}${hint}` : `Error appending signature${hint}`,
    );
  }

  const verifiedAt = new Date();
  const xmlLast4 = extractAadhaarLast4FromXml(responseXML);
  const signerNameLast4 = extractLast4FromSignerName(appendSignatureResult?.signerName);
  const aadhaarSignerName = extractAadhaarSignerName(appendSignatureResult?.signerName);
  if (aadhaarSignerName || signerNameLast4) {
    try {
      await signatureTransactions.updateOne(
        { _id: transactionRecord._id },
        {
          $set: {
            ...(aadhaarSignerName ? { aadhaarSignerName } : {}),
            ...(signerNameLast4 ? { aadhaarLast4: signerNameLast4 } : {}),
          },
        },
      );
    } catch (txnErr) {
      console.warn('[VSign callback] txn name persist skipped:', txnErr.message);
    }
  }
  let callbackRecipient = null;
  try {
    callbackRecipient = await fetchRecipientById(recipientId);
    if (aadhaarSignerName && callbackRecipient) {
      try {
        const Recipient = require('../models/Recipient');
        await Recipient.findByIdAndUpdate(recipientId, { name: aadhaarSignerName });
        if (typeof callbackRecipient.set === 'function') {
          callbackRecipient.set('name', aadhaarSignerName);
        } else {
          callbackRecipient.name = aadhaarSignerName;
        }
      } catch (nameErr) {
        console.warn('[VSign callback] recipient name update skipped:', nameErr.message);
      }
    }
    const allFields = await signatureOperationServices.fetchRecipientAllFields(
      envelopeId,
      recipientId,
      documentId,
    );
    const signedFieldPreview = await SignatureFields.findOne({
      envelopeId,
      recipientId,
      documentId,
      type: 'signature',
    });
    const signedPdfForPaint = resolveSignedPdfForAppearance(
      pdfDestinationPath,
      appendSignatureResult,
    );
    const hasHandwritten = Boolean(signedFieldPreview?.signature);
    const aadhaarLast4 =
      String(
        callbackRecipient?.aadhaarNumber ||
          transactionRecord.aadhaarLast4 ||
          xmlLast4 ||
          signerNameLast4 ||
          '',
      ).replace(/\D/g, '').slice(-4) || signerNameLast4 || xmlLast4;
    // Always derive boxes from the file we paint (Final.pdf) so scale matches.
    const { signaturedetails } = await buildVSignSignatureDetailsString(
      signedPdfForPaint || pdfDestinationPath,
      allFields,
      {
        recipient: {
          ...(callbackRecipient?.toObject?.() || callbackRecipient || {}),
          name: aadhaarSignerName || callbackRecipient?.name,
          aadhaarLast4,
        },
        serviceRoot,
        hasHandwritten,
      },
    );
    const boxes = (signaturedetails || []).map((entry) => ({
      pageNum: Number(entry.page),
      ...(entry.coordinates?.[0] || {}),
    })).filter((b) => b.w && b.h);
    if (boxes.length && signedPdfForPaint) {
      const handwrittenBase64 =
        signedFieldPreview?.signature
        || allFields.find((f) => f.type === 'signature' && f.signature)?.signature
        || null;
      await paintAadhaarAppearanceOnPdf(signedPdfForPaint, {
        boxes,
        signatureFields: allFields,
        handwrittenBase64,
        recipient: {
          ...(callbackRecipient?.toObject?.() || callbackRecipient || {}),
          name: aadhaarSignerName || callbackRecipient?.name,
          aadhaarLast4,
        },
        verifiedAt,
        serviceRoot,
      });
      console.log('[VSign callback] painted single dual Aadhaar appearance on signed PDF', {
        path: signedPdfForPaint,
        hasHandwritten: Boolean(handwrittenBase64),
        boxes: boxes.map((b) => `${b.pageNum || b.page}-${b.x},${b.y},${b.w},${b.h}`),
      });
      transactionRecord.signedFilePath = signedPdfForPaint;
    }
  } catch (paintErr) {
    console.warn('[VSign callback] appearance paint skipped:', paintErr.message);
  }

  const permission = await RecipientPermission.findOne({ envelopeId, recipientId });
  const signedField = await SignatureFields.findOne({
    envelopeId,
    recipientId,
    documentId,
    type: 'signature',
  });

  if (permission) {
    if (!callbackRecipient) {
      callbackRecipient = await fetchRecipientById(recipientId);
    }
    const aadhaarDigits = String(
      callbackRecipient?.aadhaarNumber ||
        transactionRecord.aadhaarLast4 ||
        xmlLast4 ||
        signerNameLast4 ||
        '',
    ).replace(/\D/g, '');
    const aadhaarLast4 =
      aadhaarDigits.slice(-4) ||
      String(transactionRecord.aadhaarLast4 || '').replace(/\D/g, '').slice(-4) ||
      xmlLast4 ||
      signerNameLast4 ||
      String(permission.signingEvidence?.aadhaarLast4 || '').replace(/\D/g, '').slice(-4);
    permission.signingEvidence = sanitizeSigningEvidence(
      mergeSigningEvidence(permission.signingEvidence || {}, {
        aadhaarVerifiedAt: verifiedAt,
        vsignVerifiedAt: verifiedAt,
        ...(aadhaarLast4 ? { aadhaarLast4 } : {}),
        ...(aadhaarSignerName ? { aadhaarSignerName } : {}),
        handwrittenSignature:
          signedField?.signature || permission.signingEvidence?.handwrittenSignature || '',
        dualSignature: Boolean(
          signedField?.signature || permission.signingEvidence?.handwrittenSignature,
        ),
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
  await signatureOperationServices.updateDocumentWithSignedPdf(
    documentId,
    transactionRecord.signedFilePath || pdfDestinationPath,
  );

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
      // Health / tunnel probes hit this URL with GET and no payload. Never treat
      // that as a signing attempt (used to pick latest txn → empty signpdf → 500).
      if (req.method === 'GET' || req.method === 'HEAD') {
        return res.status(200).send('VSign callback OK');
      }
      console.error('[VSign callback] could not resolve txn', {
        query: req.query,
        bodyKeys: req.body && typeof req.body === 'object' ? Object.keys(req.body) : [],
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

    if (responseXML) {
      const meta = parseEsignRespMeta(responseXML);
      console.log('[VSign callback] EsignResp meta:', meta);
      if (!isEsignRespSuccess(meta)) {
        return res.status(400).send(
          `VSign failed: ${meta.errMsg || meta.errCode || 'ESP rejected signing'}`,
        );
      }
      if (responseXML.length < 800) {
        console.warn(
          '[VSign callback] EsignResp XML is very short (%d bytes) — likely isresponseXML=0 envelope. Send a new envelope.',
          responseXML.length,
        );
      }
    } else if (req.method === 'GET' || req.method === 'HEAD') {
      // Browser redirect without msg: only continue when txn is explicit in query
      // (isresponseXML=0). Never invent a txn.
      console.log('[VSign callback] GET with txn, empty msg — signpdf from utility temp:', txn);
    } else {
      console.log('[VSign callback] empty msg — signpdf from utility temp for txn:', txn, {
        method: req.method,
        rawPreview: req.vsignRawBody
          ? req.vsignRawBody.toString('utf8').slice(0, 200)
          : null,
      });
    }

    return completeVSignSigning(transactionRecord, responseXML || '', res);
  } catch (err) {
    console.error('[VSign callback] unhandled error:', err);
    return res.status(500).send('response error');
  }
};
