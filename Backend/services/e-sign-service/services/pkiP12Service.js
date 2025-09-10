// services/pkiP12Service.js
const forge = require("node-forge");
const { Certificate } = require("../models/Certificate");

async function createP12Buffer(certificateId) {
  const certDoc = await Certificate.findById(certificateId);
  if (!certDoc) throw new Error("Certificate not found");

  // We assume certDoc has { certPem, publicKey, privateKey }
  const privateKeyPem = certDoc.privateKey;
  const certPem = certDoc.certPem;
  const password = "changeit"; // ⚠️ Replace with secure generation or KMS
 console.log("PrivateKey snippet:", privateKeyPem?.substring(0, 50));
 console.log("CertPem snippet:", certPem?.substring(0, 50));

  const pki = forge.pki;
  const privateKey = pki.privateKeyFromPem(privateKeyPem);
  const cert = pki.certificateFromPem(certPem);

  // create PKCS#12 keystore
  const newPkcs12Asn1 = forge.pkcs12.toPkcs12Asn1(
    privateKey,
    [cert],
    password,
    { algorithm: "3des" }
  );

  // Convert to DER, then to Node Buffer
  const p12Der = forge.asn1.toDer(newPkcs12Asn1).getBytes();
  const p12Buffer = Buffer.from(p12Der, "binary");

  return { p12Buffer, password };
}

module.exports = { createP12Buffer };
