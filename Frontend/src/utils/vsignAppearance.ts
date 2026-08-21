const DUAL_BOX_BLUE = { r: 232, g: 242, b: 255 };

/**
 * Punch near-white SignPad canvas pixels to transparent.
 * Prevents a white blank in the dual-signature top strip (live + stored PNGs).
 */
export function transparentizeWhiteCanvas(
  canvas: HTMLCanvasElement,
  threshold = 230,
): HTMLCanvasElement {
  const ctx = canvas.getContext('2d');
  if (!ctx || !canvas.width || !canvas.height) return canvas;
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = imageData.data;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i] >= threshold && d[i + 1] >= threshold && d[i + 2] >= threshold) {
      d[i + 3] = 0;
    }
  }
  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

/** Crop fully transparent margins so ink sits tight (no empty side strip). */
export function trimTransparentCanvas(
  canvas: HTMLCanvasElement,
  alphaCut = 8,
): HTMLCanvasElement {
  const ctx = canvas.getContext('2d');
  if (!ctx || !canvas.width || !canvas.height) return canvas;
  const { width, height } = canvas;
  const imageData = ctx.getImageData(0, 0, width, height);
  const d = imageData.data;
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (d[(y * width + x) * 4 + 3] > alphaCut) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < minX || maxY < minY) return canvas;
  const pad = 2;
  minX = Math.max(0, minX - pad);
  minY = Math.max(0, minY - pad);
  maxX = Math.min(width - 1, maxX + pad);
  maxY = Math.min(height - 1, maxY + pad);
  const tw = maxX - minX + 1;
  const th = maxY - minY + 1;
  if (tw >= width * 0.95 && th >= height * 0.95) return canvas;
  const out = document.createElement('canvas');
  out.width = tw;
  out.height = th;
  const octx = out.getContext('2d');
  if (!octx) return canvas;
  octx.drawImage(canvas, minX, minY, tw, th, 0, 0, tw, th);
  return out;
}

/** Flatten ink onto dual-box blue so no viewer can paint transparency as white. */
export function compositeCanvasOnDualBlue(canvas: HTMLCanvasElement): HTMLCanvasElement {
  const ctx = canvas.getContext('2d');
  if (!ctx || !canvas.width || !canvas.height) return canvas;
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = imageData.data;
  const { r: br, g: bg, b: bb } = DUAL_BOX_BLUE;
  for (let i = 0; i < d.length; i += 4) {
    const a = d[i + 3] / 255;
    if (a <= 0) {
      d[i] = br;
      d[i + 1] = bg;
      d[i + 2] = bb;
      d[i + 3] = 255;
      continue;
    }
    if (a < 1) {
      d[i] = Math.round(d[i] * a + br * (1 - a));
      d[i + 1] = Math.round(d[i + 1] * a + bg * (1 - a));
      d[i + 2] = Math.round(d[i + 2] * a + bb * (1 - a));
      d[i + 3] = 255;
    }
  }
  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (!src.startsWith('data:')) {
      img.crossOrigin = 'anonymous';
    }
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('image load failed'));
    img.src = src;
  });
}

/**
 * Prepare handwritten PNG for dual stamp: drop white canvas → trim → bake on #E8F2FF.
 * Always returns an opaque blue-backed PNG so top-right cannot show white.
 */
export async function prepareHandwrittenForDual(
  src: string,
  threshold = 230,
): Promise<string> {
  if (!src || typeof src !== 'string') return src;
  if (src.startsWith('data:image/svg')) return src;
  try {
    let objectUrl: string | null = null;
    let loadSrc = src;
    if (!src.startsWith('data:')) {
      const res = await fetch(src, { mode: 'cors', credentials: 'omit' });
      if (res.ok) {
        const blob = await res.blob();
        objectUrl = URL.createObjectURL(blob);
        loadSrc = objectUrl;
      }
    }
    const img = await loadImageElement(loadSrc);
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    let canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth || img.width;
    canvas.height = img.naturalHeight || img.height;
    const ctx = canvas.getContext('2d');
    if (!ctx || !canvas.width || !canvas.height) return src;
    ctx.drawImage(img, 0, 0);
    transparentizeWhiteCanvas(canvas, threshold);
    canvas = trimTransparentCanvas(canvas);
    compositeCanvasOnDualBlue(canvas);
    return canvas.toDataURL('image/png');
  } catch {
    // Never fall back to a transparent SignPad PNG (PDF/HTML show alpha as white).
    return '';
  }
}

export function transparentizeWhiteDataUrl(
  dataUrl: string,
  threshold = 230,
): Promise<string> {
  return prepareHandwrittenForDual(dataUrl, threshold);
}

export function formatVSignIstDate(date = new Date()): string {
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
  } catch {
    return date.toString();
  }
}

export type VSignAppearanceRecipient = {
  name?: string;
  aadhaarNumber?: string;
  verifiedAt?: Date | string | null;
};

export type AadhaarSigningEvidence = {
  aadhaarVerifiedAt?: string;
  vsignVerifiedAt?: string;
  authMethods?: Array<{ type?: string; status?: string }>;
};

/** True once Aadhaar eSign OTP verification has completed — blocks handwritten edits. */
export function isAadhaarSigningVerified(
  evidence?: AadhaarSigningEvidence | null,
): boolean {
  if (!evidence) return false;
  if (evidence.aadhaarVerifiedAt || evidence.vsignVerifiedAt) return true;
  return (evidence.authMethods || []).some(
    (m) => m?.type === 'aadhaar' && m?.status === 'completed',
  );
}

/** Real signer lines for UI — uses masked Aadhaar + actual verification time when available. */
export function buildVSignAppearanceLines(
  recipient?: VSignAppearanceRecipient | null,
): string[] {
  const name = String(recipient?.name || 'Signer').trim();
  const aadhaar = String(recipient?.aadhaarNumber || '').replace(/\D/g, '');
  const last4 = aadhaar.slice(-4);
  const verifiedAt = recipient?.verifiedAt ? new Date(recipient.verifiedAt) : new Date();
  return [
    'Digitally Signed by',
    `Name : ${name}`,
    `Aadhaar No : **** **** ${last4 || '----'}`,
    `Date : ${formatVSignIstDate(verifiedAt)}`,
  ];
}

export function resolveVSignAppearanceRecipient(
  recipient?: {
    name?: string;
    email?: string;
    aadhaarNumber?: string;
    aadhaarLast4?: string;
    signingEvidence?: {
      aadhaarLast4?: string;
      aadhaarSignerName?: string;
      aadhaarVerifiedAt?: string;
      vsignVerifiedAt?: string;
      signCompletedAt?: string;
    } | null;
  } | null,
  options?: { storedAadhaar?: string | null; last4?: string | null },
): VSignAppearanceRecipient {
  const evidence = recipient?.signingEvidence || {};
  const last4 =
    String(recipient?.aadhaarLast4 || evidence.aadhaarLast4 || options?.last4 || '')
      .replace(/\D/g, '')
      .slice(-4) ||
    String(options?.storedAadhaar || '').replace(/\D/g, '').slice(-4) ||
    String(recipient?.aadhaarNumber || '').replace(/\D/g, '').slice(-4);

  const aadhaarNumber = last4 ? `00000000${last4}` : '';
  const aadhaarName = String(evidence.aadhaarSignerName || '').trim();

  return {
    name: aadhaarName || recipient?.name,
    aadhaarNumber,
    verifiedAt:
      evidence.aadhaarVerifiedAt ||
      evidence.vsignVerifiedAt ||
      evidence.signCompletedAt ||
      null,
  };
}
