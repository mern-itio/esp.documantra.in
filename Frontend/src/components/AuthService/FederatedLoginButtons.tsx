import { useCallback, useEffect, useMemo, useState } from 'react';
import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
import {
  fetchFederatedLoginProviders,
  getGoogleClientIdFromProviders,
  isGoogleOAuthConfigured,
  type PublicFederatedProvider,
} from '../../services/federatedLoginService';

type Props = {
  mode: 'login' | 'signup';
  disabled?: boolean;
  onGoogleSuccess: (credential: string) => void | Promise<void>;
  onGoogleError?: () => void;
  onError?: (message: string) => void;
};

const OAUTH_PKCE_KEY = 'documantra_oauth_pkce';
const OAUTH_STATE_KEY = 'documantra_oauth_state';
const OAUTH_REFERRER_KEY = 'documantra_oauth_referrer';

function randomString(length = 32) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

async function sha256Base64Url(input: string) {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', data);
  const bytes = new Uint8Array(digest);
  let binary = '';
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function storeOAuthSession(state: string, codeVerifier: string, referrer?: string) {
  sessionStorage.setItem(OAUTH_STATE_KEY, state);
  sessionStorage.setItem(OAUTH_PKCE_KEY, codeVerifier);
  if (referrer) sessionStorage.setItem(OAUTH_REFERRER_KEY, referrer);
}

function buildFacebookAuthUrl(provider: PublicFederatedProvider, state: string) {
  const params = new URLSearchParams({
    client_id: provider.clientId,
    redirect_uri: provider.callbackUrl,
    scope: provider.scopes || 'email,public_profile',
    response_type: 'code',
    state,
  });
  return `https://www.facebook.com/v21.0/dialog/oauth?${params.toString()}`;
}

function buildLinkedInAuthUrl(provider: PublicFederatedProvider, state: string) {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: provider.clientId,
    redirect_uri: provider.callbackUrl,
    scope: provider.scopes || 'openid profile email',
    state,
  });
  return `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
}

async function buildTwitterAuthUrl(provider: PublicFederatedProvider, state: string) {
  const codeVerifier = randomString(32);
  const codeChallenge = await sha256Base64Url(codeVerifier);
  sessionStorage.setItem(OAUTH_PKCE_KEY, codeVerifier);
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: provider.clientId,
    redirect_uri: provider.callbackUrl,
    scope: provider.scopes || 'tweet.read users.read users.read.email offline.access',
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });
  return `https://twitter.com/i/oauth2/authorize?${params.toString()}`;
}

const providerButtonClass =
  'w-full inline-flex items-center justify-center gap-2 rounded-xl border border-[#E6D8C9] bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-[#F7F3EE] disabled:cursor-not-allowed disabled:opacity-50';

export function FederatedLoginButtons({
  mode,
  disabled,
  onGoogleSuccess,
  onGoogleError,
  onError,
}: Props) {
  const [providers, setProviders] = useState<PublicFederatedProvider[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetchFederatedLoginProviders()
      .then((rows) => {
        if (active) setProviders(rows);
      })
      .catch(() => {
        if (active) setProviders([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const googleClientId = useMemo(() => getGoogleClientIdFromProviders(providers), [providers]);
  const googleReady = useMemo(() => isGoogleOAuthConfigured(providers), [providers]);

  const startRedirect = useCallback(
    async (provider: PublicFederatedProvider) => {
      if (disabled) return;
      const state = randomString(16);
      try {
        let url = '';
        if (provider.provider === 'facebook') {
          storeOAuthSession(state, '');
          url = buildFacebookAuthUrl(provider, state);
        } else if (provider.provider === 'linkedin') {
          storeOAuthSession(state, '');
          url = buildLinkedInAuthUrl(provider, state);
        } else if (provider.provider === 'twitter') {
          storeOAuthSession(state, '');
          url = await buildTwitterAuthUrl(provider, state);
          sessionStorage.setItem(OAUTH_STATE_KEY, state);
        }
        if (url) window.location.href = url;
      } catch {
        onError?.('Could not start sign-in. Please try again.');
      }
    },
    [disabled, onError]
  );

  if (loading) {
    return (
      <p className="text-xs text-center text-slate-500 py-2">Loading sign-in options…</p>
    );
  }

  const socialProviders = providers.filter((p) => p.provider !== 'google');
  const hasAny = googleReady || socialProviders.length > 0;

  if (!hasAny) {
    return (
      <p className="text-xs text-center text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
        Social sign-in is not configured yet. Use email or contact your administrator.
      </p>
    );
  }

  const googleBlock = googleReady ? (
    <GoogleOAuthProvider clientId={googleClientId}>
      <GoogleLogin
        onSuccess={(res) => void onGoogleSuccess(res.credential || '')}
        onError={onGoogleError}
        useOneTap={mode === 'login'}
        shape="rectangular"
        theme="outline"
        text={mode === 'signup' ? 'signup_with' : 'signin_with'}
        size="large"
        width="100%"
      />
    </GoogleOAuthProvider>
  ) : null;

  return (
    <div className="space-y-2 w-full">
      {googleBlock}
      {socialProviders.map((provider) => (
        <button
          key={provider.provider}
          type="button"
          disabled={disabled}
          className={providerButtonClass}
          onClick={() => void startRedirect(provider)}
        >
          Continue with {provider.label}
        </button>
      ))}
    </div>
  );
}

export { OAUTH_PKCE_KEY, OAUTH_REFERRER_KEY, OAUTH_STATE_KEY };
