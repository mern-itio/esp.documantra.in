/**
 * Probe Stamper V2 / article discovery endpoints (sandbox).
 * Usage: node scripts/discover-stamper-endpoints.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const axios = require('axios');

const base = (process.env.SUREPASS_API_BASE_URL || 'https://sandbox.surepass.app').replace(/\/+$/, '');
const token = process.env.SUREPASS_BEARER_TOKEN;
if (!token) {
  console.error('Set SUREPASS_BEARER_TOKEN in .env');
  process.exit(1);
}

const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

async function probe(label, method, path, body) {
  try {
    const res = await axios({ method, url: `${base}${path}`, data: body, headers, timeout: 30000, validateStatus: () => true });
    const preview = JSON.stringify(res.data).slice(0, 400);
    console.log(`\n[${res.status}] ${label}\n  ${method} ${path}\n  ${preview}${preview.length >= 400 ? '…' : ''}`);
    return res;
  } catch (e) {
    console.log(`\n[ERR] ${label}: ${e.message}`);
    return null;
  }
}

(async () => {
  console.log(`Base: ${base}`);

  const getPaths = [
    '/api/v1/stamper-v2/state-list',
    '/api/v1/stamper-v2/get-state-list',
    '/api/v1/stamper-v2/article-list?state=DL',
    '/api/v1/stamper-v2/articles?state=DL',
    '/api/v1/stamper-v2/get-article-list?state=DL',
    '/api/v1/stamper-v2/get-articles?state=DL',
    '/api/v1/stamper-v2/article-list?state_code=DL',
  ];

  for (const p of getPaths) await probe(`GET ${p}`, 'GET', p);

  const postBodies = [
    { path: '/api/v1/stamper-v2/article-list', body: { state: 'DL' } },
    { path: '/api/v1/stamper-v2/article-list', body: { state_code: 'DL' } },
    { path: '/api/v1/stamper-v2/get-article-list', body: { state: 'DL' } },
    { path: '/api/v1/stamper-v2/get-articles', body: { state: 'DL' } },
    { path: '/api/v1/stamper-v2/articles', body: { state: 'DL' } },
    { path: '/api/v1/estamp/get-estamp-list', body: { state: 'national_capital_territory_of_delhi' } },
  ];

  for (const { path, body } of postBodies) {
    await probe(`POST ${path} ${JSON.stringify(body)}`, 'POST', path, body);
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
