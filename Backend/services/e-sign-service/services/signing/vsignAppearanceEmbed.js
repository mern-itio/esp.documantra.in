const fs = require('fs');
const { PDFDocument, rgb, StandardFonts, PDFName } = require('pdf-lib');
const { PNG } = require('pngjs');
const {
  estimateVSignAppearanceLines,
  formatVSignIstDate,
  HANDWRITTEN_HEIGHT_RATIO,
  HANDWRITTEN_MIN_HEIGHT,
  computeHandwrittenStripHeight,
} = require('../../utils/vsignAssets');

const VSIGN_BOX_BG = rgb(232 / 255, 242 / 255, 255 / 255);
const VSIGN_COVER_BG = rgb(1, 1, 1);
const VSIGN_CHECK_GREEN = rgb(22 / 255, 163 / 255, 74 / 255);
const MIN_AADHAAR_HEIGHT = 85;
const BASE_PAGE_WIDTH = 800;

/**
 * Flatten ink onto dual-box blue and drop the alpha channel entirely.
 * PDF viewers paint PNG transparency as opaque white — that caused the
 * top-right blank in the dual stamp.
 */
function flattenHandwrittenPng(pngBuffer, bg = { r: 232, g: 242, b: 255 }) {
  const src = PNG.sync.read(pngBuffer);
  const { width, height, data } = src;

  // 1) near-white / empty → treat as transparent
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    if (r >= 230 && g >= 230 && b >= 230) data[i + 3] = 0;
  }

  // 2) tight crop to ink
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (data[(y * width + x) * 4 + 3] > 8) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < minX || maxY < minY) {
    // No ink — return 1x1 blue pixel.
    const empty = new PNG({ width: 1, height: 1 });
    empty.data[0] = bg.r;
    empty.data[1] = bg.g;
    empty.data[2] = bg.b;
    empty.data[3] = 255;
    return { bytes: PNG.sync.write(empty, { colorType: 6 }), width: 1, height: 1 };
  }
  const pad = 2;
  minX = Math.max(0, minX - pad);
  minY = Math.max(0, minY - pad);
  maxX = Math.min(width - 1, maxX + pad);
  maxY = Math.min(height - 1, maxY + pad);
  const tw = maxX - minX + 1;
  const th = maxY - minY + 1;

  // 3) crop + composite onto opaque blue (no alpha left for PDF viewers)
  const out = new PNG({ width: tw, height: th });
  for (let y = 0; y < th; y += 1) {
    for (let x = 0; x < tw; x += 1) {
      const si = ((minY + y) * width + (minX + x)) * 4;
      const di = (y * tw + x) * 4;
      const a = data[si + 3] / 255;
      out.data[di] = Math.round(data[si] * a + bg.r * (1 - a));
      out.data[di + 1] = Math.round(data[si + 1] * a + bg.g * (1 - a));
      out.data[di + 2] = Math.round(data[si + 2] * a + bg.b * (1 - a));
      out.data[di + 3] = 255;
    }
  }
  return {
    bytes: PNG.sync.write(out, { colorType: 6 }),
    width: tw,
    height: th,
  };
}

/** Turn near-white SignPad canvas pixels transparent so dual box has no white blank. */
function transparentizeWhitePng(pngBuffer, threshold = 230) {
  try {
    const png = PNG.sync.read(pngBuffer);
    const { data } = png;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      if (r >= threshold && g >= threshold && b >= threshold) {
        data[i + 3] = 0;
      }
    }
    return PNG.sync.write(png);
  } catch (err) {
    console.warn('[VSign appearance] transparentize skipped:', err.message);
    return pngBuffer;
  }
}

/**
 * Flatten ink onto the dual-box blue. Many PDF viewers paint PNG alpha as white,
 * which left a white rectangle in the top-right of the appearance.
 */
function compositePngOnBlue(pngBuffer, bg = { r: 232, g: 242, b: 255 }) {
  try {
    const png = PNG.sync.read(pngBuffer);
    const { data } = png;
    for (let i = 0; i < data.length; i += 4) {
      const a = data[i + 3] / 255;
      if (a <= 0) {
        data[i] = bg.r;
        data[i + 1] = bg.g;
        data[i + 2] = bg.b;
        data[i + 3] = 255;
        continue;
      }
      if (a < 1) {
        data[i] = Math.round(data[i] * a + bg.r * (1 - a));
        data[i + 1] = Math.round(data[i + 1] * a + bg.g * (1 - a));
        data[i + 2] = Math.round(data[i + 2] * a + bg.b * (1 - a));
        data[i + 3] = 255;
      }
    }
    return PNG.sync.write(png);
  } catch (err) {
    console.warn('[VSign appearance] blue composite skipped:', err.message);
    return pngBuffer;
  }
}

/**
 * Crop transparent margins so the ink fills the top strip (no tiny scribble + empty side).
 */
function trimTransparentPng(pngBuffer, alphaCut = 8) {
  try {
    const png = PNG.sync.read(pngBuffer);
    const { data, width, height } = png;
    let minX = width;
    let minY = height;
    let maxX = -1;
    let maxY = -1;
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const a = data[(y * width + x) * 4 + 3];
        if (a > alphaCut) {
          if (x < minX) minX = x;
          if (y < minY) minY = y;
          if (x > maxX) maxX = x;
          if (y > maxY) maxY = y;
        }
      }
    }
    if (maxX < minX || maxY < minY) return pngBuffer;
    const pad = 2;
    minX = Math.max(0, minX - pad);
    minY = Math.max(0, minY - pad);
    maxX = Math.min(width - 1, maxX + pad);
    maxY = Math.min(height - 1, maxY + pad);
    const tw = maxX - minX + 1;
    const th = maxY - minY + 1;
    if (tw >= width * 0.92 && th >= height * 0.92) return pngBuffer;
    const out = new PNG({ width: tw, height: th });
    for (let y = 0; y < th; y += 1) {
      for (let x = 0; x < tw; x += 1) {
        const si = ((minY + y) * width + (minX + x)) * 4;
        const di = (y * tw + x) * 4;
        out.data[di] = data[si];
        out.data[di + 1] = data[si + 1];
        out.data[di + 2] = data[si + 2];
        out.data[di + 3] = data[si + 3];
      }
    }
    return PNG.sync.write(out);
  } catch (err) {
    console.warn('[VSign appearance] trim skipped:', err.message);
    return pngBuffer;
  }
}

/**
 * VSign / older paints leave a wide transparent handwritten XObject (e.g. 690x212
 * with SMask). PDF viewers render that alpha as an opaque white block. Remove them
 * after we have redrawn an opaque dual stamp.
 */
function stripLegacyTransparentHandImages(pdfDoc) {
  for (const page of pdfDoc.getPages()) {
    try {
      const res = page.node.Resources();
      if (!res) continue;
      const xobjRef = res.get(PDFName.of('XObject'));
      if (!xobjRef) continue;
      const xo = pdfDoc.context.lookup(xobjRef);
      if (!xo || typeof xo.keys !== 'function') continue;
      for (const key of [...xo.keys()]) {
        try {
          const stream = pdfDoc.context.lookup(xo.get(key));
          const dict = stream.dict || stream;
          const w = Number(dict.get?.(PDFName.of('Width'))?.toString?.() || 0);
          const hasSMask = Boolean(dict.get?.(PDFName.of('SMask')));
          if (hasSMask && w >= 400) {
            console.log('[VSign appearance] stripping legacy transparent hand image', key.toString(), w);
            xo.delete(key);
          }
        } catch (_) { /* skip */ }
      }
    } catch (err) {
      console.warn('[VSign appearance] stripLegacyTransparentHandImages:', err.message);
    }
  }
}

function boxesFromSignatureDetails(signaturedetails = []) {
  return signaturedetails.map((entry) => ({
    pageNum: Number(entry.page),
    ...(entry.coordinates?.[0] || {}),
  })).filter((b) => b.w && b.h);
}

function drawVectorCheckmark(page, rect) {
  const viewW = 100;
  const viewH = 100;
  const drawW = rect.w * 0.5;
  const drawH = rect.h * 0.92;
  const originX = rect.x + rect.w * 0.04;
  const originY = rect.y + rect.h * 0.02;
  const scaleX = drawW / viewW;
  const scaleY = drawH / viewH;
  const map = (vx, vy) => ({
    x: originX + vx * scaleX,
    y: originY + (viewH - vy) * scaleY,
  });

  const p0 = map(6, 58);
  const p1 = map(28, 80);
  const p2 = map(92, 14);
  // Wider stroke so the watermark tick reads clearly behind the text.
  const thickness = Math.max(4, Math.min(rect.h * 0.17, rect.w * 0.055));

  page.drawLine({
    start: p0,
    end: p1,
    thickness,
    color: VSIGN_CHECK_GREEN,
    lineCap: 1,
  });
  page.drawLine({
    start: p1,
    end: p2,
    thickness,
    color: VSIGN_CHECK_GREEN,
    lineCap: 1,
  });
}

/**
 * VSign embeds a visible Signature widget appearance. Content-stream white-outs
 * do not hide it — move widgets off-page and drop /AP so only our paint shows.
 */
function hideSignatureWidgetAppearances(pdfDoc) {
  try {
    const form = pdfDoc.getForm();
    for (const field of form.getFields()) {
      let widgets = [];
      try {
        widgets = field.acroField.getWidgets();
      } catch (_) {
        continue;
      }
      for (const widget of widgets) {
        try {
          widget.dict.set(
            PDFName.of('Rect'),
            pdfDoc.context.obj([5000, 5000, 5001, 5001]),
          );
          widget.dict.delete(PDFName.of('AP'));
          widget.dict.delete(PDFName.of('AS'));
        } catch (err) {
          console.warn('[VSign appearance] hide widget skipped:', err.message);
        }
      }
    }
  } catch (err) {
    console.warn('[VSign appearance] hideSignatureWidgetAppearances:', err.message);
  }
}

async function paintBoxesOnPdf(pdfDoc, boxes, drawFn) {
  for (const box of boxes) {
    const pageIndex = Math.max(0, Number(box.pageNum || box.page || 1) - 1);
    const page = pdfDoc.getPages()[pageIndex];
    if (!page) continue;

    const x = Number(box.x || 0);
    const yTop = Number(box.y || 0);
    const w = Math.max(1, Number(box.w || 280));
    const h = Math.max(MIN_AADHAAR_HEIGHT, Number(box.h || MIN_AADHAAR_HEIGHT));
    const pageH = page.getHeight();
    const pdfY = pageH - yTop - h;

    await drawFn(page, { x, y: pdfY, w, h, pageH, yTop });
  }
}

async function embedHandwrittenInRect(pdfDoc, page, rect, handwrittenBase64, maxH) {
  if (!handwrittenBase64) return 0;
  // Full strip blue first — never leave a paper-white hole in the dual stamp.
  page.drawRectangle({
    x: rect.x,
    y: rect.y,
    width: rect.w,
    height: rect.h,
    color: VSIGN_BOX_BG,
    borderWidth: 0,
  });

  const raw = String(handwrittenBase64 || '').trim();
  if (!raw || /^https?:\/\//i.test(raw) || (raw.startsWith('/') && !raw.startsWith('/9j') && !raw.startsWith('/iVBOR'))) {
    return 0;
  }
  const clean = raw.replace(/^data:image\/\w+;base64,/, '');
  if (!clean) return 0;

  let prepared;
  try {
    prepared = flattenHandwrittenPng(Buffer.from(clean, 'base64'));
  } catch (err) {
    console.warn('[VSign appearance] flatten handwritten failed:', err.message);
    return 0;
  }
  if (!prepared?.bytes || prepared.width < 2) return 0;

  let img;
  try {
    img = await pdfDoc.embedPng(prepared.bytes);
  } catch (err) {
    console.warn('[VSign appearance] handwritten embed failed:', err.message);
    return 0;
  }

  console.log('[VSign appearance] handwritten embed', {
    srcW: prepared.width,
    srcH: prepared.height,
    stripW: Math.round(rect.w),
    stripH: Math.round(rect.h),
  });

  const stripH = Math.max(24, maxH);
  const imgAspect = prepared.width / Math.max(1, prepared.height);
  // Ink only on the left ~40% — right side stays solid dual blue (covers any legacy white).
  let drawH = Math.min(stripH, stripH * 0.92);
  let drawW = drawH * imgAspect;
  const maxDrawW = Math.max(20, (rect.w - 8) * 0.4);
  if (drawW > maxDrawW) {
    drawW = maxDrawW;
    drawH = drawW / imgAspect;
  }
  const drawX = rect.x + 4;
  const drawY = rect.y + rect.h - stripH + (stripH - drawH) / 2;
  page.drawImage(img, { x: drawX, y: drawY, width: drawW, height: drawH });

  // Force-cover the top-right of the strip (legacy transparent PNG / VSign logo slot).
  const coverX = rect.x + rect.w * 0.42;
  page.drawRectangle({
    x: coverX,
    y: rect.y,
    width: rect.x + rect.w - coverX,
    height: rect.h,
    color: VSIGN_BOX_BG,
    borderWidth: 0,
  });
  return drawW + 8;
}

function measureAppearanceContentWidth(font, lines, fontSize, handwrittenWidth = 0) {
  let maxText = 0;
  for (const line of lines) {
    try {
      maxText = Math.max(maxText, font.widthOfTextAtSize(String(line), fontSize));
    } catch (_) {
      maxText = Math.max(maxText, String(line).length * fontSize * 0.55);
    }
  }
  // Text + left/right padding; checkmark sits behind text so no extra width needed.
  const textBlock = Math.ceil(maxText + 10);
  return Math.max(120, textBlock, Math.ceil(handwrittenWidth || 0));
}

/** Blue box only before gettxnref (non-dual flows). */
async function paintAadhaarAppearanceBackground(pdfPath, options = {}) {
  const boxes = options.boxes || [];
  if (!pdfPath || !fs.existsSync(pdfPath) || !boxes.length) return pdfPath;

  const pdfBytes = fs.readFileSync(pdfPath);
  const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });

  await paintBoxesOnPdf(pdfDoc, boxes, async (page, rect) => {
    page.drawRectangle({
      x: rect.x,
      y: rect.y,
      width: rect.w,
      height: rect.h,
      color: VSIGN_BOX_BG,
      borderWidth: 0,
    });
  });

  fs.writeFileSync(pdfPath, Buffer.from(await pdfDoc.save({ useObjectStreams: false })));
  return pdfPath;
}

/**
 * One dual block matching UI: hide VSign widget, wipe field, paint handwritten + Aadhaar once.
 * Blue box width follows content (longest text line), not a fixed 280pt field width.
 */
async function paintAadhaarAppearanceOnPdf(pdfPath, options = {}) {
  if (!pdfPath || !fs.existsSync(pdfPath)) return pdfPath;

  const signatureFields = (options.signatureFields || []).filter(
    (f) => !f?.type || f.type === 'signature',
  );
  const boxes = options.boxes || [];
  if (!boxes.length && !signatureFields.length) return pdfPath;

  const recipient = options.recipient || {};
  const verifiedAt = options.verifiedAt || new Date();
  const handwrittenBase64 = options.handwrittenBase64 || null;
  const hasHandwritten = Boolean(handwrittenBase64);

  const pdfBytes = fs.readFileSync(pdfPath);
  const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  hideSignatureWidgetAppearances(pdfDoc);

  const font = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const lines = estimateVSignAppearanceLines(recipient);
  lines[3] = `Date : ${formatVSignIstDate(verifiedAt)}`;

  // Wipe VSign utility appearance plates first (280pt box + handwritten strip above).
  // Transparent handwritten XObjects from the utility show as white until covered.
  for (const b of boxes) {
    const pageIndex = Math.max(0, Number(b.pageNum || b.page || 1) - 1);
    const page = pdfDoc.getPages()[pageIndex];
    if (!page) continue;
    const bx = Number(b.x || 0);
    const byTop = Number(b.y || 0);
    const bw = Math.max(1, Number(b.w || 280));
    const bh = Math.max(1, Number(b.h || 88));
    const handExtra = hasHandwritten ? 100 : 20;
    page.drawRectangle({
      x: Math.max(0, bx - 40),
      y: Math.max(0, page.getHeight() - (byTop - handExtra) - (bh + handExtra + 60)),
      width: bw + 120,
      height: bh + handExtra + 60,
      color: VSIGN_COVER_BG,
      borderWidth: 0,
    });
  }

  const targets = signatureFields.length
    ? signatureFields
    : boxes.map((b) => ({
      page: b.pageNum || b.page || 1,
      x: b.x,
      y: b.y,
      width: b.w,
      height: (b.h || MIN_AADHAAR_HEIGHT) + (hasHandwritten ? HANDWRITTEN_MIN_HEIGHT : 0),
      type: 'signature',
    }));

  for (const field of targets) {
    const pageIndex = Math.max(0, Number(field.page || 1) - 1);
    const page = pdfDoc.getPages()[pageIndex];
    if (!page) continue;

    const scale = page.getWidth() / BASE_PAGE_WIDTH;
    const x = Number(field.x || 0) * scale;
    const yTop = Number(field.y || 0) * scale;
    const fieldW = Math.max(1, Number(field.width || 200) * scale);
    const fieldH = Math.max(1, Number(field.height || 50) * scale);
    const handH = hasHandwritten
      ? Math.max(computeHandwrittenStripHeight(fieldH), 28)
      : 0;
    const aadhaarH = MIN_AADHAAR_HEIGHT;
    const totalH = handH + aadhaarH;
    const fontSize = Math.max(8, Math.min(11, Math.round(aadhaarH / 8)));
    // Width = text only (never fieldW / 280 — those left empty blue on the right).
    const boxW = measureAppearanceContentWidth(font, lines, fontSize, 0);
    console.log('[VSign appearance] dual boxW', {
      boxW,
      fieldW: Math.round(fieldW),
      fontSize,
      longest: lines.reduce((a, l) => (l.length > a.length ? l : a), ''),
    });

    // Wipe wider than final box so previous wide (280pt) paints / bleed disappear.
    const wipeH = totalH + 160;
    const wipeW = Math.max(boxW, fieldW, 280) + 160;
    const wipeYTop = Math.max(0, yTop - 80);
    page.drawRectangle({
      x: Math.max(0, x - 70),
      y: Math.max(0, page.getHeight() - wipeYTop - wipeH),
      width: wipeW,
      height: wipeH,
      color: VSIGN_COVER_BG,
      borderWidth: 0,
    });

    const dualPdfY = page.getHeight() - yTop - totalH;
    const dualRect = { x, y: dualPdfY, w: boxW, h: totalH };

    page.drawRectangle({
      x: dualRect.x,
      y: dualRect.y,
      width: dualRect.w,
      height: dualRect.h,
      color: VSIGN_BOX_BG,
      borderWidth: 0,
    });

    if (hasHandwritten) {
      const handRect = {
        x: dualRect.x,
        y: dualRect.y + aadhaarH,
        w: dualRect.w,
        h: handH,
      };
      // Draw inside content-fit width only (do not expand box for canvas aspect).
      await embedHandwrittenInRect(pdfDoc, page, handRect, handwrittenBase64, handH - 4);
    }

    const aadhaarRect = {
      x: dualRect.x,
      y: dualRect.y,
      w: dualRect.w,
      h: aadhaarH,
    };
    drawVectorCheckmark(page, aadhaarRect);

    const lineHeight = fontSize * 1.32;
    const textX = aadhaarRect.x + 5;
    let textY = aadhaarRect.y + aadhaarH - fontSize - 4;
    for (const line of lines) {
      page.drawText(line, {
        x: textX,
        y: textY,
        size: fontSize,
        font,
        color: rgb(0, 0, 0),
      });
      textY -= lineHeight;
    }

    // Final pass: kill any remaining top-right white (transparent PNG / logo slot).
    if (hasHandwritten && handH > 0) {
      page.drawRectangle({
        x: dualRect.x + dualRect.w * 0.45,
        y: dualRect.y + aadhaarH,
        width: dualRect.w * 0.55,
        height: handH,
        color: VSIGN_BOX_BG,
        borderWidth: 0,
      });
    }
  }

  stripLegacyTransparentHandImages(pdfDoc);
  fs.writeFileSync(pdfPath, Buffer.from(await pdfDoc.save({ useObjectStreams: false })));
  return pdfPath;
}

module.exports = {
  paintAadhaarAppearanceOnPdf,
  paintAadhaarAppearanceBackground,
  boxesFromSignatureDetails,
  hideSignatureWidgetAppearances,
};
