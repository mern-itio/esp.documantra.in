const SessionPolicyConfig = require('../models/SessionPolicyConfig');

const DEFAULT_IDLE_MS = Number(process.env.SESSION_IDLE_TIMEOUT_MS || 8 * 60 * 60 * 1000);
const DEFAULT_MAX_SESSIONS = Number(process.env.MAX_CONCURRENT_SESSIONS || 5);

const policyState = {
  sessionIdleTimeoutMs: DEFAULT_IDLE_MS,
  maxConcurrentSessions: clampMaxSessions(DEFAULT_MAX_SESSIONS),
  sessionIdleTimeoutHours: Math.round(DEFAULT_IDLE_MS / (60 * 60 * 1000)),
  loaded: false,
};

function clampMaxSessions(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) return 5;
  return Math.min(Math.floor(parsed), 20);
}

function clampIdleHours(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return 8;
  return Math.min(Math.max(parsed, 0.25), 24);
}

async function getOrCreateSessionPolicyDoc() {
  let doc = await SessionPolicyConfig.findOne({ key: 'default' });
  if (!doc) {
    doc = await SessionPolicyConfig.create({
      key: 'default',
      sessionIdleTimeoutHours: clampIdleHours(policyState.sessionIdleTimeoutHours),
      maxConcurrentSessions: policyState.maxConcurrentSessions,
    });
  }
  return doc;
}

async function refreshSessionPolicyCache() {
  try {
    const doc = await getOrCreateSessionPolicyDoc();
    const hours = clampIdleHours(doc.sessionIdleTimeoutHours);
    policyState.sessionIdleTimeoutHours = hours;
    policyState.sessionIdleTimeoutMs = hours * 60 * 60 * 1000;
    policyState.maxConcurrentSessions = clampMaxSessions(doc.maxConcurrentSessions);
    policyState.loaded = true;
  } catch (err) {
    console.error('refreshSessionPolicyCache', err);
  }
  return policyState;
}

function getSessionIdleTimeoutMs() {
  return policyState.sessionIdleTimeoutMs;
}

function getSessionIdleTimeoutHours() {
  return policyState.sessionIdleTimeoutHours;
}

function getMaxConcurrentSessions() {
  return policyState.maxConcurrentSessions;
}

function getSessionPolicySnapshot() {
  return {
    sessionIdleTimeoutHours: policyState.sessionIdleTimeoutHours,
    sessionIdleTimeoutMs: policyState.sessionIdleTimeoutMs,
    maxConcurrentSessions: policyState.maxConcurrentSessions,
    loaded: policyState.loaded,
  };
}

module.exports = {
  refreshSessionPolicyCache,
  getOrCreateSessionPolicyDoc,
  getSessionIdleTimeoutMs,
  getSessionIdleTimeoutHours,
  getMaxConcurrentSessions,
  getSessionPolicySnapshot,
  clampIdleHours,
  clampMaxSessions,
};
