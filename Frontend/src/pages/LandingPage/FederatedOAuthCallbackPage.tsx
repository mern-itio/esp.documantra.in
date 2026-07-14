import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../components/AuthService/AuthContext';
import { API_CONFIG } from '../../config/environment';
import { getOrCreateDeviceId } from '../../utils/deviceId';
import { withAuthFetch } from '../../utils/authSession';
import {
  OAUTH_PKCE_KEY,
  OAUTH_REFERRER_KEY,
  OAUTH_STATE_KEY,
} from '../../components/AuthService/FederatedLoginButtons';

const ENDPOINTS: Record<string, string> = {
  google: `${API_CONFIG.BASE_URL}/google-login`,
  facebook: `${API_CONFIG.BASE_URL}/facebook-login`,
  linkedin: `${API_CONFIG.BASE_URL}/linkedin-login`,
  twitter: `${API_CONFIG.BASE_URL}/twitter-login`,
};

export default function FederatedOAuthCallbackPage() {
  const { provider = '' } = useParams<{ provider: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { applyLoginFromOAuthPayload } = useAuth();
  const [error, setError] = useState('');

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const oauthError = searchParams.get('error');

    if (oauthError) {
      setError(`Sign-in was cancelled or denied (${oauthError}).`);
      return;
    }

    const normalized = String(provider || '').toLowerCase();
    const endpoint = ENDPOINTS[normalized];
    if (!endpoint || !code) {
      setError('Invalid OAuth callback.');
      return;
    }

    const expectedState = sessionStorage.getItem(OAUTH_STATE_KEY);
    if (expectedState && state && expectedState !== state) {
      setError('OAuth state mismatch. Please try again.');
      return;
    }

    const redirectUri = `${window.location.origin}/oauth/callback/${normalized}`;
    const codeVerifier = sessionStorage.getItem(OAUTH_PKCE_KEY) || undefined;
    const ref = sessionStorage.getItem(OAUTH_REFERRER_KEY) || undefined;
    const deviceId = getOrCreateDeviceId();

    (async () => {
      try {
        const resp = await fetch(
          endpoint,
          withAuthFetch({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              code,
              redirectUri,
              ...(codeVerifier ? { codeVerifier } : {}),
              ...(ref ? { ref } : {}),
              deviceId,
              deviceLabel: 'browser',
            }),
          })
        );
        const data = await resp.json().catch(() => ({}));
        if (!resp.ok) {
          if (resp.status === 403 && data?.code === 'TWO_FA_SETUP_REQUIRED') {
            await applyLoginFromOAuthPayload(data);
            navigate(data?.setupPath || '/account/security', { replace: true });
            return;
          }
          throw new Error(data?.message || 'OAuth sign-in failed');
        }
        await applyLoginFromOAuthPayload(data);
        sessionStorage.removeItem(OAUTH_STATE_KEY);
        sessionStorage.removeItem(OAUTH_PKCE_KEY);
        sessionStorage.removeItem(OAUTH_REFERRER_KEY);
        navigate('/dashboard', { replace: true });
      } catch (err: any) {
        setError(err?.message || 'OAuth sign-in failed');
      }
    })();
  }, [applyLoginFromOAuthPayload, navigate, provider, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7F3EE] px-4">
      <div className="max-w-md w-full bg-white rounded-2xl border border-[#E6D8C9] p-8 text-center shadow-sm">
        {error ? (
          <>
            <p className="text-red-600 text-sm mb-4">{error}</p>
            <button
              type="button"
              onClick={() => navigate('/login', { replace: true })}
              className="text-sm font-semibold text-[#155E4B] hover:underline"
            >
              Back to login
            </button>
          </>
        ) : (
          <p className="text-slate-600 text-sm">Completing sign-in…</p>
        )}
      </div>
    </div>
  );
}
