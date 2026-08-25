/** Persist live PFX creds + production callback into Mongo VSignConfig.
 * Reads config/vsign/secrets/live.env (preferred) or process env — never commit secrets.
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const VSignConfig = require('../models/VSignConfig');

const PRODUCTION_CALLBACK =
  'https://esp.documantra.in/esign/api/e-sign/public/v-sign/response';

function loadLiveSecrets() {
  const secretsPath = path.join(__dirname, '..', 'config', 'vsign', 'secrets', 'live.env');
  if (!fs.existsSync(secretsPath)) return {};
  try {
    return dotenv.parse(fs.readFileSync(secretsPath));
  } catch {
    return {};
  }
}

async function main() {
  const liveSecrets = loadLiveSecrets();
  const pfxPassword = (liveSecrets.PFX_PASSWORD || process.env.PFX_PASSWORD || '').trim();
  const pfxAlias = (liveSecrets.PFX_ALIAS || process.env.PFX_ALIAS || '')
    .trim()
    .replace(/^"|"$/g, '');

  if (!pfxPassword || !pfxAlias) {
    console.error(
      'PFX_PASSWORD and PFX_ALIAS required in config/vsign/secrets/live.env or .env',
    );
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
  await VSignConfig.updateOne(
    { key: 'default' },
    {
      $set: {
        pfxPassword,
        pfxAlias,
        aspId: process.env.ASP_ID || 'IIPL001',
        vsignEnv: 'production',
        certMode: 'live',
        vsignCallbackUrl: PRODUCTION_CALLBACK,
        vsignAuthPage: process.env.VSIGN_AUTHPAGE || 'https://esign.verasys.in/esp',
        vsignEspResponseUrl:
          process.env.VSIGN_ESP_RESPONSE_URL || 'https://esign.verasys.in/esign/2.1/signature',
        enabled: true,
      },
    },
    { upsert: true },
  );
  console.log('Mongo VSignConfig updated for live:', {
    aspId: process.env.ASP_ID || 'IIPL001',
    certMode: 'live',
    pfxAlias,
    callback: PRODUCTION_CALLBACK,
  });
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
