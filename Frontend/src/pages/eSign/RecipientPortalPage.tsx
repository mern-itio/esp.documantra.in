import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Archive,
  ArrowUpRight,
  ChevronDown,
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
const PORTAL_NAME_KEY = 'recipientPortalPrefillName';

type PortalDocument = {
  envelopeId: string;
  recipientId: string;
  name: string;
  from: string;
  status: 'PENDING' | 'SIGNED' | 'DECLINED' | 'ARCHIVED';
  updatedAt?: string;
  signUrl: string;
};

type PortalStep = 'access' | 'consent' | 'verify' | 'documents';

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

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] || ''}${parts[parts.length - 1][0] || ''}`.toUpperCase();
  }
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return '?';
}

function firstName(name: string) {
  const trimmed = name.trim();
  if (!trimmed) return '';
  return trimmed.split(/\s+/)[0] || trimmed;
}

const RecipientPortalPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [cookieCenterOpen, setCookieCenterOpen] = useState(false);
  const [step, setStep] = useState<PortalStep>('access');
  const [email, setEmail] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [code, setCode] = useState('');
  const [token, setToken] = useState<string | null>(null);
  const [tab, setTab] = useState<'inbox' | 'archived'>('inbox');
  const [documents, setDocuments] = useState<PortalDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [info, setInfo] = useState('');
  const [resendSeconds, setResendSeconds] = useState(0);
  const [changeEmailMode, setChangeEmailMode] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const sessionEmail = useMemo(
    () => email.trim().toLowerCase() || localStorage.getItem(PORTAL_EMAIL_KEY) || '',
    [email],
  );

  const displayName = useMemo(() => {
    const fromState = recipientName.trim();
    if (fromState) return fromState;
    const fromStorage = (sessionStorage.getItem(PORTAL_NAME_KEY) || '').trim();
    if (fromStorage) return fromStorage;
    if (sessionEmail) {
      const local = sessionEmail.split('@')[0] || '';
      return local.replace(/[._-]+/g, ' ').trim() || sessionEmail;
    }
    return '';
  }, [recipientName, sessionEmail]);

  const hasKnownSignerSession = useMemo(
    () => Boolean(sessionEmail && (recipientName.trim() || sessionStorage.getItem(PORTAL_NAME_KEY))),
    [sessionEmail, recipientName],
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
    const fromUrlEmail = (searchParams.get('email') || '').trim().toLowerCase();
    const fromStorageEmail = (sessionStorage.getItem(PORTAL_PREFILL_KEY) || '').trim().toLowerCase();
    const prefillEmail = fromUrlEmail || fromStorageEmail;

    const fromUrlName = (searchParams.get('name') || '').trim();
    const fromStorageName = (sessionStorage.getItem(PORTAL_NAME_KEY) || '').trim();
    const prefillName = fromUrlName || fromStorageName;

    if (prefillEmail) {
      setEmail(prefillEmail);
      setMaskedEmail(maskEmail(prefillEmail));
      sessionStorage.setItem(PORTAL_PREFILL_KEY, prefillEmail);
    }
    if (prefillName) {
      setRecipientName(prefillName);
      sessionStorage.setItem(PORTAL_NAME_KEY, prefillName);
    }

    if (!localStorage.getItem(PORTAL_TOKEN_KEY)) {
      if (prefillEmail) {
        setStep('consent');
        setChangeEmailMode(false);
      } else {
        setStep('access');
        setChangeEmailMode(true);
      }
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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
        if (response.data?.recipientName) {
          setRecipientName(response.data.recipientName);
          sessionStorage.setItem(PORTAL_NAME_KEY, response.data.recipientName);
        }
      } catch (err: any) {
        const message =
          err?.response?.data?.message || 'Unable to load your documents right now.';
        if (err?.response?.status === 401) {
          localStorage.removeItem(PORTAL_TOKEN_KEY);
          localStorage.removeItem(PORTAL_EMAIL_KEY);
          setToken(null);
          setStep(sessionEmail ? 'consent' : 'access');
        }
        setError(message);
      } finally {
        setListLoading(false);
      }
    },
    [token, sessionEmail],
  );

  useEffect(() => {
    if (step === 'documents' && token) {
      loadDocuments(tab, token);
    }
  }, [step, tab, token, loadDocuments]);

  const requestCode = async (targetEmail?: string) => {
    const nextEmail = (targetEmail || email).trim().toLowerCase();
    if (!nextEmail) {
      setStep('access');
      setChangeEmailMode(true);
      setFormError('Enter your email address to continue.');
      return;
    }

    setLoading(true);
    setError('');
    setFormError('');
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
      setFormError(err?.response?.data?.message || 'Unable to send access code.');
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    if (!sessionEmail || !code.trim()) {
      setFormError('Enter the 6-digit code from your email.');
      return;
    }

    setLoading(true);
    setError('');
    setFormError('');
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
      if (response.data?.recipientName) {
        setRecipientName(response.data.recipientName);
        sessionStorage.setItem(PORTAL_NAME_KEY, response.data.recipientName);
      }
      setToken(nextToken);
      setMaskedEmail(response.data?.maskedEmail || maskEmail(sessionEmail));
      setCode('');
      setStep('documents');
      setInfo('');
    } catch (err: any) {
      setFormError(err?.response?.data?.message || 'Invalid or expired code.');
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
    setStep(sessionEmail ? 'consent' : 'access');
    setError('');
    setFormError('');
    setInfo('');
    setChangeEmailMode(!sessionEmail);
    setUserMenuOpen(false);
  };

  const renderDocumentTable = (
    rows: Array<{ from: string; name: string; status: string; date: string; action?: React.ReactNode }>,
    blurred = false,
  ) => (
    <div className={`overflow-hidden ${blurred ? 'pointer-events-none select-none blur-[2px]' : ''}`}>
      <div className="hidden border-b border-gray-100 bg-gray-50/80 px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500 sm:grid sm:grid-cols-12 sm:gap-4">
        <div className="sm:col-span-3">From</div>
        <div className="sm:col-span-4">Name</div>
        <div className="sm:col-span-2">Status</div>
        <div className="sm:col-span-3">Date received</div>
      </div>
      <ul className="divide-y divide-gray-100">
        {rows.map((row, index) => (
          <li
            key={`${row.name}-${index}`}
            className="px-4 py-4 transition-colors hover:bg-gray-50/70 sm:px-6"
          >
            <div className="grid gap-3 sm:grid-cols-12 sm:items-center">
              <div className="sm:col-span-3">
                <p className="text-sm font-medium text-gray-900">{row.from}</p>
              </div>
              <div className="sm:col-span-4">
                <p className="truncate text-sm text-gray-700">{row.name}</p>
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
  const showUserMenu = Boolean(displayName || sessionEmail);

  const renderAccessOverlay = () => {
    if (step === 'consent' && !changeEmailMode) {
      return (
        <>
          <div className="mx-auto flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 ring-8 ring-white">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-xl font-semibold tracking-tight text-gray-900 sm:text-2xl">
            {displayName ? `Hi ${firstName(displayName)}` : 'Verify it\u2019s you'}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-600">
            We&apos;ll send a one-time code to{' '}
            <strong className="text-gray-800">{maskedEmail || maskEmail(sessionEmail)}</strong>{' '}
            to open your document inbox. No password required.
          </p>
          <button
            type="button"
            onClick={() => requestCode(sessionEmail)}
            disabled={loading}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#248567] px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#1f7158] disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
            Send verification code
          </button>
          <button
            type="button"
            onClick={() => {
              setChangeEmailMode(true);
              setFormError('');
            }}
            className="mt-4 text-sm font-medium text-[#4D0080] hover:underline"
          >
            Use a different email
          </button>
          {formError && <p className="mt-4 text-sm text-rose-600">{formError}</p>}
        </>
      );
    }

    if (step === 'access' || changeEmailMode) {
      return (
        <>
          <div className="mx-auto flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 ring-8 ring-white">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-xl font-semibold tracking-tight text-gray-900 sm:text-2xl">
            Your documents are secure
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-600">
            Enter your email and we&apos;ll send a one-time code to access your signing inbox for free.
          </p>
          <div className="mt-6 space-y-4 text-left">
            <label className="block text-sm font-medium text-gray-700" htmlFor="portal-email">
              Email address
            </label>
            <input
              id="portal-email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (formError) setFormError('');
              }}
              placeholder="you@company.com"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#248567] focus:ring-2 focus:ring-[#248567]/20"
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => requestCode()}
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#248567] px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#1f7158] disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
              Send verification code
            </button>
            {hasKnownSignerSession && (
              <button
                type="button"
                onClick={() => {
                  setChangeEmailMode(false);
                  setStep('consent');
                  setFormError('');
                }}
                className="w-full text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                Back
              </button>
            )}
            {formError && <p className="text-sm text-rose-600">{formError}</p>}
          </div>
        </>
      );
    }

    if (step === 'verify') {
      return (
        <>
          <div className="mx-auto flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-violet-50 text-[#4D0080] ring-8 ring-white">
            <Mail className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-xl font-semibold tracking-tight text-gray-900 sm:text-2xl">Check your email</h2>
          <p className="mt-2 text-sm text-gray-600">
            Enter the 6-digit code sent to{' '}
            <strong className="text-gray-800">{maskedEmail || maskEmail(sessionEmail)}</strong>
          </p>
          <input
            id="portal-code"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.replace(/\D/g, '').slice(0, 6));
              if (formError) setFormError('');
            }}
            placeholder="123456"
            className="mt-6 w-full rounded-lg border border-gray-300 px-4 py-3 text-center text-lg tracking-[0.35em] outline-none focus:border-[#248567] focus:ring-2 focus:ring-[#248567]/20"
            disabled={loading}
          />
          {formError && <p className="mt-3 text-sm text-rose-600">{formError}</p>}
          {info && <p className="mt-3 text-sm text-emerald-700">{info}</p>}
          <button
            type="button"
            onClick={verifyCode}
            disabled={loading || code.trim().length < 6}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#248567] px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#1f7158] disabled:opacity-60"
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
                setStep(hasKnownSignerSession ? 'consent' : 'access');
                setChangeEmailMode(false);
                setCode('');
                setError('');
                setFormError('');
                setInfo('');
              }}
              className="text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              Change email
            </button>
          </div>
        </>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="text-base font-semibold text-gray-900">{APP_NAME}</span>
            <span className="hidden text-sm text-gray-400 sm:inline">/</span>
            <span className="hidden text-sm font-medium text-gray-600 sm:inline">My documents</span>
          </div>

          {showUserMenu && (
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setUserMenuOpen((open) => !open)}
                className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white py-1 pl-1 pr-3 text-sm text-gray-800 shadow-sm hover:bg-gray-50"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#4D0080] text-xs font-semibold text-white">
                  {getInitials(displayName || sessionEmail)}
                </span>
                <span className="max-w-[140px] truncate font-medium">
                  {displayName ? firstName(displayName) : maskEmail(sessionEmail)}
                </span>
                <ChevronDown className="h-4 w-4 text-gray-500" />
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
                  <div className="border-b border-gray-100 px-4 py-3">
                    <p className="truncate text-sm font-semibold text-gray-900">{displayName || 'Recipient'}</p>
                    <p className="truncate text-xs text-gray-500">{maskedEmail || maskEmail(sessionEmail)}</p>
                  </div>
                  {isAuthenticated && (
                    <button
                      type="button"
                      onClick={signOut}
                      className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign out
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <h1 className="text-3xl font-semibold tracking-tight text-gray-900">My documents</h1>

        <div className="mt-6 border-b border-gray-200">
          <div className="flex gap-8">
            <button
              type="button"
              onClick={() => isAuthenticated && setTab('inbox')}
              className={`inline-flex items-center gap-2 border-b-2 px-1 pb-3 text-sm font-semibold transition-colors ${
                tab === 'inbox'
                  ? 'border-[#248567] text-[#248567]'
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
                  ? 'border-[#248567] text-[#248567]'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              <Archive className="h-4 w-4" />
              Archived
            </button>
          </div>
        </div>

        {error && isAuthenticated && (
          <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        <div
          className={`relative mt-6 rounded-xl border border-gray-200 bg-white shadow-sm ${
            isAuthenticated ? 'overflow-hidden' : 'min-h-[520px]'
          }`}
        >
          {!isAuthenticated ? (
            <>
              <div className="absolute inset-0 overflow-hidden rounded-xl">
                {renderDocumentTable(PREVIEW_ROWS, true)}
              </div>
              <div className="relative z-10 flex min-h-[520px] items-center justify-center bg-white/60 p-4 backdrop-blur-[1px] sm:p-6">
                <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white px-6 py-8 text-center shadow-2xl sm:px-8 sm:py-9">
                  {renderAccessOverlay()}
                </div>
              </div>
            </>
          ) : listLoading ? (
            <div className="flex items-center justify-center gap-2 px-6 py-20 text-sm text-gray-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading documents...
            </div>
          ) : documents.length === 0 ? (
            <div className="px-6 py-20 text-center">
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
                    className="inline-flex items-center justify-center gap-1 rounded-md bg-[#248567] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#1f7158]"
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
