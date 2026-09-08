const fs = require('fs');
const path = require('path');
const https = require('https');

const {
  getCompletedAuthMethods,
  getAuthCategory,
  hasCompletedAuthCategory,
  sanitizeSigningEvidence,
} = require('../utils/signingEvidenceHelper');

const C = {
  green: '#1B4D3E',
  greenSoft: '#edf5f1',
  gold: '#C9A227',
  ink: '#1e293b',
  label: '#64748b',
  value: '#0f172a',
  line: '#cbd5e1',
  panel: '#f8fafc',
  white: '#ffffff',
  ok: '#166534',
};

const MARGIN = 36;

function box(doc) {
  const left = MARGIN;
  const width = doc.page.width - MARGIN * 2;
  return { left, width, right: left + width };
}

function pageBottom(doc) {
  return doc.page.height - (doc.page.margins?.bottom || MARGIN);
}

function formatGmtTs(d) {
  const date = d instanceof Date ? d : new Date(d);
  if (!date || Number.isNaN(date.getTime())) return '—';
  const formatted = date.toLocaleString('en-GB', {
    timeZone: 'UTC',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  return `${formatted} GMT`;
}

/** DocuSign-style envelope ID: 8-4-4-4-12 uppercase hex */
function formatDocuSignEnvelopeId(rawId) {
  const { formatDocuMantraEnvelopeId } = require('../utils/envelopeIdFormat');
  return formatDocuMantraEnvelopeId(rawId);
}

function formatTs(d) {
  return formatGmtTs(d);
}

function clip(str, max = 96) {
  const s = String(str || '—');
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

async function resolveImageBuffer(value) {
  if (!value) return null;
  if (Buffer.isBuffer(value)) return value;
  const str = String(value);
  if (str.startsWith('data:image')) {
    try {
      return Buffer.from(str.split(',')[1] || '', 'base64');
    } catch {
      return null;
    }
  }
  try {
    if (fs.existsSync(str)) return fs.readFileSync(str);
  } catch {
    // ignore
  }
  if (!str.startsWith('http')) return null;
  return new Promise((resolve) => {
    https
      .get(str, (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => resolve(Buffer.concat(chunks)));
      })
      .on('error', () => resolve(null));
  });
}

function line(doc, x1, y1, x2, y2) {
  doc.save();
  doc.strokeColor(C.line).lineWidth(0.75).moveTo(x1, y1).lineTo(x2, y2).stroke();
  doc.restore();
}

/** Absolute text — resets doc.y so PDFKit does not auto-add pages. */
function textAt(doc, str, x, y, opts = {}) {
  doc.save();
  doc.text(String(str), x, y, { lineBreak: false, ...opts });
  doc.y = y;
  doc.restore();
}

function drawCheck(doc, cx, cy, r = 8) {
  doc.save();
  doc.circle(cx, cy, r).fill(C.green);
  doc.lineWidth(1.2).strokeColor(C.gold).circle(cx, cy, r - 1).stroke();
  doc.strokeColor('#fff').lineWidth(1.5);
  doc.moveTo(cx - 3.5, cy).lineTo(cx - 0.5, cy + 3).lineTo(cx + 4.5, cy - 3.5).stroke();
  doc.restore();
}

function countAuthSlots(evidence) {
  const authMethods = getCompletedAuthMethods(evidence.authMethods);
  const showLive = hasCompletedAuthCategory(authMethods, 'selfie') || hasCompletedAuthCategory(authMethods, 'liveness');
  const showId = hasCompletedAuthCategory(authMethods, 'liveness') || hasCompletedAuthCategory(authMethods, 'aadhaar');
  let n = 0;
  if (showLive) n += 1;
  if (showId) n += 1;
  const used = new Set();
  if (showLive) used.add('selfie');
  if (showId) used.add('id');
  authMethods.forEach((m) => {
    const cat = getAuthCategory(m);
    if (used.has(cat) || cat === 'selfie' || cat === 'liveness' || (cat === 'aadhaar' && showId)) return;
    used.add(cat);
    n += 1;
  });
  return n;
}

async function drawAuthPhotos(doc, evidence, x, y) {
  const authMethods = getCompletedAuthMethods(evidence.authMethods);
  const showLive = hasCompletedAuthCategory(authMethods, 'selfie') || hasCompletedAuthCategory(authMethods, 'liveness');
  const showId = hasCompletedAuthCategory(authMethods, 'liveness') || hasCompletedAuthCategory(authMethods, 'aadhaar');
  const size = 44;
  let cx = x;

  const photo = async (buf, label, color) => {
    doc.roundedRect(cx, y, size, size, 4).lineWidth(0.7).strokeColor(C.line).fillAndStroke(C.white, C.line);
    if (buf) {
      try {
        doc.save();
        doc.roundedRect(cx + 1.5, y + 1.5, size - 3, size - 3, 3).clip();
        doc.image(buf, cx + 1.5, y + 1.5, { fit: [size - 3, size - 3] });
        doc.restore();
      } catch {
        // ignore
      }
    }
    doc.fillColor(color).font('Helvetica-Bold').fontSize(6);
    textAt(doc, label, cx, y + size + 3, { width: size + 14 });
    cx += size + 10;
  };

  if (showLive) {
    const buf = await resolveImageBuffer(evidence.livePic || evidence.livePicUrl);
    const match = evidence.liveMatchPercent;
    const label = typeof match === 'number' && Number.isFinite(match) ? `Live · ${match}%` : 'Live Pic';
    await photo(buf, label, C.ok);
  }
  if (showId) {
    const buf = await resolveImageBuffer(evidence.idPic || evidence.idPicUrl);
    await photo(buf, 'ID Pic', '#3730a3');
  }
  authMethods.forEach((method) => {
    const cat = getAuthCategory(method);
    if (cat === 'selfie' || cat === 'liveness' || (cat === 'aadhaar' && showId)) return;
    doc.roundedRect(cx, y, size, size, 4).fill(cat === 'aadhaar' ? '#0f766e' : '#2563eb');
    doc.fillColor('#fff').font('Helvetica-Bold').fontSize(6.5);
    textAt(doc, cat === 'aadhaar' ? 'Aadhaar' : 'Auth', cx, y + 17, { width: size, align: 'center' });
    cx += size + 10;
  });
}

const META_ROW_H = 12;
const LOC_ROW_H = 12;

/** Approx Helvetica advance at fontSize — used to clip values to one line. */
function maxCharsForWidth(px, fontSize = 6.5) {
  return Math.max(6, Math.floor(Math.max(0, px) / (fontSize * 0.52)));
}

/**
 * Single-line label/value rows. Never wraps — long values are clipped so
 * Session / IP Location / Timeline columns cannot overlap.
 */
function drawLabelValueRows(doc, x, y, w, rows, { labelW = 42, rowH = META_ROW_H, fontSize = 6.5 } = {}) {
  const valueX = x + labelW + 3;
  const valueW = Math.max(20, w - labelW - 3);
  const maxChars = maxCharsForWidth(valueW, fontSize);
  let rowY = y;

  rows.forEach(([label, value]) => {
    if (value == null || String(value).trim() === '') return;
    doc.fillColor(C.label).font('Helvetica-Bold').fontSize(fontSize);
    textAt(doc, String(label), x, rowY, {
      width: labelW,
      height: rowH - 1,
      ellipsis: true,
      lineBreak: false,
    });
    doc.fillColor(C.value).font('Helvetica').fontSize(fontSize);
    textAt(doc, clip(value, maxChars), valueX, rowY, {
      width: valueW,
      height: rowH - 1,
      ellipsis: true,
      lineBreak: false,
    });
    rowY += rowH;
  });
  return rowY;
}

function buildMetaRows(evidence) {
  return [
    ['Device', evidence.device],
    ['OS', evidence.os],
    ['Browser', evidence.browser],
    ['Sign IP', evidence.ip],
    ['ISP', evidence.isp],
    ['Org', evidence.org],
    ['ASN', evidence.asn],
  ].filter(([, v]) => v != null && String(v).trim() !== '');
}

function buildLocationRows(evidence) {
  const lat = evidence.latitude ?? evidence.lat;
  const lon = evidence.longitude ?? evidence.lon;
  const rows = [];

  // Prefer City over free-form Location to avoid duplicate place text.
  if (evidence.city) rows.push(['City', evidence.city]);
  else if (evidence.location) rows.push(['Location', evidence.location]);

  if (evidence.region) rows.push(['Region', evidence.region]);
  if (evidence.country || evidence.countryCode) {
    rows.push([
      'Country',
      evidence.country
        ? `${evidence.country}${evidence.countryCode ? ` (${evidence.countryCode})` : ''}`
        : evidence.countryCode,
    ]);
  }
  if (evidence.zip) rows.push(['ZIP', evidence.zip]);

  // Lat/Lon OR Coordinates — never both (was causing crowded overlap).
  if (lat != null && lon != null) {
    rows.push(['Lat', String(lat)]);
    rows.push(['Lon', String(lon)]);
  } else if (evidence.geoCoords) {
    rows.push(['Coords', evidence.geoCoords]);
  }

  if (evidence.timezone) rows.push(['TZ', evidence.timezone]);
  return rows;
}

function drawMetaRows(doc, x, y, w, evidence) {
  return drawLabelValueRows(doc, x, y, w, buildMetaRows(evidence), {
    labelW: 40,
    rowH: META_ROW_H,
    fontSize: 6.5,
  });
}

function drawLocationRows(doc, x, y, w, evidence) {
  return drawLabelValueRows(doc, x, y, w, buildLocationRows(evidence), {
    labelW: 40,
    rowH: LOC_ROW_H,
    fontSize: 6.5,
  });
}

function drawTimeline(doc, x, y, w, timeline) {
  let rowY = y;
  const items = (timeline || []).slice(0, 6);
  const textW = Math.max(40, w - 14);
  items.forEach((item, idx) => {
    const event = String(item.event || '—');
    const ts = formatGmtTs(item.at);
    const rowH = 20;

    doc.circle(x + 2.5, rowY + 4, 2).fill(C.green);
    if (idx < items.length - 1) {
      line(doc, x + 2.5, rowY + 7, x + 2.5, rowY + rowH - 2);
    }

    doc.fillColor(C.ink).font('Helvetica-Bold').fontSize(6.6);
    textAt(doc, clip(event, maxCharsForWidth(textW, 6.6)), x + 10, rowY, {
      width: textW,
      height: 8,
      ellipsis: true,
      lineBreak: false,
    });
    doc.fillColor(C.label).font('Helvetica').fontSize(5.7);
    textAt(doc, clip(ts, maxCharsForWidth(textW, 5.7)), x + 10, rowY + 9, {
      width: textW,
      height: 8,
      ellipsis: true,
      lineBreak: false,
    });
    rowY += rowH;
  });
  return rowY;
}

function hasLocationEvidence(evidence) {
  if (!evidence) return false;
  return Boolean(
    evidence.location ||
      evidence.city ||
      evidence.region ||
      evidence.country ||
      evidence.countryCode ||
      evidence.zip ||
      evidence.timezone ||
      evidence.geoCoords ||
      evidence.latitude != null ||
      evidence.lat != null ||
      evidence.longitude != null ||
      evidence.lon != null,
  );
}

function drawTopChrome(doc) {
  doc.save();
  doc.rect(0, 0, doc.page.width, 5).fill(C.green);
  doc.rect(0, 5, doc.page.width, 2).fill(C.gold);
  doc.restore();
}

function drawBottomChrome(doc, envelopeId, pageNo, totalPages) {
  const { left, width, right } = box(doc);
  const footerY = pageBottom(doc) - 10;
  const formattedId = formatDocuSignEnvelopeId(envelopeId);
  line(doc, left, footerY - 6, right, footerY - 6);
  doc.fillColor(C.label).font('Helvetica').fontSize(6.5);
  textAt(doc, `DocuMantra Envelope ID: ${formattedId}`, left, footerY, { width: width * 0.72 });
  textAt(doc, `Page ${pageNo} of ${totalPages}`, left, footerY, { width, align: 'right' });
}

function drawWatermark(doc) {
  doc.save();
  doc.strokeColor('#f1f5f9').lineWidth(0.3);
  for (let i = -100; i < doc.page.width + 100; i += 28) {
    doc.moveTo(i, 0).lineTo(i + 420, doc.page.height).stroke();
  }
  doc.restore();
}

function startNewPage(doc) {
  doc.addPage();
  drawTopChrome(doc);
  drawWatermark(doc);
  return 16;
}

function ensureSpace(doc, y, needed) {
  const limit = pageBottom(doc) - 28;
  if (y + needed <= limit) return y;
  startNewPage(doc);
  return 16;
}

async function renderSinglePageCertificate(doc, { envelope, signers }) {
  const { left, width, right } = box(doc);
  const envelopeId = String(envelope?._id || envelope?.id || '');
  const formattedEnvelopeId = formatDocuSignEnvelopeId(envelopeId);

  drawTopChrome(doc);
  drawWatermark(doc);

  let y = 18;
  doc.fillColor(C.ink).font('Helvetica').fontSize(8);
  textAt(doc, `DocuMantra Envelope ID: ${formattedEnvelopeId}`, left, y);
  y += 22;

  doc.fillColor(C.ink).font('Times-Bold').fontSize(18);
  textAt(doc, 'The Audit Certificate', left, y, { width, align: 'center' });
  y += 18;
  doc.font('Helvetica').fontSize(9).fillColor(C.label);
  textAt(doc, 'Your Complete Signing Footprint', left, y, { width, align: 'center' });
  y += 14;
  doc.font('Helvetica').fontSize(7.5).fillColor('#475569');
  textAt(
    doc,
    'Tamper-evident audit record of verified authentication and signing activity for this envelope.',
    left,
    y,
    { width, align: 'center' },
  );
  y += 18;

  const sealX = left + width / 2 - 50;
  drawCheck(doc, sealX, y + 5, 7);
  doc.fillColor(C.ink).font('Times-Bold').fontSize(11);
  textAt(doc, 'Audit Certificate', sealX + 18, y + 1);
  y += 20;

  const completedAt = signers.map((s) => s.evidence?.signCompletedAt).filter(Boolean).sort().pop();
  const infoH = 36;
  doc.roundedRect(left, y, width, infoH, 5).fillAndStroke(C.greenSoft, C.line);
  const info = [
    ['DOCUMENT', clip(envelope?.subject, 24)],
    ['SIGNERS', String(signers.length)],
    ['COMPLETED', completedAt ? formatGmtTs(completedAt) : '—'],
    ['ENVELOPE', formattedEnvelopeId],
  ];
  const colW = width / 4;
  info.forEach(([label, value], i) => {
    const x = left + i * colW + 8;
    doc.fillColor(C.label).font('Helvetica-Bold').fontSize(6);
    textAt(doc, label, x, y + 7, { width: colW - 10 });
    doc.fillColor(C.ink).font('Helvetica-Bold').fontSize(i === 3 ? 6.2 : 7.5);
    textAt(doc, value, x, y + 17, { width: colW - 10 });
    if (i > 0) line(doc, left + i * colW, y + 5, left + i * colW, y + infoH - 5);
  });
  y += infoH + 10;

  for (let i = 0; i < signers.length; i += 1) {
    const signer = signers[i];
    const evidence = sanitizeSigningEvidence(signer.evidence || {});
    const timeline = signer.timeline || [];
    const hasAuth = countAuthSlots(evidence) > 0;
    const showLocation = hasLocationEvidence(evidence);
    const timelineRows = Math.min((timeline || []).length || 1, 6);
    const timelineBlockH = 14 + timelineRows * 20;
    const metaRowList = buildMetaRows(evidence);
    const locRowList = showLocation ? buildLocationRows(evidence) : [];
    const metaBlockH = 14 + Math.max(metaRowList.length, 1) * META_ROW_H;
    const locBlockH = showLocation ? 14 + Math.max(locRowList.length, 1) * LOC_ROW_H : 0;
    const contentH = Math.max(hasAuth ? 70 : 40, metaBlockH, locBlockH, timelineBlockH);
    const signatureReserve = 48;
    const panelH = Math.max(120, 28 + contentH + signatureReserve);
    const extraH = (evidence.evidenceHash ? 16 : 0) + (evidence.userAgent ? 9 : 0) + 8;
    y = ensureSpace(doc, y, panelH + extraH + 6);
    doc.roundedRect(left, y, width, panelH, 6).lineWidth(0.9).strokeColor(C.line).fillAndStroke(C.panel, C.line);
    doc.rect(left, y, width, 22).fill('#eef2f6');
    line(doc, left, y + 22, right, y + 22);

    doc.fillColor(C.green).font('Helvetica-Bold').fontSize(7);
    doc.roundedRect(left + 8, y + 5, 14, 12, 6).fill(C.green);
    doc.fillColor('#fff').fontSize(6.5);
    textAt(doc, String(i + 1), left + 8, y + 7.5, { width: 14, align: 'center' });

    const name = `${signer.name || 'Signer'}${signer.aadhaarMasked ? ` (Aadhaar ${signer.aadhaarMasked})` : ''}`;
    doc.fillColor(C.ink).font('Helvetica-Bold').fontSize(8.5);
    textAt(doc, clip(name, 40), left + 28, y + 6, { width: width * 0.42 });

    doc.fillColor(C.label).font('Helvetica').fontSize(7);
    textAt(doc, clip(signer.email || '—', 34), left + width * 0.46, y + 7, { width: width * 0.3, align: 'right' });

    doc.roundedRect(left + width - 50, y + 5, 42, 12, 6).fill('#dcfce7');
    doc.fillColor(C.ok).font('Helvetica-Bold').fontSize(6);
    textAt(doc, 'VERIFIED', left + width - 50, y + 7.5, { width: 42, align: 'center' });

    const bodyY = y + 28;
    const gap = 8;
    // Keep Session / IP Location readable — do not crush them for the timeline.
    const MIN_META = 118;
    const MIN_LOC = 108;
    const MIN_TIME = 120;
    let authW = hasAuth ? Math.min(108, width * 0.18) : 0;
    let locW = showLocation ? Math.max(MIN_LOC, Math.min(128, width * 0.22)) : 0;
    let metaW = Math.max(MIN_META, Math.min(148, width * 0.26));
    let timeW = width - authW - metaW - locW - gap * (1 + (hasAuth ? 1 : 0) + (showLocation ? 1 : 0)) - 16;
    if (timeW < MIN_TIME) {
      const need = MIN_TIME - timeW;
      // Steal from auth first, then a little from meta/loc, never below floors.
      if (authW > 72) {
        const take = Math.min(authW - 72, need);
        authW -= take;
        timeW += take;
      }
      if (timeW < MIN_TIME && metaW > MIN_META) {
        const take = Math.min(metaW - MIN_META, MIN_TIME - timeW);
        metaW -= take;
        timeW += take;
      }
      if (timeW < MIN_TIME && locW > MIN_LOC) {
        const take = Math.min(locW - MIN_LOC, MIN_TIME - timeW);
        locW -= take;
        timeW += take;
      }
    }

    const metaX = left + 10 + (hasAuth ? authW + gap : 0);
    const locX = metaX + metaW + (showLocation ? gap : 0);
    const timeX = showLocation ? locX + locW + gap : metaX + metaW + gap;
    const dividerBottom = y + panelH - signatureReserve;

    if (hasAuth) {
      doc.fillColor(C.green).font('Helvetica-Bold').fontSize(6);
      textAt(doc, 'IDENTITY', left + 10, bodyY);
      await drawAuthPhotos(doc, evidence, left + 10, bodyY + 8);
      line(doc, metaX - gap / 2, bodyY - 2, metaX - gap / 2, dividerBottom);
    }

    doc.fillColor(C.green).font('Helvetica-Bold').fontSize(6);
    textAt(doc, 'SESSION DETAILS', metaX, bodyY, { width: metaW });
    drawMetaRows(doc, metaX, bodyY + 8, metaW, evidence);
    if (showLocation) {
      line(doc, locX - gap / 2, bodyY - 2, locX - gap / 2, dividerBottom);
    } else {
      line(doc, timeX - gap / 2, bodyY - 2, timeX - gap / 2, dividerBottom);
    }

    if (showLocation) {
      doc.fillColor(C.green).font('Helvetica-Bold').fontSize(6);
      textAt(doc, 'IP LOCATION', locX, bodyY, { width: locW });
      drawLocationRows(doc, locX, bodyY + 8, locW, evidence);
      line(doc, timeX - gap / 2, bodyY - 2, timeX - gap / 2, dividerBottom);
    }

    doc.fillColor(C.green).font('Helvetica-Bold').fontSize(6);
    textAt(doc, 'AUDIT TIMELINE (GMT)', timeX, bodyY, { width: timeW });
    drawTimeline(doc, timeX, bodyY + 10, timeW, timeline);

    const handwritten = await resolveImageBuffer(evidence.handwrittenSignature);
    if (handwritten) {
      try {
        const sx = left + width - 82;
        const sy = y + panelH - 42;
        doc.roundedRect(sx - 2, sy - 2, 76, 24, 3).fillAndStroke(C.white, C.line);
        doc.image(handwritten, sx, sy, { fit: [72, 20] });
        doc.fillColor(C.ink).font('Helvetica-Bold').fontSize(6.5);
        textAt(doc, clip(signer.name || 'Signer', 28), sx - 2, sy + 22, { width: 76, align: 'center' });
        doc.fillColor(C.label).font('Helvetica').fontSize(6);
        textAt(doc, clip(signer.email || '—', 30), sx - 2, sy + 31, { width: 76, align: 'center' });
      } catch {
        // ignore
      }
    }

    y += panelH + 6;

    if (evidence.evidenceHash) {
      doc.roundedRect(left, y, width, 13, 3).fill('#f1f5f9');
      doc.fillColor(C.ink).font('Courier').fontSize(6);
      textAt(doc, `Hash: ${clip(evidence.evidenceHash, 90)}`, left + 6, y + 3, { width: width - 12 });
      y += 16;
    }
    if (evidence.userAgent) {
      doc.fillColor(C.label).font('Helvetica').fontSize(5.8);
      textAt(doc, `User Agent: ${clip(evidence.userAgent, 115)}`, left, y, { width });
      y += 9;
    }
    y += 2;
  }

  y = ensureSpace(doc, y, 20);
  doc.roundedRect(left, y, width, 16, 4).fillAndStroke(C.greenSoft, C.line);
  doc.fillColor('#475569').font('Helvetica').fontSize(6.8);
  textAt(
    doc,
    `Generated by DocuMantra on ${formatGmtTs(new Date())} · Tamper-evident audit record`,
    left + 8,
    y + 4,
    { width: width - 16, align: 'center' },
  );
}

async function renderOtpSignAuditCertificate(doc, { envelope, signers }) {
  const envelopeId = String(envelope?._id || envelope?.id || '');

  await renderSinglePageCertificate(doc, { envelope, signers });

  const range = doc.bufferedPageRange();
  const totalPages = range.count;
  for (let i = range.start; i < range.start + range.count; i += 1) {
    doc.switchToPage(i);
    drawBottomChrome(doc, envelopeId, i - range.start + 1, totalPages);
  }
}

module.exports = {
  renderOtpSignAuditCertificate,
  formatTs,
  formatGmtTs,
  formatDocuSignEnvelopeId,
};
