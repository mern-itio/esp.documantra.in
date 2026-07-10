export type CookieCategory = 'essential' | 'performance' | 'functional' | 'marketing';

export type CookiePreferences = {
  essential: true;
  performance: boolean;
  functional: boolean;
  marketing: boolean;
  updatedAt: string;
};

const STORAGE_KEY = 'dm_cookie_preferences';

export const DEFAULT_COOKIE_PREFERENCES: CookiePreferences = {
  essential: true,
  performance: false,
  functional: false,
  marketing: false,
  updatedAt: new Date(0).toISOString(),
};

export function readCookiePreferences(): CookiePreferences | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CookiePreferences;
    if (!parsed || parsed.essential !== true) return null;
    return {
      essential: true,
      performance: !!parsed.performance,
      functional: !!parsed.functional,
      marketing: !!parsed.marketing,
      updatedAt: parsed.updatedAt || new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export function saveCookiePreferences(
  prefs: Omit<CookiePreferences, 'essential' | 'updatedAt'> & { essential?: true },
): CookiePreferences {
  const next: CookiePreferences = {
    essential: true,
    performance: !!prefs.performance,
    functional: !!prefs.functional,
    marketing: !!prefs.marketing,
    updatedAt: new Date().toISOString(),
  };
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent('dm:cookie-preferences-updated', { detail: next }));
  }
  return next;
}

export function hasCookieConsentChoice(): boolean {
  return readCookiePreferences() !== null;
}

export function acceptAllCookiePreferences(): CookiePreferences {
  return saveCookiePreferences({
    performance: true,
    functional: true,
    marketing: true,
  });
}

export function rejectNonEssentialCookiePreferences(): CookiePreferences {
  return saveCookiePreferences({
    performance: false,
    functional: false,
    marketing: false,
  });
}
