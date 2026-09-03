import { PDFJS_WORKER_SRC } from '../config/pdfjsWorker';

/** Normalize text for envelope-type matching. */
export function normalizeEnvelopeTypeText(value: string): string {
  return String(value || '')
    .replace(/\.[a-z0-9]{2,5}$/i, '')
    .toLowerCase()
    .replace(/[_.\-]+/g, ' ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const ENVELOPE_TYPE_ALIASES: Record<string, string[]> = {
  agreement: ['agreement', 'contract', 'mou', 'msa', 'sla'],
  contract: ['contract', 'agreement', 'mou'],
  nda: ['nda', 'non disclosure', 'confidentiality', 'non-disclosure'],
  invoice: ['invoice', 'bill', 'receipt', 'tax invoice'],
  offer: ['offer letter', 'offer', 'appointment letter', 'joining letter'],
  letter: ['letter', 'cover letter'],
  proposal: ['proposal', 'quotation', 'quote', 'estimate'],
  form: ['form', 'application', 'registration'],
  policy: ['policy', 'handbook', 'sop'],
  report: ['report', 'log', 'audit', 'statement'],
  resume: ['resume', 'cv', 'biodata'],
  purchase: ['po', 'purchase order', 'work order', 'purchase agreement'],
  lease: ['lease', 'rental', 'rent agreement'],
  certificate: ['certificate', 'certification'],
  employment: ['employment', 'employee', 'job offer', 'employment contract'],
  sales: ['sales contract', 'sales agreement', 'sale deed'],
};

const GENERIC_FILENAME_RE =
  /^(whatsapp\s*image|img[_\s-]?\d|dsc[_\s-]?\d|screenshot|screen\s*shot|image[_\s-]?\d|photo[_\s-]?\d|camera|dcim|download|file|document|untitled|scan\d*|adobe\s*scan)/i;

export function isGenericUploadFilename(name: string): boolean {
  const base = String(name || '')
    .replace(/\.[a-z0-9]{2,5}$/i, '')
    .trim();
  if (!base) return true;
  if (GENERIC_FILENAME_RE.test(base)) return true;
  // Mostly digits / dates (e.g. "2026 09 03 At 12 44 31 PM")
  const letters = (base.match(/[a-zA-Z]/g) || []).length;
  const digits = (base.match(/\d/g) || []).length;
  return letters < 4 && digits >= 6;
}

/** Pick a short headline-like line from extracted document text. */
export function pickHeadlineFromText(text: string): string {
  const lines = String(text || '')
    .split(/\r?\n/)
    .map((l) => l.replace(/\s+/g, ' ').trim())
    .filter((l) => l.length >= 4);

  const candidates = lines
    .slice(0, 40)
    .filter((l) => {
      if (l.length > 120) return false;
      if (/^page\s*\d+/i.test(l)) return false;
      if (/^https?:\/\//i.test(l)) return false;
      if (/^\d+$/.test(l)) return false;
      return /[a-zA-Z]{3,}/.test(l);
    })
    .sort((a, b) => {
      // Prefer title-case / short-ish lines near the top
      const aScore =
        (a.length <= 60 ? 20 : 0) +
        (/^[A-Z]/.test(a) ? 10 : 0) +
        (a === a.toUpperCase() && a.length <= 50 ? 8 : 0) -
        Math.abs(40 - a.length) * 0.2;
      const bScore =
        (b.length <= 60 ? 20 : 0) +
        (/^[A-Z]/.test(b) ? 10 : 0) +
        (b === b.toUpperCase() && b.length <= 50 ? 8 : 0) -
        Math.abs(40 - b.length) * 0.2;
      return bScore - aScore;
    });

  return (candidates[0] || '').slice(0, 80);
}

async function loadPdfJs(): Promise<any | null> {
  try {
    let pdfjsLib = (typeof window !== 'undefined' && (window as any).pdfjsLib) || null;
    if (!pdfjsLib) {
      const pdfjsModule = await import('pdfjs-dist');
      pdfjsLib = pdfjsModule;
      if (pdfjsLib.GlobalWorkerOptions) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_SRC;
      }
      if (typeof window !== 'undefined') {
        (window as any).pdfjsLib = pdfjsLib;
      }
    }
    return pdfjsLib;
  } catch {
    return null;
  }
}

async function extractPdfText(file: File, maxPages = 2): Promise<string> {
  const pdfjsLib = await loadPdfJs();
  if (!pdfjsLib) return '';

  const data = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data }).promise;
  const pageCount = Math.min(pdf.numPages || 1, maxPages);
  const chunks: string[] = [];

  for (let i = 1; i <= pageCount; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = (content.items || [])
      .map((item: any) => (typeof item?.str === 'string' ? item.str : ''))
      .filter(Boolean)
      .join(' ');
    if (pageText.trim()) chunks.push(pageText.trim());
  }

  return chunks.join('\n').slice(0, 4000);
}

async function extractPlainText(file: File): Promise<string> {
  const text = await file.text();
  return String(text || '')
    .replace(/\0/g, ' ')
    .slice(0, 4000);
}

/** Best-effort content snippet from an uploaded eSign file (PDF / text; images return empty). */
export async function extractDocumentContentSnippet(file: File): Promise<string> {
  const name = (file.name || '').toLowerCase();
  const mime = (file.type || '').toLowerCase();

  try {
    if (mime === 'application/pdf' || name.endsWith('.pdf')) {
      return await extractPdfText(file, 2);
    }

    if (mime === 'text/plain' || name.endsWith('.txt') || name.endsWith('.rtf') || mime.includes('rtf')) {
      return await extractPlainText(file);
    }

    // Images / binary Office docs: no reliable client-side text without OCR
    return '';
  } catch (err) {
    console.warn('Failed to extract document content for envelope type:', err);
    return '';
  }
}

export function guessEnvelopeTypeFromText(
  sources: Array<string | undefined | null>,
  types: Array<{ title?: string }>,
): string | null {
  const haystack = normalizeEnvelopeTypeText(sources.filter(Boolean).join(' '));
  if (!haystack || !types?.length) return null;

  let bestTitle: string | null = null;
  let bestScore = 0;

  for (const type of types) {
    const title = String(type?.title || '').trim();
    if (!title) continue;
    const normTitle = normalizeEnvelopeTypeText(title);
    if (!normTitle) continue;

    let score = 0;

    if (haystack === normTitle) score = 100;
    else if (haystack.includes(normTitle)) score = 85 + Math.min(normTitle.length, 15);
    else if (normTitle.includes(haystack) && haystack.length >= 4) score = 70;

    const titleWords = normTitle.split(' ').filter((w) => w.length > 2);
    if (titleWords.length > 0) {
      const matched = titleWords.filter((w) => haystack.includes(w)).length;
      score = Math.max(score, Math.round((matched / titleWords.length) * 75));
    }

    for (const [key, aliases] of Object.entries(ENVELOPE_TYPE_ALIASES)) {
      const titleHits = aliases.some((a) => normTitle.includes(a)) || normTitle.includes(key);
      const fileHits = aliases.some((a) => haystack.includes(a)) || haystack.includes(key);
      if (titleHits && fileHits) score = Math.max(score, 78);
    }

    if (score > bestScore) {
      bestScore = score;
      bestTitle = title;
    }
  }

  return bestScore >= 40 ? bestTitle : null;
}

function titleCaseLabel(raw: string): string {
  const cleaned = String(raw || '')
    .replace(/[_.\-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const titled = cleaned
    .split(' ')
    .filter(Boolean)
    .map((word) => {
      if (/^[A-Z0-9]{2,}$/.test(word)) return word;
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');

  return titled.slice(0, 80) || 'Other Document';
}

/**
 * Other fallback: prefer content headline; avoid camera/WhatsApp filenames.
 */
export function deriveOtherEnvelopeTypeLabel(options: {
  contentHeadline?: string | null;
  contentSnippet?: string | null;
  fileName?: string | null;
}): string {
  const headline = String(options.contentHeadline || '').trim();
  if (headline) return titleCaseLabel(headline);

  const snippetLine = pickHeadlineFromText(String(options.contentSnippet || ''));
  if (snippetLine) return titleCaseLabel(snippetLine);

  const fileName = String(options.fileName || '').trim();
  if (fileName && !isGenericUploadFilename(fileName)) {
    return titleCaseLabel(fileName.replace(/\.[a-z0-9]{2,5}$/i, ''));
  }

  return 'Other Document';
}

export function resolveEnvelopeTypeFromContent(options: {
  contentSnippet?: string | null;
  fileName?: string | null;
  documentTitle?: string | null;
  subject?: string | null;
  types: Array<{ title?: string }>;
}): { type: string; fromCatalog: boolean; headline: string } {
  const content = String(options.contentSnippet || '').trim();
  const headline = pickHeadlineFromText(content);
  const fileName = options.fileName || '';

  const contentSources = [headline, content.slice(0, 800)];
  const nameSources = [
    isGenericUploadFilename(fileName || '') ? '' : fileName,
    options.documentTitle,
    options.subject,
  ];

  // Prefer content match, then filename/title match
  const fromContent =
    options.types.length > 0 ? guessEnvelopeTypeFromText(contentSources, options.types) : null;
  const fromName =
    !fromContent && options.types.length > 0
      ? guessEnvelopeTypeFromText(nameSources, options.types)
      : null;

  const matched = fromContent || fromName;
  if (matched) {
    return { type: matched, fromCatalog: true, headline };
  }

  const other = deriveOtherEnvelopeTypeLabel({
    contentHeadline: headline,
    contentSnippet: content,
    fileName,
  });

  return { type: other, fromCatalog: false, headline };
}
