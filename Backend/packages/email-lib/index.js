const Mailgun = require('mailgun.js');
const FormData = require('form-data');

function isNonEmptyString(v) {
  return typeof v === 'string' && v.trim().length > 0;
}

function getMailgunConfig(env = process.env) {
  const apiKey = env.MAILGUN_API_KEY;
  const domain = env.MAILGUN_DOMAIN;
  const from = env.MAILGUN_FROM || env.EMAIL_FROM; // allow existing env naming
  const host =
    env.MAILGUN_HOST || env.MAILGUN_BASE_URL || (env.MAILGUN_REGION === 'eu' ? 'api.eu.mailgun.net' : 'api.mailgun.net');

  return {
    apiKey,
    domain,
    from,
    host,
    disabled: String(env.MAILGUN_DISABLED || '').toLowerCase() === 'true',
  };
}

function isMailgunConfigured(env = process.env) {
  const cfg = getMailgunConfig(env);
  return !cfg.disabled && isNonEmptyString(cfg.apiKey) && isNonEmptyString(cfg.domain) && isNonEmptyString(cfg.from);
}

function createMailgunClient(env = process.env) {
  const cfg = getMailgunConfig(env);
  if (!isNonEmptyString(cfg.apiKey)) {
    throw new Error('MAILGUN_API_KEY is required');
  }
  const mailgun = new Mailgun(FormData);
  return mailgun.client({
    username: 'api',
    key: cfg.apiKey,
    url: `https://${cfg.host}`,
  });
}

/**
 * Send an email through Mailgun.
 *
 * Env required:
 * - MAILGUN_API_KEY
 * - MAILGUN_DOMAIN
 * - MAILGUN_FROM (example: "Draft and Sign <no-reply@mg.example.com>")
 *
 * Optional:
 * - MAILGUN_REGION=eu (or set MAILGUN_HOST=api.eu.mailgun.net)
 * - MAILGUN_DISABLED=true (skip send)
 */
async function sendEmail(options, env = process.env) {
  const cfg = getMailgunConfig(env);
  if (cfg.disabled) {
    return { skipped: true, reason: 'MAILGUN_DISABLED=true' };
  }
  if (!isMailgunConfigured(env)) {
    return { skipped: true, reason: 'Mailgun not configured (MAILGUN_API_KEY/MAILGUN_DOMAIN/MAILGUN_FROM)' };
  }

  const { to, subject, text, html, from, cc, bcc, replyTo, tags, headers, variables } = options || {};
  if (!isNonEmptyString(subject)) throw new Error('subject is required');
  if (!to || (Array.isArray(to) && to.length === 0)) throw new Error('to is required');
  if (!isNonEmptyString(text) && !isNonEmptyString(html)) throw new Error('Either text or html is required');

  const mg = createMailgunClient(env);
  const message = {
    from: isNonEmptyString(from) ? from : cfg.from,
    to,
    subject,
    text: isNonEmptyString(text) ? text : undefined,
    html: isNonEmptyString(html) ? html : undefined,
    cc: cc || undefined,
    bcc: bcc || undefined,
    'h:Reply-To': isNonEmptyString(replyTo) ? replyTo : undefined,
  };

  // Mailgun supports tags & custom headers/vars, keep optional and lightweight
  if (tags) {
    const t = Array.isArray(tags) ? tags : [tags];
    message['o:tag'] = t.filter(isNonEmptyString);
  }
  if (headers && typeof headers === 'object') {
    for (const [k, v] of Object.entries(headers)) {
      if (isNonEmptyString(k) && isNonEmptyString(String(v))) message[`h:${k}`] = String(v);
    }
  }
  if (variables && typeof variables === 'object') {
    for (const [k, v] of Object.entries(variables)) {
      if (isNonEmptyString(k)) message[`v:${k}`] = typeof v === 'string' ? v : JSON.stringify(v);
    }
  }

  const res = await mg.messages.create(cfg.domain, message);
  return { skipped: false, id: res?.id, message: res?.message, raw: res };
}

module.exports = {
  getMailgunConfig,
  isMailgunConfigured,
  createMailgunClient,
  sendEmail,
};

