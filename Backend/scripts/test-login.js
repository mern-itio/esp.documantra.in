/**
 * Test local auth login (supports encrypted login payloads).
 * Usage: node scripts/test-login.js
 */
const { encryptLoginBodyWithPublicKey } = require('../services/auth-service/utils/loginPayloadCrypto');

const email = process.env.SEED_EMAIL || 'sahil.bhingare@secunatix.com';
const password = process.env.SEED_PASSWORD || 'Secunatix@123';
const baseUrl = (process.env.AUTH_BASE_URL || process.env.AUTH_URL || 'http://127.0.0.1:2101')
  .replace(/\/login$/, '');
const loginUrl = `${baseUrl}/login`;
const useEncrypted = process.env.ALLOW_PLAIN_LOGIN !== 'true';

async function main() {
  const plainPayload = { email, password, deviceId: 'test-cli', deviceLabel: 'cli' };
  let body = plainPayload;

  if (useEncrypted) {
    const publicKeyRes = await fetch(`${baseUrl}/login/public-key`);
    if (!publicKeyRes.ok) {
      throw new Error(`Failed to fetch login public key: HTTP ${publicKeyRes.status}`);
    }
    const { publicKey } = await publicKeyRes.json();
    body = encryptLoginBodyWithPublicKey(plainPayload, publicKey);
  }

  const res = await fetch(loginUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = text;
  }
  if (!res.ok) {
    console.error('LOGIN FAILED:', res.status, res.statusText);
    console.error(parsed);
    process.exit(1);
  }
  console.log('LOGIN OK:', JSON.stringify(parsed, null, 2));
}

main().catch((err) => {
  console.error('LOGIN FAILED:', err.message);
  process.exit(1);
});
