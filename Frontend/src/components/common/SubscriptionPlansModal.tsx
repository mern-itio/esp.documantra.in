import React, { useEffect, useState } from 'react';
import { X, Star } from 'lucide-react';
import { subscriptionApi } from '../../services/apiHelper';
import { useSubscription } from '../../context/SubscriptionContext';
import toast from 'react-hot-toast';
import type { Invoice } from '../../types';
import { SubscriptionService } from '../../services/subscriptionService';

interface PlanTemplate {
  _id: string;
  name: string;
  type: 'free' | 'paid';
  monthlyCredits?: number;
  pricePerPeriod: number;
  period: 'monthly' | 'yearly';
  services?: string[];
}

interface SubscriptionPlansModalProps {
  open: boolean;
  onClose: () => void;
  onPlanPurchased?: (invoice: Invoice | null) => void;
}

export const SubscriptionPlansModal: React.FC<SubscriptionPlansModalProps> = ({ open, onClose }) => {
  const [plans, setPlans] = useState<PlanTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [upgradingPlanId, setUpgradingPlanId] = useState<string | null>(null);
  const { userPlan } = useSubscription();

  useEffect(() => {
    if (!open) return;
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const res = await subscriptionApi.get('/user-plan/all');
        const list = (res as any).data?.data?.plans || [];
        if (!mounted) return;
        setPlans(Array.isArray(list) ? list : []);
      } catch {
        if (!mounted) return;
        setPlans([
          { _id: 'core', name: 'Core', type: 'paid', pricePerPeriod: 15, period: 'monthly', monthlyCredits: 100, services: ['pdf','esign','auth'] },
          { _id: 'pro', name: 'Pro', type: 'paid', pricePerPeriod: 30, period: 'monthly', monthlyCredits: 300, services: ['pdf','esign','auth'] },
          { _id: 'ultra', name: 'Ultra', type: 'paid', pricePerPeriod: 100, period: 'monthly', monthlyCredits: 1000, services: ['pdf','esign','auth'] },
        ]);
      } finally {
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[10001] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" onClick={onClose} aria-hidden />
      <div className="relative mx-auto w-full max-w-6xl px-4">
        <div className="overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <h3 className="text-2xl font-bold text-foreground">Pricing</h3>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6">
            {loading ? (
              <div className="py-16 text-center text-muted-foreground">Loading plans...</div>
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                {(() => {
                  const paidPlans = plans.filter(p => p.type === 'paid');
                  const recommendedId = paidPlans.length
                    ? paidPlans.reduce((min, p) => (p.pricePerPeriod < min.pricePerPeriod ? p : min))._id
                    : (plans[1]?._id || plans[0]?._id);
                  return plans.map((plan) => {
                    const idxRecommended = plan._id === recommendedId;
                    const isUpgrading = upgradingPlanId === plan._id;
                    const isCurrent = userPlan?.name && userPlan.name.toLowerCase() === String(plan.name || '').toLowerCase();
                    return (
                      <div
                        key={plan._id}
                        className={`rounded-2xl border p-6 ${
                          idxRecommended
                            ? 'border-primary/45 bg-primary/5 ring-1 ring-primary/15'
                            : 'border-border bg-muted/20'
                        }`}
                      >
                    {idxRecommended && (
                      <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                        <Star className="h-3 w-3" /> Recommended
                      </div>
                    )}
                    <div className="mb-1 text-sm text-muted-foreground">{plan.name}</div>
                    <div className="mb-1 text-3xl font-extrabold text-foreground">
                      ${plan.pricePerPeriod}
                      <span className="text-sm font-normal text-muted-foreground"> / {plan.period}</span>
                    </div>
                    {isCurrent ? (
                      <div className="mt-4 flex h-10 w-full items-center justify-center rounded-lg border border-border bg-muted font-semibold text-muted-foreground">
                        Your current plan
                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled={isUpgrading}
                        onClick={async () => {
                          try {
                            setUpgradingPlanId(plan._id);
                            const t = toast.loading('Redirecting to secure payment...');
                            const session = await SubscriptionService.createStripeCheckoutSession(plan._id);
                            if (session.url) {
                              toast.dismiss(t);
                              window.location.href = session.url;
                            } else {
                              toast.error('Failed to start payment session', { id: t });
                            }
                          } catch (err: any) {
                            toast.error(err?.message || 'Failed to start payment');
                            setUpgradingPlanId(null);
                          }
                        }}
                        className={`mt-4 h-10 w-full rounded-lg bg-primary font-semibold text-primary-foreground transition hover:bg-primary/90 ${
                          isUpgrading ? 'cursor-not-allowed opacity-70' : ''
                        }`}
                      >
                        {isUpgrading ? 'Upgrading...' : (plan.type === 'free' ? 'Get started for free' : 'Upgrade')}
                      </button>
                    )}
                    <div className="mt-5 text-sm font-bold text-foreground">Includes:-</div>
                    <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                      <li>Monthly credits: {plan.monthlyCredits ?? 0}</li>
                      <li>Services: {(plan.services || []).join(', ') || '—'}</li>
                      <li>{plan.type === 'paid' ? 'Everything in Free' : 'Basic features included'}</li>
                    </ul>
                    <div className="mt-4 text-xs text-muted-foreground">You pay ${plan.pricePerPeriod} {plan.period} no matter how much you earn</div>
                  </div>
                    );
                  });
                })()}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPlansModal;


