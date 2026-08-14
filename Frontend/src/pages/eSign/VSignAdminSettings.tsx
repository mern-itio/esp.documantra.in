import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  Upload,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Save,
  Play,
  Key,
} from 'lucide-react';
import {
  fetchVSignAdminConfig,
  saveVSignAdminConfig,
  testVSignAdminConfig,
  uploadVSignCertFile,
  type VSignAdminConfig,
  type VSignTestResult,
} from '../../services/vsignAdminService';
import { getAdminAccessToken } from '../../utils/adminSession';

const PRODUCTION_CALLBACK = 'https://esp.documantra.in/esign/api/e-sign/public/v-sign/response';

const VSignAdminSettings: React.FC = () => {
  const navigate = useNavigate();
  const [config, setConfig] = useState<VSignAdminConfig | null>(null);
  const [form, setForm] = useState<Partial<VSignAdminConfig>>({});
  const [pfxPassword, setPfxPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<VSignTestResult | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    if (!getAdminAccessToken()) {
      navigate('/platform/admin-login', { state: { from: '/e-sign/admin/vsign' }, replace: true });
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await fetchVSignAdminConfig();
      setConfig(data);
      setForm({
        enabled: data.enabled,
        vsignEnv: data.vsignEnv,
        certMode: data.certMode,
        aspId: data.aspId,
        vsignAuthPage: data.vsignAuthPage,
        vsignCallbackUrl: data.vsignCallbackUrl,
        vsignEspResponseUrl: data.vsignEspResponseUrl,
        utilityUrl: data.utilityUrl,
        pfxAlias: data.pfxAlias,
        appearanceMode: data.appearanceMode,
        useJar: data.useJar,
        signatureFontSize: data.signatureFontSize,
      });
    } catch (err: any) {
      if (err.response?.status === 401) {
        navigate('/platform/admin-login', { state: { from: '/e-sign/admin/vsign' }, replace: true });
        return;
      }
      setError(err.response?.data?.message || err.message || 'Failed to load VSign settings');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const payload: Record<string, unknown> = { ...form };
      if (pfxPassword.trim()) payload.pfxPassword = pfxPassword.trim();
      const data = await saveVSignAdminConfig(payload);
      setConfig(data);
      setMessage(data.message || 'Settings saved');
      setPfxPassword('');
      await load();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    setError('');
    try {
      if (pfxPassword.trim()) {
        await saveVSignAdminConfig({ ...form, pfxPassword: pfxPassword.trim() });
      }
      const result = await testVSignAdminConfig();
      setTestResult(result);
    } catch (err: any) {
      setTestResult(err.response?.data || null);
      setError(err.response?.data?.message || err.message || 'Test failed');
    } finally {
      setTesting(false);
    }
  };

  const handleUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    target: 'signingPfx' | 'publicCert' | 'encryptionPfx',
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setMessage('');
    try {
      const data = await uploadVSignCertFile(file, target);
      setConfig(data);
      setMessage(data.message || 'File uploaded');
      await load();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Upload failed');
    }
    e.target.value = '';
  };

  const setProductionPreset = () => {
    setForm((f) => ({
      ...f,
      vsignEnv: 'production',
      vsignAuthPage: 'https://esign.vsign.in/esp',
      vsignCallbackUrl: PRODUCTION_CALLBACK,
      certMode: 'live',
    }));
  };

  const setUatPreset = () => {
    setForm((f) => ({
      ...f,
      vsignEnv: 'uat',
      vsignAuthPage: 'https://esignuat.vsign.in/esp',
      certMode: 'live',
    }));
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center gap-2 text-gray-600">
        <RefreshCw className="w-5 h-5 animate-spin" />
        Loading VSign settings…
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
            <Shield className="w-7 h-7 text-[#155E4B]" />
            VSign / Aadhaar eSign
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Upload live keys, fill required fields, enable — signing starts working.
          </p>
        </div>
        <label className="flex items-center gap-3 cursor-pointer bg-white border rounded-lg px-4 py-2 shadow-sm">
          <span className="text-sm font-medium">Enable VSign</span>
          <input
            type="checkbox"
            className="w-5 h-5 accent-[#155E4B]"
            checked={Boolean(form.enabled)}
            onChange={(e) => setForm((f) => ({ ...f, enabled: e.target.checked }))}
          />
        </label>
      </div>

      {config && (
        <div
          className={`rounded-lg border px-4 py-3 flex items-start gap-3 ${
            config.ready ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'
          }`}
        >
          {config.ready ? (
            <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          )}
          <div className="text-sm">
            <p className="font-medium">{config.ready ? 'Ready to sign' : 'Not ready yet'}</p>
            {config.readinessIssues?.length > 0 && (
              <ul className="mt-1 list-disc list-inside text-gray-700">
                {config.readinessIssues.map((issue) => (
                  <li key={issue}>{issue}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 text-red-800 px-4 py-3 text-sm">
          {error}
        </div>
      )}
      {message && (
        <div className="rounded-lg bg-green-50 border border-green-200 text-green-800 px-4 py-3 text-sm">
          {message}
        </div>
      )}

      <section className="bg-white rounded-xl border shadow-sm p-5 space-y-4">
        <h2 className="font-semibold text-gray-900">Environment</h2>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={setUatPreset} className="text-sm px-3 py-1.5 rounded border hover:bg-gray-50">
            UAT preset
          </button>
          <button type="button" onClick={setProductionPreset} className="text-sm px-3 py-1.5 rounded border hover:bg-gray-50">
            Production preset
          </button>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <label className="block text-sm">
            <span className="text-gray-700">ESP environment</span>
            <select
              className="mt-1 w-full border rounded-lg px-3 py-2"
              value={form.vsignEnv || 'uat'}
              onChange={(e) => setForm((f) => ({ ...f, vsignEnv: e.target.value as 'uat' | 'production' }))}
            >
              <option value="uat">UAT (esignuat.vsign.in)</option>
              <option value="production">Production (esign.vsign.in)</option>
            </select>
          </label>
          <label className="block text-sm">
            <span className="text-gray-700">Certificate mode</span>
            <select
              className="mt-1 w-full border rounded-lg px-3 py-2"
              value={form.certMode || 'live'}
              onChange={(e) => setForm((f) => ({ ...f, certMode: e.target.value as 'live' | 'uat' }))}
            >
              <option value="live">Live (dmsignaturekey.pfx)</option>
              <option value="uat">UAT test cert</option>
            </select>
          </label>
          <label className="block text-sm md:col-span-2">
            <span className="text-gray-700">ASP ID</span>
            <input
              className="mt-1 w-full border rounded-lg px-3 py-2"
              value={form.aspId || ''}
              placeholder="IIPLUAT001 until VSign assigns production ID"
              onChange={(e) => setForm((f) => ({ ...f, aspId: e.target.value }))}
            />
          </label>
          <label className="block text-sm md:col-span-2">
            <span className="text-gray-700">VSign auth page</span>
            <input
              className="mt-1 w-full border rounded-lg px-3 py-2"
              value={form.vsignAuthPage || ''}
              onChange={(e) => setForm((f) => ({ ...f, vsignAuthPage: e.target.value }))}
            />
          </label>
          <label className="block text-sm md:col-span-2">
            <span className="text-gray-700">Callback URL (after OTP)</span>
            <input
              className="mt-1 w-full border rounded-lg px-3 py-2"
              value={form.vsignCallbackUrl || ''}
              onChange={(e) => setForm((f) => ({ ...f, vsignCallbackUrl: e.target.value }))}
            />
          </label>
          <label className="block text-sm md:col-span-2">
            <span className="text-gray-700">ESP Utility URL (JAR on 7077)</span>
            <input
              className="mt-1 w-full border rounded-lg px-3 py-2"
              value={form.utilityUrl || ''}
              onChange={(e) => setForm((f) => ({ ...f, utilityUrl: e.target.value }))}
            />
          </label>
        </div>
      </section>

      <section className="bg-white rounded-xl border shadow-sm p-5 space-y-4">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2">
          <Key className="w-5 h-5" />
          Certificates & keys
        </h2>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="border rounded-lg p-3 space-y-2">
            <p className="text-sm font-medium">Signing PFX</p>
            <p className="text-xs text-gray-500">{config?.pfxPresent ? '✓ Installed' : 'Missing'}</p>
            <label className="inline-flex items-center gap-2 text-sm text-[#155E4B] cursor-pointer">
              <Upload className="w-4 h-4" />
              dmsignaturekey.pfx
              <input type="file" accept=".pfx,.p12" className="hidden" onChange={(e) => handleUpload(e, 'signingPfx')} />
            </label>
          </div>
          <div className="border rounded-lg p-3 space-y-2">
            <p className="text-sm font-medium">Public cert (.cer)</p>
            <p className="text-xs text-gray-500">{config?.publicCertPresent ? '✓ Installed' : 'Missing'}</p>
            <label className="inline-flex items-center gap-2 text-sm text-[#155E4B] cursor-pointer">
              <Upload className="w-4 h-4" />
              ITIO_PUBLIC KEY.cer
              <input type="file" accept=".cer,.crt,.pem" className="hidden" onChange={(e) => handleUpload(e, 'publicCert')} />
            </label>
          </div>
          <div className="border rounded-lg p-3 space-y-2">
            <p className="text-sm font-medium">Encryption PFX</p>
            <p className="text-xs text-gray-500">{config?.dmEncryptionKeyPresent ? '✓ Installed' : 'Optional'}</p>
            <label className="inline-flex items-center gap-2 text-sm text-[#155E4B] cursor-pointer">
              <Upload className="w-4 h-4" />
              dm_encryption_key.pfx
              <input type="file" accept=".pfx,.p12" className="hidden" onChange={(e) => handleUpload(e, 'encryptionPfx')} />
            </label>
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <label className="block text-sm">
            <span className="text-gray-700">PFX password</span>
            <input
              type="password"
              className="mt-1 w-full border rounded-lg px-3 py-2"
              value={pfxPassword}
              placeholder={config?.pfxPasswordSet ? `Set (${config.pfxPasswordMasked})` : 'Required for live PFX'}
              onChange={(e) => setPfxPassword(e.target.value)}
            />
          </label>
          <label className="block text-sm">
            <span className="text-gray-700">PFX alias (GUID)</span>
            <input
              className="mt-1 w-full border rounded-lg px-3 py-2 font-mono text-xs"
              value={form.pfxAlias || ''}
              onChange={(e) => setForm((f) => ({ ...f, pfxAlias: e.target.value }))}
            />
          </label>
        </div>
      </section>

      {testResult && (
        <section className="bg-white rounded-xl border shadow-sm p-5 space-y-2">
          <h2 className="font-semibold">Connection test</h2>
          {testResult.checks?.map((c) => (
            <div key={c.name} className="flex gap-2 text-sm">
              {c.ok ? (
                <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              )}
              <span>
                <strong>{c.name}:</strong> {c.detail}
              </span>
            </div>
          ))}
        </section>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#155E4B] text-white font-medium hover:bg-[#124a3b] disabled:opacity-60"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving…' : 'Save settings'}
        </button>
        <button
          type="button"
          onClick={handleTest}
          disabled={testing}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border font-medium hover:bg-gray-50 disabled:opacity-60"
        >
          <Play className="w-4 h-4" />
          {testing ? 'Testing…' : 'Test connection'}
        </button>
        <button type="button" onClick={load} className="inline-flex items-center gap-2 px-4 py-2.5 text-sm text-gray-600 hover:text-gray-900">
          <RefreshCw className="w-4 h-4" />
          Reload
        </button>
      </div>
    </div>
  );
};

export default VSignAdminSettings;
