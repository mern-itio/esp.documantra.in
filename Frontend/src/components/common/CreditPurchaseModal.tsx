import React, { useEffect, useMemo, useState } from 'react';
import { X, Zap, Check, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import type { CreditPackage, Invoice } from '../../types';
import { SubscriptionService } from '../../services/subscriptionService';

interface CreditPurchaseModalProps {
  open: boolean;
  onClose: () => void;
  onPurchased?: (invoice: Invoice | null) => void;
}

export const CreditPurchaseModal: React.FC<CreditPurchaseModalProps> = ({ open, onClose }) => {
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [loading, setLoading] = useState(false);
  const [purchasingPackageId, setPurchasingPackageId] = useState<string | null>(null);
  const [selectedPackageId, setSelectedPackageId] = useState<string>('');

  useEffect(() => {
    if (!open) return;
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const creditPackages = await SubscriptionService.getCreditPackages();
        if (!mounted) return;
        const nextPackages = Array.isArray(creditPackages) ? creditPackages : [];
        setPackages(nextPackages);
        const preferred = nextPackages.find((p) => p.isPopular) || nextPackages[0];
        setSelectedPackageId((preferred?._id || preferred?.id || '').toString());
      } catch {
        if (!mounted) return;
        // Fallback packages if API fails
        const fallback: CreditPackage[] = [
          {
            _id: 'pkg-100',
            name: 'Starter',
            credits: 100,
            price: 9.99,
            currency: 'USD',
            description: 'Perfect for getting started'
          },
          {
            _id: 'pkg-500',
            name: 'Professional',
            credits: 500,
            price: 39.99,
            currency: 'USD',
            description: 'Most popular choice',
            isPopular: true,
            discount: 15
          },
          {
            _id: 'pkg-1000',
            name: 'Enterprise',
            credits: 1000,
            price: 69.99,
            currency: 'USD',
            description: 'For power users',
            discount: 25
          },
        ];
        setPackages(fallback);
        const preferred = fallback.find((p) => p.isPopular) || fallback[0];
        setSelectedPackageId((preferred?._id || preferred?.id || '').toString());
      } finally {
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [open]);

  const handlePurchase = async (creditPackage: CreditPackage) => {
    const packageId = creditPackage._id || creditPackage.id;
    if (!packageId) {
      toast.error('Invalid package ID');
      return;
    }

    try {
      setPurchasingPackageId(packageId);
      const t = toast.loading('Redirecting to secure payment...');
      const session = await SubscriptionService.createCreditPurchaseCheckoutSession(packageId);
      if (session.url) {
        toast.dismiss(t);
        window.location.href = session.url;
      } else {
        toast.error('Failed to start payment session', { id: t });
        setPurchasingPackageId(null);
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to start payment');
      setPurchasingPackageId(null);
    }
  };

  const calculateSavings = (price: number, discount?: number) => {
    if (!discount) return null;
    return ((price * discount) / 100).toFixed(2);
  };

  const formatCurrency = (currency: string | undefined, amount: number) => {
    const curr = (currency || 'USD').toUpperCase();
    const symbol = curr === 'USD' ? '$' : `${curr} `;
    return `${symbol}${amount.toFixed(2)}`;
  };

  const selectedPackage = useMemo(() => {
    if (!packages.length) return null;
    return (
      packages.find((p) => String(p._id || p.id) === String(selectedPackageId)) ||
      packages[0]
    );
  }, [packages, selectedPackageId]);

  const pricingInfo = useMemo(() => {
    if (!selectedPackage) return null;
    const discount = selectedPackage.discount || 0;
    const basePrice = selectedPackage.price || 0;
    const originalPrice = discount > 0 ? basePrice / (1 - discount / 100) : basePrice;
    const perCredit = selectedPackage.credits > 0 ? basePrice / selectedPackage.credits : 0;
    const creditsLabel = `${selectedPackage.credits.toLocaleString()} credits`;
    return { discount, basePrice, originalPrice, perCredit, creditsLabel };
  }, [selectedPackage]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[10001] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-2xl mx-auto px-4">
        <div className="rounded-xl overflow-hidden shadow-2xl bg-[#f8fafc] text-gray-900 border border-gray-200">
          <div className="flex items-center justify-between px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-[#260559]/10">
                <Zap className="w-4 h-4 text-[#260559]" />
              </div>
              <div>
                <h3 className="text-[18px] leading-none font-extrabold text-gray-900">Need More Credits?</h3>
                <p className="text-xs text-gray-600">Choose a plan and continue building seamlessly.</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-lg transition-colors">
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>

          <div className="px-6 pb-6">
            {loading ? (
              <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center text-gray-500">
                Loading credit packages...
              </div>
            ) : !selectedPackage ? (
              <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center text-gray-500">
                No credit packages available
              </div>
            ) : (
              <>
                <div className="rounded-lg border border-gray-200 bg-white p-6">
                  <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    {selectedPackage.name || 'Credit Plan'}
                  </div>
                  <div className="mt-1 text-3xl font-extrabold text-gray-900">
                    {formatCurrency(selectedPackage.currency, selectedPackage.price)}{' '}
                    <span className="text-base font-semibold text-gray-700">only</span>
                  </div>

                  <div className="mt-2 relative">
                    <select
                      value={String(selectedPackage._id || selectedPackage.id || '')}
                      onChange={(e) => setSelectedPackageId(e.target.value)}
                      className="w-full cursor-pointer rounded-sm p-2 appearance-none border border-gray-300 bg-white py-1 pl-4 pr-11 text-[18px] leading-tight font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#260559]/20 focus:border-[#260559]"
                    >
                      {packages.map((pkg) => (
                        <option className='rounded-sm' key={String(pkg._id || pkg.id)} value={String(pkg._id || pkg.id)}>
                          {pkg.credits.toLocaleString()} credits
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
                  </div>

                  {(selectedPackage.discount || selectedPackage.isPopular || selectedPackage.description || pricingInfo) && (
                    <div className="mt-3 space-y-1">
                      {selectedPackage.description && (
                        <p className="text-sm text-gray-600">{selectedPackage.description}</p>
                      )}
                      {pricingInfo && (
                        <p className="text-xs text-gray-600">
                          Effective rate: <span className="font-semibold text-gray-800">{formatCurrency(selectedPackage.currency, pricingInfo.perCredit)}</span> per credit
                        </p>
                      )}
                      {selectedPackage.discount && (
                        <p className="text-sm font-medium text-green-700">
                          Save {(calculateSavings(selectedPackage.price, selectedPackage.discount) || '0.00')} {selectedPackage.currency || 'USD'} ({selectedPackage.discount}% off)
                        </p>
                      )}
                      {pricingInfo && pricingInfo.discount > 0 && (
                        <p className="text-xs text-gray-500">
                          Regular price: <span className="line-through">{formatCurrency(selectedPackage.currency, pricingInfo.originalPrice)}</span>
                        </p>
                      )}
                      {selectedPackage.isPopular && (
                        <p className="text-sm font-medium text-[#260559]">Most popular plan</p>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-end">
                 
                  <button
                    disabled={purchasingPackageId === String(selectedPackage._id || selectedPackage.id || '')}
                    onClick={() => handlePurchase(selectedPackage)}
                    className={`mt-5 w-auto p-2 h-9 rounded-sm font-bold text-sm transition ${purchasingPackageId === String(selectedPackage._id || selectedPackage.id || '')
                        ? 'bg-[#260559]/60 text-white cursor-not-allowed'
                        : 'bg-[#260559] text-white hover:bg-[#34106a]'
                      }`}
                  >
                    {purchasingPackageId === String(selectedPackage._id || selectedPackage.id || '') ? 'Processing...' : 'Upgrade plan'}
                  </button>
                </div>

                <div className="mt-3 bg-white px-3 py-2 text-xs text-gray-600">
                  <span className="font-semibold text-gray-800">{pricingInfo?.creditsLabel}</span>{' '}
                  will be added to your account on successful payment.
                </div>
                <div className="mt-4 grid border-t border-gray-200 pt-4 grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                  <div className="flex text-xs font-bold items-center gap-2 text-gray-700">
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span>Instant delivery</span>
                  </div>
                  <div className="flex text-xs font-bold items-center gap-2 text-gray-700">
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span>Pay only for what you use</span>
                  </div>
                  <div className="flex text-xs font-bold items-center gap-2 text-gray-700">
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span>No hidden charges</span>
                  </div>
                </div>
               
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreditPurchaseModal;
