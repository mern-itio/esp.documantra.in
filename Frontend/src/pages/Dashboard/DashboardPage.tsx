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
  Loader2,
  FileText,
  CheckCircle2,
  Clock,
  BarChart3,
  Plus,
  FolderOpen,
  Activity,
  ArrowUpRight
} from 'lucide-react';
import { AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

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
  const [userPlan, setUserPlan] = React.useState<any>(null);

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
        const [bRes, uRes, planRes] = await Promise.all([
          subscriptionApi.get('/usage/balance'),
          subscriptionApi.get('/usage/records?limit=30'),
          subscriptionApi.get('/user-plan/me').catch(() => null), // Fetch plan info, ignore errors
        ]);
        if (!mounted) return;
        setBalance((bRes as any).data?.data?.creditsBalance ?? null);
        try {
          const raw = localStorage.getItem('toolCatalogNameMap');
          toolNameByIdRef.current = raw ? JSON.parse(raw) : {};
        } catch { toolNameByIdRef.current = {}; }
        setUsage(((uRes as any).data?.data?.records || []).map((r: any) => ({ action: r.action, creditsDelta: r.creditsDelta, balanceAfter: r.balanceAfter, createdAt: r.createdAt, toolId: r.toolId })));
        // Store user plan if available
        if (planRes && (planRes as any).data?.data) {
          setUserPlan((planRes as any).data.data);
        }
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
    // Group by date and module, aggregate
    const grouped: Record<string, any> = {};
    
    // First, process all usage records
    usage.forEach((record: any) => {
      const date = new Date(record.createdAt);
      const dateKey = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const dateTime = date.getTime();
      const module = getModuleFromAction(record.action, record.toolId);
      
      if (!grouped[dateKey]) {
        grouped[dateKey] = {
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
        grouped[dateKey].used += creditsUsed;
        grouped[dateKey][module] = (grouped[dateKey][module] || 0) + creditsUsed;
      } else {
        grouped[dateKey].added += record.creditsDelta;
      }
      grouped[dateKey].balance = record.balanceAfter;
      grouped[dateKey].count += 1;
    });
    
    // Add plan upgrade credits if periodStart is within last 7 days
    if (userPlan?.periodStart && userPlan?.conversionsLimit) {
      const periodStartDate = new Date(userPlan.periodStart);
      const now = new Date();
      const daysDiff = Math.floor((now.getTime() - periodStartDate.getTime()) / (1000 * 60 * 60 * 24));
      
      // If periodStart is within the last 7 days, add plan credits as "added"
      if (daysDiff >= 0 && daysDiff < 7) {
        const upgradeDateKey = periodStartDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const upgradeDateTime = periodStartDate.getTime();
        const planCredits = userPlan.conversionsLimit || 0;
        
        if (!grouped[upgradeDateKey]) {
          grouped[upgradeDateKey] = {
            date: upgradeDateKey,
            dateTime: upgradeDateTime,
            used: 0,
            added: 0,
            'E-Sign': 0,
            'PDF Tools': 0,
            'Document': 0,
            'Authentication': 0,
            'Other': 0,
            balance: userPlan.creditsBalance || 0,
            count: 0
          };
        }
        
        // Add plan credits as "added" credits on the upgrade date
        grouped[upgradeDateKey].added += planCredits;
      }
    }
    
    // Convert to array and sort by date
    const result = Object.values(grouped)
      .sort((a: any, b: any) => a.dateTime - b.dateTime)
      .slice(-7); // Show last 7 days
    
    return result;
  }, [usage, userPlan]);

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

  // Calculate completion rate
  const completionRate = useMemo(() => {
    if (!envelopeStats?.totalEnvelopes || envelopeStats.totalEnvelopes === 0) return 0;
    return Math.round((envelopeStats.completedEnvelopes / envelopeStats.totalEnvelopes) * 100);
  }, [envelopeStats]);

  // Prepare data for pie chart (usage by module)
  const pieChartData = useMemo(() => {
    return Object.entries(moduleTotals)
      .filter(([_, total]) => total > 0)
      .map(([name, value]) => ({ name, value }));
  }, [moduleTotals]);

  const PIE_COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#6b7280'];

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
      {/* <div className="rounded-sm bg-gradient-to-r from-[#1D2D80] via-[#2759A5] to-[#4AB6E4] text-white p-6 shadow-md">
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
      </div> */}

      {/* KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Envelopes Card */}
        <div className="group relative bg-white rounded-xl border border-slate-200 p-6 hover:border-blue-300 hover:shadow-lg transition-all duration-300 overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all duration-300">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 uppercase tracking-wide">All time</span>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Total Envelopes</p>
              <p className="text-3xl font-bold text-slate-900 mb-1">
                {envStatesLoading ? '—' : envelopeStats?.totalEnvelopes || 0}
              </p>
              <p className="text-xs text-slate-400">All documents</p>
            </div>
          </div>
        </div>

        {/* Completed Envelopes Card */}
        <div className="group relative bg-white rounded-xl border border-slate-200 p-6 hover:border-green-300 hover:shadow-lg transition-all duration-300 overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-green-50 to-green-100/50 rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-green-600 shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all duration-300">
                <CheckCircle2 className="w-5 h-5 text-white" />
              </div>
              <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-green-50 text-green-700 uppercase tracking-wide">Done</span>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Completed Envelopes</p>
              <p className="text-3xl font-bold text-slate-900 mb-1">
                {envStatesLoading ? '—' : envelopeStats?.completedEnvelopes || 0}
              </p>
              <div className="flex items-center gap-1.5">
                <Activity className="w-3 h-3 text-green-600" />
                <p className="text-xs text-green-600 font-medium">{completionRate}% completion rate</p>
              </div>
            </div>
          </div>
        </div>

        {/* Pending Envelopes Card */}
        <div className="group relative bg-white rounded-xl border border-slate-200 p-6 hover:border-amber-300 hover:shadow-lg transition-all duration-300 overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all duration-300">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 uppercase tracking-wide">In queue</span>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Pending Envelopes</p>
              <p className="text-3xl font-bold text-slate-900 mb-1">
                {envStatesLoading ? '—' : (envelopeStats?.pendingEnvelopes ?? 0)}
              </p>
              <p className="text-xs text-slate-400">Awaiting action</p>
            </div>
          </div>
        </div>

        {/* Credits Balance Card */}
        <Link to="/credits-usage" className="group block">
          <div className="relative bg-white rounded-xl border border-slate-200 p-6 hover:border-purple-300 hover:shadow-lg transition-all duration-300 cursor-pointer h-full overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all duration-300">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 uppercase tracking-wide">Billing</span>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Credits Balance</p>
                <p className="text-3xl font-bold text-slate-900 mb-1">{loading ? '—' : (balance ?? 0)}</p>
                <div className="flex items-center gap-1.5">
                  <ArrowUpRight className="w-3 h-3 text-purple-600" />
                  <p className="text-xs text-slate-400">Available credits</p>
                </div>
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <button 
          onClick={() => navigate('/e-sign/create')} 
          className="group bg-white border border-slate-200 rounded-xl p-5 flex items-center gap-4 hover:border-indigo-300 hover:shadow-lg transition-all duration-300 text-left"
        >
          <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-sm group-hover:shadow-md group-hover:scale-110 transition-all duration-300 flex-shrink-0">
            <Plus className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-900 mb-0.5">Create Envelope</p>
            <p className="text-xs text-slate-500">Upload docs and add recipients</p>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all flex-shrink-0" />
        </button>
        <button 
          onClick={() => navigate('/e-sign/aggrement')} 
          className="group bg-white border border-slate-200 rounded-xl p-5 flex items-center gap-4 hover:border-emerald-300 hover:shadow-lg transition-all duration-300 text-left"
        >
          <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-sm group-hover:shadow-md group-hover:scale-110 transition-all duration-300 flex-shrink-0">
            <FolderOpen className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-900 mb-0.5">Manage Envelopes</p>
            <p className="text-xs text-slate-500">Track progress & resend</p>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all flex-shrink-0" />
        </button>
        <button 
          onClick={() => navigate('/credits-usage')} 
          className="group bg-white border border-slate-200 rounded-xl p-5 flex items-center gap-4 hover:border-purple-300 hover:shadow-lg transition-all duration-300 text-left"
        >
          <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-sm group-hover:shadow-md group-hover:scale-110 transition-all duration-300 flex-shrink-0">
            <CreditCard className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-900 mb-0.5">Credits & Billing</p>
            <p className="text-xs text-slate-500">See usage and balance</p>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all flex-shrink-0" />
        </button>
      </div>

      {/* Recent credit usage */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300">
        {/* Header */}
        <div className="px-6 pt-6 pb-5 border-b border-slate-200 bg-gradient-to-r from-slate-50/50 to-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-sm">
                <CreditCard className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Credit Usage Analytics</h2>
                <p className="text-sm text-slate-500 mt-0.5">Track your credit transactions and usage patterns</p>
              </div>
            </div>
            <Link 
              to="/credits-usage" 
              className="flex items-center gap-2 px-4 py-2 text-sm text-indigo-600 hover:text-indigo-700 font-semibold transition-all hover:bg-indigo-50 rounded-lg group"
            >
              <span>View details</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
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
              {/* Charts Grid - Area Chart (Left, Wider) and Pie Chart (Right, Narrower) */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Area Chart - Credit Usage Trend (Left, Wider) */}
                <div className="lg:col-span-2">
                  <div className="mb-4">
                    <h3 className="text-sm font-bold text-slate-900 mb-1">Usage Trend (Last 7 Days)</h3>
                    <p className="text-xs text-slate-500">Credits used and added over time</p>
                  </div>
                  <div className="h-80 bg-gradient-to-br from-slate-50/30 to-white rounded-lg p-4 border border-slate-100">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                        <defs>
                          <linearGradient id="colorUsed" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorAdded" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                        <XAxis 
                          dataKey="date" 
                          stroke="#64748b"
                          style={{ fontSize: '11px', fontWeight: 500 }}
                          tickLine={false}
                        />
                        <YAxis 
                          stroke="#64748b"
                          style={{ fontSize: '11px', fontWeight: 500 }}
                          tickLine={false}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'white', 
                            border: '1px solid #e2e8f0',
                            borderRadius: '10px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                            padding: '10px 14px'
                          }}
                          formatter={(value: any, name: string) => {
                            if (name === 'used') return [`${value} credits`, 'Credits Used'];
                            if (name === 'added') return [`${value} credits`, 'Credits Added'];
                            return [value, name];
                          }}
                          labelFormatter={(label) => `Date: ${label}`}
                        />
                        <Legend 
                          wrapperStyle={{ paddingTop: '10px' }}
                          iconType="circle"
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
                          strokeWidth={2.5}
                          name="used"
                        />
                        <Area 
                          type="monotone" 
                          dataKey="added" 
                          stroke="#10b981" 
                          fillOpacity={1} 
                          fill="url(#colorAdded)"
                          strokeWidth={2.5}
                          name="added"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Pie Chart - Usage by Module (Right, Narrower) */}
                {pieChartData.length > 0 && (
                  <div>
                    <div className="mb-4">
                      <h3 className="text-sm font-bold text-slate-900 mb-1">Usage by Module</h3>
                      <p className="text-xs text-slate-500">Credit distribution</p>
                    </div>
                    <div className="h-80 bg-gradient-to-br from-slate-50/30 to-white rounded-lg p-4 border border-slate-100 flex flex-col items-center justify-center">
                      <ResponsiveContainer width="100%" height="85%">
                        <PieChart>
                          <Pie
                            data={pieChartData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ percent }: any) => `${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {pieChartData.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'white', 
                              border: '1px solid #e2e8f0',
                              borderRadius: '10px',
                              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                              padding: '10px 14px'
                            }}
                            formatter={(value: any, name: string) => [`${value} credits`, name]}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="w-full mt-2 flex flex-wrap items-center justify-center gap-3 px-2">
                        {pieChartData.map((entry: any, index: number) => (
                          <div key={entry.name} className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full flex-shrink-0" 
                              style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                            />
                            <span className="text-xs font-medium text-slate-700 whitespace-nowrap">
                              {entry.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Summary Stats */}
              <div className="space-y-5 pt-5 border-t border-slate-200">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-red-50 to-red-100/30 rounded-lg p-4 border border-red-200/50 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 rounded-lg bg-red-500">
                        <TrendingDown className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-red-700 uppercase tracking-wide">Total Used</p>
                        <p className="text-2xl font-bold text-red-900 mt-0.5">
                          {chartData.reduce((sum: number, d: any) => sum + d.used, 0)}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-red-600/80 ml-12">credits consumed</p>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-green-100/30 rounded-lg p-4 border border-green-200/50 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 rounded-lg bg-green-500">
                        <TrendingUp className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-green-700 uppercase tracking-wide">Total Added</p>
                        <p className="text-2xl font-bold text-green-900 mt-0.5">
                          {chartData.reduce((sum: number, d: any) => sum + d.added, 0)}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-green-600/80 ml-12">credits purchased</p>
                  </div>
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
          <div className="px-6 py-4 bg-gradient-to-r from-slate-50/50 to-white border-t border-slate-200">
            <Link 
              to="/credits-usage"
              className="flex items-center justify-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors group"
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
