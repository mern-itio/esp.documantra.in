import React, { useEffect, useState } from 'react';
import { ArrowLeft, Monitor, Smartphone, Globe, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../../services/apiHelper';

const SessionManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<any[]>([]);
  const [maxConcurrentSessions, setMaxConcurrentSessions] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState<string | null>(null);

  useEffect(() => {
    const loadSessions = async () => {
      setLoading(true);
      try {
        const resp = await authApi.get('/api/auth/sessions');
        setSessions(resp.data?.sessions || []);
        if (typeof resp.data?.maxConcurrentSessions === 'number') {
          setMaxConcurrentSessions(resp.data.maxConcurrentSessions);
        }
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
    if (info.includes('mobile') || info.includes('android') || info.includes('iphone')) return <Smartphone className="h-5 w-5 text-muted-foreground" />;
    if (info.includes('mac') || info.includes('windows') || info.includes('linux')) return <Monitor className="h-5 w-5 text-muted-foreground" />;
    return <Globe className="h-5 w-5 text-muted-foreground" />;
  };

  return (
    <div className="min-h-screen bg-background pb-12">
      {/* Top Header */}
      <div className="bg-gradient-to-r from-primary via-primary/95 to-primary/80 px-6 py-10 text-primary-foreground">
        <div className="mx-auto flex max-w-7xl flex-col gap-4">
          <button
            type="button"
            onClick={() => navigate('/account/profile')}
            className="flex items-center gap-2 self-start text-sm text-primary-foreground/85 transition-colors hover:text-primary-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Profile
          </button>
          <div>
            <h1 className="flex items-center gap-3 text-3xl font-semibold">
              <ShieldCheck className="h-8 w-8 shrink-0" />
              Device & Session Management
            </h1>
            <p className="mt-2 max-w-2xl text-primary-foreground/90">
              Review devices that have logged into your account. Revoke access for any unrecognized devices to ensure your account stays secure.
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-8 max-w-7xl px-6">
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="border-b border-border p-6">
            <h2 className="text-lg font-semibold text-foreground">Active Sessions</h2>
            {maxConcurrentSessions != null && (
              <p className="mt-1 text-sm text-muted-foreground">
                Up to {maxConcurrentSessions} devices can stay signed in at once. Older sessions are signed out automatically when this limit is reached.
              </p>
            )}
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-sm font-medium text-muted-foreground">
                  <th className="px-6 py-4">Device & Browser</th>
                  <th className="px-6 py-4">IP Address</th>
                  <th className="px-6 py-4">Last Active</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                        <p>Loading sessions...</p>
                      </div>
                    </td>
                  </tr>
                ) : sessions.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                      No active sessions found.
                    </td>
                  </tr>
                ) : (
                  sessions.map((session) => (
                    <tr key={session.sessionId} className="transition-colors hover:bg-muted/40">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="rounded-lg bg-muted p-2">
                            {getDeviceIcon(session.deviceInfo)}
                          </div>
                          <div className="flex max-w-[200px] flex-col sm:max-w-xs md:max-w-sm">
                            <div className="flex items-center gap-2">
                              <span className="truncate text-sm font-medium text-foreground" title={session.deviceInfo}>
                                {session.deviceInfo}
                              </span>
                              {session.isCurrent && (
                                <span className="shrink-0 rounded-full border border-success/30 bg-success/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-success">
                                  Current Device
                                </span>
                              )}
                            </div>
                            <span className="mt-0.5 text-xs text-muted-foreground">
                              Started: {new Date(session.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="rounded border border-border bg-muted/50 px-2 py-1 font-mono text-sm text-foreground">
                          {session.ipAddress}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {new Date(session.lastActive).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {!session.isCurrent ? (
                          <button
                            type="button"
                            onClick={() => handleRevokeSession(session.sessionId)}
                            disabled={revoking === session.sessionId}
                            className="inline-flex items-center justify-center rounded-lg border border-destructive/35 px-4 py-2 text-sm font-medium text-destructive transition-colors hover:border-destructive/60 hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {revoking === session.sessionId ? 'Logging out...' : 'Log out device'}
                          </button>
                        ) : (
                          <span className="px-4 py-2 text-sm italic text-muted-foreground">
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
