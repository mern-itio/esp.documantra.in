const { getBrandName, wrapBrandedEmailBody } = require('@draftnsign/validators/brandConfig');

function escapeHtml(value) {
  if (value == null) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const inviteTemplate = (recipientName, emailSubject, emailMessage, link, LinkButtonText = 'Click Here') => {
  const safeName = escapeHtml(recipientName);
  const safeSubject = escapeHtml(emailSubject);
  const safeMessage = escapeHtml(emailMessage) || 'No message provided.';
  const safeButton = escapeHtml(LinkButtonText || 'Click Here');
  const safeLinkText = escapeHtml(link);

  return wrapBrandedEmailBody(`
    <p style="font-size: 16px; color: #333333; line-height: 1.75; margin: 0 0 8px; text-align: center;">Hello <strong>${safeName}</strong>,</p>
    <p style="font-size: 15px; color: #777777; line-height: 1.65; margin: 0 0 16px; text-align: center;">
      You have been invited to join <strong>${safeSubject}</strong> on ${escapeHtml(getBrandName())}.
    </p>
    <p style="font-size: 14px; color: #777777; line-height: 1.65; margin: 0 0 24px; font-style: italic; text-align: center;">&ldquo;${safeMessage}&rdquo;</p>
    <div style="text-align: center; margin: 28px 0 8px;">
      <a href="${link}" target="_blank" rel="noopener noreferrer" style="background-color: #248567; color: #ffffff; padding: 16px 40px; border-radius: 4px; text-decoration: none; font-weight: 700; display: inline-block; font-size: 14px; letter-spacing: 0.5px; text-transform: uppercase;">
        ${safeButton}
      </a>
    </div>
    <p style="font-size: 12px; color: #999999; text-align: center; line-height: 1.6; margin: 20px 0 0;">
      If the button does not work, copy and paste this link into your browser:<br>
      <a href="${link}" target="_blank" rel="noopener noreferrer" style="color: #248567; word-break: break-all;">${safeLinkText}</a>
    </p>
  `);
};

module.exports = {
  inviteTemplate,
};
