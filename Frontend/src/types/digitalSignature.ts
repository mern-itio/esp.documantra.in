export interface Certificate {
  commonName: string;
  organization: string;
  country: string;
  validFrom: Date;
  validTo: Date;
  serialNumber: string;
}

export interface CertificateFile {
  filename: string;
  type: 'certificate' | 'private-key';
  commonName?: string;
  organization?: string;
  country?: string;
  validFrom?: Date;
  validTo?: Date;
  size: number;
  lastModified: Date;
  error?: string;
}

export interface GenerateCertificateRequest {
  commonName?: string;
  organization?: string;
  country?: string;
}

export interface GenerateCertificateResponse {
  success: boolean;
  message: string;
  privateKeyFile: string;
  certificateFile: string;
  certificate: Certificate;
}

export interface ListCertificatesResponse {
  success: boolean;
  certificates: CertificateFile[];
  total: number;
}

export interface DigitalSignatureRequest {
  file: File;
  privateKeyFile: string;
  certificateFile: string;
  reason?: string;
  location?: string;
  contactInfo?: string;
  timestamp?: boolean;
}

export interface DigitalSignatureResponse {
  success: boolean;
  message: string;
  filename: string;
  downloadUrl: string;
  signatureInfo: {
    reason: string;
    location: string;
    contactInfo: string;
    timestamp?: string;
    signer: string;
    organization: string;
    algorithm: string;
  };
}

export interface VerifySignatureRequest {
  file: File;
}

export interface SignatureVerificationResult {
  fieldName: string;
  status: 'verified' | 'unsigned' | 'error';
  message: string;
  details?: {
    reason: string;
    location: string;
    contactInfo: string;
    name: string;
    date: string;
    algorithm: string;
  };
  error?: string;
}

export interface VerifySignatureResponse {
  hasSignatures: boolean;
  totalSignatures?: number;
  verificationResults?: SignatureVerificationResult[];
  summary?: {
    verified: number;
    unsigned: number;
    errors: number;
  };
  message?: string;
}

export interface TimestampAuthorityRequest {
  hash: string;
}

export interface TimestampToken {
  hash: string;
  timestamp: string;
  serialNumber: string;
  authority: string;
  algorithm: string;
  policy: string;
}

export interface TimestampAuthorityResponse {
  success: boolean;
  timestampToken: TimestampToken;
  message: string;
}

export interface CertificateValidation {
  valid: boolean;
  message: string;
  details?: {
    expired: boolean;
    revoked: boolean;
    trusted: boolean;
  };
}
