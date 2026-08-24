const path = require('path');
const express = require('express');
const cors = require('cors');
const config = require('./config');
const estamp = require('./surepassEstampClient');
const { slugToOrderCode, orderCodeToSlug, formatSlugLabel, STAMPER_STATE_CODES } = require('./stateCodes');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    env: config.env,
    baseUrl: config.baseUrl,
    tokenConfigured: Boolean(config.bearerToken),
  });
});

app.get('/api/states', async (_req, res) => {
  try {
    const payload = await estamp.getStateList();
    const slugs = Array.isArray(payload?.data) ? payload.data : [];
    res.json({
      success: true,
      states: slugs.map((slug) => ({
        slug,
        label: formatSlugLabel(slug),
        orderCode: slugToOrderCode(slug),
      })),
      raw: payload,
    });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, message: err.message, data: err.data });
  }
});

app.get('/api/stamper-states', (_req, res) => {
  res.json({ success: true, states: STAMPER_STATE_CODES });
});

app.get('/api/stamper-articles', async (req, res) => {
  try {
    const state = req.query?.state;
    if (!state) {
      return res.status(400).json({ success: false, message: 'state query param is required (e.g. DL, MH)' });
    }
    const payload = await estamp.listArticles(state);
    const articles = Array.isArray(payload?.data) ? payload.data : [];
    res.json({
      success: payload?.success !== false,
      state: String(state).toUpperCase(),
      articles,
      raw: payload,
    });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, message: err.message, data: err.data });
  }
});

app.post('/api/articles', async (req, res) => {
  try {
    const state = req.body?.state;
    if (!state) {
      return res.status(400).json({ success: false, message: 'state is required (slug e.g. maharashtra)' });
    }
    const payload = await estamp.getEstampList(state);
    const map = payload?.data && typeof payload.data === 'object' ? payload.data : {};
    const articles = Object.entries(map).map(([label, dutyType]) => ({
      label,
      estamp_duty_type: dutyType,
    }));
    res.json({
      success: true,
      state,
      orderCode: slugToOrderCode(state),
      articles,
      raw: payload,
    });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, message: err.message, data: err.data });
  }
});

app.post('/api/verify', async (req, res) => {
  try {
    const { state, certificate_number, estamp_duty_type, certificate_issue_date } = req.body || {};
    if (!state || !certificate_number || !estamp_duty_type || !certificate_issue_date) {
      return res.status(400).json({
        success: false,
        message: 'state, certificate_number, estamp_duty_type, certificate_issue_date are required',
      });
    }
    const payload = await estamp.verifyCertificate({
      state,
      certificate_number,
      estamp_duty_type,
      certificate_issue_date,
    });
    res.json({ success: payload?.success !== false, payload });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, message: err.message, data: err.data });
  }
});

app.post('/api/order', async (req, res) => {
  try {
    const {
      first_party,
      second_party,
      state,
      article_id,
      amount,
      consideration_amount,
      description,
    } = req.body || {};

    if (!first_party || !second_party || !state || article_id == null || amount == null) {
      return res.status(400).json({
        success: false,
        message: 'first_party, second_party, state, article_id, amount are required',
      });
    }

    const orderState = state.length <= 3 ? state.toUpperCase() : slugToOrderCode(state) || state;

    const payload = await estamp.orderStamp({
      first_party,
      second_party,
      state: orderState,
      article_id,
      amount,
      consideration_amount: consideration_amount ?? 1,
      description: description || 'e-Stamp order',
    });
    res.json({ success: payload?.success !== false, payload });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, message: err.message, data: err.data });
  }
});

app.get('/api/order/:clientId/status', async (req, res) => {
  try {
    const payload = await estamp.getOrderStatus(req.params.clientId);
    res.json({ success: payload?.success !== false, payload });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, message: err.message, data: err.data });
  }
});

app.get('/api/stats', async (_req, res) => {
  try {
    const payload = await estamp.getStats();
    res.json({ success: payload?.success !== false, payload });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, message: err.message, data: err.data });
  }
});

app.get('/api/verify-context', async (req, res) => {
  try {
    const stateCode = String(req.query?.stateCode || '').trim().toUpperCase();
    const articleName = String(req.query?.articleName || '').trim();
    const slug = orderCodeToSlug(stateCode);
    if (!slug) {
      return res.status(400).json({ success: false, message: `No verification slug for state code ${stateCode}` });
    }
    const payload = await estamp.getEstampList(slug);
    const map = payload?.data && typeof payload.data === 'object' ? payload.data : {};
    const articles = Object.entries(map).map(([label, estamp_duty_type]) => ({ label, estamp_duty_type }));
    const needle = articleName.toLowerCase();
    let suggested = articles.find((a) => a.label.toLowerCase().includes(needle));
    if (!suggested && needle) {
      const words = needle.split(/\s+/).filter((w) => w.length > 3);
      suggested = articles.find((a) => words.some((w) => a.label.toLowerCase().includes(w)));
    }
    res.json({
      success: true,
      stateCode,
      slug,
      slugLabel: formatSlugLabel(slug),
      articles,
      suggestedDutyType: suggested?.estamp_duty_type || null,
      suggestedLabel: suggested?.label || null,
    });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, message: err.message, data: err.data });
  }
});

app.get('/api/state-map', (_req, res) => {
  res.json({ slugToOrderCode: require('./stateCodes').SLUG_TO_ORDER_CODE });
});

app.use(express.static(path.join(__dirname, '..', 'public')));

app.use((_req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.listen(config.port, () => {
  console.log(`Surepass e-Stamp local lab: http://localhost:${config.port}`);
  console.log(`Surepass base: ${config.baseUrl}`);
  console.log(`Token configured: ${config.bearerToken ? 'yes' : 'NO — copy .env.example to .env'}`);
});
