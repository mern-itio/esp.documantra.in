const fs = require('fs');
const path = require('path');
const axios = require('axios');
const multer = require('multer');
const {
  getOrCreateVSignConfigDoc,
  refreshVSignConfigCache,
  getAdminVSignConfigPayload,
  getVSignReadinessIssues,
  isVSignEnabledAndReady,
  resolveAbsolutePath,
  resolveEspResponseUrl,
  maskSecret,
} = require('../utils/vsignConfigPolicy');
const { normalizeVSignPath } = require('../utils/vsignAssets');
const { switchProfile, status: getProfileStatus, readActiveProfile } = require('../scripts/vsign-profile-lib');

const vSignUploadDir = path.join(__dirname, '..', 'uploads', 'vSign');

function certFilenameMap(profileName) {
  const isUat = profileName === 'uat';
  return {
    signingPfx: isUat ? 'signCertificate.uat.pfx' : 'signCertificate.pfx',
    publicCert: isUat ? 'ITIO_PUBLIC_KEY.uat.cer' : 'ITIO_PUBLIC_KEY.cer',
    encryptionPfx: isUat ? 'dm_encryption_key.uat.pfx' : 'dm_encryption_key.pfx',
  };
}

function resolveUploadProfile(req) {
  const requested = String(req.body?.profile || req.query?.profile || '').trim().toLowerCase();
  if (requested === 'uat' || requested === 'live') return requested;
  return readActiveProfile() || 'live';
}

const certStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    fs.mkdirSync(vSignUploadDir, { recursive: true });
    cb(null, vSignUploadDir);
  },
  filename: (req, file, cb) => {
    const field = req.body?.uploadTarget || file.fieldname;
    const profile = resolveUploadProfile(req);
    const map = certFilenameMap(profile);
    cb(null, map[field] || `${Date.now()}-${file.originalname}`);
  },
});

const certUpload = multer({
  storage: certStorage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = /\.(pfx|p12|cer|crt|pem)$/i.test(file.originalname);
    cb(ok ? null : new Error('Only .pfx, .p12, .cer, .crt, .pem files allowed'), ok);
  },
});

function getAdminId(req) {
  return req.user?.id || req.user?.data?.id || req.user?._id || null;
}

async function getVSignConfig(req, res) {
  try {
    const payload = await getAdminVSignConfigPayload();
    return res.status(200).json(payload);
  } catch (err) {
    console.error('getVSignConfig', err);
    return res.status(500).json({ message: 'Failed to load VSign settings' });
  }
}

async function updateVSignConfig(req, res) {
  try {
    const body = req.body || {};
    const doc = await getOrCreateVSignConfigDoc();

    if (body.enabled !== undefined) doc.enabled = Boolean(body.enabled);
    if (body.vsignEnv !== undefined) {
      doc.vsignEnv = body.vsignEnv === 'production' ? 'production' : 'uat';
    }
    if (body.certMode !== undefined) {
      doc.certMode = body.certMode === 'uat' ? 'uat' : 'live';
    }
    if (body.aspId !== undefined) doc.aspId = String(body.aspId || '').trim();
    if (body.vsignAuthPage !== undefined) {
      doc.vsignAuthPage = String(body.vsignAuthPage || '').trim().replace(/\/+$/, '');
    }
    if (body.vsignAuthLogoUrl !== undefined) {
      doc.vsignAuthLogoUrl = String(body.vsignAuthLogoUrl || '').trim();
    }
    if (body.vsignCallbackUrl !== undefined) {
      doc.vsignCallbackUrl = String(body.vsignCallbackUrl || '').trim();
    }
    if (body.vsignEspResponseUrl !== undefined) {
      doc.vsignEspResponseUrl = String(body.vsignEspResponseUrl || '').trim();
    }
    if (body.utilityUrl !== undefined) doc.utilityUrl = String(body.utilityUrl || '').trim();
    if (body.pfxPath !== undefined) doc.pfxPath = String(body.pfxPath || '').trim();
    if (body.pfxAlias !== undefined) doc.pfxAlias = String(body.pfxAlias || '').trim();
    if (body.publicCertPath !== undefined) doc.publicCertPath = String(body.publicCertPath || '').trim();
    if (body.dmEncryptionKeyPath !== undefined) {
      doc.dmEncryptionKeyPath = String(body.dmEncryptionKeyPath || '').trim();
    }
    if (body.appearanceMode !== undefined) {
      doc.appearanceMode = String(body.appearanceMode || 'custom-tick').trim();
    }
    if (body.useJar !== undefined) doc.useJar = Boolean(body.useJar);
    if (body.signatureFontSize !== undefined) {
      doc.signatureFontSize = String(body.signatureFontSize || '10').trim();
    }
    if (body.pfxPassword !== undefined && String(body.pfxPassword).trim()) {
      doc.pfxPassword = String(body.pfxPassword).trim();
    } else if (body.clearPfxPassword) {
      doc.pfxPassword = '';
    }
    if (body.dmEncryptionKeyPassword !== undefined && String(body.dmEncryptionKeyPassword).trim()) {
      doc.dmEncryptionKeyPassword = String(body.dmEncryptionKeyPassword).trim();
    } else if (body.clearDmEncryptionKeyPassword) {
      doc.dmEncryptionKeyPassword = '';
    }

    if (body.vsignEnv === 'production' && !doc.vsignAuthPage.includes('esignuat')) {
      if (doc.vsignAuthPage.endsWith('/authpage')) {
        doc.vsignAuthPage = doc.vsignAuthPage.replace(/\/authpage$/, '');
      }
      if (!doc.vsignAuthPage.includes('esign.verasys.in')) {
        doc.vsignAuthPage = 'https://esign.verasys.in/esp';
      }
    }

    const adminId = getAdminId(req);
    if (adminId) doc.updatedBy = adminId;

    await doc.save();
    await refreshVSignConfigCache();

    const payload = await getAdminVSignConfigPayload();
    return res.status(200).json({
      ...payload,
      message: body.enabled ? 'VSign settings saved' : 'VSign settings saved (disabled until enabled)',
    });
  } catch (err) {
    console.error('updateVSignConfig', err);
    return res.status(500).json({ message: err.message || 'Failed to update VSign settings' });
  }
}

async function getVSignProfileStatus(req, res) {
  try {
    const profileStatus = getProfileStatus();
    const payload = await getAdminVSignConfigPayload();
    return res.status(200).json({ ...profileStatus, config: payload });
  } catch (err) {
    console.error('getVSignProfileStatus', err);
    return res.status(500).json({ message: err.message || 'Failed to load VSign profile status' });
  }
}

async function switchVSignProfile(req, res) {
  try {
    const profile = String(req.body?.profile || '').trim().toLowerCase();
    if (!['uat', 'live'].includes(profile)) {
      return res.status(400).json({ message: 'profile must be "uat" or "live"' });
    }
    const tunnelUrl = String(req.body?.tunnelUrl || '').trim();
    const result = await switchProfile(profile, tunnelUrl);
    await refreshVSignConfigCache();
    const payload = await getAdminVSignConfigPayload();
    return res.status(200).json({
      ...result,
      config: payload,
      requiresRestart: ['utility', 'e-sign-service'],
      message: `Switched to ${profile.toUpperCase()} (${result.aspId}). Restart utility JAR and create a new envelope before signing.`,
    });
  } catch (err) {
    console.error('switchVSignProfile', err);
    return res.status(400).json({ message: err.message || 'Profile switch failed' });
  }
}

async function uploadVSignCert(req, res) {
  try {
    const doc = await getOrCreateVSignConfigDoc();
    const target = req.body?.uploadTarget || 'signingPfx';
    const profile = resolveUploadProfile(req);
    const file = req.file;
    if (!file) return res.status(400).json({ message: 'No file uploaded' });

    const rel = path.join('uploads', 'vSign', path.basename(file.filename)).replace(/\\/g, '/');
    if (target === 'signingPfx') doc.pfxPath = rel;
    else if (target === 'publicCert') doc.publicCertPath = rel;
    else if (target === 'encryptionPfx') doc.dmEncryptionKeyPath = rel;

    const adminId = getAdminId(req);
    if (adminId) doc.updatedBy = adminId;
    await doc.save();
    await refreshVSignConfigCache();

    const payload = await getAdminVSignConfigPayload();
    return res.status(200).json({
      ...payload,
      message: `Uploaded ${path.basename(file.filename)} (${profile} profile)`,
    });
  } catch (err) {
    console.error('uploadVSignCert', err);
    return res.status(500).json({ message: err.message || 'Upload failed' });
  }
}

async function testVSignConfig(req, res) {
  try {
    await refreshVSignConfigCache();
    const payload = await getAdminVSignConfigPayload();
    const issues = getVSignReadinessIssues();
    const checks = [];

    checks.push({
      name: 'Configuration',
      ok: payload.ready,
      detail: payload.ready ? 'All required fields present' : issues.join('; '),
    });

    let utilityOk = false;
    let utilityDetail = '';
    try {
      const { data } = await axios.get(`${payload.utilityUrl.replace(/\/+$/, '')}/`, {
        timeout: 5000,
        validateStatus: () => true,
      });
      utilityOk = true;
      utilityDetail = typeof data === 'string' ? 'ESP Utility reachable' : 'ESP Utility reachable';
    } catch (err) {
      utilityDetail = err.message || 'Utility not reachable on configured URL';
    }
    checks.push({ name: 'ESP Utility', ok: utilityOk, detail: utilityDetail });

    const pfxAbs = resolveAbsolutePath(payload.pfxPath);
    checks.push({
      name: 'Signing PFX',
      ok: payload.pfxPresent,
      detail: pfxAbs,
    });
    checks.push({
      name: 'Public cert',
      ok: payload.publicCertPresent,
      detail: payload.publicCertPath,
    });

    if (payload.enabled && payload.pfxPresent && payload.pfxPasswordSet && payload.pfxAlias) {
      try {
        const baseDir = path.join(__dirname, '..', 'uploads');
        const samplePdf = path.join(baseDir, '1785131367547-Annexure-A13-Sample-Signed-Document.pdf');
        const pdfPath = fs.existsSync(samplePdf)
          ? samplePdf
          : path.join(baseDir, 'vSignTemp', 'sample.pdf');
        const txn = `admintest-${Date.now()}`;
        const testPayload = {
          signedPdfPath: normalizeVSignPath(path.join(baseDir, 'signed', 'admin-test')),
          tempInfoPath: normalizeVSignPath(path.join(baseDir, 'vSignTemp')),
          pdfDestinationPath: normalizeVSignPath(path.join(baseDir, 'signed', 'admin-test', `${txn}.pdf`)),
          responseUrl: payload.vsignCallbackUrl,
          redirectUrl: payload.vsignCallbackUrl,
          txn,
          aspId: payload.aspId,
          pfxPath: normalizeVSignPath(pfxAbs),
          pfxPassword: req.body?.pfxPassword || undefined,
          pfxAlias: payload.pfxAlias,
          signingAlgorithm: 'RSA',
          maxWaitPeriod: '5',
          ver: '21',
          AuthMode: '1',
          fileType: 'path',
          isresponseXML: '0',
          isrequestXML: '1',
          pdfdetails: [
            {
              pdfbase64val: normalizeVSignPath(pdfPath),
              docInfo: 'admin-test.pdf',
              docUrl: '',
              reason: 'admin-test',
              signaturedetailsType: 'signaturedetailsString',
              signaturedetailsString: '1-120,450,250,60',
            },
          ],
        };

        if (!testPayload.pfxPassword) {
          const doc = await getOrCreateVSignConfigDoc();
          testPayload.pfxPassword = doc.pfxPassword;
        }

        const { data } = await axios.post(
          `${payload.utilityUrl.replace(/\/+$/, '')}/gettxnrefv4_1`,
          testPayload,
          { timeout: 60000 },
        );
        const txnOk = data?.status == '1';
        checks.push({
          name: 'gettxnrefv4_1',
          ok: txnOk,
          detail: txnOk ? `txnRef created (${data.txnref})` : JSON.stringify(data).slice(0, 200),
        });
      } catch (err) {
        checks.push({
          name: 'gettxnrefv4_1',
          ok: false,
          detail: err.response?.data ? JSON.stringify(err.response.data).slice(0, 200) : err.message,
        });
      }
    }

    const allOk = checks.every((c) => c.ok);
    return res.status(allOk ? 200 : 400).json({
      ok: allOk,
      ready: payload.ready,
      enabled: payload.enabled,
      checks,
      aspId: payload.aspId,
      pfxPasswordMasked: payload.pfxPasswordMasked,
    });
  } catch (err) {
    console.error('testVSignConfig', err);
    return res.status(500).json({ message: err.message || 'VSign test failed' });
  }
}

module.exports = {
  certUpload,
  getVSignConfig,
  getVSignProfileStatus,
  switchVSignProfile,
  updateVSignConfig,
  uploadVSignCert,
  testVSignConfig,
};
