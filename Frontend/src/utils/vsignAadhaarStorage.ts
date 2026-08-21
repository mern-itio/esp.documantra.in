const STORAGE_KEY = 'documantra.vsign.aadhaar.v1';
const LAST4_STORAGE_KEY = 'documantra.vsign.aadhaarLast4.v1';

type StoredMap = Record<string, { aadhaar: string; savedAt: number }>;
type Last4Map = Record<string, { last4: string; savedAt: number }>;

function readStore(): StoredMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeStore(data: StoredMap): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* quota / private mode — ignore */
  }
}

function readLast4Store(): Last4Map {
  try {
    const raw = localStorage.getItem(LAST4_STORAGE_KEY) || sessionStorage.getItem(LAST4_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeLast4Store(data: Last4Map): void {
  const json = JSON.stringify(data);
  try {
    localStorage.setItem(LAST4_STORAGE_KEY, json);
  } catch {
    /* ignore */
  }
  try {
    sessionStorage.setItem(LAST4_STORAGE_KEY, json);
  } catch {
    /* ignore */
  }
}

function normalizeEmail(email?: string): string {
  return String(email || '').trim().toLowerCase();
}

function normalizeAadhaar(value?: string): string {
  return String(value || '').replace(/\D/g, '');
}

function normalizeId(id?: string): string {
  return String(id || '').trim();
}

/** Aadhaar saved in this browser for a recipient email (repeat signing → OTP only on VSign). */
export function getStoredVSignAadhaar(email?: string): string | null {
  const key = normalizeEmail(email);
  if (!key) return null;
  const entry = readStore()[key];
  const aadhaar = normalizeAadhaar(entry?.aadhaar);
  return aadhaar.length === 12 ? aadhaar : null;
}

export function storeVSignAadhaar(
  email: string | undefined,
  aadhaarNumber: string,
  recipientId?: string,
): void {
  const aadhaar = normalizeAadhaar(aadhaarNumber);
  if (aadhaar.length !== 12) return;
  const last4 = aadhaar.slice(-4);
  const emailKey = normalizeEmail(email);
  if (emailKey) {
    const data = readStore();
    data[emailKey] = { aadhaar, savedAt: Date.now() };
    writeStore(data);
  }
  storeVSignAadhaarLast4(email, last4, recipientId);
}

export function storeVSignAadhaarLast4(
  email: string | undefined,
  last4: string,
  recipientId?: string,
): void {
  const digits = String(last4 || '').replace(/\D/g, '').slice(-4);
  if (digits.length !== 4) return;
  const data = readLast4Store();
  const savedAt = Date.now();
  const emailKey = normalizeEmail(email);
  const idKey = normalizeId(recipientId);
  if (emailKey) data[`email:${emailKey}`] = { last4: digits, savedAt };
  if (idKey) data[`id:${idKey}`] = { last4: digits, savedAt };
  writeLast4Store(data);
}

export function getStoredVSignAadhaarLast4(email?: string, recipientId?: string): string | null {
  const data = readLast4Store();
  const idKey = normalizeId(recipientId);
  const emailKey = normalizeEmail(email);
  const fromId = idKey ? data[`id:${idKey}`]?.last4 : '';
  const fromEmail = emailKey ? data[`email:${emailKey}`]?.last4 : '';
  const fromFull = getStoredVSignAadhaar(email)?.slice(-4) || '';
  const last4 = String(fromId || fromEmail || fromFull || '').replace(/\D/g, '').slice(-4);
  return last4.length === 4 ? last4 : null;
}
