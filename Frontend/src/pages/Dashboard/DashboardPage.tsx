import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../components/AuthService/AuthContext';
import { eSignApi, subscriptionApi } from '../../services/apiHelper';
import { 
  TrendingDown, 
  TrendingUp, 
  ArrowRight, 
  Clock, 
  CreditCard,
  Zap,
  Loader2
} from 'lucide-react';

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
            <p className="text-white/80 text-sm mt-1">Welcome to Draft & Sign - manage envelopes and documents at a glance.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/e-sign/create')}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-sm transition-colors"
            >
              New Envelope
            </button>
            <button
              onClick={() => navigate('/e-sign/aggrement')}
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
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-50 to-purple-50">
                <CreditCard className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Recent Credit Usage</h2>
                <p className="text-xs text-slate-500 mt-0.5">Track your credit transactions</p>
              </div>
            </div>
            <Link 
              to="/credits-usage" 
              className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 font-medium transition-colors group"
            >
              <span>View details</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
              <span className="ml-3 text-sm text-slate-600">Loading usage history...</span>
            </div>
          ) : usage.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="p-4 rounded-full bg-slate-100 mb-3">
                <Zap className="w-6 h-6 text-slate-400" />
              </div>
              <p className="text-sm font-medium text-slate-700 mb-1">No recent usage</p>
              <p className="text-xs text-slate-500">Your credit transactions will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {usage.map((u, idx) => {
                const isDeduction = u.creditsDelta < 0;
                const actionName = u.action || 'usage';
                const toolName = u.toolId ? (toolNameByIdRef.current[u.toolId] || u.toolId) : '';
                const date = new Date(u.createdAt);
                const formattedDate = date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
                const formattedTime = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

                return (
                  <div 
                    key={idx} 
                    className="group relative flex items-center gap-4 rounded-xl px-4 py-3.5 bg-gradient-to-r from-slate-50/50 to-white border border-slate-100 hover:border-indigo-200 hover:shadow-sm transition-all duration-200 cursor-pointer"
                  >
                    {/* Status Indicator */}
                    <div className="flex-shrink-0">
                      <div className={`relative w-10 h-10 rounded-lg flex items-center justify-center ${
                        isDeduction 
                          ? 'bg-red-50 group-hover:bg-red-100' 
                          : 'bg-green-50 group-hover:bg-green-100'
                      } transition-colors`}>
                        {isDeduction ? (
                          <TrendingDown className="w-5 h-5 text-red-600" />
                        ) : (
                          <TrendingUp className="w-5 h-5 text-green-600" />
                        )}
                        <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                          isDeduction ? 'bg-red-500' : 'bg-green-500'
                        }`}></div>
                      </div>
                    </div>

                    {/* Action Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-slate-900 truncate">
                          {actionName}
                        </span>
                        {toolName && (
                          <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium">
                            {toolName}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{formattedDate}</span>
                        <span className="text-slate-300">•</span>
                        <span>{formattedTime}</span>
                      </div>
                    </div>

                    {/* Credit Amount */}
                    <div className="flex-shrink-0 flex items-center gap-2">
                      <div className={`px-3 py-1.5 rounded-lg font-bold text-sm ${
                        isDeduction
                          ? 'bg-red-50 text-red-600 group-hover:bg-red-100'
                          : 'bg-green-50 text-green-600 group-hover:bg-green-100'
                      } transition-colors`}>
                        {isDeduction ? '-' : '+'}{Math.abs(u.creditsDelta)}
                      </div>
                    </div>

                    {/* Hover Arrow */}
                    <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                     <Link to='/credits-usage'> <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" /></Link> 
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {!loading && usage.length > 0 && (
          <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100">
            <Link 
              to="/credits-usage"
              className="flex items-center justify-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors group"
            >
              <span>View all credit transactions</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
