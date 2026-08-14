const fs = require('fs');
const path = require('path');
const axios = require('axios');
const Document = require('../../models/Document');
const signatureTransactions = require('../../models/signatureTransactions');
/** Second-image layout: 250x60, official tick, no aspLogo/green caption. */
const VSIGN_SERVICE_BUILD = '2026-08-14-live-v15';
const {
  isVSignEnabledAndReady,
  getVSignReadinessIssues,
} = require('../../utils/vsignConfigPolicy');
const { fetchRecipientById } = require('../recipientService');
const {
  resolveVSignCallbackUrl,
  resolveVSignEnv,
  resolveVSignCertMode,
  resolveVSignUsesLiveCert,
  resolveVSignPfxPath,
  resolveVSignAspId,
  resolveVSignPfxCredentials,
  resolveVSignAuthPage,
  resolveVSignUtilityUrl,
  normalizeVSignPath,
  buildVSignSignatureDetailsString,
  buildVSignAppearanceExtras,
  stageVSignAppearanceAssets,
  VSIGN_REFERENCE_APPEARANCE,
} = require('../../utils/vsignAssets');
const serviceRoot = path.join(__dirname, '../..');
const VSIGN_ENV = resolveVSignEnv(serviceRoot);
const VSIGN_CERT_MODE = resolveVSignCertMode(serviceRoot);
const VSIGN_AUTHPAGE = resolveVSignAuthPage(serviceRoot);
const ASP_ID = resolveVSignAspId(serviceRoot);

console.log('[VSign] aadhar.vsign.service BUILD:', VSIGN_SERVICE_BUILD);
console.log('[VSign] cert:', VSIGN_CERT_MODE, 'esp:', VSIGN_ENV, 'aspId:', ASP_ID);

function stageAppearance(serviceRoot, tempInfoPath) {
  return stageVSignAppearanceAssets(
    serviceRoot,
    tempInfoPath,
    buildVSignAppearanceExtras(serviceRoot),
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
    if (!isVSignEnabledAndReady()) {
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

    const { documentId, recipientId, fieldId, envelopeId } = data;
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
    const pdfPath = docRecord?.preparedDoc;

    const {
      signaturedetailsString,
      signatureFontSize,
      appearanceWidth,
      appearanceHeight,
    } = await buildVSignSignatureDetailsString(pdfPath, allFields, {
      referenceAppearance: true,
      serviceRoot,
    });

    const tempInfoPath = path.join(baseDir, 'vSignTemp');
    const appearance = stageAppearance(serviceRoot, tempInfoPath);

    const signedPdfPath = path.join(baseDir, 'signed', envelopeId.toString());
    const signedFileName = `${time}-signed-${documentId}.pdf`;
    const pdfDestinationPath = path.join(baseDir, 'signed', envelopeId, signedFileName);
    const aspCallbackUrl = resolveVSignCallbackUrl(serviceRoot);

    console.log('[VSign] mode: restore-previous-v14 (250x60, light-green tick, no aspLogo)');
    console.log('[VSign] box:', `${appearanceWidth}x${appearanceHeight}`, 'font=', signatureFontSize);
    console.log('[VSign] tickImgPath:', appearance.tickImgPath);
    console.log('[VSign] signaturedetailsString:', signaturedetailsString);

    if (!ASP_ID) {
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

    if (VSIGN_ENV === 'production' && ASP_ID === 'IIPLUAT001') {
      console.warn(
        '[VSign] production ESP with UAT ASP ID — VSign will assign production ASP ID after ITIO_PUBLIC KEY.cer registration',
      );
    }

    const txn = `${Date.now()}`;
    const pfxPath = resolveVSignPfxPath(serviceRoot);
    if (!fs.existsSync(pfxPath.replace(/\//g, path.sep))) {
      return {
        status: 500,
        response: {
          success: false,
          message: `Signing PFX not found: ${pfxPath}`,
        },
      };
    }

    const payload = withAppearancePayload({
      signedPdfPath: normalizeVSignPath(signedPdfPath),
      tempInfoPath: normalizeVSignPath(tempInfoPath),
      pdfDestinationPath: normalizeVSignPath(pdfDestinationPath),
      responseUrl: aspCallbackUrl,
      txn,
      aspId: ASP_ID,
      pfxPath,
      pfxPassword,
      pfxAlias,
      signingAlgorithm: 'RSA',
      maxWaitPeriod: '1440',
      ver: '21',
      AuthMode: '1',
      fileType: 'path',
      isresponseXML: '1',
      isrequestXML: '1',
      signatureFontSize,
      pdfdetails: [
        {
          pdfbase64val: normalizeVSignPath(pdfPath),
          docInfo: signedFileName,
          docUrl: '',
          reason: '',
          signaturedetailsType: 'signaturedetailsString',
          signaturedetailsString,
        },
      ],
    }, appearance);

    const response = await axios.post(`${resolveVSignUtilityUrl()}/gettxnrefv4_1`, payload);
    const resData = response?.data;

    if (resData?.status == '1') {
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

      return {
        status: 200,
        response: {
          success: true,
          signMethod: 'V_Sign',
          message: 'V-Sign process initiated',
          authUrl: `${VSIGN_AUTHPAGE}/${Buffer.from(`-|-|${aadhaarNumber}`).toString('base64')}/authpagev4`,
          txnRef: resData.txnref,
        },
      };
    }

    return {
      status: 502,
      response: {
        success: false,
        message: 'VSign utility failed to create transaction',
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
    } = data;
    const baseTemp = tempInfoPath || path.join(serviceRoot, 'uploads', 'vSignTemp');
    const payload = withAppearancePayload({
      tempInfoPath: normalizeVSignPath(baseTemp),
      signedFileParentPath: normalizeVSignPath(signedFileParentPath),
      responseXML: Buffer.from(responseXML || '').toString('base64'),
      pdfDestinationPath: normalizeVSignPath(pdfDestinationPath),
      signatureFontSize: signatureFontSize || VSIGN_REFERENCE_APPEARANCE.fontSize,
    }, {
      tickImgPath: tickImgPath || buildVSignAppearanceExtras(serviceRoot).tickImgPath,
      aspLogo: aspLogo || null,
    });
    if (txn) payload.txn = String(txn);
    if (txnRef) payload.txnRef = String(txnRef);

    console.log('[VSign] signpdf tickImgPath:', payload.tickImgPath || '(utility built-in)');
    if (payload.aspLogo) console.log('[VSign] signpdf aspLogo:', payload.aspLogo);

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
