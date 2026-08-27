import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../components/AuthService/AuthContext';
import { eSignApi, subscriptionApi } from '../../services/apiHelper';
import {
  ArrowRight,
  CreditCard,
  Loader2,
  FileText,
  CheckCircle2,
  Clock,
  BarChart3,
  Plus,
  FolderOpen,
  PenLine,
  Share2,
  Sparkles,
  Layers,
  BookOpen,
  Key,
  type LucideIcon,
} from 'lucide-react';
import AIAuditInsights from '../../components/ESign/AIAuditInsights';
import { BRAND } from '../../config/brand';
import { toTitleCase } from '../../utils/formatName';
import { PageShell, SectionLabel } from '../../components/common/PageShell';
import { ENABLE_DEVELOPER_UI } from '../../config/environment';

type StatItem = {
  label: string;
  value: string | number;
  icon: LucideIcon;
  accent: string;
  glow: string;
  hint?: string;
  link?: string;
};

type ShortcutItem = {
  label: string;
  desc: string;
  icon: LucideIcon;
  path: string;
  accent: string;
};

const DashboardPage: React.FC = () => {
  const { user, accountType, dismissFirstLogin } = useAuth();
  const [showTutorial, setShowTutorial] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.isFirstLogin) setShowTutorial(true);
  }, [user]);

  const handleCloseTutorial = () => {
    setShowTutorial(false);
    dismissFirstLogin();
  };

  const handleFeatureClick = (feature: string) => {
    setShowTutorial(false);
    dismissFirstLogin();
    if (feature === 'esign') navigate('/e-sign/create');
    else if (feature === 'pdf') navigate('/pdf-tools');
    else if (feature === 'sharing') navigate('/all-documents');
  };

  const [balance, setBalance] = React.useState<number | null>(null);
  const [usage, setUsage] = React.useState<
    Array<{ action: string; creditsDelta: number; balanceAfter: number; createdAt: string; toolId?: string }>
  >([]);
  const [loading, setLoading] = React.useState(true);
  const [envStatesLoading, setEnvStatesLoading] = React.useState(true);
  const [envelopeStats, setEnvelopeStats] = React.useState<any>(null);

  React.useEffect(() => {
    fetchAllEnvelopeStats();
  }, [accountType]);

  const fetchAllEnvelopeStats = async () => {
    try {
      setEnvStatesLoading(true);
      const response = await eSignApi.get(`/api/e-sign/envelope/all-stats/${accountType}`);
      setEnvelopeStats(response.data);
    } catch (error: any) {
      const status = error?.response?.status;
      if (status !== 401 && status !== 403 && status !== 404) {
        console.error('Error fetching envelope stats:', error);
      }
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
        setUsage(
          ((uRes as any).data?.data?.records || []).map((r: any) => ({
            action: r.action,
            creditsDelta: r.creditsDelta,
            balanceAfter: r.balanceAfter,
            createdAt: r.createdAt,
            toolId: r.toolId,
          })),
        );
      } catch {
        if (!mounted) return;
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [accountType]);

  const getModuleFromAction = (action: string, toolId?: string): string => {
    const a = action.toLowerCase();
    if (a.startsWith('esign:') || a.includes('envelope') || a.includes('sign')) return 'E-Sign';
    if (a.startsWith('pdf:') || toolId?.toLowerCase().includes('pdf')) return 'PDF Tools';
    if (a.startsWith('document:') || a.includes('document')) return 'Document';
    return 'Other';
  };

  const moduleBarChartData = useMemo(() => {
    const totals: Record<string, number> = { 'E-Sign': 0, 'PDF Tools': 0, Document: 0 };
    usage.forEach((r) => {
      if (r.creditsDelta < 0) {
        const m = getModuleFromAction(r.action, r.toolId);
        totals[m] = (totals[m] || 0) + Math.abs(r.creditsDelta);
      }
    });
    return Object.entries(totals)
      .map(([name, value]) => ({ name, value }))
      .filter((e) => e.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [usage]);

  const moduleUsageMax = useMemo(
    () => Math.max(1, ...moduleBarChartData.map((e) => e.value)),
    [moduleBarChartData],
  );

  const completionRate = useMemo(() => {
    if (!envelopeStats?.totalEnvelopes) return 0;
    return Math.round((envelopeStats.completedEnvelopes / envelopeStats.totalEnvelopes) * 100);
  }, [envelopeStats]);

  const displayName = toTitleCase(user?.fullname || user?.email?.split('@')[0] || 'there');
  const hasEnvelopes = (envelopeStats?.totalEnvelopes ?? 0) > 0;
  const isNewUser = !envStatesLoading && !hasEnvelopes;
  const credits = loading ? '…' : (balance ?? 0);

  const dateLabel = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

  const stats: StatItem[] = [
    {
      label: 'Envelopes',
      value: envStatesLoading ? '—' : envelopeStats?.totalEnvelopes || 0,
      icon: FileText,
      accent: 'from-[#260559] to-[#5b3aa0]',
      glow: 'group-hover:shadow-[#260559]/20',
    },
    {
      label: 'Completed',
      value: envStatesLoading ? '—' : envelopeStats?.completedEnvelopes || 0,
      icon: CheckCircle2,
      accent: 'from-emerald-600 to-[#155E4B]',
      glow: 'group-hover:shadow-emerald-500/25',
      hint: `${completionRate}% rate`,
    },
    {
      label: 'Pending',
      value: envStatesLoading ? '—' : envelopeStats?.pendingEnvelopes ?? 0,
      icon: Clock,
      accent: 'from-amber-500 to-orange-500',
      glow: 'group-hover:shadow-amber-500/25',
    },
    {
      label: 'Credits',
      value: credits,
      icon: BarChart3,
      accent: 'from-[#155E4B] to-emerald-400',
      glow: 'group-hover:shadow-primary/25',
      link: '/credits-usage',
    },
  ];

  const apiKeysShortcut: ShortcutItem = {
    label: 'API keys',
    desc: 'Integrate your app',
    icon: Key,
    path: '/api-service/keys',
    accent: 'from-[#260559] to-violet-600',
  };

  const shortcuts: ShortcutItem[] = isNewUser
    ? [
        { label: 'PDF tools', desc: '66+ utilities', icon: Layers, path: '/pdf-tools', accent: 'from-emerald-600 to-teal-500' },
        { label: 'Documents', desc: 'Store & share', icon: Share2, path: '/all-documents', accent: 'from-[#260559] to-[#155E4B]' },
        { label: 'Setup guide', desc: '2 min walkthrough', icon: BookOpen, path: '/e-sign/guide', accent: 'from-violet-600 to-[#260559]' },
        ...(ENABLE_DEVELOPER_UI ? [apiKeysShortcut] : []),
      ]
    : [
        { label: 'Manage envelopes', desc: 'Track & remind', icon: FolderOpen, path: '/e-sign/aggrement', accent: 'from-[#260559] to-[#155E4B]' },
        { label: 'PDF tools', desc: '66+ utilities', icon: Layers, path: '/pdf-tools', accent: 'from-emerald-600 to-teal-500' },
        { label: 'Documents', desc: 'Store & share', icon: Share2, path: '/all-documents', accent: 'from-teal-600 to-emerald-500' },
        { label: 'Billing', desc: 'Usage & top-up', icon: CreditCard, path: '/credits-usage', accent: 'from-[#155E4B] to-emerald-400' },
        ...(ENABLE_DEVELOPER_UI ? [apiKeysShortcut] : []),
      ];

  const tutorialFeatures = [
    { id: 'esign', title: 'E-Signature', icon: PenLine },
    { id: 'pdf', title: 'PDF Tools', icon: FileText },
    { id: 'sharing', title: 'Documents', icon: Share2 },
  ];

  return (
    <PageShell>
      <div className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-[#155E4B]/12 blur-[80px]" />
      <div className="pointer-events-none absolute -right-20 top-32 h-56 w-56 rounded-full bg-[#260559]/10 blur-[70px]" />

      {showTutorial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#260559]/50 backdrop-blur-md" onClick={handleCloseTutorial} />
          <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/20 bg-card shadow-2xl">
            <div className="relative overflow-hidden bg-gradient-to-br from-[#155E4B] via-[#1a7058] to-[#260559] px-6 py-7 text-white">
              <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/15 blur-2xl" />
              <Sparkles className="mb-2 h-5 w-5 text-emerald-200" />
              <h2 className="text-xl font-bold tracking-tight">Welcome to {BRAND.name}</h2>
              <p className="mt-1 text-sm text-white/80">Choose once — we won&apos;t ask again.</p>
            </div>
            <div className="grid grid-cols-3 gap-2.5 p-4">
              {tutorialFeatures.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => handleFeatureClick(f.id)}
                  className="group flex flex-col items-center gap-2 rounded-2xl border border-border/80 bg-secondary/30 p-3.5 transition hover:border-primary/30 hover:bg-primary/5 hover:shadow-md"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-[#260559]/10 transition group-hover:scale-105">
                    <f.icon className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-[11px] font-bold text-foreground">{f.title}</span>
                </button>
              ))}
            </div>
            <div className="border-t border-border/80 px-4 py-3.5">
              <button
                type="button"
                className="w-full rounded-xl bg-gradient-to-r from-[#155E4B] to-[#260559] py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/20 transition hover:opacity-95"
                onClick={handleCloseTutorial}
              >
                Go to dashboard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hero — sole home for New envelope CTA */}
      <section className="relative overflow-hidden rounded-[1.25rem] border border-white/10 shadow-2xl shadow-[#155E4B]/25">
        <div className="absolute inset-0 bg-gradient-to-br from-[#155E4B] via-[#176b56] to-[#260559]" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:28px_28px]" />
        <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-emerald-300/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 left-1/4 h-40 w-40 rounded-full bg-[#260559]/30 blur-3xl" />

        <div className="relative flex flex-col gap-5 p-5 md:flex-row md:items-end md:justify-between md:gap-6 md:p-7">
          <div className="min-w-0 flex-1">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-white/90 backdrop-blur-md">
              <Sparkles className="h-3 w-3 text-emerald-200" />
              {dateLabel}
            </div>
            <h1 className="text-[1.65rem] font-black leading-tight tracking-tight text-white md:text-4xl">
              Hello,{' '}
              <span className="bg-gradient-to-r from-white via-emerald-50 to-emerald-200 bg-clip-text text-transparent">
                {displayName}
              </span>
            </h1>
            <p className="mt-2 max-w-lg text-sm leading-relaxed text-white/75 md:text-[15px]">
              {isNewUser
                ? `${BRAND.name} — secure e-signatures & document workflows, ready when you are.`
                : `Your ${BRAND.name} command center for signing and documents.`}
            </p>
          </div>

          {/* Decorative doc — desktop only, not a duplicate CTA */}
          <div className="pointer-events-none relative hidden h-28 w-36 shrink-0 md:block lg:h-32 lg:w-40">
            <div className="absolute inset-0 rotate-6 rounded-2xl border border-white/20 bg-white/10 p-3 shadow-xl backdrop-blur-md">
              <div className="mb-2 flex gap-1.5">
                <div className="h-2 w-2 rounded-full bg-emerald-300/80" />
                <div className="h-2 w-2 rounded-full bg-white/30" />
                <div className="h-2 w-2 rounded-full bg-white/30" />
              </div>
              <div className="space-y-1.5">
                <div className="h-1.5 w-full rounded-full bg-white/25" />
                <div className="h-1.5 w-4/5 rounded-full bg-white/15" />
                <div className="h-1.5 w-3/5 rounded-full bg-white/15" />
              </div>
              <div className="mt-3 inline-flex rounded-md bg-emerald-400/25 px-2 py-0.5 text-[9px] font-bold text-emerald-100">
                Signed
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate('/e-sign/create')}
            className="group relative inline-flex shrink-0 items-center justify-center gap-2.5 self-stretch overflow-hidden rounded-2xl bg-white px-6 py-3 text-sm font-bold text-[#155E4B] shadow-xl shadow-black/15 transition hover:scale-[1.02] hover:shadow-2xl active:scale-[0.98] md:self-end"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-emerald-50/0 via-emerald-100/50 to-emerald-50/0 opacity-0 transition group-hover:opacity-100" />
            <Plus className="relative h-4 w-4" />
            <span className="relative">New envelope</span>
          </button>
        </div>
      </section>

      {/* Main panel — stats + shortcuts */}
      <div className="overflow-hidden rounded-[1.25rem] border border-border/70 bg-card/80 shadow-lg shadow-black/[0.03] backdrop-blur-sm">
        <SectionLabel>Overview</SectionLabel>
        <div className="grid grid-cols-2 gap-3 px-4 pb-4 lg:grid-cols-4">
          {stats.map((s) => {
            const Icon = s.icon;
            const card = (
              <div
                className={`group relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-card to-secondary/20 p-4 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg ${s.glow}`}
              >
                <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${s.accent}`} />
                <div
                  className={`pointer-events-none absolute -right-4 -top-4 h-16 w-16 rounded-full bg-gradient-to-br ${s.accent} opacity-[0.08] blur-xl transition group-hover:opacity-[0.15]`}
                />
                <div className="relative flex items-center gap-3">
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${s.accent} text-white shadow-md`}>
                    <Icon className="h-[18px] w-[18px]" strokeWidth={2.25} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[1.65rem] font-black tabular-nums leading-none tracking-tight text-foreground">{s.value}</p>
                    <p className="mt-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      {s.label}
                      {s.hint ? <span className="ml-1 font-semibold normal-case text-foreground/40">· {s.hint}</span> : null}
                    </p>
                  </div>
                </div>
              </div>
            );
            return s.link ? (
              <Link key={s.label} to={s.link} className="block">
                {card}
              </Link>
            ) : (
              <div key={s.label}>{card}</div>
            );
          })}
        </div>

        <div className="mx-4 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

        <SectionLabel>Go to</SectionLabel>
        <div className={`grid gap-3 px-4 pb-4 sm:grid-cols-2 ${shortcuts.length >= 5 ? 'lg:grid-cols-3 xl:grid-cols-5' : 'lg:grid-cols-4'}`}>
          {shortcuts.map((a) => {
            const Icon = a.icon;
            return (
              <button
                key={a.label}
                type="button"
                onClick={() => navigate(a.path)}
                className="group relative flex items-center gap-3 overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-card to-secondary/10 p-4 text-left transition duration-300 hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-lg"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${a.accent} opacity-0 transition duration-300 group-hover:opacity-[0.06]`} />
                <div className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${a.accent} text-white shadow-md transition group-hover:scale-105 group-hover:shadow-lg`}>
                  <Icon className="h-[18px] w-[18px]" strokeWidth={2.25} />
                </div>
                <div className="relative min-w-0 flex-1">
                  <p className="text-sm font-bold text-foreground">{a.label}</p>
                  <p className="text-xs text-muted-foreground">{a.desc}</p>
                </div>
                <ArrowRight className="relative h-4 w-4 shrink-0 text-muted-foreground/30 transition group-hover:translate-x-0.5 group-hover:text-primary" />
              </button>
            );
          })}
        </div>
      </div>

      {(loading || moduleBarChartData.length > 0) && (
        <section className="overflow-hidden rounded-[1.25rem] border border-border/70 bg-card/80 p-5 shadow-lg shadow-black/[0.03] backdrop-blur-sm">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#155E4B] to-emerald-500 text-white shadow-sm">
                <BarChart3 className="h-4 w-4" />
              </div>
              <h2 className="text-sm font-bold text-foreground">Recent credit usage</h2>
            </div>
            {!loading && (
              <Link to="/credits-usage" className="text-xs font-bold text-primary transition hover:text-primary/80">
                Full history →
              </Link>
            )}
          </div>
          {loading ? (
            <div className="flex items-center gap-2.5 py-3 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              Loading activity…
            </div>
          ) : (
            <div className="space-y-4">
              {moduleBarChartData.map((entry) => {
                const pct = Math.round((entry.value / moduleUsageMax) * 100);
                const barGrad =
                  entry.name === 'E-Sign'
                    ? 'from-[#155E4B] to-emerald-400'
                    : entry.name === 'PDF Tools'
                      ? 'from-[#260559] to-violet-400'
                      : 'from-teal-600 to-emerald-300';
                return (
                  <div key={entry.name}>
                    <div className="mb-2 flex justify-between text-xs">
                      <span className="font-bold text-foreground">{entry.name}</span>
                      <span className="font-black tabular-nums text-primary">{entry.value} cr</span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-secondary/80">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${barGrad} transition-all duration-700 ease-out`}
                        style={{ width: `${Math.max(10, pct)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {hasEnvelopes && (
        <section className="overflow-hidden rounded-[1.25rem] border border-border/70 bg-card/80 p-4 shadow-lg backdrop-blur-sm">
          <AIAuditInsights />
        </section>
      )}
    </PageShell>
  );
};

export default DashboardPage;
