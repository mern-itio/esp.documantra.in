import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../components/AuthService/AuthContext';
import { eSignApi, subscriptionApi } from '../../services/apiHelper';
import { 
  TrendingDown, 
  TrendingUp, 
  ArrowRight, 
  CreditCard,
  Zap,
  Loader2
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

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
          subscriptionApi.get('/usage/records?limit=30'),
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

  // Helper function to categorize module from action
  const getModuleFromAction = (action: string, toolId?: string): string => {
    if (!action) return 'Other';
    const actionLower = action.toLowerCase();
    
    if (actionLower.startsWith('esign:') || actionLower.includes('envelope') || actionLower.includes('sign')) {
      return 'E-Sign';
    }
    if (actionLower.startsWith('pdf:') || toolId?.toLowerCase().includes('pdf')) {
      return 'PDF Tools';
    }
    if (actionLower.startsWith('document:') || actionLower.includes('document') || actionLower.includes('share')) {
      return 'Document';
    }
    if (actionLower.startsWith('auth:') || actionLower.includes('auth')) {
      return 'Authentication';
    }
    return 'Other';
  };

  // Transform usage data for chart
  const chartData = useMemo(() => {
    if (!usage.length) return [];
    
    // Group by date and module, aggregate
    const grouped = usage.reduce((acc: any, record: any) => {
      const date = new Date(record.createdAt);
      const dateKey = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const dateTime = date.getTime();
      const module = getModuleFromAction(record.action, record.toolId);
      
      if (!acc[dateKey]) {
        acc[dateKey] = {
          date: dateKey,
          dateTime: dateTime,
          used: 0,
          added: 0,
          'E-Sign': 0,
          'PDF Tools': 0,
          'Document': 0,
          'Authentication': 0,
          'Other': 0,
          balance: record.balanceAfter,
          count: 0
        };
      }
      
      if (record.creditsDelta < 0) {
        const creditsUsed = Math.abs(record.creditsDelta);
        acc[dateKey].used += creditsUsed;
        acc[dateKey][module] = (acc[dateKey][module] || 0) + creditsUsed;
      } else {
        acc[dateKey].added += record.creditsDelta;
      }
      acc[dateKey].balance = record.balanceAfter;
      acc[dateKey].count += 1;
      
      return acc;
    }, {});
    
    // Convert to array and sort by date
    return Object.values(grouped)
      .sort((a: any, b: any) => a.dateTime - b.dateTime)
      .slice(-7); // Show last 7 days
  }, [usage]);

  // Calculate module totals for summary
  const moduleTotals = useMemo(() => {
    const totals: Record<string, number> = {
      'E-Sign': 0,
      'PDF Tools': 0,
      'Document': 0,
      'Authentication': 0,
      'Other': 0
    };
    
    usage.forEach((record) => {
      if (record.creditsDelta < 0) {
        const module = getModuleFromAction(record.action, record.toolId);
        totals[module] = (totals[module] || 0) + Math.abs(record.creditsDelta);
      }
    });
    
    return totals;
  }, [usage]);

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
          {/* <div className="flex items-center gap-3">
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
          </div> */}
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card */}
        <div className="bg-white rounded-sm shadow-sm border border-slate-100 p-5 hover:shadow-md transition-shadow">
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
        <div className="bg-white rounded-sm shadow-sm border border-slate-100 p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-green-50 text-green-600">✅</div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Completed Envelopes</p>
                <p className="text-2xl font-semibold text-slate-900 mt-1">
                  {envStatesLoading ? '—' : envelopeStats?.completedEnvelopes}
                </p>
              </div>
            </div>
            <span className="text-[10px] px-2 py-1 rounded-full bg-green-50 text-green-600">Done</span>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-sm shadow-sm border border-slate-100 p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-yellow-50 text-yellow-700">⏳</div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Pending Envelopes</p>
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
          <div className="bg-white rounded-sm shadow-sm border border-slate-100 p-5 hover:shadow-md transition-shadow">
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
          ) : chartData.length > 0 ? (
            <div className="space-y-6">
              {/* Chart */}
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorUsed" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorAdded" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#6b7280"
                      style={{ fontSize: '12px' }}
                    />
                    <YAxis 
                      stroke="#6b7280"
                      style={{ fontSize: '12px' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        padding: '12px'
                      }}
                      formatter={(value: any, name: string) => {
                        if (name === 'used') return [`${value} credits`, 'Credits Used'];
                        if (name === 'added') return [`${value} credits`, 'Credits Added'];
                        return [value, name];
                      }}
                      labelFormatter={(label) => `Date: ${label}`}
                    />
                    <Legend 
                      formatter={(value) => {
                        if (value === 'used') return 'Credits Used';
                        if (value === 'added') return 'Credits Added';
                        return value;
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="used" 
                      stroke="#ef4444" 
                      fillOpacity={1} 
                      fill="url(#colorUsed)"
                      strokeWidth={2}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="added" 
                      stroke="#10b981" 
                      fillOpacity={1} 
                      fill="url(#colorAdded)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Summary Stats */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-red-50">
                      <TrendingDown className="w-4 h-4 text-red-600" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Total Used</p>
                      <p className="text-lg font-semibold text-slate-900">
                        {chartData.reduce((sum: number, d: any) => sum + d.used, 0)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-50">
                      <TrendingUp className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Total Added</p>
                      <p className="text-lg font-semibold text-slate-900">
                        {chartData.reduce((sum: number, d: any) => sum + d.added, 0)}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Module Breakdown */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {Object.entries(moduleTotals).map(([module, total]) => {
                    if (total === 0) return null;
                    const colors: Record<string, { bg: string; text: string }> = {
                      'E-Sign': { bg: 'bg-blue-50', text: 'text-blue-600' },
                      'PDF Tools': { bg: 'bg-green-50', text: 'text-green-600' },
                      'Document': { bg: 'bg-purple-50', text: 'text-purple-600' },
                      'Authentication': { bg: 'bg-amber-50', text: 'text-amber-600' },
                      'Other': { bg: 'bg-slate-50', text: 'text-slate-600' }
                    };
                    const color = colors[module] || colors['Other'];
                    
                    return (
                      <div key={module} className={`p-3 rounded-lg ${color.bg} border border-slate-100`}>
                        <p className="text-xs font-medium text-slate-600 mb-1">{module}</p>
                        <p className={`text-base font-semibold ${color.text}`}>{total}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="p-4 rounded-full bg-slate-100 mb-3">
                <Zap className="w-6 h-6 text-slate-400" />
              </div>
              <p className="text-sm font-medium text-slate-700 mb-1">No chart data available</p>
              <p className="text-xs text-slate-500">Your credit transactions will appear here</p>
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
