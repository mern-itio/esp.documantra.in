export const ESIGN_UPLOAD_EXTENSIONS = [
  'pdf',
  'png',
  'jpg',
  'jpeg',
  'gif',
  'bmp',
  'tiff',
  'webp',
  'doc',
  'docx',
  'txt',
  'rtf',
] as const;

export const ESIGN_UPLOAD_ACCEPT = [
  ...ESIGN_UPLOAD_EXTENSIONS.map((ext) => `.${ext}`),
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/bmp',
  'image/tiff',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'application/rtf',
  'text/rtf',
].join(',');

export const ESIGN_UPLOAD_FORMAT_LABEL =
  'PDF, PNG, JPG, GIF, Word (DOC/DOCX), TXT, RTF';

export function isEsignUploadFile(file: File): boolean {
  const name = file.name || '';
  const ext = name.includes('.') ? name.split('.').pop()?.toLowerCase() || '' : '';
  if (ext && ESIGN_UPLOAD_EXTENSIONS.includes(ext as (typeof ESIGN_UPLOAD_EXTENSIONS)[number])) {
    return true;
  }

  const mime = (file.type || '').toLowerCase();
  return (
    mime === 'application/pdf' ||
    mime.startsWith('image/') ||
    mime === 'application/msword' ||
    mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mime === 'text/plain' ||
    mime === 'application/rtf' ||
    mime === 'text/rtf'
  );
}

export const ESIGN_IMAGE_EXTENSIONS = [
  'png',
  'jpg',
  'jpeg',
  'gif',
  'bmp',
  'tiff',
  'webp',
] as const;

export const ESIGN_OFFICE_EXTENSIONS = ['doc', 'docx', 'rtf', 'txt'] as const;

export type EsignUploadLike = { name?: string; type?: string };

export function getEsignUploadExtension(name?: string): string {
  const base = String(name || '');
  if (!base.includes('.')) return '';
  return base.split('.').pop()?.toLowerCase() || '';
}

export function isImageUploadFile(file: EsignUploadLike): boolean {
  const ext = getEsignUploadExtension(file.name);
  if (ext && (ESIGN_IMAGE_EXTENSIONS as readonly string[]).includes(ext)) {
    return true;
  }
  return (file.type || '').toLowerCase().startsWith('image/');
}

export function isOfficeOrTextUploadFile(file: EsignUploadLike): boolean {
  const ext = getEsignUploadExtension(file.name);
  if (ext && (ESIGN_OFFICE_EXTENSIONS as readonly string[]).includes(ext)) {
    return true;
  }
  const mime = (file.type || '').toLowerCase();
  return (
    mime === 'application/msword' ||
    mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mime === 'text/plain' ||
    mime === 'application/rtf' ||
    mime === 'text/rtf'
  );
}

export type EsignDocumentPreviewKind = 'pdf' | 'image' | 'document';

export function getEsignDocumentPreviewKind(file: EsignUploadLike): EsignDocumentPreviewKind {
  if (isPdfUploadFile(file)) return 'pdf';
  if (isImageUploadFile(file)) return 'image';
  return 'document';
}

export function isPdfUploadFile(file: EsignUploadLike): boolean {
  return (
    (file.type || '').toLowerCase() === 'application/pdf' ||
    /\.pdf$/i.test(file.name || '') ||
    getEsignUploadExtension(file.name) === 'pdf'
  );
}
