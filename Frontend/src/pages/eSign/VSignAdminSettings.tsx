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
  ArrowLeftRight,
} from 'lucide-react';
import {
  fetchVSignAdminConfig,
  fetchVSignProfileStatus,
  saveVSignAdminConfig,
  switchVSignProfile,
  testVSignAdminConfig,
  uploadVSignCertFile,
  type VSignAdminConfig,
  type VSignProfileStatus,
  type VSignSwitchResult,
  type VSignTestResult,
} from '../../services/vsignAdminService';
import { getAdminAccessToken } from '../../utils/adminSession';

const DOCUMANTRA_LOGO_URL = 'https://tgkqdagmnbgmrtjpymbz.supabase.co/storage/v1/object/public/branding/logo.png?v=2026-08-07T04%3A55%3A35.520Z';

const profileLabel = (p: string | null | undefined) => {
  if (p === 'live') return 'Live / Production (IIPL001)';
  if (p === 'uat') return 'UAT (IIPLUAT001)';
  return 'Not set — switch below';
};

const VSignAdminSettings: React.FC = () => {
  const navigate = useNavigate();
  const [config, setConfig] = useState<VSignAdminConfig | null>(null);
  const [profileStatus, setProfileStatus] = useState<VSignProfileStatus | null>(null);
  const [form, setForm] = useState<Partial<VSignAdminConfig>>({});
  const [tunnelUrl, setTunnelUrl] = useState('');
  const [pfxPassword, setPfxPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [switching, setSwitching] = useState<'uat' | 'live' | null>(null);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<VSignTestResult | null>(null);
  const [switchResult, setSwitchResult] = useState<VSignSwitchResult | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const applyConfigToForm = (data: VSignAdminConfig) => {
    setConfig(data);
    setForm({
      enabled: data.enabled,
      vsignEnv: data.vsignEnv,
      certMode: data.certMode,
      aspId: data.aspId,
      vsignAuthPage: data.vsignAuthPage,
      vsignAuthLogoUrl: data.vsignAuthLogoUrl,
      vsignCallbackUrl: data.vsignCallbackUrl,
      vsignEspResponseUrl: data.vsignEspResponseUrl,
      utilityUrl: data.utilityUrl,
      pfxAlias: data.pfxAlias,
      appearanceMode: data.appearanceMode,
      useJar: data.useJar,
      signatureFontSize: data.signatureFontSize,
    });
    if (data.tunnelUrl) setTunnelUrl(data.tunnelUrl);
  };

  const load = useCallback(async () => {
    if (!getAdminAccessToken()) {
      navigate('/platform/admin-login', { state: { from: '/e-sign/admin/vsign' }, replace: true });
      return;
    }
    setLoading(true);
    setError('');
    try {
      const [data, status] = await Promise.all([
        fetchVSignAdminConfig(),
        fetchVSignProfileStatus(),
      ]);
      applyConfigToForm(data);
      setProfileStatus(status);
      if (status.tunnelUrl) setTunnelUrl(status.tunnelUrl);
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

  const activeProfile = profileStatus?.activeProfile || config?.activeProfile || null;
  const isUatActive = activeProfile === 'uat';

  const handleSwitch = async (profile: 'uat' | 'live') => {
    setSwitching(profile);
    setError('');
    setMessage('');
    setSwitchResult(null);
    try {
      const result = await switchVSignProfile({
        profile,
        tunnelUrl: tunnelUrl.trim() || undefined,
      });
      setSwitchResult(result);
      setMessage(result.message);
      applyConfigToForm(result.config);
      setProfileStatus((prev) =>
        prev
          ? { ...prev, activeProfile: result.switchedTo, config: result.config }
          : { activeProfile: result.switchedTo, tunnelUrl: tunnelUrl.trim() || null, profiles: [] },
      );
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Switch failed');
    } finally {
      setSwitching(null);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const payload: Record<string, unknown> = { ...form };
      if (pfxPassword.trim()) payload.pfxPassword = pfxPassword.trim();
      const data = await saveVSignAdminConfig(payload);
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
      const uploadProfile = activeProfile === 'uat' || activeProfile === 'live' ? activeProfile : undefined;
      const data = await uploadVSignCertFile(file, target, uploadProfile);
      setMessage(data.message || 'File uploaded');
      await load();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Upload failed');
    }
    e.target.value = '';
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
            Turn <strong>Aadhaar eSign</strong> off for live draw-and-finish signing. UAT/Live profile
            switch keeps certificates; it does not force Aadhaar back on.
          </p>
        </div>
        <label className="flex items-center gap-3 cursor-pointer bg-white border rounded-lg px-4 py-2 shadow-sm">
          <div className="text-right">
            <span className="block text-sm font-medium">Aadhaar eSign (VSign)</span>
            <span className="block text-[11px] text-gray-500">
              {form.enabled ? 'On — OTP after draw' : 'Off — draw & finish only'}
            </span>
          </div>
          <input
            type="checkbox"
            className="w-5 h-5 accent-[#155E4B]"
            checked={Boolean(form.enabled)}
            disabled={saving}
            onChange={async (e) => {
              const next = e.target.checked;
              setForm((f) => ({ ...f, enabled: next }));
              setSaving(true);
              setError('');
              setMessage('');
              try {
                const payload: Record<string, unknown> = { ...form, enabled: next };
                if (pfxPassword.trim()) payload.pfxPassword = pfxPassword.trim();
                const data = await saveVSignAdminConfig(payload);
                setMessage(
                  next
                    ? data.message || 'Aadhaar eSign enabled'
                    : 'Aadhaar eSign disabled — signers use draw & finish only',
                );
                setPfxPassword('');
                await load();
              } catch (err: any) {
                setForm((f) => ({ ...f, enabled: !next }));
                setError(err.response?.data?.message || err.message || 'Failed to update Aadhaar toggle');
              } finally {
                setSaving(false);
              }
            }}
          />
        </label>
      </div>

      <section className="bg-white rounded-xl border-2 border-[#155E4B]/20 shadow-sm p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <ArrowLeftRight className="w-5 h-5 text-[#155E4B]" />
              Active profile
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Current: <strong>{profileLabel(activeProfile)}</strong>
              {config?.aspId ? ` · ASP ${config.aspId}` : ''}
            </p>
          </div>
          <span
            className={`text-xs font-semibold px-3 py-1 rounded-full ${
              activeProfile === 'live'
                ? 'bg-blue-100 text-blue-800'
                : activeProfile === 'uat'
                  ? 'bg-amber-100 text-amber-900'
                  : 'bg-gray-100 text-gray-600'
            }`}
          >
            {activeProfile?.toUpperCase() || 'NONE'}
          </span>
        </div>

        <label className="block text-sm">
          <span className="text-gray-700">Local tunnel URL (optional — for UAT callback during dev)</span>
          <input
            className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
            placeholder="https://your-subdomain.trycloudflare.com"
            value={tunnelUrl}
            onChange={(e) => setTunnelUrl(e.target.value)}
          />
        </label>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            disabled={switching !== null}
            onClick={() => handleSwitch('uat')}
            className={`px-4 py-2 rounded-lg font-medium border-2 transition ${
              isUatActive
                ? 'border-amber-500 bg-amber-50 text-amber-900'
                : 'border-gray-200 hover:border-amber-400 hover:bg-amber-50'
            } disabled:opacity-60`}
          >
            {switching === 'uat' ? 'Switching…' : 'Switch to UAT'}
          </button>
          <button
            type="button"
            disabled={switching !== null}
            onClick={() => handleSwitch('live')}
            className={`px-4 py-2 rounded-lg font-medium border-2 transition ${
              activeProfile === 'live'
                ? 'border-blue-600 bg-blue-50 text-blue-900'
                : 'border-gray-200 hover:border-blue-400 hover:bg-blue-50'
            } disabled:opacity-60`}
          >
            {switching === 'live' ? 'Switching…' : 'Switch to Live'}
          </button>
        </div>

        {profileStatus?.profiles?.length ? (
          <div className="grid md:grid-cols-2 gap-3 text-xs">
            {profileStatus.profiles.map((p) => (
              <div key={p.name} className="rounded-lg border p-3 bg-gray-50">
                <p className="font-medium">{p.label}</p>
                <p className="text-gray-600 mt-1">ASP: {p.aspId}</p>
                <p className={p.pfxPresent ? 'text-green-700' : 'text-amber-700'}>
                  PFX: {p.pfxPresent ? 'present' : 'missing'} ({p.pfxPath})
                </p>
              </div>
            ))}
          </div>
        ) : null}

        {switchResult?.nextSteps?.length ? (
          <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-950">
            <p className="font-medium">After switch:</p>
            <ul className="mt-1 list-disc list-inside">
              {switchResult.nextSteps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

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
        <h2 className="font-semibold text-gray-900">Environment details</h2>
        <p className="text-xs text-gray-500">
          Use Switch above for full profile change. Edit below only for fine-tuning after switch.
        </p>
        <div className="grid md:grid-cols-2 gap-4">
          <label className="block text-sm md:col-span-2">
            <span className="text-gray-700">ASP ID</span>
            <input
              className="mt-1 w-full border rounded-lg px-3 py-2"
              value={form.aspId || ''}
              onChange={(e) => setForm((f) => ({ ...f, aspId: e.target.value }))}
            />
          </label>
          <label className="block text-sm md:col-span-2">
            <span className="text-gray-700">VSign auth page (ESP base URL)</span>
            <input
              className="mt-1 w-full border rounded-lg px-3 py-2"
              value={form.vsignAuthPage || ''}
              onChange={(e) => setForm((f) => ({ ...f, vsignAuthPage: e.target.value }))}
            />
          </label>
          {isUatActive ? (
            <p className="text-xs text-gray-500 md:col-span-2">
              Auth page logo is disabled on UAT. Switch to Live to configure the production VSign auth page logo.
            </p>
          ) : (
            <label className="block text-sm md:col-span-2">
              <span className="text-gray-700">Auth page logo URL (live production only)</span>
              <input
                className="mt-1 w-full border rounded-lg px-3 py-2"
                value={form.vsignAuthLogoUrl || ''}
                placeholder={DOCUMANTRA_LOGO_URL}
                onChange={(e) => setForm((f) => ({ ...f, vsignAuthLogoUrl: e.target.value }))}
              />
              <span className="text-xs text-gray-500 mt-1 block">
                Encoded into esign.verasys.in/esp/&lt;base64&gt;/authpagev4
              </span>
            </label>
          )}
          <label className="block text-sm md:col-span-2">
            <span className="text-gray-700">Callback URL (after OTP)</span>
            <input
              className="mt-1 w-full border rounded-lg px-3 py-2"
              value={form.vsignCallbackUrl || ''}
              onChange={(e) => setForm((f) => ({ ...f, vsignCallbackUrl: e.target.value }))}
            />
          </label>
          <label className="block text-sm md:col-span-2">
            <span className="text-gray-700">ESP response URL</span>
            <input
              className="mt-1 w-full border rounded-lg px-3 py-2 font-mono text-xs"
              value={form.vsignEspResponseUrl || ''}
              onChange={(e) => setForm((f) => ({ ...f, vsignEspResponseUrl: e.target.value }))}
            />
          </label>
          <label className="block text-sm md:col-span-2">
            <span className="text-gray-700">ESP Utility URL (JAR on 7078)</span>
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
          Certificates ({isUatActive ? 'UAT files' : 'Live files'})
        </h2>
        <p className="text-xs text-gray-500">
          {isUatActive
            ? 'Uploads go to signCertificate.uat.pfx / ITIO_PUBLIC_KEY.uat.cer'
            : 'Uploads go to signCertificate.pfx / ITIO_PUBLIC_KEY.cer (production)'}
        </p>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="border rounded-lg p-3 space-y-2">
            <p className="text-sm font-medium">Signing PFX</p>
            <p className="text-xs text-gray-500">{config?.pfxPresent ? '✓ Installed' : 'Missing'}</p>
            <p className="text-xs font-mono text-gray-400 truncate">{config?.pfxPath}</p>
            <label className="inline-flex items-center gap-2 text-sm text-[#155E4B] cursor-pointer">
              <Upload className="w-4 h-4" />
              Upload PFX
              <input type="file" accept=".pfx,.p12" className="hidden" onChange={(e) => handleUpload(e, 'signingPfx')} />
            </label>
          </div>
          <div className="border rounded-lg p-3 space-y-2">
            <p className="text-sm font-medium">Public cert (.cer)</p>
            <p className="text-xs text-gray-500">{config?.publicCertPresent ? '✓ Installed' : 'Missing'}</p>
            <label className="inline-flex items-center gap-2 text-sm text-[#155E4B] cursor-pointer">
              <Upload className="w-4 h-4" />
              Upload .cer
              <input type="file" accept=".cer,.crt,.pem" className="hidden" onChange={(e) => handleUpload(e, 'publicCert')} />
            </label>
          </div>
          <div className="border rounded-lg p-3 space-y-2">
            <p className="text-sm font-medium">Encryption PFX</p>
            <p className="text-xs text-gray-500">{config?.dmEncryptionKeyPresent ? '✓ Installed' : 'Optional'}</p>
            <label className="inline-flex items-center gap-2 text-sm text-[#155E4B] cursor-pointer">
              <Upload className="w-4 h-4" />
              Upload encryption PFX
              <input type="file" accept=".pfx,.p12" className="hidden" onChange={(e) => handleUpload(e, 'encryptionPfx')} />
            </label>
          </div>
        </div>
        {!isUatActive && (
          <div className="grid md:grid-cols-2 gap-4">
            <label className="block text-sm">
              <span className="text-gray-700">Live PFX password</span>
              <input
                type="password"
                className="mt-1 w-full border rounded-lg px-3 py-2"
                value={pfxPassword}
                placeholder={config?.pfxPasswordSet ? `Set (${config.pfxPasswordMasked})` : 'Required for live PFX'}
                onChange={(e) => setPfxPassword(e.target.value)}
              />
            </label>
            <label className="block text-sm">
              <span className="text-gray-700">PFX alias</span>
              <input
                className="mt-1 w-full border rounded-lg px-3 py-2 font-mono text-xs"
                value={form.pfxAlias || ''}
                onChange={(e) => setForm((f) => ({ ...f, pfxAlias: e.target.value }))}
              />
            </label>
          </div>
        )}
        {isUatActive && (
          <p className="text-xs text-gray-500">UAT uses kit defaults: password abc1234 (managed automatically on switch).</p>
        )}
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
