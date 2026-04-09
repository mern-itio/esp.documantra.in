import React, { useEffect, useState } from 'react';
import SubscriptionInfo from '../../components/common/SubscriptionInfo';
import SubscriptionPlansModal from '../../components/common/SubscriptionPlansModal';
import CreditPurchaseModal from '../../components/common/CreditPurchaseModal';
import InvoiceModal from '../../components/common/InvoiceModal';
import { 
  CreditCard,
  ArrowLeft, 
  Zap,
  HelpCircle, 
  BarChart3,
  ArrowRight,
  Layers3,
  Clock,
  Receipt,
  Wallet
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSubscription } from '../../context/SubscriptionContext';
import type { Invoice } from '../../types';
import { SubscriptionService } from '../../services/subscriptionService';
import toast from 'react-hot-toast';

const SubscriptionManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isPlansModalOpen, setIsPlansModalOpen] = useState(false);
  const [isCreditPurchaseModalOpen, setIsCreditPurchaseModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [latestInvoice, setLatestInvoice] = useState<Invoice | null>(null);
  const { userPlan, getRemainingCredits, isFreePlan, refreshPlan } = useSubscription();

  const remainingCredits = getRemainingCredits();
  const isFree = isFreePlan();
  const creditsLimit = userPlan?.conversionsLimit || 0;
  const creditsPercentage = creditsLimit > 0 
    ? Math.min((remainingCredits / creditsLimit) * 100, 100) 
    : 0;

  const processingStripeSession = React.useRef(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const invoice = await SubscriptionService.getLatestInvoice();
      if (mounted) {
        setLatestInvoice(invoice);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Handle Stripe redirect back with session_id or canceled flag
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const creditSessionId = searchParams.get('credit_session_id');
    const flexiSessionId = searchParams.get('flexible_credit_session_id');
    const sessionId = searchParams.get('session_id');
    const canceled = searchParams.get('canceled');

    // Prevent re-entrancy while already processing
    if (processingStripeSession.current) {
      return;
    }

    // Continue only when we have at least one actionable query param
    if (!sessionId && !creditSessionId && !canceled && !flexiSessionId) {
      return;
    }

    // If we've already handled this session in this tab, just clean the URL and bail out
    if (sessionId && sessionStorage.getItem(`stripe_session_handled_${sessionId}`)) {
      searchParams.delete('session_id');
      const newUrl =
        location.pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '');
      navigate(newUrl, { replace: true });
      return;
    }
    // If we've already handled this credit session in this tab, just clean the URL and bail out
    if (creditSessionId && sessionStorage.getItem(`stripe_session_handled_${creditSessionId}`)) {
      searchParams.delete('credit_session_id');
      const newUrl =
        location.pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '');
      navigate(newUrl, { replace: true });
      return;
    }
        // If we've already handled this credit session in this tab, just clean the URL and bail out
    if (flexiSessionId && sessionStorage.getItem(`stripe_session_handled_${flexiSessionId}`)) {
      searchParams.delete('flexiSessionId');
      const newUrl =
        location.pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '');
      navigate(newUrl, { replace: true });
      return;
    }

    if (canceled) {
      processingStripeSession.current = true;
      toast('Payment canceled.');
      searchParams.delete('canceled');
      const newUrl =
        location.pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '');
      navigate(newUrl, { replace: true });
      processingStripeSession.current = false;
      return;
    }
    // Plan Confirmation Block 
    if (sessionId) {
      processingStripeSession.current = true;
      (async () => {
        const t = toast.loading('Confirming payment...');
        try {
          const { invoice } = await SubscriptionService.confirmStripeCheckoutSession(sessionId);
          await refreshPlan().catch(() => {});

          let inv = invoice;
          if (!inv) {
            inv = await SubscriptionService.getLatestInvoice();
          }
          if (inv) {
            setLatestInvoice(inv);
            setIsInvoiceModalOpen(true);
          }

          toast.success('Subscription upgraded successfully', { id: t });
          // Mark this session as handled in this tab
          sessionStorage.setItem(`stripe_session_handled_${sessionId}`, 'true');
        } catch (err: any) {
          toast.error(err?.message || 'Failed to confirm payment', { id: t });
        } finally {
          searchParams.delete('session_id');
          const newUrl =
            location.pathname +
            (searchParams.toString() ? `?${searchParams.toString()}` : '');
          navigate(newUrl, { replace: true });
          processingStripeSession.current = false;
        }
      })();
    }
    // Credit purchase confirmation Block
    if (creditSessionId) {
      processingStripeSession.current = true;
      (async () => {
        const t = toast.loading('Confirming payment...');
        try {
          const {invoice} = await SubscriptionService.confirmCreditPurchaseCheckoutSession(creditSessionId);
          await refreshPlan().catch(() => {});
          let inv = invoice;
          if (!inv){
            inv = await SubscriptionService.getLatestInvoice();
          }
          if (inv) {
          setLatestInvoice(inv);
          setIsInvoiceModalOpen(true);
          }
          toast.success('Credit Purchased successfully', { id: t });
          // Mark this session as handled in this tab
          sessionStorage.setItem(`stripe_session_handled_${creditSessionId}`, 'true');
        } catch (err:any) {
          toast.error(err?.message || 'Failed to confirm payment', { id: t });
        } finally {
          searchParams.delete('credit_session_id');
          const newUrl =
            location.pathname +
            (searchParams.toString() ? `?${searchParams.toString()}` : '');
          navigate(newUrl, { replace: true });
          processingStripeSession.current = false;
        }
      })();
    }
    if(flexiSessionId){
      processingStripeSession.current = true;
      (async () => {
        const t = toast.loading('Confirming payment...');
        try {
          const {invoice} = await SubscriptionService.confirmFlexibleCreditPurchaseCheckoutSession(flexiSessionId);
          await refreshPlan().catch(() => {});
          let inv = invoice;
          if (!inv){
            inv = await SubscriptionService.getLatestInvoice();
          }
          if (inv) {
          setLatestInvoice(inv);
          setIsInvoiceModalOpen(true);
          }
          toast.success('Credit Purchased successfully', { id: t });
          // Mark this session as handled in this tab
          sessionStorage.setItem(`stripe_session_handled_${flexiSessionId}`, 'true');
        } catch (err:any) {
          toast.error(err?.message || 'Failed to confirm payment', { id: t });
        } finally {
          searchParams.delete('flexible_credit_session_id');
          const newUrl =
            location.pathname +
            (searchParams.toString() ? `?${searchParams.toString()}` : '');
          navigate(newUrl, { replace: true });
          processingStripeSession.current = false;
        }
      })();
    }
  }, [location.search, location.pathname, refreshPlan, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <div>
        <div>
          <div className="border-b border-border bg-card/30 px-6 py-5">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => navigate('/account/profile')}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition hover:bg-muted"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Subscription Management</h1>
                <p className="mt-1 text-sm text-muted-foreground">Manage your plan, credits, and invoices from one place.</p>
              </div>
            </div>
          </div>

          <div className="px-6 py-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-border bg-card p-5">
                <div className="mb-3 flex items-center justify-between">
                  <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                    <Wallet className="h-4 w-4 text-foreground" />
                  </div>
                  <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Credits</span>
                </div>
                <div className="text-3xl font-bold text-foreground">
                  {remainingCredits === Infinity ? '∞' : remainingCredits.toLocaleString()}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">Available balance</p>
                {creditsLimit > 0 && (
                  <div className="mt-4">
                    <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                      <span>Usage</span>
                      <span>{Math.round(creditsPercentage)}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full bg-primary transition-all duration-500"
                        style={{ width: `${creditsPercentage}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-border bg-card p-5">
                <div className="mb-3 flex items-center justify-between">
                  <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                    <CreditCard className="h-4 w-4 text-foreground" />
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      isFree ? 'border border-success/30 bg-success/10 text-success' : 'border border-primary/30 bg-primary/10 text-primary'
                    }`}
                  >
                    {isFree ? 'Free' : 'Paid'}
                  </span>
                </div>
                <div className="text-3xl font-bold text-foreground">{userPlan?.name || 'Free'}</div>
                <p className="mt-1 text-sm text-muted-foreground">Current subscription plan</p>
              </div>

              <div className="rounded-xl border border-border bg-card p-5">
                <div className="mb-3 flex items-center justify-between">
                  <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                    <Layers3 className="h-4 w-4 text-foreground" />
                  </div>
                  <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Services</span>
                </div>
                <div className="text-3xl font-bold text-foreground">{userPlan?.services?.length || 0}</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {userPlan?.services?.slice(0, 3).map((service) => (
                    <span key={service} className="rounded-md border border-border bg-muted/50 px-2 py-1 text-xs text-foreground">
                      {service.toUpperCase()}
                    </span>
                  ))}
                  {userPlan?.services && userPlan.services.length > 3 && (
                    <span className="rounded-md border border-border bg-muted/50 px-2 py-1 text-xs text-foreground">
                      +{userPlan.services.length - 3}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="space-y-6 lg:col-span-2">
                <section className="rounded-xl border border-border bg-card shadow-sm">
                  <div className="border-b border-border px-5 py-4">
                    <h2 className="text-lg font-semibold text-foreground">Current Subscription</h2>
                    <p className="mt-1 text-xs text-muted-foreground">Plan details, allowances, and included features.</p>
                  </div>
                  <div className="p-5">
                    <SubscriptionInfo showRefreshButton={true} />
                  </div>
                </section>

                <section className="rounded-xl border border-border bg-card shadow-sm">
                  <div className="border-b border-border px-5 py-4">
                    <h2 className="text-lg font-semibold text-foreground">Billing & Invoices</h2>
                    <p className="mt-1 text-xs text-muted-foreground">Track payments and access invoice documents.</p>
                  </div>
                  <div className="p-5">
                    {latestInvoice ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                          <div className="rounded-lg border border-border bg-muted/40 p-3">
                            <div className="text-xs text-muted-foreground">Invoice</div>
                            <div className="mt-1 text-sm font-semibold text-foreground">
                              {latestInvoice.invoiceNumber || 'Invoice'}
                            </div>
                          </div>
                          <div className="rounded-lg border border-border bg-muted/40 p-3">
                            <div className="text-xs text-muted-foreground">Amount</div>
                            <div className="mt-1 text-sm font-semibold text-foreground">
                              {latestInvoice.currency || 'USD'}{' '}
                              {typeof latestInvoice.amount === 'number'
                                ? latestInvoice.amount.toFixed(2)
                                : latestInvoice.amount}
                            </div>
                          </div>
                          <div className="rounded-lg border border-border bg-muted/40 p-3">
                            <div className="text-xs text-muted-foreground">Date</div>
                            <div className="mt-1 text-sm font-semibold text-foreground">
                              {latestInvoice.createdAt
                                ? new Date(latestInvoice.createdAt).toLocaleDateString()
                                : '-'}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-3">
                          <button
                            type="button"
                            onClick={() => setIsInvoiceModalOpen(true)}
                            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
                          >
                            <Receipt className="h-4 w-4" />
                            View invoice
                          </button>
                          <button
                            type="button"
                            onClick={() => navigate('/credits-usage')}
                            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
                          >
                            <BarChart3 className="h-4 w-4" />
                            Billing & usage history
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        You don&apos;t have any invoices yet. Upgrade to a paid plan to generate your first invoice.
                      </p>
                    )}
                  </div>
                </section>
              </div>

              <div className="space-y-6">
                <section className="rounded-xl border border-border bg-card shadow-sm">
                  <div className="border-b border-border px-5 py-4">
                    <h2 className="text-lg font-semibold text-foreground">Quick Actions</h2>
                    <p className="mt-1 text-xs text-muted-foreground">Manage your plan and credit workflow.</p>
                  </div>
                  <div className="space-y-3 p-5">
                    <button
                      type="button"
                      onClick={() => setIsPlansModalOpen(true)}
                      className="inline-flex w-full items-center justify-between rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                    >
                      <span className="inline-flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Upgrade Plan
                      </span>
                      <ArrowRight className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsCreditPurchaseModalOpen(true)}
                      className="inline-flex w-full items-center justify-between rounded-lg border border-primary bg-card px-4 py-2.5 text-sm font-semibold text-primary hover:bg-primary/10"
                    >
                      <span className="inline-flex items-center gap-2">
                        <Zap className="h-4 w-4" />
                        Buy Credits
                      </span>
                      <ArrowRight className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => navigate('/credits-usage')}
                      className="inline-flex w-full items-center justify-between rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
                    >
                      <span className="inline-flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" />
                        View Credit Usage
                      </span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </section>

                <section className="rounded-xl border border-border bg-card shadow-sm">
                  <div className="border-b border-border px-5 py-4">
                    <h2 className="text-lg font-semibold text-foreground">Billing Cycle</h2>
                  </div>
                  <div className="p-5">
                    {userPlan?.nextBillingAt ? (
                      <div className="flex items-start gap-3">
                        <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                          <Clock className="h-4 w-4 text-foreground" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-foreground">Next billing date</div>
                          <div className="mt-1 text-sm text-muted-foreground">
                            {new Date(userPlan.nextBillingAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No recurring billing is scheduled for your current plan.</p>
                    )}
                  </div>
                </section>

                <section className="rounded-xl border border-border bg-card shadow-sm">
                  <div className="border-b border-border px-5 py-4">
                    <h2 className="text-lg font-semibold text-foreground">Need Help?</h2>
                  </div>
                  <div className="p-5">
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      Questions about pricing, invoices, or usage? Contact our team and we&apos;ll help you quickly.
                    </p>
                    <button
                      type="button"
                      onClick={() => window.open('/contact-sales', '_blank')}
                      className="mt-4 inline-flex w-full items-center justify-between rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
                    >
                      <span className="inline-flex items-center gap-2">
                        <HelpCircle className="h-4 w-4" />
                        Contact Support
                      </span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>
      </div>

      <SubscriptionPlansModal 
        open={isPlansModalOpen} 
        onClose={() => setIsPlansModalOpen(false)}
        onPlanPurchased={async (invoice) => {
          let inv = invoice;
          if (!inv) {
            inv = await SubscriptionService.getLatestInvoice();
          }
          if (inv) {
            setLatestInvoice(inv);
            setIsInvoiceModalOpen(true);
          }
        }}
      />
      <CreditPurchaseModal
        open={isCreditPurchaseModalOpen}
        onClose={() => setIsCreditPurchaseModalOpen(false)}
        onPurchased={async (invoice) => {
          if (invoice) {
            await refreshPlan().catch(() => {});
            setLatestInvoice(invoice);
          }
        }}
      />
      <InvoiceModal
        open={isInvoiceModalOpen}
        invoice={latestInvoice}
        onClose={() => setIsInvoiceModalOpen(false)}
      />
    </div>
  );
};

export default SubscriptionManagementPage;

