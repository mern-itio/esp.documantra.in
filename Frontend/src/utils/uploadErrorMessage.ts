import type { AxiosError } from 'axios';
import { ESIGN_UPLOAD_FORMAT_LABEL } from '../config/esignUploadFormats';

const MB = 1024 * 1024;

export const getEsignMaxUploadBytes = (): number => {
  const fromEnv = Number(import.meta.env.VITE_ESIGN_MAX_UPLOAD_MB);
  if (Number.isFinite(fromEnv) && fromEnv > 0) {
    return fromEnv * MB;
  }
  return 100 * MB;
};

export const getEsignMaxUploadLabel = (): string => {
  const mb = getEsignMaxUploadBytes() / MB;
  return mb % 1 === 0 ? `${mb} MB` : `${mb.toFixed(1)} MB`;
};

export const isFileTooLargeForEsign = (file: File): boolean =>
  file.size > getEsignMaxUploadBytes();

export const formatUploadFileSize = (bytes: number): string => {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 KB';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < MB) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / MB).toFixed(2)} MB`;
};

export const getEsignUploadLimitHint = (): string =>
  `${ESIGN_UPLOAD_FORMAT_LABEL} · Max ${getEsignMaxUploadLabel()} per file`;

export const getEsignUploadErrorMessage = (
  error: unknown,
  fileName?: string
): string => {
  const limit = getEsignMaxUploadLabel();
  const prefix = fileName ? `"${fileName}"` : 'This file';

  const axiosErr = error as AxiosError<{ message?: string }>;
  const status = axiosErr?.response?.status;
  const serverMessage = axiosErr?.response?.data?.message;

  if (status === 413) {
    return `${prefix} is too large. Please upload a file smaller than ${limit}.`;
  }
  if (status === 400 && serverMessage) {
    return serverMessage;
  }
  if (serverMessage) {
    return serverMessage;
  }
  if (status === 401) {
    return 'Your session expired. Please sign in again and retry the upload.';
  }

  return `Upload failed. Please use ${ESIGN_UPLOAD_FORMAT_LABEL} under ${limit} and try again.`;
};
