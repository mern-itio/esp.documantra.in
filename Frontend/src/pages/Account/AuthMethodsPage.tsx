import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../../services/apiHelper';
import { ArrowLeft, Mail, Phone, ShieldCheck, KeyRound } from 'lucide-react';

type AuthMethod = 'email' | 'sms';

interface TwoFaState {
  enabled: boolean;
  method: AuthMethod;
}

const AuthMethodsPage: React.FC = () => {
  const navigate = useNavigate();

  const [twoFa, setTwoFa] = useState<TwoFaState>({ enabled: false, method: 'email' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>('');
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const resp = await authApi.get('/api/auth/2fa');
        const enabled = !!resp.data?.twoFaEnabled;
        const method: AuthMethod = resp.data?.twoFaMethod === 'sms' ? 'sms' : 'email';
        setTwoFa({ enabled, method });
      } catch (e: any) {
        // If backend is not available, keep defaults but show a soft error
        setError(e?.response?.data?.message || 'Unable to load current authentication settings.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const resp = await authApi.post('/api/auth/2fa', {
        enabled: twoFa.enabled,
        method: twoFa.method
      });
      const enabled = !!resp.data?.twoFaEnabled;
      const method: AuthMethod = resp.data?.twoFaMethod === 'sms' ? 'sms' : 'email';
      setTwoFa({ enabled, method });
      setMessage('Authentication method updated successfully.');
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to update authentication method.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl p-4">

        <div className="grid gap-8 md:grid-cols-[220px,minmax(0,1fr)]">
          {/* Left stepper */}
          {/* <aside className="hidden md:block">
            <nav className="flex items-center gap-4">
  
              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#4D0080] text-[11px] font-semibold text-white shadow-sm">
                  1
                </div>
                <div>
                  <p className="text-[11px] font-semibold tracking-wide text-gray-500 uppercase">
                    Step 1
                  </p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">Select MFA device</p>
                  <p className="text-xs text-gray-500">
                    Choose how you want to verify new sign-ins.
                  </p>
                </div>
              </div>

          
              <div
                className={`h-px flex-1 rounded-full ${activeStep >= 2 ? 'bg-[#4D0080]' : 'bg-gray-200'
                  }`}
              />

          
              <div className={`flex items-start gap-3 ${activeStep === 2 ? '' : 'opacity-60'}`}>
                <div
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold ${activeStep === 2
                    ? 'bg-[#4D0080] text-white shadow-sm'
                    : 'border border-gray-300 text-gray-500 bg-white'
                    }`}
                >
                  2
                </div>
                <div>
                  <p className="text-[11px] font-semibold tracking-wide text-gray-500 uppercase">
                    Step 2
                  </p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">Set up device</p>
                  <p className="text-xs text-gray-500">
                    Follow the guided steps after choosing a method.
                  </p>
                </div>
              </div>
            </nav>
          </aside> */}

          {/* Main content */}
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

                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr),320px]">
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

                      {/* Authenticator app method - UI only for now */}
                      <div className="flex w-full cursor-not-allowed items-center gap-4 rounded-xl border border-dashed border-border bg-muted/40 p-4 opacity-60 md:p-5">
                        <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted">
                          <img src="/images/app.png" alt="Authenticator app" className="h-10 w-10 object-contain" />
                        </div>
                        <div className="flex min-h-[80px] flex-1 flex-col justify-center">
                          <p className="text-sm font-semibold text-foreground">
                            Authenticator app (coming soon)
                          </p>
                          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                            Use apps like Google Authenticator or Authy to generate time-based one-time
                            passcodes. This option will be available in a future update.
                          </p>
                        </div>
                      </div>
                    </div>

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
                  <aside className="hidden lg:block">
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
                            ) : (
                              <Mail className="h-4 w-4 text-foreground" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-foreground">
                              {twoFa.method === 'sms' ? 'Phone OTP (SMS)' : 'Email verification code'}
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
                </div>
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default AuthMethodsPage;

