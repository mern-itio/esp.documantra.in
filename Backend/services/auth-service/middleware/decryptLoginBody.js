const {
  decryptLoginBody,
  isEncryptedLoginBody,
  isEncryptedLoginRequired,
} = require('../utils/loginPayloadCrypto');

/**
 * Decrypt RSA+AES login payloads (VAPT — credentials not visible as plaintext in proxy tools).
 */
const decryptLoginBodyMiddleware = (req, res, next) => {
  const body = req.body;

  if (isEncryptedLoginBody(body)) {
    try {
      req.body = decryptLoginBody(body);
      return next();
    } catch (err) {
      console.error('Failed to decrypt login payload:', err.message);
      return res.status(400).json({ message: 'Invalid encrypted login payload' });
    }
  }

  if (isEncryptedLoginRequired()) {
    return res.status(400).json({
      message: 'Encrypted login payload required. Fetch GET /login/public-key first.',
      code: 'ENCRYPTED_LOGIN_REQUIRED',
    });
  }

  return next();
};

module.exports = { decryptLoginBodyMiddleware };
