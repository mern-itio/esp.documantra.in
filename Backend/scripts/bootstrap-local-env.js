/**
 * Copy Backend/.env into each microservice folder for local non-Docker dev.
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const source = path.join(root, '.env');
const example = path.join(root, '.env.example');

if (!fs.existsSync(source)) {
  if (fs.existsSync(example)) {
    fs.copyFileSync(example, source);
    console.log('Created Backend/.env from .env.example');
  } else {
    console.error('Missing Backend/.env — copy .env.example to .env first.');
    process.exit(1);
  }
}

const envContent = fs.readFileSync(source, 'utf8');

const serviceDirs = [
  'services/auth-service',
  'services/document-service',
  'services/e-sign-service',
  'services/pdf-service',
  'services/api-service',
  'services/template-service',
  'services/support-service',
  'services/ai-assistant-service',
  'services/subscription-service',
  'services/organization-service',
  'services/email-service',
  'services/api-gateway',
  'services/identity-service',
  'services/admin-service',
];

for (const dir of serviceDirs) {
  const target = path.join(root, dir, '.env');
  fs.writeFileSync(target, envContent);
  console.log('Wrote', target);
}

console.log('Local .env bootstrap complete.');
