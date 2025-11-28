export interface SignerData {
  _id: string;
  signerSlotId: string;
  signature?: string;
  role?: string;
  data?: Record<string, string>;
  signatureFields?: ActiveField[];
  initials?: string;
  nonSignatureFields?: NonSignatureFields[];
}
export interface NonSignatureFields {
  fieldId: string;
  value: string;
  state?: string;
  _id: string;
}
export interface ActiveField {
  _id: string;
  type: string;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  status: string;
  slotId?: string;
  recipientId?: string;
  fieldId?: string;
  signature?: string;
  state?: string;
}

export interface SignatureField {
  slotId: string;
  type: string;
  recipientId: string;
  page: number | { $numberInt: string };
  pageNumber?: number;
  pageNo?: number;
}