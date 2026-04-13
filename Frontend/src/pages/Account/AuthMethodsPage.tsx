import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../../services/apiHelper';
import { ArrowLeft, Mail, Phone, ShieldCheck, KeyRound, Smartphone, Loader2, Copy, CheckCircle2, QrCode } from 'lucide-react';

type AuthMethod = 'email' | 'sms' | 'authenticator';

interface TwoFaState {
  enabled: boolean;
  method: AuthMethod;
  authenticatorConfigured: boolean;
}

interface AuthenticatorSetupState {
  open: boolean;
  loading: boolean;
  qrCodeUrl: string;
  manualEntryKey: string;
  verifyCode: string;
  verifying: boolean;
  copied: boolean;
}

const AuthMethodsPage: React.FC = () => {
  const navigate = useNavigate();

  const [twoFa, setTwoFa] = useState<TwoFaState>({ enabled: false, method: 'email', authenticatorConfigured: false });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [authenticatorSetup, setAuthenticatorSetup] = useState<AuthenticatorSetupState>({
    open: false,
    loading: false,
    qrCodeUrl: '',
    manualEntryKey: '',
    verifyCode: '',
    verifying: false,
    copied: false
  });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const resp = await authApi.get('/api/auth/2fa');
        const enabled = !!resp.data?.twoFaEnabled;
        const method: AuthMethod = resp.data?.twoFaMethod === 'sms'
          ? 'sms'
          : (resp.data?.twoFaMethod === 'authenticator' ? 'authenticator' : 'email');
        const authenticatorConfigured = !!resp.data?.authenticatorConfigured || method === 'authenticator';
        setTwoFa({ enabled, method, authenticatorConfigured });
      } catch (e: unknown) {
        // If backend is not available, keep defaults but show a soft error
        const apiError = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
        setError(apiError || 'Unable to load current authentication settings.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSave = async () => {
    if (twoFa.method === 'authenticator' && !twoFa.authenticatorConfigured) {
      setError('Set up and verify the authenticator app first, then save.');
      setMessage('');
      return;
    }

    setSaving(true);
    setError('');
    setMessage('');
    try {
      const resp = await authApi.post('/api/auth/2fa', {
        enabled: twoFa.enabled,
        method: twoFa.method
      });
      const enabled = !!resp.data?.twoFaEnabled;
      const method: AuthMethod = resp.data?.twoFaMethod === 'sms'
        ? 'sms'
        : (resp.data?.twoFaMethod === 'authenticator' ? 'authenticator' : 'email');
      setTwoFa((prev) => ({ ...prev, enabled, method }));
      setMessage('Authentication method updated successfully.');
    } catch (e: unknown) {
      const apiError = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(apiError || 'Failed to update authentication method.');
    } finally {
      setSaving(false);
    }
  };

  const startAuthenticatorSetup = async () => {
    setError('');
    setMessage('');
    setAuthenticatorSetup((prev) => ({
      ...prev,
      open: true,
      loading: true,
      copied: false,
      verifyCode: ''
    }));

    try {
      const resp = await authApi.get('/api/auth/2fa/authenticator/setup');
      setTwoFa((prev) => ({ ...prev, method: 'authenticator' }));
      setAuthenticatorSetup((prev) => ({
        ...prev,
        loading: false,
        qrCodeUrl: resp.data?.qrCodeUrl || '',
        manualEntryKey: resp.data?.manualEntryKey || '',
      }));
    } catch (e: unknown) {
      setAuthenticatorSetup((prev) => ({ ...prev, loading: false }));
      const apiError = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(apiError || 'Unable to start authenticator setup right now.');
    }
  };

  const copySetupKey = async () => {
    if (!authenticatorSetup.manualEntryKey) return;
    try {
      await navigator.clipboard.writeText(authenticatorSetup.manualEntryKey);
      setAuthenticatorSetup((prev) => ({ ...prev, copied: true }));
      window.setTimeout(() => setAuthenticatorSetup((prev) => ({ ...prev, copied: false })), 1400);
    } catch {
      setError('Copy failed. Please select and copy the setup key manually.');
    }
  };

  const verifyAuthenticatorSetup = async () => {
    if (!authenticatorSetup.verifyCode.trim()) {
      setError('Enter the 6-digit code shown in your authenticator app.');
      return;
    }
    setError('');
    setMessage('');
    setAuthenticatorSetup((prev) => ({ ...prev, verifying: true }));
    try {
      const resp = await authApi.post('/api/auth/2fa/authenticator/verify-setup', {
        code: authenticatorSetup.verifyCode
      });
      setTwoFa((prev) => ({
        ...prev,
        method: 'authenticator',
        enabled: !!resp.data?.twoFaEnabled,
        authenticatorConfigured: true
      }));
      setAuthenticatorSetup((prev) => ({ ...prev, verifying: false, verifyCode: '' }));
      setMessage('Authenticator app is now active. Your account will ask for app codes on untrusted devices.');
    } catch (e: unknown) {
      setAuthenticatorSetup((prev) => ({ ...prev, verifying: false }));
      const apiError = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(apiError || 'Could not verify your code. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className='p-2'>

        <div className="grid gap-8 md:grid-cols-[220px,minmax(0,1fr)]">
         
          <section>
            <div className="mb-6 flex justify-between">

              <div className='flex gap-3'>
                <button
                  type="button"
                  onClick={() => navigate('/account/profile')}
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-foreground hover:bg-muted"
                  aria-label="Back to profile"
                >
                  <ArrowLeft className="h-4 w-4" />

                </button>
                <div>
                  <h1 className="text-2xl font-semibold text-foreground">Select Verification Method</h1>
                  <p className="mt-1 text-xs text-muted-foreground">
                    In addition to your password, protect your account with an extra verification step.
                    Choose how you want to receive your sign-in codes.
                  </p>
                </div>

               
              </div>
              <span
                className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${twoFa.enabled
                  ? 'border-success/30 bg-success/10 text-success'
                  : 'border-border bg-muted/50 text-muted-foreground'
                  }`}
              >
                <span
                  className={`mr-1.5 h-1.5 w-1.5 rounded-full ${twoFa.enabled ? 'bg-success' : 'bg-muted-foreground'
                    }`}
                />
                {twoFa.enabled ? 'MFA enabled' : 'MFA not enabled'}
              </span>
            </div>

            {loading && (
              <p className="text-sm text-muted-foreground">Loading your current authentication settings…</p>
            )}

            {!loading && (
              <>
                {(error || message) && (
                  <div
                    className={`mb-4 rounded-md border px-3 py-2 text-sm ${error
                      ? 'border-destructive/30 bg-destructive/10 text-destructive'
                      : 'border-success/30 bg-success/10 text-success'
                      }`}
                  >
                    {error || message}
                  </div>
                )}

                <div className="mx-auto max-w-4xl grid gap-6 lg:grid-cols-[minmax(0,1fr),320px]">
                  {/* Left column: choices */}
                  <div>
                    <div className="mb-4 flex items-center justify-between gap-4 rounded-xl border border-border bg-card px-4 py-3">
                      <span className="text-sm font-medium text-foreground">
                        Enable multi-factor authentication for my account
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          setTwoFa((prev) => ({ ...prev, enabled: !prev.enabled }))
                        }
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${twoFa.enabled ? "bg-primary" : "bg-muted"
                          }`}
                        aria-label="Toggle multi-factor authentication"
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-background shadow-sm transition ${twoFa.enabled ? "translate-x-6" : "translate-x-1"
                            }`}
                        />
                      </button>
                    </div>

                    <div className="space-y-3">
                      {/* Email method */}
                      <button
                        type="button"
                        onClick={() => setTwoFa((prev) => ({ ...prev, method: 'email' }))}
                        className={`group flex w-full items-center gap-4 rounded-xl border p-4 text-left transition hover:shadow-sm md:p-5 ${twoFa.method === 'email'
                          ? 'border-primary bg-primary/5 ring-1 ring-primary/35'
                          : 'border-border bg-card hover:border-primary/50'
                          }`}
                      >
                        <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-primary/10">
                          <img src="/images/authentication.png" alt="Email verification" className="h-10 w-10 object-contain" />
                        </div>
                        <div className="flex min-h-[80px] flex-1 flex-col justify-center">
                          <p className="text-sm font-semibold text-foreground">Email verification code</p>
                          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                            Receive a one-time verification code at your registered email address when you sign
                            in on a new browser or device.
                          </p>
                        </div>
                      </button>

                      {/* Phone method */}
                      <button
                        type="button"
                        onClick={() => setTwoFa((prev) => ({ ...prev, method: 'sms' }))}
                        className={`group flex w-full items-center gap-4 rounded-xl border p-4 text-left transition hover:shadow-sm md:p-5 ${twoFa.method === 'sms'
                          ? 'border-primary bg-primary/5 ring-1 ring-primary/35'
                          : 'border-border bg-card hover:border-primary/50'
                          }`}
                      >
                        <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-accent/80">
                          <img src="/images/mobile-banking.png" alt="Phone OTP" className="h-10 w-10 object-contain" />
                        </div>
                        <div className="flex min-h-[80px] flex-1 flex-col justify-center">
                          <p className="text-sm font-semibold text-foreground">Phone OTP (SMS)</p>
                          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                            Get a verification code via SMS on your registered mobile number when you sign
                            in.
                          </p>
                        </div>
                      </button>

                      {/* Authenticator app method */}
                      <button
                        type="button"
                        onClick={() => {
                          setTwoFa((prev) => ({ ...prev, method: 'authenticator' }));
                          if (!authenticatorSetup.open) {
                            startAuthenticatorSetup();
                          }
                        }}
                        className={`group flex w-full items-center gap-4 rounded-xl border p-4 text-left transition hover:shadow-sm md:p-5 ${twoFa.method === 'authenticator'
                          ? 'border-primary bg-primary/5 ring-1 ring-primary/35'
                          : 'border-border bg-card hover:border-primary/50'
                          }`}
                      >
                        <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted">
                          <img src="/images/app.png" alt="Authenticator app" className="h-10 w-10 object-contain" />
                        </div>
                        <div className="flex min-h-[80px] flex-1 flex-col justify-center">
                          <p className="text-sm font-semibold text-foreground">
                            Authenticator app (recommended)
                          </p>
                          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                            Use Google Authenticator, Microsoft Authenticator, or Authy to generate secure
                            time-based codes without relying on email or SMS delivery.
                          </p>
                        </div>
                        <div className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground">
                          {twoFa.authenticatorConfigured ? 'Configured' : 'Set up now'}
                        </div>
                      </button>
                    </div>

                    {twoFa.method === 'authenticator' && (
                      <div className="mt-4 rounded-xl border border-border bg-card p-4 md:p-5">
                        <p className="text-sm font-semibold text-foreground">Authenticator setup guide (step-by-step)</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Follow each step exactly once. If anything fails, click "Generate new QR code" and repeat.
                        </p>

                        <ol className="mt-4 space-y-3 text-xs text-muted-foreground">
                          <li className="rounded-lg bg-muted/40 p-3">
                            <span className="font-semibold text-foreground">Step 1:</span> Install an authenticator app on your phone.
                            Search app store for: Google Authenticator, Microsoft Authenticator, or Authy.
                          </li>
                          <li className="rounded-lg bg-muted/40 p-3">
                            <span className="font-semibold text-foreground">Step 2:</span> In the app, choose "Add account" and scan the QR code below.
                            If your camera has issues, use the setup key manually.
                          </li>
                          <li className="rounded-lg bg-muted/40 p-3">
                            <span className="font-semibold text-foreground">Step 3:</span> Enter the 6-digit code shown in your app and click Verify.
                            The code refreshes every 30 seconds.
                          </li>
                        </ol>

                        <div className="mt-4 flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={startAuthenticatorSetup}
                            className="rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground hover:bg-muted"
                          >
                            Generate new QR code
                          </button>
                          {twoFa.authenticatorConfigured && (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-2.5 py-1 text-[11px] font-medium text-success">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Authenticator is configured
                            </span>
                          )}
                        </div>

                        <div className="mt-4 rounded-lg border border-border bg-muted/20 p-4">
                          {authenticatorSetup.loading ? (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Preparing your secure QR code...
                            </div>
                          ) : (
                            <div className="grid gap-4 md:grid-cols-[220px,minmax(0,1fr)]">
                              <div className="flex items-center justify-center rounded-lg border border-border bg-background p-3">
                                {authenticatorSetup.qrCodeUrl ? (
                                  <img src={authenticatorSetup.qrCodeUrl} alt="Authenticator QR code" className="h-48 w-48 rounded-md" />
                                ) : (
                                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                    <QrCode className="h-8 w-8" />
                                    <span className="text-xs">QR code appears here</span>
                                  </div>
                                )}
                              </div>

                              <div>
                                <p className="text-xs font-semibold text-foreground">Manual setup key</p>
                                <div className="mt-2 flex items-center gap-2 rounded-lg border border-border bg-background p-2">
                                  <code className="flex-1 truncate text-[11px] text-foreground">{authenticatorSetup.manualEntryKey || 'Generate setup key first'}</code>
                                  <button
                                    type="button"
                                    onClick={copySetupKey}
                                    disabled={!authenticatorSetup.manualEntryKey}
                                    className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] font-medium text-foreground hover:bg-muted disabled:opacity-50"
                                  >
                                    {authenticatorSetup.copied ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                                    {authenticatorSetup.copied ? 'Copied' : 'Copy'}
                                  </button>
                                </div>

                                <p className="mt-4 text-xs font-semibold text-foreground">Verify with current 6-digit code</p>
                                <div className="mt-2 flex flex-wrap items-center gap-2">
                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={6}
                                    value={authenticatorSetup.verifyCode}
                                    onChange={(e) =>
                                      setAuthenticatorSetup((prev) => ({
                                        ...prev,
                                        verifyCode: e.target.value.replace(/\D/g, '').slice(0, 6)
                                      }))
                                    }
                                    className="h-10 w-40 rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                                    placeholder="123456"
                                  />
                                  <button
                                    type="button"
                                    onClick={verifyAuthenticatorSetup}
                                    disabled={authenticatorSetup.verifying || authenticatorSetup.verifyCode.length !== 6}
                                    className="inline-flex h-10 items-center rounded-lg bg-primary px-4 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                                  >
                                    {authenticatorSetup.verifying ? 'Verifying...' : 'Verify & Enable'}
                                  </button>
                                </div>
                                <p className="mt-2 text-[11px] text-muted-foreground">
                                  Save this setup key in a safe place before continuing. If you lose your phone, this helps you re-add your account.
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <p className="mt-4 text-[11px] text-muted-foreground">
                      If you lose access to your email or phone, contact support so we can help you securely
                      recover your account.
                    </p>

                    <div className="mt-6 flex flex-col justify-end gap-3 sm:flex-row">
                      <button
                        type="button"
                        onClick={() => navigate('/account/profile')}
                        className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleSave}
                        disabled={saving}
                        className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                      >
                        {saving ? 'Saving…' : 'Save authentication method'}
                      </button>
                    </div>
                  </div>

                  {/* Right column: fill whitespace with useful panel */}
                 
                </div>
                <aside className="hidden lg:block mt-2 ">
                    <div className="sticky top-6 rounded-2xl border border-border bg-gradient-to-b from-card to-primary/5 p-5 shadow-sm dark:to-primary/10">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Security tips
                          </p>
                          <p className="mt-1 text-sm font-semibold text-foreground">
                            Make your account harder to compromise
                          </p>
                        </div>
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                          <ShieldCheck className="h-5 w-5" />
                        </div>
                      </div>

                      <ul className="mt-4 space-y-3 text-xs text-muted-foreground">
                        <li className="flex gap-2">
                          <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                          Use MFA to protect logins on new browsers/devices.
                        </li>
                        <li className="flex gap-2">
                          <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                          Keep your email/phone up to date in your profile.
                        </li>
                        <li className="flex gap-2">
                          <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                          Prefer a method you can access reliably while traveling.
                        </li>
                      </ul>

                      <div className="mt-5 rounded-xl border border-border bg-muted/30 p-4">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                          Selected method
                        </p>
                        <div className="mt-2 flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background">
                            {twoFa.method === 'sms' ? (
                              <Phone className="h-4 w-4 text-foreground" />
                            ) : twoFa.method === 'authenticator' ? (
                              <Smartphone className="h-4 w-4 text-foreground" />
                            ) : (
                              <Mail className="h-4 w-4 text-foreground" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-foreground">
                              {twoFa.method === 'sms'
                                ? 'Phone OTP (SMS)'
                                : (twoFa.method === 'authenticator' ? 'Authenticator app' : 'Email verification code')}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {twoFa.enabled ? 'Enabled for your account' : 'Not enabled yet'}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 flex items-center gap-2 text-[11px] text-muted-foreground">
                          <KeyRound className="h-3.5 w-3.5 shrink-0" />
                          Changes apply on next sign-in.
                        </div>
                      </div>
                    </div>
                  </aside>
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default AuthMethodsPage;

