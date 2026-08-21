/** Switch utility/application.properties between UAT and production ESP URLs. */
const fs = require('fs');
const path = require('path');

const PROPS_PATH = path.join(__dirname, '..', 'utility', 'application.properties');

const UAT_BLOCK = `server.port=7078

# UAT ESP URLs (esignuat.vsign.in)
esp21.url.value=https://esignuat.vsign.in/asp/esign/2.1/signature
esp32.url.value=https://esignuat.vsign.in/asp/esign/3.2/signature

# Production (Verasys) — disabled in UAT mode
#esp21.url.value=https://esign.verasys.in/esign/2.1/signature
#esp32.url.value=https://esign.verasys.in/esign/3.2/signature

logging.pattern.console=%c:%L - %d{yyyy-MM-dd HH:mm:ss,SSS} - %p - %m%n
logging.file.name=esignutility.log
logging.level.root=info
app.data.respsigtype=PKCS7complete
`;

const LIVE_BLOCK = `server.port=7078

# Production ESP URLs (Verasys / VSign IIPL001)
esp21.url.value=https://esign.verasys.in/esign/2.1/signature
esp32.url.value=https://esign.verasys.in/esign/3.2/signature

# UAT — disabled in production mode
#esp21.url.value=https://esignuat.vsign.in/asp/esign/2.1/signature
#esp32.url.value=https://esignuat.vsign.in/asp/esign/3.2/signature

logging.pattern.console=%c:%L - %d{yyyy-MM-dd HH:mm:ss,SSS} - %p - %m%n
logging.file.name=esignutility.log
logging.level.root=info
app.data.respsigtype=PKCS7complete
`;

function patchUtilityEspUrls(mode = 'uat') {
  const text = mode === 'production' ? LIVE_BLOCK : UAT_BLOCK;
  fs.writeFileSync(PROPS_PATH, text);
  return PROPS_PATH;
}

module.exports = { patchUtilityEspUrls, PROPS_PATH };
