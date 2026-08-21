const express = require('express');

const VSIGN_CALLBACK_PATH = '/api/e-sign/public/v-sign/response';

/** Capture raw POST body before global parsers (XML in msg breaks urlencoded parsing). */
const captureRawBody = express.raw({ type: '*/*', limit: '15mb' });

function extractMsgFromUrlEncoded(text) {
  const idx = text.indexOf('msg=');
  if (idx < 0) return null;

  // Value is everything after msg= (XML may contain unencoded & — do not split on &)
  let value = text.slice(idx + 4);

  const attempts = [
    () => decodeURIComponent(value.replace(/\+/g, ' ')),
    () => value,
  ];

  for (const attempt of attempts) {
    try {
      const decoded = attempt().trim();
      if (decoded.startsWith('<') || /esignresp/i.test(decoded)) return decoded;
    } catch (_) {
      // try next decode strategy
    }
  }

  const trimmed = value.trim();
  return trimmed || null;
}

function extractMsgFromMultipart(text) {
  const match = text.match(/name="msg"[\r\n]+(?:Content-Type:[^\r\n]*[\r\n]+)?[\r\n]+([\s\S]*?)(?:\r\n--|$)/i);
  return match?.[1]?.trim() || null;
}

function parseVSignCallbackBody(rawBody, contentType = '', query = {}) {
  const body = { ...query };

  if (!rawBody || !rawBody.length) return body;

  const text = Buffer.isBuffer(rawBody) ? rawBody.toString('utf8') : String(rawBody);
  const trimmed = text.trim();
  if (!trimmed) return body;

  if (trimmed.startsWith('<')) {
    body.msg = trimmed;
    return body;
  }

  const lowerType = String(contentType).toLowerCase();

  if (lowerType.includes('multipart/form-data')) {
    const msg = extractMsgFromMultipart(text);
    if (msg) body.msg = msg;
    return body;
  }

  if (lowerType.includes('application/x-www-form-urlencoded') || trimmed.includes('msg=')) {
    const msg = extractMsgFromUrlEncoded(trimmed);
    if (msg) body.msg = msg;
    return body;
  }

  if (/esignresp/i.test(trimmed)) {
    body.msg = trimmed;
  }

  return body;
}

function isVSignCallbackRequest(req) {
  const path = req.path || '';
  const original = req.originalUrl || req.url || '';
  return (
    path === VSIGN_CALLBACK_PATH ||
    path.endsWith('/v-sign/response') ||
    /\/v-sign\/response(?:\?|$)/.test(original)
  );
}

function vsignCallbackAccessMiddleware(req, res, next) {
  if (!isVSignCallbackRequest(req)) return next();

  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,HEAD,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    req.headers['access-control-request-headers'] || 'Content-Type, Authorization',
  );

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  return next();
}

function vsignCallbackBodyMiddleware(req, res, next) {
  if (!isVSignCallbackRequest(req)) return next();

  if (req.method === 'GET' || req.method === 'HEAD') {
    req.body = { ...req.query };
    return next();
  }

  return captureRawBody(req, res, (err) => {
    if (err) return next(err);

    const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from('');
    req.vsignRawBody = rawBody;
    req.body = parseVSignCallbackBody(rawBody, req.headers['content-type'], req.query);

    console.log('[VSign callback] raw body', {
      rawLength: rawBody.length,
      parsedMsgLength: req.body?.msg ? String(req.body.msg).length : 0,
      contentType: req.headers['content-type'],
    });

    next();
  });
}

function skipGlobalBodyParserForVSignCallback(req, res, next) {
  if (isVSignCallbackRequest(req)) return next();
  next();
}

module.exports = {
  VSIGN_CALLBACK_PATH,
  vsignCallbackBodyMiddleware,
  parseVSignCallbackBody,
  isVSignCallbackRequest,
  vsignCallbackAccessMiddleware,
  skipGlobalBodyParserForVSignCallback,
};
