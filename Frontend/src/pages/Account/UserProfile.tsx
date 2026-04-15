import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../components/AuthService/AuthContext';
import { useSubscription } from '../../context/SubscriptionContext';
import { useNavigate } from 'react-router-dom';
import { Crown, Edit2, X, XCircle } from 'lucide-react';
import { authApi } from '../../services/apiHelper';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';

const UserProfile: React.FC = () => {
  const { user } = useAuth();
  const { userPlan, isFreePlan } = useSubscription();
  const navigate = useNavigate();

  const [twoFaEnabled, setTwoFaEnabled] = useState<boolean>(false);
  const [twoFaMethod, setTwoFaMethod] = useState<AuthMethod>('email');
  type AuthMethod = 'email' | 'sms' | 'authenticator';

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullname: '',
    email: '',
    company: '',
    phone: '',
    address: '',
    recoveryEmail: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  
  const [otpModal, setOtpModal] = useState<{ type: 'email' | 'phone' | 'recovery' | null, visible: boolean, otp: string, loading: boolean, error: string }>({ type: null, visible: false, otp: '', loading: false, error: '' });
  const [recoveryEmail, setRecoveryEmail] = useState('');
  
  // Get plan name from subscription context (most up-to-date) or fallback to user.plan
  const planName = userPlan?.name || (user as any)?.plan || null;
  
  // Check if user has a paid plan
  const isPaidPlan = userPlan && !isFreePlan();

  const accountId = (user as any)?.accountId || (user as any)?.id || (user as any)?._id || 'N/A';
  const formatName = (name?: string) =>
    (name || 'User')
      .trim()
      .split(/\s+/)
      .map(w => (w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w))
      .join(' ');
  const initials = formatName((user as any)?.fullname)
    .split(' ')
    .slice(0, 2)
    .map(w => w[0])
    .join('');

  const phoneRaw = (user as any)?.phone as string | undefined;

  const userTwoFaFromAuth = useMemo(() => {
    const u: any = user || {};
    return {
      enabled: !!u.twoFaEnabled,
      method: (
        u.twoFaMethod === 'sms'
          ? 'sms'
          : u.twoFaMethod === 'authenticator'
            ? 'authenticator'
            : 'email'
      ) as AuthMethod,
    };
  }, [user]);

  useEffect(() => {
    // Initialize from auth context first, then refresh from backend
    setTwoFaEnabled(userTwoFaFromAuth.enabled);
    setTwoFaMethod(userTwoFaFromAuth.method);

    const load = async () => {
      try {
        const resp = await authApi.get('/api/auth/2fa');
        setTwoFaEnabled(!!resp.data?.twoFaEnabled);
        setTwoFaMethod(
          resp.data?.twoFaMethod === 'sms'
            ? 'sms'
            : resp.data?.twoFaMethod === 'authenticator'
              ? 'authenticator'
              : 'email'
        );
        setRecoveryEmail(String(resp.data?.recoveryEmail || ''));
      } catch (e: any) {
        // ignore if endpoint not reachable; UI still shows from context
      }
    };
    load();    
  }, [userTwoFaFromAuth.enabled, userTwoFaFromAuth.method]);

  const handleEditClick = () => {
    setFormData({
      fullname: (user as any)?.fullname || '',
      email: (user as any)?.email || '',
      company: (user as any)?.company || '',
      phone: (user as any)?.phone || '',
      address: (user as any)?.address || '',
      recoveryEmail: recoveryEmail || ''
    });
    setSaveError('');
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setSaveError('');
  };

  const handleSaveProfile = async () => {
    setSaveError('');
    setIsSaving(true);
    try {
      let emailChanged = formData.email !== (user as any)?.email;
      let phoneChanged = formData.phone !== (user as any)?.phone;
      let recoveryEmailChanged = formData.recoveryEmail.trim() !== (recoveryEmail || '');

      // Save basic profile
      const profileResp = await authApi.put('/api/auth/profile', {
        fullname: formData.fullname,
        company: formData.company,
        address: formData.address
      });
      
      // Update local storage and context
      if (profileResp.data?.token) {
        localStorage.setItem('accessToken', profileResp.data.token);
        localStorage.setItem('userData', JSON.stringify({ ...user, ...profileResp.data.user }));
        window.dispatchEvent(new Event('dns-extension-auth-synced'));
      }

      if (emailChanged) {
        await authApi.post('/api/auth/profile/email/send-otp', { email: formData.email });
        setOtpModal({ type: 'email', visible: true, otp: '', loading: false, error: '' });
        setIsSaving(false);
        return; // wait for OTP verify
      }

      if (phoneChanged) {
        await authApi.post('/api/auth/profile/phone/send-otp', { phone: formData.phone });
        setOtpModal({ type: 'phone', visible: true, otp: '', loading: false, error: '' });
        setIsSaving(false);
        return; // wait for OTP verify
      }

      if (recoveryEmailChanged) {
        await authApi.post('/api/auth/2fa/recovery-email/send-otp', { recoveryEmail: formData.recoveryEmail.trim() });
        setOtpModal({ type: 'recovery', visible: true, otp: '', loading: false, error: '' });
        setIsSaving(false);
        return; // wait for OTP verify
      }

      setIsEditing(false);
    } catch (error: any) {
      setSaveError(error.response?.data?.message || 'Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  const verifyOtp = async () => {
    setOtpModal(prev => ({ ...prev, loading: true, error: '' }));
    try {
      if (otpModal.type === 'email') {
        const resp = await authApi.post('/api/auth/profile/email/verify-otp', { otp: otpModal.otp });
        if (resp.data?.token) {
          localStorage.setItem('accessToken', resp.data.token);
          const currentUser = JSON.parse(localStorage.getItem('userData') || '{}');
          currentUser.email = formData.email;
          localStorage.setItem('userData', JSON.stringify(currentUser));
          window.dispatchEvent(new Event('dns-extension-auth-synced'));
        }
        
        let phoneChanged = formData.phone !== (user as any)?.phone;
        let recoveryEmailChanged = formData.recoveryEmail.trim() !== (recoveryEmail || '');
        if (phoneChanged) {
          await authApi.post('/api/auth/profile/phone/send-otp', { phone: formData.phone });
          setOtpModal({ type: 'phone', visible: true, otp: '', loading: false, error: '' });
        } else if (recoveryEmailChanged) {
          await authApi.post('/api/auth/2fa/recovery-email/send-otp', { recoveryEmail: formData.recoveryEmail.trim() });
          setOtpModal({ type: 'recovery', visible: true, otp: '', loading: false, error: '' });
        } else {
          setOtpModal({ type: null, visible: false, otp: '', loading: false, error: '' });
          setIsEditing(false);
        }
      } else if (otpModal.type === 'phone') {
        const resp = await authApi.post('/api/auth/profile/phone/verify-otp', { otp: otpModal.otp });
        if (resp.data?.token) {
          localStorage.setItem('accessToken', resp.data.token);
          const currentUser = JSON.parse(localStorage.getItem('userData') || '{}');
          currentUser.phone = formData.phone;
          localStorage.setItem('userData', JSON.stringify(currentUser));
          window.dispatchEvent(new Event('dns-extension-auth-synced'));
        }
        const recoveryEmailChanged = formData.recoveryEmail.trim() !== (recoveryEmail || '');
        if (recoveryEmailChanged) {
          await authApi.post('/api/auth/2fa/recovery-email/send-otp', { recoveryEmail: formData.recoveryEmail.trim() });
          setOtpModal({ type: 'recovery', visible: true, otp: '', loading: false, error: '' });
        } else {
          setOtpModal({ type: null, visible: false, otp: '', loading: false, error: '' });
          setIsEditing(false);
        }
      } else if (otpModal.type === 'recovery') {
        await authApi.post('/api/auth/2fa/recovery-email/verify-otp', { otp: otpModal.otp });
        setRecoveryEmail(formData.recoveryEmail.trim());
        setOtpModal({ type: null, visible: false, otp: '', loading: false, error: '' });
        setIsEditing(false);
      }
    } catch (error: any) {
      setOtpModal(prev => ({ ...prev, error: error.response?.data?.message || 'Invalid OTP', loading: false }));
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-r from-primary via-primary/95 to-primary/80 text-primary-foreground">
        <div className="mx-auto max-w-7xl px-6 py-10">
          <p className="text-xs uppercase tracking-[0.2em] text-primary-foreground/80">Account Center</p>
          <h1 className="mt-1 text-3xl font-semibold">Profile</h1>
          <p className="mt-1 text-sm text-primary-foreground/85">Manage identity, security, sessions, and plan settings from one place.</p>
        </div>
      </div>

      <div className="mx-auto -mt-8 max-w-7xl px-6 pb-12">
        <div className="rounded-md border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative">
              <div
                className={`flex h-16 w-16 items-center justify-center rounded-full text-xl font-semibold ${
                  isPaidPlan
                    ? 'bg-amber-500/20 text-amber-800 dark:bg-amber-400/20 dark:text-amber-200'
                    : 'bg-primary/15 text-primary'
                }`}
              >
                {initials}
              </div>
              {isPaidPlan && (
                <div className="absolute -left-1 top-0 -translate-y-1/2 -rotate-45">
                  <Crown className="h-5 w-5 fill-amber-500 text-amber-400 drop-shadow-sm dark:fill-amber-400 dark:text-amber-300" />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-xl font-semibold text-foreground">{formatName((user as any)?.fullname)}</h2>
              <p className="truncate text-sm text-muted-foreground">{(user as any)?.email || '—'}</p>
              <p className="text-xs text-muted-foreground">Account #{accountId}</p>
            </div>
            {planName && (
              <div className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary">
                {planName}
              </div>
            )}
           
          </div>
        </div>

        {saveError && (
          <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 shrink-0" />
              {saveError}
            </div>
          </div>
        )}

        <div className="mt-6 space-y-6">
          <section className="rounded-md border border-border bg-card p-6 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Personal Information</h3>
              </div>
             <button
              onClick={isEditing ? handleCancelEdit : handleEditClick}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-foreground hover:bg-muted"
              title={isEditing ? 'Cancel Edit' : 'Edit Profile'}
            >
              {isEditing ? <X className="h-4 w-4" /> : <Edit2 className="h-4 w-4" />}
            </button>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-muted-foreground">Full name</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.fullname}
                    onChange={(e) => setFormData({ ...formData, fullname: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                ) : (
                  <div className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-foreground">
                    {formatName((user as any)?.fullname)}
                  </div>
                )}
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-muted-foreground">Email address</label>
                {isEditing ? (
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                ) : (
                  <div className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-foreground">
                    {(user as any)?.email || '—'}
                  </div>
                )}
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-muted-foreground">Company</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                ) : (
                  <div className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-foreground">
                    {(user as any)?.company || '—'}
                  </div>
                )}
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-muted-foreground">Phone number</label>
                {isEditing ? (
                  <PhoneInput
                    country="in"
                    value={formData.phone}
                    onChange={(val) => setFormData({ ...formData, phone: val })}
                    inputProps={{ name: 'phone', id: 'phone', required: true }}
                    containerClass="w-full"
                    inputClass="!w-full !pl-12 !pr-3 !py-2 !text-sm !border !border-border !rounded-lg !bg-background !text-foreground focus:!outline-none focus:!ring-2 focus:!ring-ring"
                    buttonClass="!border-y !border-l !border-r-0 !border-border !bg-muted/50 !rounded-l-lg"
                  />
                ) : phoneRaw ? (
                  <div className="pointer-events-none -ml-3 flex items-center rounded-lg border border-border bg-muted/40 px-1 py-1">
                    <PhoneInput
                      value={phoneRaw}
                      disabled={true}
                      containerClass="w-full"
                      inputClass="!w-full !pl-12 !pr-0 !py-0 !text-sm !border-none !bg-transparent !text-foreground !opacity-100"
                      buttonClass="!border-none !bg-transparent !opacity-100"
                    />
                  </div>
                ) : (
                  <div className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-foreground">—</div>
                )}
              </div>
              <div >
                <label className="mb-1 block text-xs font-semibold text-muted-foreground">Recovery email</label>
                {isEditing ? (
                  <input
                    type="email"
                    value={formData.recoveryEmail}
                    onChange={(e) => setFormData({ ...formData, recoveryEmail: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                ) : (
                  <div className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-foreground">
                    {recoveryEmail || '—'}
                  </div>
                )}
              </div>
              <div >
                <label className="mb-1 block text-xs font-semibold text-muted-foreground">Address</label>
                {isEditing ? (
                  <textarea
                    rows={3}
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                ) : (
                  <div className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-foreground">
                    {(user as any)?.address || '—'}
                  </div>
                )}
              </div>
            </div>

            {isEditing && (
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  className="rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save Profile'}
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-border px-5 py-3 text-sm font-semibold text-foreground hover:bg-muted"
                  onClick={handleCancelEdit}
                >
                  Cancel
                </button>
              </div>
            )}
          </section>

          <section className="grid gap-4 lg:grid-cols-3">
            <button
              type="button"
              onClick={() => navigate('/account/security')}
              className="group rounded-3xl border border-border bg-muted/30 p-5 text-left transition hover:border-primary/50 hover:bg-accent/40"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">Security</p>
              <h4 className="mt-3 text-lg font-semibold text-foreground">Two-factor authentication</h4>
              <p className="mt-2 text-sm text-muted-foreground">
                {twoFaEnabled
                  ? `Enabled via ${
                    twoFaMethod === 'sms'
                      ? 'SMS OTP'
                      : twoFaMethod === 'authenticator'
                        ? 'Authenticator app'
                        : 'Email code'
                  }.`
                  : 'Currently disabled.'}
              </p>
              <span className="mt-5 inline-flex rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition group-hover:bg-primary/90">
                Manage Security
              </span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/account/session-management')}
              className="group rounded-3xl border border-border bg-muted/30 p-5 text-left transition hover:border-primary/50 hover:bg-accent/40"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">Sessions</p>
              <h4 className="mt-3 text-lg font-semibold text-foreground">Active devices</h4>
              <p className="mt-2 text-sm text-muted-foreground">Review and end active sessions for extra account safety.</p>
              <span className="mt-5 inline-flex rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition group-hover:bg-primary/90">
                Manage Sessions
              </span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/subscription-management')}
              className="group rounded-3xl border border-border bg-muted/30 p-5 text-left transition hover:border-primary/50 hover:bg-accent/40"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">Account Plan</p>
              <h4 className="mt-3 text-lg font-semibold text-foreground">{planName || 'Free Plan'}</h4>
              <p className="mt-2 text-sm text-muted-foreground">Manage billing, plan upgrades, and credit usage from one place.</p>
              <span className="mt-5 inline-flex rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition group-hover:bg-primary/90">
                Manage Plan
              </span>
            </button>
          </section>
        </div>
      </div>

      {/* OTP Modal */}
      {otpModal.visible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]">
          <div className="relative w-full max-w-sm rounded-xl border border-border bg-card p-6 text-card-foreground shadow-xl">
            <button 
              onClick={() => setOtpModal({ type: null, visible: false, otp: '', loading: false, error: '' })}
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="mb-2 text-xl font-semibold text-foreground">
              Verify {otpModal.type === 'email' ? 'Email' : otpModal.type === 'phone' ? 'Phone' : 'Recovery Email'}
            </h3>
            <p className="mb-6 text-sm text-muted-foreground">
              Please enter the code sent to your new {otpModal.type === 'recovery' ? 'recovery email' : otpModal.type}.
            </p>
            
            {otpModal.error && (
              <div className="mb-4 flex items-center gap-2 rounded border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                <XCircle className="h-4 w-4 shrink-0" />
                {otpModal.error}
              </div>
            )}
            
            <input
              type="text"
              placeholder="Enter OTP"
              value={otpModal.otp}
              onChange={e => setOtpModal(prev => ({ ...prev, otp: e.target.value }))}
              className="w-full rounded-lg border border-border bg-background p-3 text-center text-2xl tracking-widest text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setOtpModal({ type: null, visible: false, otp: '', loading: false, error: '' })}
                className="rounded-lg px-4 py-2 font-medium text-muted-foreground hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={verifyOtp}
                disabled={otpModal.loading || !otpModal.otp}
                className="rounded-lg bg-primary px-6 py-2 font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {otpModal.loading ? 'Verifying...' : 'Verify'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default UserProfile;


