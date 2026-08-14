import { adminServiceApi, eSignApi } from './apiHelper';
import { getAdminAccessToken } from '../utils/adminSession';

export type VSignAdminConfig = {
  enabled: boolean;
  vsignEnv: 'uat' | 'production';
  certMode: 'live' | 'uat';
  aspId: string;
  vsignAuthPage: string;
  vsignCallbackUrl: string;
  vsignEspResponseUrl: string;
  utilityUrl: string;
  pfxPath: string;
  pfxPasswordSet: boolean;
  pfxPasswordMasked: string;
  pfxAlias: string;
  publicCertPath: string;
  publicCertPresent: boolean;
  dmEncryptionKeyPath: string;
  dmEncryptionKeyPresent: boolean;
  dmEncryptionKeyPasswordSet: boolean;
  appearanceMode: string;
  useJar: boolean;
  signatureFontSize: string;
  ready: boolean;
  readinessIssues: string[];
  pfxPresent: boolean;
  updatedAt?: string;
  message?: string;
};

export type VSignTestResult = {
  ok: boolean;
  ready: boolean;
  enabled: boolean;
  checks: Array<{ name: string; ok: boolean; detail: string }>;
};

export async function fetchVSignAdminConfig(): Promise<VSignAdminConfig> {
  const res = await adminServiceApi.get('/admin/vsign-config');
  return res.data;
}

export async function saveVSignAdminConfig(
  payload: Partial<VSignAdminConfig> & {
    pfxPassword?: string;
    dmEncryptionKeyPassword?: string;
    clearPfxPassword?: boolean;
  },
): Promise<VSignAdminConfig> {
  const res = await adminServiceApi.put('/admin/vsign-config', payload);
  return res.data;
}

export async function testVSignAdminConfig(): Promise<VSignTestResult> {
  const res = await adminServiceApi.post('/admin/vsign-config/test', {});
  return res.data;
}

export async function uploadVSignCertFile(
  file: File,
  uploadTarget: 'signingPfx' | 'publicCert' | 'encryptionPfx',
): Promise<VSignAdminConfig> {
  const form = new FormData();
  form.append('file', file);
  form.append('uploadTarget', uploadTarget);
  const token = getAdminAccessToken();
  const res = await eSignApi.post('/admin/vsign-config/upload', form, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  return res.data;
}

export type VSignPublicStatus = {
  enabled: boolean;
  ready: boolean;
  certMode: string;
  vsignEnv: string;
  aspIdConfigured: boolean;
};

export async function fetchVSignPublicStatus(): Promise<VSignPublicStatus> {
  const base = import.meta.env.VITE_ESIGN_SERVICE_URL || 'http://127.0.0.1:2103';
  const res = await fetch(`${base.replace(/\/+$/, '')}/api/e-sign/public/vsign-status`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to load VSign status');
  return res.json();
}
