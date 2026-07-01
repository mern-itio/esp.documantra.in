const crypto = require('crypto');

const OAEP = {
  padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
  oaepHash: 'sha256',
};

let keyPair = null;

const loadKeyPair = () => {
  if (keyPair) return keyPair;

  const privatePem = String(process.env.LOGIN_RSA_PRIVATE_KEY_PEM || '').trim();
  if (privatePem) {
    const privateKey = crypto.createPrivateKey(privatePem);
    const publicKey = crypto.createPublicKey(privateKey);
    keyPair = { privateKey, publicKey };
    return keyPair;
  }

  const generated = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });
  keyPair = {
    privateKey: crypto.createPrivateKey(generated.privateKey),
    publicKey: crypto.createPublicKey(generated.publicKey),
  };
  console.warn(
    '[loginPayloadCrypto] LOGIN_RSA_PRIVATE_KEY_PEM not set — using ephemeral RSA key (restarts invalidate clients until public key refresh).'
  );
  return keyPair;
};

const getLoginPublicKeyPem = () => {
  const { publicKey } = loadKeyPair();
  return publicKey.export({ type: 'spki', format: 'pem' });
};

const isEncryptedLoginBody = (body) =>
  body
  && body.v === 1
  && typeof body.key === 'string'
  && typeof body.iv === 'string'
  && typeof body.data === 'string'
  && typeof body.tag === 'string';

const decryptLoginBody = (body) => {
  if (!isEncryptedLoginBody(body)) {
    return null;
  }

  const { privateKey } = loadKeyPair();
  const aesKey = crypto.privateDecrypt(
    { key: privateKey, ...OAEP },
    Buffer.from(body.key, 'base64')
  );

  const decipher = crypto.createDecipheriv('aes-256-gcm', aesKey, Buffer.from(body.iv, 'base64'));
  decipher.setAuthTag(Buffer.from(body.tag, 'base64'));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(body.data, 'base64')),
    decipher.final(),
  ]);

  const parsed = JSON.parse(plaintext.toString('utf8'));
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Decrypted login payload must be a JSON object');
  }
  return parsed;
};

const encryptLoginBodyWithPublicKey = (payload, publicKeyPem) => {
  const publicKey = crypto.createPublicKey(publicKeyPem);
  const aesKey = crypto.randomBytes(32);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', aesKey, iv);
  const data = Buffer.concat([
    cipher.update(JSON.stringify(payload), 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  const encryptedKey = crypto.publicEncrypt(
    { key: publicKey, ...OAEP },
    aesKey
  );

  return {
    v: 1,
    enc: 'aes-256-gcm',
    key: encryptedKey.toString('base64'),
    iv: iv.toString('base64'),
    data: data.toString('base64'),
    tag: tag.toString('base64'),
  };
};

const encryptLoginBodyForTest = (payload) => encryptLoginBodyWithPublicKey(payload, getLoginPublicKeyPem());

const isEncryptedLoginRequired = () => {
  if (process.env.ALLOW_PLAIN_LOGIN === 'true') return false;
  if (process.env.REQUIRE_ENCRYPTED_LOGIN === 'true') return true;
  return process.env.NODE_ENV === 'production';
};

module.exports = {
  decryptLoginBody,
  encryptLoginBodyForTest,
  encryptLoginBodyWithPublicKey,
  getLoginPublicKeyPem,
  isEncryptedLoginBody,
  isEncryptedLoginRequired,
};
