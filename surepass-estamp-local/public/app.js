const $ = (id) => document.getElementById(id);

let states = [];
let verifyArticles = [];
let stamperArticles = [];
let flowArticles = [];
let stamperStateCodes = [];
let pollTimer = null;
let flowRunning = false;

const flowState = {
  clientId: null,
  stamp: null,
  verifySlug: null,
  verifyDutyArticles: [],
  selectedArticle: null,
};

function unwrapStamp(payload) {
  return payload?.payload?.data || payload?.data || payload;
}

function log(entry) {
  const el = $('api-log');
  const line = typeof entry === 'string' ? entry : JSON.stringify(entry, null, 2);
  const ts = new Date().toISOString();
  el.textContent = el.textContent === '—' ? '' : el.textContent;
  el.textContent = `[${ts}]\n${line}\n\n${el.textContent}`;
}

function flowLog(line) {
  const el = $('flow-log');
  const ts = new Date().toLocaleTimeString();
  el.textContent = el.textContent === '—' ? '' : el.textContent;
  el.textContent = `[${ts}] ${line}\n${el.textContent}`;
}

function setFlowStatus(text) {
  $('flow-status-text').textContent = text;
}

function setFlowStep(n) {
  document.querySelectorAll('#flow-stepper .step').forEach((el) => {
    const step = Number(el.dataset.step);
    el.classList.toggle('active', step === n);
    el.classList.toggle('done', step < n);
  });
  const target = document.querySelector(`.flow-step[data-flow-step="${n}"]`);
  if (target) target.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

async function api(path, options = {}) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  log({ request: path, status: res.status, body: options.body ? JSON.parse(options.body) : null, response: data });
  return { ok: res.ok, status: res.status, data };
}

function ensureOk(result, fallbackMsg) {
  if (!result.ok) {
    const msg = result.data?.message || fallbackMsg || `HTTP ${result.status}`;
    throw new Error(msg);
  }
  return result.data;
}

function setResult(el, text, tone = '') {
  el.textContent = text;
  el.classList.remove('ok', 'err', 'fail');
  if (tone) el.classList.add(tone);
}

function formatVerifyResult(result) {
  const { ok, status, data } = result;
  const lines = [];
  if (ok) {
    lines.push('✓ Certificate verified — genuine stamp in govt registry.');
    const d = data?.payload?.data || data?.data;
    if (d?.first_party) lines.push(`First party: ${d.first_party}`);
    if (d?.second_party) lines.push(`Second party: ${d.second_party}`);
    if (d?.stamp_duty_account) lines.push(`Stamp duty: ${d.stamp_duty_account}`);
  } else if (status === 422) {
    lines.push('Certificate not found (422). API works — check cert number, duty type, and date.');
  } else {
    lines.push(`Failed (${status}): ${data?.message || 'unknown'}`);
  }
  lines.push('');
  lines.push(JSON.stringify(data, null, 2));
  return lines.join('\n');
}

function verifyResultTone(result) {
  if (result.ok) return 'ok';
  if (result.status === 422) return 'err';
  return 'fail';
}

function setupTabs() {
  document.querySelectorAll('.tab').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach((b) => b.classList.remove('active'));
      document.querySelectorAll('.panel').forEach((p) => p.classList.remove('active'));
      btn.classList.add('active');
      $(`panel-${btn.dataset.tab}`).classList.add('active');
    });
  });
  $('btn-clear-log').addEventListener('click', () => { $('api-log').textContent = '—'; });
}

function fillStateSelect(selectEl, list) {
  selectEl.innerHTML = '';
  list.forEach((s) => {
    const opt = document.createElement('option');
    opt.value = s.slug;
    opt.textContent = `${s.label}${s.orderCode ? ` (${s.orderCode})` : ''}`;
    selectEl.appendChild(opt);
  });
}

function fillCodeSelect(selectEl, codes) {
  const labels = {
    DL: 'Delhi', MH: 'Maharashtra', UP: 'Uttar Pradesh', KA: 'Karnataka', TN: 'Tamil Nadu',
    GJ: 'Gujarat', RJ: 'Rajasthan', PB: 'Punjab', HR: 'Haryana', WB: 'West Bengal',
  };
  selectEl.innerHTML = '';
  codes.forEach((code) => {
    const opt = document.createElement('option');
    opt.value = code;
    opt.textContent = labels[code] ? `${code} — ${labels[code]}` : code;
    selectEl.appendChild(opt);
  });
}

function fillStamperArticleSelect(selectEl, articles, onPick) {
  selectEl.innerHTML = '';
  articles.forEach((a, i) => {
    const opt = document.createElement('option');
    opt.value = String(i);
    opt.textContent = `${a.article_code} — ${a.article_name} (${a.article_id})`;
    selectEl.appendChild(opt);
  });
  if (articles.length && onPick) onPick(0);
  selectEl.onchange = () => onPick(Number(selectEl.value));
}

function fillDutySelect(selectEl, articles, onPick) {
  selectEl.innerHTML = '';
  articles.forEach((a, i) => {
    const opt = document.createElement('option');
    opt.value = String(i);
    opt.textContent = `${a.label} → ${a.estamp_duty_type}`;
    selectEl.appendChild(opt);
  });
  if (articles.length && onPick) onPick(0);
  selectEl.onchange = () => onPick(Number(selectEl.value));
}

function pickStamperArticle(idx) {
  const article = stamperArticles[idx];
  if (!article) {
    $('order-article-id').value = '';
    $('order-article-label').textContent = '—';
    return;
  }
  $('order-article-id').value = article.article_id;
  $('order-article-label').textContent = `${article.article_code} — ${article.article_name} (id ${article.article_id})`;
}

function pickFlowArticle(idx) {
  const article = flowArticles[idx];
  flowState.selectedArticle = article || null;
  if (!article) {
    $('flow-article-id').value = '';
    $('flow-article-label').textContent = '—';
    return;
  }
  $('flow-article-id').value = article.article_id;
  $('flow-article-label').textContent = `${article.article_code} — ${article.article_name} (id ${article.article_id})`;
}

function renderStampCard(stamp) {
  if (!stamp) {
    $('flow-stamp-card').classList.add('hidden');
    return;
  }
  $('flow-stamp-card').classList.remove('hidden');
  $('flow-card-state').textContent = stamp.state || '—';
  $('flow-card-article').textContent = stamp.article_id || '—';
  $('flow-card-amount').textContent = stamp.amount != null ? `₹${stamp.amount}` : '—';
  $('flow-card-parties').textContent = `${stamp.first_party || '—'} / ${stamp.second_party || '—'}`;
  $('flow-card-status').textContent = stamp.status || '—';
  const linkEl = $('flow-pdf-link');
  if (stamp.link) {
    linkEl.href = stamp.link;
    linkEl.classList.remove('hidden');
    $('flow-pdf-hint').textContent = 'PDF link valid ~10 minutes — download now.';
  } else {
    linkEl.href = '#';
    $('flow-pdf-hint').textContent = 'Waiting for PDF link (status must be available).';
  }
}

function setOrderStatusPill(status) {
  const el = $('flow-order-status');
  el.textContent = status || '—';
  el.className = 'status-pill';
  if (status) el.classList.add(status);
}

async function loadHealth() {
  const el = $('health');
  try {
    const h = await fetch('/api/health').then((r) => r.json());
    if (!h.tokenConfigured) {
      el.textContent = 'No token — set .env';
      el.className = 'health bad';
      return;
    }
    el.textContent = `${h.env} · ${h.baseUrl.replace('https://', '')}`;
    el.className = 'health ok';
  } catch {
    el.textContent = 'Server offline';
    el.className = 'health bad';
  }
}

async function loadStamperStateCodes() {
  const result = await api('/api/stamper-states');
  const data = ensureOk(result, 'Failed to load Stamper state codes');
  stamperStateCodes = data.states || ['DL'];
}

async function loadStamperArticlesFor(selectId, labelId, articleIdInput, onPick, storeRef) {
  const state = $(selectId).value;
  if (!state) return;
  $(labelId).textContent = 'Loading…';
  const result = await api(`/api/stamper-articles?state=${encodeURIComponent(state)}`);
  if (!result.ok || !Array.isArray(result.data?.articles)) {
    storeRef.length = 0;
    $(articleIdInput).value = '';
    $(labelId).textContent = result.data?.message || 'Could not load articles — restart server';
    return;
  }
  storeRef.splice(0, storeRef.length, ...result.data.articles);
  const selectEl = selectId === 'flow-state-code' ? $('flow-article-select') : $('order-article-select');
  fillStamperArticleSelect(selectEl, storeRef, onPick);
}

async function loadStamperStates() {
  await loadStamperStateCodes();
  fillCodeSelect($('order-state-code'), stamperStateCodes);
  const dlIndex = stamperStateCodes.indexOf('DL');
  if (dlIndex >= 0) $('order-state-code').selectedIndex = dlIndex;
  await loadStamperArticlesFor('order-state-code', 'order-article-label', 'order-article-id', pickStamperArticle, stamperArticles);
}

async function loadFlowBootstrap() {
  fillCodeSelect($('flow-state-code'), stamperStateCodes);
  const dlIndex = stamperStateCodes.indexOf('DL');
  if (dlIndex >= 0) $('flow-state-code').selectedIndex = dlIndex;
  await loadFlowArticles();
}

async function loadFlowArticles() {
  await loadStamperArticlesFor('flow-state-code', 'flow-article-label', 'flow-article-id', pickFlowArticle, flowArticles);
}

async function loadVerifyArticles() {
  const slug = $('verify-state').value;
  const result = await api('/api/articles', { method: 'POST', body: JSON.stringify({ state: slug }) });
  const data = ensureOk(result, 'Failed to load duty types');
  verifyArticles = data.articles || [];
  fillDutySelect($('verify-duty'), verifyArticles, (idx) => {
    $('verify-duty-code').value = verifyArticles[idx]?.estamp_duty_type || '';
  });
}

async function flowPlaceOrder() {
  const articleId = $('flow-article-id').value;
  if (!articleId) throw new Error('Select state and article in step 1');
  setFlowStep(2);
  setFlowStatus('Placing order…');
  flowLog('POST order-stamp');
  const result = await api('/api/order', {
    method: 'POST',
    body: JSON.stringify({
      first_party: $('flow-first').value.trim(),
      second_party: $('flow-second').value.trim(),
      state: $('flow-state-code').value,
      article_id: articleId,
      amount: $('flow-amount').value,
      consideration_amount: $('flow-consideration').value,
      description: $('flow-desc').value.trim(),
    }),
  });
  if (!result.ok) throw new Error(result.data?.message || 'Order failed');
  const stamp = unwrapStamp(result.data);
  flowState.clientId = stamp?.client_id;
  flowState.stamp = stamp;
  $('flow-client-id').textContent = flowState.clientId || '—';
  $('order-client-id').value = flowState.clientId || '';
  setOrderStatusPill(stamp?.status || 'pending');
  flowLog(`Order placed: ${flowState.clientId}`);
  return stamp;
}

async function flowPollStatus(maxAttempts = 24, intervalMs = 5000) {
  if (!flowState.clientId) throw new Error('No client_id — place order first');
  setFlowStep(3);
  setFlowStatus('Polling order status…');
  for (let i = 0; i < maxAttempts; i += 1) {
    flowLog(`GET order-status (${i + 1}/${maxAttempts})`);
    const result = await api(`/api/order/${encodeURIComponent(flowState.clientId)}/status`);
    if (!result.ok) throw new Error(result.data?.message || 'Status check failed');
    const stamp = unwrapStamp(result.data);
    flowState.stamp = stamp;
    setOrderStatusPill(stamp?.status);
    if (stamp?.status === 'available') {
      flowLog('Stamp available — PDF ready');
      return stamp;
    }
    if (stamp?.status === 'used' || stamp?.status === 'on_hold') {
      throw new Error(`Order ended with status: ${stamp.status}`);
    }
    setFlowStatus(`Status: ${stamp?.status || 'pending'} — retry in ${intervalMs / 1000}s…`);
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error('Timeout waiting for available status');
}

async function flowPrepareVerify(stamp) {
  setFlowStep(5);
  setFlowStatus('Loading verification duty types…');
  const stateCode = stamp?.state || $('flow-state-code').value;
  const articleName = flowState.selectedArticle?.article_name || '';
  const result = await api(
    `/api/verify-context?stateCode=${encodeURIComponent(stateCode)}&articleName=${encodeURIComponent(articleName)}`,
  );
  const data = ensureOk(result, 'Failed to load verify context');
  flowState.verifySlug = data.slug;
  flowState.verifyDutyArticles = data.articles || [];
  $('flow-verify-slug').value = data.slug;
  fillDutySelect($('flow-verify-duty'), flowState.verifyDutyArticles, () => {});
  if (data.suggestedDutyType) {
    const idx = flowState.verifyDutyArticles.findIndex((a) => a.estamp_duty_type === data.suggestedDutyType);
    if (idx >= 0) $('flow-verify-duty').selectedIndex = idx;
    flowLog(`Suggested duty: ${data.suggestedDutyType} (${data.suggestedLabel || ''})`);
  }
  const certs = stamp?.certificate_details;
  if (Array.isArray(certs) && certs.length) {
    $('flow-verify-cert').value = certs[0].certificate_number || '';
    $('flow-verify-date').value = certs[0].issue_date || '';
    flowLog(`Auto-filled cert: ${certs[0].certificate_number}`);
  } else {
    $('flow-verify-cert').value = '';
    $('flow-verify-date').value = new Date().toISOString().slice(0, 10);
    flowLog('certificate_details empty — enter cert number from PDF if you want to verify');
  }
  setFlowStatus('Step 5 ready — verify or skip if no cert number yet');
}

async function flowVerifyCertificate() {
  const slug = $('flow-verify-slug').value.trim();
  const cert = $('flow-verify-cert').value.trim();
  const date = $('flow-verify-date').value;
  const dutyIdx = Number($('flow-verify-duty').value);
  const duty = flowState.verifyDutyArticles[dutyIdx]?.estamp_duty_type
    || flowState.verifyDutyArticles[0]?.estamp_duty_type;
  if (!slug || !duty) throw new Error('Verification context not loaded');
  if (!cert) {
    flowLog('Skipped verify — no certificate number (copy from PDF)');
    setFlowStep(6);
    setResult($('flow-verify-result'), 'Verification skipped — no certificate number.\n\nOpen the PDF from step 4, copy the certificate number, then run verify again.', 'err');
    setFlowStatus('Flow complete (generate OK). Add cert number to verify.');
    return null;
  }
  setFlowStep(6);
  setFlowStatus('Verifying certificate…');
  flowLog(`POST verification: ${cert}`);
  const result = await api('/api/verify', {
    method: 'POST',
    body: JSON.stringify({
      state: slug,
      certificate_number: cert,
      estamp_duty_type: duty,
      certificate_issue_date: date,
    }),
  });
  setResult($('flow-verify-result'), formatVerifyResult(result), verifyResultTone(result));
  setFlowStatus(result.ok ? 'Full flow complete — stamp verified ✓' : 'Flow complete — verify returned ' + result.status);
  return result;
}

async function runFullFlow() {
  if (flowRunning) return;
  flowRunning = true;
  $('btn-run-full-flow').disabled = true;
  try {
    setFlowStep(1);
    setFlowStatus('Step 1 — articles loaded');
    flowLog('=== Full e-Stamp flow started ===');
    const stampAfterOrder = await flowPlaceOrder();
    const stamp = stampAfterOrder?.status === 'available'
      ? stampAfterOrder
      : await flowPollStatus();
    setFlowStep(4);
    renderStampCard(stamp);
    setFlowStatus('PDF ready — download from step 4');
    await flowPrepareVerify(stamp);
    await flowVerifyCertificate();
    flowLog('=== Flow finished ===');
  } catch (e) {
    flowLog(`ERROR: ${e.message}`);
    setFlowStatus(`Error: ${e.message}`);
    alert(e.message);
  } finally {
    flowRunning = false;
    $('btn-run-full-flow').disabled = false;
  }
}

function resetFlow() {
  flowState.clientId = null;
  flowState.stamp = null;
  flowState.verifySlug = null;
  flowState.verifyDutyArticles = [];
  $('flow-client-id').textContent = '—';
  setOrderStatusPill('');
  renderStampCard(null);
  setResult($('flow-verify-result'), '—');
  $('flow-log').textContent = '—';
  setFlowStep(1);
  setFlowStatus('Reset — ready');
}

// --- Order tab (manual) ---
async function loadStamperArticles() {
  await loadStamperArticlesFor('order-state-code', 'order-article-label', 'order-article-id', pickStamperArticle, stamperArticles);
}

$('verify-state').addEventListener('change', () => loadVerifyArticles().catch((e) => alert(e.message)));
$('order-state-code').addEventListener('change', () => loadStamperArticles().catch((e) => alert(e.message)));
$('flow-state-code').addEventListener('change', () => loadFlowArticles().catch((e) => alert(e.message)));
$('btn-reload-articles').addEventListener('click', () => loadStamperArticles().catch((e) => alert(e.message)));

$('btn-verify').addEventListener('click', async () => {
  const dutyCode = $('verify-duty-code').value.trim();
  if (!dutyCode) return alert('Select duty type first');
  setResult($('verify-result'), 'Loading…');
  try {
    const result = await api('/api/verify', {
      method: 'POST',
      body: JSON.stringify({
        state: $('verify-state').value,
        certificate_number: $('verify-cert').value.trim(),
        estamp_duty_type: dutyCode,
        certificate_issue_date: $('verify-date').value,
      }),
    });
    setResult($('verify-result'), formatVerifyResult(result), verifyResultTone(result));
  } catch (e) {
    setResult($('verify-result'), `Error: ${e.message}`, 'fail');
  }
});

$('btn-order').addEventListener('click', async () => {
  const articleId = $('order-article-id').value;
  if (!articleId) return alert('Select article first');
  setResult($('order-result'), 'Ordering…');
  try {
    const result = await api('/api/order', {
      method: 'POST',
      body: JSON.stringify({
        first_party: $('order-first').value.trim(),
        second_party: $('order-second').value.trim(),
        state: $('order-state-code').value,
        article_id: articleId,
        amount: $('order-amount').value,
        consideration_amount: $('order-consideration').value,
        description: $('order-desc').value.trim(),
      }),
    });
    if (!result.ok) {
      setResult($('order-result'), `${result.data?.message}\n\n${JSON.stringify(result.data, null, 2)}`, 'fail');
      return;
    }
    setResult($('order-result'), JSON.stringify(result.data, null, 2), 'ok');
    const clientId = unwrapStamp(result.data)?.client_id;
    if (clientId) $('order-client-id').value = clientId;
  } catch (e) {
    setResult($('order-result'), `Error: ${e.message}`, 'fail');
  }
});

function formatOrderStatusSummary(data) {
  const d = unwrapStamp(data);
  if (!d) return '—';
  const parts = [`Status: ${d.status || 'unknown'}`];
  if (d.link) parts.push('PDF available');
  return parts.join(' · ');
}

function setOrderStatusView(result) {
  const payload = result.data;
  setResult($('order-result'), JSON.stringify(payload, null, 2), result.ok ? 'ok' : 'fail');
  $('order-status-summary').textContent = result.ok ? formatOrderStatusSummary(payload) : (payload?.message || '—');
}

async function checkOrderStatus() {
  const id = $('order-client-id').value.trim();
  if (!id) return alert('Enter client_id');
  setResult($('order-result'), 'Checking…');
  try {
    const result = await api(`/api/order/${encodeURIComponent(id)}/status`);
    setOrderStatusView(result);
    return result.data;
  } catch (e) {
    setResult($('order-result'), `Error: ${e.message}`, 'fail');
    return null;
  }
}

$('btn-stats').addEventListener('click', async () => {
  const result = await api('/api/stats');
  setResult($('order-result'), JSON.stringify(result.data, null, 2), result.ok ? 'ok' : 'fail');
});

$('btn-status').addEventListener('click', () => checkOrderStatus());
$('btn-poll').addEventListener('click', () => {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
    $('btn-poll').textContent = 'Poll every 5s';
    return;
  }
  $('btn-poll').textContent = 'Stop polling';
  pollTimer = setInterval(() => checkOrderStatus(), 5000);
  checkOrderStatus();
});

// --- Flow tab ---
$('btn-run-full-flow').addEventListener('click', () => runFullFlow());
$('btn-reset-flow').addEventListener('click', () => resetFlow());
$('btn-flow-order').addEventListener('click', () => flowPlaceOrder().catch((e) => alert(e.message)));
$('btn-flow-poll').addEventListener('click', async () => {
  try {
    const stamp = await flowPollStatus(1, 0);
    renderStampCard(stamp);
    await flowPrepareVerify(stamp);
  } catch (e) {
    alert(e.message);
  }
});
$('btn-flow-verify').addEventListener('click', () => flowVerifyCertificate().catch((e) => alert(e.message)));

(async function init() {
  setupTabs();
  $('verify-date').value = new Date().toISOString().slice(0, 10);
  await loadHealth();
  try {
    await loadStamperStateCodes();
    await Promise.all([loadStamperStates(), loadFlowBootstrap()]);
  } catch (e) {
    alert(`Bootstrap failed: ${e.message}\nRestart: cd surepass-estamp-local && npm start`);
  }
  try {
    const result = await api('/api/states');
    const data = ensureOk(result, 'Failed to load states');
    states = data.states || [];
    fillStateSelect($('verify-state'), states);
    await loadVerifyArticles();
  } catch (e) {
    log(`Verify tab: ${e.message}`);
  }
  setFlowStep(1);
})();
