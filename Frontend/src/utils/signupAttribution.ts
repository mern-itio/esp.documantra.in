const STORAGE_KEY = 'signupAttributionV2'
const COOKIE_KEY = 'dm_attr_v1'
const COOKIE_DOMAIN = '.documantra.in'
const MAX_JOURNEY = 25

export type JourneyStep = {
  url: string
  title: string
  at: string
  referrer?: string
}

export type SignupAttribution = {
  landingPage: string
  landingTitle: string
  /** First external referrer only (Google / other sites) — never overwritten by esp/documantra URLs */
  httpReferrer: string
  externalReferrer: string
  signupPageUrl: string
  searchKeyword: string
  trafficSource: string
  utmSource: string
  utmMedium: string
  utmCampaign: string
  utmTerm: string
  utmContent: string
  gclid: string
  fbclid: string
  journey: JourneyStep[]
  capturedAt: string
}

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined'
}

function isEspHost(hostname: string): boolean {
  const h = hostname.toLowerCase()
  return h === 'esp.documantra.in' || h === 'esign.documantra.in'
}

function isMarketingHost(hostname: string): boolean {
  const h = hostname.toLowerCase()
  return h === 'documantra.in' || h === 'www.documantra.in'
}

function isInternalHost(hostname: string): boolean {
  const h = hostname.toLowerCase()
  return h === 'documantra.in' || h.endsWith('.documantra.in') || h === 'localhost' || h === '127.0.0.1'
}

function isInternalUrl(url: string): boolean {
  if (!url) return false
  try {
    return isInternalHost(new URL(url).hostname)
  } catch {
    return /documantra\.in/i.test(url)
  }
}

function isExternalUrl(url: string): boolean {
  return Boolean(url) && !isInternalUrl(url)
}

function isMarketingUrl(url: string): boolean {
  if (!url) return false
  try {
    return isMarketingHost(new URL(url).hostname)
  } catch {
    return false
  }
}

function isEspUrl(url: string): boolean {
  if (!url) return false
  try {
    return isEspHost(new URL(url).hostname)
  } catch {
    return false
  }
}

function isSignupUrl(url: string): boolean {
  if (!url) return false
  try {
    const u = new URL(url)
    const path = u.pathname.replace(/\/+$/, '') || '/'
    return path === '/signup'
  } catch {
    return /\/signup\/?(\?|$)/i.test(url)
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

function readCookie(name: string): string {
  if (!isBrowser()) return ''
  const parts = document.cookie.split(';')
  for (const part of parts) {
    const [k, ...rest] = part.trim().split('=')
    if (k === name) return decodeURIComponent(rest.join('=') || '')
  }
  return ''
}

function writeCookie(name: string, value: string, days = 90) {
  if (!isBrowser()) return
  const maxAge = days * 24 * 60 * 60
  const secure = window.location.protocol === 'https:' ? '; Secure' : ''
  const host = window.location.hostname
  const domain =
    host === 'localhost' || host === '127.0.0.1' ? '' : `; Domain=${COOKIE_DOMAIN}`
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}${domain}`
}

function readParams() {
  try {
    const params = new URLSearchParams(window.location.search)
    return {
      utmSource: params.get('utm_source')?.trim() || '',
      utmMedium: params.get('utm_medium')?.trim() || '',
      utmCampaign: params.get('utm_campaign')?.trim() || '',
      utmTerm: params.get('utm_term')?.trim() || '',
      utmContent: params.get('utm_content')?.trim() || '',
      gclid: params.get('gclid')?.trim() || '',
      fbclid: params.get('fbclid')?.trim() || '',
      dmLanding: params.get('dm_landing')?.trim() || '',
      dmTitle: params.get('dm_title')?.trim() || '',
      dmRef: params.get('dm_ref')?.trim() || '',
      dmKeyword: params.get('dm_keyword')?.trim() || '',
      dmSource: params.get('dm_source')?.trim() || '',
    }
  } catch {
    return {
      utmSource: '',
      utmMedium: '',
      utmCampaign: '',
      utmTerm: '',
      utmContent: '',
      gclid: '',
      fbclid: '',
      dmLanding: '',
      dmTitle: '',
      dmRef: '',
      dmKeyword: '',
      dmSource: '',
    }
  }
}

/** Pull search keyword from Google/Bing/Yahoo/DuckDuckGo referrer when present. */
export function extractSearchKeyword(referrerUrl: string): string {
  if (!referrerUrl) return ''
  try {
    const u = new URL(referrerUrl)
    const params = u.searchParams
    const candidates = ['q', 'query', 'text', 'keyword', 'p']
    for (const key of candidates) {
      const val = params.get(key)?.trim()
      if (val) return val.slice(0, 200)
    }
  } catch {
    /* ignore */
  }
  return ''
}

function classifyTrafficSource(input: {
  externalReferrer: string
  utmSource: string
  utmMedium: string
  gclid: string
  fbclid: string
}): string {
  if (input.gclid) return 'google_ads'
  if (input.fbclid) return 'facebook_ads'
  if (input.utmSource || input.utmMedium) {
    const m = (input.utmMedium || '').toLowerCase()
    const s = (input.utmSource || '').toLowerCase()
    if (m.includes('cpc') || m.includes('ppc') || m.includes('paid')) return `paid:${s || m}`
    if (m.includes('email')) return `email:${s || 'email'}`
    if (m.includes('social')) return `social:${s || 'social'}`
    return `utm:${s || m}`
  }
  const ref = input.externalReferrer
  if (!ref) return 'direct'
  try {
    const host = new URL(ref).hostname.toLowerCase()
    if (host.includes('google.')) return 'google_organic'
    if (host.includes('bing.')) return 'bing_organic'
    if (host.includes('yahoo.')) return 'yahoo_organic'
    if (host.includes('duckduckgo.')) return 'duckduckgo'
    if (host.includes('facebook.') || host.includes('fb.')) return 'facebook_referral'
    if (host.includes('linkedin.')) return 'linkedin_referral'
    if (host.includes('twitter.') || host.includes('t.co') || host.includes('x.com')) return 'twitter_referral'
    if (host.includes('instagram.')) return 'instagram_referral'
    if (host.includes('youtube.')) return 'youtube_referral'
    return `referral:${host}`
  } catch {
    return 'referral'
  }
}

function loadStored(): Partial<SignupAttribution> {
  if (!isBrowser()) return {}
  const fromSession = safeParse(sessionStorage.getItem(STORAGE_KEY)) || {}
  const fromCookie = safeParse(readCookie(COOKIE_KEY)) || {}
  return {
    ...fromSession,
    ...fromCookie,
    landingPage: fromCookie.landingPage || fromSession.landingPage || '',
    landingTitle: fromCookie.landingTitle || fromSession.landingTitle || '',
    httpReferrer: fromCookie.httpReferrer || fromSession.httpReferrer || '',
    externalReferrer: fromCookie.externalReferrer || fromSession.externalReferrer || '',
    searchKeyword: fromCookie.searchKeyword || fromSession.searchKeyword || '',
    trafficSource: fromCookie.trafficSource || fromSession.trafficSource || '',
    utmSource: fromCookie.utmSource || fromSession.utmSource || '',
    utmMedium: fromCookie.utmMedium || fromSession.utmMedium || '',
    utmCampaign: fromCookie.utmCampaign || fromSession.utmCampaign || '',
    utmTerm: fromCookie.utmTerm || fromSession.utmTerm || '',
    utmContent: fromCookie.utmContent || fromSession.utmContent || '',
    gclid: fromCookie.gclid || fromSession.gclid || '',
    fbclid: fromCookie.fbclid || fromSession.fbclid || '',
    journey:
      Array.isArray(fromCookie.journey) && fromCookie.journey.length
        ? fromCookie.journey
        : Array.isArray(fromSession.journey)
          ? fromSession.journey
          : [],
    capturedAt: fromCookie.capturedAt || fromSession.capturedAt || '',
    signupPageUrl: fromSession.signupPageUrl || fromCookie.signupPageUrl || '',
  }
}

function persist(data: SignupAttribution) {
  if (!isBrowser()) return
  const raw = JSON.stringify(data)
  try {
    sessionStorage.setItem(STORAGE_KEY, raw)
  } catch {
    /* ignore */
  }
  try {
    writeCookie(COOKIE_KEY, raw)
  } catch {
    /* ignore */
  }
}

function firstExternalReferrer(existing: string, candidate: string): string {
  if (existing && isExternalUrl(existing)) return existing
  if (candidate && isExternalUrl(candidate)) return candidate
  return ''
}

function pickLandingPage(
  existing: string,
  dmLanding: string,
  docRef: string,
  nowUrl: string,
): string {
  const candidates = [existing, dmLanding, isMarketingUrl(docRef) ? docRef : '', nowUrl]
  for (const c of candidates) {
    if (!c) continue
    // Prefer non-signup first-touch over the ESP signup URL itself.
    if (isSignupUrl(c) && isEspUrl(c)) continue
    return c
  }
  return existing || dmLanding || nowUrl
}

/** First-touch + journey capture. Safe to call on every page. */
export function captureSignupAttribution(): SignupAttribution {
  if (!isBrowser()) {
    return emptyAttribution()
  }

  const existing = loadStored()
  const params = readParams()
  const docRef = document.referrer || ''
  const nowUrl = window.location.href

  const externalReferrer = firstExternalReferrer(
    existing.externalReferrer || (isExternalUrl(existing.httpReferrer || '') ? existing.httpReferrer! : ''),
    params.dmRef || docRef,
  )

  const landingPage = pickLandingPage(
    existing.landingPage || '',
    params.dmLanding,
    docRef,
    nowUrl,
  )

  const landingTitle = (existing.landingTitle || params.dmTitle || '').slice(0, 200)

  const searchKeyword =
    existing.searchKeyword ||
    params.dmKeyword ||
    params.utmTerm ||
    extractSearchKeyword(externalReferrer) ||
    extractSearchKeyword(params.dmRef) ||
    ''

  const utmSource = existing.utmSource || params.utmSource
  const utmMedium = existing.utmMedium || params.utmMedium
  const utmCampaign = existing.utmCampaign || params.utmCampaign
  const utmTerm = existing.utmTerm || params.utmTerm
  const utmContent = existing.utmContent || params.utmContent
  const gclid = existing.gclid || params.gclid
  const fbclid = existing.fbclid || params.fbclid

  const trafficSource =
    existing.trafficSource ||
    params.dmSource ||
    classifyTrafficSource({
      externalReferrer,
      utmSource,
      utmMedium,
      gclid,
      fbclid,
    })

  const journey = Array.isArray(existing.journey) ? [...existing.journey] : []
  // If we arrived from marketing with empty journey, seed the marketing page.
  if (!journey.length && isMarketingUrl(docRef)) {
    appendJourney(journey, docRef, params.dmTitle || '', isExternalUrl(externalReferrer) ? externalReferrer : '')
  }
  if (!journey.length && params.dmLanding && !isEspUrl(params.dmLanding)) {
    appendJourney(journey, params.dmLanding, params.dmTitle || '', externalReferrer)
  }
  appendJourney(journey, nowUrl, document.title || '', isExternalUrl(docRef) ? docRef : '')

  const next: SignupAttribution = {
    landingPage,
    landingTitle: (landingTitle || params.dmTitle || '').slice(0, 200),
    // Never store ESP/marketing internal pages as "external" HTTP referrer.
    httpReferrer: externalReferrer,
    externalReferrer,
    signupPageUrl: existing.signupPageUrl || '',
    searchKeyword,
    trafficSource,
    utmSource,
    utmMedium,
    utmCampaign,
    utmTerm,
    utmContent,
    gclid,
    fbclid,
    journey: journey.slice(-MAX_JOURNEY),
    capturedAt: existing.capturedAt || new Date().toISOString(),
  }

  persist(next)
  return next
}

function appendJourney(journey: JourneyStep[], url: string, title: string, referrer: string) {
  if (!url) return
  const last = journey[journey.length - 1]
  if (last && last.url === url) return
  journey.push({
    url: url.slice(0, 1024),
    title: (title || '').slice(0, 200),
    at: new Date().toISOString(),
    ...(referrer && isExternalUrl(referrer) ? { referrer: referrer.slice(0, 1024) } : {}),
  })
}

function emptyAttribution(): SignupAttribution {
  return {
    landingPage: '',
    landingTitle: '',
    httpReferrer: '',
    externalReferrer: '',
    signupPageUrl: '',
    searchKeyword: '',
    trafficSource: '',
    utmSource: '',
    utmMedium: '',
    utmCampaign: '',
    utmTerm: '',
    utmContent: '',
    gclid: '',
    fbclid: '',
    journey: [],
    capturedAt: '',
  }
}

/** Call on each SPA navigation to extend the path. */
export function trackJourneyPage(): SignupAttribution {
  return captureSignupAttribution()
}

/** Call on /signup so we also store the signup page URL. */
export function markSignupPageVisit(): SignupAttribution {
  const base = captureSignupAttribution()
  const next: SignupAttribution = {
    ...base,
    signupPageUrl: window.location.href.split('#')[0],
  }
  persist(next)
  return next
}

function readVisitorIdCookie(): string {
  if (!isBrowser()) return ''
  const parts = document.cookie.split(';')
  for (const part of parts) {
    const [k, ...rest] = part.trim().split('=')
    if (k === 'dm_vid') {
      try {
        return decodeURIComponent(rest.join('=') || '')
      } catch {
        return rest.join('=') || ''
      }
    }
  }
  return ''
}

export function getSignupAttributionPayload(): Record<string, string | JourneyStep[]> {
  const data = markSignupPageVisit()
  const out: Record<string, string | JourneyStep[]> = {}
  if (data.httpReferrer && isExternalUrl(data.httpReferrer)) out.httpReferrer = data.httpReferrer
  if (data.externalReferrer && isExternalUrl(data.externalReferrer)) {
    out.externalReferrer = data.externalReferrer
  }
  if (data.landingPage) out.landingPage = data.landingPage
  if (data.landingTitle) out.landingTitle = data.landingTitle
  if (data.signupPageUrl) out.signupPageUrl = data.signupPageUrl
  if (data.searchKeyword) out.searchKeyword = data.searchKeyword
  if (data.trafficSource) out.trafficSource = data.trafficSource
  if (data.utmSource) out.utmSource = data.utmSource
  if (data.utmMedium) out.utmMedium = data.utmMedium
  if (data.utmCampaign) out.utmCampaign = data.utmCampaign
  if (data.utmTerm) out.utmTerm = data.utmTerm
  if (data.utmContent) out.utmContent = data.utmContent
  if (data.gclid) out.gclid = data.gclid
  if (data.fbclid) out.fbclid = data.fbclid
  if (data.journey?.length) out.journey = data.journey
  const visitorId = readVisitorIdCookie()
  if (visitorId) out.visitorId = visitorId
  return out
}

export function clearSignupAttribution(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
  try {
    writeCookie(COOKIE_KEY, '', -1)
  } catch {
    /* ignore */
  }
}

/** Build ESP signup URL carrying first-touch params (backup if cookie blocked). */
export function buildEspSignupUrl(base = 'https://esp.documantra.in/signup'): string {
  if (!isBrowser()) return base
  const data = captureSignupAttribution()
  try {
    const u = new URL(base)
    if (data.landingPage) u.searchParams.set('dm_landing', data.landingPage)
    if (data.landingTitle) u.searchParams.set('dm_title', data.landingTitle)
    if (data.externalReferrer) u.searchParams.set('dm_ref', data.externalReferrer)
    if (data.searchKeyword) u.searchParams.set('dm_keyword', data.searchKeyword)
    if (data.trafficSource) u.searchParams.set('dm_source', data.trafficSource)
    if (data.utmSource) u.searchParams.set('utm_source', data.utmSource)
    if (data.utmMedium) u.searchParams.set('utm_medium', data.utmMedium)
    if (data.utmCampaign) u.searchParams.set('utm_campaign', data.utmCampaign)
    if (data.utmTerm) u.searchParams.set('utm_term', data.utmTerm)
    return u.toString()
  } catch {
    return base
  }
}
