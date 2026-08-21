import { useEffect, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Copy, ExternalLink, FileText, Mail, Sparkles } from 'lucide-react';
import { eSignApi } from '../../services/apiHelper';
import { BRAND } from '../../config/brand';
import { useAuth } from '../../components/AuthService/AuthContext';
import {
  PublicSignFooter,
  PublicSignHeader,
} from './PublicSignMarketingChrome';
import '../../styles/documantra-chrome.css';
import { claimPublicGuestEnvelopes } from '../../services/claimPublicGuestEnvelopes';
import { buildEspAuthUrl, withPublicGuestHeaders } from '../../utils/publicGuestId';

type SentEnvelope = {
  id: string;
  name: string;
  subject: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  recipientCount: number;
  completedCount: number;
  devSignLink?: string;
};

type SendUsage = {
  used: number;
  limit: number;
  remaining: number;
  monthKey: string;
};

const espPricingUrl = `${BRAND.website.replace(/\/$/, '')}/#pricing`;

const statusLabel = (status: string) => {
  const value = String(status || '').toLowerCase();
  if (value === 'completed') return 'Completed';
  if (value === 'in-progress') return 'In progress';
  if (value === 'declined') return 'Declined';
  if (value === 'draft') return 'Draft';
  return status || 'Sent';
};

export default function PublicSendSuccessPage() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const [envelopes, setEnvelopes] = useState<SentEnvelope[]>([]);
  const [usage, setUsage] = useState<SendUsage | null>(null);
  const [loading, setLoading] = useState(true);
  const [signLinkCopied, setSignLinkCopied] = useState(false);
  const [devVSignCallbackUrl, setDevVSignCallbackUrl] = useState('');

  const latestEnvelopeId = searchParams.get('envelopeId') || '';
  const navSignLink =
    typeof location.state === 'object' &&
    location.state !== null &&
    'signLink' in location.state
      ? String((location.state as { signLink?: string }).signLink || '')
      : '';
  const storedSignLink = latestEnvelopeId
    ? sessionStorage.getItem(`vsignDevSignLink:${latestEnvelopeId}`) || ''
    : '';
  const apiSignLink =
    envelopes.find((item) => item.id === latestEnvelopeId)?.devSignLink || '';
  const devSignLink = navSignLink || storedSignLink || apiSignLink;
  const showDevSignLink = import.meta.env.DEV && Boolean(devSignLink);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        if (isAuthenticated) {
          await claimPublicGuestEnvelopes();
        }

        const response = await eSignApi.get('/api/e-sign/public/sent-envelopes', {
          headers: withPublicGuestHeaders(),
        });

        if (cancelled) return;
        setEnvelopes(response.data?.envelopes || []);
        setUsage(response.data?.usage || null);
        setDevVSignCallbackUrl(String(response.data?.devVSignCallbackUrl || ''));
      } catch (error) {
        console.error('Failed to load sent documents:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  const limitReached = usage ? usage.remaining <= 0 : false;
  const espSignupUrl = buildEspAuthUrl(BRAND.website, 'signup');
  const espLoginUrl = buildEspAuthUrl(BRAND.website, 'login');

  return (
    <div className="min-h-screen bg-[hsl(40,33%,98%)]">
      <PublicSignHeader />
      <main className="documantra-container py-10 md:py-14">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8 rounded-2xl border border-[hsl(160,48%,21%)]/15 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[hsl(160,48%,21%)]/10">
              <CheckCircle2 className="h-8 w-8 text-[hsl(160,48%,21%)]" />
            </div>
            <h1 className="text-3xl font-bold text-[hsl(0,0%,18%)]">
              Document sent successfully
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-[hsl(24,10%,40%)] md:text-base">
              Your signing request has been emailed to recipients.
              {latestEnvelopeId ? ' You can track its status below.' : ''}
            </p>

            {usage ? (
              <div className="mx-auto mt-6 max-w-md rounded-xl bg-[hsl(40,20%,94%)]/60 px-4 py-3 text-sm text-[hsl(24,10%,40%)]">
                Free plan usage this month:{' '}
                <strong className="text-[hsl(0,0%,18%)]">
                  {usage.used}/{usage.limit}
                </strong>{' '}
                documents sent
              </div>
            ) : null}

            {showDevSignLink ? (
              <div className="mx-auto mt-6 max-w-2xl rounded-xl border border-dashed border-[hsl(160,48%,21%)]/35 bg-[hsl(160,48%,21%)]/5 px-4 py-4 text-left">
                <p className="text-xs font-semibold uppercase tracking-wide text-[hsl(160,48%,21%)]">
                  Local testing — recipient sign link
                </p>
                <p className="mt-1 text-xs text-[hsl(24,10%,40%)]">
                  Email is skipped in local dev. Open this link to complete Aadhaar / VSign signing.
                </p>
                <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <a
                    href={devSignLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="documantra-chrome-btn-primary inline-flex items-center justify-center gap-2 text-sm"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Open sign link
                  </a>
                  <button
                    type="button"
                    className="documantra-chrome-btn-ghost inline-flex items-center justify-center gap-2 text-sm"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(devSignLink);
                        setSignLinkCopied(true);
                        window.setTimeout(() => setSignLinkCopied(false), 2000);
                      } catch {
                        /* ignore */
                      }
                    }}
                  >
                    <Copy className="h-4 w-4" />
                    {signLinkCopied ? 'Copied' : 'Copy link'}
                  </button>
                </div>
                <p className="mt-3 break-all rounded-lg bg-white/80 px-3 py-2 font-mono text-xs text-[hsl(24,10%,40%)]">
                  {devSignLink}
                </p>
                {devVSignCallbackUrl ? (
                  <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-left">
                    <p className="text-xs font-semibold text-amber-900">VSign callback (this envelope)</p>
                    <p className="mt-1 break-all font-mono text-xs text-amber-800">{devVSignCallbackUrl}</p>
                    <p className="mt-2 text-xs text-amber-900">
                      After OTP, VSign redirects here. If you see 503 on a{' '}
                      <span className="font-mono">loca.lt</span> URL, that envelope used an old dead tunnel —
                      send a <strong>new</strong> document from this page.
                    </p>
                  </div>
                ) : null}
              </div>
            ) : null}

            {!isAuthenticated ? (
              <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <a
                  href={espSignupUrl}
                  className="documantra-chrome-btn-primary inline-flex items-center gap-2"
                >
                  <Sparkles className="h-4 w-4" />
                  Create free account
                </a>
                <a href={espLoginUrl} className="documantra-chrome-btn-ghost">
                  Log in
                </a>
              </div>
            ) : null}

            {limitReached ? (
              <div className="mx-auto mt-6 max-w-xl rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                You&apos;ve reached the free monthly limit of {usage?.limit} documents.
                {' '}
                <a href={espPricingUrl} className="font-semibold underline">
                  Upgrade to send more
                </a>
                .
              </div>
            ) : null}

            <div className="mt-6">
              <Link to="/" className="documantra-chrome-btn-ghost inline-flex">
                Send another document
              </Link>
            </div>
          </div>

          <section className="rounded-2xl border border-[hsl(40,20%,88%)] bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-[hsl(0,0%,18%)]">
                  Your sent documents
                </h2>
                <p className="text-sm text-[hsl(24,10%,40%)]">
                  {isAuthenticated
                    ? 'Documents linked to your account appear here.'
                    : 'Create a free account to keep this history across devices.'}
                </p>
              </div>
            </div>

            {loading ? (
              <p className="text-sm text-[hsl(24,10%,40%)]">Loading sent documents…</p>
            ) : envelopes.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[hsl(40,20%,88%)] px-4 py-10 text-center text-sm text-[hsl(24,10%,40%)]">
                No sent documents yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-[hsl(40,20%,88%)] text-[hsl(24,10%,40%)]">
                      <th className="px-3 py-3 font-medium">Document</th>
                      <th className="px-3 py-3 font-medium">Status</th>
                      <th className="px-3 py-3 font-medium">Recipients</th>
                      <th className="px-3 py-3 font-medium">Sent</th>
                    </tr>
                  </thead>
                  <tbody>
                    {envelopes.map((item) => (
                      <tr key={item.id} className="border-b border-[hsl(40,20%,88%)]/70">
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-[hsl(160,48%,21%)]" />
                            <span className="font-medium text-[hsl(0,0%,18%)]">
                              {item.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-3">{statusLabel(item.status)}</td>
                        <td className="px-3 py-3">
                          {item.completedCount}/{item.recipientCount} signed
                        </td>
                        <td className="px-3 py-3">
                          {new Date(item.updatedAt || item.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {!isAuthenticated ? (
              <div className="mt-6 flex items-start gap-3 rounded-xl bg-[hsl(160,48%,21%)]/5 px-4 py-4 text-sm text-[hsl(24,10%,40%)]">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(160,48%,21%)]" />
                <p>
                  Sign up free to save your send history, manage recipients, and unlock your
                  10 documents/month on every device.
                </p>
              </div>
            ) : null}
          </section>
        </div>
      </main>
      <PublicSignFooter />
    </div>
  );
}
