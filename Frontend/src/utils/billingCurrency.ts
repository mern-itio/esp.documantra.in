/** Billing currency helpers — display exactly what admin/package stores. */

export const DEFAULT_BILLING_CURRENCY = 'INR'

const LOCALE_BY_CURRENCY: Record<string, string> = {
  INR: 'en-IN',
  USD: 'en-US',
  EUR: 'en-IE',
  GBP: 'en-GB',
}

export function normalizeBillingCurrency(currency?: string | null): string {
  const curr = String(currency || '').trim().toUpperCase()
  return curr || DEFAULT_BILLING_CURRENCY
}

export function formatBillingAmount(
  amount: number | string | null | undefined,
  currency?: string | null
): string {
  const n = typeof amount === 'number' ? amount : Number(amount)
  const curr = normalizeBillingCurrency(currency)
  if (!Number.isFinite(n)) return `— ${curr}`

  const locale = LOCALE_BY_CURRENCY[curr] || 'en-US'
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: curr,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n)
  } catch {
    const symbol = curr === 'INR' ? '₹' : curr === 'USD' ? '$' : `${curr} `
    return `${symbol}${n.toFixed(2)}`
  }
}
