/**
 * Set production VSign auth page per VSign kit: https://esign.verasys.in/esp/authpage
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const VSignConfig = require('../models/VSignConfig');

const AUTH_PAGE = 'https://esign.verasys.in/esp/authpage';
const envPath = path.join(__dirname, '..', '.env');

async function main() {
  let envText = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
  if (/^VSIGN_AUTHPAGE=/m.test(envText)) {
    envText = envText.replace(/^VSIGN_AUTHPAGE=.*$/m, `VSIGN_AUTHPAGE=${AUTH_PAGE}`);
  } else {
    envText = `${envText.trim()}\nVSIGN_AUTHPAGE=${AUTH_PAGE}\n`;
  }
  fs.writeFileSync(envPath, envText);
  console.log('Updated .env VSIGN_AUTHPAGE');

  await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
  const doc = await VSignConfig.findOneAndUpdate(
    { key: 'default' },
    { $set: { vsignAuthPage: AUTH_PAGE, aspId: process.env.ASP_ID || 'IIPL001' } },
    { new: true, upsert: true },
  );
  console.log('Updated Mongo vsignAuthPage:', doc.vsignAuthPage, 'aspId:', doc.aspId);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
