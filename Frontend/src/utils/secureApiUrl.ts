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
  if (envUrl && envUrl.trim()) {
    return upgradeToHttpsIfPageIsSecure(envUrl.trim());
  }

  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    return `${window.location.origin}${options.productionPath}`;
  }

  return options.localUrl;
};

export const assertSecureApiUrl = (url: string, label = 'API'): void => {
  if (typeof window === 'undefined') return;
  if (window.location.protocol === 'https:' && url.startsWith('http://')) {
    throw new Error(`${label} must use HTTPS when the application is served over HTTPS.`);
  }
};
