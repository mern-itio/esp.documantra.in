/**
 * One-off Stamper V2 smoke test. Usage:
 *   node scripts/test-stamper-v2.js
 *   node scripts/test-stamper-v2.js --base https://kyc-api.surepass.app
 *   node scripts/test-stamper-v2.js --status stamp_v2_xxxxx
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const axios = require('axios');

const args = process.argv.slice(2);
const baseArg = args.find((a) => a.startsWith('--base='))?.split('=')[1];
const statusArg = args.find((a) => a.startsWith('--status='))?.split('=')[1];
const base = (baseArg || process.env.SUREPASS_API_BASE_URL || 'https://sandbox.surepass.app').replace(/\/+$/, '');
const token = process.env.SUREPASS_BEARER_TOKEN;

if (!token) {
  console.error('Set SUREPASS_BEARER_TOKEN in .env');
  process.exit(1);
}

const orderBody = {
  first_party: 'ABC Pvt Ltd',
  second_party: 'Borrower',
  state: 'DL',
  article_id: 2716,
  amount: 40,
  consideration_amount: 1,
  description: 'Estamp',
};

async function request(method, path, { params, body } = {}) {
  try {
    const res = await axios({
      method,
      url: `${base}${path}`,
      params,
      data: body,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      timeout: 60000,
    });
    return { ok: true, status: res.status, data: res.data };
  } catch (err) {
    return {
      ok: false,
      status: err.response?.status,
      data: err.response?.data,
      message: err.message,
    };
  }
}

(async () => {
  console.log(`Base: ${base}`);
  console.log(`Token email hint: ${JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString()).email || 'n/a'}`);

  if (statusArg) {
    console.log('\n=== order-status (provided client_id) ===');
    console.log(JSON.stringify(await request('GET', '/api/v1/stamper-v2/order-status', {
      params: { client_id: statusArg },
    }), null, 2));
    return;
  }

  console.log('\n=== order-stamp ===');
  const order = await request('POST', '/api/v1/stamper-v2/order-stamp', { body: orderBody });
  console.log(JSON.stringify(order, null, 2));

  const clientId = order.data?.data?.client_id || order.data?.client_id;
  if (clientId) {
    console.log('\n=== order-status (from new order) ===');
    console.log(JSON.stringify(await request('GET', '/api/v1/stamper-v2/order-status', {
      params: { client_id: clientId },
    }), null, 2));
  }

  console.log('\n=== order-status (doc example — usually invalid) ===');
  console.log(JSON.stringify(await request('GET', '/api/v1/stamper-v2/order-status', {
    params: { client_id: 'stamp_v2_oeieAotinqqKvkaPXjrM' },
  }), null, 2));
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
