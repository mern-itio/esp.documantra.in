import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { FaFacebookF, FaLinkedinIn, FaTwitter } from 'react-icons/fa';
import {
  fetchFederatedLoginProviders,
  type PublicFederatedProvider,
  type FederatedProviderId,
} from '../../services/federatedLoginService';

type Props = {
  mode: 'login' | 'signup';
  disabled?: boolean;
  onGoogleSuccess?: (credential: string) => void | Promise<void>;
  onGoogleError?: () => void;
  onError?: (message: string) => void;
};

const OAUTH_PKCE_KEY = 'documantra_oauth_pkce';
const OAUTH_STATE_KEY = 'documantra_oauth_state';
const OAUTH_REFERRER_KEY = 'documantra_oauth_referrer';

const PROVIDER_ORDER: FederatedProviderId[] = ['facebook', 'twitter', 'google', 'linkedin'];

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

function buildGoogleAuthUrl(provider: PublicFederatedProvider, state: string) {
  const params = new URLSearchParams({
    client_id: provider.clientId,
    redirect_uri: provider.callbackUrl,
    response_type: 'code',
    scope: provider.scopes || 'openid email profile',
    state,
    access_type: 'online',
    prompt: 'select_account',
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
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

function providerLabel(provider: FederatedProviderId, mode: 'login' | 'signup') {
  const action = mode === 'signup' ? 'Sign up' : 'Sign in';
  const names: Record<FederatedProviderId, string> = {
    google: 'Google',
    facebook: 'Facebook',
    linkedin: 'LinkedIn',
    twitter: 'Twitter',
  };
  return `${action} with ${names[provider]}`;
}

function providerCircleClass(provider: FederatedProviderId) {
  switch (provider) {
    case 'facebook':
      return 'bg-[#3B5998] hover:bg-[#344E86]';
    case 'twitter':
      return 'bg-[#55ACEE] hover:bg-[#4A9AD8]';
    case 'google':
      return 'bg-[#DD4B39] hover:bg-[#C93F2F]';
    case 'linkedin':
      return 'bg-[#0A66C2] hover:bg-[#0958A8]';
    default:
      return 'bg-slate-600 hover:bg-slate-700';
  }
}

function ProviderGlyph({ provider }: { provider: FederatedProviderId }) {
  switch (provider) {
    case 'facebook':
      return <FaFacebookF className="h-5 w-5" aria-hidden />;
    case 'twitter':
      return <FaTwitter className="h-5 w-5" aria-hidden />;
    case 'google':
      return <span className="text-lg font-bold leading-none">G</span>;
    case 'linkedin':
      return <FaLinkedinIn className="h-5 w-5" aria-hidden />;
    default:
      return null;
  }
}

function CircularSocialButton({
  label,
  provider,
  disabled,
  onClick,
  children,
}: {
  label: string;
  provider: FederatedProviderId;
  disabled?: boolean;
  onClick?: () => void;
  children?: ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label={label}
      className={`relative z-10 flex h-12 w-12 items-center justify-center rounded-full text-white shadow-md transition disabled:cursor-not-allowed disabled:opacity-50 ${providerCircleClass(provider)}`}
    >
      {children}
    </button>
  );
}

export function FederatedLoginButtons({
  mode,
  disabled,
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

  const orderedProviders = useMemo(() => {
    const enabled = new Map(providers.map((row) => [row.provider, row]));
    const rows: PublicFederatedProvider[] = [];
    for (const id of PROVIDER_ORDER) {
      const row = enabled.get(id);
      if (row) rows.push(row);
    }
    return rows;
  }, [providers]);

  const startRedirect = useCallback(
    async (provider: PublicFederatedProvider) => {
      if (disabled) return;
      const state = randomString(16);
      try {
        let url = '';
        if (provider.provider === 'google') {
          storeOAuthSession(state, '');
          url = buildGoogleAuthUrl(provider, state);
        } else if (provider.provider === 'facebook') {
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
    [disabled, onError],
  );

  if (loading) {
    return (
      <p className="py-2 text-center text-xs text-slate-500">Loading sign-in options…</p>
    );
  }

  if (orderedProviders.length === 0) {
    return (
      <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-center text-xs text-amber-700">
        Social sign-in is not configured yet. Use email or contact your administrator.
      </p>
    );
  }

  const heading = mode === 'signup' ? 'Or Sign Up Using' : 'Or Sign In Using';

  return (
    <div className="relative z-10 w-full">
      <p className="mb-4 text-center text-sm font-medium text-slate-500">{heading}</p>
      <div className="flex flex-wrap items-center justify-center gap-4">
        {orderedProviders.map((provider) => (
          <CircularSocialButton
            key={provider.provider}
            label={providerLabel(provider.provider, mode)}
            provider={provider.provider}
            disabled={disabled}
            onClick={() => void startRedirect(provider)}
          >
            <ProviderGlyph provider={provider.provider} />
          </CircularSocialButton>
        ))}
      </div>
    </div>
  );
}

export { OAUTH_PKCE_KEY, OAUTH_REFERRER_KEY, OAUTH_STATE_KEY };
