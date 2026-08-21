/**
 * Update VSIGN_CALLBACK_URL in .env and MongoDB VSignConfig (key: default).
 * Usage: node scripts/update-vsign-callback-url.js "https://xxx.trycloudflare.com"
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const VSignConfig = require('../models/VSignConfig');

const tunnelBase = (process.argv[2] || '').replace(/\/+$/, '');
if (!tunnelBase.startsWith('https://')) {
  console.error('Usage: node scripts/update-vsign-callback-url.js "https://xxx.trycloudflare.com"');
  process.exit(1);
}

const callbackUrl = `${tunnelBase}/api/e-sign/public/v-sign/response`;
const envPath = path.join(__dirname, '..', '.env');

async function main() {
  let envText = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
  if (/^VSIGN_CALLBACK_URL=/m.test(envText)) {
    envText = envText.replace(/^VSIGN_CALLBACK_URL=.*$/m, `VSIGN_CALLBACK_URL=${callbackUrl}`);
  } else {
    envText = `${envText.trim()}\nVSIGN_CALLBACK_URL=${callbackUrl}\n`;
  }
  fs.writeFileSync(envPath, envText);
  console.log('Updated .env VSIGN_CALLBACK_URL');

  await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
  const doc = await VSignConfig.findOneAndUpdate(
    { key: 'default' },
    { $set: { vsignCallbackUrl: callbackUrl } },
    { new: true, upsert: true },
  );
  console.log('Updated Mongo VSignConfig.vsignCallbackUrl:', doc.vsignCallbackUrl);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
