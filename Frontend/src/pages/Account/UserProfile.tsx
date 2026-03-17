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
    <div className="min-h-screen bg-white">
      {/* Top header banner */}
      <div className="bg-gradient-to-r from-[#260559] via-[#6b4c9c] to-[#6b39b8] text-white ">
        <div className="max-w-7xl mx-auto px-6 py-10 text-white">
          <h1 className="text-3xl font-semibold">My Profile</h1>
          <p className="opacity-90 mt-1">Manage your personal information and account preferences</p>
        </div>
      </div>

      {/* Profile header card */}
      <div className="max-w-7xl mx-auto -mt-10 px-6">
        <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-6 flex items-center gap-6">
          <div className="relative">
            <div className={`h-16 w-16 rounded-full flex items-center justify-center text-xl font-semibold ${
              isPaidPlan 
                ? 'bg-yellow-100 text-yellow-700' 
                : 'bg-purple-100 text-purple-700'
            }`}>
              {initials}
            </div>
            {isPaidPlan && (
              <div className="absolute top-2 left-0 transform -translate-x-1/2 -translate-y-1/2 -rotate-50 z-10">
                <Crown className="h-5 w-5 text-yellow-500 fill-yellow-500 drop-shadow-sm" />
              </div>
            )}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900">{formatName((user as any)?.fullname)}</h2>
            <p className="text-gray-600 text-sm">{(user as any)?.email || '—'} • Account #{accountId}</p>
          </div>
          {planName && (
            <div className="px-3 py-1.5 rounded-full text-sm font-medium bg-purple-50 text-purple-700 border border-purple-200">
              {planName}
            </div>
          )}
          <button
            onClick={isEditing ? handleCancelEdit : handleEditClick}
            className="ml-4 p-2 text-gray-500 hover:text-gray-900 transition-colors"
            title={isEditing ? 'Cancel Edit' : 'Edit Profile'}
          >
            {isEditing ? <X className="w-5 h-5" /> : <Edit2 className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {saveError && (
        <div className="max-w-7xl mx-auto px-6 mt-4">
          <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm flex items-center gap-2">
            <XCircle className="w-4 h-4" />
            {saveError}
          </div>
        </div>
      )}

      {/* Details grid */}
      <div className="max-w-7xl mx-auto px-6 mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Name</h3>
          {isEditing ? (
            <input
              type="text"
              value={formData.fullname}
              onChange={e => setFormData({ ...formData, fullname: e.target.value })}
              className="w-full text-gray-900 p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#4D0080]"
            />
          ) : (
            <p className="text-gray-900">{formatName((user as any)?.fullname)}</p>
          )}
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Email Address</h3>
          {isEditing ? (
            <input
              type="email"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              className="w-full text-gray-900 p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#4D0080]"
            />
          ) : (
            <p className="text-gray-900">{(user as any)?.email || '—'}</p>
          )}
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 bg-gray-50">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Account ID</h3>
          <p className="text-gray-500">{accountId}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Company</h3>
          {isEditing ? (
            <input
              type="text"
              value={formData.company}
              onChange={e => setFormData({ ...formData, company: e.target.value })}
              className="w-full text-gray-900 p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#4D0080]"
            />
          ) : (
            <p className="text-gray-900">{(user as any)?.company || '—'}</p>
          )}
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Phone Number</h3>
          {isEditing ? (
            <div className="relative group">
              <PhoneInput
                country="in"
                value={formData.phone}
                onChange={val => setFormData({ ...formData, phone: val })}
                inputProps={{
                  name: 'phone',
                  id: 'phone',
                  required: true
                }}
                containerClass="w-full"
                inputClass="!w-full !pl-12 !pr-3 !py-1.5 !text-sm !border !border-gray-300 !rounded !bg-white focus:!outline-none focus:!ring-1 focus:!ring-[#4D0080] !transition-all !duration-300"
                buttonClass="!border-y !border-l !border-r-0 !border-gray-300 !bg-white !rounded-l"
              />
            </div>
          ) : (
            <>
              {phoneRaw ? (
                <div className="pointer-events-none flex items-center -ml-3">
                  <PhoneInput
                    value={phoneRaw}
                    disabled={true}
                    containerClass="w-full"
                    inputClass="!w-full !pl-12 !pr-0 !py-0 !text-gray-900 !text-base !border-none !bg-transparent !opacity-100"
                    buttonClass="!border-none !bg-transparent !opacity-100"
                  />
                </div>
              ) : (
                <p className="text-gray-900">—</p>
              )}
            </>
          )}
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Address</h3>
          {isEditing ? (
            <input
              type="text"
              value={formData.address}
              onChange={e => setFormData({ ...formData, address: e.target.value })}
              className="w-full text-gray-900 p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#4D0080]"
            />
          ) : (
            <p className="text-gray-900">{(user as any)?.address || '—'}</p>
          )}
        </div>


        {/* Security / 2FA summary */}
        <div
          className={`bg-white rounded-xl border p-5 md:col-span-2 lg:col-span-3 transition-colors ${
            twoFaEnabled ? 'border-emerald-200 shadow-sm' : 'border-gray-200'
          }`}
        >
          <h3 className="text-sm font-semibold text-gray-900">Security</h3>
          <div className="mt-1 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="text-xs text-gray-600 max-w-lg">
                Manage how you verify new logins to your Draft &amp; Sign account. You can enable email
                or phone one-time codes from the authentication settings page.
              </p>
              <p className="text-xs text-gray-600">
                Current status:{' '}
                <span className="font-medium">
                  {twoFaEnabled ? 'Enabled' : 'Not enabled'}{' '}
                  {twoFaEnabled && `(method: ${twoFaMethod === 'sms' ? 'Phone OTP' : 'Email code'})`}
                </span>
              </p>
            </div>
            <div className="flex items-center gap-3 mt-1 sm:mt-0">
              <div className="flex items-center gap-2">
                <span
                  className={`h-2 w-2 rounded-full ${
                    twoFaEnabled ? 'bg-emerald-500' : 'bg-gray-300'
                  }`}
                />
                <span
                  className={`text-[11px] font-medium uppercase tracking-wide ${
                    twoFaEnabled ? 'text-emerald-700' : 'text-gray-500'
                  }`}
                >
                  {twoFaEnabled ? 'Verification ENABLED' : 'Verification NOT ENABLED'}
                </span>
              </div>
              <button
                onClick={() => navigate('/account/security')}
                className="inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold text-white bg-[#4D0080] hover:bg-[#3a0061] transition-colors whitespace-nowrap"
              >
                Manage authentication
              </button>
            </div>
          </div>
        </div>

        {/* Active Sessions */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 md:col-span-2 lg:col-span-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">Device & Session Management</h3>
              <p className="text-xs text-gray-600">Review devices that have logged into your account and manage active sessions.</p>
            </div>
            <button
              onClick={() => navigate('/account/session-management')}
              className="inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold text-white bg-[#4D0080] hover:bg-[#3a0061] transition-colors whitespace-nowrap"
            >
              Manage Sessions
            </button>
          </div>
        </div>

      </div>

      {/* Action footer */}
      <div className="max-w-7xl mx-auto px-6 mt-8 mb-12 flex flex-col sm:flex-row gap-3">
        {isEditing ? (
          <button
            className="inline-flex items-center justify-center px-5 py-3 rounded-lg text-white"
            style={{ backgroundColor: '#4D0080' }}
            onClick={handleSaveProfile}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Profile'}
          </button>
        ) : (
          <>
            <button
              className="inline-flex items-center justify-center px-5 py-3 rounded-lg border border-gray-300 text-gray-900 hover:bg-gray-50"
              onClick={() => navigate('/subscription-management')}
            >
              Manage Subscription
            </button>
            <button
              className="inline-flex items-center justify-center px-5 py-3 rounded-lg text-white"
              style={{ backgroundColor: '#4D0080' }}
              onClick={() => navigate('/credits-usage')}
            >
              View Credit Usage
            </button>
          </>
        )}
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


