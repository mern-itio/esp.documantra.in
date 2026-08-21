// generateAndStoreCompletionCertificate(envelopeId)
// - Generates a completion certificate PDF (pdfkit).
// - Ensures uploads/certificates exists and writes the PDF file there.
// - Returns { buffer, filename, filepath } on success.
// - Throws on failure.
//
// Dependencies: npm i pdfkit
// Models: Envelope, Certificate, DigitalSignature, SignatureField, AuditLog, Recipient
// Adjust require paths to match your repo structure if needed.

const PDFDocument = require('pdfkit');
const fs = require('fs').promises;
const path = require('path');
const {
  maskAadhaar,
  mergeSigningEvidence,
  buildDefaultTimeline,
  filterCertificateAuditLogs,
  sanitizeSigningEvidence,
  buildVerifiedAuthMethodsFromEvidence,
  enrichEvidenceWithIpGeo,
} = require('../utils/signingEvidenceHelper');
const { renderOtpSignAuditCertificate } = require('./certificateOtpSignLayout');

function toDate(d) {
  if (!d) return null;
  if (d instanceof Date) return d;
  if (typeof d === 'number') return new Date(d);
  if (d && d.$date && d.$date.$numberLong) return new Date(Number(d.$date.$numberLong));
  if (d && d.$date) return new Date(d.$date);
  return new Date(d);
}

function pad2(n) {
  return String(n).padStart(2, '0');
}

const CERTIFICATE_TIME_ZONE = process.env.CERTIFICATE_TIMEZONE || 'Asia/Kolkata';

function formatTimestampLocal(d, timeZone = CERTIFICATE_TIME_ZONE) {
  const date = toDate(d);
  if (!date) return '';
  // Human-friendly and non-technical readable format.
  // (pdfkit uses embedded fonts; Intl formatting keeps it readable for most locales.)
  return date.toLocaleString('en-IN', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

function safeJson(value) {
  try {
    return JSON.stringify(value ?? {});
  } catch (e) {
    return '[unprintable details]';
  }
}

function stringifyShort(value, maxLen = 320) {
  const s = safeJson(value);
  if (s.length <= maxLen) return s;
  return `${s.slice(0, maxLen)}...`;
}

const AUDIT_TITLES = {
  RECIPIENT_REASSIGNED: 'Recipient reassigned (old signer became CC)',
  CERT_ISSUED: 'Completion certificate issued',
  VISUAL_SIGNATURE_SAVED: 'Visual signature saved',
  TSA_VISUAL_ATTEMPT: 'Attempt to add TSA time-stamp (visual signing)',
  TSA_VISUAL_FAILED: 'TSA time-stamp request failed (visual signing)',
  TSA_REQUEST_FAILED: 'TSA time-stamp request failed',
  TSA_TIMESTAMPED: 'TSA time-stamp added',
  DOC_SIGNED: 'Document signed',
  SIGNING_FAILED: 'Signing failed (a signer could not sign)',
  FINAL_SIGNED_SAVED: 'Final signed PDF saved',
  FINAL_SAVE_FAILED: 'Final PDF save failed',
  PEM_SIGNING_FAILED: 'Signing failed (PEM key)',
  P12_SIGNING_FAILED: 'Signing failed (P12 key)',
  NO_SIGNER_FOR_FIELD: 'No signer found for this field',
  NO_CERT_FOUND: 'No certificate found for this field',
  CERT_MALFORMED: 'Certificate data was invalid',
  PREPARED_OVERWRITE_FAILED: 'Prepared document update failed',
  PLACEHOLDER_ADD_FAILED: 'Signature placeholder could not be added',
  TSA_TOKEN_ATTACHED: 'TSA token attached to the signature',
  TSA_TOKEN_ISSUED: 'TSA token issued',
  BLOCKCHAIN_ANCHORED: 'Blockchain anchoring completed',
};

function getAuditTitle(action) {
  if (!action) return 'Audit event';
  return AUDIT_TITLES[action] || action.toString().replace(/_/g, ' ').toLowerCase().replace(/(^|\s)\S/g, (t) => t.toUpperCase());
}

function renderRecipientLine(doc, label, recipientName, recipientEmail) {
  const name = recipientName || 'Unknown';
  const email = recipientEmail ? ` <${recipientEmail}>` : '';
  doc.fontSize(9).text(`${label}: ${name}${email}`);
}

function renderDetailsForUser(doc, log, recipientMap) {
  const details = log?.details || {};

  if (log.action === 'RECIPIENT_REASSIGNED') {
    renderRecipientLine(doc, 'From', details?.previousRecipientName, details?.previousRecipientEmail);
    renderRecipientLine(doc, 'To', details?.newRecipientName, details?.newRecipientEmail);
    doc.fontSize(9).text(`Reason: ${details?.reason || '—'}`);
    return;
  }

  if (log.action === 'CERT_ISSUED') {
    if (details?.certSerial) doc.fontSize(9).text(`Certificate Serial: ${details.certSerial}`);
    if (details?.issuer) doc.fontSize(9).text(`Issuer: ${details.issuer}`);
    if (!details?.certSerial && !details?.issuer) doc.fontSize(9).text(`Details: ${stringifyShort(details)}`);
    return;
  }

  if (
    log.action === 'PEM_SIGNING_FAILED' ||
    log.action === 'P12_SIGNING_FAILED' ||
    log.action === 'SIGNING_FAILED' ||
    log.action === 'TSA_VISUAL_FAILED' ||
    log.action === 'FINAL_SAVE_FAILED' ||
    log.action === 'PREPARED_OVERWRITE_FAILED' ||
    log.action === 'PLACEHOLDER_ADD_FAILED'
  ) {
    if (details?.error) {
      doc.fontSize(9).text(`Error: ${details.error}`);
    } else {
      doc.fontSize(9).text(`Details: ${stringifyShort(details)}`);
    }
    if (details?.fieldId) doc.fontSize(9).text(`Field ID: ${String(details.fieldId)}`);
    return;
  }

  if (log.action === 'NO_SIGNER_FOR_FIELD') {
    if (details?.fieldId) doc.fontSize(9).text(`Field ID: ${String(details.fieldId)}`);
    doc.fontSize(9).text('We could not find a signer for this field.');
    return;
  }

  if (log.action === 'NO_CERT_FOUND') {
    if (details?.fieldId) doc.fontSize(9).text(`Field ID: ${String(details.fieldId)}`);
    doc.fontSize(9).text('No signing certificate was available for this field.');
    return;
  }

  if (log.action === 'CERT_MALFORMED') {
    if (details?.fieldId) doc.fontSize(9).text(`Field ID: ${String(details.fieldId)}`);
    doc.fontSize(9).text('A certificate was found, but its data was not usable.');
    return;
  }

  if (log.action === 'VISUAL_SIGNATURE_SAVED') {
    if (typeof details?.signaturePresent === 'boolean') {
      doc.fontSize(9).text(`Signature present: ${details.signaturePresent ? 'Yes' : 'No'}`);
    } else {
      doc.fontSize(9).text(`Details: ${stringifyShort(details)}`);
    }
    return;
  }

  if (log.action === 'TSA_VISUAL_ATTEMPT') {
    if (typeof details?.ok === 'boolean') {
      doc.fontSize(9).text(`TSA attempt result: ${details.ok ? 'Success' : 'Failed'}`);
    }
    if (details?.error) doc.fontSize(9).text(`Error: ${details.error}`);
    if (!details?.ok && !details?.error) doc.fontSize(9).text(`Details: ${stringifyShort(details)}`);
    return;
  }

  if (log.action === 'TSA_REQUEST_FAILED') {
    if (details?.error) {
      doc.fontSize(9).text(`TSA request failed: ${details.error}`);
    } else {
      doc.fontSize(9).text(`TSA request failed. Details: ${stringifyShort(details)}`);
    }
    return;
  }

  if (log.action === 'TSA_TOKEN_ATTACHED') {
    if (details?.signatureId) doc.fontSize(9).text(`Signature ID: ${String(details.signatureId)}`);
    doc.fontSize(9).text('Security time-stamp data was attached to the signature.');
    return;
  }

  if (log.action === 'TSA_TOKEN_ISSUED') {
    if (details?.pdfHash) doc.fontSize(9).text(`Document hash: ${String(details.pdfHash)}`);
    doc.fontSize(9).text('TSA time-stamp token was created.');
    return;
  }

  if (log.action === 'TSA_TIMESTAMPED') {
    if (details?.timestampHash) doc.fontSize(9).text(`Timestamp hash: ${details.timestampHash}`);
    doc.fontSize(9).text(`TSA status: Added`);
    return;
  }

  if (log.action === 'DOC_SIGNED') {
    if (details?.signatureId) doc.fontSize(9).text(`Signature ID: ${details.signatureId}`);
    if (details?.savedPath) doc.fontSize(9).text(`Saved file path: ${details.savedPath}`);
    if (details?.pdfHash) doc.fontSize(9).text(`PDF hash: ${details.pdfHash}`);
    if (!details?.signatureId && !details?.savedPath && !details?.pdfHash) doc.fontSize(9).text(`Details: ${stringifyShort(details)}`);
    return;
  }

  if (log.action === 'FINAL_SIGNED_SAVED') {
    if (details?.path) doc.fontSize(9).text(`Final signed PDF: ${details.path}`);
    else doc.fontSize(9).text(`Details: ${stringifyShort(details)}`);
    return;
  }

  if (log.action === 'BLOCKCHAIN_ANCHORED') {
    if (details?.txHash) doc.fontSize(9).text(`Transaction hash: ${String(details.txHash)}`);
    if (details?.merkleRoot) doc.fontSize(9).text(`Merkle root: ${String(details.merkleRoot)}`);
    doc.fontSize(9).text('A proof was stored on the blockchain for extra verification.');
    return;
  }

  // Default: show the most useful keys, otherwise short JSON.
  if (details && typeof details === 'object') {
    const preferredKeys = ['reason', 'error', 'ok', 'signaturePresent', 'certSerial', 'savedPath', 'path', 'pdfHash', 'signatureId'];
    const keys = Object.keys(details);
    const selected = [];
    for (const k of preferredKeys) {
      if (Object.prototype.hasOwnProperty.call(details, k)) selected.push(k);
    }
    if (selected.length === 0) selected.push(...keys.slice(0, 4));

    selected.slice(0, 6).forEach((k) => {
      const v = details[k];
      const label = k.toString().replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());
      doc.fontSize(9).text(`${label}: ${typeof v === 'object' ? stringifyShort(v) : (v ?? '—')}`);
    });
    if (selected.length === 0) doc.fontSize(9).text(`Details: ${stringifyShort(details)}`);
    return;
  }

  doc.fontSize(9).text(`Details: ${stringifyShort(details)}`);
}

function getAuditTone(action) {
  const a = (action || '').toString();
  const tone = {
    strip: '#3b82f6', // blue
    label: '#0f172a', // near-black
  };

  if (a === 'RECIPIENT_REASSIGNED') {
    tone.strip = '#f59e0b'; // amber
  } else if (
    a === 'TSA_REQUEST_FAILED' ||
    a === 'TSA_VISUAL_FAILED' ||
    a === 'SIGNING_FAILED' ||
    a === 'PEM_SIGNING_FAILED' ||
    a === 'P12_SIGNING_FAILED' ||
    a === 'FINAL_SAVE_FAILED' ||
    a === 'PREPARED_OVERWRITE_FAILED' ||
    a === 'PLACEHOLDER_ADD_FAILED' ||
    a === 'NO_CERT_FOUND' ||
    a === 'CERT_MALFORMED'
  ) {
    tone.strip = '#ef4444'; // red
  } else if (a === 'DOC_SIGNED' || a === 'FINAL_SIGNED_SAVED' || a === 'TSA_TIMESTAMPED') {
    tone.strip = '#10b981'; // green
  }

  return tone;
}

function collectDetailsLinesForUser(log) {
  const action = log?.action;
  const details = log?.details || {};

  if (action === 'RECIPIENT_REASSIGNED') {
    const fromName = details?.previousRecipientName || 'Unknown';
    const fromEmail = details?.previousRecipientEmail ? ` <${details.previousRecipientEmail}>` : '';
    const toName = details?.newRecipientName || 'Unknown';
    const toEmail = details?.newRecipientEmail ? ` <${details.newRecipientEmail}>` : '';
    return [
      `From: ${fromName}${fromEmail}`,
      `To: ${toName}${toEmail}`,
      `Reason: ${details?.reason || '—'}`,
    ];
  }

  if (action === 'CERT_ISSUED') {
    return [
      `Certificate serial: ${details?.certSerial || '—'}`,
      details?.issuer ? `Issuer: ${details.issuer}` : null,
    ].filter(Boolean);
  }

  if (action === 'VISUAL_SIGNATURE_SAVED') {
    if (typeof details?.signaturePresent === 'boolean') {
      return [`Signature shown to the user: ${details.signaturePresent ? 'Yes' : 'No'}`];
    }
    return [`Details: ${stringifyShort(details)}`];
  }

  if (action === 'TSA_VISUAL_ATTEMPT') {
    const ok = typeof details?.ok === 'boolean' ? (details.ok ? 'Success' : 'Failed') : '—';
    if (details?.error) return [`TSA attempt: ${ok}`, `Error: ${details.error}`];
    return [`TSA attempt: ${ok}`];
  }

  if (action === 'TSA_REQUEST_FAILED' || action === 'TSA_VISUAL_FAILED') {
    return [
      `TSA time-stamp request: Failed`,
      details?.error ? `Error: ${details.error}` : null,
    ].filter(Boolean);
  }

  if (action === 'TSA_TOKEN_ISSUED') {
    return [
      'TSA token created.',
      details?.pdfHash ? `Document hash: ${details.pdfHash}` : null,
    ].filter(Boolean);
  }

  if (action === 'TSA_TOKEN_ATTACHED') {
    return [
      'TSA time-stamp attached to the signature.',
      details?.signatureId ? `Signature ID: ${details.signatureId}` : null,
    ].filter(Boolean);
  }

  if (action === 'TSA_TIMESTAMPED') {
    return [
      'TSA time-stamp added.',
      details?.timestampHash ? `Timestamp hash: ${details.timestampHash}` : null,
    ].filter(Boolean);
  }

  if (action === 'DOC_SIGNED') {
    return [
      details?.signatureId ? `Signature ID: ${details.signatureId}` : null,
      details?.pdfHash ? `Document hash: ${details.pdfHash}` : null,
      details?.savedPath ? `Saved file: ${details.savedPath}` : null,
    ].filter(Boolean);
  }

  if (action === 'FINAL_SIGNED_SAVED') {
    return [
      details?.path ? `Final signed PDF: ${details.path}` : 'Final signed PDF saved.',
    ];
  }

  if (
    action === 'PEM_SIGNING_FAILED' ||
    action === 'P12_SIGNING_FAILED' ||
    action === 'SIGNING_FAILED' ||
    action === 'FINAL_SAVE_FAILED' ||
    action === 'PREPARED_OVERWRITE_FAILED' ||
    action === 'PLACEHOLDER_ADD_FAILED' ||
    action === 'CERT_MALFORMED' ||
    action === 'NO_CERT_FOUND'
  ) {
    const lines = [];
    if (details?.error) lines.push(`Error: ${details.error}`);
    if (details?.fieldId) lines.push(`Field ID: ${String(details.fieldId)}`);
    if (lines.length === 0) lines.push(`Details: ${stringifyShort(details)}`);
    return lines;
  }

  if (action === 'NO_SIGNER_FOR_FIELD') {
    return [
      'We could not find a signer for this field.',
      details?.fieldId ? `Field ID: ${String(details.fieldId)}` : null,
    ].filter(Boolean);
  }

  if (action === 'BLOCKCHAIN_ANCHORED') {
    return [
      details?.txHash ? `Transaction hash: ${String(details.txHash)}` : null,
      details?.merkleRoot ? `Merkle root: ${String(details.merkleRoot)}` : null,
      details?.index != null ? `Leaf index: ${String(details.index)}` : null,
      'Extra verification data was stored on the blockchain.',
    ].filter(Boolean);
  }

  // Generic fallback: show a few meaningful keys first.
  if (details && typeof details === 'object') {
    const preferredKeys = ['reason', 'error', 'ok', 'signaturePresent', 'certSerial', 'savedPath', 'path', 'pdfHash', 'signatureId'];
    const keys = Object.keys(details);
    const selected = [];
    for (const k of preferredKeys) {
      if (Object.prototype.hasOwnProperty.call(details, k)) selected.push(k);
    }
    if (selected.length === 0) selected.push(...keys.slice(0, 4));
    if (selected.length === 0) return [`Details: ${stringifyShort(details)}`];

    return selected.slice(0, 6).map((k) => {
      const v = details[k];
      const label = k.toString().replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());
      if (typeof v === 'object') return `${label}: ${stringifyShort(v)}`;
      return `${label}: ${v ?? '—'}`;
    });
  }

  return [`Details: ${stringifyShort(details)}`];
}

function estimateCardHeight(doc, headerText, detailsLines, opts) {
  const { contentWidth, headerFontSize, detailsFontSize, lineGap } = opts;
  let h = 0;
  doc.font('Helvetica-Bold').fontSize(headerFontSize);
  h += doc.heightOfString(headerText, { width: contentWidth });
  h += 6; // gap after header
  doc.font('Helvetica').fontSize(detailsFontSize);
  detailsLines.forEach((line) => {
    h += doc.heightOfString(line, { width: contentWidth });
    h += lineGap;
  });
  return h;
}

function getAuditTableLayout(doc) {
  const marginLeft = doc.page.margins.left || 50;
  const marginRight = doc.page.margins.right || 50;
  const cardW = doc.page.width - marginLeft - marginRight;
  const innerX = marginLeft + 12;
  const innerW = cardW - 24;

  // Choose stable columns for readability.
  const timeColW = Math.max(110, Math.min(170, innerW * 0.32));
  const eventColW = Math.max(140, Math.min(260, innerW * 0.34));
  const detailsColW = Math.max(140, innerW - timeColW - eventColW);

  return { marginLeft, cardW, innerX, innerW, timeColW, eventColW, detailsColW };
}

function renderAuditPageHeader(doc, { continued = false } = {}) {
  const { marginLeft, cardW, timeColW, eventColW } = getAuditTableLayout(doc);

  const bannerH = continued ? 20 : 26;
  const title = continued ? 'Audit Trail (Continued)' : 'Audit Trail';

  const y = doc.y;
  doc.save();
  doc.rect(marginLeft, y, cardW, bannerH).fill('#0f172a');
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(continued ? 12 : 14);
  doc.text(title, marginLeft + 14, y + 6, { width: cardW - 28 });
  doc.restore();

  doc.moveDown(0.45);
  // Table header
  const headerH = 20;
  const rowY = doc.y;

  const innerX = marginLeft + 12;
  doc.save();
  doc.fillColor('#e5e7eb').strokeColor('#d1d5db');
  doc.rect(marginLeft, rowY, cardW, headerH).fillAndStroke();
  doc.fillColor('#111827');
  doc.font('Helvetica-Bold').fontSize(9);
  doc.text('Time', innerX, rowY + 6, { width: timeColW - 6 });
  doc.text('Event', innerX + timeColW, rowY + 6, { width: eventColW - 6 });
  doc.text('Details', innerX + timeColW + eventColW, rowY + 6, { width: cardW - (12 + timeColW + eventColW) - 2 });
  doc.restore();

  doc.y = rowY + headerH + 6;
}

function renderAuditCard(doc, log, idx, opts = {}) {
  const { marginLeft, cardW, innerX, timeColW, eventColW, detailsColW } = getAuditTableLayout(doc);

  const tone = getAuditTone(log?.action);
  const timeText = formatTimestampLocal(log?.timestamp) || '—';
  const eventTitle = getAuditTitle(log?.action);
  const detailsLines = collectDetailsLinesForUser(log);

  const paddingTop = 10;
  const paddingBottom = 10;
  const lineGap = 2;
  const detailsFontSize = 9;
  const timeFontSize = 8;
  const eventFontSize = 9;

  const detailsCellTextH = (() => {
    doc.font('Helvetica').fontSize(detailsFontSize);
    let h = 0;
    detailsLines.forEach((line) => {
      h += doc.heightOfString(line, { width: detailsColW - 6 });
      h += lineGap;
    });
    return h;
  })();

  const timeCellH = (() => {
    doc.font('Helvetica').fontSize(timeFontSize);
    return doc.heightOfString(timeText, { width: timeColW - 6 });
  })();

  const eventCellH = (() => {
    doc.font('Helvetica-Bold').fontSize(eventFontSize);
    return doc.heightOfString(eventTitle, { width: eventColW - 6 });
  })();

  const rowH = paddingTop + Math.max(detailsCellTextH, timeCellH, eventCellH) + paddingBottom;
  const bottomLimit = doc.page.height - (doc.page.margins.bottom || 50) - 20;

  if (doc.y + rowH > bottomLimit) {
    doc.addPage();
    renderAuditPageHeader(doc, { continued: true });
  }

  const rowY = doc.y;

  // Row background + border
  doc.save();
  doc.fillColor('#ffffff').strokeColor('#e5e7eb');
  doc.rect(marginLeft, rowY, cardW, rowH).fillAndStroke();

  // Colored top strip
  doc.fillColor(tone.strip);
  doc.rect(marginLeft, rowY, cardW, 5).fill();

  // Vertical separators
  doc.strokeColor('#e5e7eb');
  const x1 = innerX + timeColW;
  const x2 = innerX + timeColW + eventColW;
  doc.moveTo(x1, rowY).lineTo(x1, rowY + rowH).stroke();
  doc.moveTo(x2, rowY).lineTo(x2, rowY + rowH).stroke();
  doc.restore();

  // Time cell
  doc.fillColor('#374151');
  doc.font('Helvetica').fontSize(timeFontSize);
  doc.text(timeText, innerX, rowY + paddingTop, { width: timeColW - 6 });

  // Event cell
  doc.fillColor(tone.label);
  doc.font('Helvetica-Bold').fontSize(eventFontSize);
  doc.text(eventTitle, innerX + timeColW, rowY + paddingTop, { width: eventColW - 6 });

  // Details cell
  doc.fillColor('#111827');
  doc.font('Helvetica').fontSize(detailsFontSize);
  let yCursor = rowY + paddingTop + 1;
  detailsLines.forEach((line) => {
    doc.text(line, innerX + timeColW + eventColW, yCursor, { width: detailsColW - 6 });
    yCursor = doc.y + lineGap;
  });

  // Move y for next row
  doc.y = rowY + rowH + 6;
}

function shortenForUi(value, maxLen = 60) {
  const s = value == null ? '' : String(value);
  if (!s) return '—';
  if (s.length <= maxLen) return s;
  const headLen = Math.max(10, Math.floor(maxLen * 0.6));
  const tailLen = Math.max(0, maxLen - headLen - 3);
  return `${s.slice(0, headLen)}...${tailLen ? s.slice(-tailLen) : ''}`;
}

function formatTimestampLocalShort(d, timeZone = CERTIFICATE_TIME_ZONE) {
  const date = toDate(d);
  if (!date) return '';
  const parts = date.toLocaleString('en-IN', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return parts;
}

function extractBase64ImageToBuffer(maybeDataUrlOrB64) {
  if (!maybeDataUrlOrB64) return null;
  try {
    const imgData = maybeDataUrlOrB64.split(',')[1] || maybeDataUrlOrB64;
    return Buffer.from(imgData, 'base64');
  } catch {
    return null;
  }
}

function renderSummarySectionHeader(doc, title, subtitle, { compact = false } = {}) {
  const marginLeft = doc.page.margins.left || 50;
  const marginRight = doc.page.margins.right || 50;
  const w = doc.page.width - marginLeft - marginRight;

  const y = doc.y;
  doc.save();
  doc.rect(marginLeft, y, w, 28).fill('#0f172a');
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(compact ? 12 : 14).text(
    title,
    marginLeft + 14,
    y + 8,
    { width: w - 28, align: 'left' }
  );
  doc.restore();

  doc.moveDown(0.25);
  if (!compact && subtitle) {
    doc.fontSize(10).fillColor('#111827').text(subtitle);
    doc.moveDown(0.4);
  } else {
    doc.moveDown(0.2);
  }
}

function measureKVRowsHeight(doc, rows, valueFontSize, valueW, lineGap) {
  let h = 0;
  doc.font('Helvetica').fontSize(valueFontSize);
  rows.forEach((row) => {
    const valueText = row?.value != null && row?.value !== '' ? String(row.value) : '—';
    h += doc.heightOfString(valueText, { width: valueW }) + lineGap;
  });
  return h;
}

function drawKVRows(doc, x, y, labelW, valueW, rows, { labelFontSize = 9, valueFontSize = 9, gap = 12, lineGap = 1.2 } = {}) {
  const labelColor = '#6b7280';
  const valueColor = '#111827';
  let yCursor = y;

  rows.forEach((row) => {
    const label = row?.label || '';
    const valueText = row?.value != null && row?.value !== '' ? String(row.value) : '—';

    // Measure value height first so layout is stable.
    doc.font('Helvetica').fontSize(valueFontSize);
    const valueH = doc.heightOfString(valueText, { width: valueW });

    // Label (single-line is expected)
    doc.fillColor(labelColor).font('Helvetica').fontSize(labelFontSize);
    doc.text(label, x, yCursor, { width: labelW, align: 'left' });

    // Value (wrapped)
    doc.fillColor(valueColor).font('Helvetica').fontSize(valueFontSize);
    doc.text(valueText, x + labelW + gap, yCursor, { width: valueW, align: 'left' });

    yCursor += valueH + lineGap;
  });

  return yCursor;
}

function renderSignerSummaryCard(doc, data, { headerTitle, headerSubtitle } = {}) {
  const marginLeft = doc.page.margins.left || 50;
  const marginRight = doc.page.margins.right || 50;
  const cardW = doc.page.width - marginLeft - marginRight;
  const contentX = marginLeft + 12;
  const contentW = cardW - 24;

  const labelW = 155;
  const gap = 12;
  const valueW = Math.max(140, contentW - labelW - gap);

  const paddingTop = 12;
  const paddingBottom = 12;
  const cardGap = 12;
  const lineGap = 1.2;
  const stripH = 6;
  const radius = 12;

  const name = data?.name || 'Unknown';
  const email = data?.email || '';
  const subtitle = data?.subtitle || '';
  const stripColor = data?.stripColor || '#3b82f6';

  const certRows = data?.certRows || [];
  const sigRows = data?.sigRows || [];
  const signatureImageBuffer = data?.signatureImageBuffer || null;
  const filledRows = data?.filledRows || [];
  const stampImageBuffers = Array.isArray(data?.stampImageBuffers) ? data.stampImageBuffers : [];

  const headingFontSize = 12;
  const emailFontSize = 10;
  const subtitleFontSize = 10;

  const nameH = doc.font('Helvetica-Bold').fontSize(headingFontSize).heightOfString(name, { width: contentW });
  const emailH = email ? doc.font('Helvetica').fontSize(emailFontSize).heightOfString(email, { width: contentW }) : 0;
  const subtitleH = subtitle ? doc.font('Helvetica').fontSize(subtitleFontSize).heightOfString(subtitle, { width: contentW }) : 0;

  const fontLabelSize = 9;
  const fontValueSize = 9;

  const certH = certRows.length ? measureKVRowsHeight(doc, certRows, fontValueSize, valueW, lineGap) : 0;
  const sigH = sigRows.length ? measureKVRowsHeight(doc, sigRows, fontValueSize, valueW, lineGap) : 0;

  const imageAreaH = signatureImageBuffer ? 62 : 0;
  const filledH = filledRows.length ? measureKVRowsHeight(doc, filledRows, fontValueSize, valueW, lineGap) : 0;
  const stampAreaH = stampImageBuffers.length ? (stampImageBuffers.length * 58 + 8) : 0;

  const separatorGap = 8;
  const cardH = paddingTop + nameH + (emailH ? emailH + 2 : 0) + (subtitleH ? subtitleH + 2 : 0) +
    separatorGap +
    certH +
    (sigH ? 8 + sigH : 0) +
    (filledH ? 10 + filledH : 0) +
    (stampAreaH ? 8 + stampAreaH : 0) +
    (imageAreaH ? 8 + imageAreaH : 0) +
    paddingBottom;

  const bottomLimit = doc.page.height - (doc.page.margins.bottom || 50) - 20;
  if (doc.y + cardH > bottomLimit) {
    doc.addPage();
    if (headerTitle) {
      renderSummarySectionHeader(doc, headerTitle, headerSubtitle, { compact: true });
    }
  }

  const cardY = doc.y;
  const x = marginLeft;

  // Card background
  doc.save();
  doc.fillColor('#ffffff').strokeColor('#e5e7eb');
  drawRoundedRect(doc, x, cardY, cardW, cardH, radius);
  doc.fillAndStroke();

  // Strip
  doc.fillColor(stripColor).rect(x, cardY, cardW, stripH).fill();
  doc.restore();

  // Text content
  doc.fillColor('#0f172a');
  doc.font('Helvetica-Bold').fontSize(headingFontSize).text(name, contentX, cardY + paddingTop, { width: contentW });
  let yCursor = cardY + paddingTop + nameH + 2;

  if (email) {
    doc.fillColor('#111827').font('Helvetica').fontSize(emailFontSize).text(`Email: ${email}`, contentX, yCursor, { width: contentW });
    yCursor = doc.y + 4;
  }

  if (subtitle) {
    doc.fillColor('#111827').font('Helvetica').fontSize(subtitleFontSize).text(subtitle, contentX, yCursor, { width: contentW });
    yCursor = doc.y + 6;
  } else {
    yCursor += 4;
  }

  // Cert header label
  doc.fillColor('#374151').font('Helvetica-Bold').fontSize(9).text('Certificate details', contentX, yCursor);
  yCursor += 10;

  yCursor = drawKVRows(doc, contentX, yCursor, labelW, valueW, certRows, { labelFontSize: fontLabelSize, valueFontSize: fontValueSize, gap, lineGap });
  yCursor += 6;

  // Sig header label
  doc.fillColor('#374151').font('Helvetica-Bold').fontSize(9).text('Digital signature', contentX, yCursor);
  yCursor += 10;

  yCursor = drawKVRows(doc, contentX, yCursor, labelW, valueW, sigRows, { labelFontSize: fontLabelSize, valueFontSize: fontValueSize, gap, lineGap });

  if (filledRows.length) {
    yCursor += 8;
    doc.fillColor('#374151').font('Helvetica-Bold').fontSize(9).text('Filled fields', contentX, yCursor);
    yCursor += 10;
    yCursor = drawKVRows(doc, contentX, yCursor, labelW, valueW, filledRows, { labelFontSize: fontLabelSize, valueFontSize: fontValueSize, gap, lineGap });
  }

  if (stampImageBuffers.length) {
    yCursor += 8;
    doc.fillColor('#374151').font('Helvetica-Bold').fontSize(9).text('Stamp', contentX, yCursor);
    yCursor += 10;
    const startY = yCursor;
    stampImageBuffers.slice(0, 3).forEach((buf, idx) => {
      try {
        doc.image(buf, contentX, startY + idx * 58, { fit: [160, 52] });
      } catch {
        // ignore bad stamp image
      }
    });
  }

  if (signatureImageBuffer) {
    // Place image at bottom, centered.
    doc.image(signatureImageBuffer, contentX, cardY + cardH - paddingBottom - imageAreaH, { fit: [160, 55], align: 'center' });
  }

  doc.y = cardY + cardH + cardGap;
}

function drawRoundedRect(doc, x, y, w, h, r) {
  // pdfkit supports roundedRect, but keep a safe fallback.
  if (doc && typeof doc.roundedRect === 'function') {
    doc.roundedRect(x, y, w, h, r);
    return;
  }
  doc.rect(x, y, w, h);
}

function measureTextHeight(doc, text, { width, font = 'Helvetica', fontSize = 10 }) {
  const safeText = text == null || text === '' ? '—' : String(text);
  doc.font(font).fontSize(fontSize);
  return doc.heightOfString(safeText, { width });
}

function renderLabeledBox(doc, { x, y, w, label, value, valueFontSize = 10 }) {
  const boxPadding = 10;
  const labelFontSize = 9;
  const valueW = w - boxPadding * 2;

  const valueH = measureTextHeight(doc, value, { width: valueW, font: 'Helvetica', fontSize: valueFontSize });
  const labelH = measureTextHeight(doc, label, { width: valueW, font: 'Helvetica-Bold', fontSize: labelFontSize }) || 10;
  // label pill + value region
  const boxH = boxPadding * 2 + labelH + 10 + valueH;

  doc.save();
  doc.fillColor('#ffffff').strokeColor('#e5e7eb');
  drawRoundedRect(doc, x, y, w, boxH, 10);
  doc.fillAndStroke();

  // Label pill
  const pillH = 16;
  doc.fillColor('#e0f2fe');
  doc.strokeColor('#bae6fd');
  drawRoundedRect(doc, x + boxPadding, y + boxPadding, valueW, pillH, 8);
  doc.fillAndStroke();

  doc.fillColor('#0369a1').font('Helvetica-Bold').fontSize(labelFontSize);
  doc.text(label, x + boxPadding + 4, y + boxPadding + 3, { width: valueW, height: pillH });

  doc.fillColor('#111827').font('Helvetica').fontSize(valueFontSize);
  doc.text(value == null || value === '' ? '—' : String(value), x + boxPadding, y + boxPadding + pillH + 6, {
    width: valueW,
    lineGap: 1.15,
  });
  doc.restore();

  return boxH;
}

function renderCertificateHeader(doc, { title, subtitleLines = [], subject, message, signatureType, metaLine = '' }) {
  const marginLeft = doc.page.margins.left || 50;
  const marginRight = doc.page.margins.right || 50;
  const w = doc.page.width - marginLeft - marginRight;
  const x = marginLeft;

  const headerY = doc.y;
  const headerH = 86;
  const radius = 14;

  // Banner
  doc.save();
  // Shadow (simple layered rectangle)
  doc.fillColor('#0b1220');
  drawRoundedRect(doc, x + 1.5, headerY + 1.5, w, headerH, radius);
  doc.fill();
  doc.fillColor('#0f172a');

  doc.fill('#0f172a');
  drawRoundedRect(doc, x, headerY, w, headerH, radius);
  doc.fill();

  // Top accent band
  doc.fill('#3b82f6');
  drawRoundedRect(doc, x, headerY, w, 8, radius);
  doc.fill();

  // Diagonal accent (top-right)
  doc.fillColor('#38bdf8');
  // Use path drawing instead of polygon() for compatibility across pdfkit versions.
  doc.moveTo(x + w - 140, headerY);
  doc.lineTo(x + w, headerY);
  doc.lineTo(x + w, headerY + 70);
  doc.lineTo(x + w - 140, headerY + 30);
  doc.closePath();
  doc.fill();

  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(22);
  doc.text(title, x, headerY + 18, { width: w, align: 'center' });

  if (subtitleLines && subtitleLines.length) {
    doc.fillColor('#cbd5e1').font('Helvetica').fontSize(10);
    subtitleLines.forEach((line, i) => {
      doc.text(line, x, headerY + 44 + i * 12, { width: w, align: 'center' });
    });
  } else if (metaLine) {
    doc.fillColor('#cbd5e1').font('Helvetica').fontSize(10);
    doc.text(metaLine, x, headerY + 44, { width: w, align: 'center' });
  }

  // Secure badge
  doc.fillColor('#10b981');
  // Place at bottom-left to avoid covering the title
  drawRoundedRect(doc, x + 18, headerY + headerH - 28, 118, 18, 999);
  doc.fill();
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(8.5);
  doc.text('Secure certificate', x + 28, headerY + headerH - 24, { width: 108, align: 'left' });

  doc.restore();

  // Boxes area
  const gap = 12;
  const boxY = headerY + headerH + 10;
  const halfW = Math.floor((w - gap) / 2);

  // Row 1: Subject + Signature Type
  const subjectBoxH = renderLabeledBox(doc, {
    x,
    y: boxY,
    w: halfW,
    label: 'Envelope Subject',
    value: subject,
  });
  renderLabeledBox(doc, {
    x: x + halfW + gap,
    y: boxY,
    w: w - halfW - gap,
    label: 'Signature Type',
    value: signatureType,
  });

  // Row 2: Message (full width)
  const messageTopY = boxY + Math.max(subjectBoxH, 60) + gap;
  const messageBoxH = renderLabeledBox(doc, {
    x,
    y: messageTopY,
    w,
    label: 'Message',
    value: message,
    valueFontSize: 10,
  });

  doc.y = messageTopY + messageBoxH + 14;
}

/**
 * Generate certificate PDF for an envelope and save it to uploads/certificates/
 * @param {String|ObjectId} envelopeId
 * @returns {Promise<{buffer: Buffer, filename: string, filepath: string}>}
 */
async function generateAndStoreCompletionCertificate(envelopeId) {
  const Envelope = require('../models/Envelope');
  const { Certificate } = require('../models/Certificate');
  const DigitalSignature = require('../models/DigitalSignature');
  const SignatureField = require('../models/SignatureFields');
  const Recipient = require('../models/Recipient');
  const RecipientPermission = require('../models/RecipientPermission');
  const signatureTransactions = require('../models/signatureTransactions');

  const envelope = await Envelope.findById(envelopeId).lean();
  if (!envelope) throw new Error('Envelope not found');

  const permissions = await RecipientPermission.find({ envelopeId, role: { $ne: 'carbon_copy' } })
    .sort({ order: 1 })
    .lean();

  const recipientIds = permissions.map((p) => String(p.recipientId)).filter(Boolean);
  const recipients = recipientIds.length
    ? await Recipient.find({ _id: { $in: recipientIds } }).lean()
    : [];
  const recipientById = {};
  recipients.forEach((r) => { recipientById[String(r._id)] = r; });

  const vsignTxByRecipient = {};
  const vsignTxs = await signatureTransactions.find({ envelopeId }).lean();
  vsignTxs.forEach((tx) => {
    vsignTxByRecipient[String(tx.recipientId)] = tx;
  });

  const [certs, signatures, fields] = await Promise.all([
    Certificate.find({ envelopeId }).lean(),
    DigitalSignature.find({ envelopeId }).lean(),
    SignatureField.find({ envelopeId }).lean(),
  ]);

  const certByPermissionId = {};
  certs.forEach((c) => { if (c.recipientId) certByPermissionId[String(c.recipientId)] = c; });
  const sigByPermissionId = {};
  signatures.forEach((s) => { if (s.recipientId) sigByPermissionId[String(s.recipientId)] = s; });

  const signatureFieldCountByRecipient = {};
  const signatureImageByRecipientId = {};
  const handwrittenByRecipientId = {};
  fields.forEach((f) => {
    const rid = f?.recipientId ? String(f.recipientId) : null;
    if (!rid) return;
    signatureFieldCountByRecipient[rid] = (signatureFieldCountByRecipient[rid] || 0) + (f.type === 'signature' ? 1 : 0);
    if (f?.type === 'signature' && f?.signature) {
      signatureImageByRecipientId[rid] = f.signature;
    }
  });

  const signers = await Promise.all(permissions.map(async (permission) => {
    const rid = String(permission.recipientId);
    const recipient = recipientById[rid] || {};
    const vsignTx = vsignTxByRecipient[rid];
    const permissionId = String(permission._id);
    const evidence = permission.signingEvidence || {};
    const verifiedAuthMethods = buildVerifiedAuthMethodsFromEvidence(evidence, permission.authLevel || []);

    let mergedEvidence = sanitizeSigningEvidence(mergeSigningEvidence(evidence, {
      authMethods: verifiedAuthMethods,
      handwrittenSignature: evidence.handwrittenSignature || signatureImageByRecipientId[rid] || '',
      dualSignature: Boolean(
        evidence.dualSignature ||
        (signatureImageByRecipientId[rid] && verifiedAuthMethods.some((a) => /aadhaar|aadhar/i.test(String(a.type || a.name))))
      ),
    }));
    mergedEvidence = sanitizeSigningEvidence(await enrichEvidenceWithIpGeo(mergedEvidence));

    const timeline = buildDefaultTimeline({
      permission,
      recipient,
      signatureFieldCount: signatureFieldCountByRecipient[rid] || 0,
      signingEvidence: mergedEvidence,
      vsignVerified: Boolean(vsignTx),
      aadhaarVerifiedAt:
        mergedEvidence.aadhaarVerifiedAt ||
        mergedEvidence.vsignVerifiedAt ||
        (vsignTx?.txn && /^\d+$/.test(String(vsignTx.txn)) ? new Date(Number(vsignTx.txn)) : null),
    });

    const cert = certByPermissionId[permissionId];
    const sig = sigByPermissionId[permissionId];
    if (cert?.issuedAt && !timeline.find((t) => t.event === 'Digital Certificate Issued')) {
      timeline.push({ event: 'Digital Certificate Issued', at: cert.issuedAt });
    }
    if (sig?.signedAt && !timeline.find((t) => t.event === 'Document Cryptographically Signed')) {
      timeline.push({ event: 'Document Cryptographically Signed', at: sig.signedAt });
    }
    timeline.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());

    return {
      name: recipient.name || recipient.email || 'Signer',
      email: recipient.email || '',
      phone: recipient.phone || '',
      aadhaarMasked: maskAadhaar(recipient.aadhaarNumber),
      evidence: mergedEvidence,
      timeline,
      cert,
      sig,
    };
  }));

  const doc = new PDFDocument({ size: 'A4', margin: 36, bufferPages: true });
  const buffers = [];
  doc.on('data', (chunk) => buffers.push(chunk));

  await renderOtpSignAuditCertificate(doc, { envelope, signers });

  doc.end();

  // wait for doc to finish
  await new Promise((resolve, reject) => { doc.on('end', resolve); doc.on('error', reject); });

  const finalBuffer = Buffer.concat(buffers);

  // prepare filename and path
  const safeFilename = `completion-certificate-${String(envelope._id)}.pdf`;
  const uploadsDir = path.join(process.cwd(), 'uploads', 'certificates');
  const filepath = path.join(uploadsDir, safeFilename);

  // ensure directory exists and write file
  await fs.mkdir(uploadsDir, { recursive: true });
  await fs.writeFile(filepath, finalBuffer);

  // return buffer + location so caller can also store DB ref / email it
  return { buffer: finalBuffer, filename: safeFilename, filepath };
}
/**
 * Generate certificate PDF for a Power Form cycle and save it to uploads/certificates/
 * Similar to generateAndStoreCompletionCertificate but scoped to one cycle and its SelfSigners.
 * @param {String|ObjectId} envelopeId
 * @param {String|ObjectId} cycleId
 * @returns {Promise<{buffer: Buffer, filename: string, filepath: string}>}
 */
async function generateAndStoreCompletionCertificateOfPowerForm(envelopeId, cycleId) {
  const Envelope = require('../models/Envelope');
  const Cycle = require('../models/Cycle');
  const { Certificate } = require('../models/Certificate');
  const DigitalSignature = require('../models/DigitalSignature');
  const SignatureField = require('../models/SignatureFields');
  const { AuditTrail } = require('../models/AuditTrail');

  const envelope = await Envelope.findById(envelopeId).lean();
  if (!envelope) throw new Error('Envelope not found');

  const cycle = await Cycle.findById(cycleId)
    .populate({
      path: 'signers',
      model: 'SelfSigner',
      options: { sort: { signingOrder: 1 } }
    })
    .lean();
  if (!cycle) throw new Error('Cycle not found');

  const signerIds = (cycle.signers || []).map(s => s._id);
  if (signerIds.length === 0) throw new Error('Cycle has no signers');

  const [certs, signatures, auditLogs, fields] = await Promise.all([
    Certificate.find({ envelopeId, recipientId: { $in: signerIds } }).lean(),
    DigitalSignature.find({ envelopeId, recipientId: { $in: signerIds } }).lean(),
    AuditTrail.find({ envelopeId, recipientId: { $in: signerIds } }).sort({ timestamp: 1 }).lean(),
    SignatureField.find({ envelopeId, recipientId: { $in: signerIds } }).lean(),
  ]);

  const certMap = {};
  certs.forEach(c => { if (c.recipientId) certMap[String(c.recipientId)] = c; });
  const sigMap = {};
  signatures.forEach(s => { if (s.recipientId) sigMap[String(s.recipientId)] = s; });

  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  const buffers = [];
  doc.on('data', chunk => buffers.push(chunk));

  const generatedAtForHeader = formatTimestampLocal(new Date());

  renderCertificateHeader(doc, {
    title: 'Certificate of Completion (Power Form)',
    subtitleLines: [`Cycle ID: ${String(cycleId)}`, `Cycle status: ${cycle.status || '—'}`],
    subject: envelope.subject,
    message: envelope.message,
    signatureType: envelope.signatureType,
    metaLine: `Generated at: ${generatedAtForHeader}`,
  });

  renderSummarySectionHeader(
    doc,
    'Signers & Certificate Summary',
    'A simple summary of each signer, their certificate, and the digital signature.'
  );

  const signatureImageByRecipientId = {};
  const stampImagesByRecipientId = {};
  const filledByRecipientId = {};
  (fields || []).forEach((f) => {
    const rid = f?.recipientId ? String(f.recipientId) : null;
    if (!rid) return;
    if (f?.type === 'signature' && f?.signature) signatureImageByRecipientId[rid] = f.signature;
    if (f?.type === 'stamp' && f?.signature && String(f.signature).startsWith('data:image')) {
      if (!stampImagesByRecipientId[rid]) stampImagesByRecipientId[rid] = [];
      stampImagesByRecipientId[rid].push(f.signature);
    }
    if (f?.type && f.type !== 'signature' && f.type !== 'stamp') {
      const val = f.value ?? f.signature ?? '';
      if (val != null && String(val).trim() !== '') {
        if (!filledByRecipientId[rid]) filledByRecipientId[rid] = [];
        filledByRecipientId[rid].push({ label: (f.label || f.type || 'Field').toString(), value: String(val) });
      }
    }
  });

  for (const signer of cycle.signers || []) {
    const rid = String(signer._id);
    const name = (signer.data && (signer.data.name || signer.data.fullName)) || (signer.data && signer.data.email) || 'Unknown';
    const email = (signer.data && signer.data.email) || '';

    const c = certMap[rid];
    const s = sigMap[rid];

    const hasCert = Boolean(c);
    const hasSig = Boolean(s);
    const stripColor = hasCert && hasSig ? '#10b981' : (hasCert ? '#f59e0b' : '#ef4444');

    const signatureImageBuffer = extractBase64ImageToBuffer(signer?.signature);
    const signatureImageFromField = extractBase64ImageToBuffer(signatureImageByRecipientId[rid]);
    const stampImageBuffers = (stampImagesByRecipientId[rid] || [])
      .map((s) => extractBase64ImageToBuffer(s))
      .filter(Boolean);
    const filledRows = (filledByRecipientId[rid] || []).slice(0, 12);

    const certRows = hasCert
      ? [
        { label: 'Certificate Serial', value: c.certSerial || '—' },
        { label: 'Issuer', value: c.issuer || '—' },
        { label: 'Issued At', value: formatTimestampLocalShort(c.issuedAt) || '—' },
        { label: 'Valid Till', value: formatTimestampLocalShort(c.validTill) || '—' },
      ]
      : [{ label: 'Certificate', value: 'Not found' }];

    const sigRows = hasSig
      ? [
        { label: 'Signed At', value: formatTimestampLocalShort(s.signedAt) || '—' },
        { label: 'Hash Algorithm', value: s.hashAlgorithm || '—' },
        { label: 'PDF Hash', value: shortenForUi(s.pdfHash, 70) },
      ]
      : [{ label: 'Digital signature', value: 'Not found' }];

    const subtitle = `Signing order: ${signer.signingOrder != null ? signer.signingOrder : '-'} | Status: ${signer.status || '—'} | Signature type: ${envelope.signatureType || '—'}`;

    renderSignerSummaryCard(doc, {
      name,
      email,
      subtitle,
      stripColor,
      certRows,
      sigRows,
      filledRows,
      stampImageBuffers,
      signatureImageBuffer: signatureImageFromField || signatureImageBuffer,
    }, { headerTitle: 'Signers & Certificate Summary', headerSubtitle: 'A simple summary of each signer, their certificate, and the digital signature.' });
  }

  doc.addPage();
  renderAuditPageHeader(doc, { continued: false });
  (auditLogs || []).forEach((log, idx) => {
    renderAuditCard(doc, log, idx);
  });

  doc.addPage();
  doc.fontSize(10).text('This certificate confirms that the signatures and events recorded above are captured for this Power Form cycle and its signers.');
  doc.moveDown(1);
  doc.text(`Generated At: ${generatedAtForHeader}`);
  doc.text(`DocuMantra Envelope ID: ${require('../utils/envelopeIdFormat').formatDocuMantraEnvelopeId(envelopeId)} | Cycle: ${String(cycleId)}`);

  doc.end();

  await new Promise((resolve, reject) => { doc.on('end', resolve); doc.on('error', reject); });

  const finalBuffer = Buffer.concat(buffers);
  const safeFilename = `completion-certificate-powerform-${String(envelopeId)}-${String(cycleId)}.pdf`;
  const uploadsDir = path.join(process.cwd(), 'uploads', 'certificates');
  const filepath = path.join(uploadsDir, safeFilename);

  await fs.mkdir(uploadsDir, { recursive: true });
  await fs.writeFile(filepath, finalBuffer);

  return { buffer: finalBuffer, filename: safeFilename, filepath };
}

module.exports = { generateAndStoreCompletionCertificate, generateAndStoreCompletionCertificateOfPowerForm };
