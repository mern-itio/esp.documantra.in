const axios = require('axios');
const config = require('./config');

function assertToken() {
  if (!config.bearerToken) {
    const err = new Error('SUREPASS_BEARER_TOKEN is not set in .env');
    err.code = 'SUREPASS_TOKEN_MISSING';
    throw err;
  }
}

function client() {
  assertToken();
  return axios.create({
    baseURL: config.baseUrl,
    timeout: 60000,
    headers: {
      Authorization: `Bearer ${config.bearerToken}`,
      'Content-Type': 'application/json',
    },
  });
}

function wrapError(err) {
  const data = err.response?.data;
  const message = data?.message
    || data?.error
    || (typeof data === 'string' ? data : null)
    || err.message;
  const wrapped = new Error(message);
  wrapped.status = err.response?.status || 500;
  wrapped.data = data;
  wrapped.code = err.code;
  return wrapped;
}

async function getStateList() {
  try {
    const res = await client().get('/api/v1/estamp/get-state-list');
    return res.data;
  } catch (err) {
    throw wrapError(err);
  }
}

async function listArticles(stateCode) {
  try {
    const res = await client().get('/api/v1/stamper-v2/list-articles', {
      params: { state: String(stateCode || '').trim().toUpperCase() },
    });
    return res.data;
  } catch (err) {
    throw wrapError(err);
  }
}

async function getEstampList(stateSlug) {
  try {
    const res = await client().post('/api/v1/estamp/get-estamp-list', {
      state: stateSlug,
    });
    return res.data;
  } catch (err) {
    throw wrapError(err);
  }
}

async function verifyCertificate({
  state,
  certificate_number,
  estamp_duty_type,
  certificate_issue_date,
}) {
  try {
    const res = await client().post('/api/v1/estamp/verification', {
      state,
      certificate_number,
      estamp_duty_type,
      certificate_issue_date,
    });
    return res.data;
  } catch (err) {
    throw wrapError(err);
  }
}

async function orderStamp({
  first_party,
  second_party,
  state,
  article_id,
  amount,
  consideration_amount,
  description,
}) {
  try {
    const res = await client().post('/api/v1/stamper-v2/order-stamp', {
      first_party,
      second_party,
      state,
      article_id: Number(article_id),
      amount: Number(amount),
      consideration_amount: Number(consideration_amount),
      description,
    });
    return res.data;
  } catch (err) {
    throw wrapError(err);
  }
}

async function getOrderStatus(clientId) {
  try {
    const res = await client().get('/api/v1/stamper-v2/order-status', {
      params: { client_id: clientId },
    });
    return res.data;
  } catch (err) {
    throw wrapError(err);
  }
}

async function getStats() {
  try {
    const res = await client().get('/api/v1/stamper-v2/stats');
    return res.data;
  } catch (err) {
    throw wrapError(err);
  }
}

module.exports = {
  getStateList,
  getEstampList,
  listArticles,
  verifyCertificate,
  orderStamp,
  getOrderStatus,
  getStats,
};
