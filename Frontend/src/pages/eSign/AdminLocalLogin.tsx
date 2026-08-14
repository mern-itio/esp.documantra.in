import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { adminLoginLocal } from '../../utils/adminSession';

const AdminLocalLogin: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('admin@draftnsign.com');
  const [password, setPassword] = useState('Admin@123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const redirectTo = (location.state as { from?: string })?.from || '/e-sign/admin/vsign';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await adminLoginLocal(email.trim(), password);
      navigate(redirectTo, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-white rounded-xl border shadow-sm p-8 space-y-5"
      >
        <div className="text-center">
          <Shield className="w-10 h-10 text-[#155E4B] mx-auto mb-2" />
          <h1 className="text-xl font-semibold text-gray-900">Local Admin Login</h1>
          <p className="text-sm text-gray-600 mt-1">VSign settings & platform admin APIs</p>
        </div>
        {error && (
          <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </div>
        )}
        <label className="block text-sm">
          <span className="text-gray-700">Email</span>
          <input
            type="email"
            className="mt-1 w-full border rounded-lg px-3 py-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label className="block text-sm">
          <span className="text-gray-700">Password</span>
          <input
            type="password"
            className="mt-1 w-full border rounded-lg px-3 py-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-lg bg-[#155E4B] text-white font-medium hover:bg-[#124a3b] disabled:opacity-60"
        >
          {loading ? 'Signing in…' : 'Sign in as admin'}
        </button>
        <p className="text-xs text-gray-500 text-center">
          Default local: admin@draftnsign.com / Admin@123
        </p>
      </form>
    </div>
  );
};

export default AdminLocalLogin;
