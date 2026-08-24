/** One-off: persist live PFX creds from .env into Mongo VSignConfig. */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const VSignConfig = require('../models/VSignConfig');

async function main() {
  const pfxPassword = (process.env.PFX_PASSWORD || '').trim();
  const pfxAlias = (process.env.PFX_ALIAS || '').trim().replace(/^"|"$/g, '');
  if (!pfxPassword || !pfxAlias) {
    console.error('PFX_PASSWORD and PFX_ALIAS required in .env');
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
  await VSignConfig.updateOne(
    { key: 'default' },
    {
      $set: {
        pfxPassword,
        pfxAlias,
        aspId: 'IIPL001',
        vsignEnv: 'production',
        certMode: 'live',
        enabled: true,
      },
    },
  );
  console.log('Mongo VSignConfig updated for live (IIPL001)');
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
