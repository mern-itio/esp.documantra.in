export type EncryptedLoginBody = {
  v: 1;
  enc: 'aes-256-gcm';
  key: string;
  iv: string;
  data: string;
  tag: string;
};

const pemToArrayBuffer = (pem: string): ArrayBuffer => {
  const b64 = pem.replace(/-----BEGIN PUBLIC KEY-----/g, '')
    .replace(/-----END PUBLIC KEY-----/g, '')
    .replace(/\s/g, '');
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
};

const importRsaPublicKey = async (publicKeyPem: string): Promise<CryptoKey> =>
  crypto.subtle.importKey(
    'spki',
    pemToArrayBuffer(publicKeyPem),
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    false,
    ['encrypt'],
  );

const toBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

export const encryptLoginPayload = async (
  payload: Record<string, unknown>,
  publicKeyPem: string,
): Promise<EncryptedLoginBody> => {
  const publicKey = await importRsaPublicKey(publicKeyPem);
  const aesKey = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt'],
  );
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(JSON.stringify(payload));
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    aesKey,
    encoded,
  );

  const cipherBytes = new Uint8Array(ciphertext);
  const tag = cipherBytes.slice(cipherBytes.length - 16);
  const data = cipherBytes.slice(0, cipherBytes.length - 16);
  const rawAesKey = await crypto.subtle.exportKey('raw', aesKey);
  const encryptedKey = await crypto.subtle.encrypt(
    { name: 'RSA-OAEP' },
    publicKey,
    rawAesKey,
  );

  return {
    v: 1,
    enc: 'aes-256-gcm',
    key: toBase64(encryptedKey),
    iv: toBase64(iv.buffer),
    data: toBase64(data.buffer),
    tag: toBase64(tag.buffer),
  };
};

export const fetchLoginPublicKey = async (publicKeyUrl: string): Promise<string> => {
  const res = await fetch(publicKeyUrl, { method: 'GET', credentials: 'include' });
  if (!res.ok) {
    throw new Error('Failed to fetch login public key');
  }
  const json = await res.json();
  if (!json?.publicKey || typeof json.publicKey !== 'string') {
    throw new Error('Invalid login public key response');
  }
  return json.publicKey;
};
