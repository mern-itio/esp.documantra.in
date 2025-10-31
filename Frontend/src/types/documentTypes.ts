export interface SignerData {
  _id: string;
  signerSlotId: string;
  signature?: string;
  role?: string;
  data?: Record<string, string>;
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
}

export interface SignatureField {
  slotId: string;
  type: string;
  recipientId: string;
  page: number | { $numberInt: string };
  pageNumber?: number;
  pageNo?: number;
}