import React, { useEffect, useMemo, useState } from 'react';
import { X, Zap, Check, ChevronDown, AlertTriangle } from 'lucide-react';
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
  lowCredits?: boolean;
}

export const CreditPurchaseModal: React.FC<CreditPurchaseModalProps> = ({ open, onClose, lowCredits = false }) => {
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [loading, setLoading] = useState(false);
  const [purchasingPackageId, setPurchasingPackageId] = useState<string | null>(null);
  const [selectedPackageId, setSelectedPackageId] = useState<string>('');
  const [desiredCredits, setDesiredCredits] = useState<string>('');
  const [purchaseMode, setPurchaseMode] = useState<'package' | 'desired'>('package');
  const [desiredCreditPriceTiers, setDesiredCreditPriceTiers] = useState<FlexibleCreditRange[]>([]);
  const [flexiblePackageId, setFlexiblePackageId] = useState<string>('');

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
          setFlexiblePackageId(flexiblePackage._id || '');
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

  const handlePurchase = async (creditPackage: CreditPackage,purchaseMode:string) => {
    const packageId = creditPackage._id || creditPackage.id;
    if (!packageId) {
      toast.error('Invalid package ID');
      return;
    }

    if (purchaseMode === 'desired') {
      if (!flexiblePackageId) {
        toast.error('Flexible credit package not available');
        return;
      }
      if (!normalizedDesiredCredits || normalizedDesiredCredits <= 0) {
        toast.error('Please select the number of credits to purchase');
        return;
      }
      if (!desiredCreditPricing || desiredCreditPricing.total <= 0) {
        toast.error('Unable to calculate pricing. Please adjust credit amount.');
        return;
      }
    }

    try {
      setPurchasingPackageId(packageId);
      const t = toast.loading('Redirecting to secure payment...');
      let session;
      if(purchaseMode !='desired'){
       session = await SubscriptionService.createCreditPurchaseCheckoutSession(packageId);
      }else{
        const totalCost = desiredCreditPricing!.total;
        const creditsCount = normalizedDesiredCredits!;
        session = await SubscriptionService.flexibleCreditPurchaseCheckoutSession(flexiblePackageId, totalCost, creditsCount);
      }
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
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" onClick={onClose} aria-hidden />
      <div className="relative mx-auto w-full max-w-2xl px-4">
        <div className="overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-2xl">
          {lowCredits && (
            <div className="flex items-center gap-2.5 border-b border-amber-500/30 bg-amber-500/10 px-6 py-3 dark:bg-amber-500/15">
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <p className="text-sm font-medium text-amber-950 dark:text-amber-100">
                You&apos;ve run out of credits — purchase more to continue.
              </p>
            </div>
          )}
          <div className="flex items-center justify-between px-6 py-5">
            <div className="flex items-center gap-3">
              <div className={`rounded-xl p-2 ${lowCredits ? 'bg-amber-500/15' : 'bg-primary/10'}`}>
                <Zap className={`h-4 w-4 ${lowCredits ? 'text-amber-600 dark:text-amber-400' : 'text-primary'}`} />
              </div>
              <div>
                <h3 className="text-[18px] font-extrabold leading-none text-foreground">
                  {lowCredits ? 'Insufficient Credits' : 'Need More Credits?'}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {lowCredits
                    ? 'Top up your credits below to continue without interruption.'
                    : 'Choose a plan and continue building seamlessly.'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="px-6 pb-6">
            {loading ? (
              <div className="rounded-2xl border border-border bg-muted/30 p-8 text-center text-muted-foreground">
                Loading credit packages...
              </div>
            ) : !selectedPackage ? (
              <div className="rounded-2xl border border-border bg-muted/30 p-8 text-center text-muted-foreground">
                No credit packages available
              </div>
            ) : (
              <>
                <div className="rounded-lg border border-border bg-card p-6">
                  <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {purchaseMode === 'desired'
                      ? 'Buy Credits'
                      : (selectedPackage.name || 'Credit Plan')}
                  </div>
                  <div className="mt-1 text-3xl font-extrabold text-foreground">
                    {purchaseMode === 'desired'
                      ? normalizedDesiredCredits
                        ? formatCurrency(selectedPackage.currency, desiredCreditPricing?.total || 0)
                        : 'Enter credits'
                      : formatCurrency(selectedPackage.currency, selectedPackage.price)}
                    {purchaseMode === 'package' && (
                      <span className="text-base font-semibold text-muted-foreground"> only</span>
                    )}
                  </div>
                  {purchaseMode === 'desired' && normalizedDesiredCredits && desiredCreditPricing && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {desiredCreditPricing.breakdown
                        ? /* tiered */ <>Effective rate: <span className="font-semibold text-foreground">{formatCurrency(selectedPackage.currency, desiredCreditPricing.perCredit)}/credit</span> (blended across tiers)</>
                        : /* slab   */ <>{normalizedDesiredCredits.toLocaleString()} credits × {formatCurrency(selectedPackage.currency, desiredCreditPricing.perCredit)}/credit</>
                      }
                    </p>
                  )}
             

                  <div className="mt-3 inline-flex overflow-hidden rounded-md border border-border">
                    <button
                      type="button"
                      onClick={() => setPurchaseMode('package')}
                      className={`px-3 py-1.5 text-xs font-semibold transition ${
                        purchaseMode === 'package'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-background text-foreground hover:bg-muted'
                      }`}
                    >
                      Packages
                    </button>
                    <button
                      type="button"
                      onClick={() => setPurchaseMode('desired')}
                      className={`border-l border-border px-3 py-1.5 text-xs font-semibold transition ${
                        purchaseMode === 'desired'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-background text-foreground hover:bg-muted'
                      }`}
                    >
                      Buy credits
                    </button>
                  </div>

                  {purchaseMode === 'package' ? (
                    
                    <div className="relative mt-2">
                      <select
                        value={String(selectedPackage._id || selectedPackage.id || '')}
                        onChange={(e) => setSelectedPackageId(e.target.value)}
                        className="w-full cursor-pointer appearance-none rounded-sm border border-border bg-background py-1 pl-4 pr-11 text-[18px] font-semibold leading-tight text-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        {packages.map((pkg) => (
                          <option className="rounded-sm" key={String(pkg._id || pkg.id)} value={String(pkg._id || pkg.id)}>
                            {pkg.credits.toLocaleString()} credits
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                    </div>
                  ) : (
                    <div className="mt-5 space-y-4">
                      {desiredCreditPriceTiers.length === 0 ? (
                        <p className="text-xs text-muted-foreground">Loading pricing tiers…</p>
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
                                  background: `linear-gradient(to right, var(--primary) ${sliderFillPct}%, var(--muted) ${sliderFillPct}%)`,
                                }}
                                className="h-2 w-full cursor-pointer appearance-none rounded-full [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-primary [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-md"
                              />
                              <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
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
                              className="w-15 shrink-0 rounded-md border border-border bg-background py-1 text-center text-sm font-semibold text-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring"
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
                                    className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition ${
                                      isActive
                                        ? 'border-primary bg-primary text-primary-foreground'
                                        : 'border-border bg-muted/40 text-muted-foreground'
                                    }`}
                                  >
                                    {label}
                                    <span className={isActive ? 'text-primary-foreground/85' : 'text-muted-foreground'}>
                                      · ${tier.pricePerCredit}/cr
                                    </span>
                                  </span>
                                );
                              })}
                          </div>

                          {/* Tiered breakdown table — only shown when tiered pricing is active and credits entered */}
                          {desiredCreditPricing?.breakdown && desiredCreditPricing.breakdown.length > 0 && (
                            <div className="overflow-hidden rounded-lg border border-primary/25 bg-primary/5">
                              <div className="flex items-center gap-1.5 border-b border-border px-3 py-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Progressive pricing breakdown</span>
                              </div>
                              <table className="w-full text-xs">
                                <thead>
                                  <tr className="border-b border-border text-[10px] uppercase tracking-wide text-muted-foreground">
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
                                        className={`border-b border-border ${isLast ? 'bg-primary/5' : ''}`}
                                      >
                                        <td className="px-3 py-2 text-muted-foreground">
                                          <span className="inline-flex items-center gap-1">
                                            <span className={`h-1.5 w-1.5 rounded-full ${isLast ? 'bg-primary' : 'bg-muted-foreground/40'}`} />
                                            {row.from}–{row.to}
                                          </span>
                                        </td>
                                        <td className="px-3 py-2 text-right font-medium text-foreground">{creditsInTier.toLocaleString()}</td>
                                        <td className="px-3 py-2 text-right text-muted-foreground">{formatCurrency(selectedPackage.currency, row.rate)}</td>
                                        <td className="px-3 py-2 text-right font-semibold text-foreground">{formatCurrency(selectedPackage.currency, row.cost)}</td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                                <tfoot>
                                  <tr className="border-t-2 border-primary/25 bg-primary/10">
                                    <td colSpan={2} className="px-3 py-2.5 text-xs font-bold text-foreground">
                                      Total
                                      <span className="ml-2 text-[10px] font-normal text-muted-foreground">
                                        (eff. {formatCurrency(selectedPackage.currency, desiredCreditPricing.perCredit)}/credit)
                                      </span>
                                    </td>
                                    <td className="px-3 py-2.5 text-right text-[10px] text-muted-foreground">{normalizedDesiredCredits?.toLocaleString()} credits</td>
                                    <td className="px-3 py-2.5 text-right text-sm font-extrabold text-primary">
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
                    type="button"
                    disabled={purchasingPackageId === String(selectedPackage._id || selectedPackage.id || '')}
                    onClick={() => handlePurchase(selectedPackage,purchaseMode)}
                    className={`mt-5 h-9 w-auto rounded-sm p-2 text-sm font-bold transition ${
                      purchasingPackageId === String(selectedPackage._id || selectedPackage.id || '')
                        ? 'cursor-not-allowed bg-primary/60 text-primary-foreground'
                        : 'bg-primary text-primary-foreground hover:bg-primary/90'
                    }`}
                  >
                    {purchasingPackageId === String(selectedPackage._id || selectedPackage.id || '') ? 'Processing...' : purchaseMode === 'desired' ? 'Continue' : 'Upgrade plan'}
                  </button>
                </div>

                <div className="mt-3 rounded-md bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">
                    {purchaseMode === 'desired'
                      ? normalizedDesiredCredits
                        ? `${normalizedDesiredCredits.toLocaleString()} credits`
                        : 'credits'
                      : pricingInfo?.creditsLabel}
                  </span>{' '}
                  will be added to your account on successful payment.
                </div>
                <div className="mt-4 grid grid-cols-1 gap-3 border-t border-border pt-4 text-sm sm:grid-cols-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                    <Check className="h-4 w-4 shrink-0 text-success" />
                    <span>Instant delivery</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                    <Check className="h-4 w-4 shrink-0 text-success" />
                    <span>Pay only for what you use</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                    <Check className="h-4 w-4 shrink-0 text-success" />
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
