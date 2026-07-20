import React from 'react';
import { X, FileText, Receipt, Download, CreditCard, Calendar } from 'lucide-react';
import type { Invoice } from '../../types';
import { SubscriptionService } from '../../services/subscriptionService';
import { Button } from '../DocumentService/ui/button';
import { formatBillingAmount } from '../../utils/billingCurrency';

interface InvoiceModalProps {
  open: boolean;
  onClose: () => void;
  invoice: Invoice | null;
}

const formatDate = (value?: string) => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString();
};

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ open, onClose, invoice }) => {
  if (!open || !invoice) return null;

  const handleDownload = async (type: 'invoice' | 'receipt') => {
    const id = String(invoice._id || invoice.id);
    if (!id) return;
    await SubscriptionService.downloadInvoiceFile(id, type);
  };

  return (
    <div className="fixed inset-0 z-[10002] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" onClick={onClose} aria-hidden />
      <div className="relative mx-auto w-full max-w-xl px-4">
        <div className="overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/15 p-2">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">Invoice Generated</h3>
                <p className="text-xs text-muted-foreground">
                  Your invoice and payment receipt are ready to download.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body */}
          <div className="space-y-4 px-6 py-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="mb-0.5 text-xs text-muted-foreground">Plan</p>
                <p className="text-sm font-semibold text-foreground">
                  {invoice.planName || 'Subscription Plan'}
                </p>
              </div>
              <div className="text-right">
                <p className="mb-0.5 text-xs text-muted-foreground">Amount</p>
                <p className="text-lg font-bold tabular-nums text-foreground">
                  {formatBillingAmount(invoice.amount, invoice.currency)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 shrink-0 text-primary" />
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    Invoice Number
                  </p>
                  <p className="text-sm font-medium text-foreground">
                    {invoice.invoiceNumber || '—'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Receipt className="h-4 w-4 shrink-0 text-success" />
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    Receipt Number
                  </p>
                  <p className="text-sm font-medium text-foreground">
                    {invoice.receiptNumber || '—'}
                  </p>
                </div>
              </div>
              {invoice.type !== 'credit' && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                      Billing Period
                    </p>
                    <p className="text-sm font-medium text-foreground">
                      {formatDate(invoice.periodStart)} – {formatDate(invoice.periodEnd)}
                    </p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    Created At
                  </p>
                  <p className="text-sm font-medium text-foreground">
                    {formatDate(invoice.createdAt)}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-border pt-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted-foreground">
                You can always find this invoice again in your Billing &amp; Usage history.
              </p>
              <div className="flex flex-wrap justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="inline-flex items-center gap-2 border-border bg-primary/10 text-foreground"
                  onClick={() => handleDownload('invoice')}
                >
                  <Download className="h-4 w-4" />
                  <span className="text-xs font-semibold">Download Invoice</span>
                </Button>
                <Button
                  type="button"
                  className="inline-flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={() => handleDownload('receipt')}
                >
                  <Download className="h-4 w-4" />
                  <span className="text-xs font-semibold">Download Receipt</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceModal;


