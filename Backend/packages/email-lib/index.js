const Mailgun = require('mailgun.js');
const FormData = require('form-data');
const Brevo = require('@getbrevo/brevo');
const nodemailer = require('nodemailer');
function isNonEmptyString(v) {
  return typeof v === 'string' && v.trim().length > 0;
}

const BLOCKED_SENDER_ADDRESSES = new Set(['draftnsign@gmail.com']);

function extractEmailAddress(value) {
  if (!isNonEmptyString(value)) return '';
  const match = String(value).match(/<([^>]+)>/);
  return (match ? match[1] : value).trim().toLowerCase();
}

function isBlockedSenderAddress(value) {
  return BLOCKED_SENDER_ADDRESSES.has(extractEmailAddress(value));
}

function assertSenderAllowed(fromValue, env = process.env) {
  const candidates = [fromValue, env.EMAIL_FROM, env.EMAIL_USER, env.MAILGUN_FROM].filter(isNonEmptyString);
  for (const candidate of candidates) {
    if (isBlockedSenderAddress(candidate)) {
      throw new Error(
        `Sending from ${extractEmailAddress(candidate)} is disabled. Configure Mailgun in Admin → Platform Email.`
      );
    }
  }
}
function getEmailProvider(env = process.env) {
  const provider = String(env.EMAIL_PROVIDER || 'mailgun').toLowerCase();
  if (provider === 'brevo' || provider === 'sendinblue') {
    // console.log("Email Provider: Brevo");
    return 'brevo';
  }
  if (provider === 'smtp' || provider === 'nodemailer' || provider === 'local') {
    // console.log("Email Provider: SMTP");
    return 'smtp';
  }
  // console.log("Email Provider: Mailgun");
  return 'mailgun';
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

function getBrevoConfig(env = process.env) {
  const apiKey = env.BREVO_API_KEY || env.SENDINBLUE_API_KEY;
  const fromEmail = env.BREVO_FROM_EMAIL || env.SENDINBLUE_FROM_EMAIL || env.EMAIL_FROM;
  const fromName = env.BREVO_FROM_NAME || env.SENDINBLUE_FROM_NAME || '';

  const smtpHost = env.BREVO_SMTP_HOST || env.SENDINBLUE_SMTP_HOST || '';
  const smtpPortRaw = env.BREVO_SMTP_PORT || env.SENDINBLUE_SMTP_PORT || '';
  const smtpLogin = env.BREVO_SMTP_LOGIN || env.SENDINBLUE_SMTP_LOGIN || '';
  const smtpPassword = env.BREVO_SMTP_PASSWORD || env.SENDINBLUE_SMTP_PASSWORD || '';
  const smtpSecureRaw = env.BREVO_SMTP_SECURE || env.SENDINBLUE_SMTP_SECURE || '';

  const smtpPort = Number(smtpPortRaw || 587);
  const smtpSecure = String(smtpSecureRaw).toLowerCase() === 'true' ? true : false;

  return {
    apiKey,
    fromEmail,
    fromName,
    smtp: {
      host: smtpHost,
      port: Number.isFinite(smtpPort) ? smtpPort : 587,
      secure: smtpSecure,
      login: smtpLogin,
      password: smtpPassword,
    },
    disabled: String(env.BREVO_DISABLED || env.SENDINBLUE_DISABLED || '').toLowerCase() === 'true',
  };
}

function isBrevoConfigured(env = process.env) {
  const cfg = getBrevoConfig(env);
  const smtpConfigured =
    isNonEmptyString(cfg.smtp.host) && isNonEmptyString(cfg.smtp.login) && isNonEmptyString(cfg.smtp.password);
  const apiConfigured = isNonEmptyString(cfg.apiKey);
  return !cfg.disabled && isNonEmptyString(cfg.fromEmail) && (smtpConfigured || apiConfigured);
}

function createBrevoClient(env = process.env) {
  const cfg = getBrevoConfig(env);
  const smtpConfigured =
    isNonEmptyString(cfg.smtp.host) && isNonEmptyString(cfg.smtp.login) && isNonEmptyString(cfg.smtp.password);
  if (!smtpConfigured && !isNonEmptyString(cfg.apiKey)) {
    throw new Error(
      'Brevo credentials missing. Provide BREVO_SMTP_HOST/BREVO_SMTP_LOGIN/BREVO_SMTP_PASSWORD (SMTP) OR BREVO_API_KEY (API).'
    );
  }

  const apiInstance = new Brevo.TransactionalEmailsApi();
  if (isNonEmptyString(cfg.apiKey)) {
    apiInstance.setApiKey(Brevo.TransactionalEmailsApiApiKeys.apiKey, cfg.apiKey);
  }
  return { apiInstance, cfg };
}

function createBrevoSmtpTransport(env = process.env) {
  const cfg = getBrevoConfig(env);
  const smtpConfigured =
    isNonEmptyString(cfg.smtp.host) && isNonEmptyString(cfg.smtp.login) && isNonEmptyString(cfg.smtp.password);
  if (!smtpConfigured) {
    throw new Error('Brevo SMTP not configured (BREVO_SMTP_HOST/BREVO_SMTP_LOGIN/BREVO_SMTP_PASSWORD)');
  }

  return nodemailer.createTransport({
    host: cfg.smtp.host,
    port: cfg.smtp.port,
    secure: cfg.smtp.secure,
    auth: {
      user: cfg.smtp.login,
      pass: cfg.smtp.password,
    },
  });
}

function getSmtpConfig(env = process.env) {
  const user = env.EMAIL_USER;
  const pass = env.EMAIL_PASS || env.EMAIL_PASSWORD;
  const fromEmail = env.EMAIL_FROM || user || env.EMAIL_FROM_EMAIL || '';
  const fromName = env.EMAIL_FROM_NAME || env.APP_NAME || '';

  const service = env.EMAIL_SERVICE;
  const host = env.SMTP_HOST || 'smtp.gmail.com';
  const portRaw = env.SMTP_PORT;
  const secureRaw = env.SMTP_SECURE;

  const port = Number(portRaw || 587);
  const secure =
    typeof secureRaw !== 'undefined'
      ? String(secureRaw).toLowerCase() === 'true'
      : Number.isFinite(port) && port === 465;

  let transportConfig = null;
  if (service) {
    transportConfig = {
      service,
      auth: { user, pass },
    };
  } else {
    transportConfig = {
      host,
      port: Number.isFinite(port) ? port : 587,
      secure,
      auth: { user, pass },
    };
  }

  return {
    user,
    pass,
    fromEmail,
    fromName,
    transportConfig,
    disabled: String(env.EMAIL_SMTP_DISABLED || '').toLowerCase() === 'true',
  };
}

function isSmtpConfigured(env = process.env) {
  const cfg = getSmtpConfig(env);
  if (isBlockedSenderAddress(cfg.user) || isBlockedSenderAddress(cfg.fromEmail)) {
    return false;
  }
  return !cfg.disabled && isNonEmptyString(cfg.user) && isNonEmptyString(cfg.pass);
}

let cachedSmtpTransport = null;
function createSmtpTransport(env = process.env) {
  const cfg = getSmtpConfig(env);
  if (!isSmtpConfigured(env) || !cfg.transportConfig) {
    throw new Error('SMTP not configured (need EMAIL_USER and EMAIL_PASS plus EMAIL_SERVICE or SMTP_HOST/SMTP_PORT)');
  }
  if (cachedSmtpTransport) return cachedSmtpTransport;
  cachedSmtpTransport = nodemailer.createTransport(cfg.transportConfig);
  return cachedSmtpTransport;
}

async function sendWithMailgun(options, env = process.env) {
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

  const resolvedFrom = isNonEmptyString(from) ? from : cfg.from;
  assertSenderAllowed(resolvedFrom, env);

  const mg = createMailgunClient(env);
  const message = {
    from: resolvedFrom,
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

/**
 * Send an email through Brevo (Sendinblue).
 */
async function sendWithBrevo(options, env = process.env) {
  const cfg = getBrevoConfig(env);
  if (cfg.disabled) {
    return { skipped: true, reason: 'BREVO_DISABLED=true' };
  }
  if (!isBrevoConfigured(env)) {
    return { skipped: true, reason: 'Brevo not configured (need BREVO_FROM_EMAIL + SMTP or API credentials)' };
  }

  const { to, subject, text, html, from, cc, bcc, replyTo } = options || {};
  if (!isNonEmptyString(subject)) throw new Error('subject is required');
  if (!to || (Array.isArray(to) && to.length === 0)) throw new Error('to is required');
  if (!isNonEmptyString(text) && !isNonEmptyString(html)) throw new Error('Either text or html is required');

  const smtpConfigured =
    isNonEmptyString(cfg.smtp.host) && isNonEmptyString(cfg.smtp.login) && isNonEmptyString(cfg.smtp.password);

  const normalizeRecipients = (value) => {
    if (!value) return [];
    if (Array.isArray(value)) {
      return value
        .map((v) => (typeof v === 'string' ? { email: v } : v))
        .filter((r) => isNonEmptyString(r.email));
    }
    if (typeof value === 'string') return [{ email: value }];
    if (typeof value === 'object' && isNonEmptyString(value.email)) return [value];
    return [];
  };

  const fromAddress = (() => {
    if (isNonEmptyString(from)) {
      // support "Name <email@domain>" format
      const match = from.match(/^(.*)<(.+)>$/);
      if (match) {
        return { name: match[1].trim(), email: match[2].trim() };
      }
      return { email: from, name: cfg.fromName || undefined };
    }
    return {
      email: cfg.fromEmail,
      name: cfg.fromName || undefined,
    };
  })();

  // Prefer SMTP when configured (common on Brevo free accounts)
  if (smtpConfigured) {
    const transport = createBrevoSmtpTransport(env);

    const listToString = (v) => {
      if (!v) return undefined;
      if (Array.isArray(v)) return v.join(',');
      return v;
    };

    const mailOptions = {
      from: fromAddress.name ? `${fromAddress.name} <${fromAddress.email}>` : fromAddress.email,
      to: listToString(to),
      cc: listToString(cc),
      bcc: listToString(bcc),
      subject,
      text: isNonEmptyString(text) ? text : undefined,
      html: isNonEmptyString(html) ? html : undefined,
      replyTo: isNonEmptyString(replyTo) ? replyTo : undefined,
    };

    const info = await transport.sendMail(mailOptions);
    return {
      skipped: false,
      id: info?.messageId,
      message: 'Email sent via Brevo SMTP',
      raw: info,
    };
  }

  // Fallback to Brevo API if SMTP not configured
  const { apiInstance } = createBrevoClient(env);
  const sendSmtpEmail = {
    subject,
    htmlContent: isNonEmptyString(html) ? html : undefined,
    textContent: isNonEmptyString(text) ? text : undefined,
    sender: fromAddress,
    to: normalizeRecipients(to),
    cc: normalizeRecipients(cc) || undefined,
    bcc: normalizeRecipients(bcc) || undefined,
    replyTo: replyTo ? { email: replyTo } : undefined,
  };

  const res = await apiInstance.sendTransacEmail(sendSmtpEmail);
  return { skipped: false, id: res?.messageId || res?.messageId, message: 'Email sent via Brevo', raw: res };
}

async function sendEmail(options, env = process.env) {
  const provider = getEmailProvider(env);
  if (provider === 'brevo') {
    return sendWithBrevo(options, env);
  }
  if (provider === 'smtp') {
    if (!isSmtpConfigured(env)) {
      return { skipped: true, reason: 'SMTP not configured (EMAIL_USER/EMAIL_PASS/SMTP_HOST/SMTP_PORT)' };
    }

    const { to, subject, text, html, from, cc, bcc, replyTo } = options || {};
    if (!isNonEmptyString(subject)) throw new Error('subject is required');
    if (!to || (Array.isArray(to) && to.length === 0)) throw new Error('to is required');
    if (!isNonEmptyString(text) && !isNonEmptyString(html)) throw new Error('Either text or html is required');

    const cfg = getSmtpConfig(env);
    assertSenderAllowed(from, env);

    const transport = createSmtpTransport(env);

    const fromEmail = (() => {
      if (isNonEmptyString(from)) return from;
      if (isNonEmptyString(cfg.fromEmail) && isNonEmptyString(cfg.fromName)) {
        return `${cfg.fromName} <${cfg.fromEmail}>`;
      }
      if (isNonEmptyString(cfg.fromEmail)) return cfg.fromEmail;
      return undefined;
    })();

    const mailOptions = {
      from: fromEmail,
      to,
      cc: cc || undefined,
      bcc: bcc || undefined,
      subject,
      text: isNonEmptyString(text) ? text : undefined,
      html: isNonEmptyString(html) ? html : undefined,
      replyTo: isNonEmptyString(replyTo) ? replyTo : undefined,
    };

    const info = await transport.sendMail(mailOptions);
    return {
      skipped: false,
      id: info?.messageId,
      message: 'Email sent via SMTP',
      raw: info,
    };
  }
  // default / fallback
  return sendWithMailgun(options, env);
}

module.exports = {
  // provider selection
  getEmailProvider,

  // mailgun specific
  getMailgunConfig,
  isMailgunConfigured,
  createMailgunClient,
  sendWithMailgun,

  // brevo specific
  getBrevoConfig,
  isBrevoConfigured,
  createBrevoClient,
  createBrevoSmtpTransport,
  sendWithBrevo,

  // smtp specific
  getSmtpConfig,
  isSmtpConfigured,
  createSmtpTransport,

  // generic
  sendEmail,
};

