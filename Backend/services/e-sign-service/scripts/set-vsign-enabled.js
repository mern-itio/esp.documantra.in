/**
 * Toggle admin VSign / Aadhaar eSign master switch in MongoDB.
 *
 *   node scripts/set-vsign-enabled.js false
 *   node scripts/set-vsign-enabled.js true
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '..', '.env') });
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const VSignConfig = require('../models/VSignConfig');
const { refreshVSignConfigCache, getPublicVSignStatus } = require('../utils/vsignConfigPolicy');

async function main() {
  const raw = String(process.argv[2] || '').trim().toLowerCase();
  if (!['true', 'false', '1', '0', 'on', 'off'].includes(raw)) {
    console.error('Usage: node scripts/set-vsign-enabled.js <true|false>');
    process.exit(1);
  }
  const enabled = raw === 'true' || raw === '1' || raw === 'on';
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/draftnsign';
  await mongoose.connect(uri);
  const doc = await VSignConfig.findOneAndUpdate(
    { key: 'default' },
    { $set: { enabled } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  await refreshVSignConfigCache();
  const status = getPublicVSignStatus();
  console.log(JSON.stringify({
    savedEnabled: doc.enabled,
    publicStatus: status,
  }, null, 2));
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
