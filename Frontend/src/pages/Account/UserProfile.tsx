import React from 'react';
import { useAuth } from '../../components/AuthService/AuthContext';
import { useSubscription } from '../../context/SubscriptionContext';
import { useNavigate } from 'react-router-dom';
import { Crown } from 'lucide-react';

const UserProfile: React.FC = () => {
  const { user } = useAuth();
  const { userPlan, isFreePlan } = useSubscription();
  const navigate = useNavigate();
  
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
        </div>
      </div>

      {/* Details grid */}
      <div className="max-w-7xl mx-auto px-6 mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Name</h3>
          <p className="text-gray-900">{formatName((user as any)?.fullname)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Email Address</h3>
          <p className="text-gray-900">{(user as any)?.email || '—'}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Account ID</h3>
          <p className="text-gray-900">{accountId}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Company</h3>
          <p className="text-gray-900">{(user as any)?.company || '—'}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Phone Number</h3>
          <p className="text-gray-900">{(user as any)?.phone || '—'}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Address</h3>
          <p className="text-gray-900">{(user as any)?.address || '—'}</p>
        </div>
      </div>

      {/* Action footer */}
      <div className="max-w-7xl mx-auto px-6 mt-8 mb-12 flex flex-col sm:flex-row gap-3">
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
      </div>
    </div>
  );
};

export default UserProfile;


