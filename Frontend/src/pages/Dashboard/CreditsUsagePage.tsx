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

const CreditsUsagePage: React.FC = () => {
  const { userPlan } = useSubscription();
  const [allRows, setAllRows] = React.useState<UsageRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [invoices, setInvoices] = React.useState<Invoice[]>([]);
  const [loadingInvoices, setLoadingInvoices] = React.useState(true);

  const [selectedIncludedPeriod, setSelectedIncludedPeriod] = useState<string>('');
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

  const availablePeriods = useMemo(() => {
    const periods = new Set<string>();
    if (currentPeriod) {
      const periodKey = `${formatDate(currentPeriod.start)} - ${formatDate(currentPeriod.end)}`;
      periods.add(periodKey);
    }
    invoices.forEach(inv => {
      if (inv.periodStart && inv.periodEnd) {
        const periodKey = `${formatDate(inv.periodStart)} - ${formatDate(inv.periodEnd)}`;
        periods.add(periodKey);
      }
    });
    return Array.from(periods).sort().reverse();
  }, [currentPeriod, invoices]);

  useEffect(() => {
    if (availablePeriods.length > 0 && !selectedIncludedPeriod) {
      setSelectedIncludedPeriod(availablePeriods[0]);
    }
  }, [availablePeriods, selectedIncludedPeriod]);

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
    if (!selectedIncludedPeriod || !currentPeriod) return [];
    const [startStr, endStr] = selectedIncludedPeriod.split(' - ');
    const periodStart = new Date(startStr);
    const periodEnd = new Date(endStr);
    const usageMap = new Map<string, { item: string; credits: number; cost: number }>();
    allRows
      .filter(row => {
        const rowDate = new Date(row.createdAt);
        return rowDate >= periodStart && rowDate <= periodEnd && row.creditsDelta < 0;
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
  }, [selectedIncludedPeriod, allRows, currentPeriod]);
  const includedTotal = useMemo(() => {
    return includedUsage.reduce((sum, item) => sum + item.credits, 0);
  }, [includedUsage]);
  const includedUsageByModuleData = useMemo(() => {
    if (!selectedIncludedPeriod) return [];
    const [startStr, endStr] = selectedIncludedPeriod.split(' - ');
    const periodStart = new Date(startStr);
    const periodEnd = new Date(endStr);
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
        return rowDate >= periodStart && rowDate <= periodEnd && row.creditsDelta < 0;
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
  }, [selectedIncludedPeriod, allRows]);
  const filteredInvoices = useMemo(() => {
    if (!selectedInvoiceMonth) return invoices;
    return invoices.filter(inv => {
      if (!inv.createdAt) return false;
      const date = new Date(inv.createdAt);
      const monthKey = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      return monthKey === selectedInvoiceMonth;
    });
  }, [invoices, selectedInvoiceMonth]);
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Link
                to="/dashboard"
                aria-label="Back to Dashboard"
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-gray-600 hover:bg-white hover:shadow-sm transition-all"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Credits & Usage</h1>
                <p className="text-sm text-gray-500 mt-1">Track your billing and usage history</p>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Included Usage</h2>
                {selectedIncludedPeriod && (
                  <p className="text-sm text-gray-600 mt-1">{selectedIncludedPeriod}</p>
                )}
              </div>
              {availablePeriods.length > 0 && (
                <div className="relative">
                  <select
                    value={selectedIncludedPeriod}
                    onChange={(e) => setSelectedIncludedPeriod(e.target.value)}
                    className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 text-sm font-medium text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer"
                  >
                    {availablePeriods.map(period => (
                      <option key={period} value={period}>{period}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                </div>
              )}
            </div>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="w-6 h-6 animate-spin mx-auto mb-2" />
                <p className="text-sm">Loading usage...</p>
              </div>
            ) : includedUsage.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">No included usage for this period</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-sm font-semibold text-gray-700 mb-2">Included in {userPlan?.name || 'Plan'}</div>
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-600">
                      Monthly usage by module
                    </div>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={includedUsageByModuleData}
                          margin={{ top: 6, right: 16, left: 8, bottom: 24 }}
                          barCategoryGap={18}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis dataKey="module" type="category" tick={{ fontSize: 11, fill: '#374151' }} interval={0} angle={-10} textAnchor="end" height={52} />
                          <YAxis type="number" tick={{ fontSize: 11, fill: '#6b7280' }} />
                          <Tooltip formatter={(value: any) => [`${Number(value).toLocaleString()} credits`, 'Usage']} />
                          <Bar dataKey="credits" radius={[6, 6, 0, 0]} maxBarSize={60}>
                            {includedUsageByModuleData.map((entry, index) => (
                              <Cell key={`module-cell-${index}`} fill={entry.color} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="rounded-lg border border-gray-200 bg-white p-1">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Item</th>
                          <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Credits</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {includedUsage.map((item, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="py-3 px-4 text-sm text-gray-900">{item.item}</td>
                            <td className="py-3 px-4 text-sm text-gray-900 text-right">
                              {item.credits.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                        <tr className="border-t-2 border-gray-300 font-semibold">
                          <td className="py-3 px-4 text-sm text-gray-900">Total</td>
                          <td className="py-3 px-4 text-sm text-gray-900 text-right">
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
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Invoices</h2>
              </div>
              {availableInvoiceMonths.length > 0 && (
                <div className="relative">
                  <select
                    value={selectedInvoiceMonth}
                    onChange={(e) => setSelectedInvoiceMonth(e.target.value)}
                    className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 text-sm font-medium text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer"
                  >
                    {availableInvoiceMonths.map(month => (
                      <option key={month} value={month}>{month}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                </div>
              )}
            </div>
          </div>

          <div className="p-6">
            {loadingInvoices ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-6 h-6 animate-spin mx-auto mb-2" />
                <p className="text-sm">Loading invoices...</p>
              </div>
            ) : filteredInvoices.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">No invoices found for this period</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Description</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Amount</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Invoice</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredInvoices.map((invoice) => {
                    const invoiceId = invoice._id || invoice.id;
                    const invoiceUrl = `/invoice/${invoiceId}`;

                    return (
                      <tr key={invoiceId} className="hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm text-gray-900">
                          {invoice.createdAt ? formatDate(invoice.createdAt) : '—'}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-900">
                          {invoice.planName || 'Subscription'}
                        </td>
                        <td className="py-3 px-4 text-sm">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
                            <CheckCircle2 className="w-3 h-3" />
                            Paid
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-900 text-right">
                          {typeof invoice.amount === 'number' ? invoice.amount.toFixed(2) : invoice.amount} {invoice.currency || 'USD'}
                        </td>
                        <td className="py-3 px-4 text-sm text-right">
                          <Link to={invoiceUrl}
                            className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-700 font-medium"
                          >
                            View
                            <ExternalLink className="w-3.5 h-3.5" />
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
