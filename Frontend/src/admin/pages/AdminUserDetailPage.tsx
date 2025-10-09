import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../common';
import { ArrowLeft } from 'lucide-react';
import { adminApi } from '../../services/apiHelper';
import type { UserType } from '../../types';

const AdminUserDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<'details' | 'password' | 'smtp'>('details');

  // Form state
  const [form, setForm] = useState({
    fullname: '',
    email: '',
    phone: '',
    status: true,
  });
  const [passwordForm, setPasswordForm] = useState({ password: '', confirmPassword: '' });
  const [smtpForm, setSmtpForm] = useState({ host: '', port: '', user: '', pass: '', secure: false });

  const fetchUser = async () => {
    try {
      setLoading(true);
      const res = await adminApi.get(`/admin/user/${id}`);
      const u = res.data.data;

      setUser(u);
      setForm({
        fullname: u.fullname || '',
        email: u.email || '',
        phone: u.phone || '',
        status: u.status,
      });
      setSmtpForm(u.smtp || { host: '', port: '', user: '', pass: '', secure: false });
    } catch (err) {
      console.error('Failed to fetch user:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchUser();
  }, [id]);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value });

  const handleSmtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setSmtpForm({ ...smtpForm, [e.target.name]: value });
  };

  const updateUserDetails = async () => {
    try {
      const res = await adminApi.patch(`/admin/user/update/${id}`, form);
      setUser(res.data.data);
      alert('User details updated successfully');
    } catch (err) {
      console.error(err);
      alert('Error updating user details');
    }
  };

  const changePassword = async () => {
    if (passwordForm.password !== passwordForm.confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    try {
      await adminApi.patch(`/admin/user/password/${id}`, { password: passwordForm.password });
      setPasswordForm({ password: '', confirmPassword: '' });
      alert('Password updated successfully');
    } catch (err) {
      console.error(err);
      alert('Error changing password');
    }
  };

  const updateSmtp = async () => {
    try {
      await adminApi.patch(`/admin/user/${id}/smtp`, smtpForm);
      alert('SMTP settings updated successfully');
    } catch (err) {
      console.error(err);
      alert('Error updating SMTP settings');
    }
  };

  // Capitalize first letter of each name part
  const formatFullName = (name: string) =>
    name
      .split(' ')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');

  if (loading || !user) return <div className="text-center py-10">Loading...</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header with Back Button + Name */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-full hover:bg-gray-100 transition"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h1 className="text-3xl font-bold text-gray-900">{formatFullName(user.fullname)}</h1>
        </div>
      </div>

      {/* Modern Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        {['details', 'password', 'smtp'].map((key) => {
          const label =
            key === 'details' ? 'Details' : key === 'password' ? 'Password' : 'SMTP';
          const isActive = tab === key;
          return (
            <button
              key={key}
              onClick={() => setTab(key as any)}
              className={`relative px-5 py-3 font-medium text-sm transition-all ${
                isActive
                  ? 'text-primary-600'
                  : 'text-gray-600 hover:text-primary-500'
              }`}
            >
              {label}
              {/* Animated underline */}
              <span
                className={`absolute left-0 bottom-0 h-[3px] w-full rounded-t-md transition-all duration-300 ${
                  isActive ? 'bg-primary-500 scale-x-100' : 'bg-transparent scale-x-0'
                }`}
                style={{ transformOrigin: 'center' }}
              />
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div className="space-y-6">
        {tab === 'details' && (
        <div className="bg-white p-6 rounded-lg shadow space-y-4">
            <div>
            <label className="block text-sm font-medium text-gray-700">Full Name</label>
            <input
                type="text"
                name="fullname"
                value={form.fullname}
                onChange={handleFormChange}
                className="mt-1 block w-full border rounded p-2"
            />
            </div>

            <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleFormChange}
                className="mt-1 block w-full border rounded p-2"
            />
            </div>

            <div>
            <label className="block text-sm font-medium text-gray-700">Phone</label>
            <input
                type="text"
                name="phone"
                value={form.phone}
                onChange={handleFormChange}
                className="mt-1 block w-full border rounded p-2"
            />
            </div>

            <div>
            <label className="inline-flex items-center mt-2">
                <input
                type="checkbox"
                name="status"
                checked={form.status}
                onChange={e => setForm({ ...form, status: e.target.checked })}
                className="mr-2"
                />
                Active
            </label>
            </div>

            <div className="pt-2">
            <Button onClick={updateUserDetails} variant="primary">
                Update Details
            </Button>
            </div>
        </div>
        )}


        {tab === 'password' && (
          <div className="bg-white p-6 rounded-lg shadow space-y-4">
            <label className="block text-sm font-medium text-gray-700">New Password</label>
            <input type="password" name="password" value={passwordForm.password} onChange={handlePasswordChange} className="mt-1 block w-full border rounded p-2" />

            <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
            <input type="password" name="confirmPassword" value={passwordForm.confirmPassword} onChange={handlePasswordChange} className="mt-1 block w-full border rounded p-2" />

            <Button onClick={changePassword} variant="primary">
              Change Password
            </Button>
          </div>
        )}

        {tab === 'smtp' && (
        <div className="bg-white p-6 rounded-lg shadow space-y-4">
            <div>
            <label className="block text-sm font-medium text-gray-700">SMTP Host</label>
            <input
                type="text"
                name="host"
                value={smtpForm.host}
                onChange={handleSmtpChange}
                className="mt-1 block w-full border rounded p-2"
            />
            </div>

            <div>
            <label className="block text-sm font-medium text-gray-700">Port</label>
            <input
                type="text"
                name="port"
                value={smtpForm.port}
                onChange={handleSmtpChange}
                className="mt-1 block w-full border rounded p-2"
            />
            </div>

            <div>
            <label className="block text-sm font-medium text-gray-700">User</label>
            <input
                type="text"
                name="user"
                value={smtpForm.user}
                onChange={handleSmtpChange}
                className="mt-1 block w-full border rounded p-2"
            />
            </div>

            <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
                type="password"
                name="pass"
                value={smtpForm.pass}
                onChange={handleSmtpChange}
                className="mt-1 block w-full border rounded p-2"
            />
            </div>

            <div>
            <label className="inline-flex items-center mt-2">
                <input
                type="checkbox"
                name="secure"
                checked={smtpForm.secure}
                onChange={handleSmtpChange}
                className="mr-2"
                />
                Secure (TLS)
            </label>
            </div>

            <div className="pt-2">
            <Button onClick={updateSmtp} variant="primary">
                Update SMTP
            </Button>
            </div>
        </div>
        )}

      </div>
    </div>
  );
};

export default AdminUserDetail;
