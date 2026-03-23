import React, { useEffect, useState } from 'react';
import { X, Zap, Check } from 'lucide-react';
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

  useEffect(() => {
    if (!open) return;
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const creditPackages = await SubscriptionService.getCreditPackages();
        if (!mounted) return;
        setPackages(Array.isArray(creditPackages) ? creditPackages : []);
      } catch {
        if (!mounted) return;
        // Fallback packages if API fails
        setPackages([
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
        ]);
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

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[10001] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-6xl mx-auto px-4">
        <div className="rounded-2xl overflow-hidden shadow-2xl bg-white text-gray-900">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Zap className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Buy Credits</h3>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-lg transition-colors">
              <X className="w-5 h-5 text-gray-700" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6">
            <p className="text-center text-gray-600 mb-8">
              Choose the credit package that best fits your needs
            </p>

            {loading ? (
              <div className="text-center py-16 text-gray-500">Loading credit packages...</div>
            ) : packages.length === 0 ? (
              <div className="text-center py-16 text-gray-500">No credit packages available</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {packages.map((creditPackage) => {
                  const packageId = creditPackage._id || creditPackage.id || '';
                  const isPurchasing = purchasingPackageId === packageId;
                  const savings = calculateSavings(creditPackage.price, creditPackage.discount);
                  
                  return (
                    <div
                      key={packageId}
                      className={`rounded-2xl p-6 border transition-all duration-300 ${
                        creditPackage.isPopular
                          ? 'border-indigo-500/50 bg-indigo-50 ring-2 ring-indigo-500/20 hover:shadow-xl'
                          : 'border-gray-200 bg-white hover:shadow-lg'
                      }`}
                    >
                      {/* Popular Badge */}
                      {creditPackage.isPopular && (
                        <div className="inline-flex items-center gap-2 text-xs px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 mb-3 font-semibold">
                          <Zap className="w-3 h-3" /> Most Popular
                        </div>
                      )}

                      {/* Package Name */}
                      <div className="text-sm text-gray-600 mb-1 font-medium">{creditPackage.name}</div>

                      {/* Description */}
                      {creditPackage.description && (
                        <p className="text-xs text-gray-600 mb-3">{creditPackage.description}</p>
                      )}

                      {/* Credits Display */}
                      <div className="mb-4">
                        <div className="text-4xl font-extrabold text-indigo-600 mb-1">
                          {creditPackage.credits.toLocaleString()}
                        </div>
                        <p className="text-xs text-gray-600">Credits</p>
                      </div>

                      {/* Price */}
                      <div className="mb-4 pb-4 border-b border-gray-200">
                        <div className="text-3xl font-extrabold text-gray-900 mb-1">
                          {creditPackage.currency || 'USD'}{' '}
                          {creditPackage.price.toFixed(2)}
                        </div>
                        {savings && (
                          <p className="text-xs text-green-600 font-semibold">
                            Save {creditPackage.currency || 'USD'} {savings} with this offer!
                          </p>
                        )}
                        {creditPackage.discount && (
                          <p className="text-xs text-indigo-600 font-medium mt-1">
                            {creditPackage.discount}% discount applied
                          </p>
                        )}
                      </div>

                      {/* Purchase Button */}
                      <button
                        disabled={isPurchasing}
                        onClick={() => handlePurchase(creditPackage)}
                        className={`w-full h-10 rounded-lg font-semibold transition mb-3 ${
                          creditPackage.isPopular
                            ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                            : 'bg-gray-900 text-white hover:bg-gray-800'
                        } ${isPurchasing ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        {isPurchasing ? 'Processing...' : 'Buy Now'}
                      </button>

                      {/* Benefits */}
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-gray-700">
                          <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                          <span>Instant delivery</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-700">
                          <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                          <span>Valid till your subscription ends</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-700">
                          <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                          <span>Use any time</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer Info */}
          <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-white border-t border-gray-200">
            <p className="text-xs text-gray-600 text-center">
              💳 Secure payment powered by Stripe | 🔒 Your payment information is encrypted
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreditPurchaseModal;
