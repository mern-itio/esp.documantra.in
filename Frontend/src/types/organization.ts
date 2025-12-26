export interface Organization {
  _id?: string;
  id?: string;
  name: string;
  logo?: string;
  website?: string;
  gst?: string;
  gstNumber?: string;
  documents?: VerificationDocument[];
  verificationDocuments?: VerificationDocument[];
  createdBy?: string;
  approvedBy?: string;
  verifiedBy?: string;
  status?: boolean;
  isverified?: boolean;
  isverifcationRequested?: boolean;
  remark?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface VerificationDocument {
  type?: string;
  url?: string;
  verified?: boolean;
  verifiedBy?: string;
  verifiedAt?: string;
}

export interface CreateOrganizationRequest {
  name: string;
  logo?: string;
  website?: string;
  gst?: string;
  documents?: VerificationDocument[];
}

export interface VerifyOrganizationRequest {
  name: string;
  logo?: string;
  website: string;
  gst: string;
  documents?: File[];
}

export interface CreateOrganizationResponse {
  success: boolean;
  message: string;
  data: Organization;
}

export interface UpdateOrganizationRequest {
  name?: string;
  logo?: string;
  website?: string;
  gst?: string;
  documents?: VerificationDocument[];
}

export interface GetOrganizationResponse {
  success: boolean;
  data: Organization;
}

