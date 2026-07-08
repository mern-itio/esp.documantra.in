const {
  getOrCreatePlatformEmailDoc,
  refreshPlatformEmailCache,
  getAdminPlatformEmailConfig,
  buildMailgunEnv,
  isPlatformMailgunReady,
} = require('../utils/platformEmailPolicy');
const { sendWithMailgun } = require('@draftnsign/email-lib');

function getAdminId(req) {
  return req.user?.id || req.user?.data?.id || req.user?._id || null;
}

async function getPlatformEmailConfig(req, res) {
  try {
    const payload = await getAdminPlatformEmailConfig();
    return res.status(200).json(payload);
  } catch (err) {
    console.error('getPlatformEmailConfig', err);
    return res.status(500).json({ message: 'Failed to load platform email settings' });
  }
}

async function updatePlatformEmailConfig(req, res) {
  try {
    const body = req.body || {};
    const doc = await getOrCreatePlatformEmailDoc();

    if (body.enabled !== undefined) doc.enabled = Boolean(body.enabled);
    if (body.mailgunDomain !== undefined) doc.mailgunDomain = String(body.mailgunDomain || '').trim();
    if (body.mailgunRegion !== undefined) doc.mailgunRegion = body.mailgunRegion === 'eu' ? 'eu' : 'us';
    if (body.mailgunHost !== undefined) doc.mailgunHost = String(body.mailgunHost || '').trim();
    if (body.dmFromEmail !== undefined) doc.dmFromEmail = String(body.dmFromEmail || '').trim();
    if (body.dmFromName !== undefined) doc.dmFromName = String(body.dmFromName || '').trim() || 'DocuMantra';
    if (body.defaultSenderMode !== undefined) {
      doc.defaultSenderMode = body.defaultSenderMode === 'user' ? 'user' : 'dm';
    }
    if (body.userFallbackReplyTo !== undefined) doc.userFallbackReplyTo = Boolean(body.userFallbackReplyTo);
    if (body.allowUserSmtpFallback !== undefined) doc.allowUserSmtpFallback = Boolean(body.allowUserSmtpFallback);
    if (body.mailgunApiKey !== undefined && String(body.mailgunApiKey).trim()) {
      doc.mailgunApiKey = String(body.mailgunApiKey).trim();
    } else if (body.clearMailgunApiKey) {
      doc.mailgunApiKey = '';
    }

    const adminId = getAdminId(req);
    if (adminId) doc.updatedBy = adminId;

    await doc.save();
    await refreshPlatformEmailCache();

    const payload = await getAdminPlatformEmailConfig();
    return res.status(200).json({
      ...payload,
      message: 'Platform email settings saved',
    });
  } catch (err) {
    console.error('updatePlatformEmailConfig', err);
    return res.status(500).json({ message: 'Failed to update platform email settings' });
  }
}

async function testPlatformEmail(req, res) {
  try {
    const { to, senderMode } = req.body || {};
    if (!to) return res.status(400).json({ message: 'Test recipient email (to) is required' });

    const doc = await getOrCreatePlatformEmailDoc();
    if (!isPlatformMailgunReady(doc)) {
      return res.status(400).json({
        message: 'Mailgun is not configured. Enable platform email and set API key, domain, and DM from address.',
      });
    }

    const env = buildMailgunEnv(doc);
    const mode = senderMode === 'user' ? 'user' : 'dm';
    const from =
      mode === 'user' && doc.dmFromEmail
        ? `"Test User" <${doc.dmFromEmail}>`
        : undefined;

    const result = await sendWithMailgun(
      {
        to,
        subject: `DocuMantra Mailgun test (${mode} sender)`,
        html: `<p>This is a test email from DocuMantra platform Mailgun settings.</p><p>Sender mode: <strong>${mode}</strong></p>`,
        from,
        replyTo: mode === 'user' ? to : undefined,
      },
      env
    );

    if (result?.skipped) {
      return res.status(400).json({ message: result.reason || 'Mailgun send skipped' });
    }

    return res.status(200).json({
      message: 'Test email sent successfully',
      id: result?.id,
      senderMode: mode,
    });
  } catch (err) {
    console.error('testPlatformEmail', err);
    return res.status(500).json({ message: err.message || 'Test email failed' });
  }
}

module.exports = {
  getPlatformEmailConfig,
  updatePlatformEmailConfig,
  testPlatformEmail,
};
