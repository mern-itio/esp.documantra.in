import type { AxiosError } from 'axios';

const MB = 1024 * 1024;

export const getEsignMaxUploadBytes = (): number => {
  const fromEnv = Number(import.meta.env.VITE_ESIGN_MAX_UPLOAD_MB);
  if (Number.isFinite(fromEnv) && fromEnv > 0) {
    return fromEnv * MB;
  }
  return 5 * MB;
};

export const getEsignMaxUploadLabel = (): string => {
  const mb = getEsignMaxUploadBytes() / MB;
  return mb % 1 === 0 ? `${mb} MB` : `${mb.toFixed(1)} MB`;
};

export const isFileTooLargeForEsign = (file: File): boolean =>
  file.size > getEsignMaxUploadBytes();

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
    return `${prefix} is too large. Please upload a PDF smaller than ${limit}.`;
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

  return `Upload failed. Please use a PDF under ${limit} and try again.`;
};
