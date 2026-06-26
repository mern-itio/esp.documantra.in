/**
 * Start core backend services on Windows without Docker/concurrently.
 * Usage: node scripts/start-local-core.js
 */
const { spawn } = require('child_process');
const path = require('path');

const root = path.join(__dirname, '..');

const services = [
  { name: 'auth', cwd: 'services/auth-service', entry: 'index.js', port: 2101 },
  { name: 'admin', cwd: 'services/admin-service', entry: 'index.js', port: 3100 },
  { name: 'subscription', cwd: 'services/subscription-service', entry: 'index.js', port: 2110 },
  { name: 'support', cwd: 'services/support-service', entry: 'index.js', port: 2107 },
  { name: 'organization', cwd: 'services/organization-service', entry: 'index.js', port: 2111 },
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
