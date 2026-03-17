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
    <div className="min-h-screen bg-white">
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
                  onClick={() => navigate('/account/profile')}
                  className=""
                >
                  <ArrowLeft className="w-4 h-4" />

                </button>
                <div>
                  <h1 className="!text-2xl text-heading font-semibold text-gray-900">Select Verification Method</h1>
                  <p className="text-xs text-gray-600 mt-1">
                    In addition to your password, protect your account with an extra verification step.
                    Choose how you want to receive your sign-in codes.
                  </p>
                </div>

               
              </div>
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${twoFa.enabled
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-gray-50 text-gray-600 border border-gray-200'
                  }`}
              >
                <span
                  className={`mr-1.5  rounded-full ${twoFa.enabled ? 'bg-emerald-500' : 'bg-gray-400'
                    }`}
                />
                {twoFa.enabled ? 'MFA enabled' : 'MFA not enabled'}
              </span>
            </div>

            {loading && (
              <p className="text-sm text-gray-500">Loading your current authentication settings…</p>
            )}

            {!loading && (
              <>
                {(error || message) && (
                  <div
                    className={`mb-4 rounded-md border px-3 py-2 text-sm ${error
                      ? 'border-red-200 bg-red-50 text-red-700'
                      : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      }`}
                  >
                    {error || message}
                  </div>
                )}

                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr),320px]">
                  {/* Left column: choices */}
                  <div>
                    <div className="mb-4 flex items-center justify-between gap-4 rounded-xl px-4 py-3 border border-[#ece3ff] bg-white">
                      <span className="text-sm font-medium text-gray-900">
                        Enable multi-factor authentication for my account
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          setTwoFa((prev) => ({ ...prev, enabled: !prev.enabled }))
                        }
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${twoFa.enabled ? "bg-[#4D0080]" : "bg-gray-300"
                          }`}
                        aria-label="Toggle multi-factor authentication"
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${twoFa.enabled ? "translate-x-6" : "translate-x-1"
                            }`}
                        />
                      </button>
                    </div>

                    <div className="space-y-3">
                      {/* Email method */}
                      <button
                        type="button"
                        onClick={() => setTwoFa((prev) => ({ ...prev, method: 'email' }))}
                        className={`w-full text-left rounded-xl border p-4 md:p-5 flex items-center gap-4 hover:border-[#4D0080] hover:shadow-sm transition group ${twoFa.method === 'email'
                          ? 'border-[#4D0080] ring-1 ring-[#4D0080]/40 bg-[#f9f5ff]'
                          : 'border-gray-200 bg-white'
                          }`}
                      >
                        <div className="flex-shrink-0 h-14 w-14 rounded-xl bg-[#f3ebff] flex items-center justify-center overflow-hidden">
                          <img src="/images/authentication.png" alt="Email verification" className="h-10 w-10 object-contain" />
                        </div>
                        <div className="flex flex-col justify-center flex-1 min-h-[80px]">
                          <p className="text-sm font-semibold text-gray-900">Email verification code</p>
                          <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                            Receive a one-time verification code at your registered email address when you sign
                            in on a new browser or device.
                          </p>
                        </div>
                      </button>

                      {/* Phone method */}
                      <button
                        type="button"
                        onClick={() => setTwoFa((prev) => ({ ...prev, method: 'sms' }))}
                        className={`w-full text-left rounded-xl border p-4 md:p-5 flex items-center gap-4 hover:border-[#4D0080] hover:shadow-sm transition group ${twoFa.method === 'sms'
                          ? 'border-[#4D0080] ring-1 ring-[#4D0080]/40 bg-[#f9f5ff]'
                          : 'border-gray-200 bg-white'
                          }`}
                      >
                        <div className="flex-shrink-0 h-14 w-14 rounded-xl bg-[#e7f5ff] flex items-center justify-center overflow-hidden">
                          <img src="/images/mobile-banking.png" alt="Phone OTP" className="h-10 w-10 object-contain" />
                        </div>
                        <div className="flex flex-col justify-center flex-1 min-h-[80px]">
                          <p className="text-sm font-semibold text-gray-900">Phone OTP (SMS)</p>
                          <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                            Get a verification code via SMS on your registered mobile number when you sign
                            in.
                          </p>
                        </div>
                      </button>

                      {/* Authenticator app method - UI only for now */}
                      <div className="w-full rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4 md:p-5 flex items-center gap-4 opacity-60 cursor-not-allowed">
                        <div className="flex-shrink-0 h-14 w-14 rounded-xl bg-[#eef4ff] flex items-center justify-center overflow-hidden">
                          <img src="/images/app.png" alt="Authenticator app" className="h-10 w-10 object-contain" />
                        </div>
                        <div className="flex flex-col justify-center flex-1 min-h-[80px]">
                          <p className="text-sm font-semibold text-gray-900">
                            Authenticator app (coming soon)
                          </p>
                          <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                            Use apps like Google Authenticator or Authy to generate time-based one-time
                            passcodes. This option will be available in a future update.
                          </p>
                        </div>
                      </div>
                    </div>

                    <p className="mt-4 text-[11px] text-gray-500">
                      If you lose access to your email or phone, contact support so we can help you securely
                      recover your account.
                    </p>

                    <div className="mt-6 flex flex-col sm:flex-row justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => navigate('/account/profile')}
                        className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-800 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleSave}
                        disabled={saving}
                        className="px-5 py-2 rounded-lg text-sm font-semibold text-white bg-[#4D0080] hover:bg-[#3a0061] disabled:opacity-60"
                      >
                        {saving ? 'Saving…' : 'Save authentication method'}
                      </button>
                    </div>
                  </div>

                  {/* Right column: fill whitespace with useful panel */}
                  <aside className="hidden lg:block">
                    <div className="sticky top-6 rounded-2xl border border-gray-200 bg-gradient-to-b from-white to-[#faf7ff] p-5 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                            Security tips
                          </p>
                          <p className="mt-1 text-sm font-semibold text-gray-900">
                            Make your account harder to compromise
                          </p>
                        </div>
                        <div className="h-10 w-10 rounded-xl bg-[#f3ebff] flex items-center justify-center text-[#4D0080]">
                          <ShieldCheck className="h-5 w-5" />
                        </div>
                      </div>

                      <ul className="mt-4 space-y-3 text-xs text-gray-600">
                        <li className="flex gap-2">
                          <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-[#4D0080]" />
                          Use MFA to protect logins on new browsers/devices.
                        </li>
                        <li className="flex gap-2">
                          <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-[#4D0080]" />
                          Keep your email/phone up to date in your profile.
                        </li>
                        <li className="flex gap-2">
                          <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-[#4D0080]" />
                          Prefer a method you can access reliably while traveling.
                        </li>
                      </ul>

                      <div className="mt-5 rounded-xl border border-gray-200 bg-white p-4">
                        <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                          Selected method
                        </p>
                        <div className="mt-2 flex items-center gap-3">
                          <div className="h-9 w-9 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center">
                            {twoFa.method === 'sms' ? (
                              <Phone className="h-4 w-4 text-gray-700" />
                            ) : (
                              <Mail className="h-4 w-4 text-gray-700" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">
                              {twoFa.method === 'sms' ? 'Phone OTP (SMS)' : 'Email verification code'}
                            </p>
                            <p className="text-xs text-gray-500">
                              {twoFa.enabled ? 'Enabled for your account' : 'Not enabled yet'}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 flex items-center gap-2 text-[11px] text-gray-500">
                          <KeyRound className="h-3.5 w-3.5" />
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

