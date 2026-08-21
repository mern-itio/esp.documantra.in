import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../../services/apiHelper';
import {
  Copy,
  Check,
  Link2,
  Sparkles,
  Clock,
  Users,
  BadgeCheck,
  Hourglass,
  CalendarDays,
  UserRound,
  Mail,
  Fingerprint,
  History,
} from 'lucide-react';
import { PageShell, PageHero, PagePanel } from '../../components/common/PageShell';

interface RewardRow {
  _id: string;
  kind: string;
  status: string;
  title: string;
  description?: string;
  meta?: { credits?: number };
  unlockedAt?: string;
  createdAt?: string;
}

interface ReferralRow {
  id: string;
  status: 'pending' | 'completed';
  createdAt?: string;
  completedAt?: string;
  firstEnvelopeId?: string | null;
  referee?: {
    id: string;
    fullname?: string;
    email?: string;
  } | null;
}

interface ReferralStats {
  completedReferrals?: number;
  pendingReferrals?: number;
  totalReferrals?: number;
  referrerUnlockedRewards?: number;
  refereeUnlockedRewards?: number;
  creditsPerReward?: number;
}

const formatDate = (value?: string) => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString();
};

const RewardsPage: React.FC = () => {
  const [rewards, setRewards] = useState<RewardRow[]>([]);
  const [referrals, setReferrals] = useState<ReferralRow[]>([]);
  const [referralLink, setReferralLink] = useState<string>('');
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [rRes, refRes] = await Promise.all([authApi.get('/api/rewards'), authApi.get('/api/referrals/me')]);
      setRewards(Array.isArray(rRes.data?.rewards) ? rRes.data.rewards : []);
      setReferralLink(String(refRes.data?.referralLink || ''));
      setStats((refRes.data?.stats || null) as ReferralStats | null);
      setReferrals(Array.isArray(refRes.data?.referrals) ? refRes.data.referrals : []);
    } catch (e: unknown) {
      const msg =
        e && typeof e === 'object' && 'response' in e
          ? (e as { response?: { data?: { message?: string } } }).response?.data?.message
          : e instanceof Error
            ? e.message
            : undefined;
      setError(msg || 'Failed to load rewards');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const copyLink = async () => {
    const text = referralLink.trim();
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const pendingReferrals = useMemo(() => referrals.filter((r) => r.status === 'pending'), [referrals]);
  const completedReferrals = useMemo(() => referrals.filter((r) => r.status === 'completed'), [referrals]);

  return (
    <PageShell wide>
      <PageHero
        compact
        title="Rewards & referrals"
        subtitle="Share your link — when your invite sends their first document, both of you unlock reward credits."
        backTo="/account/profile"
        action={
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={copyLink}
              disabled={!referralLink}
              className="dm-btn-primary bg-white text-[#155E4B] hover:bg-white/90 disabled:opacity-50"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Copied!' : 'Copy link'}
            </button>
            <Link to="/account/rewards/coupons" className="dm-btn-secondary border-white/30 bg-white/10 text-white hover:bg-white/15">
              View coupons
            </Link>
          </div>
        }
      />

      <PagePanel noPadding bodyClassName="p-5 md:p-6 space-y-5">
        <div className="rounded-2xl bg-muted/50 px-4 py-3 ring-1 ring-border">
          <div className="mb-1 inline-flex items-center gap-2 text-sm font-semibold text-primary">
            <Link2 className="h-4 w-4" />
            Your referral link
          </div>
          <div className="truncate text-sm text-muted-foreground">{referralLink || '—'}</div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-border bg-background p-4">
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                <Users className="h-4 w-4" />
                Total invites
              </div>
              <div className="mt-2 text-2xl font-semibold text-foreground">{stats?.totalReferrals ?? referrals.length}</div>
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 dark:border-emerald-900 dark:bg-emerald-950/40">
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                <BadgeCheck className="h-4 w-4" />
                Completed invites
              </div>
              <div className="mt-2 text-2xl font-semibold text-emerald-900 dark:text-emerald-200">{stats?.completedReferrals ?? completedReferrals.length}</div>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 dark:border-amber-900 dark:bg-amber-950/40">
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-amber-800 dark:text-amber-300">
                <Hourglass className="h-4 w-4" />
                Pending invites
              </div>
              <div className="mt-2 text-2xl font-semibold text-amber-900 dark:text-amber-200">{stats?.pendingReferrals ?? pendingReferrals.length}</div>
            </div>
            <div className="rounded-2xl border border-primary/25 bg-primary/5 p-4 dark:border-primary/30 dark:bg-primary/10">
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-primary">
                <Sparkles className="h-4 w-4" />
                Credit / reward
              </div>
              <div className="mt-2 text-2xl font-semibold text-foreground">{stats?.creditsPerReward ?? 10}</div>
            </div>
          </div>

        {loading && <div className="rounded-xl border border-border bg-muted/30 p-8 text-center text-muted-foreground">Loading rewards dashboard…</div>}
        {!loading && error && <div className="mt-6 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive dark:border-destructive/40 dark:bg-destructive/15">{error}</div>}

        {!loading && !error && (
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-border bg-card p-5 text-card-foreground shadow-sm">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
                <History className="h-5 w-5 text-primary" />
                Referral tracking
              </h2>
              {referrals.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-muted/30 p-6 text-sm text-muted-foreground">
                  No referral activity yet. Share your link to start tracking invite progress.
                </div>
              ) : (
                <div className=" space-y-3 overflow-auto pr-1">
                  {referrals.map((row) => (
                    <div key={row.id} className="rounded-2xl border border-border bg-muted/40 p-4 dark:bg-muted/20">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                            <UserRound className="h-4 w-4 text-primary" />
                            <span className="truncate">{row.referee?.fullname || 'Unknown user'}</span>
                          </div>
                          <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                            <Mail className="h-3.5 w-3.5" />
                            <span className="truncate">{row.referee?.email || '—'}</span>
                          </div>
                          <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground/80">
                            <Fingerprint className="h-3.5 w-3.5" />
                            Referee ID: {row.referee?.id || '—'}
                          </div>
                        </div>
                        {row.status === 'completed' ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300">
                            <Check className="h-3.5 w-3.5" />
                            Completed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-900 dark:bg-amber-950/60 dark:text-amber-300">
                            <Clock className="h-3.5 w-3.5" />
                            Pending
                          </span>
                        )}
                      </div>
                      <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                        <div className="inline-flex items-center gap-1.5">
                          <CalendarDays className="h-3.5 w-3.5" />
                          Invited: {formatDate(row.createdAt)}
                        </div>
                        <div className="inline-flex items-center gap-1.5">
                          <BadgeCheck className="h-3.5 w-3.5" />
                          First send: {formatDate(row.completedAt)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-xl border border-border bg-card p-5 text-card-foreground shadow-sm">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
                <Sparkles className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                Reward history
              </h2>
              {rewards.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-muted/30 p-6 text-sm text-muted-foreground">
                  No rewards yet. Rewards appear here after referral milestones are reached.
                </div>
              ) : (
                <ul className=" space-y-3 overflow-auto pr-1">
                  {rewards.map((r) => (
                    <li key={r._id} className="rounded-2xl border border-border bg-muted/40 p-4 dark:bg-muted/20">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-semibold text-foreground">{r.title}</div>
                          {r.description && <div className="mt-0.5 text-sm text-muted-foreground">{r.description}</div>}
                          <div className="mt-1 text-xs text-emerald-700 dark:text-emerald-400">+{Number(r.meta?.credits || stats?.creditsPerReward || 10)} credits</div>
                        </div>
                        {r.status === 'unlocked' ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300">
                            <Check className="h-3.5 w-3.5" />
                            Unlocked
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900 dark:bg-amber-950/60 dark:text-amber-300">
                            <Clock className="h-3.5 w-3.5" />
                            Pending
                          </span>
                        )}
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground">
                        {r.status === 'unlocked' ? `Unlocked: ${formatDate(r.unlockedAt)}` : `Created: ${formatDate(r.createdAt)}`}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </PagePanel>
    </PageShell>
  );
};

export default RewardsPage;
