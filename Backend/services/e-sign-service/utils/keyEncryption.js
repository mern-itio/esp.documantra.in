// utils/keyEncryption.js
const crypto = require('crypto');

const ALGO = 'aes-256-gcm';
const K = process.env.KEY_ENCRYPTION_KEY; // base64 32 bytes

if (!K) {
  console.warn('KEY_ENCRYPTION_KEY not set. Private key encryption disabled. Set a 32-byte base64 key in env.');
}

function _getKey() {
  if (!K) throw new Error('KEY_ENCRYPTION_KEY not configured');
  return Buffer.from(K, 'base64');
}

function encrypt(text) {
  if (!K) return text; // fallback: no encryption
  const iv = crypto.randomBytes(12);
  const key = _getKey();
  const cipher = crypto.createCipheriv(ALGO, key, iv, { authTagLength: 16 });
  const enc = Buffer.concat([cipher.update(Buffer.from(text, 'utf8')), cipher.final()]);
  const tag = cipher.getAuthTag();
  // store iv + tag + ciphertext as base64 joined string
  return Buffer.concat([iv, tag, enc]).toString('base64');
}

function decrypt(base64) {
  if (!K) return base64; // fallback
  const data = Buffer.from(base64, 'base64');
  const iv = data.slice(0, 12);
  const tag = data.slice(12, 28);
  const ciphertext = data.slice(28);
  const key = _getKey();
  const decipher = crypto.createDecipheriv(ALGO, key, iv, { authTagLength: 16 });
  decipher.setAuthTag(tag);
  const dec = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return dec.toString('utf8');
}

module.exports = { encrypt, decrypt };
