const forge = require("node-forge");
const { Certificate } = require("../models/Certificate");
const { AuditTrail } = require("../models/AuditTrail");
const { encrypt } = require('../utils/keyEncryption');
// Generate keypair + self-signed certificate for recipient
const issueCertificate = async (recipientId, envelopeId) => {
  // 1. Generate RSA keypair (2048 bits is standard, 4096 if you want stronger)
  const keys = forge.pki.rsa.generateKeyPair(2048);

  // 2. Create certificate
  const cert = forge.pki.createCertificate();
  cert.publicKey = keys.publicKey;
  cert.serialNumber = new Date().getTime().toString();
  cert.validity.notBefore = new Date();
  cert.validity.notAfter = new Date();
  cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1); // 1 year validity

  // Issuer & Subject (can customize later)
  const attrs = [
    { name: "commonName", value: "Digital Signature Recipient" },
    { name: "organizationName", value: "DraftnSign" },
    { name: "countryName", value: "IN" }
  ];
  cert.setSubject(attrs);
  cert.setIssuer(attrs);

  // Self-sign certificate
  cert.sign(keys.privateKey, forge.md.sha256.create());

  // Convert keys + cert to PEM strings
  const publicKeyPem = forge.pki.publicKeyToPem(keys.publicKey);
  const privateKeyPem = forge.pki.privateKeyToPem(keys.privateKey);
  const certPem = forge.pki.certificateToPem(cert);

  // 3. Save in DB
  const certificate = await Certificate.create({
    recipientId,
    envelopeId,
    publicKey: publicKeyPem,
    privateKey: encrypt(privateKeyPem), // Encrypted
    certPem:certPem,
    certSerial: cert.serialNumber,
    issuer: "YourCompany",
    issuedAt: new Date(),
    validTill: cert.validity.notAfter
  });

  // 4. Add audit trail
  await AuditTrail.create({
    envelopeId,
    recipientId,
    action: "CERT_ISSUED",
    details: { certSerial: cert.serialNumber }
  });

  return {
    certificateId: certificate._id,
    publicKey: publicKeyPem,
    certPem
  };
};

module.exports = { issueCertificate };
