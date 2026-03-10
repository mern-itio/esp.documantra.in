import React, { useEffect, useState } from 'react';
import { ArrowLeft, Monitor, Smartphone, Globe, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../../services/apiHelper';

const SessionManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState<string | null>(null);

  useEffect(() => {
    const loadSessions = async () => {
      setLoading(true);
      try {
        const resp = await authApi.get('/api/auth/sessions');
        setSessions(resp.data?.sessions || []);
      } catch (e: any) {
        console.error('Failed to load sessions');
      } finally {
        setLoading(false);
      }
    };
    loadSessions();
  }, []);

  const handleRevokeSession = async (sessionId: string) => {
    setRevoking(sessionId);
    try {
      await authApi.post('/api/auth/sessions/revoke', { sessionId });
      setSessions(prev => prev.filter(s => s.sessionId !== sessionId));
    } catch (e) {
      console.error('Failed to revoke session', e);
    } finally {
      setRevoking(null);
    }
  };

  const getDeviceIcon = (deviceInfo: string) => {
    const info = deviceInfo.toLowerCase();
    if (info.includes('mobile') || info.includes('android') || info.includes('iphone')) return <Smartphone className="w-5 h-5 text-gray-500" />;
    if (info.includes('mac') || info.includes('windows') || info.includes('linux')) return <Monitor className="w-5 h-5 text-gray-500" />;
    return <Globe className="w-5 h-5 text-gray-500" />;
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Top Header */}
      <div className="bg-gradient-to-r from-[#260559] via-[#6b4c9c] to-[#6b39b8] text-white py-10 px-6">
        <div className="max-w-7xl mx-auto flex flex-col gap-4">
          <button 
            onClick={() => navigate('/account/profile')}
            className="flex items-center gap-2 text-white/80 hover:text-white transition-colors self-start text-sm"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Profile
          </button>
          <div>
            <h1 className="text-3xl font-semibold flex items-center gap-3">
              <ShieldCheck className="w-8 h-8" />
              Device & Session Management
            </h1>
            <p className="opacity-90 mt-2 max-w-2xl">
              Review devices that have logged into your account. Revoke access for any unrecognized devices to ensure your account stays secure.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Active Sessions</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 text-gray-600 text-sm font-medium border-b border-gray-200">
                  <th className="px-6 py-4">Device & Browser</th>
                  <th className="px-6 py-4">IP Address</th>
                  <th className="px-6 py-4">Last Active</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="w-6 h-6 border-2 border-[#4D0080] border-t-transparent rounded-full animate-spin"></div>
                        <p>Loading sessions...</p>
                      </div>
                    </td>
                  </tr>
                ) : sessions.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                      No active sessions found.
                    </td>
                  </tr>
                ) : (
                  sessions.map((session) => (
                    <tr key={session.sessionId} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gray-100 rounded-lg">
                            {getDeviceIcon(session.deviceInfo)}
                          </div>
                          <div className="flex flex-col max-w-[200px] sm:max-w-xs md:max-w-sm">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-900 truncate" title={session.deviceInfo}>
                                {session.deviceInfo}
                              </span>
                              {session.isCurrent && (
                                <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0">
                                  Current Device
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-gray-500 mt-0.5">
                              Started: {new Date(session.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600 font-mono bg-gray-50 px-2 py-1 rounded border border-gray-100">
                          {session.ipAddress}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(session.lastActive).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {!session.isCurrent ? (
                          <button
                            onClick={() => handleRevokeSession(session.sessionId)}
                            disabled={revoking === session.sessionId}
                            className="inline-flex items-center justify-center text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200 hover:border-red-300 px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {revoking === session.sessionId ? 'Logging out...' : 'Log out device'}
                          </button>
                        ) : (
                          <span className="text-sm text-gray-400 italic px-4 py-2">
                            Active
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionManagementPage;
