// src/controllers/identityController.js
const diditProvider = require('../providers/diditProvider');
const surepassDigilockerProvider = require('../providers/surepassDigilockerProvider');
const identitySession = require('../models/identityModal');

const resolvePublicBaseUrl = () => {
  const explicit = process.env.IDENTITY_SERVICE_PUBLIC_URL || process.env.PUBLIC_IDENTITY_SERVICE_URL;
  if (explicit && String(explicit).trim()) {
    return String(explicit).trim().replace(/\/+$/, '');
  }
  return (process.env.IDENTITY_SERVICE_URL || `http://localhost:${process.env.PORT || 2114}`).replace(/\/+$/, '');
};

exports.startIdentity = async (req, res) => {
  try {
    const { userId, authProviderId, verificationUrl, workFLowId, webhookUrl, apiKey, envelopeId } = req.body;
    const workflowId = workFLowId || process.env.DIDIT_WORKFLOW_ID;

    if (!userId || !authProviderId) {
      return res.status(400).json({ success: false, error: 'userId and authProviderId are required' });
    }
    if (!workflowId) {
      return res.status(400).json({
        success: false,
        error: 'DIDIT_WORKFLOW_ID is required on the Auth Provider (or DIDIT_WORKFLOW_ID env)',
      });
    }

    const data = await diditProvider.createSession(
      userId,
      verificationUrl,
      workflowId,
      webhookUrl,
      apiKey,
      envelopeId,
      authProviderId
    );

    await identitySession.create({
      userId,
      envelopeId,
      authProviderId,
      provider: 'didit',
      sessionId: String(data.session_id || data.sessionId || data.id || ''),
      workflowId,
      status: 'pending',
      verificationUrl: data.url || null,
      isAdminTest: false,
    });

    return res.json({
      success: true,
      url: data.url,
      sessionId: data.session_id || data.sessionId || data.id,
      workflowId,
    });
  } catch (err) {
    console.error('startIdentity error:', err.response?.data || err.message);
    const status = err.status || 500;
    return res.status(status).json({
      success: false,
      error: err.message || 'Failed to start identity verification',
      detail: err.data || null,
    });
  }
};

exports.startDigilocker = async (req, res) => {
  try {
    const {
      userId,
      authProviderId,
      apiKey,
      envelopeId,
      webhookUrl,
      redirectUrl,
      apiBaseUrl,
      authType,
      logoUrl,
      skipMainScreen,
      initializePath,
    } = req.body;

    const publicBase = resolvePublicBaseUrl();
    const effectiveWebhook = webhookUrl || `${publicBase}/webhook/surepass-digilocker`;
    const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/+$/, '');
    const effectiveRedirect = redirectUrl || `${publicBase}/webhook/surepass-digilocker/return`;

    const data = await surepassDigilockerProvider.initializeSession({
      apiKeyRef: apiKey,
      apiBaseUrl,
      authType: authType || 'link',
      webhookUrl: effectiveWebhook,
      redirectUrl: effectiveRedirect,
      logoUrl,
      skipMainScreen: skipMainScreen === true || skipMainScreen === 'true',
      initializePath: initializePath || '/api/v1/digilocker/initialize',
    });

    const clientId = data?.data?.client_id;
    if (!clientId) {
      return res.status(502).json({
        success: false,
        message: 'Surepass response missing client_id',
      });
    }

    let verificationUrl = surepassDigilockerProvider.extractVerificationUrl(data);
    if (!verificationUrl && data?.data?.token) {
      const gatewayBase = (apiBaseUrl || process.env.SUREPASS_API_BASE_URL || 'https://sandbox.surepass.app')
        .replace(/\/+$/, '');
      verificationUrl = `${gatewayBase}/digilocker?token=${encodeURIComponent(data.data.token)}`;
    }

    if (!verificationUrl) {
      return res.status(502).json({
        success: false,
        message: 'Surepass response missing verification URL',
      });
    }

    await identitySession.create({
      userId,
      envelopeId,
      authProviderId,
      provider: 'digilocker_link',
      sessionId: clientId,
      status: 'pending',
    });

    return res.json({
      success: true,
      url: verificationUrl,
      clientId,
      redirectUrl: `${frontendUrl}/e-sign/signer/${envelopeId}/${userId}`,
    });
  } catch (err) {
    console.error('Failed to start Surepass Digilocker session:', err.response?.data || err.message);
    const status = err.code === 'SUREPASS_TOKEN_MISSING' ? 400 : 500;
    return res.status(status).json({
      success: false,
      message: err.response?.data?.message || err.message || 'Failed to start Digilocker verification',
    });
  }
};

exports.getStatus = async (req, res) => {
  try {
    const { userId } = req.params;

    const session = await identitySession.findOne({ userId }).sort({ createdAt: -1 });
    console.log('Session found:', session);
    if (!session) {
      return res.status(404).json({ error: 'No identity session found for this user' });
    }
    return res.json(session);

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to get status' });
  }
};

function resolveRequestApiKey(req) {
  return (
    req.headers['x-didit-api-key'] ||
    req.query.apiKey ||
    req.body?.apiKey ||
    process.env.DIDIT_API_KEY ||
    ''
  );
}

exports.listWorkflows = async (req, res) => {
  try {
    const apiKey = resolveRequestApiKey(req);
    const limit = Number(req.query.limit) || 50;
    const offset = Number(req.query.offset) || 0;
    const data = await diditProvider.listWorkflows({ apiKey, limit, offset });
    return res.json({ success: true, data });
  } catch (err) {
    console.error('listWorkflows error:', err.message);
    return res.status(err.status || 500).json({
      success: false,
      message: err.message,
      detail: err.data || null,
    });
  }
};

exports.getWorkflow = async (req, res) => {
  try {
    const apiKey = resolveRequestApiKey(req);
    const data = await diditProvider.getWorkflow(req.params.id, { apiKey });
    return res.json({ success: true, data });
  } catch (err) {
    console.error('getWorkflow error:', err.message);
    return res.status(err.status || 500).json({
      success: false,
      message: err.message,
      detail: err.data || null,
    });
  }
};

exports.createWorkflow = async (req, res) => {
  try {
    const apiKey = resolveRequestApiKey(req);
    const data = await diditProvider.createWorkflow(req.body || {}, { apiKey });
    return res.status(201).json({ success: true, data });
  } catch (err) {
    console.error('createWorkflow error:', err.message);
    let message = err.message || 'Failed to create workflow';
    let detail = err.data || null;
    if (/<!doctype html>/i.test(String(message)) || /<!doctype html>/i.test(JSON.stringify(detail || ''))) {
      message =
        'Didit is temporarily failing workflow create (upstream 500). Use an existing workflow from the list, or create it in the Didit console and click Refresh.';
      detail = { upstream: 'didit_html_500' };
    }
    return res.status(err.status || 500).json({
      success: false,
      message,
      detail,
    });
  }
};

exports.updateWorkflow = async (req, res) => {
  try {
    const apiKey = resolveRequestApiKey(req);
    const data = await diditProvider.updateWorkflow(req.params.id, req.body || {}, { apiKey });
    return res.json({ success: true, data });
  } catch (err) {
    console.error('updateWorkflow error:', err.message);
    return res.status(err.status || 500).json({
      success: false,
      message: err.message,
      detail: err.data || null,
    });
  }
};

exports.listLocalSessions = async (req, res) => {
  try {
    const {
      status,
      workflowId,
      envelopeId,
      provider = 'didit',
      limit = 50,
      offset = 0,
    } = req.query;

    const filter = {};
    if (provider) filter.provider = provider;
    if (status) filter.status = status;
    if (workflowId) filter.workflowId = workflowId;
    if (envelopeId) filter.envelopeId = envelopeId;

    const take = Math.min(Number(limit) || 50, 200);
    const skip = Number(offset) || 0;

    const [items, total] = await Promise.all([
      identitySession.find(filter).sort({ createdAt: -1 }).skip(skip).limit(take).lean(),
      identitySession.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      data: { count: total, results: items, limit: take, offset: skip },
    });
  } catch (err) {
    console.error('listLocalSessions error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.listDiditSessions = async (req, res) => {
  try {
    const apiKey = resolveRequestApiKey(req);
    const limit = Number(req.query.limit) || 50;
    const offset = Number(req.query.offset) || 0;
    const status = req.query.status;
    const data = await diditProvider.listDiditSessions({ apiKey, limit, offset, status });
    return res.json({ success: true, data });
  } catch (err) {
    console.error('listDiditSessions error:', err.message);
    return res.status(err.status || 500).json({
      success: false,
      message: err.message,
      detail: err.data || null,
    });
  }
};

exports.getSessionDecision = async (req, res) => {
  try {
    const apiKey = resolveRequestApiKey(req);
    const sessionId = req.params.sessionId;
    const decision = await diditProvider.getSessionDecision(sessionId, { apiKey });

    let localDoc = await identitySession.findOne({ sessionId });
    if (localDoc) {
      const wf =
        decision?.workflow_id ||
        decision?.workflowId ||
        decision?.session?.workflow_id ||
        decision?.session?.workflowId ||
        null;
      const diditStatus =
        decision?.status ||
        decision?.decision ||
        decision?.session?.status ||
        null;

      let dirty = false;
      if (wf && !localDoc.workflowId) {
        localDoc.workflowId = String(wf);
        dirty = true;
      }
      if (diditStatus) {
        localDoc.decisionStatus = String(diditStatus);
        localDoc.status = diditProvider.mapVerificationStatus(diditStatus);
        dirty = true;
      }
      if (dirty) await localDoc.save();
    }

    return res.json({
      success: true,
      data: {
        decision,
        localSession: localDoc ? localDoc.toObject() : null,
      },
    });
  } catch (err) {
    console.error('getSessionDecision error:', err.message);
    return res.status(err.status || 500).json({
      success: false,
      message: err.message,
      detail: err.data || null,
    });
  }
};

exports.createAdminSession = async (req, res) => {
  try {
    const apiKey = resolveRequestApiKey(req);
    const {
      workflowId,
      vendorData = `admin-test-${Date.now()}`,
      callback,
      metadata,
    } = req.body || {};

    if (!workflowId) {
      return res.status(400).json({ success: false, message: 'workflowId is required' });
    }

    const webhookUrl = callback || process.env.DIDIT_WEBHOOK_URL || 'http://127.0.0.1:2114/webhook/didit';

    const data = await diditProvider.createSession(
      vendorData,
      req.body?.verificationUrl,
      workflowId,
      webhookUrl,
      apiKey,
      metadata?.envelopeId || null,
      metadata?.authProviderId || null
    );

    const sessionId = data.session_id || data.sessionId || data.id || null;
    if (sessionId) {
      await identitySession.create({
        provider: 'didit',
        sessionId: String(sessionId),
        workflowId,
        status: 'pending',
        verificationUrl: data.url || null,
        isAdminTest: true,
        vendorData: String(vendorData),
        envelopeId: metadata?.envelopeId || null,
        authProviderId: metadata?.authProviderId || null,
        userId: metadata?.userId || null,
      });
    }

    return res.status(201).json({
      success: true,
      data: {
        sessionId,
        url: data.url,
        sessionToken: data.session_token,
        raw: data,
      },
    });
  } catch (err) {
    console.error('createAdminSession error:', err.message);
    return res.status(err.status || 500).json({
      success: false,
      message: err.message,
      detail: err.data || null,
    });
  }
};