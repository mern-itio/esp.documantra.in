export interface SetPermissionsRequest {
  allowPrint: boolean;
  allowCopy: boolean;
  allowModify: boolean;
  allowAnnotate: boolean;
  allowFillForms: boolean;
  allowExtractContent: boolean;
  allowAssemble: boolean;
  allowHighQualityPrint: boolean;
  password?: string;
  ownerPassword?: string;
}

export interface SetPermissionsResponse {
  success: boolean;
  message: string;
  filename: string;
  secureViewLink: string; // Changed from downloadUrl to secureViewLink
  fileSize: string;
  permissions: {
    allowPrint: boolean;
    allowCopy: boolean;
    allowModify: boolean;
    allowAnnotate: boolean;
    allowFillForms: boolean;
    allowExtractContent: boolean;
    allowAssemble: boolean;
    allowHighQualityPrint: boolean;
    isPasswordProtected: boolean;
    isOwnerProtected: boolean;
  };
}

export interface CurrentPermissionsResponse {
  success: boolean;
  message: string;
  permissions: {
    isEncrypted: boolean;
    isPasswordProtected: boolean;
    isOwnerProtected: boolean;
    encryptionLevel: string;
    permissions: {
      allowPrint: boolean;
      allowCopy: boolean;
      allowModify: boolean;
      allowAnnotate: boolean;
      allowFillForms: boolean;
      allowExtractContent: boolean;
      allowAssemble: boolean;
      allowHighQualityPrint: boolean;
    };
  };
}
