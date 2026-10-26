const { serviceGet, servicePost, servicePatch } = require('../utils/apiHelper');

function pickApiKey(req) {
  return (
    req.headers['x-didit-api-key'] ||
    req.query.apiKey ||
    req.body?.apiKey ||
    ''
  );
}

function withApiKeyHeaders(req, extra = {}) {
  const apiKey = pickApiKey(req);
  const headers = { ...extra };
  if (apiKey) headers['x-didit-api-key'] = apiKey;
  return headers;
}

function forwardResult(res, result, successMessage) {
  if (result.ok || (result.status >= 200 && result.status < 300)) {
    return res.status(result.status || 200).json({
      status: result.status || 200,
      message: successMessage,
      data: result.data?.data !== undefined ? result.data.data : result.data,
      success: result.data?.success !== false,
    });
  }

  // Didit API key / permission errors must not look like admin JWT 401/403
  // (admin frontend clears session on those statuses).
  let status = result.status || 500;
  let message = result.data?.message || result.message || 'Didit proxy request failed';
  const detailBlob = JSON.stringify(result.data || {});
  if (status === 401 || status === 403) {
    status = 502;
    message =
      'Didit API key missing or invalid. Paste your key in “Optional Didit API key override”, or set DIDIT_API_KEY on identity-service and restart it.';
  } else if (/<!doctype html>/i.test(String(message)) || /<!doctype html>/i.test(detailBlob) || /Server Error \(500\)/i.test(detailBlob)) {
    status = 502;
    message =
      'Didit is temporarily failing workflow create (upstream 500). Use an existing workflow from the list, or create it in the Didit console and click Refresh.';
  }

  return res.status(status).json({
    status,
    message,
    data: /<!doctype html>/i.test(detailBlob) ? null : result.data || null,
    success: false,
  });
}

const listWorkflows = async (req, res) => {
  try {
    const qs = new URLSearchParams();
    if (req.query.limit) qs.set('limit', String(req.query.limit));
    if (req.query.offset) qs.set('offset', String(req.query.offset));
    const q = qs.toString();
    const result = await serviceGet(req, 'identity', {
      url: `/api/identity/workflows${q ? `?${q}` : ''}`,
      headers: withApiKeyHeaders(req),
    });
    return forwardResult(res, result, 'Workflows fetched');
  } catch (error) {
    console.error('listWorkflows proxy error:', error);
    return res.status(500).json({ status: 500, message: 'Internal Server Error', data: null });
  }
};

const getWorkflow = async (req, res) => {
  try {
    const result = await serviceGet(req, 'identity', {
      url: `/api/identity/workflows/${encodeURIComponent(req.params.id)}`,
      headers: withApiKeyHeaders(req),
    });
    return forwardResult(res, result, 'Workflow fetched');
  } catch (error) {
    console.error('getWorkflow proxy error:', error);
    return res.status(500).json({ status: 500, message: 'Internal Server Error', data: null });
  }
};

const createWorkflow = async (req, res) => {
  try {
    const { apiKey, ...body } = req.body || {};
    const result = await servicePost(req, 'identity', {
      url: '/api/identity/workflows',
      data: body,
      headers: withApiKeyHeaders(req, apiKey ? { 'x-didit-api-key': apiKey } : {}),
    });
    return forwardResult(res, result, 'Workflow created');
  } catch (error) {
    console.error('createWorkflow proxy error:', error);
    return res.status(500).json({ status: 500, message: 'Internal Server Error', data: null });
  }
};

const updateWorkflow = async (req, res) => {
  try {
    const { apiKey, ...body } = req.body || {};
    const result = await servicePatch(req, 'identity', {
      url: `/api/identity/workflows/${encodeURIComponent(req.params.id)}`,
      data: body,
      headers: withApiKeyHeaders(req, apiKey ? { 'x-didit-api-key': apiKey } : {}),
    });
    return forwardResult(res, result, 'Workflow updated');
  } catch (error) {
    console.error('updateWorkflow proxy error:', error);
    return res.status(500).json({ status: 500, message: 'Internal Server Error', data: null });
  }
};

const listLocalSessions = async (req, res) => {
  try {
    const qs = new URLSearchParams();
    ['status', 'workflowId', 'envelopeId', 'provider', 'limit', 'offset'].forEach((k) => {
      if (req.query[k] != null && req.query[k] !== '') qs.set(k, String(req.query[k]));
    });
    const q = qs.toString();
    const result = await serviceGet(req, 'identity', {
      url: `/api/identity/sessions${q ? `?${q}` : ''}`,
      headers: withApiKeyHeaders(req),
    });
    return forwardResult(res, result, 'Sessions fetched');
  } catch (error) {
    console.error('listLocalSessions proxy error:', error);
    return res.status(500).json({ status: 500, message: 'Internal Server Error', data: null });
  }
};

const listDiditSessions = async (req, res) => {
  try {
    const qs = new URLSearchParams();
    ['status', 'limit', 'offset'].forEach((k) => {
      if (req.query[k] != null && req.query[k] !== '') qs.set(k, String(req.query[k]));
    });
    const q = qs.toString();
    const result = await serviceGet(req, 'identity', {
      url: `/api/identity/sessions/didit${q ? `?${q}` : ''}`,
      headers: withApiKeyHeaders(req),
    });
    return forwardResult(res, result, 'Didit sessions fetched');
  } catch (error) {
    console.error('listDiditSessions proxy error:', error);
    return res.status(500).json({ status: 500, message: 'Internal Server Error', data: null });
  }
};

const getSessionDecision = async (req, res) => {
  try {
    const result = await serviceGet(req, 'identity', {
      url: `/api/identity/sessions/${encodeURIComponent(req.params.sessionId)}/decision`,
      headers: withApiKeyHeaders(req),
    });
    return forwardResult(res, result, 'Session decision fetched');
  } catch (error) {
    console.error('getSessionDecision proxy error:', error);
    return res.status(500).json({ status: 500, message: 'Internal Server Error', data: null });
  }
};

const createTestSession = async (req, res) => {
  try {
    const { apiKey, ...body } = req.body || {};
    const result = await servicePost(req, 'identity', {
      url: '/api/identity/sessions',
      data: body,
      headers: withApiKeyHeaders(req, apiKey ? { 'x-didit-api-key': apiKey } : {}),
    });
    return forwardResult(res, result, 'Verification session created');
  } catch (error) {
    console.error('createTestSession proxy error:', error);
    return res.status(500).json({ status: 500, message: 'Internal Server Error', data: null });
  }
};

module.exports = {
  listWorkflows,
  getWorkflow,
  createWorkflow,
  updateWorkflow,
  listLocalSessions,
  listDiditSessions,
  getSessionDecision,
  createTestSession,
};
