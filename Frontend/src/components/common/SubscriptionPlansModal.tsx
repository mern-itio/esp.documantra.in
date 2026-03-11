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
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-6xl mx-auto px-4">
        <div className="rounded-2xl overflow-hidden shadow-2xl bg-white text-gray-900">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h3 className="text-2xl font-bold text-gray-900">Pricing</h3>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <X className="w-5 h-5 text-gray-700" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6">
            {loading ? (
              <div className="text-center py-16 text-gray-500">Loading plans...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                      <div key={plan._id} className={`rounded-2xl p-6 border ${idxRecommended ? 'border-indigo-500/50 bg-indigo-50' : 'border-gray-200 bg-white'}`}>
                    {idxRecommended && (
                      <div className="inline-flex items-center gap-2 text-xs px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 mb-3">
                        <Star className="w-3 h-3" /> Recommended
                      </div>
                    )}
                    <div className="text-sm text-gray-600 mb-1">{plan.name}</div>
                    <div className="text-3xl font-extrabold mb-1 text-gray-900">${plan.pricePerPeriod}<span className="text-sm font-normal text-gray-500"> / {plan.period}</span></div>
                    {isCurrent ? (
                      <div className="w-full mt-4 h-10 rounded-lg font-semibold bg-gray-100 text-gray-700 flex items-center justify-center border border-gray-200">
                        Your current plan
                      </div>
                    ) : (
                      <button
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
                        className={`w-full mt-4 h-10 rounded-lg font-semibold transition ${
                          idxRecommended ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-gray-900 text-white hover:bg-gray-800'
                        } ${isUpgrading ? 'opacity-70 cursor-not-allowed' : ''}`}
                      >
                        {isUpgrading ? 'Upgrading...' : (plan.type === 'free' ? 'Get started for free' : 'Upgrade')}
                      </button>
                    )}
                    <div className="mt-5 text-medium font-bold text-gray-700">Includes:-</div>
                    <ul className="mt-3 space-y-2 text-sm text-gray-700">
                      <li>Monthly credits: {plan.monthlyCredits ?? 0}</li>
                      <li>Services: {(plan.services || []).join(', ') || '—'}</li>
                      <li>{plan.type === 'paid' ? 'Everything in Free' : 'Basic features included'}</li>
                    </ul>
                    <div className="mt-4 text-xs text-gray-500">You pay ${plan.pricePerPeriod} {plan.period} no matter how much you earn</div>
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


