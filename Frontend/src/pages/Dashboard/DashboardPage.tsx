import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../components/AuthService/AuthContext';
import { eSignApi, subscriptionApi } from '../../services/apiHelper';
import {
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
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import AIAuditInsights from '../../components/ESign/AIAuditInsights';

const DashboardPage: React.FC = () => {
  const { user, accountType, dismissFirstLogin } = useAuth();
  const [showTutorial, setShowTutorial] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.isFirstLogin) {
      setShowTutorial(true);
    }
  }, [user]);

  const handleCloseTutorial = () => {
    setShowTutorial(false);
    dismissFirstLogin();
  };

  const handleFeatureClick = (feature: string) => {
    setShowTutorial(false);
    dismissFirstLogin();
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
  const [chartsReady, setChartsReady] = React.useState(false);

  React.useEffect(() => {
    if (loading) {
      setChartsReady(false);
      return undefined;
    }
    const frame = window.requestAnimationFrame(() => setChartsReady(true));
    return () => window.cancelAnimationFrame(frame);
  }, [loading, usage.length]);

  React.useEffect(() => {
    fetchAllEnvelopeStats();
  }, [accountType]);

  const fetchAllEnvelopeStats = async () => {
    try {
      setEnvStatesLoading(true);
      const response = await eSignApi.get(`/api/e-sign/envelope/all-stats/${accountType}`);
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
  }, [accountType]);

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
      'Document': 0
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
  // const pieChartData = useMemo(() => {
  //   return Object.entries(moduleTotals)
  //     .filter(([_, total]) => total > 0)
  //     .map(([name, value]) => ({ name, value }));
  // }, [moduleTotals]);

  const moduleBarData = useMemo(() => {
    return Object.entries(moduleTotals)
      .map(([name, value]) => ({ name, value: Number(value) || 0 }))
      .filter((entry) => Boolean(entry.name))
      .sort((a, b) => b.value - a.value);
  }, [moduleTotals]);

  const moduleBarChartData = useMemo(
    () => moduleBarData.filter((entry) => entry.value > 0),
    [moduleBarData]
  );

  const radarData = useMemo(() => {
    const used = chartData.reduce((sum: number, d: any) => sum + d.used, 0);
    const added = chartData.reduce((sum: number, d: any) => sum + d.added, 0);
    const total = Number(envelopeStats?.totalEnvelopes || 0);
    const completed = Number(envelopeStats?.completedEnvelopes || 0);
    const pending = Number(envelopeStats?.pendingEnvelopes || 0);
    const dynamic = {
      volumeMax: Math.max(10, total, completed + pending),
      queueMax: Math.max(5, pending, Math.ceil(total * 0.6)),
      creditMax: Math.max(50, Number(balance || 0), used, added),
      usageMax: Math.max(20, used, added),
    };
    const normalize = (n: number, max: number) => {
      const scaled = Math.min(100, Math.round((n / Math.max(1, max)) * 100));
      // Keep non-zero metrics visible in radar so "small but real" values are not invisible.
      return n > 0 ? Math.max(12, scaled) : 0;
    };
    return [
      { metric: 'Volume', value: normalize(total, dynamic.volumeMax) },
      { metric: 'Completed', value: normalize(completed, Math.max(1, total)) },
      { metric: 'Queue', value: normalize(pending, dynamic.queueMax) },
      { metric: 'Credits', value: normalize(Number(balance || 0), dynamic.creditMax) },
      { metric: 'Usage', value: normalize(used, dynamic.usageMax) },
      { metric: 'Topups', value: normalize(added, dynamic.usageMax) },
    ];
  }, [chartData, envelopeStats, balance]);

  const moduleChartColors: Record<string, string> = {
    'E-Sign': 'var(--chart-1)',
    'PDF Tools': 'var(--chart-2)',
    Document: 'var(--chart-3)',
    Authentication: 'var(--chart-4)',
    Other: 'var(--chart-5)',
  };

  const hasChartMetrics = useMemo(() => {
    const hasModuleUsage = moduleBarChartData.length > 0;
    const hasRadarMetrics = radarData.some((entry) => Number(entry.value) > 0);
    return hasModuleUsage || hasRadarMetrics;
  }, [moduleBarChartData, radarData]);

  return (
    <div className=" space-y-8">
      {/* Advanced Tutorial Modal */}
      {showTutorial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
          <div className="bg-card/95 backdrop-blur-sm  shadow-lg border border-border p-8 max-w-xl w-full relative text-card-foreground">
            <h2 className="text-3xl font-bold mb-4 text-center text-foreground">Welcome to Draft & Sign!</h2>
            <p className="text-lg text-muted-foreground mb-6 text-center">Our system can do the following things:</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <button onClick={() => handleFeatureClick('esign')} className="flex flex-col items-center p-6 bg-muted/60 rounded-lg border border-border hover:bg-muted transition">
                <span className="text-4xl mb-2">✍️</span>
                <span className="font-semibold text-primary">E-Signature</span>
                <span className="text-xs text-muted-foreground mt-1 text-center">Send, sign, and manage documents digitally</span>
              </button>
              <button onClick={() => handleFeatureClick('pdf')} className="flex flex-col items-center p-6 bg-muted/60 rounded-lg border border-border hover:bg-muted transition">
                <span className="text-4xl mb-2">📝</span>
                <span className="font-semibold text-chart-3">PDF Tools</span>
                <span className="text-xs text-muted-foreground mt-1 text-center">Edit, merge, split, and convert PDFs</span>
              </button>
              <button onClick={() => handleFeatureClick('sharing')} className="flex flex-col items-center p-6 bg-muted/60 rounded-lg border border-border hover:bg-muted transition">
                <span className="text-4xl mb-2">🔗</span>
                <span className="font-semibold text-chart-2">Document Sharing</span>
                <span className="text-xs text-muted-foreground mt-1 text-center">Securely share documents with others</span>
              </button>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-muted-foreground mb-2">or</span>
              <button
                className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold"
                onClick={handleCloseTutorial}
              >
                Explore the Dashboard
              </button>
            </div>
            <button
              className="absolute top-2 right-2 text-muted-foreground hover:text-foreground text-xl leading-none rounded-md p-1 hover:bg-muted"
              onClick={handleCloseTutorial}
              aria-label="Close tutorial"
            >
              &times;
            </button>
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Envelopes Card */}
        <div className="group relative bg-card rounded-xl border border-border p-6 hover:border-primary/35 hover:shadow-lg transition-all duration-300 overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-chart-5/25 to-chart-4/20 rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-chart-5 to-chart-4 shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all duration-300">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-primary/15 text-primary uppercase tracking-wide">All time</span>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Total Envelopes</p>
              <p className="text-3xl font-bold text-foreground mb-1">
                {envStatesLoading ? '—' : envelopeStats?.totalEnvelopes || 0}
              </p>
              <p className="text-xs text-muted-foreground">All documents</p>
            </div>
          </div>
        </div>

        {/* Completed Envelopes Card */}
        <div className="group relative bg-card rounded-xl border border-border p-6 hover:border-accent-green/50 hover:shadow-lg transition-all duration-300 overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-accent-green/15 to-accent-green/5 rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-accent-green to-emerald-600 shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all duration-300">
                <CheckCircle2 className="w-5 h-5 text-white" />
              </div>
              <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-accent-green/15 text-accent-green uppercase tracking-wide">Done</span>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Completed Envelopes</p>
              <p className="text-3xl font-bold text-foreground mb-1">
                {envStatesLoading ? '—' : envelopeStats?.completedEnvelopes || 0}
              </p>
              <div className="flex items-center gap-1.5">
                <Activity className="w-3 h-3 text-accent-green" />
                <p className="text-xs text-accent-green font-medium">{completionRate}% completion rate</p>
              </div>
            </div>
          </div>
        </div>

        {/* Pending Envelopes Card */}
        <div className="group relative bg-card rounded-xl border border-border p-6 hover:border-accent-orange/50 hover:shadow-lg transition-all duration-300 overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-accent-orange/15 to-accent-orange/5 rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-accent-orange to-amber-600 shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all duration-300">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-accent-orange/15 text-accent-orange uppercase tracking-wide">In queue</span>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Pending Envelopes</p>
              <p className="text-3xl font-bold text-foreground mb-1">
                {envStatesLoading ? '—' : (envelopeStats?.pendingEnvelopes ?? 0)}
              </p>
              <p className="text-xs text-muted-foreground">Awaiting action</p>
            </div>
          </div>
        </div>

        {/* Credits Balance Card */}
        <Link to="/credits-usage" className="group block">
          <div className="relative bg-card rounded-xl border border-border p-6 hover:border-primary/40 hover:shadow-lg transition-all duration-300 cursor-pointer h-full overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-primary/15 to-secondary/30 rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-chart-2 shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all duration-300">
                  <BarChart3 className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground uppercase tracking-wide">Billing</span>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Credits Balance</p>
                <p className="text-3xl font-bold text-foreground mb-1">{loading ? '—' : (balance ?? 0)}</p>
                <div className="flex items-center gap-1.5">
                  <ArrowUpRight className="w-3 h-3 text-primary" />
                  <p className="text-xs text-muted-foreground">Available credits</p>
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
          className="group bg-card border border-border rounded-xl p-5 flex items-center gap-4 hover:border-primary/40 hover:shadow-lg transition-all duration-300 text-left"
        >
          <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-chart-2 shadow-sm group-hover:shadow-md group-hover:scale-110 transition-all duration-300 flex-shrink-0">
            <Plus className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-foreground mb-0.5">Create Envelope</p>
            <p className="text-xs text-muted-foreground">Upload docs and add recipients</p>
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0" />
        </button>
        <button
          onClick={() => navigate('/e-sign/aggrement')}
          className="group bg-card border border-border rounded-xl p-5 flex items-center gap-4 hover:border-accent-green/50 hover:shadow-lg transition-all duration-300 text-left"
        >
          <div className="p-3 rounded-xl bg-gradient-to-br from-accent-green to-emerald-600 shadow-sm group-hover:shadow-md group-hover:scale-110 transition-all duration-300 flex-shrink-0">
            <FolderOpen className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-foreground mb-0.5">Manage Envelopes</p>
            <p className="text-xs text-muted-foreground">Track progress & resend</p>
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-accent-green group-hover:translate-x-1 transition-all flex-shrink-0" />
        </button>
        <button
          onClick={() => navigate('/credits-usage')}
          className="group bg-card border border-border rounded-xl p-5 flex items-center gap-4 hover:border-primary/40 hover:shadow-lg transition-all duration-300 text-left"
        >
          <div className="p-3 rounded-xl bg-gradient-to-br from-chart-3 to-chart-4 shadow-sm group-hover:shadow-md group-hover:scale-110 transition-all duration-300 flex-shrink-0">
            <CreditCard className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-foreground mb-0.5">Credits & Billing</p>
            <p className="text-xs text-muted-foreground">See usage and balance</p>
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0" />
        </button>
      </div>

      {/* Recent credit usage */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300">
        {/* Header */}
        <div className="px-6 pt-6 pb-5 border-b border-border bg-gradient-to-r from-muted/40 to-card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-chart-3 shadow-sm">
                <CreditCard className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Credit Usage Analytics</h2>
                <p className="text-sm text-muted-foreground mt-0.5">Track your credit transactions and usage patterns</p>
              </div>
            </div>
         
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
              <span className="ml-3 text-sm text-muted-foreground">Loading usage history...</span>
            </div>
          ) : usage.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="p-4 rounded-full bg-muted mb-3">
                <Zap className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground mb-1">No recent usage</p>
              <p className="text-xs text-muted-foreground">Your credit transactions will appear here</p>
            </div>
          ) : hasChartMetrics && chartsReady ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                {moduleBarChartData.length > 0 ? (
                <div className="xl:col-span-6 min-w-0 rounded-xl border border-border bg-gradient-to-br from-card to-muted/30 p-4">
                  <h3 className="text-sm font-bold text-foreground mb-3">Module Usage</h3>
                  <div className="h-72 w-full min-w-0">
                    <ResponsiveContainer width="100%" height={288} minWidth={0}>
                      <BarChart data={moduleBarChartData} layout="vertical" margin={{ left: 14, right: 10, top: 6, bottom: 6 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.55} />
                        <XAxis type="number" stroke="var(--muted-foreground)" style={{ fontSize: '11px' }} />
                        <YAxis dataKey="name" type="category" width={90} stroke="var(--muted-foreground)" style={{ fontSize: '11px' }} />
                        <Tooltip
                          cursor={{ fill: 'var(--muted)', opacity: 0.2 }}
                          content={({ active, payload, label }) => {
                            if (!active || !payload?.length) return null;
                            const raw = payload[0]?.value;
                            const n = typeof raw === 'number' ? raw : Number(raw);
                            const display = Number.isFinite(n) ? n.toLocaleString() : String(raw ?? '—');
                            return (
                              <div className="rounded-lg border border-border bg-card px-3 py-2.5 text-sm shadow-lg">
                                <p className="font-semibold leading-tight text-foreground">{label}</p>
                                <p className="mt-1.5 text-xs">
                                  <span className="text-muted-foreground">Usage: </span>
                                  <span className="font-semibold tabular-nums text-foreground">
                                    {display} credits
                                  </span>
                                </p>
                              </div>
                            );
                          }}
                        />
                        <Bar dataKey="value"  barSize={45} radius={[0, 6, 6, 0]}>
                        {moduleBarChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={moduleChartColors[entry.name] || 'var(--chart-1)'} />
                        ))}
                      </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                ) : null}
              
                {radarData.some((entry) => Number(entry.value) > 0) ? (
                <div className={`${moduleBarChartData.length > 0 ? 'xl:col-span-6' : 'xl:col-span-12'} min-w-0 rounded-xl border border-border bg-gradient-to-br from-card to-muted/30 p-4`}>
                  <h3 className="text-sm font-bold text-foreground mb-3">Credit Usage</h3>
                  <div className="h-72 w-full min-w-0">
                    <ResponsiveContainer width="100%" height={288} minWidth={0}>
                      <RadarChart data={radarData}>
                        <PolarGrid stroke="var(--border)" />
                        <PolarAngleAxis dataKey="metric" tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }} />
                        <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                        <Radar dataKey="value" stroke="var(--chart-5)" fill="var(--chart-4)" fillOpacity={0.35} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="p-4 rounded-full bg-muted mb-3">
                <Zap className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground mb-1">No chart data available</p>
              <p className="text-xs text-muted-foreground">Your credit transactions will appear here</p>
            </div>
          )}
        </div>

        {/* Footer */}
        {!loading && usage.length > 0 && (
          <div className="px-6 py-4 bg-gradient-to-r from-muted/40 to-card border-t border-border">
            <Link
              to="/credits-usage"
              className="flex items-center justify-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors group"
            >
              <span>View all credit transactions</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        )}
      </div>
      <div className="bg-muted/40 rounded-xl p-6 border border-border">
        <AIAuditInsights />
      </div>
    </div>
  );
};

export default DashboardPage;
