const fs = require('fs');
const path = require('path');
const os = require('os');
const dotenv = require('dotenv');
const { getCachedEffectiveConfig, resolveEspResponseUrl } = require('./vsignConfigPolicy');
const {
  getBrandLogoUrl,
  refreshBrandingCache,
} = require('@draftnsign/validators/brandConfig');

const OFFICIAL_TICK_FILENAME = 'tick.png';
const FALLBACK_TICK_FILENAME = 'aadhaar-green-check.png';

/** Readable Aadhaar appearance — light-blue box, checkmark bottom-left, no duplicate watermark text. */
const VSIGN_SIGNATURE_BOX_WIDTH = 280;
const VSIGN_SIGNATURE_BOX_HEIGHT = 85;
const VSIGN_REFERENCE_APPEARANCE = { w: 280, h: 85, fontSize: '9' };
const VSIGN_SIGNATURE_BOX_MAX_WIDTH = 320;
const VSIGN_SIGNATURE_BOX_MAX_HEIGHT = 110;
const HANDWRITTEN_HEIGHT_RATIO = 0.38;
const HANDWRITTEN_MIN_HEIGHT = 36;
const VSIGN_SIGNATURE_MIN_HEIGHT = 85;
const VSIGN_SIGNATURE_FONT_REF_HEIGHT = 85;
/** Light blue — Arun Dixit reference box (#E8F2FF). */
const VSIGN_BOX_BG_RGB = { r: 232, g: 242, b: 255 };
const VSIGN_LINE_HEIGHT_PT = 14;
const VSIGN_BOX_PADDING_PT = 18;
/** Approx chars per line at default box width (280pt) — used to estimate wrapped lines. */
const VSIGN_CHARS_PER_LINE = 40;

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

/** Forward slashes for in-container fs (do not remap — Node cannot read host /root paths). */
function normalizeVSignPath(filePath) {
  if (!filePath) return filePath;
  return path.resolve(filePath).replace(/\\/g, '/');
}

/** Paths sent to host VSign JAR (utility runs outside Docker). */
function toHostUtilityPath(filePath) {
  if (!filePath) return filePath;
  const resolved = normalizeVSignPath(filePath);
  const dockerPrefix = (process.env.VSIGN_DOCKER_PATH_PREFIX || '/app/services/e-sign-service')
    .replace(/\\/g, '/')
    .replace(/\/+$/, '');
  const hostPrefix = (process.env.VSIGN_HOST_PATH_PREFIX || '')
    .replace(/\\/g, '/')
    .replace(/\/+$/, '');
  if (hostPrefix && dockerPrefix && resolved.startsWith(`${dockerPrefix}/`)) {
    return hostPrefix + resolved.slice(dockerPrefix.length);
  }
  if (hostPrefix && dockerPrefix && resolved === dockerPrefix) {
    return hostPrefix;
  }
  return resolved;
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

const VSIGN_UAT_PFX_PASSWORD = 'abc1234';
const VSIGN_UAT_PFX_ALIAS = '{05ae2e10-4f6d-41a6-9f83-4d0025ca28a0}';

function loadVSignUatSecrets(serviceRoot) {
  const secretsPath = path.join(serviceRoot, 'config', 'vsign', 'secrets', 'uat.env');
  if (!fs.existsSync(secretsPath)) return {};
  try {
    return dotenv.parse(fs.readFileSync(secretsPath));
  } catch (err) {
    console.warn('[VSign] Failed to read UAT secrets file:', err.message);
    return {};
  }
}

function resolveVSignPfxCredentials(serviceRoot) {
  const cfg = getEffectiveVSign();
  const fromFile = readEnvFile(serviceRoot);
  const password = (
    cfg.pfxPassword
    || fromFile.PFX_PASSWORD
    || process.env.PFX_PASSWORD
    || ''
  ).trim();
  let alias = (
    cfg.pfxAlias
    || fromFile.PFX_ALIAS
    || process.env.PFX_ALIAS
    || ''
  ).trim().replace(/^"|"$/g, '');
  const usesLiveCert = resolveVSignUsesLiveCert(serviceRoot);
  if (usesLiveCert) {
    return { password, alias, usesLiveCert };
  }
  const uatSecrets = loadVSignUatSecrets(serviceRoot);
  const uatPassword = (uatSecrets.PFX_PASSWORD || VSIGN_UAT_PFX_PASSWORD).trim();
  const uatAlias = (uatSecrets.PFX_ALIAS || VSIGN_UAT_PFX_ALIAS).trim().replace(/^"|"$/g, '');
  return {
    password: uatPassword,
    alias: uatAlias,
    usesLiveCert,
  };
}

function resolveVSignAuthPage(serviceRoot) {
  const cfg = getEffectiveVSign();
  const configured = (cfg.vsignAuthPage || process.env.VSIGN_AUTHPAGE || '').trim();
  if (configured) return configured.replace(/\/+$/, '');
  return resolveVSignEnv(serviceRoot) === 'production'
    ? 'https://esign.verasys.in/esp'
    : 'https://esignuat.vsign.in/esp';
}

/**
 * Public HTTPS logo for VSign authpagev4 — production (live) only.
 * Same Supabase branding bucket as website / BrandLogo / transactional emails.
 */
function resolveVSignAuthLogoUrl(serviceRoot) {
  if (resolveVSignEnv(serviceRoot) !== 'production') return '';
  const cfg = getEffectiveVSign();
  const fromStored = String(cfg.vsignAuthLogoUrl || '').trim();
  if (fromStored) return fromStored;
  const fromBrandEnv = String(process.env.BRAND_LOGO_URL || '').trim();
  if (fromBrandEnv) return fromBrandEnv;
  return getBrandLogoUrl();
}

async function resolveVSignAuthLogoUrlFresh(serviceRoot) {
  if (resolveVSignEnv(serviceRoot) !== 'production') return '';
  try {
    await refreshBrandingCache();
  } catch (_) {
    /* use cached / default */
  }
  return resolveVSignAuthLogoUrl(serviceRoot);
}

/**
 * VSign authdata: logoVal|colorid|aadhaarno (use "-" for unused parts).
 * @see ASP Auth Page Logo kit — encode result as Base64 URL segment before /authpagev4
 */
function buildVSignAuthDataString({ logoUrl, colorId, aadhaarNumber } = {}) {
  const logoVal = (logoUrl && String(logoUrl).trim()) || '-';
  const color = (colorId && String(colorId).trim()) || '-';
  const aadhaar = String(aadhaarNumber || '').replace(/\D/g, '');
  const aadhaarVal = aadhaar || '-';
  return `${logoVal}|${color}|${aadhaarVal}`;
}

function encodeVSignAuthDataSegment(authData) {
  return Buffer.from(String(authData), 'utf8').toString('base64');
}

function resolveVSignEspBaseUrl(authPageBase) {
  const base = String(authPageBase || '').replace(/\/+$/, '');
  if (base.endsWith('/authpage')) return base.replace(/\/authpage$/, '');
  return base;
}

/**
 * UAT & production: {espBase}/{base64(logo|-|-|aadhaar)}/authpagev4
 * @see https://esign.verasys.in/esp/<logobase64>/authpagev4
 */
async function buildVSignAuthUrl(serviceRoot, aadhaarNumber) {
  const authPage = resolveVSignAuthPage(serviceRoot);
  const base = authPage.replace(/\/+$/, '');
  const logoUrl = await resolveVSignAuthLogoUrlFresh(serviceRoot);
  const authData = buildVSignAuthDataString({
    logoUrl: logoUrl || undefined,
    aadhaarNumber,
  });
  const espBase = resolveVSignEspBaseUrl(base);
  const segment = encodeVSignAuthDataSegment(authData);
  return `${espBase}/${segment}/authpagev4`;
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
    const d = date instanceof Date ? date : new Date(date);
    const datePart = d.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      weekday: 'short',
      month: 'short',
      day: '2-digit',
    });
    const timePart = d.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
    const dayMonth = datePart.replace(/^(\w+),\s*/, '$1 ').trim();
    return `${dayMonth}, ${timePart} IST ${d.getFullYear()}`;
  } catch (_) {
    return date.toString();
  }
}

/** Lines matching reference attachment (utility may add one more at render time). */
function estimateVSignAppearanceLines(recipient = {}, verifiedAt = null) {
  const name = String(recipient?.name || 'Signer').trim();
  const aadhaar = String(recipient?.aadhaarNumber || '').replace(/\D/g, '');
  const last4 =
    String(recipient?.aadhaarLast4 || '').replace(/\D/g, '').slice(-4) ||
    aadhaar.slice(-4) ||
    '';
  const at = verifiedAt ? new Date(verifiedAt) : new Date();
  return [
    'Digitally Signed by',
    `Name : ${name}`,
    `Aadhaar No : **** **** ${last4 || '----'}`,
    `Date : ${formatVSignIstDate(at)}`,
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
  const fieldW = Math.max(1, Number(field.width || VSIGN_SIGNATURE_BOX_WIDTH) * scale);
  const fieldH = Math.max(1, Number(field.height || VSIGN_SIGNATURE_BOX_HEIGHT) * scale);

  let w = appearanceSize?.w || VSIGN_SIGNATURE_BOX_WIDTH;
  let h = appearanceSize?.h || VSIGN_SIGNATURE_BOX_HEIGHT;
  let y = baseY;

  if (hasHandwritten) {
    // Place full Aadhaar block below the handwritten strip. Do NOT clamp to
    // leftover field height — small signature fields leave ~1pt remaining and
    // the downloaded PDF only shows a thin blue line (UI React overlay still
    // looks fine because it expands freely).
    const handH = computeHandwrittenStripHeight(fieldH);
    w = Math.round(Math.max(w, Math.min(fieldW, VSIGN_SIGNATURE_BOX_WIDTH)));
    h = Math.max(Number(h) || VSIGN_SIGNATURE_BOX_HEIGHT, VSIGN_SIGNATURE_MIN_HEIGHT);
    y = Math.round(baseY + handH);
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

/** Green checkmark only (no blue box) — for background watermark behind signer text. */
function resolveGreenCheckmarkOnlyPath(serviceRoot) {
  const candidates = [
    path.join(serviceRoot, 'utility', FALLBACK_TICK_FILENAME),
    path.join(serviceRoot, 'uploads', 'vSign', FALLBACK_TICK_FILENAME),
    path.join(serviceRoot, 'utility', 'tick-official-src.png'),
    path.join(serviceRoot, 'uploads', 'vSign', 'tick-official-src.png'),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return normalizeVSignPath(candidate);
    }
  }
  return resolveGreenCheckImagePath(serviceRoot);
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
    : (serviceRoot ? resolveVSignSignatureFontSizeForBox(h, serviceRoot) : null)
      || appearanceSize?.fontSize
      || '10';

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
function stageVSignAppearanceAssets(serviceRoot, tempInfoPath, appearanceExtras, txn) {
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
      staged[key] = toHostUtilityPath(dest);
    }
    if (txn && staged.tickImgPath) {
      const srcTick = staged.tickImgPath.replace(/\//g, path.sep);
      for (const sub of [path.join(tempInfoPath, String(txn)), path.join(tempInfoPath, String(txn), '1')]) {
        fs.mkdirSync(sub, { recursive: true });
        const txnTick = path.join(sub, 'tick.png');
        fs.copyFileSync(srcTick, txnTick);
      }
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
  resolveGreenCheckmarkOnlyPath,
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
  resolveVSignAuthLogoUrl,
  resolveVSignAuthLogoUrlFresh,
  buildVSignAuthDataString,
  encodeVSignAuthDataSegment,
  buildVSignAuthUrl,
  resolveVSignUtilityUrl,
  toHostUtilityPath,
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
