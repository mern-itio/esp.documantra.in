const STORAGE_KEY = 'signupAttributionV1'

export type SignupAttribution = {
  landingPage: string
  httpReferrer: string
  signupPageUrl: string
  utmSource: string
  utmMedium: string
  utmCampaign: string
  capturedAt: string
}

function readParams(): Pick<SignupAttribution, 'utmSource' | 'utmMedium' | 'utmCampaign'> {
  try {
    const params = new URLSearchParams(window.location.search)
    return {
      utmSource: params.get('utm_source')?.trim() || '',
      utmMedium: params.get('utm_medium')?.trim() || '',
      utmCampaign: params.get('utm_campaign')?.trim() || '',
    }
  } catch {
    return { utmSource: '', utmMedium: '', utmCampaign: '' }
  }
}

function safeParse(raw: string | null): Partial<SignupAttribution> | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : null
  } catch {
    return null
  }
}

/** First-touch capture: landing URL + document.referrer (does not overwrite). */
export function captureSignupAttribution(): SignupAttribution {
  const utm = readParams()
  let existing: Partial<SignupAttribution> | null = null
  try {
    existing = safeParse(sessionStorage.getItem(STORAGE_KEY))
  } catch {
    existing = null
  }

  const next: SignupAttribution = {
    landingPage: existing?.landingPage || window.location.href,
    httpReferrer: existing?.httpReferrer || document.referrer || '',
    signupPageUrl: existing?.signupPageUrl || '',
    utmSource: existing?.utmSource || utm.utmSource,
    utmMedium: existing?.utmMedium || utm.utmMedium,
    utmCampaign: existing?.utmCampaign || utm.utmCampaign,
    capturedAt: existing?.capturedAt || new Date().toISOString(),
  }

  // Prefer first non-empty UTM from current URL if missing
  if (!next.utmSource && utm.utmSource) next.utmSource = utm.utmSource
  if (!next.utmMedium && utm.utmMedium) next.utmMedium = utm.utmMedium
  if (!next.utmCampaign && utm.utmCampaign) next.utmCampaign = utm.utmCampaign

  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    /* ignore */
  }
  return next
}

/** Call on /signup so we also store the signup page URL. */
export function markSignupPageVisit(): SignupAttribution {
  const base = captureSignupAttribution()
  const next: SignupAttribution = {
    ...base,
    signupPageUrl: window.location.href,
    // If they opened signup via an external link, refresh referrer when empty
    httpReferrer: base.httpReferrer || document.referrer || '',
  }
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    /* ignore */
  }
  return next
}

export function getSignupAttributionPayload(): {
  httpReferrer?: string
  landingPage?: string
  signupPageUrl?: string
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
} {
  const data = markSignupPageVisit()
  return {
    ...(data.httpReferrer ? { httpReferrer: data.httpReferrer } : {}),
    ...(data.landingPage ? { landingPage: data.landingPage } : {}),
    ...(data.signupPageUrl ? { signupPageUrl: data.signupPageUrl } : {}),
    ...(data.utmSource ? { utmSource: data.utmSource } : {}),
    ...(data.utmMedium ? { utmMedium: data.utmMedium } : {}),
    ...(data.utmCampaign ? { utmCampaign: data.utmCampaign } : {}),
  }
}

export function clearSignupAttribution(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
}
