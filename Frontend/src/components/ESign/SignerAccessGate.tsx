import React, { useEffect, useState } from 'react';
import { Loader2, Mail, RefreshCw } from 'lucide-react';
import { eSignApi } from '../../services/apiHelper';

const signerAccessStorageKey = (envelopeId: string, recipientId: string) =>
  `signerAccessToken:${envelopeId}:${recipientId}`;

export function readSignerAccessToken(envelopeId: string, recipientId: string): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(signerAccessStorageKey(envelopeId, recipientId));
}

export function saveSignerAccessToken(
  envelopeId: string,
  recipientId: string,
  token: string,
): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(signerAccessStorageKey(envelopeId, recipientId), token);
}

type SignerAccessGateProps = {
  envelopeId: string;
  recipientId: string;
  initialAccessToken?: string | null;
  onVerified: (token: string) => void;
};

const SignerAccessGate: React.FC<SignerAccessGateProps> = ({
  envelopeId,
  recipientId,
  initialAccessToken,
  onVerified,
}) => {
  const [maskedEmail, setMaskedEmail] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [resendSeconds, setResendSeconds] = useState(0);
  const [expiredLink, setExpiredLink] = useState(false);

  const authHeaders = (token?: string | null) => {
    const resolved =
      token ||
      initialAccessToken ||
      readSignerAccessToken(envelopeId, recipientId) ||
      undefined;
    return resolved ? { Authorization: `Bearer ${resolved}` } : undefined;
  };

  useEffect(() => {
    if (resendSeconds <= 0) return undefined;
    const timer = window.setInterval(() => {
      setResendSeconds((prev) => Math.max(prev - 1, 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [resendSeconds]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setLoading(true);
      setError('');
      try {
        const tokenFromUrl = initialAccessToken || undefined;
        if (tokenFromUrl) {
          saveSignerAccessToken(envelopeId, recipientId, tokenFromUrl);
        }

        const response = await eSignApi.get('/api/e-sign/public/signer-access/check', {
          params: { envelopeId, recipientId },
          headers: authHeaders(tokenFromUrl),
        });

        if (cancelled) return;

        if (response.data?.redirectToStatus) {
          window.location.replace(
            `/e-sign/signer/status/${envelopeId}/${recipientId}`,
          );
          return;
        }

        if (response.data?.verified) {
          const token =
            tokenFromUrl || readSignerAccessToken(envelopeId, recipientId) || '';
          onVerified(token);
          return;
        }

        setExpiredLink(!!response.data?.expired);
        setMaskedEmail(response.data?.maskedEmail || '');
        await requestCode(false);
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.response?.data?.message || 'Unable to verify document access.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [envelopeId, recipientId]);

  const requestCode = async (showSpinner = true) => {
    if (showSpinner) setSubmitting(true);
    setError('');
    setInfo('');
    try {
      const response = await eSignApi.post('/api/e-sign/public/signer-access/request-code', {
        envelopeId,
        recipientId,
      });
      setMaskedEmail(response.data?.maskedEmail || maskedEmail);
      setResendSeconds(Number(response.data?.resendAfterSeconds || 60));
      const devCode = response.data?.devAccessCode;
      if (devCode) {
        setCode(String(devCode));
        setInfo(`Local dev code: ${devCode} (email not configured on this machine)`);
      } else {
        setInfo(response.data?.message || 'Access code sent to your email.');
      }
    } catch (err: any) {
      const retryAfter = Number(err?.response?.data?.resendAfterSeconds || 0);
      if (retryAfter > 0) {
        setResendSeconds(retryAfter);
        setMaskedEmail(err?.response?.data?.maskedEmail || maskedEmail);
      }
      setError(err?.response?.data?.message || 'Unable to send access code.');
    } finally {
      if (showSpinner) setSubmitting(false);
    }
  };

  const verifyCode = async () => {
    if (!code.trim()) {
      setError('Enter the 6-digit code from your email.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const response = await eSignApi.post('/api/e-sign/public/signer-access/verify-code', {
        envelopeId,
        recipientId,
        code: code.trim(),
      });
      const token = response.data?.token;
      if (!token) throw new Error('Missing signer access token');
      saveSignerAccessToken(envelopeId, recipientId, token);
      onVerified(token);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Invalid or expired code.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F7F3EE]">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          Verifying document access...
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F7F3EE] px-4 py-10">
      <section className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="inline-flex items-center gap-2 rounded-full bg-[#FFF8E6] px-3 py-1 text-xs font-semibold text-[#1b0c3e]">
          <Mail className="h-3.5 w-3.5" />
          Access your document
        </div>
        <h1 className="mt-4 text-2xl font-semibold text-gray-900">Verify your email</h1>
        <p className="mt-2 text-sm text-gray-600">
          {expiredLink
            ? 'Your signing link has expired. Enter the one-time code we email you to continue.'
            : 'For your security, confirm access with the one-time code sent to your email.'}
        </p>
        {maskedEmail && (
          <p className="mt-3 text-sm font-medium text-gray-800">
            Code sent to <strong>{maskedEmail}</strong>
          </p>
        )}

        <input
          inputMode="numeric"
          autoComplete="one-time-code"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="123456"
          className="mt-6 w-full rounded-lg border border-gray-300 px-4 py-3 text-center text-lg tracking-[0.35em] outline-none ring-[#4D0080] focus:border-[#4D0080] focus:ring-2"
          disabled={submitting}
        />

        {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}
        {info && <p className="mt-3 text-sm text-emerald-700">{info}</p>}

        <button
          type="button"
          onClick={verifyCode}
          disabled={submitting || code.trim().length < 6}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#4D0080] px-4 py-3 text-sm font-semibold text-white hover:bg-[#3d0066] disabled:opacity-60"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Continue to document
        </button>

        <button
          type="button"
          onClick={() => requestCode(true)}
          disabled={submitting || resendSeconds > 0}
          className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-[#4D0080] disabled:text-gray-400"
        >
          <RefreshCw className="h-4 w-4" />
          {resendSeconds > 0 ? `Resend in ${resendSeconds}s` : 'Resend code'}
        </button>
      </section>
    </div>
  );
};

export default SignerAccessGate;
