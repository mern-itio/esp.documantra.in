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
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading invoice...</p>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">Invoice not found</p>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/credits-usage')}
            className="mt-4 border-border"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Credits & Usage
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => navigate('/credits-usage')}
              className="p-2 transition-colors hover:bg-muted"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Invoice Details</h1>
              <p className="mt-1 text-sm text-muted-foreground">View and download your invoice or receipt</p>
            </div>
          </div>
        </div>

        <Card className="border-border transition-shadow duration-300 hover:shadow-xl">
          <CardHeader className="border-b border-border bg-gradient-to-r from-muted/40 to-card">
            <CardTitle className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/15 p-2">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <span className="text-xl font-bold text-card-foreground">Invoice Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 p-6">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <p className="mb-0.5 text-xs text-muted-foreground">Plan</p>
                <p className="text-lg font-semibold text-foreground">
                  {invoice.planName || 'Subscription Plan'}
                </p>
              </div>
              <div className="text-right">
                <p className="mb-0.5 text-xs text-muted-foreground">Amount</p>
                <p className="text-2xl font-bold text-foreground">
                  {invoice.currency || 'USD'}{' '}
                  {typeof invoice.amount === 'number'
                    ? invoice.amount.toFixed(2)
                    : invoice.amount}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">
                    Invoice Number
                  </p>
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 shrink-0 text-primary" />
                    <p className="text-sm font-medium text-foreground">
                      {invoice.invoiceNumber || '—'}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">
                    Receipt Number
                  </p>
                  <div className="flex items-center gap-2">
                    <Receipt className="h-4 w-4 shrink-0 text-success" />
                    <p className="text-sm font-medium text-foreground">
                      {invoice.receiptNumber || '—'}
                    </p>
                  </div>
                </div>
              </div>
              {invoice.type !== 'credit' && (
              <div className="space-y-4">
                <div>
                  <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">
                    Billing Period
                  </p>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <p className="text-sm font-medium text-foreground">
                      {formatDate(invoice.periodStart)} – {formatDate(invoice.periodEnd)}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">
                    Created At
                  </p>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <p className="text-sm font-medium text-foreground">
                      {formatDate(invoice.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
              )}
            </div>

            <div className="border-t border-border pt-4">
              <div className="flex flex-col justify-end gap-3 sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  className="inline-flex items-center gap-2 border-border bg-primary/10 text-foreground"
                  onClick={() => handleDownload('invoice')}
                  disabled={downloading === 'invoice'}
                >
                  {downloading === 'invoice' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  <span className="font-semibold">Download Invoice PDF</span>
                </Button>
                <Button
                  type="button"
                  className="inline-flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={() => handleDownload('receipt')}
                  disabled={downloading === 'receipt'}
                >
                  {downloading === 'receipt' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
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

