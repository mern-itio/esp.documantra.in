import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Archive,
  ArrowRight,
  FileText,
  Inbox,
  Loader2,
  LogOut,
  Mail,
  RefreshCw,
} from 'lucide-react';
import { eSignApi } from '../../services/apiHelper';
import { APP_NAME } from '../../config/brand';
import {
  CookieConsentBanner,
  CookiePreferenceCenter,
} from '../../components/common/CookiePreferenceCenter';

const PORTAL_TOKEN_KEY = 'recipientPortalToken';
const PORTAL_EMAIL_KEY = 'recipientPortalEmail';

type PortalDocument = {
  envelopeId: string;
  recipientId: string;
  name: string;
  from: string;
  status: 'PENDING' | 'SIGNED' | 'DECLINED' | 'ARCHIVED';
  updatedAt?: string;
  signUrl: string;
};

type PortalStep = 'access' | 'verify' | 'documents';

function maskEmail(email: string) {
  const normalized = email.trim().toLowerCase();
  const [local, domain] = normalized.split('@');
  if (!local || !domain) return '***';
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}${'*'.repeat(Math.max(local.length - visible.length, 1))}@${domain}`;
}

function formatDate(value?: string) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function statusBadgeClass(status: PortalDocument['status']) {
  switch (status) {
    case 'SIGNED':
      return 'bg-emerald-50 text-emerald-700 ring-emerald-200';
    case 'DECLINED':
      return 'bg-rose-50 text-rose-700 ring-rose-200';
    case 'ARCHIVED':
      return 'bg-gray-100 text-gray-700 ring-gray-200';
    default:
      return 'bg-amber-50 text-amber-800 ring-amber-200';
  }
}

const RecipientPortalPage: React.FC = () => {
  const [cookieCenterOpen, setCookieCenterOpen] = useState(false);
  const [step, setStep] = useState<PortalStep>('access');
  const [email, setEmail] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [code, setCode] = useState('');
  const [token, setToken] = useState<string | null>(null);
  const [tab, setTab] = useState<'inbox' | 'archived'>('inbox');
  const [documents, setDocuments] = useState<PortalDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [resendSeconds, setResendSeconds] = useState(0);

  const sessionEmail = useMemo(
    () => email.trim().toLowerCase() || localStorage.getItem(PORTAL_EMAIL_KEY) || '',
    [email],
  );

  const restoreSession = useCallback(() => {
    const savedToken = localStorage.getItem(PORTAL_TOKEN_KEY);
    const savedEmail = localStorage.getItem(PORTAL_EMAIL_KEY) || '';
    if (savedToken && savedEmail) {
      setToken(savedToken);
      setEmail(savedEmail);
      setMaskedEmail(maskEmail(savedEmail));
      setStep('documents');
    }
  }, []);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  useEffect(() => {
    if (resendSeconds <= 0) return undefined;
    const timer = window.setInterval(() => {
      setResendSeconds((prev) => Math.max(prev - 1, 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [resendSeconds]);

  const loadDocuments = useCallback(
    async (activeTab: 'inbox' | 'archived', activeToken?: string | null) => {
      const authToken = activeToken || token || localStorage.getItem(PORTAL_TOKEN_KEY);
      if (!authToken) return;

      setListLoading(true);
      setError('');
      try {
        const response = await eSignApi.get('/api/e-sign/public/recipient-portal/documents', {
          params: { tab: activeTab },
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });
        setDocuments(response.data?.data || []);
        if (response.data?.maskedEmail) {
          setMaskedEmail(response.data.maskedEmail);
        }
      } catch (err: any) {
        const message =
          err?.response?.data?.message || 'Unable to load your documents right now.';
        if (err?.response?.status === 401) {
          localStorage.removeItem(PORTAL_TOKEN_KEY);
          localStorage.removeItem(PORTAL_EMAIL_KEY);
          setToken(null);
          setStep('access');
        }
        setError(message);
      } finally {
        setListLoading(false);
      }
    },
    [token],
  );

  useEffect(() => {
    if (step === 'documents' && token) {
      loadDocuments(tab, token);
    }
  }, [step, tab, token, loadDocuments]);

  const requestCode = async (targetEmail?: string) => {
    const nextEmail = (targetEmail || email).trim().toLowerCase();
    if (!nextEmail) {
      setError('Enter your email address to continue.');
      return;
    }

    setLoading(true);
    setError('');
    setInfo('');
    try {
      const response = await eSignApi.post('/api/e-sign/public/recipient-portal/request-code', {
        email: nextEmail,
      });
      setEmail(nextEmail);
      setMaskedEmail(response.data?.maskedEmail || maskEmail(nextEmail));
      setResendSeconds(Number(response.data?.resendAfterSeconds || 60));
      setInfo(
        response.data?.message ||
          'If this email has documents waiting, we sent a one-time sign-in code.',
      );
      setStep('verify');
    } catch (err: any) {
      const retryAfter = Number(err?.response?.data?.resendAfterSeconds || 0);
      if (retryAfter > 0) {
        setResendSeconds(retryAfter);
        setMaskedEmail(err?.response?.data?.maskedEmail || maskEmail(nextEmail));
        setStep('verify');
      }
      setError(err?.response?.data?.message || 'Unable to send access code.');
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    if (!sessionEmail || !code.trim()) {
      setError('Enter the 6-digit code from your email.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await eSignApi.post('/api/e-sign/public/recipient-portal/verify-code', {
        email: sessionEmail,
        code: code.trim(),
      });
      const nextToken = response.data?.token;
      if (!nextToken) {
        throw new Error('Missing portal session token');
      }
      localStorage.setItem(PORTAL_TOKEN_KEY, nextToken);
      localStorage.setItem(PORTAL_EMAIL_KEY, sessionEmail);
      setToken(nextToken);
      setMaskedEmail(response.data?.maskedEmail || maskEmail(sessionEmail));
      setCode('');
      setStep('documents');
      setInfo('');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Invalid or expired code.');
    } finally {
      setLoading(false);
    }
  };

  const signOut = () => {
    localStorage.removeItem(PORTAL_TOKEN_KEY);
    localStorage.removeItem(PORTAL_EMAIL_KEY);
    setToken(null);
    setDocuments([]);
    setCode('');
    setEmail('');
    setMaskedEmail('');
    setStep('access');
    setError('');
    setInfo('');
  };

  return (
    <div className="min-h-screen bg-[#F7F3EE]">
      <header className="border-b border-gray-200 bg-[#1b0c3e] text-white">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <div className="text-sm font-semibold">{APP_NAME} · My documents</div>
          {step === 'documents' && (
            <button
              type="button"
              onClick={signOut}
              className="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm text-white/90 hover:bg-white/10"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          )}
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-4 py-10">
        {step === 'access' && (
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#FFF8E6] px-3 py-1 text-xs font-semibold text-[#1b0c3e]">
              <Mail className="h-3.5 w-3.5" />
              Access your documents
            </div>
            <h1 className="mt-4 text-2xl font-semibold text-gray-900">
              Sign in with your email
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              We will email you a one-time code to open your signing inbox. No password required.
            </p>

            <label className="mt-6 block text-sm font-medium text-gray-700" htmlFor="portal-email">
              Email address
            </label>
            <input
              id="portal-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none ring-[#4D0080] focus:border-[#4D0080] focus:ring-2"
              disabled={loading}
            />

            {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}
            {info && <p className="mt-3 text-sm text-emerald-700">{info}</p>}

            <button
              type="button"
              onClick={() => requestCode()}
              disabled={loading}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#4D0080] px-4 py-3 text-sm font-semibold text-white hover:bg-[#3d0066] disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
              Continue
            </button>
          </section>
        )}

        {step === 'verify' && (
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
            <h1 className="text-2xl font-semibold text-gray-900">Enter your access code</h1>
            <p className="mt-2 text-sm text-gray-600">
              We sent a 6-digit code to <strong>{maskedEmail || maskEmail(sessionEmail)}</strong>.
            </p>

            <label className="mt-6 block text-sm font-medium text-gray-700" htmlFor="portal-code">
              One-time code
            </label>
            <input
              id="portal-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="123456"
              className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 text-center text-lg tracking-[0.35em] outline-none ring-[#4D0080] focus:border-[#4D0080] focus:ring-2"
              disabled={loading}
            />

            {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}
            {info && <p className="mt-3 text-sm text-emerald-700">{info}</p>}

            <button
              type="button"
              onClick={verifyCode}
              disabled={loading || code.trim().length < 6}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#4D0080] px-4 py-3 text-sm font-semibold text-white hover:bg-[#3d0066] disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Open my documents
            </button>

            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={() => requestCode(sessionEmail)}
                disabled={loading || resendSeconds > 0}
                className="inline-flex items-center gap-2 text-sm font-medium text-[#4D0080] disabled:text-gray-400"
              >
                <RefreshCw className="h-4 w-4" />
                {resendSeconds > 0 ? `Resend in ${resendSeconds}s` : 'Resend code'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setStep('access');
                  setCode('');
                  setError('');
                  setInfo('');
                }}
                className="text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                Use a different email
              </button>
            </div>
          </section>
        )}

        {step === 'documents' && (
          <section className="space-y-4">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-600">
                Signed in as <strong>{maskedEmail || maskEmail(sessionEmail)}</strong>
              </p>
              <h1 className="mt-2 text-2xl font-semibold text-gray-900">My documents</h1>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setTab('inbox')}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${
                  tab === 'inbox'
                    ? 'bg-[#1b0c3e] text-white'
                    : 'bg-white text-gray-700 ring-1 ring-gray-200'
                }`}
              >
                <Inbox className="h-4 w-4" />
                Inbox
              </button>
              <button
                type="button"
                onClick={() => setTab('archived')}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${
                  tab === 'archived'
                    ? 'bg-[#1b0c3e] text-white'
                    : 'bg-white text-gray-700 ring-1 ring-gray-200'
                }`}
              >
                <Archive className="h-4 w-4" />
                Archived
              </button>
            </div>

            {error && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            )}

            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              {listLoading ? (
                <div className="flex items-center justify-center gap-2 px-6 py-16 text-sm text-gray-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading documents...
                </div>
              ) : documents.length === 0 ? (
                <div className="px-6 py-16 text-center">
                  <FileText className="mx-auto h-10 w-10 text-gray-300" />
                  <p className="mt-3 text-sm font-medium text-gray-900">
                    {tab === 'inbox' ? 'No documents waiting for you' : 'No archived documents yet'}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    Documents sent to this email will appear here.
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {documents.map((doc) => (
                    <li key={`${doc.envelopeId}-${doc.recipientId}`} className="px-4 py-4 sm:px-6">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-gray-900">{doc.name}</p>
                          <p className="mt-1 text-xs text-gray-500">
                            From {doc.from} · {formatDate(doc.updatedAt)}
                          </p>
                          <span
                            className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${statusBadgeClass(doc.status)}`}
                          >
                            {doc.status}
                          </span>
                        </div>
                        <Link
                          to={`/e-sign/signer/${doc.envelopeId}/${doc.recipientId}`}
                          className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-[#1b0c3e] hover:bg-amber-300"
                        >
                          Open
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        )}
      </main>
      <CookieConsentBanner onManage={() => setCookieCenterOpen(true)} />
      <CookiePreferenceCenter
        open={cookieCenterOpen}
        onClose={() => setCookieCenterOpen(false)}
      />
    </div>
  );
};

export default RecipientPortalPage;
