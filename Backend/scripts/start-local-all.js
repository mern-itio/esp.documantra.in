/**
 * Start ALL backend microservices for local dev (no Docker).
 * Usage: npm run dev:all
 */
const { spawn } = require('child_process');
const path = require('path');

const root = path.join(__dirname, '..');

const services = [
  { name: 'auth', cwd: 'services/auth-service', entry: 'index.js', port: 2101 },
  { name: 'document', cwd: 'services/document-service', entry: 'index.js', port: 2102 },
  { name: 'esign', cwd: 'services/e-sign-service', entry: 'index.js', port: 2103 },
  { name: 'pdf', cwd: 'services/pdf-service', entry: 'index.js', port: 2104 },
  { name: 'api', cwd: 'services/api-service', entry: 'index.js', port: 2105 },
  { name: 'template', cwd: 'services/template-service', entry: 'index.js', port: 2106 },
  { name: 'support', cwd: 'services/support-service', entry: 'index.js', port: 2107 },
  { name: 'ai', cwd: 'services/ai-assistant-service', entry: 'index.js', port: 2108 },
  { name: 'subscription', cwd: 'services/subscription-service', entry: 'index.js', port: 2110 },
  { name: 'organization', cwd: 'services/organization-service', entry: 'index.js', port: 2111 },
  { name: 'email', cwd: 'services/email-service', entry: 'index.js', port: 2112 },
  { name: 'gateway', cwd: 'services/api-gateway', entry: 'index.js', port: 2113 },
  { name: 'identity', cwd: 'services/identity-service', entry: 'index.js', port: 2114 },
  { name: 'admin', cwd: 'services/admin-service', entry: 'index.js', port: 3100 },
];

require('./bootstrap-local-env.js');

const children = [];

for (const svc of services) {
  const cwd = path.join(root, svc.cwd);
  const child = spawn(process.execPath, [svc.entry], {
    cwd,
    stdio: 'inherit',
    env: process.env,
  });
  child.on('exit', (code) => {
    console.error(`[${svc.name}] exited with code ${code}`);
  });
  children.push(child);
  console.log(`[${svc.name}] starting on port ${svc.port}`);
}

process.on('SIGINT', () => {
  children.forEach((c) => c.kill());
  process.exit(0);
});
