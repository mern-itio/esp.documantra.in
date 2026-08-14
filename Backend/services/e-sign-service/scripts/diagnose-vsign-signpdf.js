/**
 * Test signpdf for a txn folder (diagnostic).
 * Usage: node scripts/diagnose-vsign-signpdf.js 1786597560031
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const axios = require('axios');
const path = require('path');
const { normalizeVSignPath, resolveGreenCheckImagePath, resolveAspLogoPath, resolveVSignServerIp } = require('../utils/vsignAssets');

const serviceRoot = path.join(__dirname, '..');
const txn = process.argv[2] || '1786597560031';
const baseDir = path.join(serviceRoot, 'uploads');

async function main() {
  const payload = {
    tempInfoPath: normalizeVSignPath(path.join(baseDir, 'vSignTemp')),
    signedFileParentPath: normalizeVSignPath(path.join(baseDir, 'signed', '6a7d509a0db4099959b829a3')),
    responseXML: '',
    pdfDestinationPath: normalizeVSignPath(
      path.join(baseDir, 'signed', '6a7d509a0db4099959b829a3', `${Date.now()}-signed-test.pdf`),
    ),
    tickImgPath: resolveGreenCheckImagePath(serviceRoot),
    aspLogo: resolveAspLogoPath(serviceRoot),
    signatureFontSize: process.env.VSIGN_SIGNATURE_FONT_SIZE || '9',
    serverIp: resolveVSignServerIp(serviceRoot),
    serverIP: resolveVSignServerIp(serviceRoot),
    txn,
  };

  console.log('signpdf payload txn:', txn);
  const { data, status } = await axios.post(
    `${process.env.UTILITY_URL || 'http://127.0.0.1:7077'}/signpdfv4_1`,
    payload,
    { timeout: 120000, validateStatus: () => true },
  );
  console.log('HTTP', status);
  console.log('response:', JSON.stringify(data, null, 2));
}

main().catch((err) => {
  console.error('failed:', err.response?.data || err.message);
  process.exit(1);
});
