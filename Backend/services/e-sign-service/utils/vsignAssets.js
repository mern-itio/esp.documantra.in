const fs = require('fs');
const path = require('path');
const os = require('os');
const dotenv = require('dotenv');
const { getCachedEffectiveConfig, resolveEspResponseUrl } = require('./vsignConfigPolicy');

const OFFICIAL_TICK_FILENAME = 'tick.png';
const FALLBACK_TICK_FILENAME = 'aadhaar-green-check.png';

/** Arun reference layout — fixed 250×60 keeps text at top (taller box pushes content down). */
const VSIGN_SIGNATURE_BOX_WIDTH = 250;
const VSIGN_SIGNATURE_BOX_HEIGHT = 60;
const VSIGN_REFERENCE_APPEARANCE = { w: 250, h: 60, fontSize: '10' };
const VSIGN_SIGNATURE_BOX_MAX_WIDTH = 320;
const VSIGN_SIGNATURE_BOX_MAX_HEIGHT = 110;
const HANDWRITTEN_HEIGHT_RATIO = 0.38;
const HANDWRITTEN_MIN_HEIGHT = 36;
const VSIGN_SIGNATURE_MIN_HEIGHT = 60;
const VSIGN_SIGNATURE_FONT_REF_HEIGHT = 60;
/** Light blue — Arun Dixit reference box (#E8F2FF). */
const VSIGN_BOX_BG_RGB = { r: 232, g: 242, b: 255 };
const VSIGN_LINE_HEIGHT_PT = 14;
const VSIGN_BOX_PADDING_PT = 18;

function readEnvFile(serviceRoot) {
  const envPath = path.join(serviceRoot, '.env');
  try {
    if (fs.existsSync(envPath)) {
      return dotenv.parse(fs.readFileSync(envPath));
    }
  } catch (err) {
    console.warn('[VSign] Failed to read .env:', err.message);
  }
  return {};
}

/** Java utility reads paths reliably with forward slashes on Windows. */
function normalizeVSignPath(filePath) {
  if (!filePath) return filePath;
  return path.resolve(filePath).replace(/\\/g, '/');
}

function getEffectiveVSign() {
  return getCachedEffectiveConfig();
}

/** uat | production */
function resolveVSignEnv(serviceRoot) {
  const cfg = getEffectiveVSign();
  if (cfg.source === 'db') return cfg.vsignEnv === 'production' ? 'production' : 'uat';
  const fromFile = readEnvFile(serviceRoot).VSIGN_ENV;
  const raw = (fromFile || process.env.VSIGN_ENV || 'uat').trim().toLowerCase();
  if (raw === 'production' || raw === 'live') return 'production';
  return 'uat';
}

/** live | uat cert */
function resolveVSignCertMode(serviceRoot) {
  const cfg = getEffectiveVSign();
  if (cfg.source === 'db') return cfg.certMode === 'uat' ? 'uat' : 'live';
  const fromFile = readEnvFile(serviceRoot).VSIGN_CERT_MODE;
  const raw = (fromFile || process.env.VSIGN_CERT_MODE || '').trim().toLowerCase();
  if (raw === 'live' || raw === 'production') return 'live';
  if (raw === 'uat' || raw === 'test') return 'uat';
  return 'live';
}

function resolveVSignUsesLiveCert(serviceRoot) {
  return resolveVSignCertMode(serviceRoot) === 'live';
}

/** Signing PFX for gettxnref */
function resolveVSignPfxPath(serviceRoot) {
  const cfg = getEffectiveVSign();
  const configured = (cfg.pfxPath || process.env.PFX_PATH || '').trim();
  if (configured) {
    return normalizeVSignPath(path.isAbsolute(configured)
      ? configured
      : path.join(serviceRoot, configured));
  }
  return normalizeVSignPath(path.join(serviceRoot, 'uploads', 'vSign', 'signCertificate.pfx'));
}

function resolveVSignAspId(serviceRoot) {
  const cfg = getEffectiveVSign();
  const configured = (cfg.aspId || process.env.ASP_ID || '').trim();
  if (configured) return configured;
  return 'IIPLUAT001';
}

function resolveVSignPfxCredentials(serviceRoot) {
  const cfg = getEffectiveVSign();
  const password = (cfg.pfxPassword || process.env.PFX_PASSWORD || '').trim();
  const alias = (cfg.pfxAlias || process.env.PFX_ALIAS || '').trim();
  const usesLiveCert = resolveVSignUsesLiveCert(serviceRoot);
  if (usesLiveCert) {
    return { password, alias, usesLiveCert };
  }
  return {
    password: password || 'abc1234',
    alias: alias || '{05AE2E10-4F6D-41A6-9F83-4D0025CA28A0}',
    usesLiveCert,
  };
}

function resolveVSignAuthPage(serviceRoot) {
  const cfg = getEffectiveVSign();
  const configured = (cfg.vsignAuthPage || process.env.VSIGN_AUTHPAGE || '').trim();
  if (configured) return configured.replace(/\/+$/, '');
  return resolveVSignEnv(serviceRoot) === 'production'
    ? 'https://esign.vsign.in/esp'
    : 'https://esignuat.vsign.in/esp';
}

/** ASP browser redirect after utility/VSign processes OTP */
function resolveVSignCallbackUrl(serviceRoot) {
  const cfg = getEffectiveVSign();
  if (cfg.vsignCallbackUrl) return cfg.vsignCallbackUrl.trim();
  const fromFile = readEnvFile(serviceRoot).VSIGN_CALLBACK_URL;
  if (fromFile && String(fromFile).trim()) return String(fromFile).trim();
  return process.env.VSIGN_CALLBACK_URL
    || 'http://localhost:2103/api/e-sign/public/v-sign/response';
}

/** VSign ESP receives OTP result here */
function resolveVSignEspResponseUrl(serviceRoot) {
  const cfg = getEffectiveVSign();
  const fromCfg = resolveEspResponseUrl(cfg);
  if (fromCfg) return fromCfg;
  const fromFile = readEnvFile(serviceRoot).VSIGN_ESP_RESPONSE_URL;
  if (fromFile && String(fromFile).trim()) return String(fromFile).trim();
  if (process.env.VSIGN_ESP_RESPONSE_URL) return String(process.env.VSIGN_ESP_RESPONSE_URL).trim();
  const authPage = resolveVSignAuthPage(serviceRoot);
  return `${authPage.replace(/\/+$/, '')}/2.1.1/aspesignresponse`;
}

function resolveVSignUtilityUrl() {
  const cfg = getEffectiveVSign();
  return (cfg.utilityUrl || process.env.UTILITY_URL || 'http://127.0.0.1:7077').replace(/\/+$/, '');
}

function resolveVSignAppearanceMode(serviceRoot) {
  const cfg = getEffectiveVSign();
  const fromFile = readEnvFile(serviceRoot).VSIGN_APPEARANCE_MODE;
  return (cfg.appearanceMode || fromFile || process.env.VSIGN_APPEARANCE_MODE || 'custom-tick')
    .trim()
    .toLowerCase();
}

function resolveAspLogoPath() {
  return null;
}

/** Always stage tickImgPath; no aspLogo (green caption). Light-green tick.png in utility/. */
function buildVSignAppearanceExtras(serviceRoot) {
  return { tickImgPath: resolveGreenCheckImagePath(serviceRoot) };
}

function resolveVSignSignatureFontSize(serviceRoot) {
  const fromFile = readEnvFile(serviceRoot).VSIGN_SIGNATURE_FONT_SIZE;
  if (fromFile && String(fromFile).trim()) {
    return String(fromFile).trim();
  }
  return process.env.VSIGN_SIGNATURE_FONT_SIZE || '10';
}

function resolveVSignSignatureFontSizeForBox(boxHeight, serviceRoot) {
  const height = Number(boxHeight) || VSIGN_SIGNATURE_FONT_REF_HEIGHT;
  const scaled = Math.round(height / 5.8);
  return String(Math.max(10, Math.min(14, scaled)));
}

function formatVSignIstDate(date = new Date()) {
  try {
    return date.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      weekday: 'short',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).replace(',', '') + ' IST ' + date.getFullYear();
  } catch (_) {
    return date.toString();
  }
}

/** Lines matching reference attachment (utility may add one more at render time). */
function estimateVSignAppearanceLines(recipient = {}) {
  const name = String(recipient?.name || 'Signer').trim();
  const aadhaar = String(recipient?.aadhaarNumber || '').replace(/\D/g, '');
  const last4 = aadhaar.slice(-4) || '0000';
  return [
    'Digitally Signed by',
    `Name : ${name}`,
    `Aadhaar No : **** **** ${last4}`,
    `Date : ${formatVSignIstDate()}`,
  ];
}

/** Size appearance box + font from expected signer text (tick scales with box in utility). */
function computeDynamicAppearanceSize(recipient, serviceRoot) {
  const lines = estimateVSignAppearanceLines(recipient);
  let visualLines = lines.length + 1;
  let maxLineLen = 0;
  for (const line of lines) {
    maxLineLen = Math.max(maxLineLen, line.length);
    if (line.length > VSIGN_CHARS_PER_LINE) {
      visualLines += Math.ceil(line.length / VSIGN_CHARS_PER_LINE) - 1;
    }
  }

  let w = Math.max(
    VSIGN_SIGNATURE_BOX_WIDTH,
    Math.min(VSIGN_SIGNATURE_BOX_MAX_WIDTH, Math.round(maxLineLen * 5.6 + 36)),
  );
  let h = Math.max(
    VSIGN_SIGNATURE_BOX_HEIGHT,
    Math.min(
      VSIGN_SIGNATURE_BOX_MAX_HEIGHT,
      visualLines * VSIGN_LINE_HEIGHT_PT + VSIGN_BOX_PADDING_PT,
    ),
  );

  const fontSize = resolveVSignSignatureFontSizeForBox(h, serviceRoot);
  return { w, h, fontSize, visualLines, lineCount: lines.length };
}

function computeHandwrittenStripHeight(fieldHeightPts) {
  return Math.max(Math.round(fieldHeightPts * HANDWRITTEN_HEIGHT_RATIO), HANDWRITTEN_MIN_HEIGHT);
}

function computeSignatureAppearanceBox(field, scale, hasHandwritten, appearanceSize) {
  const pageNum = Number(field.page || 1);
  const x = Math.round(Number(field.x || 0) * scale);
  const baseY = Math.round(Number(field.y || 0) * scale);
  const fieldH = Math.max(1, Number(field.height || VSIGN_SIGNATURE_BOX_HEIGHT) * scale);

  const w = appearanceSize?.w || VSIGN_SIGNATURE_BOX_WIDTH;
  const h = appearanceSize?.h || VSIGN_SIGNATURE_BOX_HEIGHT;

  let y = baseY;
  if (hasHandwritten) {
    y = Math.round(baseY + computeHandwrittenStripHeight(fieldH));
  }

  return { pageNum, x, y, w, h };
}

/** Official VSign ASP kit tick.png — light-blue box + green watermark for appearance block. */
function resolveGreenCheckImagePath(serviceRoot) {
  const fromEnv = readEnvFile(serviceRoot).VSIGN_TICK_IMAGE || process.env.VSIGN_TICK_IMAGE;
  if (fromEnv && String(fromEnv).trim()) {
    const custom = path.isAbsolute(fromEnv)
      ? fromEnv
      : path.join(serviceRoot, String(fromEnv).trim());
    if (fs.existsSync(custom)) {
      return normalizeVSignPath(custom);
    }
  }

  const candidates = [
    path.join(serviceRoot, 'utility', OFFICIAL_TICK_FILENAME),
    path.join(serviceRoot, 'uploads', 'vSign', OFFICIAL_TICK_FILENAME),
    path.join(serviceRoot, 'utility', FALLBACK_TICK_FILENAME),
    path.join(serviceRoot, 'uploads', 'vSign', FALLBACK_TICK_FILENAME),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return normalizeVSignPath(candidate);
    }
  }
  return normalizeVSignPath(candidates[0]);
}

async function buildVSignSignatureDetailsString(pdfPath, signatureFields, options = {}) {
  const hasHandwritten = !!options.hasHandwritten;
  const referenceAppearance = !!options.referenceAppearance;
  const serviceRoot = options.serviceRoot;
  const appearanceSize = referenceAppearance
    ? { ...VSIGN_REFERENCE_APPEARANCE }
    : options.appearanceSize
      || (options.recipient && serviceRoot
        ? computeDynamicAppearanceSize(options.recipient, serviceRoot)
        : null);

  const { PDFDocument } = require('pdf-lib');
  let pdfDoc = null;
  if (pdfPath && fs.existsSync(pdfPath)) {
    try {
      pdfDoc = await PDFDocument.load(fs.readFileSync(pdfPath), { ignoreEncryption: true });
    } catch (err) {
      console.warn('[VSign] Could not read PDF for signature coords:', err.message);
    }
  }

  const BASE_PAGE_WIDTH = 800;
  let maxHeight = 0;
  let maxWidth = VSIGN_SIGNATURE_BOX_WIDTH;
  const boxes = [];
  const parts = signatureFields
    .filter((f) => f.type === 'signature')
    .map((s) => {
      const pageIndex = Math.max(0, Number(s.page || 1) - 1);
      let scale = 1;
      if (pdfDoc) {
        const page = pdfDoc.getPages()[pageIndex];
        if (page) scale = page.getWidth() / BASE_PAGE_WIDTH;
      }

      const box = computeSignatureAppearanceBox(s, scale, hasHandwritten, appearanceSize);
      boxes.push(box);
      maxHeight = Math.max(maxHeight, box.h);
      maxWidth = Math.max(maxWidth, box.w);
      return `${box.pageNum}-${box.x},${box.y},${box.w},${box.h}`;
    });

  const h = referenceAppearance
    ? VSIGN_REFERENCE_APPEARANCE.h
    : maxHeight || appearanceSize?.h || VSIGN_SIGNATURE_BOX_HEIGHT;
  const fontSize = referenceAppearance
    ? VSIGN_REFERENCE_APPEARANCE.fontSize
    : appearanceSize?.fontSize
      || (serviceRoot ? resolveVSignSignatureFontSizeForBox(h, serviceRoot) : '10');

  /** Postman kit native format — utility renders tick/background with this shape. */
  const signaturedetails = boxes.map((box) => ({
    page: String(box.pageNum),
    coordinates: [{
      x: box.x,
      y: box.y,
      w: box.w,
      h: box.h,
    }],
  }));

  return {
    signaturedetails,
    signaturedetailsString: parts.join(';'),
    appearanceHeight: h,
    appearanceWidth: maxWidth,
    signatureFontSize: fontSize,
    appearanceSize: appearanceSize || { w: maxWidth, h, fontSize },
  };
}

/** Copy tick/logo beside utility temp folder (EXE sometimes resolves relative paths). */
function stageVSignAppearanceAssets(serviceRoot, tempInfoPath, appearanceExtras) {
  const staged = { ...appearanceExtras };
  try {
    fs.mkdirSync(tempInfoPath, { recursive: true });
    for (const stale of ['tick.png', 'asplogo.png']) {
      const p = path.join(tempInfoPath, stale);
      if (fs.existsSync(p)) {
        try { fs.unlinkSync(p); } catch (_) { /* ignore */ }
      }
    }
    const files = [['tickImgPath', 'tick.png']];
    for (const [key, fileName] of files) {
      const src = appearanceExtras[key];
      if (!src || !fs.existsSync(src.replace(/\//g, path.sep))) continue;
      const dest = path.join(tempInfoPath, fileName);
      fs.copyFileSync(src.replace(/\//g, path.sep), dest);
      staged[key] = normalizeVSignPath(dest);
    }
  } catch (err) {
    console.warn('[VSign] could not stage appearance assets:', err.message);
  }
  return staged;
}

function resolveVSignServerIp(serviceRoot) {
  const fromFile = serviceRoot ? readEnvFile(serviceRoot).VSIGN_SERVER_IP : null;
  const fromEnv =
    (fromFile && String(fromFile).trim()) ||
    process.env.VSIGN_SERVER_IP ||
    process.env.SERVER_PUBLIC_IP ||
    process.env.PUBLIC_SERVER_IP;
  if (fromEnv && String(fromEnv).trim()) {
    return String(fromEnv).trim();
  }

  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return '127.0.0.1';
}

module.exports = {
  VSIGN_REFERENCE_APPEARANCE,
  buildVSignAppearanceExtras,
  stageVSignAppearanceAssets,
  resolveGreenCheckImagePath,
  resolveVSignCallbackUrl,
  resolveVSignEspResponseUrl,
  resolveVSignServerIp,
  resolveVSignAppearanceMode,
  resolveAspLogoPath,
  resolveVSignEnv,
  resolveVSignCertMode,
  resolveVSignUsesLiveCert,
  resolveVSignPfxPath,
  resolveVSignAspId,
  resolveVSignPfxCredentials,
  resolveVSignAuthPage,
  resolveVSignUtilityUrl,
  resolveVSignSignatureFontSize,
  resolveVSignSignatureFontSizeForBox,
  normalizeVSignPath,
  buildVSignSignatureDetailsString,
  computeSignatureAppearanceBox,
  computeHandwrittenStripHeight,
  estimateVSignAppearanceLines,
  computeDynamicAppearanceSize,
  formatVSignIstDate,
  VSIGN_SIGNATURE_BOX_WIDTH,
  VSIGN_SIGNATURE_BOX_HEIGHT,
  VSIGN_SIGNATURE_BOX_MAX_WIDTH,
  VSIGN_SIGNATURE_BOX_MAX_HEIGHT,
  VSIGN_SIGNATURE_MIN_HEIGHT,
  HANDWRITTEN_HEIGHT_RATIO,
  HANDWRITTEN_MIN_HEIGHT,
};
