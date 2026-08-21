#!/usr/bin/env node
/**
 * Switch VSign between UAT and Live without code changes.
 *
 * Usage:
 *   node scripts/switch-vsign-env.js uat
 *   node scripts/switch-vsign-env.js live
 *   node scripts/switch-vsign-env.js uat "https://xxx.trycloudflare.com"
 *   node scripts/switch-vsign-env.js status
 */
const { switchProfile, status } = require('./vsign-profile-lib');

async function main() {
  const arg = (process.argv[2] || '').trim().toLowerCase();
  const tunnel = (process.argv[3] || '').trim();

  if (!arg || arg === 'status' || arg === '--status') {
    console.log(JSON.stringify(status(), null, 2));
    return;
  }

  const result = await switchProfile(arg, tunnel);
  console.log(JSON.stringify(result, null, 2));
  if (result.readinessIssues?.length) {
    console.error('\nWarnings:', result.readinessIssues.join('; '));
    process.exitCode = 2;
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
