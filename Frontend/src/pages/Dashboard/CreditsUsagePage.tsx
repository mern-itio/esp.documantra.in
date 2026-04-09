import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { subscriptionApi } from '../../services/apiHelper';
import { SubscriptionService } from '../../services/subscriptionService';
import { useSubscription } from '../../context/SubscriptionContext';
import {
  ArrowLeft,
  FileText,
  ExternalLink,
  ChevronDown,
  Calendar,
  CheckCircle2
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';
import type { Invoice } from '../../types';

interface UsageRow {
  _id?: string;
  action: string;
  toolId?: string;
  creditsDelta: number;
  balanceAfter: number;
  createdAt: string;
  success?: boolean;
  reason?: string;
}

/** Stable calendar month key for filtering (YYYY-MM). */
const monthKeyFromDate = (d: Date): string => {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const monthKeysBetween = (start: Date, end: Date): string[] => {
  const keys: string[] = [];
  const cur = new Date(start.getFullYear(), start.getMonth(), 1);
  const last = new Date(end.getFullYear(), end.getMonth(), 1);
  while (cur <= last) {
    keys.push(monthKeyFromDate(cur));
    cur.setMonth(cur.getMonth() + 1);
  }
  return keys;
};

const monthLabelFromKey = (key: string): string => {
  const [y, m] = key.split('-').map(Number);
  if (!y || !m) return key;
  return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};

const CreditsUsagePage: React.FC = () => {
  const { userPlan } = useSubscription();
  const [allRows, setAllRows] = React.useState<UsageRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [invoices, setInvoices] = React.useState<Invoice[]>([]);
  const [loadingInvoices, setLoadingInvoices] = React.useState(true);

  const [selectedIncludedMonthKey, setSelectedIncludedMonthKey] = useState<string>('');
  const [selectedOnDemandMonth, setSelectedOnDemandMonth] = useState<string>('');
  const [selectedInvoiceMonth, setSelectedInvoiceMonth] = useState<string>('');

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const rRes = await subscriptionApi.get('/usage/records');
      const payload = (rRes as any).data?.data || {};
      const recs = (payload.records || []) as UsageRow[];
      setAllRows(recs);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();

    let mounted = true;
    (async () => {
      setLoadingInvoices(true);
      try {
        const invs = await SubscriptionService.getAllInvoices();
        if (mounted) {
          setInvoices(invs);
        }
      } catch (err) {
        console.error('Error loading invoices:', err);
      } finally {
        if (mounted) {
          setLoadingInvoices(false);
        }
      }
    })();
    return () => { mounted = false; };
  }, [load]);

  const formatDate = (date: Date | string) => {
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const currentPeriod = useMemo(() => {
    if (!userPlan?.periodStart || !userPlan?.periodEnd) return null;
    return {
      start: new Date(userPlan.periodStart),
      end: new Date(userPlan.periodEnd)
    };
  }, [userPlan]);

  /** Calendar months for the dropdown: continuous range from first→last usage, plus plan/invoice months. */
  const availableIncludedMonths = useMemo(() => {
    const set = new Set<string>();
    let minD: Date | null = null;
    let maxD: Date | null = null;

    allRows.forEach((row) => {
      if (row.createdAt) {
        const d = new Date(row.createdAt);
        set.add(monthKeyFromDate(d));
        if (!minD || d < minD) minD = d;
        if (!maxD || d > maxD) maxD = d;
      }
    });

    if (minD && maxD) {
      monthKeysBetween(minD, maxD).forEach((k) => set.add(k));
    }

    if (currentPeriod) {
      monthKeysBetween(currentPeriod.start, currentPeriod.end).forEach((k) => set.add(k));
    }
    invoices.forEach((inv) => {
      if (inv.periodStart && inv.periodEnd) {
        monthKeysBetween(new Date(inv.periodStart), new Date(inv.periodEnd)).forEach((k) => set.add(k));
      }
      if (inv.createdAt) {
        const d = new Date(inv.createdAt);
        set.add(monthKeyFromDate(d));
      }
    });
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [allRows, currentPeriod, invoices]);

  useEffect(() => {
    if (availableIncludedMonths.length > 0 && !selectedIncludedMonthKey) {
      setSelectedIncludedMonthKey(availableIncludedMonths[0]);
    }
  }, [availableIncludedMonths, selectedIncludedMonthKey]);

  const availableOnDemandMonths = useMemo(() => {
    const months = new Set<string>();
    allRows.forEach(row => {
      if (row.createdAt) {
        const date = new Date(row.createdAt);
        const monthKey = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        months.add(monthKey);
      }
    });
    return Array.from(months).sort().reverse();
  }, [allRows]);

  useEffect(() => {
    if (availableOnDemandMonths.length > 0 && !selectedOnDemandMonth) {
      setSelectedOnDemandMonth(availableOnDemandMonths[0]);
    }
  }, [availableOnDemandMonths, selectedOnDemandMonth]);

  const availableInvoiceMonths = useMemo(() => {
    const months = new Set<string>();
    invoices.forEach(inv => {
      if (inv.createdAt) {
        const date = new Date(inv.createdAt);
        const monthKey = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        months.add(monthKey);
      }
    });
    return Array.from(months).sort().reverse();
  }, [invoices]);

  useEffect(() => {
    if (availableInvoiceMonths.length > 0 && !selectedInvoiceMonth) {
      setSelectedInvoiceMonth(availableInvoiceMonths[0]);
    }
  }, [availableInvoiceMonths, selectedInvoiceMonth]);

  const includedUsage = useMemo(() => {
    if (!selectedIncludedMonthKey) return [];
    const usageMap = new Map<string, { item: string; credits: number; cost: number }>();
    allRows
      .filter(row => {
        const rowDate = new Date(row.createdAt);
        return monthKeyFromDate(rowDate) === selectedIncludedMonthKey && row.creditsDelta < 0;
      })
      .forEach(row => {
        const item = row.action || row.toolId || 'Usage';
        const credits = Math.abs(row.creditsDelta);
        const existing = usageMap.get(item) || { item, credits: 0, cost: 0 };
        existing.credits += credits;
        existing.cost += credits * 0.0001;
        usageMap.set(item, existing);
      });

    return Array.from(usageMap.values());
  }, [selectedIncludedMonthKey, allRows]);
  const includedTotal = useMemo(() => {
    return includedUsage.reduce((sum, item) => sum + item.credits, 0);
  }, [includedUsage]);
  const includedUsageByModuleData = useMemo(() => {
    if (!selectedIncludedMonthKey) return [];
    const moduleTotals = new Map<string, number>();
    const moduleFromRow = (action?: string, toolId?: string): string => {
      const a = String(action || '').toLowerCase();
      const t = String(toolId || '').toLowerCase();
      if (a.startsWith('esign:') || a.includes('envelope') || a.includes('sign')) return 'E-Sign';
      if (a.startsWith('pdf:') || t.includes('pdf')) return 'PDF Tools';
      if (a.startsWith('document:') || a.includes('document') || a.includes('share')) return 'Document';
      if (a.startsWith('auth:') || a.includes('auth')) return 'Authentication';
      return 'Other';
    };

    allRows
      .filter((row) => {
        const rowDate = new Date(row.createdAt);
        return monthKeyFromDate(rowDate) === selectedIncludedMonthKey && row.creditsDelta < 0;
      })
      .forEach((row) => {
        const module = moduleFromRow(row.action, row.toolId);
        const current = moduleTotals.get(module) || 0;
        moduleTotals.set(module, current + Math.abs(row.creditsDelta));
      });

    const palette: Record<string, string> = {
      'E-Sign': '#4f46e5',
      'PDF Tools': '#0ea5e9',
      Document: '#10b981',
      Authentication: '#f59e0b',
      Other: '#6b7280',
    };

    return Array.from(moduleTotals.entries())
      .map(([module, credits]) => ({
        module,
        credits,
        color: palette[module] || '#6b7280',
      }))
      .sort((a, b) => b.credits - a.credits);
  }, [selectedIncludedMonthKey, allRows]);
  const filteredInvoices = useMemo(() => {
    if (!selectedInvoiceMonth) return invoices;
    return invoices.filter(inv => {
      if (!inv.createdAt) return false;
      const date = new Date(inv.createdAt);
      const monthKey = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      return monthKey === selectedInvoiceMonth;
    });
  }, [invoices, selectedInvoiceMonth]);
  const chartTickFill = 'var(--muted-foreground)';
  const chartGridStroke = 'var(--border)';

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="mb-2 flex items-center gap-3">
              <Link
                to="/dashboard"
                aria-label="Back to Dashboard"
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Credits & Usage</h1>
                <p className="mt-1 text-sm text-muted-foreground">Track your billing and usage history</p>
              </div>
            </div>
          </div>
        </div>
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-lg">
          <div className="border-b border-border bg-gradient-to-r from-muted/40 to-card px-6 py-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-foreground">Included Usage</h2>
                {selectedIncludedMonthKey && (
                  <p className="mt-1 text-sm text-muted-foreground">{monthLabelFromKey(selectedIncludedMonthKey)}</p>
                )}
              </div>
              {availableIncludedMonths.length > 0 && (
                <div className="relative">
                  <select
                    value={selectedIncludedMonthKey}
                    onChange={(e) => setSelectedIncludedMonthKey(e.target.value)}
                    className="cursor-pointer appearance-none rounded-lg border border-border bg-background px-4 py-2 pr-8 text-sm font-medium text-foreground hover:border-muted-foreground/40 focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring"
                    aria-label="Filter included usage by month"
                  >
                    {availableIncludedMonths.map((monthKey) => (
                      <option key={monthKey} value={monthKey}>
                        {monthLabelFromKey(monthKey)}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
                </div>
              )}
            </div>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="py-8 text-center text-muted-foreground">
                <Calendar className="mx-auto mb-2 h-6 w-6 animate-spin" />
                <p className="text-sm">Loading usage...</p>
              </div>
            ) : availableIncludedMonths.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <p className="text-sm">No usage history yet — months will appear here once you have activity.</p>
              </div>
            ) : includedUsage.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <p className="text-sm">
                  No included usage for {selectedIncludedMonthKey ? monthLabelFromKey(selectedIncludedMonthKey) : 'this month'}.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="mb-2 text-sm font-semibold text-foreground">Included in {userPlan?.name || 'Plan'}</div>
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <div className="rounded-lg border border-border bg-muted/30 p-4">
                    <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Monthly usage by module
                    </div>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={includedUsageByModuleData}
                          margin={{ top: 6, right: 16, left: 8, bottom: 24 }}
                          barCategoryGap={18}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke} opacity={0.6} />
                          <XAxis dataKey="module" type="category" tick={{ fontSize: 11, fill: chartTickFill }} interval={0} angle={-10} textAnchor="end" height={52} />
                          <YAxis type="number" tick={{ fontSize: 11, fill: chartTickFill }} />
                          <Tooltip
                            formatter={(value: any) => [`${Number(value).toLocaleString()} credits`, 'Usage']}
                            contentStyle={{
                              background: 'var(--card)',
                              border: '1px solid var(--border)',
                              borderRadius: '0.5rem',
                              color: 'var(--foreground)',
                            }}
                          />
                          <Bar dataKey="credits" radius={[6, 6, 0, 0]} maxBarSize={60}>
                            {includedUsageByModuleData.map((entry, index) => (
                              <Cell key={`module-cell-${index}`} fill={entry.color} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="rounded-lg border border-border bg-card p-1">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Item</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Credits</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {includedUsage.map((item, idx) => (
                          <tr key={idx} className="transition-colors hover:bg-muted/40">
                            <td className="px-4 py-3 text-sm text-foreground">{item.item}</td>
                            <td className="px-4 py-3 text-right text-sm text-foreground">
                              {item.credits.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                        <tr className="border-t-2 border-border font-semibold">
                          <td className="px-4 py-3 text-sm text-foreground">Total</td>
                          <td className="px-4 py-3 text-right text-sm text-foreground">
                            {includedTotal.toLocaleString()}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-lg">
          <div className="border-b border-border bg-gradient-to-r from-muted/40 to-card px-6 py-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-foreground">Invoices</h2>
              </div>
              {availableInvoiceMonths.length > 0 && (
                <div className="relative">
                  <select
                    value={selectedInvoiceMonth}
                    onChange={(e) => setSelectedInvoiceMonth(e.target.value)}
                    className="cursor-pointer appearance-none rounded-lg border border-border bg-background px-4 py-2 pr-8 text-sm font-medium text-foreground hover:border-muted-foreground/40 focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {availableInvoiceMonths.map(month => (
                      <option key={month} value={month}>{month}</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
                </div>
              )}
            </div>
          </div>

          <div className="p-6">
            {loadingInvoices ? (
              <div className="py-8 text-center text-muted-foreground">
                <FileText className="mx-auto mb-2 h-6 w-6 animate-spin" />
                <p className="text-sm">Loading invoices...</p>
              </div>
            ) : filteredInvoices.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <p className="text-sm">No invoices found for this period</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Description</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Amount</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Invoice</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredInvoices.map((invoice) => {
                    const invoiceId = invoice._id || invoice.id;
                    const invoiceUrl = `/invoice/${invoiceId}`;

                    return (
                      <tr key={invoiceId} className="transition-colors hover:bg-muted/40">
                        <td className="px-4 py-3 text-sm text-foreground">
                          {invoice.createdAt ? formatDate(invoice.createdAt) : '—'}
                        </td>
                        <td className="px-4 py-3 text-sm text-foreground">
                          {invoice.planName || 'Subscription'}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-2.5 py-1 text-xs font-semibold text-success">
                            <CheckCircle2 className="h-3 w-3" />
                            Paid
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-foreground">
                          {typeof invoice.amount === 'number' ? invoice.amount.toFixed(2) : invoice.amount} {invoice.currency || 'USD'}
                        </td>
                        <td className="px-4 py-3 text-right text-sm">
                          <Link to={invoiceUrl}
                            className="inline-flex items-center gap-1 font-medium text-primary hover:text-primary/90"
                          >
                            View
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreditsUsagePage;
