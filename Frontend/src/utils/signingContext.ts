export type SigningAuthMethodEvidence = {
  authMethodId?: string;
  name?: string;
  type?: string;
  status: 'completed' | 'rejected' | 'pending';
  completedAt?: string;
  details?: Record<string, unknown>;
};

export type SigningContextPayload = {
  device?: string;
  os?: string;
  browser?: string;
  userAgent?: string;
  ip?: string;
  isp?: string;
  location?: string;
  geoCoords?: string;
  latitude?: number;
  longitude?: number;
  city?: string;
  region?: string;
  country?: string;
  countryCode?: string;
  zip?: string;
  timezone?: string;
  org?: string;
  asn?: string;
  openedAt?: string;
  notificationSentAt?: string;
  documentViewedAt?: string;
  signCompletedAt?: string;
  spokenStatement?: string;
  livePic?: string;
  livePicUrl?: string;
  idPic?: string;
  idPicUrl?: string;
  liveMatchPercent?: number;
  handwrittenSignature?: string;
  dualSignature?: boolean;
  authMethods?: SigningAuthMethodEvidence[];
  timeline?: Array<{ event: string; at: string }>;
};

const OPENED_AT_KEY = 'esign_opened_at';
const EVIDENCE_KEY = 'esign_signing_evidence';

export function persistBiometricEvidence(
  envelopeId: string,
  recipientId: string,
  evidence: Partial<SigningContextPayload>,
) {
  try {
    const key = `${EVIDENCE_KEY}:${envelopeId}:${recipientId}`;
    const existing = getStoredBiometricEvidence(envelopeId, recipientId) || {};
    sessionStorage.setItem(
      key,
      JSON.stringify({ ...existing, ...evidence, biometricVerified: true }),
    );
  } catch {
    // ignore
  }
}

export function getStoredBiometricEvidence(
  envelopeId: string,
  recipientId: string,
): Partial<SigningContextPayload> | null {
  try {
    const raw = sessionStorage.getItem(`${EVIDENCE_KEY}:${envelopeId}:${recipientId}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function markDocumentOpened(envelopeId: string, recipientId: string) {
  try {
    const key = `${OPENED_AT_KEY}:${envelopeId}:${recipientId}`;
    if (!sessionStorage.getItem(key)) {
      sessionStorage.setItem(key, new Date().toISOString());
    }
  } catch {
    // ignore
  }
}

function getOpenedAt(envelopeId: string, recipientId: string): string | undefined {
  try {
    return sessionStorage.getItem(`${OPENED_AT_KEY}:${envelopeId}:${recipientId}`) || undefined;
  } catch {
    return undefined;
  }
}

function parseClient(ua: string) {
  let os = 'Unknown OS';
  if (/Windows NT 10/i.test(ua)) os = 'Windows 10/11';
  else if (/Windows/i.test(ua)) os = 'Windows';
  else if (/Mac OS X/i.test(ua)) os = 'macOS';
  else if (/Android/i.test(ua)) os = 'Android';
  else if (/iPhone|iPad|iOS/i.test(ua)) os = 'iOS';
  else if (/Linux/i.test(ua)) os = 'Linux';

  let browser = 'Unknown Browser';
  if (/Edg\//i.test(ua)) browser = 'Microsoft Edge';
  else if (/Chrome\//i.test(ua) && !/Edg\//i.test(ua)) browser = 'Google Chrome';
  else if (/Firefox\//i.test(ua)) browser = 'Mozilla Firefox';
  else if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) browser = 'Apple Safari';

  let device = 'Desktop';
  if (/Mobile|Android|iPhone/i.test(ua)) device = 'Mobile';
  else if (/iPad|Tablet/i.test(ua)) device = 'Tablet';

  return { os, browser, device };
}

async function fetchIpGeo(ip: string): Promise<Partial<SigningContextPayload>> {
  if (!ip) return {};
  try {
    const res = await fetch(
      `https://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,message,country,countryCode,regionName,city,zip,lat,lon,timezone,isp,org,as,query`,
    );
    if (!res.ok) return {};
    const data = await res.json();
    if (data?.status !== 'success') return {};
    const location = [data.city, data.regionName, data.country].filter(Boolean).join(', ');
    return {
      ip: data.query || ip,
      location,
      geoCoords:
        data.lat != null && data.lon != null ? `${data.lat}, ${data.lon}` : undefined,
      latitude: typeof data.lat === 'number' ? data.lat : undefined,
      longitude: typeof data.lon === 'number' ? data.lon : undefined,
      city: data.city || undefined,
      region: data.regionName || undefined,
      country: data.country || undefined,
      countryCode: data.countryCode || undefined,
      zip: data.zip || undefined,
      timezone: data.timezone || undefined,
      isp: data.isp || undefined,
      org: data.org || undefined,
      asn: data.as || undefined,
    };
  } catch {
    return {};
  }
}

export async function collectSigningContext(
  envelopeId: string,
  recipientId: string,
  extras: Partial<SigningContextPayload> = {},
): Promise<SigningContextPayload> {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent || '' : '';
  const parsed = parseClient(ua);
  const openedAt = getOpenedAt(envelopeId, recipientId) || new Date().toISOString();
  const storedEvidence = getStoredBiometricEvidence(envelopeId, recipientId) || {};
  const biometricVerified = Boolean(
    (storedEvidence as Partial<SigningContextPayload> & { biometricVerified?: boolean }).biometricVerified,
  );
  const storedBiometric = biometricVerified
    ? {
        livePic: storedEvidence.livePic || storedEvidence.livePicUrl,
        idPic: storedEvidence.idPic || storedEvidence.idPicUrl,
        liveMatchPercent: storedEvidence.liveMatchPercent,
      }
    : {};

  let ip = extras.ip || storedEvidence.ip || '';
  if (!ip) {
    try {
      const res = await fetch('https://api.ipify.org?format=json');
      if (res.ok) {
        const data = await res.json();
        ip = String(data?.ip || '');
      }
    } catch {
      // ignore
    }
  }

  const geoFromExtras = {
    location: extras.location || storedEvidence.location,
    geoCoords: extras.geoCoords || storedEvidence.geoCoords,
    latitude: extras.latitude ?? storedEvidence.latitude,
    longitude: extras.longitude ?? storedEvidence.longitude,
    city: extras.city || storedEvidence.city,
    region: extras.region || storedEvidence.region,
    country: extras.country || storedEvidence.country,
    countryCode: extras.countryCode || storedEvidence.countryCode,
    zip: extras.zip || storedEvidence.zip,
    timezone: extras.timezone || storedEvidence.timezone,
    isp: extras.isp || storedEvidence.isp,
    org: extras.org || storedEvidence.org,
    asn: extras.asn || storedEvidence.asn,
  };
  const needsGeoLookup = ip && !geoFromExtras.latitude && !geoFromExtras.location;
  const ipGeo = needsGeoLookup ? await fetchIpGeo(ip) : {};

  const authMethods = (extras.authMethods || []).filter((m) => m.status === 'completed');
  const timeline = extras.timeline?.length
    ? extras.timeline
    : [
        { event: 'Document Viewed', at: openedAt },
        { event: 'Sign Completed', at: new Date().toISOString() },
        ...authMethods.map((m) => ({
          event: `${m.name || m.type || 'Authentication'} Verified`,
          at: m.completedAt || new Date().toISOString(),
        })),
      ];

  return {
    ...parsed,
    userAgent: ua,
    ip: extras.ip || storedEvidence.ip || ip,
    ...geoFromExtras,
    ...ipGeo,
    openedAt,
    documentViewedAt: openedAt,
    signCompletedAt: new Date().toISOString(),
    dualSignature: Boolean(extras.dualSignature || storedEvidence.dualSignature),
    handwrittenSignature: extras.handwrittenSignature || storedEvidence.handwrittenSignature,
    ...storedBiometric,
    authMethods,
    timeline,
    ...extras,
  };
}
