/** Billing display defaults to INR for DocuMantra. */

export const DEFAULT_BILLING_CURRENCY = 'INR'

export function normalizeBillingCurrency(currency?: string | null): string {
  const curr = String(currency || DEFAULT_BILLING_CURRENCY).trim().toUpperCase()
  // Legacy rows / packages often stored USD while product is INR-priced.
  if (!curr || curr === 'USD') return DEFAULT_BILLING_CURRENCY
  return curr
}

export function formatBillingAmount(
  amount: number | string | null | undefined,
  currency?: string | null
): string {
  const n = typeof amount === 'number' ? amount : Number(amount)
  const curr = normalizeBillingCurrency(currency)
  if (!Number.isFinite(n)) return `— ${curr}`

  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: curr,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n)
  } catch {
    const symbol = curr === 'INR' ? '₹' : `${curr} `
    return `${symbol}${n.toFixed(2)}`
  }
}
