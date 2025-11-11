import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../components/AuthService/AuthContext';
import { eSignApi, subscriptionApi } from '../../services/apiHelper';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [showTutorial, setShowTutorial] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.isFirstLogin) {
      setShowTutorial(true);
    }
  }, [user]);

  const handleCloseTutorial = () => {
    setShowTutorial(false);
    // Update localStorage so it doesn't show again
    try {
      const userData = localStorage.getItem('userData');
      if (userData) {
        const parsed = JSON.parse(userData);
        parsed.isFirstLogin = false;
        localStorage.setItem('userData', JSON.stringify(parsed));
      }
    } catch {}
  };

  const handleFeatureClick = (feature: string) => {
    setShowTutorial(false);
    // Optionally update localStorage as well
    try {
      const userData = localStorage.getItem('userData');
      if (userData) {
        const parsed = JSON.parse(userData);
        parsed.isFirstLogin = false;
        localStorage.setItem('userData', JSON.stringify(parsed));
      }
    } catch {}
    // Navigate to the selected feature
    if (feature === 'esign') navigate('/e-sign/dashboard');
    else if (feature === 'pdf') navigate('/pdf-tools');
    else if (feature === 'sharing') navigate('/document-sharing');
    // else do nothing (for dashboard explore)
  };
  const [balance, setBalance] = React.useState<number | null>(null);
  const [usage, setUsage] = React.useState<Array<{ action: string; creditsDelta: number; balanceAfter: number; createdAt: string; toolId?: string }>>([]);
  const toolNameByIdRef = React.useRef<Record<string, string>>({});
  const [loading, setLoading] = React.useState(true);
  const [envStatesLoading, setEnvStatesLoading] = React.useState(true);
  const [envelopeStats, setEnvelopeStats] = React.useState<any>(null);

  React.useEffect(() => {
    // get All envelope stats
    fetchAllEnvelopeStats();
  }
    , []);
  const fetchAllEnvelopeStats = async () => {
    try {
      setEnvStatesLoading(true);
      const response = await eSignApi.get('/api/e-sign/envelope/all-stats/user');
      const data = response.data;
      setEnvelopeStats(data);
      // Process the data as needed
    } catch (error) {
      console.error('Error fetching envelope stats:', error);
    } finally {
      setEnvStatesLoading(false);
    }
  };
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const [bRes, uRes] = await Promise.all([
          subscriptionApi.get('/usage/balance'),
          subscriptionApi.get('/usage/records?limit=5'),
        ]);
        if (!mounted) return;
        setBalance((bRes as any).data?.data?.creditsBalance ?? null);
        try {
          const raw = localStorage.getItem('toolCatalogNameMap');
          toolNameByIdRef.current = raw ? JSON.parse(raw) : {};
        } catch { toolNameByIdRef.current = {}; }
        setUsage(((uRes as any).data?.data?.records || []).map((r: any) => ({ action: r.action, creditsDelta: r.creditsDelta, balanceAfter: r.balanceAfter, createdAt: r.createdAt, toolId: r.toolId })));
      } catch {
        if (!mounted) return;
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="space-y-8">
      {/* Advanced Tutorial Modal */}
      {showTutorial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 backdrop-blur-[2px]"></div>
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-8 max-w-xl w-full relative">
            <h2 className="text-3xl font-bold mb-4 text-center">Welcome to Draft & Sign!</h2>
            <p className="text-lg text-gray-700 mb-6 text-center">Our system can do the following things:</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <button onClick={() => handleFeatureClick('esign')} className="flex flex-col items-center p-6 bg-blue-50 rounded-lg border border-blue-200 hover:bg-blue-100 transition">
                <span className="text-4xl mb-2">✍️</span>
                <span className="font-semibold text-blue-700">E-Signature</span>
                <span className="text-xs text-gray-500 mt-1 text-center">Send, sign, and manage documents digitally</span>
              </button>
              <button onClick={() => handleFeatureClick('pdf')} className="flex flex-col items-center p-6 bg-green-50 rounded-lg border border-green-200 hover:bg-green-100 transition">
                <span className="text-4xl mb-2">📝</span>
                <span className="font-semibold text-green-700">PDF Tools</span>
                <span className="text-xs text-gray-500 mt-1 text-center">Edit, merge, split, and convert PDFs</span>
              </button>
              <button onClick={() => handleFeatureClick('sharing')} className="flex flex-col items-center p-6 bg-purple-50 rounded-lg border border-purple-200 hover:bg-purple-100 transition">
                <span className="text-4xl mb-2">🔗</span>
                <span className="font-semibold text-purple-700">Document Sharing</span>
                <span className="text-xs text-gray-500 mt-1 text-center">Securely share documents with others</span>
              </button>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-gray-600 mb-2">or</span>
              <button
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                onClick={handleCloseTutorial}
              >
                Explore the Dashboard
              </button>
            </div>
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-xl"
              onClick={handleCloseTutorial}
              aria-label="Close tutorial"
            >
              &times;
            </button>
          </div>
        </div>
      )}
      {/* Top banner */}
      <div className="rounded-sm bg-gradient-to-r from-[#1D2D80] via-[#2759A5] to-[#4AB6E4] text-white p-6 shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Dashboard</h1>
            <p className="text-white/80 text-sm mt-1">Welcome to Draft & Sign — manage envelopes and documents at a glance.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/e-sign/create')}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-sm transition-colors"
            >
              New Envelope
            </button>
            <button
              onClick={() => navigate('/e-sign/dashboard')}
              className="px-4 py-2 bg-white text-indigo-700 font-medium rounded-lg text-sm hover:bg-slate-100 transition-colors"
            >
              Open E‑Sign
            </button>
          </div>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600">📄</div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Total Envelopes</p>
                <p className="text-2xl font-semibold text-slate-900 mt-1">
                  {envStatesLoading ? '—' : envelopeStats?.totalEnvelopes}
                </p>
              </div>
            </div>
            <span className="text-[10px] px-2 py-1 rounded-full bg-blue-50 text-blue-600">All time</span>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-green-50 text-green-600">✅</div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Completed</p>
                <p className="text-2xl font-semibold text-slate-900 mt-1">
                  {envStatesLoading ? '—' : envelopeStats?.completedEnvelopes}
                </p>
              </div>
            </div>
            <span className="text-[10px] px-2 py-1 rounded-full bg-green-50 text-green-600">Done</span>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-yellow-50 text-yellow-700">⏳</div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Pending</p>
                <p className="text-2xl font-semibold text-slate-900 mt-1">
                  {envStatesLoading ? '—' : (envelopeStats?.pendingEnvelopes ?? 0)}
                </p>
              </div>
            </div>
            <span className="text-[10px] px-2 py-1 rounded-full bg-yellow-50 text-yellow-700">In queue</span>
          </div>
        </div>

        {/* Card */}
        <Link to="/credits-usage">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-fuchsia-50 text-fuchsia-600">📊</div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Credits Balance</p>
                  <p className="text-2xl font-semibold text-slate-900 mt-1">{loading ? '—' : (balance ?? 0)}</p>
                </div>
              </div>
              <span className="text-[10px] px-2 py-1 rounded-full bg-fuchsia-50 text-fuchsia-600">Billing</span>
            </div>
          </div>
        </Link>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button onClick={() => navigate('/e-sign/create')} className="bg-white border border-slate-100 rounded-xl p-4 flex items-center gap-3 hover:shadow transition-shadow">
          <span className="text-indigo-600 text-lg">✍️</span>
          <div className="text-left">
            <p className="text-sm font-semibold text-slate-800">Create Envelope</p>
            <p className="text-xs text-slate-500">Upload docs and add recipients</p>
          </div>
        </button>
        <button onClick={() => navigate('/e-sign/aggrement')} className="bg-white border border-slate-100 rounded-xl p-4 flex items-center gap-3 hover:shadow transition-shadow">
          <span className="text-emerald-600 text-lg">📬</span>
          <div className="text-left">
            <p className="text-sm font-semibold text-slate-800">Manage Envelopes</p>
            <p className="text-xs text-slate-500">Track progress & resend</p>
          </div>
        </button>
        <button onClick={() => navigate('/credits-usage')} className="bg-white border border-slate-100 rounded-xl p-4 flex items-center gap-3 hover:shadow transition-shadow">
          <span className="text-fuchsia-600 text-lg">💳</span>
          <div className="text-left">
            <p className="text-sm font-semibold text-slate-800">Credits & Billing</p>
            <p className="text-xs text-slate-500">See usage and balance</p>
          </div>
        </button>
      </div>

      {/* Recent credit usage */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Recent Credit Usage</h2>
          <Link to="/credits-usage" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">View details</Link>
        </div>
        <div className="space-y-2 mb-2">
          {usage.length === 0 && !loading && (
            <p className="text-sm text-slate-600">No recent usage.</p>
          )}
          {usage.map((u, idx) => (
            <div key={idx} className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-slate-50">
              <div className={`w-2 h-2 rounded-full ${u.creditsDelta < 0 ? 'bg-red-500' : 'bg-green-500'}`}></div>
              <span className="text-sm text-slate-800">
                {u.action || 'usage'} {u.toolId ? <span className="text-slate-500">({toolNameByIdRef.current[u.toolId] || u.toolId})</span> : ''}
              </span>
              <span className={`text-sm ml-auto font-medium ${u.creditsDelta < 0 ? 'text-red-600' : 'text-green-600'}`}>{u.creditsDelta}</span>
              <span className="text-xs text-slate-400 ml-3">{new Date(u.createdAt).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
