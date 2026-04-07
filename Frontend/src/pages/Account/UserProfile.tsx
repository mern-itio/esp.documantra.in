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
  const [twoFaMethod, setTwoFaMethod] = useState<'email' | 'sms'>('email');

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullname: '',
    email: '',
    company: '',
    phone: '',
    address: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  
  const [otpModal, setOtpModal] = useState<{ type: 'email' | 'phone' | null, visible: boolean, otp: string, loading: boolean, error: string }>({ type: null, visible: false, otp: '', loading: false, error: '' });
  
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
      method: (u.twoFaMethod === 'sms' ? 'sms' : 'email') as 'email' | 'sms',
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
        setTwoFaMethod(resp.data?.twoFaMethod === 'sms' ? 'sms' : 'email');
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
      address: (user as any)?.address || ''
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
        if (phoneChanged) {
          await authApi.post('/api/auth/profile/phone/send-otp', { phone: formData.phone });
          setOtpModal({ type: 'phone', visible: true, otp: '', loading: false, error: '' });
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
        setOtpModal({ type: null, visible: false, otp: '', loading: false, error: '' });
        setIsEditing(false);
      }
    } catch (error: any) {
      setOtpModal(prev => ({ ...prev, error: error.response?.data?.message || 'Invalid OTP', loading: false }));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-gradient-to-r from-[#1f0a4d] via-[#4D0080] to-[#7a2fc7] text-white">
        <div className="mx-auto max-w-7xl px-6 py-10">
          <p className="text-xs uppercase tracking-[0.2em] text-white/75">Account Center</p>
          <h1 className="mt-1 text-3xl font-semibold">Profile</h1>
          <p className="mt-1 text-sm text-white/80">Manage identity, security, sessions, and plan settings from one place.</p>
        </div>
      </div>

      <div className="mx-auto -mt-8 max-w-7xl px-6 pb-12">
        <div className="rounded-md border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative">
              <div
                className={`flex h-16 w-16 items-center justify-center rounded-full text-xl font-semibold ${
                  isPaidPlan ? 'bg-yellow-100 text-yellow-700' : 'bg-purple-100 text-purple-700'
                }`}
              >
                {initials}
              </div>
              {isPaidPlan && (
                <div className="absolute -left-1 top-0 -translate-y-1/2 -rotate-45">
                  <Crown className="h-5 w-5 fill-yellow-500 text-yellow-500 drop-shadow-sm" />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-xl font-semibold text-slate-900">{formatName((user as any)?.fullname)}</h2>
              <p className="truncate text-sm text-slate-600">{(user as any)?.email || '—'}</p>
              <p className="text-xs text-slate-500">Account #{accountId}</p>
            </div>
            {planName && (
              <div className="rounded-full border border-purple-200 bg-purple-50 px-3 py-1.5 text-sm font-medium text-purple-700">
                {planName}
              </div>
            )}
           
          </div>
        </div>

        {saveError && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              {saveError}
            </div>
          </div>
        )}

        <div className="mt-6 space-y-6">
          <section className="rounded-md border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Personal Information</h3>
              </div>
             <button
              onClick={isEditing ? handleCancelEdit : handleEditClick}
              className="inline-flex h-10 w-10 items-center justify-center text-black hover:bg-slate-50 hover:text-slate-900"
              title={isEditing ? 'Cancel Edit' : 'Edit Profile'}
            >
              {isEditing ? <X className="h-4 w-4" /> : <Edit2 className="h-4 w-4" />}
            </button>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Full name</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.fullname}
                    onChange={(e) => setFormData({ ...formData, fullname: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#4D0080]/20"
                  />
                ) : (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900">
                    {formatName((user as any)?.fullname)}
                  </div>
                )}
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Email address</label>
                {isEditing ? (
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#4D0080]/20"
                  />
                ) : (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900">
                    {(user as any)?.email || '—'}
                  </div>
                )}
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Company</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#4D0080]/20"
                  />
                ) : (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900">
                    {(user as any)?.company || '—'}
                  </div>
                )}
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Phone number</label>
                {isEditing ? (
                  <PhoneInput
                    country="in"
                    value={formData.phone}
                    onChange={(val) => setFormData({ ...formData, phone: val })}
                    inputProps={{ name: 'phone', id: 'phone', required: true }}
                    containerClass="w-full"
                    inputClass="!w-full !pl-12 !pr-3 !py-2 !text-sm !border !border-slate-300 !rounded-lg !bg-white focus:!outline-none focus:!ring-2 focus:!ring-[#4D0080]/20"
                    buttonClass="!border-y !border-l !border-r-0 !border-slate-300 !bg-white !rounded-l-lg"
                  />
                ) : phoneRaw ? (
                  <div className="pointer-events-none -ml-3 flex items-center rounded-lg border border-slate-200 bg-slate-50 px-1 py-1">
                    <PhoneInput
                      value={phoneRaw}
                      disabled={true}
                      containerClass="w-full"
                      inputClass="!w-full !pl-12 !pr-0 !py-0 !text-sm !border-none !bg-transparent !opacity-100"
                      buttonClass="!border-none !bg-transparent !opacity-100"
                    />
                  </div>
                ) : (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900">—</div>
                )}
              </div>
              <div className="md:col-span-2">
                <label className="mb-1 block text-xs font-semibold text-slate-600">Address</label>
                {isEditing ? (
                  <textarea
                    rows={3}
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#4D0080]/20"
                  />
                ) : (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900">
                    {(user as any)?.address || '—'}
                  </div>
                )}
              </div>
            </div>

            {isEditing && (
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  className="rounded-lg bg-[#4D0080] px-5 py-3 text-sm font-semibold text-white hover:bg-[#3a0061] disabled:opacity-60"
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save Profile'}
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
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
              className="group rounded-3xl border border-slate-200 bg-slate-50 p-5 text-left transition hover:border-[#4D0080] hover:bg-white"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-[#4D0080]">Security</p>
              <h4 className="mt-3 text-lg font-semibold text-slate-900">Two-factor authentication</h4>
              <p className="mt-2 text-sm text-slate-600">
                {twoFaEnabled ? `Enabled via ${twoFaMethod === 'sms' ? 'SMS OTP' : 'Email code'}.` : 'Currently disabled.'}
              </p>
              <span className="mt-5 inline-flex rounded-full bg-[#4D0080] px-4 py-2 text-sm font-semibold text-white transition group-hover:bg-[#3a0061]">
                Manage Security
              </span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/account/session-management')}
              className="group rounded-3xl border border-slate-200 bg-slate-50 p-5 text-left transition hover:border-[#4D0080] hover:bg-white"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-[#4D0080]">Sessions</p>
              <h4 className="mt-3 text-lg font-semibold text-slate-900">Active devices</h4>
              <p className="mt-2 text-sm text-slate-600">Review and end active sessions for extra account safety.</p>
              <span className="mt-5 inline-flex rounded-full bg-[#4D0080] px-4 py-2 text-sm font-semibold text-white transition group-hover:bg-[#3a0061]">
                Manage Sessions
              </span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/subscription-management')}
              className="group rounded-3xl border border-slate-200 bg-slate-50 p-5 text-left transition hover:border-[#4D0080] hover:bg-white"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-[#4D0080]">Account Plan</p>
              <h4 className="mt-3 text-lg font-semibold text-slate-900">{planName || 'Free Plan'}</h4>
              <p className="mt-2 text-sm text-slate-600">Manage billing, plan upgrades, and credit usage from one place.</p>
              <span className="mt-5 inline-flex rounded-full bg-[#4D0080] px-4 py-2 text-sm font-semibold text-white transition group-hover:bg-[#3a0061]">
                Manage Plan
              </span>
            </button>
          </section>
        </div>
      </div>

      {/* OTP Modal */}
      {otpModal.visible && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 relative">
            <button 
              onClick={() => setOtpModal({ type: null, visible: false, otp: '', loading: false, error: '' })}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-semibold mb-2 text-gray-900">
              Verify {otpModal.type === 'email' ? 'Email' : 'Phone'}
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Please enter the code sent to your new {otpModal.type}.
            </p>
            
            {otpModal.error && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded border border-red-100 flex items-center gap-2">
                <XCircle className="w-4 h-4" />
                {otpModal.error}
              </div>
            )}
            
            <input
              type="text"
              placeholder="Enter OTP"
              value={otpModal.otp}
              onChange={e => setOtpModal(prev => ({ ...prev, otp: e.target.value }))}
              className="w-full text-center text-2xl tracking-widest p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4D0080]"
            />
            
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setOtpModal({ type: null, visible: false, otp: '', loading: false, error: '' })}
                className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-50 rounded"
              >
                Cancel
              </button>
              <button
                onClick={verifyOtp}
                disabled={otpModal.loading || !otpModal.otp}
                className="px-6 py-2 bg-[#4D0080] text-white font-medium rounded hover:bg-[#3a0061] disabled:opacity-50"
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


