import React from 'react';
import { X, FileText, Receipt, Download, CreditCard, Calendar } from 'lucide-react';
import type { Invoice } from '../../types';
import { SubscriptionService } from '../../services/subscriptionService';
import { Button } from '../DocumentService/ui/button';

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
  console.log(invoice);
  
  const handleDownload = async (type: 'invoice' | 'receipt') => {
    const id = String(invoice._id || invoice.id);
    if (!id) return;
    await SubscriptionService.downloadInvoiceFile(id, type);
  };

  return (
    <div className="fixed inset-0 z-[10002] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-xl mx-auto px-4">
        <div className="rounded-2xl overflow-hidden shadow-2xl bg-white text-gray-900">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-100">
                <FileText className="w-5 h-5 text-indigo-700" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Invoice Generated</h3>
                <p className="text-xs text-gray-500">
                  Your invoice and payment receipt are ready to download.
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <X className="w-5 h-5 text-gray-700" />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Plan</p>
                <p className="text-sm font-semibold text-gray-900">
                  {invoice.planName || 'Subscription Plan'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 mb-0.5">Amount</p>
                <p className="text-lg font-bold text-gray-900">
                  {invoice.currency || 'USD'}{' '}
                  {typeof invoice.amount === 'number'
                    ? invoice.amount.toFixed(2)
                    : invoice.amount}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-indigo-500" />
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-gray-500">
                    Invoice Number
                  </p>
                  <p className="font-medium text-gray-900 text-sm">
                    {invoice.invoiceNumber || '—'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-500" />
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-gray-500">
                    Receipt Number
                  </p>
                  <p className="font-medium text-gray-900 text-sm">
                    {invoice.receiptNumber || '—'}
                  </p>
                </div>
              </div>
              {invoice.type !== 'credit' && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-gray-500">
                      Billing Period
                    </p>
                    <p className="font-medium text-gray-900 text-sm">
                      {formatDate(invoice.periodStart)} – {formatDate(invoice.periodEnd)}
                    </p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-gray-500">
                    Created At
                  </p>
                  <p className="font-medium text-gray-900 text-sm">
                    {formatDate(invoice.createdAt)}
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-200 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
              <p className="text-xs text-gray-500">
                You can always find this invoice again in your Billing &amp; Usage history.
              </p>
              <div className="flex flex-wrap gap-2 justify-end">
                <Button
                  variant="outline"
                  className="inline-flex items-center gap-2"
                  onClick={() => handleDownload('invoice')}
                >
                  <Download className="w-4 h-4" />
                  <span className="text-xs font-semibold">Download Invoice</span>
                </Button>
                <Button
                  className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
                  onClick={() => handleDownload('receipt')}
                >
                  <Download className="w-4 h-4" />
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


