import React, { useEffect, useState } from 'react';
import SubscriptionInfo from '../../components/common/SubscriptionInfo';
import SubscriptionPlansModal from '../../components/common/SubscriptionPlansModal';
import CreditPurchaseModal from '../../components/common/CreditPurchaseModal';
import InvoiceModal from '../../components/common/InvoiceModal';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/DocumentService/ui/card';
import { Button } from '../../components/DocumentService/ui/button';
import { 
  CreditCard, 
  Settings, 
  ArrowLeft, 
  Zap, 
  TrendingUp, 
  HelpCircle, 
  BarChart3,
  ArrowRight,
  Sparkles,
  Shield,
  Clock,
  FileText
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
    const sessionId = searchParams.get('session_id');
    const canceled = searchParams.get('canceled');

    // Prevent re-entrancy while already processing
    if (processingStripeSession.current) {
      return;
    }

    // Continue only when we have at least one actionable query param
    if (!sessionId && !creditSessionId && !canceled) {
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
  }, [location.search, location.pathname, refreshPlan, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/account/profile')}
              className="p-2 hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Subscription Management</h1>
              <p className="text-sm text-gray-600 mt-1">Manage your subscription plan and billing</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <Zap className="w-6 h-6 text-yellow-600" />
                </div>
                <Sparkles className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Available Credits</p>
                <p className="text-3xl font-bold text-gray-900">
                  {remainingCredits === Infinity ? '∞' : remainingCredits.toLocaleString()}
                </p>
                {creditsLimit > 0 && (
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>Usage</span>
                      <span>{Math.round(creditsPercentage)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-500 ${
                          creditsPercentage > 75 ? 'bg-green-500' : 
                          creditsPercentage > 50 ? 'bg-yellow-500' : 
                          creditsPercentage > 25 ? 'bg-orange-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${creditsPercentage}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <CreditCard className="w-6 h-6 text-blue-600" />
                </div>
                <Shield className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Current Plan</p>
                <p className="text-3xl font-bold text-gray-900">
                  {userPlan?.name || 'Free'}
                </p>
                <div className="mt-3">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    isFree 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {isFree ? 'Free Plan' : 'Paid Plan'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-purple-600" />
                </div>
                <TrendingUp className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Plan Services</p>
                <p className="text-3xl font-bold text-gray-900">
                  {userPlan?.services?.length || 0}
                </p>
                <div className="mt-3 flex flex-wrap gap-1">
                  {userPlan?.services?.slice(0, 3).map((service) => (
                    <span 
                      key={service}
                      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800"
                    >
                      {service.toUpperCase()} Service
                    </span>
                  ))}
                  {userPlan?.services && userPlan.services.length > 3 && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                      +{userPlan.services.length - 3}
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="hover:shadow-xl transition-shadow duration-300 border-gray-200">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
                <CardTitle className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <CreditCard className="w-5 h-5 text-indigo-600" />
                  </div>
                  <span className="text-xl font-bold text-gray-900">Current Subscription</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <SubscriptionInfo showRefreshButton={true} />
              </CardContent>
            </Card>
            
          </div>

          <div className="space-y-6">
            <Card className="hover:shadow-xl transition-shadow duration-300 border-gray-200">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
                <CardTitle className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Settings className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="text-lg font-bold text-gray-900">Quick Actions</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-3">
                <Button 
                  className="w-full justify-between group hover:shadow-md transition-all duration-200 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white border-0" 
                  onClick={() => setIsPlansModalOpen(true)}
                >
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    <span className="font-semibold">Upgrade Plan</span>
                  </div>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button 
                  className="w-full justify-between group hover:shadow-md transition-all duration-200 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white border-0" 
                  onClick={() => setIsCreditPurchaseModalOpen(true)}
                >
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    <span className="font-semibold">Buy Credits</span>
                  </div>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button 
                  className="w-full justify-between group hover:shadow-md transition-all duration-200" 
                  variant="outline"
                  onClick={() => navigate('/credits-usage')}
                >
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    <span className="font-medium">View Credit Usage</span>
                  </div>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
                {userPlan?.nextBillingAt && (
                  <div className="pt-3 border-t border-gray-200 space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>Next billing: {new Date(userPlan.nextBillingAt).toLocaleDateString()}</span>
                    </div>
                    {latestInvoice && (
                      <div className="flex items-start gap-2 text-xs text-gray-600">
                        <FileText className="w-4 h-4 text-indigo-500 mt-0.5" />
                        <div>
                          <div className="font-semibold text-gray-900">
                            Last invoice {latestInvoice.invoiceNumber || ''}
                          </div>
                          <div>
                            {latestInvoice.currency || 'USD'}{' '}
                            {typeof latestInvoice.amount === 'number'
                              ? latestInvoice.amount.toFixed(2)
                              : latestInvoice.amount}{' '}
                            ·{' '}
                            {latestInvoice.createdAt
                              ? new Date(latestInvoice.createdAt).toLocaleDateString()
                              : ''}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="hover:shadow-xl transition-shadow duration-300 border-gray-200">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
                <CardTitle className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <FileText className="w-5 h-5 text-indigo-600" />
                  </div>
                  <span className="text-lg font-bold text-gray-900">Billing & Invoices</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-3">
                {latestInvoice ? (
                  <div className="space-y-2 text-sm text-gray-700">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Last invoice</span>
                      <span className="text-xs text-gray-500">
                        {latestInvoice.createdAt
                          ? new Date(latestInvoice.createdAt).toLocaleDateString()
                          : ''}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-600">
                        <div className="font-semibold text-gray-900">
                          {latestInvoice.invoiceNumber || 'Invoice'}
                        </div>
                        <div>
                          {latestInvoice.currency || 'USD'}{' '}
                          {typeof latestInvoice.amount === 'number'
                            ? latestInvoice.amount.toFixed(2)
                            : latestInvoice.amount}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="inline-flex items-center gap-2"
                        onClick={() => setIsInvoiceModalOpen(true)}
                      >
                        <FileText className="w-4 h-4" />
                        <span className="text-xs font-semibold">View invoice</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="inline-flex items-center gap-2"
                        onClick={() => navigate('/credits-usage')}
                      >
                        <BarChart3 className="w-4 h-4" />
                        <span className="text-xs font-semibold">Billing & usage history</span>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-600">
                    You don&apos;t have any invoices yet. Upgrade to a paid plan to generate your first invoice.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="hover:shadow-xl transition-shadow duration-300 border-gray-200 bg-gradient-to-br from-blue-50 to-indigo-50">
              <CardHeader className="border-b border-gray-200">
                <CardTitle className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <HelpCircle className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="text-lg font-bold text-gray-900">Need Help?</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-sm text-gray-700 mb-4 leading-relaxed">
                  Questions about your subscription or billing? Our support team is here to help you.
                </p>
                <Button 
                  className="w-full group hover:shadow-md transition-all duration-200 bg-white hover:bg-gray-50 text-gray-900 border border-gray-300" 
                  variant="outline"
                  onClick={() => window.open('/contact-sales', '_blank')}
                >
                  <div className="flex items-center gap-2">
                    <HelpCircle className="w-4 h-4" />
                    <span className="font-semibold">Contact Support</span>
                  </div>
                  <ArrowRight className="w-4 h-4 ml-auto group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardContent>
            </Card>

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

