const { SignedXml } = require('xml-crypto');
const fs = require('fs');
const path = require('path');

function signXML(xml) {
  try {
    const certPath = path.join(__dirname, '../upload/vSign/cert.pem');
    const keyPath  = path.join(__dirname, '../upload/vSign/private.pem');

    if (!fs.existsSync(certPath)) {
      throw new Error("cert.pem not found");
    }
    if (!fs.existsSync(keyPath)) {
      throw new Error("private.pem not found");
    }

    const privateKey = fs.readFileSync(keyPath, 'utf8');

    const cert = fs.readFileSync(certPath, 'utf8')
      .replace(/-----BEGIN CERTIFICATE-----/g, '')
      .replace(/-----END CERTIFICATE-----/g, '')
      .replace(/\r?\n|\r/g, '');

    const sig = new SignedXml();
    sig.signingKey = privateKey;

    sig.addReference(
      "//*[local-name(.)='Esign']",
      [
        "http://www.w3.org/2000/09/xmldsig#enveloped-signature",
        "http://www.w3.org/2001/10/xml-exc-c14n#"
      ],
      "http://www.w3.org/2001/04/xmlenc#sha256"
    );

    sig.signatureAlgorithm =
      "http://www.w3.org/2001/04/xmldsig-more#rsa-sha256";

    sig.keyInfoProvider = {
      getKeyInfo: () =>
        `<X509Data><X509Certificate>${cert}</X509Certificate></X509Data>`
    };

    sig.computeSignature(xml, {
      location: {
        reference: "//*[local-name(.)='Esign']",
        action: 'append'
      }
    });

    const signedXml = sig.getSignedXml();

    if (!signedXml.includes("<Signature")) {
      throw new Error("Signature not generated");
    }

    return signedXml;

  } catch (err) {
    console.error("SIGN XML ERROR:", err.message);
    throw err;
  }
}

module.exports = signXML;
