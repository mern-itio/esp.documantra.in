import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../components/AuthService/AuthContext';
import { useTutorial } from '../../context/TutorialContext';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Eye,
  Users,
  Calendar,
  Search,
  RefreshCw,
  ArrowRight,
  Send,
  Filter,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { eSignApi } from '../../services/apiHelper';
import { claimPublicGuestEnvelopes } from '../../services/claimPublicGuestEnvelopes';
import AIAuditInsights from '../../components/ESign/AIAuditInsights';
import { PageShell, PageHero, PagePanel, StatTile, EmptyState } from '../../components/common/PageShell';
import { clsx } from '../../utils';

type EnvelopeStatus =
  | 'draft'
  | 'sent'
  | 'pending'
  | 'completed'
  | 'expired'
  | 'voided'
  | 'declined'
  | 'in-progress'
  | 'archived'
  | string;

const STATUS_META: Record<
  string,
  { label: string; badge: string; iconBg: string; Icon: typeof Clock }
> = {
  draft: { label: 'Draft', badge: 'dm-badge dm-badge--muted', iconBg: 'bg-muted text-muted-foreground', Icon: Clock },
  sent: { label: 'Sent', badge: 'dm-badge dm-badge--primary', iconBg: 'bg-primary/10 text-primary', Icon: Send },
  pending: { label: 'Pending', badge: 'dm-badge dm-badge--warning', iconBg: 'bg-amber-50 text-amber-700', Icon: Clock },
  completed: { label: 'Completed', badge: 'dm-badge dm-badge--success', iconBg: 'bg-emerald-50 text-emerald-700', Icon: CheckCircle },
  expired: { label: 'Expired', badge: 'dm-badge dm-badge--danger', iconBg: 'bg-red-50 text-red-700', Icon: AlertCircle },
  voided: { label: 'Voided', badge: 'dm-badge dm-badge--muted', iconBg: 'bg-muted text-muted-foreground', Icon: AlertCircle },
  declined: { label: 'Declined', badge: 'dm-badge dm-badge--danger', iconBg: 'bg-red-50 text-red-700', Icon: AlertCircle },
  'in-progress': { label: 'In progress', badge: 'dm-badge dm-badge--warning', iconBg: 'bg-amber-50 text-amber-700', Icon: Clock },
  archived: { label: 'Archived', badge: 'dm-badge dm-badge--danger', iconBg: 'bg-red-50 text-red-700', Icon: AlertCircle },
};

const FILTER_CHIPS: { id: string; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'needs-attention', label: 'Needs attention' },
  { id: 'draft', label: 'Drafts' },
  { id: 'in-progress', label: 'In progress' },
  { id: 'sent', label: 'Sent' },
  { id: 'completed', label: 'Completed' },
  { id: 'expired', label: 'Expired' },
];

function envelopeNeedsAttention(envelope: any) {
  return ['sent', 'pending', 'in-progress', 'expired', 'declined'].includes(envelope.status);
}

function getMeta(status: EnvelopeStatus) {
  return STATUS_META[status] || STATUS_META.draft;
}

const EnvelopeSkeleton = () => (
  <div className="dm-list-row animate-pulse">
    <div className="flex items-center gap-4">
      <div className="h-10 w-10 shrink-0 rounded-xl bg-muted" />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="h-4 w-[220px] max-w-full rounded bg-muted" />
        <div className="h-3 w-[320px] max-w-full rounded bg-muted/70" />
        <div className="h-1.5 w-full max-w-sm rounded-full bg-muted/60" />
      </div>
      <div className="hidden h-9 w-20 rounded-lg bg-muted sm:block" />
    </div>
  </div>
);

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    showTutorial,
    tutorialStep,
    setShowTutorial,
    handleNextStep,
    handlePrevStep,
    handleCloseTutorial,
  } = useTutorial();

  useEffect(() => {
    if (user?.isFirstLogin) {
      setShowTutorial(true);
    }
  }, [user]);

  const handleTutorialNext = async () => {
    await handleNextStep();
    navigate('/e-sign/create');
  };

  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('recent');
  const [searchQuery, setSearchQuery] = useState('');
  const [envelopes, setEnvelopes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState(false);

  useEffect(() => {
    fetchEnvelopes();
  }, []);

  const fetchEnvelopes = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setFetchError(false);
    try {
      await claimPublicGuestEnvelopes();
      const response = await eSignApi.get('/api/e-sign/get-envelopes');
      if (response.status == 200) {
        setEnvelopes(response.data.data || []);
      }
    } catch (error: any) {
      const status = error?.response?.status;
      if (status !== 401 && status !== 403 && status !== 404) {
        console.error('Error fetching envelopes:', error);
        setFetchError(true);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const counts = useMemo(() => {
    const pending = envelopes.filter((e) => e.status === 'sent' || e.status === 'in-progress' || e.status === 'pending').length;
    const completed = envelopes.filter((e) => e.status === 'completed').length;
    const drafts = envelopes.filter((e) => e.status === 'draft').length;
    const attention = envelopes.filter(envelopeNeedsAttention).length;
    const thisMonth = envelopes.filter((e) => {
      const created = new Date(e.createdAt);
      const now = new Date();
      return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
    }).length;
    return { total: envelopes.length, pending, completed, drafts, attention, thisMonth };
  }, [envelopes]);

  const filteredEnvelopes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return envelopes.filter((envelope) => {
      if (filterStatus === 'needs-attention') {
        if (!envelopeNeedsAttention(envelope)) return false;
      } else if (filterStatus !== 'all' && envelope.status !== filterStatus) {
        return false;
      }

      if (!q) return true;
      const subject = String(envelope.subject || '').toLowerCase();
      const message = String(envelope.message || '').toLowerCase();
      const recipients = (envelope.recipients || [])
        .map((r: any) => `${r.name || ''} ${r.email || ''}`.toLowerCase())
        .join(' ');
      return subject.includes(q) || message.includes(q) || recipients.includes(q);
    });
  }, [envelopes, filterStatus, searchQuery]);

  const sortedEnvelopes = useMemo(() => {
    return [...filteredEnvelopes].sort((a, b) => {
      if (sortBy === 'subject') return String(a.subject || '').localeCompare(String(b.subject || ''));
      if (sortBy === 'status') return String(a.status || '').localeCompare(String(b.status || ''));
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [filteredEnvelopes, sortBy]);

  const stats = [
    {
      name: 'Total',
      value: counts.total,
      icon: FileText,
      accent: 'from-[#260559] to-[#5b3aa0]',
      filter: 'all',
      hint: 'All envelopes',
    },
    {
      name: 'Needs attention',
      value: counts.attention,
      icon: Clock,
      accent: 'from-amber-500 to-orange-500',
      filter: 'needs-attention',
      hint: 'Waiting or stuck',
    },
    {
      name: 'Completed',
      value: counts.completed,
      icon: CheckCircle,
      accent: 'from-[#155E4B] to-emerald-500',
      filter: 'completed',
      hint: 'Fully signed',
    },
    {
      name: 'This month',
      value: counts.thisMonth,
      icon: Calendar,
      accent: 'from-teal-600 to-cyan-500',
      filter: 'all',
      hint: 'Created recently',
    },
  ];

  const chipCount = (id: string) => {
    if (id === 'all') return counts.total;
    if (id === 'needs-attention') return counts.attention;
    if (id === 'draft') return counts.drafts;
    if (id === 'completed') return counts.completed;
    if (id === 'in-progress') return envelopes.filter((e) => e.status === 'in-progress').length;
    if (id === 'sent') return envelopes.filter((e) => e.status === 'sent').length;
    if (id === 'expired') return envelopes.filter((e) => e.status === 'expired').length;
    return envelopes.filter((e) => e.status === id).length;
  };

  return (
    <PageShell wide>
      {showTutorial && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 backdrop-blur-[2px]" />
          <div
            className={`bg-[#F7F3EE]/90 backdrop-blur-sm rounded-xl shadow-lg p-8 max-w-lg w-full absolute transition-all duration-300 ease-in-out min-h-[340px] flex flex-col justify-between ${
              tutorialStep === 1
                ? 'top-24 right-8'
                : tutorialStep === 2
                  ? 'top-1/3 left-8'
                  : tutorialStep === 3
                    ? 'bottom-1/3 right-8'
                    : tutorialStep === 4
                      ? 'top-1/2 left-8'
                      : tutorialStep === 5
                        ? 'bottom-24 right-8'
                        : 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
            }`}
          >
            {tutorialStep === 0 && (
              <>
                <h2 className="text-2xl font-bold mb-4 text-center">Welcome to E-Signature!</h2>
                <p className="text-gray-700 text-center mb-6">
                  Digitally sign, send, and manage your documents with ease. Let's walk through the main features.
                </p>
                <div className="flex-1" />
                <div className="flex justify-end gap-2 mt-6">
                  <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700" onClick={handleNextStep}>
                    Start Tutorial
                  </button>
                </div>
              </>
            )}
            {tutorialStep === 1 && (
              <>
                <div className="relative">
                  <div className="absolute -top-16 right-8 w-16 h-16">
                    <div className="w-16 h-16 border-t-4 border-r-4 border-blue-500 rounded-tr-xl transform rotate-45 absolute" />
                  </div>
                  <h2 className="text-xl font-bold mb-4">Step 1: Create an Envelope</h2>
                  <p className="text-gray-700 mb-4">
                    Click <b>"Create Envelope"</b> to start a new signing workflow. You can upload documents, set a subject, and add a message for recipients.
                  </p>
                </div>
                <div className="flex-1" />
                <div className="flex justify-between gap-2 mt-6">
                  <button className="px-4 py-2 bg-gray-200 rounded-lg" onClick={handlePrevStep}>
                    Back
                  </button>
                  <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700" onClick={handleTutorialNext}>
                    Next
                  </button>
                </div>
              </>
            )}
            {tutorialStep === 2 && (
              <>
                <div className="relative">
                  <div className="absolute -left-16 top-8 w-16 h-16">
                    <div className="w-16 h-16 border-l-4 border-t-4 border-blue-500 rounded-tl-xl transform -rotate-45 absolute" />
                  </div>
                  <h2 className="text-xl font-bold mb-4">Step 2: Add Recipients</h2>
                  <p className="text-gray-700 mb-4">
                    Add one or more recipients and set their signing order. You can assign roles and add authentication if needed.
                  </p>
                </div>
                <div className="flex-1" />
                <div className="flex justify-between gap-2 mt-6">
                  <button className="px-4 py-2 bg-gray-200 rounded-lg" onClick={handlePrevStep}>
                    Back
                  </button>
                  <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700" onClick={handleNextStep}>
                    Next
                  </button>
                </div>
              </>
            )}
            {tutorialStep === 3 && (
              <>
                <div className="relative">
                  <div className="absolute -right-16 bottom-8 w-16 h-16">
                    <div className="w-16 h-16 border-r-4 border-b-4 border-blue-500 rounded-br-xl transform rotate-45 absolute" />
                  </div>
                  <h2 className="text-xl font-bold mb-4">Step 3: Send for Signature</h2>
                  <p className="text-gray-700 mb-4">
                    Once your envelope is ready, click <b>"Send"</b>. Recipients will receive an email to review and sign the document.
                  </p>
                </div>
                <div className="flex-1" />
                <div className="flex justify-between gap-2 mt-6">
                  <button className="px-4 py-2 bg-gray-200 rounded-lg" onClick={handlePrevStep}>
                    Back
                  </button>
                  <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700" onClick={handleNextStep}>
                    Next
                  </button>
                </div>
              </>
            )}
            {tutorialStep === 4 && (
              <>
                <div className="relative">
                  <div className="absolute -left-16 top-8 w-16 h-16">
                    <div className="w-16 h-16 border-l-4 border-t-4 border-blue-500 rounded-tl-xl transform -rotate-45 absolute" />
                  </div>
                  <h2 className="text-xl font-bold mb-4">Step 4: Track Status</h2>
                  <p className="text-gray-700 mb-4">
                    Monitor the status of your envelopes in real time. See who has signed, who is pending, and send reminders if needed.
                  </p>
                </div>
                <div className="flex-1" />
                <div className="flex justify-between gap-2 mt-6">
                  <button className="px-4 py-2 bg-gray-200 rounded-lg" onClick={handlePrevStep}>
                    Back
                  </button>
                  <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700" onClick={handleNextStep}>
                    Next
                  </button>
                </div>
              </>
            )}
            {tutorialStep === 5 && (
              <>
                <div className="relative">
                  <div className="absolute -right-16 bottom-8 w-16 h-16">
                    <div className="w-16 h-16 border-r-4 border-b-4 border-blue-500 rounded-br-xl transform rotate-45 absolute" />
                  </div>
                  <h2 className="text-xl font-bold mb-4">Step 5: Access Completed Documents</h2>
                  <p className="text-gray-700 mb-4">
                    Download or review signed documents anytime from your dashboard. All your completed envelopes are securely stored.
                  </p>
                </div>
                <div className="flex-1" />
                <div className="flex justify-between gap-2 mt-6">
                  <button className="px-4 py-2 bg-gray-200 rounded-lg" onClick={handlePrevStep}>
                    Back
                  </button>
                  <button className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700" onClick={handleCloseTutorial}>
                    Finish
                  </button>
                </div>
              </>
            )}
            <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-xl" onClick={handleCloseTutorial} aria-label="Close tutorial">
              &times;
            </button>
          </div>
        </div>
      )}

      <PageHero
        compact
        title="E-Sign Dashboard"
        subtitle="Find envelopes fast, track who still needs to sign, and jump back into drafts"
        action={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => fetchEnvelopes(true)}
              disabled={loading || refreshing}
              className="dm-btn-secondary border-white/25 bg-white/10 text-white hover:bg-white/20 hover:text-white"
              aria-label="Refresh envelopes"
            >
              <RefreshCw className={clsx('h-4 w-4', refreshing && 'animate-spin')} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <Link to="/e-sign/create" className="dm-btn-primary bg-white text-[#155E4B] hover:bg-white/90">
              <Plus className="h-4 w-4" />
              Create envelope
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {stats.map((stat) => (
          <button
            key={stat.name}
            type="button"
            onClick={() => setFilterStatus(stat.filter)}
            className={clsx(
              'rounded-2xl text-left transition ring-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
              filterStatus === stat.filter && 'ring-2 ring-primary/40',
            )}
          >
            <StatTile label={stat.name} value={stat.value} icon={stat.icon} accent={stat.accent} hint={stat.hint} />
          </button>
        ))}
      </div>

      <PagePanel noPadding bodyClassName="p-4 md:p-5">
        <div className="flex flex-col gap-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by subject, recipient name, or email…"
              className="dm-input w-full pl-10"
              aria-label="Search envelopes"
            />
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              <Filter className="hidden h-4 w-4 shrink-0 text-muted-foreground sm:block" />
              {FILTER_CHIPS.map((chip) => {
                const active = filterStatus === chip.id;
                const count = chipCount(chip.id);
                return (
                  <button
                    key={chip.id}
                    type="button"
                    onClick={() => setFilterStatus(chip.id)}
                    className={clsx(
                      'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition',
                      active
                        ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                        : 'border-border bg-background text-muted-foreground hover:border-primary/30 hover:text-foreground',
                    )}
                  >
                    {chip.label}
                    <span
                      className={clsx(
                        'rounded-full px-1.5 py-0.5 text-[10px] tabular-nums',
                        active ? 'bg-white/20' : 'bg-muted text-muted-foreground',
                      )}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="shrink-0 text-xs font-semibold uppercase tracking-wide">Sort</span>
              <select
                className="dm-input cursor-pointer py-2 sm:min-w-[160px]"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="recent">Most recent</option>
                <option value="subject">Subject A–Z</option>
                <option value="status">Status</option>
              </select>
            </label>
          </div>
        </div>
      </PagePanel>

      {envelopes.length > 0 && (
        <PagePanel noPadding bodyClassName="p-4 md:p-5">
          <AIAuditInsights />
        </PagePanel>
      )}

      <PagePanel
        title="Your envelopes"
        subtitle={
          loading
            ? 'Loading…'
            : `${sortedEnvelopes.length} shown${searchQuery || filterStatus !== 'all' ? ' · filtered' : ''}`
        }
        headerAction={
          !loading && counts.drafts > 0 ? (
            <button type="button" className="dm-btn-secondary text-sm" onClick={() => setFilterStatus('draft')}>
              {counts.drafts} draft{counts.drafts === 1 ? '' : 's'}
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : undefined
        }
        noPadding
        bodyClassName="p-0"
      >
        {loading ? (
          <div>
            <EnvelopeSkeleton />
            <EnvelopeSkeleton />
            <EnvelopeSkeleton />
          </div>
        ) : fetchError ? (
          <EmptyState
            icon={AlertCircle}
            title="Couldn't load envelopes"
            description="Check your connection and try again. Your documents are safe."
            action={
              <button type="button" className="dm-btn-primary" onClick={() => fetchEnvelopes()}>
                <RefreshCw className="h-4 w-4" />
                Try again
              </button>
            }
            className="border-0 bg-transparent shadow-none"
          />
        ) : envelopes.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No envelopes yet"
            description="Create your first envelope to start collecting signatures in minutes."
            action={
              <Link to="/e-sign/create" className="dm-btn-primary">
                <Plus className="h-4 w-4" />
                Create envelope
              </Link>
            }
            className="border-0 bg-transparent shadow-none"
          />
        ) : sortedEnvelopes.length === 0 ? (
          <EmptyState
            icon={Search}
            title="No matches"
            description="Try another search or clear filters to see all envelopes."
            action={
              <button
                type="button"
                className="dm-btn-secondary"
                onClick={() => {
                  setSearchQuery('');
                  setFilterStatus('all');
                }}
              >
                Clear filters
              </button>
            }
            className="border-0 bg-transparent shadow-none"
          />
        ) : (
          <div>
            {sortedEnvelopes.map((envelope) => {
              const meta = getMeta(envelope.status);
              const StatusIcon = meta.Icon;
              const recipients = envelope.recipients || [];
              const documents = envelope.documents || [];
              const completedRecipients = recipients.filter(
                (r: any) => r.status === 'completed' || r.status === 'signed',
              ).length;
              const totalRecipients = recipients.length;
              const progressPct =
                totalRecipients > 0 ? Math.round((completedRecipients / totalRecipients) * 100) : envelope.status === 'completed' ? 100 : 0;
              const isDraft = envelope.status === 'draft';
              const detailHref = `/e-sign/envelope/${envelope.id}`;
              const primaryHref = isDraft ? `/e-sign/edit/${envelope.id}` : detailHref;
              const primaryLabel = isDraft ? 'Continue' : 'Open';

              return (
                <div key={envelope.id} className="dm-list-row group">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 flex-1 items-start gap-4">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${meta.iconBg}`}>
                        <StatusIcon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <Link
                            to={detailHref}
                            className="truncate text-base font-semibold text-foreground transition hover:text-primary"
                          >
                            {envelope.subject || 'Untitled envelope'}
                          </Link>
                          <span className={meta.badge}>{meta.label}</span>
                          {envelope.isPowerForm && (
                            <span className="dm-badge bg-[#260559]/10 text-[#260559] ring-[#260559]/20">Powerform</span>
                          )}
                          {(envelope.priority === 'high' || envelope.priority === 'urgent') && (
                            <span className="dm-badge dm-badge--danger">
                              {envelope.priority === 'urgent' ? 'Urgent' : 'High'}
                            </span>
                          )}
                        </div>

                        {envelope.isPowerForm === false && totalRecipients > 0 && (
                          <div className="mb-2 max-w-md">
                            <div className="mb-1 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                              <span>
                                {completedRecipients}/{totalRecipients} signed
                              </span>
                              <span className="tabular-nums">{progressPct}%</span>
                            </div>
                            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                              <div
                                className={clsx(
                                  'h-full rounded-full transition-all duration-500',
                                  progressPct === 100 ? 'bg-emerald-500' : 'bg-primary',
                                )}
                                style={{ width: `${progressPct}%` }}
                              />
                            </div>
                          </div>
                        )}

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                          {envelope.isPowerForm === false && (
                            <>
                              <div className="flex items-center gap-1">
                                <Users className="h-4 w-4" />
                                {totalRecipients} recipient{totalRecipients !== 1 ? 's' : ''}
                              </div>
                              <div className="flex items-center gap-1">
                                <FileText className="h-4 w-4" />
                                {documents.length} document{documents.length !== 1 ? 's' : ''}
                              </div>
                            </>
                          )}
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {envelope.createdAt
                              ? `Created ${formatDistanceToNow(new Date(envelope.createdAt), { addSuffix: true })}`
                              : 'Recently created'}
                          </div>
                        </div>
                        {envelope.message && (
                          <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{envelope.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2 self-start sm:self-center">
                      <Link
                        to={primaryHref}
                        className={clsx(
                          isDraft ? 'dm-btn-primary' : 'dm-btn-secondary group-hover:border-primary/40 group-hover:text-primary',
                        )}
                      >
                        {isDraft ? <ArrowRight className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        {primaryLabel}
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </PagePanel>
    </PageShell>
  );
};

export default Dashboard;
