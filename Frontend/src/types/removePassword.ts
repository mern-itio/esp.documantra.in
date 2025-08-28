export interface RemovePasswordRequest {
  file: File;
  password: string;
}

export interface RemovePasswordResponse {
  success: boolean;
  message: string;
  filename: string;
  downloadUrl: string;
  totalPages: number;
  protectionInfo: {
    wasProtected: boolean;
    isNowUnprotected: boolean;
    tool: string;
  };
}

export interface PasswordProtectionCheck {
  isProtected: boolean;
  encryptionType?: string;
  permissions?: string;
  message: string;
}

export interface PasswordStrength {
  valid: boolean;
  message: string;
  score: number; // 0-4: very weak, weak, medium, strong, very strong
}
