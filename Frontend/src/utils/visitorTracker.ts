const VID_KEY = 'dm_vid'
const SID_KEY = 'dm_sid'
const SID_AT_KEY = 'dm_sid_at'
const COOKIE_DOMAIN = '.documantra.in'
const SESSION_MS = 30 * 60 * 1000
const ENDPOINT =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_TRACKING_ENDPOINT) ||
  'https://esp.documantra.in/track/v1/batch'

function isBrowser() {
  return typeof window !== 'undefined' && typeof document !== 'undefined'
}

function readCookie(name: string) {
  if (!isBrowser()) return ''
  const parts = document.cookie.split(';')
  for (const part of parts) {
    const [k, ...rest] = part.trim().split('=')
    if (k === name) {
      try {
        return decodeURIComponent(rest.join('=') || '')
      } catch {
        return rest.join('=') || ''
      }
    }
  }
  return ''
}

function writeCookie(name: string, value: string, days = 400) {
  if (!isBrowser()) return
  const maxAge = days * 24 * 60 * 60
  const secure = window.location.protocol === 'https:' ? '; Secure' : ''
  const host = window.location.hostname
  const domain = host === 'localhost' || host === '127.0.0.1' ? '' : `; Domain=${COOKIE_DOMAIN}`
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}${domain}`
}

function uuid() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export function getVisitorId(): string {
  if (!isBrowser()) return ''
  let id = readCookie(VID_KEY)
  if (!id) {
    id = uuid()
    writeCookie(VID_KEY, id, 400)
  }
  return id
}

export function getSessionId(): string {
  if (!isBrowser()) return ''
  let id = readCookie(SID_KEY)
  const at = Number(readCookie(SID_AT_KEY) || 0)
  if (!id || !at || Date.now() - at > SESSION_MS) {
    id = uuid()
    writeCookie(SID_KEY, id, 1)
  }
  writeCookie(SID_AT_KEY, String(Date.now()), 1)
  return id
}

function send(events: Record<string, unknown>[]) {
  if (!isBrowser() || !events.length) return
  const payload = JSON.stringify({
    visitorId: getVisitorId(),
    sessionId: getSessionId(),
    events,
  })
  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon(ENDPOINT, new Blob([payload], { type: 'application/json' }))
      return
    }
    fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      keepalive: true,
      mode: 'cors',
      credentials: 'omit',
    }).catch(() => undefined)
  } catch {
    /* soft-fail */
  }
}

let lastPath = ''
let enteredAt = Date.now()

export function trackPageView() {
  if (!isBrowser()) return
  const path = window.location.pathname + window.location.search
  if (path === lastPath) return
  if (lastPath) {
    send([
      {
        type: 'page_leave',
        pageUrl: window.location.origin + lastPath,
        durationSeconds: Math.round((Date.now() - enteredAt) / 1000),
      },
    ])
  }
  lastPath = path
  enteredAt = Date.now()
  send([
    {
      type: 'page_view',
      pageUrl: window.location.href.split('#')[0],
      pageTitle: document.title || '',
      previousPage: document.referrer || '',
      referrer: document.referrer || '',
    },
  ])
}

export function trackVisitorEvent(type: string, metadata?: Record<string, unknown>) {
  send([
    {
      type,
      pageUrl: isBrowser() ? window.location.href.split('#')[0] : '',
      metadata: metadata || {},
    },
  ])
}

export function initVisitorTracker() {
  if (!isBrowser()) return
  getVisitorId()
  getSessionId()
  trackPageView()
  window.addEventListener('popstate', () => setTimeout(trackPageView, 0))
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      send([
        {
          type: 'page_leave',
          pageUrl: window.location.href.split('#')[0],
          durationSeconds: Math.round((Date.now() - enteredAt) / 1000),
        },
      ])
    }
  })
}
