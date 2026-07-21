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
import AIAuditInsights from '../../components/ESign/AIAuditInsights';
import { ChartErrorBoundary, CHART_HEX } from '../../components/common/ChartErrorBoundary';

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
      .map(([name, value]) => ({
        name: String(name || '').trim(),
        value: Number(value) || 0,
      }))
      .filter((entry) => entry.name.length > 0)
      .sort((a, b) => b.value - a.value);
  }, [moduleTotals]);

  const moduleBarChartData = useMemo(
    () => moduleBarData.filter((entry) => entry.value > 0 && entry.name),
    [moduleBarData]
  );

  const moduleChartColors: Record<string, string> = {
    'E-Sign': CHART_HEX.chart1,
    'PDF Tools': CHART_HEX.chart2,
    Document: CHART_HEX.chart3,
    Authentication: CHART_HEX.chart4,
    Other: CHART_HEX.chart5,
  };

  // Recharts removed from dashboard — its resize/color path crashes production
  // (`toUpperCase` on undefined) and escapes React error boundaries via event handlers.
  const moduleUsageMax = useMemo(
    () => Math.max(1, ...moduleBarChartData.map((entry) => Number(entry.value) || 0)),
    [moduleBarChartData]
  );

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
          ) : moduleBarChartData.length > 0 ? (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-foreground">Module Usage</h3>
              {moduleBarChartData.map((entry) => {
                const pct = Math.round((Number(entry.value) / moduleUsageMax) * 100);
                return (
                  <div key={entry.name} className="space-y-1.5">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="font-medium text-foreground">{entry.name}</span>
                      <span className="tabular-nums text-muted-foreground">{Number(entry.value).toLocaleString()} credits</span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.max(4, pct)}%`,
                          backgroundColor: moduleChartColors[entry.name] || CHART_HEX.chart1,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : usage.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="p-4 rounded-full bg-muted mb-3">
                <Zap className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground mb-1">No recent usage</p>
              <p className="text-xs text-muted-foreground">Your credit transactions will appear here</p>
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
        <ChartErrorBoundary>
          <AIAuditInsights />
        </ChartErrorBoundary>
      </div>
    </div>
  );
};

export default DashboardPage;
