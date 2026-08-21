export const upgradeToHttpsIfPageIsSecure = (url: string): string => {
  if (
    typeof window !== 'undefined' &&
    window.location.protocol === 'https:' &&
    url.startsWith('http://')
  ) {
    return url.replace(/^http:/, 'https:');
  }
  return url;
};

export const resolveServiceUrl = (
  envUrl: string | undefined,
  options: { productionPath: string; localUrl: string }
): string => {
  const sanitized = sanitizeServiceEnvUrl(envUrl);
  if (sanitized) {
    return upgradeToHttpsIfPageIsSecure(sanitized);
  }

  if (typeof window !== 'undefined') {
    const host = window.location.hostname.toLowerCase();
    if (host === 'localhost' || host === '127.0.0.1') {
      // Vite dev server proxies these paths to local microservices (avoids CORS).
      return options.productionPath;
    }
    return `${window.location.origin}${options.productionPath}`;
  }

  return options.localUrl;
};

/** Ignore docker-internal hostnames baked into production builds by mistake. */
export const sanitizeServiceEnvUrl = (envUrl: string | undefined): string | undefined => {
  if (!envUrl?.trim()) return undefined;
  const trimmed = envUrl.trim();
  if (trimmed === 'undefined' || trimmed === 'null') return undefined;

  try {
    const parsed = new URL(trimmed.includes('://') ? trimmed : `https://${trimmed}`);
    const host = parsed.hostname.toLowerCase();
    const dockerInternalHosts = new Set([
      'e-sign-service',
      'auth-service',
      'document-service',
      'api-gateway',
    ]);
    if (dockerInternalHosts.has(host) || host.endsWith('.internal')) {
      return undefined;
    }

    const pageHost =
      typeof window !== 'undefined' ? window.location.hostname.toLowerCase() : '';
    const pageIsLocal = pageHost === 'localhost' || pageHost === '127.0.0.1';
    const isLoopbackBackend = host === 'localhost' || host === '127.0.0.1';
    // Local Vite dev uses same-origin proxy paths (/auth, /esign, …) — direct loopback URLs break CORS on /login.
    if (pageIsLocal && isLoopbackBackend) {
      return undefined;
    }
    if (!pageIsLocal && isLoopbackBackend) {
      return undefined;
    }

    return trimmed;
  } catch {
    return undefined;
  }
};

export const assertSecureApiUrl = (url: string, label = 'API'): void => {
  if (typeof window === 'undefined') return;
  if (window.location.protocol === 'https:' && url.startsWith('http://')) {
    throw new Error(`${label} must use HTTPS when the application is served over HTTPS.`);
  }
};
