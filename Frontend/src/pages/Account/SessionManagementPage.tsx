import React, { useEffect, useState } from 'react';
import { Monitor, Smartphone, Globe, ShieldCheck } from 'lucide-react';
import { authApi } from '../../services/apiHelper';
import { PageShell, PageHero, PagePanel, EmptyState } from '../../components/common/PageShell';

const SessionManagementPage: React.FC = () => {
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
      } catch {
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
    if (info.includes('mobile') || info.includes('android') || info.includes('iphone')) return <Smartphone className="h-5 w-5 text-primary" />;
    if (info.includes('mac') || info.includes('windows') || info.includes('linux')) return <Monitor className="h-5 w-5 text-primary" />;
    return <Globe className="h-5 w-5 text-primary" />;
  };

  return (
    <PageShell wide>
      <PageHero
        compact
        title="Device & session management"
        subtitle="Review signed-in devices and revoke access you don't recognize."
        backTo="/account/profile"
        badge={
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white/90">
            <ShieldCheck className="h-3 w-3" />
            Security
          </span>
        }
      />

      <PagePanel
        title="Active sessions"
        subtitle={
          maxConcurrentSessions != null
            ? `Up to ${maxConcurrentSessions} devices can stay signed in at once.`
            : undefined
        }
        noPadding
        bodyClassName="p-0"
      >
        {loading ? (
          <div className="flex justify-center py-14">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
          </div>
        ) : sessions.length === 0 ? (
          <EmptyState
            icon={ShieldCheck}
            title="No active sessions"
            description="When you sign in on a device, it will appear here."
            className="border-0 bg-transparent shadow-none"
          />
        ) : (
          <div className="divide-y divide-border/70">
            {sessions.map((session) => (
              <div key={session.sessionId} className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    {getDeviceIcon(session.deviceInfo || '')}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{session.deviceInfo || 'Unknown device'}</p>
                    <p className="text-sm text-muted-foreground">{session.ipAddress || 'IP unavailable'}</p>
                    <p className="text-xs text-muted-foreground">
                      Last active: {session.lastActiveAt ? new Date(session.lastActiveAt).toLocaleString() : '—'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRevokeSession(session.sessionId)}
                  disabled={revoking === session.sessionId}
                  className="dm-btn-secondary text-destructive hover:border-destructive/30 hover:bg-destructive/5"
                >
                  {revoking === session.sessionId ? 'Revoking…' : 'Revoke'}
                </button>
              </div>
            ))}
          </div>
        )}
      </PagePanel>
    </PageShell>
  );
};

export default SessionManagementPage;
