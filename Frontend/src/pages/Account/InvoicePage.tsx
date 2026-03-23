import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Receipt, Download, CreditCard, Calendar, Loader2 } from 'lucide-react';
import type { Invoice } from '../../types';
import { SubscriptionService } from '../../services/subscriptionService';
import { subscriptionApi } from '../../services/apiHelper';
import { Button } from '../../components/DocumentService/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/DocumentService/ui/card';

const formatDate = (value?: string) => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
};

const InvoicePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<'invoice' | 'receipt' | null>(null);

  useEffect(() => {
    if (!id) {
      navigate('/credits-usage');
      return;
    }

    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const response = await subscriptionApi.get(`/invoices/${id}`);
        if (mounted && response.data?.data) {
          setInvoice(response.data.data);
        } else if (mounted) {
          navigate('/credits-usage');
        }
      } catch (error) {
        console.error('Error fetching invoice:', error);
        if (mounted) {
          navigate('/credits-usage');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [id, navigate]);

  const handleDownload = async (type: 'invoice' | 'receipt') => {
    if (!invoice || !id) return;
    
    try {
      setDownloading(type);
      await SubscriptionService.downloadInvoiceFile(id, type);
    } catch (error) {
      console.error(`Error downloading ${type}:`, error);
    } finally {
      setDownloading(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading invoice...</p>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Invoice not found</p>
          <Button
            variant="outline"
            onClick={() => navigate('/credits-usage')}
            className="mt-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Credits & Usage
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/credits-usage')}
              className="p-2 hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Invoice Details</h1>
              <p className="text-sm text-gray-600 mt-1">View and download your invoice or receipt</p>
            </div>
          </div>
        </div>

        <Card className="hover:shadow-xl transition-shadow duration-300 border-gray-200">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <FileText className="w-5 h-5 text-indigo-600" />
              </div>
              <span className="text-xl font-bold text-gray-900">Invoice Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-200">
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Plan</p>
                <p className="text-lg font-semibold text-gray-900">
                  {invoice.planName || 'Subscription Plan'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 mb-0.5">Amount</p>
                <p className="text-2xl font-bold text-gray-900">
                  {invoice.currency || 'USD'}{' '}
                  {typeof invoice.amount === 'number'
                    ? invoice.amount.toFixed(2)
                    : invoice.amount}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">
                    Invoice Number
                  </p>
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-indigo-500" />
                    <p className="font-medium text-gray-900 text-sm">
                      {invoice.invoiceNumber || '—'}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">
                    Receipt Number
                  </p>
                  <div className="flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-emerald-500" />
                    <p className="font-medium text-gray-900 text-sm">
                      {invoice.receiptNumber || '—'}
                    </p>
                  </div>
                </div>
              </div>
              {invoice.type !== 'credit' && (
              <div className="space-y-4">
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">
                    Billing Period
                  </p>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <p className="font-medium text-gray-900 text-sm">
                      {formatDate(invoice.periodStart)} – {formatDate(invoice.periodEnd)}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">
                    Created At
                  </p>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <p className="font-medium text-gray-900 text-sm">
                      {formatDate(invoice.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
              )}
            </div>

            <div className="pt-4 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row gap-3 justify-end">
                <Button
                  variant="outline"
                  className="inline-flex items-center gap-2"
                  onClick={() => handleDownload('invoice')}
                  disabled={downloading === 'invoice'}
                >
                  {downloading === 'invoice' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  <span className="font-semibold">Download Invoice PDF</span>
                </Button>
                <Button
                  className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
                  onClick={() => handleDownload('receipt')}
                  disabled={downloading === 'receipt'}
                >
                  {downloading === 'receipt' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  <span className="font-semibold">Download Receipt PDF</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default InvoicePage;

