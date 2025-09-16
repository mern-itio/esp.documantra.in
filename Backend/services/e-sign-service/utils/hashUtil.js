const fs = require('fs');
const crypto = require('crypto');

/**
 * Hash a Buffer (SHA-256) and return hex string.
 * @param {Buffer} buf
 * @returns {string} hex hash
 */
function hashBuffer(buf) {
  if (!Buffer.isBuffer(buf)) {c
    throw new TypeError('hashBuffer expects a Buffer');
  }
  const h = crypto.createHash('sha256');
  h.update(buf);
  return h.digest('hex');
}

/**
 * Hash a file on disk (SHA-256) and return Promise<string> hex hash.
 * @param {string} filePath
 * @returns {Promise<string>}
 */
function hashFile(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    stream.on('error', reject);
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
  });
}

module.exports = { hashBuffer, hashFile };
