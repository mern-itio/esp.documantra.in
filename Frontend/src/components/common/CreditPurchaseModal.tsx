import React, { useEffect, useMemo, useState } from 'react';
import { X, Zap, Check, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import type { CreditPackage, Invoice } from '../../types';
import {
  SubscriptionService,
  type FlexibleCreditRange,
} from '../../services/subscriptionService';

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
  const [desiredCredits, setDesiredCredits] = useState<string>('');
  const [purchaseMode, setPurchaseMode] = useState<'package' | 'desired'>('package');
  const [desiredCreditPriceTiers, setDesiredCreditPriceTiers] = useState<FlexibleCreditRange[]>([]);

  useEffect(() => {
    if (!open) return;
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const [creditPackages, flexiblePackage] = await Promise.all([
          SubscriptionService.getCreditPackages(),
          SubscriptionService.getFlexibleCreditPackage(),
        ]);
        if (!mounted) return;
        const nextPackages = Array.isArray(creditPackages) ? creditPackages : [];
        setPackages(nextPackages);
        if (flexiblePackage?.ranges?.length) {
          setDesiredCreditPriceTiers(flexiblePackage.ranges);
        }
        const preferred = nextPackages.find((p) => p.isPopular) || nextPackages[0];
        setSelectedPackageId((preferred?._id || preferred?.id || '').toString());
        setDesiredCredits('');
        setPurchaseMode('package');
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
        setDesiredCredits('');
        setPurchaseMode('package');
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

  // Slider bounds derived from API tiers
  const sliderMin = useMemo(() => {
    if (!desiredCreditPriceTiers.length) return 1;
    return Math.min(...desiredCreditPriceTiers.map((t) => t.min));
  }, [desiredCreditPriceTiers]);

  const sliderMax = useMemo(() => {
    if (!desiredCreditPriceTiers.length) return 500;
    const maxVal = Math.max(...desiredCreditPriceTiers.map((t) => t.max));
    return Number.isFinite(maxVal) ? maxVal : 500;
  }, [desiredCreditPriceTiers]);

  const normalizedDesiredCredits = useMemo(() => {
    const parsed = Number(desiredCredits);
    if (!Number.isFinite(parsed) || parsed < 1) return null;
    return Math.floor(parsed);
  }, [desiredCredits]);

  const desiredCreditPricing = useMemo(() => {
    if (!normalizedDesiredCredits || !desiredCreditPriceTiers.length) return null;
    const sortedTiers = [...desiredCreditPriceTiers].sort((a, b) => a.min - b.min);

    // ─────────────────────────────────────────────────────────────────
    // PRICING LOGIC 1 — Slab-based (flat-rate bracket)
    //
    // The entire purchase is charged at the single rate of the slab the
    // quantity falls into.
    //
    // Example (tiers: 1-100 @ $10, 101-200 @ $8, 201-500 @ $6):
    //   499 credits → slab is 201-500 → 499 × $6 = $2,994
    // ─────────────────────────────────────────────────────────────────
    const activeTier = sortedTiers.find(
      (t) => normalizedDesiredCredits >= t.min && normalizedDesiredCredits <= t.max
    );
    if (!activeTier) return null;
    const slabTotal = normalizedDesiredCredits * activeTier.pricePerCredit;
    const slabResult = {
      perCredit: activeTier.pricePerCredit,
      total: slabTotal,
      tierLabel: `${activeTier.min}–${Number.isFinite(activeTier.max) ? activeTier.max : activeTier.min + '+'}`,
      breakdown: null as null | { from: number; to: number; rate: number; cost: number }[],
    };

    // ─────────────────────────────────────────────────────────────────
    // PRICING LOGIC 2 — Tiered / progressive pricing (like income tax)
    //
    // Each layer of credits is charged at its own slab rate. The cost
    // accumulates as you move through the tiers.
    //
    // Example (tiers: 1-100 @ $10, 101-200 @ $8, 201-500 @ $6):
    //   499 credits →
    //     first 100 × $10 = $1,000
    //     next  100 × $8  =   $800
    //     last  299 × $6  = $1,794
    //     total            = $3,594
    // ─────────────────────────────────────────────────────────────────
    // let remaining = normalizedDesiredCredits;
    // let tieredTotal = 0;
    // const breakdown: { from: number; to: number; rate: number; cost: number }[] = [];
    // for (const tier of sortedTiers) {
    //   if (remaining <= 0) break;
    //   const tierCapacity = tier.max === Number.POSITIVE_INFINITY
    //     ? remaining
    //     : Math.min(remaining, tier.max - tier.min + 1);
    //   const cost = tierCapacity * tier.pricePerCredit;
    //   breakdown.push({ from: tier.min, to: Math.min(tier.max, normalizedDesiredCredits), rate: tier.pricePerCredit, cost });
    //   tieredTotal += cost;
    //   remaining -= tierCapacity;
    // }
    // const effectiveRate = tieredTotal / normalizedDesiredCredits;
    // const tieredResult = {
    //   perCredit: effectiveRate,           // blended/effective rate
    //   total: tieredTotal,
    //   tierLabel: `progressive`,
    //   breakdown,
    // };

    // ── Active logic: swap the return value to switch between models ──
    return slabResult;
    // return tieredResult;
  }, [normalizedDesiredCredits, desiredCreditPriceTiers]);

  // Slider fill percentage for track styling
  const sliderFillPct = useMemo(() => {
    const val = normalizedDesiredCredits ?? sliderMin;
    return Math.round(((val - sliderMin) / Math.max(sliderMax - sliderMin, 1)) * 100);
  }, [normalizedDesiredCredits, sliderMin, sliderMax]);

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
                    {purchaseMode === 'desired'
                      ? 'Buy Credits'
                      : (selectedPackage.name || 'Credit Plan')}
                  </div>
                  <div className="mt-1 text-3xl font-extrabold text-gray-900">
                    {purchaseMode === 'desired'
                      ? normalizedDesiredCredits
                        ? formatCurrency(selectedPackage.currency, desiredCreditPricing?.total || 0)
                        : 'Enter credits'
                      : formatCurrency(selectedPackage.currency, selectedPackage.price)}
                    {purchaseMode === 'package' && (
                      <span className="text-base font-semibold text-gray-700"> only</span>
                    )}
                  </div>
                  {purchaseMode === 'desired' && normalizedDesiredCredits && desiredCreditPricing && (
                    <p className="mt-1 text-xs text-gray-500">
                      {desiredCreditPricing.breakdown
                        ? /* tiered */ <>Effective rate: <span className="font-semibold text-gray-700">{formatCurrency(selectedPackage.currency, desiredCreditPricing.perCredit)}/credit</span> (blended across tiers)</>
                        : /* slab   */ <>{normalizedDesiredCredits.toLocaleString()} credits × {formatCurrency(selectedPackage.currency, desiredCreditPricing.perCredit)}/credit</>
                      }
                    </p>
                  )}
             

                  <div className="mt-3 inline-flex rounded-md border border-gray-300 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setPurchaseMode('package')}
                      className={`px-3 py-1.5 text-xs font-semibold transition ${
                        purchaseMode === 'package'
                          ? 'bg-[#260559] text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      Packages
                    </button>
                    <button
                      type="button"
                      onClick={() => setPurchaseMode('desired')}
                      className={`px-3 py-1.5 text-xs font-semibold transition border-l border-gray-300 ${
                        purchaseMode === 'desired'
                          ? 'bg-[#260559] text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      Buy credits
                    </button>
                  </div>

                  {purchaseMode === 'package' ? (
                    
                    <div className="mt-2 relative">
                        <div className="text-xs  mb-2 p-1 font-semibold uppercase tracking-wide text-gray-500">
                   
                  </div>
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
                      <ChevronDown className="pointer-events-none absolute mt-2 right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
                    </div>
                  ) : (
                    <div className="mt-5 space-y-4">
                      {desiredCreditPriceTiers.length === 0 ? (
                        <p className="text-xs text-gray-500">Loading pricing tiers…</p>
                      ) : (
                        <>
                          {/* Credit count row: slider + numeric input */}
                          <div className="flex items-center gap-3">
                            <div className="relative flex-1">
                              <input
                                type="range"
                                min={sliderMin}
                                max={sliderMax}
                                step={1}
                                value={normalizedDesiredCredits ?? sliderMin}
                                onChange={(e) => setDesiredCredits(e.target.value)}
                                style={{
                                  background: `linear-gradient(to right, #260559 ${sliderFillPct}%, #e2e8f0 ${sliderFillPct}%)`,
                                }}
                                className="w-full h-2 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#260559] [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-[#260559] [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
                              />
                              <div className="mt-1 flex justify-between text-[10px] text-gray-400">
                                <span>{sliderMin}</span>
                                <span>{sliderMax}</span>
                              </div>
                            </div>
                            {/* Manual numeric input synced with slider */}
                            <input
                              type="number"
                              min={sliderMin}
                              max={sliderMax}
                              step={1}
                              inputMode="numeric"
                              value={desiredCredits}
                              onChange={(e) => {
                                const raw = e.target.value.replace(/[^\d]/g, '');
                                setDesiredCredits(raw);
                              }}
                              placeholder={String(sliderMin)}
                              className="w-15 shrink-0 rounded-md border border-gray-300 bg-white py-1 text-sm font-semibold text-gray-900 text-center focus:outline-none focus:ring-2 focus:ring-[#260559]/20 focus:border-[#260559]"
                            />
                          </div>

                          {/* Tier pricing chips */}
                          <div className="flex flex-wrap gap-2">
                            {[...desiredCreditPriceTiers]
                              .sort((a, b) => a.min - b.min)
                              .map((tier, i) => {
                                const isActive =
                                  normalizedDesiredCredits !== null &&
                                  normalizedDesiredCredits >= tier.min &&
                                  normalizedDesiredCredits <= tier.max;
                                const label = `${tier.min}–${Number.isFinite(tier.max) ? tier.max : '∞'} credits`;
                                return (
                                  <span
                                    key={i}
                                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition ${
                                      isActive
                                        ? 'bg-[#260559] text-white border-[#260559]'
                                        : 'bg-white text-gray-600 border-gray-300'
                                    }`}
                                  >
                                    {label}
                                    <span className={isActive ? 'text-purple-200' : 'text-gray-400'}>
                                      · ${tier.pricePerCredit}/cr
                                    </span>
                                  </span>
                                );
                              })}
                          </div>

                          {/* Tiered breakdown table — only shown when tiered pricing is active and credits entered */}
                          {desiredCreditPricing?.breakdown && desiredCreditPricing.breakdown.length > 0 && (
                            <div className="rounded-lg border border-[#260559]/20 bg-[#260559]/[0.03] overflow-hidden">
                              <div className="px-3 py-2 border-b border-[#260559]/10 flex items-center gap-1.5">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-[#260559]">Progressive pricing breakdown</span>
                              </div>
                              <table className="w-full text-xs">
                                <thead>
                                  <tr className="text-[10px] uppercase tracking-wide text-gray-400 border-b border-gray-100">
                                    <th className="px-3 py-1.5 text-left font-semibold">Tier</th>
                                    <th className="px-3 py-1.5 text-right font-semibold">Credits</th>
                                    <th className="px-3 py-1.5 text-right font-semibold">Rate</th>
                                    <th className="px-3 py-1.5 text-right font-semibold">Subtotal</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {desiredCreditPricing.breakdown.map((row, idx) => {
                                    const creditsInTier = row.to - row.from + 1;
                                    const isLast = idx === desiredCreditPricing.breakdown!.length - 1;
                                    return (
                                      <tr
                                        key={idx}
                                        className={`border-b border-gray-100 ${isLast ? 'bg-[#260559]/[0.04]' : ''}`}
                                      >
                                        <td className="px-3 py-2 text-gray-600">
                                          <span className="inline-flex items-center gap-1">
                                            <span className={`w-1.5 h-1.5 rounded-full ${isLast ? 'bg-[#260559]' : 'bg-gray-300'}`} />
                                            {row.from}–{row.to}
                                          </span>
                                        </td>
                                        <td className="px-3 py-2 text-right text-gray-700 font-medium">{creditsInTier.toLocaleString()}</td>
                                        <td className="px-3 py-2 text-right text-gray-600">{formatCurrency(selectedPackage.currency, row.rate)}</td>
                                        <td className="px-3 py-2 text-right font-semibold text-gray-800">{formatCurrency(selectedPackage.currency, row.cost)}</td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                                <tfoot>
                                  <tr className="border-t-2 border-[#260559]/20 bg-[#260559]/[0.06]">
                                    <td colSpan={2} className="px-3 py-2.5 text-xs font-bold text-gray-700">
                                      Total
                                      <span className="ml-2 text-[10px] font-normal text-gray-400">
                                        (eff. {formatCurrency(selectedPackage.currency, desiredCreditPricing.perCredit)}/credit)
                                      </span>
                                    </td>
                                    <td className="px-3 py-2.5 text-right text-[10px] text-gray-400">{normalizedDesiredCredits?.toLocaleString()} credits</td>
                                    <td className="px-3 py-2.5 text-right text-sm font-extrabold text-[#260559]">
                                      {formatCurrency(selectedPackage.currency, desiredCreditPricing.total)}
                                    </td>
                                  </tr>
                                </tfoot>
                              </table>
                            </div>
                          )}
                        </>
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
                    {purchasingPackageId === String(selectedPackage._id || selectedPackage.id || '') ? 'Processing...' : purchaseMode === 'desired' ? 'Continue' : 'Upgrade plan'}
                  </button>
                </div>

                <div className="mt-3 bg-white px-3 py-2 text-xs text-gray-600">
                  <span className="font-semibold text-gray-800">
                    {purchaseMode === 'desired'
                      ? normalizedDesiredCredits
                        ? `${normalizedDesiredCredits.toLocaleString()} credits`
                        : 'credits'
                      : pricingInfo?.creditsLabel}
                  </span>{' '}
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
