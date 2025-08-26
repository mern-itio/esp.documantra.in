export interface AddPasswordRequest {
  file: File;
  ownerPassword?: string;
  userPassword?: string;
  permissions?: 'all' | 'print' | 'copy' | 'modify' | 'annotate';
  encryptionLevel?: 'AES-256' | 'AES-128';
}

export interface PasswordResponse {
  success: boolean;
  message: string;
  filename: string;
  downloadUrl: string;
  totalPages: number;
  protectionInfo: {
    hasOwnerPassword: boolean;
    hasUserPassword: boolean;
    permissions: string;
    encryptionLevel: string;
  };
}

export interface PasswordStrength {
  valid: boolean;
  message: string;
  score: number; // 0-4: very weak, weak, medium, strong, very strong
}

export interface PermissionOption {
  value: string;
  label: string;
  description: string;
  icon: string;
}

export interface EncryptionOption {
  value: string;
  label: string;
  description: string;
  security: string;
}
