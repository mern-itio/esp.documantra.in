import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Archive,
  ArrowUpRight,
  ExternalLink,
  FileText,
  Inbox,
  Loader2,
  LogOut,
  Mail,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import { eSignApi } from '../../services/apiHelper';
import { APP_NAME } from '../../config/brand';
import {
  CookieConsentBanner,
  CookiePreferenceCenter,
} from '../../components/common/CookiePreferenceCenter';

const PORTAL_TOKEN_KEY = 'recipientPortalToken';
const PORTAL_EMAIL_KEY = 'recipientPortalEmail';
const PORTAL_PREFILL_KEY = 'recipientPortalPrefillEmail';

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

const PREVIEW_ROWS = [
  { from: 'Mandeep Kaur', name: 'Phantom Compliance - Northgate Fintech Limited', status: 'SIGNED', date: 'Jul 3, 2026' },
  { from: 'Operations Team', name: 'Vendor Agreement - FY26', status: 'PENDING', date: 'Jul 1, 2026' },
  { from: 'Legal Desk', name: 'Mutual NDA - Partner Co.', status: 'SIGNED', date: 'Jun 28, 2026' },
];

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

function statusBadgeClass(status: PortalDocument['status'] | string) {
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
  const [searchParams] = useSearchParams();
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
  const [changeEmailMode, setChangeEmailMode] = useState(false);

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
    const fromUrl = (searchParams.get('email') || '').trim().toLowerCase();
    const fromStorage = (sessionStorage.getItem(PORTAL_PREFILL_KEY) || '').trim().toLowerCase();
    const prefill = fromUrl || fromStorage;
    if (prefill) {
      setEmail(prefill);
      setMaskedEmail(maskEmail(prefill));
      sessionStorage.setItem(PORTAL_PREFILL_KEY, prefill);
    }
    restoreSession();
  }, [searchParams, restoreSession]);

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
      sessionStorage.setItem(PORTAL_PREFILL_KEY, nextEmail);
      setMaskedEmail(response.data?.maskedEmail || maskEmail(nextEmail));
      setResendSeconds(Number(response.data?.resendAfterSeconds || 60));
      setInfo(
        response.data?.message ||
          'If this email has documents waiting, we sent a one-time sign-in code.',
      );
      setChangeEmailMode(false);
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
    setMaskedEmail(email ? maskEmail(email) : '');
    setStep('access');
    setError('');
    setInfo('');
    setChangeEmailMode(false);
  };

  const renderDocumentTable = (rows: Array<{ from: string; name: string; status: string; date: string; action?: React.ReactNode }>, blurred = false) => (
    <div className={`overflow-hidden ${blurred ? 'pointer-events-none select-none blur-[2px]' : ''}`}>
      <div className="hidden border-b border-gray-100 bg-gray-50 px-6 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500 sm:grid sm:grid-cols-12 sm:gap-4">
        <div className="sm:col-span-3">From</div>
        <div className="sm:col-span-4">Name</div>
        <div className="sm:col-span-2">Status</div>
        <div className="sm:col-span-3">Date received</div>
      </div>
      <ul className="divide-y divide-gray-100">
        {rows.map((row, index) => (
          <li key={`${row.name}-${index}`} className="px-4 py-4 sm:px-6">
            <div className="grid gap-3 sm:grid-cols-12 sm:items-center">
              <div className="sm:col-span-3">
                <p className="text-sm font-semibold text-gray-900">{row.from}</p>
              </div>
              <div className="sm:col-span-4">
                <p className="truncate text-sm text-gray-800">{row.name}</p>
              </div>
              <div className="sm:col-span-2">
                <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${statusBadgeClass(row.status)}`}>
                  {row.status}
                </span>
              </div>
              <div className="sm:col-span-3 flex items-center justify-between gap-3">
                <span className="text-sm text-gray-500">{row.date}</span>
                {row.action}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );

  const isAuthenticated = step === 'documents' && !!token;

  return (
    <div className="min-h-screen bg-[#F7F3EE]">
      <header className="border-b border-gray-200 bg-[#1b0c3e] text-white">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <div className="text-sm font-semibold">{APP_NAME} · My documents</div>
          {isAuthenticated && (
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

      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:py-10">
        <div className="mb-6">
          {isAuthenticated && (
            <p className="text-sm text-gray-600">
              Signed in as <strong>{maskedEmail || maskEmail(sessionEmail)}</strong>
            </p>
          )}
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">My documents</h1>
        </div>

        <div className="mb-4 border-b border-gray-200">
          <div className="flex gap-6">
            <button
              type="button"
              onClick={() => isAuthenticated && setTab('inbox')}
              className={`inline-flex items-center gap-2 border-b-2 px-1 pb-3 text-sm font-semibold transition-colors ${
                tab === 'inbox'
                  ? 'border-[#1B4D3E] text-[#1B4D3E]'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              <Inbox className="h-4 w-4" />
              Inbox
            </button>
            <button
              type="button"
              onClick={() => isAuthenticated && setTab('archived')}
              className={`inline-flex items-center gap-2 border-b-2 px-1 pb-3 text-sm font-semibold transition-colors ${
                tab === 'archived'
                  ? 'border-[#1B4D3E] text-[#1B4D3E]'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              <Archive className="h-4 w-4" />
              Archived
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          {!isAuthenticated ? (
            <>
              {renderDocumentTable(PREVIEW_ROWS, true)}
              <div className="absolute inset-0 flex items-center justify-center bg-white/55 p-4 backdrop-blur-[1px]">
                <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-xl sm:p-8">
                  {step === 'access' ? (
                    <>
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#E8F5EE] text-[#1B4D3E]">
                        <ShieldCheck className="h-6 w-6" />
                      </div>
                      <h2 className="mt-4 text-xl font-semibold text-gray-900">
                        Your documents are secure — verify your email to access for free
                      </h2>
                      <p className="mt-2 text-sm text-gray-600">
                        We will send a one-time code to open your signing inbox. No password required.
                      </p>

                      {!changeEmailMode ? (
                        <div className="mt-6 space-y-4">
                          {sessionEmail ? (
                            <p className="rounded-lg bg-[#F7F3EE] px-4 py-3 text-sm text-gray-700">
                              Continue with <strong>{maskedEmail || maskEmail(sessionEmail)}</strong>
                            </p>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => requestCode()}
                            disabled={loading}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#1B4D3E] px-4 py-3 text-sm font-semibold text-white hover:bg-[#163f34] disabled:opacity-60"
                          >
                            {loading ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <ExternalLink className="h-4 w-4" />
                            )}
                            View my documents
                          </button>
                          <button
                            type="button"
                            onClick={() => setChangeEmailMode(true)}
                            className="text-sm font-medium text-[#4D0080] hover:underline"
                          >
                            {sessionEmail ? 'Use a different email' : 'Enter your email'}
                          </button>
                        </div>
                      ) : (
                        <div className="mt-6 space-y-4 text-left">
                          <label className="block text-sm font-medium text-gray-700" htmlFor="portal-email">
                            Email address
                          </label>
                          <input
                            id="portal-email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@company.com"
                            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none ring-[#4D0080] focus:border-[#4D0080] focus:ring-2"
                            disabled={loading}
                          />
                          <button
                            type="button"
                            onClick={() => requestCode()}
                            disabled={loading}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#1B4D3E] px-4 py-3 text-sm font-semibold text-white hover:bg-[#163f34] disabled:opacity-60"
                          >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                            Send code & continue
                          </button>
                          {sessionEmail ? (
                            <button
                              type="button"
                              onClick={() => setChangeEmailMode(false)}
                              className="w-full text-sm font-medium text-gray-600 hover:text-gray-900"
                            >
                              Back to suggested email
                            </button>
                          ) : null}
                        </div>
                      )}
                      {info && <p className="mt-4 text-sm text-emerald-700">{info}</p>}
                    </>
                  ) : (
                    <>
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#F3ECFF] text-[#4D0080]">
                        <Mail className="h-6 w-6" />
                      </div>
                      <h2 className="mt-4 text-xl font-semibold text-gray-900">Check your email</h2>
                      <p className="mt-2 text-sm text-gray-600">
                        Enter the 6-digit code sent to <strong>{maskedEmail || maskEmail(sessionEmail)}</strong>
                      </p>
                      <input
                        id="portal-code"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        value={code}
                        onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="123456"
                        className="mt-6 w-full rounded-lg border border-gray-300 px-4 py-3 text-center text-lg tracking-[0.35em] outline-none ring-[#4D0080] focus:border-[#4D0080] focus:ring-2"
                        disabled={loading}
                      />
                      {info && <p className="mt-3 text-sm text-emerald-700">{info}</p>}
                      <button
                        type="button"
                        onClick={verifyCode}
                        disabled={loading || code.trim().length < 6}
                        className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#1B4D3E] px-4 py-3 text-sm font-semibold text-white hover:bg-[#163f34] disabled:opacity-60"
                      >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUpRight className="h-4 w-4" />}
                        Open my documents
                      </button>
                      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <button
                          type="button"
                          onClick={() => requestCode(sessionEmail)}
                          disabled={loading || resendSeconds > 0}
                          className="inline-flex items-center justify-center gap-2 text-sm font-medium text-[#4D0080] disabled:text-gray-400"
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
                          Change email
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </>
          ) : listLoading ? (
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
            renderDocumentTable(
              documents.map((doc) => ({
                from: doc.from,
                name: doc.name,
                status: doc.status,
                date: formatDate(doc.updatedAt),
                action: (
                  <Link
                    to={`/e-sign/signer/${doc.envelopeId}/${doc.recipientId}`}
                    className="inline-flex items-center justify-center gap-1 rounded-lg bg-[#1B4D3E] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#163f34]"
                  >
                    Open
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                ),
              })),
            )
          )}
        </div>
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
