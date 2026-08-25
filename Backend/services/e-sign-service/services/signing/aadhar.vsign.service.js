const fs = require('fs');
const path = require('path');
const axios = require('axios');
const Document = require('../../models/Document');
const signatureTransactions = require('../../models/signatureTransactions');
/** Second-image layout: 250x60, official tick, no aspLogo/green caption. */
const VSIGN_SERVICE_BUILD = '2026-08-14-live-v15';
const {
  isVSignEnabledAndReady,
  isLegacyEnvMode,
  getVSignReadinessIssues,
  envProfileOperational,
} = require('../../utils/vsignConfigPolicy');
const { fetchRecipientById } = require('../recipientService');
const signatureOperationServices = require('../signatureOperationServices');
const {
  embedHandwrittenSignaturesInPdf,
} = require('./vsignHandwrittenEmbed');
const {
  paintAadhaarAppearanceBackground,
  boxesFromSignatureDetails,
} = require('./vsignAppearanceEmbed');
const {
  resolveVSignCallbackUrl,
  resolveVSignEnv,
  resolveVSignCertMode,
  resolveVSignUsesLiveCert,
  resolveVSignPfxPath,
  resolveVSignAspId,
  resolveVSignPfxCredentials,
  resolveVSignAuthPage,
  resolveVSignAuthLogoUrl,
  buildVSignAuthUrl,
  resolveVSignUtilityUrl,
  normalizeVSignPath,
  toHostUtilityPath,
  buildVSignSignatureDetailsString,
  buildVSignAppearanceExtras,
  stageVSignAppearanceAssets,
  VSIGN_REFERENCE_APPEARANCE,
} = require('../../utils/vsignAssets');
const serviceRoot = path.join(__dirname, '../..');

/** Resolve at request time — module-load values were stale before Mongo VSignConfig cache. */
function getVSignRuntimeConfig() {
  return {
    vsignEnv: resolveVSignEnv(serviceRoot),
    certMode: resolveVSignCertMode(serviceRoot),
    authPage: resolveVSignAuthPage(serviceRoot),
    aspId: resolveVSignAspId(serviceRoot),
  };
}

console.log('[VSign] aadhar.vsign.service BUILD:', VSIGN_SERVICE_BUILD);
console.log('[VSign] runtime config (per request):', getVSignRuntimeConfig());

function stageAppearance(serviceRoot, tempInfoPath, txn) {
  return stageVSignAppearanceAssets(
    serviceRoot,
    tempInfoPath,
    buildVSignAppearanceExtras(serviceRoot),
    txn,
  );
}

function withAppearancePayload(base, appearance = {}) {
  const payload = { ...base };
  if (appearance.tickImgPath) payload.tickImgPath = appearance.tickImgPath;
  if (appearance.aspLogo) payload.aspLogo = appearance.aspLogo;
  return payload;
}

module.exports = {
  aadhaarSignature: async (data) => {
    if (!envProfileOperational() && !isLegacyEnvMode() && !isVSignEnabledAndReady()) {
      const issues = getVSignReadinessIssues();
      return {
        status: 503,
        response: {
          success: false,
          message: issues[0] || 'VSign is not enabled or not fully configured in admin settings',
          readinessIssues: issues,
        },
      };
    }

    const { documentId, recipientId, fieldId, envelopeId, signatureImageBase64 } = data;
    const time = Date.now();
    const recipient = await fetchRecipientById(recipientId);
    const docRecord = await Document.findById(documentId);
    if (!docRecord) {
      return { status: 404, response: { success: false, message: 'Document not found' } };
    }

    const allFields = await signatureOperationServices.fetchRecipientAllFields(
      envelopeId,
      recipientId,
      documentId,
    );
    const baseDir = path.join(__dirname, '../..', 'uploads');
    fs.mkdirSync(path.join(baseDir, 'signed', envelopeId.toString()), { recursive: true });
    fs.mkdirSync(path.join(baseDir, 'vSignTemp'), { recursive: true });
    let pdfPath = docRecord?.preparedDoc;
    const hasHandwritten = Boolean(
      signatureImageBase64
      || allFields.some((f) => f.type === 'signature' && f.signature),
    );
    if (hasHandwritten && pdfPath) {
      const imageForEmbed = signatureImageBase64
        || allFields.find((f) => f.type === 'signature' && f.signature)?.signature;
      if (imageForEmbed) {
        pdfPath = await embedHandwrittenSignaturesInPdf(pdfPath, allFields, imageForEmbed);
        await signatureOperationServices.updateDocument(documentId, { preparedDoc: pdfPath });
      }
    }

    const {
      signaturedetails,
      signaturedetailsString,
      signatureFontSize,
      appearanceWidth,
      appearanceHeight,
    } = await buildVSignSignatureDetailsString(pdfPath, allFields, {
      recipient,
      serviceRoot,
      hasHandwritten,
    });

    const appearanceBoxes = boxesFromSignatureDetails(signaturedetails);
    const txn = `${Date.now()}`;
    const tempInfoPath = path.join(baseDir, 'vSignTemp');
    const appearance = stageAppearance(serviceRoot, tempInfoPath, txn);

    // Dual (handwritten) flow: skip pre-sign blue box — post-sign paint on Final.pdf
    // is the single source of truth (avoids coord-scale duplicates).
    if (!hasHandwritten && appearanceBoxes.length && pdfPath) {
      try {
        await paintAadhaarAppearanceBackground(pdfPath, {
          boxes: appearanceBoxes,
          serviceRoot,
        });
        console.log('[VSign] painted appearance background before gettxnref');
      } catch (bgErr) {
        console.warn('[VSign] appearance background paint skipped:', bgErr.message);
      }
    }

    const signedPdfPath = path.join(baseDir, 'signed', envelopeId.toString());
    const signedFileName = `${time}-signed-${documentId}.pdf`;
    const pdfDestinationPath = path.join(baseDir, 'signed', envelopeId, signedFileName);
    const aspCallbackUrl = resolveVSignCallbackUrl(serviceRoot);

    console.log('[VSign] mode: production appearance (280x85, check-only tick, dynamic box)');
    console.log('[VSign] box:', `${appearanceWidth}x${appearanceHeight}`, 'font=', signatureFontSize);
    console.log('[VSign] tickImgPath:', appearance.tickImgPath);
    console.log('[VSign] signaturedetailsString:', signaturedetailsString);

    // Keep the PDF certificate visible but push VSign's own rendered strip off-page
    // when we already have a handwritten+custom Aadhaar appearance to paint ourselves.
    const utilitySignaturedetailsString = hasHandwritten
      ? (signaturedetails || [])
        .map((entry) => `${entry.page}-5000,5000,1,1`)
        .join(';')
      : signaturedetailsString;
    if (hasHandwritten) {
      console.log('[VSign] utility signaturedetailsString (hidden):', utilitySignaturedetailsString);
    }

    const { vsignEnv, authPage: vsignAuthPage, aspId } = getVSignRuntimeConfig();
    console.log('[VSign] runtime:', { vsignEnv, aspId, authPage: vsignAuthPage });
    const authUrlPattern = await buildVSignAuthUrl(serviceRoot, '000000000000');
    console.log('[VSign] payload flags:', {
      isresponseXML: '1',
      responseUrl: aspCallbackUrl,
      redirectUrl: aspCallbackUrl,
      authUrlPattern,
      authLogoUrl: resolveVSignAuthLogoUrl(serviceRoot) || '(none)',
    });

    if (!aspId) {
      return {
        status: 500,
        response: {
          success: false,
          message: 'ASP_ID is required for VSign',
        },
      };
    }

    const { password: pfxPassword, alias: pfxAlias, usesLiveCert } = resolveVSignPfxCredentials(serviceRoot);
    if (usesLiveCert && (!pfxPassword || !pfxAlias)) {
      return {
        status: 500,
        response: {
          success: false,
          message:
            'Live PFX (dmsignaturekey.pfx) needs PFX_PASSWORD and PFX_ALIAS from certificate generation — UAT defaults do not apply',
        },
      };
    }

    if (vsignEnv === 'production' && aspId === 'IIPLUAT001') {
      console.warn(
        '[VSign] production ESP with UAT ASP ID — VSign will assign production ASP ID after ITIO_PUBLIC KEY.cer registration',
      );
    }

    const pfxPath = resolveVSignPfxPath(serviceRoot);
    if (!fs.existsSync(pfxPath.replace(/\//g, path.sep))) {
      return {
        status: 500,
        response: {
          success: false,
          message: `Signing PFX not found: ${pfxPath}. For UAT run switch-vsign-env uat after placing signCertificate.uat.pfx.`,
        },
      };
    }

    const payload = withAppearancePayload({
      signedPdfPath: toHostUtilityPath(signedPdfPath),
      tempInfoPath: toHostUtilityPath(tempInfoPath),
      pdfDestinationPath: toHostUtilityPath(pdfDestinationPath),
      responseUrl: aspCallbackUrl,
      redirectUrl: aspCallbackUrl,
      txn,
      aspId,
      pfxPath: toHostUtilityPath(pfxPath),
      pfxPassword,
      pfxAlias,
      signingAlgorithm: 'RSA',
      maxWaitPeriod: '1440',
      ver: '21',
      AuthMode: '1',
      fileType: 'path',
      // isresponseXML=1: VSign POSTs full EsignResp (with cert/signature) in callback `msg`.
      // isresponseXML=0 only stores XML in utility temp — local tunnel setup never receives it.
      isresponseXML: '1',
      isrequestXML: '1',
      signatureFontSize: hasHandwritten
        ? VSIGN_REFERENCE_APPEARANCE.fontSize
        : signatureFontSize,
      pdfdetails: [
        {
          pdfbase64val: toHostUtilityPath(pdfPath),
          docInfo: signedFileName,
          docUrl: '',
          reason: '',
          signaturedetailsType: 'signaturedetailsString',
          signaturedetailsString: utilitySignaturedetailsString,
        },
      ],
      // Handwritten dual: no utility tick/logo — we paint one custom appearance after sign.
    }, hasHandwritten ? {} : appearance);

    const utilityUrl = resolveVSignUtilityUrl();
    console.log('[VSign] gettxnref request', {
      utilityUrl: `${utilityUrl}/gettxnrefv4_1`,
      pfxPath: payload.pfxPath,
      pfxAlias,
      pdfPath: payload.pdfdetails?.[0]?.pdfbase64val,
      tempInfoPath: payload.tempInfoPath,
      aspId,
    });

    let response;
    try {
      response = await axios.post(`${utilityUrl}/gettxnrefv4_1`, payload, { timeout: 120000 });
    } catch (err) {
      console.error('[VSign] gettxnref HTTP error', err.message, err.response?.data || '');
      throw err;
    }
    const resData = response?.data;
    console.log('[VSign] gettxnref response', {
      httpStatus: response?.status,
      type: typeof resData,
      keys: resData && typeof resData === 'object' ? Object.keys(resData) : [],
      status: resData?.status,
      txnref: resData?.txnref || null,
      errorCode: resData?.errorCode || resData?.errorcode || null,
      errorMessage: resData?.errorMessage || resData?.error || resData?.message || null,
      preview: typeof resData === 'string' ? resData.slice(0, 500) : JSON.stringify(resData || {}).slice(0, 800),
    });
    const txnRef = resData?.txnref;
    const utilityOk = resData?.status == '1' || resData?.status == 1;

    if (utilityOk && txnRef) {
      await new signatureTransactions({
        txn,
        txnRef: resData.txnref,
        documentId,
        recipientId,
        fieldId,
        envelopeId,
        signedFilePath: pdfDestinationPath,
        appearanceWidth,
        appearanceHeight,
        signatureFontSize,
        tickImgPath: appearance.tickImgPath,
        aspLogo: appearance.aspLogo || '',
        appearanceBoxes,
        aadhaarLast4: String(recipient?.aadhaarNumber || '').replace(/\D/g, '').slice(-4) || undefined,
      }).save();

      const aadhaarNumber = recipient?.aadhaarNumber;
      if (!aadhaarNumber) {
        return {
          status: 400,
          response: {
            success: false,
            message: 'Recipient Aadhaar number is required before VSign signing',
          },
        };
      }

      try {
        const RecipientPermission = require('../../models/RecipientPermission');
        const { mergeSigningEvidence } = require('../../utils/signingEvidenceHelper');
        const aadhaarLast4 = String(aadhaarNumber).replace(/\D/g, '').slice(-4);
        const permission = await RecipientPermission.findOne({ envelopeId, recipientId });
        if (permission && aadhaarLast4) {
          permission.signingEvidence = mergeSigningEvidence(permission.signingEvidence || {}, {
            aadhaarLast4,
          });
          await permission.save();
        }
      } catch (evidenceErr) {
        console.warn('[VSign] aadhaarLast4 pre-save skipped:', evidenceErr.message);
      }

      return {
        status: 200,
        response: {
          success: true,
          signMethod: 'V_Sign',
          message: 'V-Sign process initiated',
          authUrl: await buildVSignAuthUrl(serviceRoot, aadhaarNumber),
          txnRef: resData.txnref,
          aadhaarLast4: String(aadhaarNumber).replace(/\D/g, '').slice(-4) || null,
        },
      };
    }

    const emptyUtilityResponse = !resData || (typeof resData === 'object' && Object.keys(resData).length === 0);
    let failureMessage = 'VSign utility failed to create transaction';
    if (resData?.errorMessage || resData?.errorCode) {
      failureMessage = [resData.errorCode, resData.errorMessage].filter(Boolean).join(': ');
    } else if (usesLiveCert && emptyUtilityResponse) {
      const hostPrefix = (process.env.VSIGN_HOST_PATH_PREFIX || '').trim();
      failureMessage = !hostPrefix
        ? 'VSign utility could not read the signing PFX (Docker path mapping missing). On server run: cd Backend/services/e-sign-service && node scripts/fix-vsign-live-production.js — then docker compose restart e-sign-service.'
        : 'Live PFX password or alias is incorrect, or VSign utility is down. On server run: node scripts/fix-vsign-live-production.js (auto-finds alias via keytool) then docker compose restart e-sign-service. Ensure vsign-utility is running on port 7078.';
    } else if (usesLiveCert) {
      failureMessage =
        'VSign utility rejected the live signing certificate. Verify PFX password, alias, and that ESP utility is running on port 7077.';
    } else if (!usesLiveCert && emptyUtilityResponse) {
      failureMessage =
        'UAT signing PFX could not be unlocked. Use the VSign email attachment Class II Organization 2 Year Document Signer Signature-2024.pfx (password abc1234) at uploads/vSign/signCertificate.uat.pfx. Desktop TEST DOCUMENT SIGNER.pfx is a different/wrong copy.';
    } else if (!usesLiveCert) {
      failureMessage =
        'UAT VSign transaction failed. Confirm signCertificate.uat.pfx is from the VSign onboarding email and utility uses esignuat.vsign.in URLs.';
    }

    return {
      status: 503,
      response: {
        success: false,
        message: failureMessage,
        detail: resData || null,
      },
    };
  },

  appendSignature: async (data) => {
    const {
      tempInfoPath,
      signedFileParentPath,
      responseXML,
      pdfDestinationPath,
      signatureFontSize,
      tickImgPath,
      aspLogo,
      txn,
      txnRef,
      skipAppearanceAssets,
    } = data;
    const baseTemp = tempInfoPath || path.join(serviceRoot, 'uploads', 'vSignTemp');
    const parentPath = signedFileParentPath || path.dirname(pdfDestinationPath || baseTemp);
    const appearanceExtras = skipAppearanceAssets
      ? {}
      : {
        tickImgPath: tickImgPath || buildVSignAppearanceExtras(serviceRoot).tickImgPath,
        ...(aspLogo ? { aspLogo } : {}),
      };
    const payload = withAppearancePayload({
      tempInfoPath: toHostUtilityPath(baseTemp),
      signedPdfPath: toHostUtilityPath(parentPath),
      signedFileParentPath: toHostUtilityPath(parentPath),
      responseXML: Buffer.from(responseXML || '').toString('base64'),
      pdfDestinationPath: toHostUtilityPath(pdfDestinationPath),
      signatureFontSize: signatureFontSize || VSIGN_REFERENCE_APPEARANCE.fontSize,
    }, appearanceExtras);
    if (txn) payload.txn = String(txn);
    if (txnRef) payload.txnRef = String(txnRef);

    console.log('[VSign] signpdf', {
      txn: payload.txn,
      txnRef: payload.txnRef ? '(set)' : '(missing)',
      responseXmlBytes: responseXML ? Buffer.byteLength(responseXML, 'utf8') : 0,
      tickImgPath: payload.tickImgPath || '(none — custom paint)',
      skipAppearanceAssets: Boolean(skipAppearanceAssets),
    });

    try {
      const response = await axios.post(`${resolveVSignUtilityUrl()}/signpdfv4_1`, payload, { timeout: 120000 });
      const result = response.data;
      console.log('Append Signature Response:', result);
      if (result === '' || result == null) {
        return { status: '0', error: 'VSign utility returned empty signpdf response.' };
      }
      if (typeof result === 'string') {
        try {
          return JSON.parse(result);
        } catch (_) {
          return { status: '0', error: result };
        }
      }
      return result;
    } catch (err) {
      console.error('Error in appendSignature:', err.response?.data || err.message);
      return { status: '0', error: err.response?.data || err.message };
    }
  },
};
