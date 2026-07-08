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

export function isPdfUploadFile(file: File): boolean {
  return (
    file.type === 'application/pdf' ||
    /\.pdf$/i.test(file.name || '')
  );
}
