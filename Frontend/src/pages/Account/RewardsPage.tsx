import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../../services/apiHelper';
import {
  Gift,
  Copy,
  Check,
  Link2,
  ArrowLeft,
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
  Target,
} from 'lucide-react';

interface RewardMeta {
  credits?: number;
  rewardType?: string;
  planDiscountPercent?: number;
  appliesTo?: string;
  freeAuthMethod?: string;
  customLabel?: string;
  customDescription?: string;
  milestoneIndex?: number;
}

interface RewardRow {
  _id: string;
  kind: string;
  status: string;
  title: string;
  description?: string;
  meta?: RewardMeta;
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

interface ProgramSummary {
  isActive?: boolean;
  refereeRewardEnabled?: boolean;
  referrerRewardEnabled?: boolean;
  referrerCompletionsPerReward?: number;
  refereeRewardType?: string;
  referrerRewardType?: string;
  refereeCredits?: number;
  referrerCredits?: number;
  refereePlanDiscountPercent?: number;
  referrerPlanDiscountPercent?: number;
  refereeCustomLabel?: string;
  referrerCustomLabel?: string;
}

interface ReferralStats {
  completedReferrals?: number;
  pendingReferrals?: number;
  totalReferrals?: number;
  referrerUnlockedRewards?: number;
  refereeUnlockedRewards?: number;
  referrerMilestonesPaid?: number;
  referrerCompletionsPerReward?: number;
  invitesUntilNextMilestone?: number;
  progressTowardNextMilestone?: number;
  creditsPerReward?: number | null;
}

function rewardBenefitLine(r: RewardRow): string {
  const t = r.meta?.rewardType;
  if (t === 'credits' || (!t && r.meta?.credits != null)) {
    const n = Number(r.meta?.credits ?? 0);
    return n > 0 ? `+${n} credits` : 'Credits';
  }
  if (t === 'plan_discount_percent') {
    const p = Number(r.meta?.planDiscountPercent ?? 0);
    return `${p}% off annual plan`;
  }
  if (t === 'free_auth_method') {
    const m = String(r.meta?.freeAuthMethod || 'verification').trim() || 'verification';
    return `Free ${m} verification`;
  }
  if (t === 'custom') {
    return r.meta?.customLabel || 'Custom reward';
  }
  return 'Reward';
}

function programReferrerSummary(program: ProgramSummary | null): string {
  if (!program?.referrerRewardEnabled) return 'Referrer rewards off';
  const n = Math.max(1, Number(program.referrerCompletionsPerReward ?? 1));
  const t = program.referrerRewardType;
  if (t === 'credits') {
    const c = Number(program.referrerCredits ?? 10);
    return n <= 1 ? `${c} cr. / invite` : `${c} cr. per ${n} invites`;
  }
  if (t === 'plan_discount_percent') {
    const p = Number(program.referrerPlanDiscountPercent ?? 0);
    return n <= 1 ? `${p}% / invite` : `${p}% per ${n} invites`;
  }
  if (t === 'free_auth_method') {
    return n <= 1 ? 'Free verification / invite' : `Free verification per ${n} invites`;
  }
  return program.referrerCustomLabel || 'Custom';
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
  const [program, setProgram] = useState<ProgramSummary | null>(null);
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
      setProgram((refRes.data?.program || null) as ProgramSummary | null);
      setReferrals(Array.isArray(refRes.data?.referrals) ? refRes.data.referrals : []);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Failed to load rewards');
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

  const n = Math.max(1, Number(program?.referrerCompletionsPerReward ?? stats?.referrerCompletionsPerReward ?? 1));
  const programPaused = program && !program.isActive;

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-[#f6f3ff] via-[#f7fbff] to-white overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <Gift className="absolute top-16 left-16 h-12 w-12 text-purple-200 opacity-20 animate-pulse" />
        <Gift className="absolute top-32 right-24 h-8 w-8 text-pink-200 opacity-30 animate-bounce" style={{ animationDelay: '0.5s' }} />
        <Gift className="absolute top-64 left-1/4 h-10 w-10 text-blue-200 opacity-25 animate-pulse" style={{ animationDelay: '1s' }} />
      </div>
      <div className="relative z-10 mx-auto px-4 py-10">
        <Link to="/account/profile" className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-[#260559] hover:underline">
          <ArrowLeft className="h-4 w-4" />
          Back to profile
        </Link>

        <div className="rounded-xl border border-[#260559]/10 p-6 shadow-sm ">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#260559] text-white shadow-md">
                <Gift className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">Rewards & referrals</h1>
                <p className="mt-1 max-w-2xl text-sm text-gray-600">
                  Share your referral link. Invited users unlock a welcome reward when they send their first document. Referrers earn rewards based on the program rules (for example, every N successful invites).
                </p>
                {programPaused && (
                  <p className="mt-2 text-sm font-medium text-amber-800">
                    The referral program is paused by an administrator. New rewards may not apply until it is turned back on.
                  </p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={copyLink}
              disabled={!referralLink}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#260559] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#260559]/90 disabled:opacity-50"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Copied Link' : 'Copy Referral Link'}
            </button>
          </div>

          <div className="mt-5 rounded-2xl bg-[#f8f7ff] px-4 py-3 text-sm text-gray-700 ring-1 ring-[#260559]/10">
            <div className="mb-1 inline-flex items-center gap-2 font-semibold text-[#260559]">
              <Link2 className="h-4 w-4" />
              Your referral link
            </div>
            <div className="truncate">{referralLink || '—'}</div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-gray-100 bg-white p-4">
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-gray-500">
                <Users className="h-4 w-4" />
                Total invites
              </div>
              <div className="mt-2 text-2xl font-semibold text-gray-900">{stats?.totalReferrals ?? referrals.length}</div>
            </div>
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4">
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-700">
                <BadgeCheck className="h-4 w-4" />
                Completed invites
              </div>
              <div className="mt-2 text-2xl font-semibold text-emerald-800">{stats?.completedReferrals ?? completedReferrals.length}</div>
            </div>
            <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-4">
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-amber-700">
                <Hourglass className="h-4 w-4" />
                Pending invites
              </div>
              <div className="mt-2 text-2xl font-semibold text-amber-800">{stats?.pendingReferrals ?? pendingReferrals.length}</div>
            </div>
            <div className="rounded-2xl border border-purple-100 bg-purple-50/50 p-4">
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-purple-700">
                <Sparkles className="h-4 w-4" />
                Referrer reward rule
              </div>
              <div className="mt-2 text-sm font-semibold leading-snug text-purple-900">
                {programReferrerSummary(program)}
              </div>
            </div>
          </div>

          {n > 1 && program?.referrerRewardEnabled && (
            <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl border border-[#260559]/15 bg-white/80 px-4 py-3 text-sm text-gray-700">
              <Target className="h-5 w-5 text-[#260559] shrink-0" />
              <span>
                Progress toward the next referrer payout:{' '}
                <strong>{stats?.progressTowardNextMilestone ?? 0}</strong> of <strong>{n}</strong> completed invites
                {typeof stats?.invitesUntilNextMilestone === 'number' ? (
                  <>
                    {' '}
                    ({stats.invitesUntilNextMilestone} more needed for the next reward)
                  </>
                ) : null}
                .
              </span>
            </div>
          )}
        </div>

        {loading && <div className="mt-6 rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-500">Loading rewards dashboard…</div>}
        {!loading && error && <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>}

        {!loading && !error && (
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
                <History className="h-5 w-5 text-[#260559]" />
                Referral tracking
              </h2>
              {referrals.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-6 text-sm text-gray-500">
                  No referral activity yet. Share your link to start tracking invite progress.
                </div>
              ) : (
                <div className=" space-y-3 overflow-auto pr-1">
                  {referrals.map((row) => (
                    <div key={row.id} className="rounded-2xl border border-gray-100 bg-gray-50/70 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                            <UserRound className="h-4 w-4 text-[#260559]" />
                            <span className="truncate">{row.referee?.fullname || 'Unknown user'}</span>
                          </div>
                          <div className="mt-1 flex items-center gap-2 text-xs text-gray-600">
                            <Mail className="h-3.5 w-3.5" />
                            <span className="truncate">{row.referee?.email || '—'}</span>
                          </div>
                          <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                            <Fingerprint className="h-3.5 w-3.5" />
                            Referee ID: {row.referee?.id || '—'}
                          </div>
                        </div>
                        {row.status === 'completed' ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                            <Check className="h-3.5 w-3.5" />
                            Completed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
                            <Clock className="h-3.5 w-3.5" />
                            Pending
                          </span>
                        )}
                      </div>
                      <div className="mt-3 grid gap-2 text-xs text-gray-600 sm:grid-cols-2">
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

            <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
                <Sparkles className="h-5 w-5 text-amber-500" />
                Reward history
              </h2>
              {rewards.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-6 text-sm text-gray-500">
                  No rewards yet. Rewards appear here after referral milestones are reached.
                </div>
              ) : (
                <ul className=" space-y-3 overflow-auto pr-1">
                  {rewards.map((r) => (
                    <li key={r._id} className="rounded-2xl border border-gray-100 bg-gray-50/70 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-semibold text-gray-900">{r.title}</div>
                          {r.description && <div className="mt-0.5 text-sm text-gray-600">{r.description}</div>}
                          <div className="mt-1 text-xs font-medium text-emerald-800">{rewardBenefitLine(r)}</div>
                        </div>
                        {r.status === 'unlocked' ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                            <Check className="h-3.5 w-3.5" />
                            Unlocked
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                            <Clock className="h-3.5 w-3.5" />
                            Pending
                          </span>
                        )}
                      </div>
                      <div className="mt-2 text-xs text-gray-500">
                        {r.status === 'unlocked' ? `Unlocked: ${formatDate(r.unlockedAt)}` : `Created: ${formatDate(r.createdAt)}`}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RewardsPage;
