import React from 'react';
import { useAuth } from '../../components/AuthService/AuthContext';
import { useNavigate } from 'react-router-dom';

const UserProfile: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

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
      <div className="bg-gradient-to-r from-purple-900 via-purple-800 to-purple-700">
        <div className="max-w-7xl mx-auto px-6 py-10 text-white">
          <h1 className="text-3xl font-semibold">My Profile</h1>
          <p className="opacity-90 mt-1">Manage your personal information and account preferences</p>
        </div>
      </div>

      {/* Profile header card */}
      <div className="max-w-7xl mx-auto -mt-10 px-6">
        <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-6 flex items-center gap-6">
          <div className="h-16 w-16 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xl font-semibold">
            {initials}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900">{formatName((user as any)?.fullname)}</h2>
            <p className="text-gray-600 text-sm">{(user as any)?.email || '—'} • Account #{accountId}</p>
          </div>
          {(user as any)?.plan && (
            <div className="px-3 py-1.5 rounded-full text-sm font-medium bg-purple-50 text-purple-700 border border-purple-200">
              {(user as any)?.plan}
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
          onClick={() => navigate('/account/profile')}
        >
          Manage Profile
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


