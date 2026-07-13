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

  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
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
    if (!pageIsLocal && (host === 'localhost' || host === '127.0.0.1')) {
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
