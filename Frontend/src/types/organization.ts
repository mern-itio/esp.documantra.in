export type OrganizationStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'SUSPENDED';
  
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
  isVerified?: boolean;
  isverifcationRequested?: boolean;
  remark?: string;
  createdAt?: string;
  updatedAt?: string;
  verificationStatus?: OrganizationStatus;
}
export interface OrganizationWithOwner {
  organization: Organization;
  isOwner: boolean;
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

export interface Role {
  _id: string;
  organizationId: string;
  name: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
  permissions?: {
    permissions: {
    ENVELOPE_CREATE: boolean;
    ENVELOPE_SHARE: boolean;
    FOLDER_CREATE: boolean;
    FOLDER_SHARE: boolean;
    ORG_SHARE: boolean;
    ORG_SETTINGS_EDIT: boolean;
    }

  };
}

export interface Permission {
  _id: string;
  roleId: string;
  permissions: {
    ENVELOPE_CREATE: boolean;
    ENVELOPE_SHARE: boolean;
    FOLDER_CREATE: boolean;
    FOLDER_SHARE: boolean;
    ORG_SHARE: boolean;
    ORG_SETTINGS_EDIT: boolean;
  };
  createdAt?: string;
  updatedAt?: string;
}
