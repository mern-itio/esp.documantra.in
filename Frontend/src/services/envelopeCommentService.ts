import { eSignApi } from './apiHelper';

export type EnvelopeCommentAnchor = {
  xPercent: number;
  yPercent: number;
  widthPercent: number;
  heightPercent: number;
};

export type EnvelopeComment = {
  _id: string;
  envelopeId: string;
  documentId: string;
  recipientId: string;
  authorName?: string;
  authorEmail?: string;
  page: number;
  anchor: EnvelopeCommentAnchor;
  selectedText?: string;
  message: string;
  status: 'open' | 'resolved';
  replies?: Array<{
    _id?: string;
    authorType: 'sender' | 'recipient';
    authorName?: string;
    message: string;
    createdAt?: string;
  }>;
  resolvedAt?: string;
  resolvedByType?: 'sender' | 'recipient';
  createdAt?: string;
  updatedAt?: string;
};

type AuthHeaders = Record<string, string> | undefined;

export async function fetchEnvelopeComments(
  envelopeId: string,
  recipientId: string,
  headers?: AuthHeaders,
  documentId?: string,
) {
  const response = await eSignApi.get(
    `/api/e-sign/public/envelope/${envelopeId}/recipient/${recipientId}/comments`,
    {
      headers,
      params: documentId ? { documentId } : undefined,
    },
  );
  return (response.data?.comments || []) as EnvelopeComment[];
}

export async function createEnvelopeComment(
  envelopeId: string,
  recipientId: string,
  payload: {
    documentId: string;
    page: number;
    anchor: EnvelopeCommentAnchor;
    selectedText?: string;
    message: string;
  },
  headers?: AuthHeaders,
) {
  const response = await eSignApi.post(
    `/api/e-sign/public/envelope/${envelopeId}/recipient/${recipientId}/comments`,
    payload,
    { headers },
  );
  return response.data?.comment as EnvelopeComment;
}

export async function resolveEnvelopeComment(
  envelopeId: string,
  recipientId: string,
  commentId: string,
  headers?: AuthHeaders,
) {
  const response = await eSignApi.patch(
    `/api/e-sign/public/envelope/${envelopeId}/recipient/${recipientId}/comments/${commentId}/resolve`,
    {},
    { headers },
  );
  return response.data?.comment as EnvelopeComment;
}

export async function fetchSenderEnvelopeComments(envelopeId: string, documentId?: string) {
  const response = await eSignApi.get(`/api/e-sign/envelope/${envelopeId}/comments`, {
    params: documentId ? { documentId } : undefined,
  });
  return (response.data?.comments || []) as EnvelopeComment[];
}

export async function resolveSenderEnvelopeComment(envelopeId: string, commentId: string) {
  const response = await eSignApi.patch(
    `/api/e-sign/envelope/${envelopeId}/comments/${commentId}/resolve`,
    {},
  );
  return response.data?.comment as EnvelopeComment;
}

export async function replyToSenderEnvelopeComment(
  envelopeId: string,
  commentId: string,
  message: string,
) {
  const response = await eSignApi.post(
    `/api/e-sign/envelope/${envelopeId}/comments/${commentId}/reply`,
    { message },
  );
  return response.data?.comment as EnvelopeComment;
}

export async function replyToRecipientEnvelopeComment(
  envelopeId: string,
  recipientId: string,
  commentId: string,
  message: string,
  headers?: AuthHeaders,
) {
  const response = await eSignApi.post(
    `/api/e-sign/public/envelope/${envelopeId}/recipient/${recipientId}/comments/${commentId}/reply`,
    { message },
    { headers },
  );
  return response.data?.comment as EnvelopeComment;
}
