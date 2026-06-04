export type PublicAction = 'sign' | 'sign-notarize' | 'edit-fill';

export type SignerType = 'me-only' | 'me-other' | 'others-only';

export type PublicRecipient = {
  id: string;
  name: string;
  email: string;
  isMe?: boolean;
};

export type PublicSignMeta = {
  action: PublicAction;
  signerType: SignerType;
  recipients: PublicRecipient[];
};

export const PUBLIC_SIGN_META_KEY = 'publicSignMeta';
export const PUBLIC_SIGN_RESUME_KEY = 'publicSignResume';
