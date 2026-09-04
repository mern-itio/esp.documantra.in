import { useEffect } from 'react';
import { useDocumantraBranding } from '../hooks/useDocumantraBranding';

const FAVICON_SIZE = 64;
const FAVICON_PADDING = 6;

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function loadImage(src: string, useCors: boolean): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (useCors) img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Favicon image decode failed'));
    img.src = src;
  });
}

/** True when corners are transparent — needs a white plate for dark browser tabs. */
function imageNeedsWhitePlate(img: HTMLImageElement): boolean {
  const probe = document.createElement('canvas');
  const size = 32;
  probe.width = size;
  probe.height = size;
  const ctx = probe.getContext('2d', { willReadFrequently: true });
  if (!ctx) return true;

  ctx.clearRect(0, 0, size, size);
  ctx.drawImage(img, 0, 0, size, size);

  try {
    const corners = [
      [1, 1],
      [size - 2, 1],
      [1, size - 2],
      [size - 2, size - 2],
    ] as const;
    for (const [x, y] of corners) {
      const alpha = ctx.getImageData(x, y, 1, 1).data[3];
      if (alpha < 250) return true;
    }
    return false;
  } catch {
    return true;
  }
}

function drawFaviconOnWhite(img: HTMLImageElement): string {
  const canvas = document.createElement('canvas');
  canvas.width = FAVICON_SIZE;
  canvas.height = FAVICON_SIZE;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.clearRect(0, 0, FAVICON_SIZE, FAVICON_SIZE);
  roundRectPath(ctx, 0, 0, FAVICON_SIZE, FAVICON_SIZE, 14);
  ctx.fillStyle = '#ffffff';
  ctx.fill();

  const max = FAVICON_SIZE - FAVICON_PADDING * 2;
  const scale = Math.min(
    max / Math.max(img.naturalWidth, 1),
    max / Math.max(img.naturalHeight, 1),
  );
  const w = img.naturalWidth * scale;
  const h = img.naturalHeight * scale;
  const x = (FAVICON_SIZE - w) / 2;
  const y = (FAVICON_SIZE - h) / 2;
  ctx.drawImage(img, x, y, w, h);

  return canvas.toDataURL('image/png');
}

function drawFaviconAsIs(img: HTMLImageElement): string {
  const canvas = document.createElement('canvas');
  canvas.width = FAVICON_SIZE;
  canvas.height = FAVICON_SIZE;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  ctx.clearRect(0, 0, FAVICON_SIZE, FAVICON_SIZE);
  ctx.drawImage(img, 0, 0, FAVICON_SIZE, FAVICON_SIZE);
  return canvas.toDataURL('image/png');
}

async function prepareFavicon(src: string): Promise<string> {
  const tryWith = async (url: string, useCors: boolean) => {
    const img = await loadImage(url, useCors);
    if (imageNeedsWhitePlate(img)) return drawFaviconOnWhite(img);
    return drawFaviconAsIs(img);
  };

  try {
    const out = await tryWith(src, true);
    if (out) return out;
  } catch {
    // continue
  }

  const res = await fetch(src, { mode: 'cors', credentials: 'omit', cache: 'no-store' });
  if (!res.ok) throw new Error(`Favicon fetch failed: ${res.status}`);
  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  try {
    const out = await tryWith(objectUrl, false);
    if (!out) throw new Error('Empty favicon canvas');
    return out;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function applyFaviconHref(href: string) {
  const head = document.head;

  head
    .querySelectorAll<HTMLLinkElement>('link[rel="icon"], link[rel="shortcut icon"]')
    .forEach((el) => el.remove());

  const icon = document.createElement('link');
  icon.rel = 'icon';
  icon.type = 'image/png';
  icon.sizes = '64x64';
  icon.href = href;
  head.appendChild(icon);

  let apple = head.querySelector<HTMLLinkElement>('link[rel="apple-touch-icon"]');
  if (!apple) {
    apple = document.createElement('link');
    apple.rel = 'apple-touch-icon';
    head.appendChild(apple);
  }
  apple.href = href;
}

/**
 * Favicon from DocuMantra admin branding (same Supabase asset as documantra.in).
 * Transparent uploads get a white plate; opaque brand icons stay as-is.
 */
export default function BrandingHead() {
  const { data } = useDocumantraBranding();

  useEffect(() => {
    const href = data?.faviconUrl;
    if (!href) return;

    let cancelled = false;

    (async () => {
      try {
        const prepared = await prepareFavicon(href);
        if (!cancelled) applyFaviconHref(prepared);
      } catch {
        if (!cancelled) applyFaviconHref(href);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [data?.faviconUrl]);

  return null;
}
