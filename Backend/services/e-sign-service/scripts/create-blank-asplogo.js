/** Create 1x1 transparent PNG used to suppress VSign green caption overlay. */
const fs = require('fs');
const path = require('path');

const utility = path.join(__dirname, '..', 'utility');
const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);
fs.mkdirSync(utility, { recursive: true });
fs.writeFileSync(path.join(utility, 'blank-asplogo.png'), png);
const legacyLogo = path.join(utility, 'asplogo.png');
if (fs.existsSync(legacyLogo)) {
  try { fs.unlinkSync(legacyLogo); } catch (_) { /* ignore */ }
}
const legacy = path.join(utility, 'vsign_logo1.png');
if (fs.existsSync(legacy)) {
  fs.renameSync(legacy, path.join(utility, 'vsign_logo1.png.disabled'));
}
console.log('blank-asplogo.png ready');
