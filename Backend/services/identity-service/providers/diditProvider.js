const axios = require("axios");
const https = require("https");

const DIDIT_BASE = (process.env.DIDIT_API_BASE_URL || "https://verification.didit.me").replace(/\/+$/, "");

function resolveApiKey(apiKey) {
  return apiKey || process.env.DIDIT_API_KEY || "";
}

function diditHeaders(apiKey) {
  return {
    "x-api-key": resolveApiKey(apiKey),
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

function diditClient(apiKey, timeout = 20000) {
  return axios.create({
    baseURL: DIDIT_BASE,
    headers: diditHeaders(apiKey),
    timeout,
    httpsAgent: new https.Agent({ keepAlive: false }),
  });
}

function mapDiditError(err, fallback = "Didit request failed") {
  const status = err.response?.status || 500;
  const raw = err.response?.data;

  let detail;
  if (typeof raw === "string") {
    detail = raw;
  } else if (Buffer.isBuffer(raw)) {
    detail = raw.toString("utf8");
  } else if (raw && typeof raw === "object") {
    detail = raw.detail || raw.message || raw;
  } else {
    detail = null;
  }

  if (typeof detail === "object" && detail !== null) {
    try {
      detail = JSON.stringify(detail);
    } catch {
      detail = null;
    }
  }

  if (typeof detail === "string" && /<!doctype html>/i.test(detail)) {
    detail =
      "Didit is returning a server error on workflow create right now. Use an existing workflow from the list, or create one in the Didit console and refresh.";
  }

  if (!detail || typeof detail !== "string" || !detail.trim()) {
    detail =
      status >= 500
        ? "Didit workflow create failed (upstream server error). Use an existing workflow or retry later."
        : fallback;
  }

  const error = new Error(detail);
  error.status = status;
  error.data = typeof raw === "string" && /<!doctype html>/i.test(raw) ? { upstream: "didit_html_500" } : raw || null;
  return error;
}

exports.createSession = async (
  userId,
  verificationUrl,
  workFLowId,
  webhookUrl,
  apiKey,
  envelopeId,
  authProviderId
) => {
  const workflowId = workFLowId || process.env.DIDIT_WORKFLOW_ID;
  if (!workflowId) {
    const err = new Error("DIDIT_WORKFLOW_ID is required");
    err.status = 400;
    throw err;
  }
  if (!resolveApiKey(apiKey)) {
    const err = new Error("DIDIT_API_KEY is required");
    err.status = 400;
    throw err;
  }

  try {
    const url =
      verificationUrl ||
      `${DIDIT_BASE}/v3/session/`;
    const res = await axios.post(
      url,
      {
        workflow_id: workflowId,
        vendor_data: userId,
        callback: webhookUrl || process.env.DIDIT_WEBHOOK_URL,
        metadata: { userId, envelopeId, authProviderId },
      },
      {
        headers: diditHeaders(apiKey),
        timeout: 15000,
        httpsAgent: new https.Agent({ keepAlive: false }),
      }
    );

    console.log("Didit createSession SUCCESS:", res.data?.session_id || res.data);
    return res.data;
  } catch (err) {
    console.log("Didit createSession ERROR:", err.response?.status, err.response?.data || err.message);
    throw mapDiditError(err, "Failed to create Didit session");
  }
};

exports.listWorkflows = async ({ apiKey, limit = 50, offset = 0 } = {}) => {
  try {
    const client = diditClient(apiKey);
    const res = await client.get("/v3/workflows/", { params: { limit, offset } });
    return res.data;
  } catch (err) {
    throw mapDiditError(err, "Failed to list Didit workflows");
  }
};

exports.getWorkflow = async (workflowUuid, { apiKey } = {}) => {
  try {
    const client = diditClient(apiKey);
    const res = await client.get(`/v3/workflows/${encodeURIComponent(workflowUuid)}/`);
    return res.data;
  } catch (err) {
    throw mapDiditError(err, "Failed to get Didit workflow");
  }
};

/**
 * Create a simple (linear) workflow via Didit Management API.
 * Body accepts workflow_label + features[]; optional session settings.
 * Does NOT send workflow_type (rejected by Didit simple-create endpoint).
 */
exports.createWorkflow = async (payload, { apiKey } = {}) => {
  const body = {
    workflow_label: payload.workflow_label || payload.label || "Untitled workflow",
    features: Array.isArray(payload.features) ? payload.features : [],
  };

  if (typeof payload.is_white_label_enabled === "boolean") {
    body.is_white_label_enabled = payload.is_white_label_enabled;
  }
  if (typeof payload.is_desktop_allowed === "boolean") {
    body.is_desktop_allowed = payload.is_desktop_allowed;
  }
  if (payload.max_retry_attempts != null) body.max_retry_attempts = Number(payload.max_retry_attempts);
  if (payload.retry_window_days !== undefined) body.retry_window_days = payload.retry_window_days;
  if (payload.session_expiration_time != null) {
    body.session_expiration_time = Number(payload.session_expiration_time);
  }

  if (!body.features.length) {
    const err = new Error("At least one feature is required");
    err.status = 400;
    throw err;
  }

  try {
    const client = diditClient(apiKey);
    const res = await client.post("/v3/workflows/", body);
    return res.data;
  } catch (err) {
    throw mapDiditError(err, "Failed to create Didit workflow");
  }
};

exports.updateWorkflow = async (workflowUuid, payload, { apiKey } = {}) => {
  try {
    const client = diditClient(apiKey);
    const res = await client.patch(`/v3/workflows/${encodeURIComponent(workflowUuid)}/`, payload);
    return res.data;
  } catch (err) {
    throw mapDiditError(err, "Failed to update Didit workflow");
  }
};

exports.listDiditSessions = async ({ apiKey, limit = 50, offset = 0, status } = {}) => {
  try {
    const client = diditClient(apiKey);
    const params = { limit, offset };
    if (status) params.status = status;
    const res = await client.get("/v3/sessions/", { params });
    return res.data;
  } catch (err) {
    throw mapDiditError(err, "Failed to list Didit sessions");
  }
};

exports.getSessionDecision = async (sessionId, { apiKey } = {}) => {
  try {
    const client = diditClient(apiKey);
    const res = await client.get(`/v3/session/${encodeURIComponent(sessionId)}/decision/`);
    return res.data;
  } catch (err) {
    throw mapDiditError(err, "Failed to get Didit session decision");
  }
};

/** Map Didit callback/decision status → recipient authLevel status. */
exports.mapVerificationStatus = (rawStatus) => {
  const s = String(rawStatus || "").trim().toLowerCase().replace(/[\s_-]+/g, "");
  if (["approved", "complete", "completed", "success", "verified"].includes(s)) {
    return "completed";
  }
  if (["declined", "rejected", "failed", "denied", "abandoned", "expired"].includes(s)) {
    return "failed";
  }
  if (["inreview", "review", "pending", "started", "inprogress"].includes(s)) {
    return "pending";
  }
  return "pending";
};
