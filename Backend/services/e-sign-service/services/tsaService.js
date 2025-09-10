// services/tsaService.js
const forge = require('node-forge');
const { DigitalSignature } = require('../models/DigitalSignature');
const { AuditTrail } = require('../models/AuditTrail');
const { Certificate } = require('../models/Certificate');
const crypto = require('crypto');

/**
 * Simple mock TSA implementation:
 * - Creates a JSON { pdfHash, time, nonce } and signs it with the server key (or configured key).
 * - Stores the signed token (base64) in DigitalSignature.tsaToken and logs AuditTrail events.
 *
 * NOTE: This is *not* RFC-3161. Replace with a real TSA client in production.
 */

const SERVER_TSA_KEY_PEM = process.env.TSA_PRIVATE_KEY_PEM || null; // OPTIONAL: provide a PEM key in env
const SERVER_TSA_CERT_PEM = process.env.TSA_CERT_PEM || null;

function _getServerKeyPair() {
  // If env key exists use it, otherwise generate an ephemeral keypair (dev only)
  if (SERVER_TSA_KEY_PEM && SERVER_TSA_CERT_PEM) {
    const privateKey = forge.pki.privateKeyFromPem(SERVER_TSA_KEY_PEM);
    const cert = forge.pki.certificateFromPem(SERVER_TSA_CERT_PEM);
    return { privateKey, cert };
  }
  // Generate ephemeral (dev only)
  const keys = forge.pki.rsa.generateKeyPair(2048);
  const cert = forge.pki.createCertificate();
  cert.publicKey = keys.publicKey;
  cert.serialNumber = (new Date()).getTime().toString();
  cert.validity.notBefore = new Date();
  cert.validity.notAfter = new Date();
  cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);
  const attrs = [{ name: 'commonName', value: 'Mock TSA' }];
  cert.setSubject(attrs);
  cert.setIssuer(attrs);
  cert.sign(keys.privateKey, forge.md.sha256.create());
  return { privateKey: keys.privateKey, cert };
}

/**
 * requestTimestamp - creates + signs a timestamp token for a PDF hash or digitalSignature record
 * @param {Object} opts
 *   - digitalSignatureId  (preferred) OR
 *   - pdfHash + envelopeId + recipientId
 */
async function requestTimestamp(opts = {}) {
  // Determine pdfHash and related IDs
  let pdfHash = null;
  let envelopeId = null;
  let recipientId = null;
  let digitalSignatureId = null;

  if (opts.digitalSignatureId) {
    digitalSignatureId = opts.digitalSignatureId;
    const ds = await DigitalSignature.findById(digitalSignatureId);
    if (!ds) throw new Error('DigitalSignature not found');
    pdfHash = ds.pdfHash;
    envelopeId = ds.envelopeId;
    recipientId = ds.recipientId;
  } else if (opts.pdfHash && opts.envelopeId && opts.recipientId) {
    pdfHash = opts.pdfHash;
    envelopeId = opts.envelopeId;
    recipientId = opts.recipientId;
  } else {
    throw new Error('Provide digitalSignatureId or (pdfHash + envelopeId + recipientId)');
  }

  // Build timestamp payload
  const timestampObj = {
    pdfHash,
    time: new Date().toISOString(),
    nonce: crypto.randomBytes(8).toString('hex'),
  };
  const payloadJson = JSON.stringify(timestampObj);

  // Sign payload with server key (mock TSA)
  const { privateKey, cert } = _getServerKeyPair();
  const md = forge.md.sha256.create();
  md.update(payloadJson, 'utf8');
  const signatureBytes = privateKey.sign(md);
  const signatureB64 = forge.util.encode64(signatureBytes);
  const token = {
    payload: Buffer.from(payloadJson).toString('base64'),
    signature: signatureB64,
    tsaCertPem: forge.pki.certificateToPem(cert),
  };
  const tokenBlob = Buffer.from(JSON.stringify(token)).toString('base64');

  // Persist token to DigitalSignature.tsaToken (if digitalSignatureId present)
  if (digitalSignatureId) {
    await DigitalSignature.findByIdAndUpdate(digitalSignatureId, { tsaToken: tokenBlob });
  } else {
    // optionally create a new DigitalSignature record linking to envelope/recipient if needed
    // not created here — caller can update their record
  }

  // Audit logs
  await AuditTrail.create({
    envelopeId,
    recipientId,
    action: 'TSA_TOKEN_ISSUED',
    details: { pdfHash, tokenId: crypto.createHash('sha256').update(tokenBlob).digest('hex') },
  });

  return { token: tokenBlob, tokenJson: token };
}

/**
 * verifyTimestamp - verifies the mock TSA token and returns payload
 * @param {String} tokenBlobBase64
 */
function verifyTimestamp(tokenBlobBase64) {
  const decoded = Buffer.from(tokenBlobBase64, 'base64').toString('utf8');
  let token;
  try {
    token = JSON.parse(decoded);
  } catch (err) {
    throw new Error('Invalid token format');
  }

  const payloadJson = Buffer.from(token.payload, 'base64').toString('utf8');
  const signatureB64 = token.signature;
  const tsaCertPem = token.tsaCertPem;

  const cert = forge.pki.certificateFromPem(tsaCertPem);
  const publicKey = cert.publicKey;
  const md = forge.md.sha256.create();
  md.update(payloadJson, 'utf8');
  const signatureBytes = forge.util.decode64(signatureB64);
  const verified = publicKey.verify(md.digest().bytes(), signatureBytes);
  if (!verified) throw new Error('TSA token verification failed');

  const payload = JSON.parse(payloadJson);
  return payload;
}

module.exports = { requestTimestamp, verifyTimestamp };
