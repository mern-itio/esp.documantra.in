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
    <h2 style="margin: 0 0 20px; font-size: 22px; font-weight: 700; color: #1f2937; text-align: center; line-height: 1.3;">${safeSubject}</h2>
    <p style="font-size: 16px; color: #1f2937; line-height: 1.6; margin: 0 0 12px;">Hello <strong>${safeName}</strong>,</p>
    <p style="font-size: 15px; color: #6b7280; line-height: 1.65; margin: 0 0 20px;">
      You have been invited to join an organization on <strong style="color: #4D0080;">${escapeHtml(getBrandName())}</strong>.
    </p>
    <p style="font-size: 15px; color: #6b7280; line-height: 1.65; margin: 0 0 20px;">
      <span style="color: #1f2937; font-weight: 600;">Message from sender</span><br>
      <span style="display: block; margin-top: 8px; background: #f9fafb; padding: 14px 16px; border-left: 3px solid #4D0080; border-radius: 4px; color: #1f2937;">
        ${safeMessage}
      </span>
    </p>
    <div style="text-align: center; margin: 28px 0 20px;">
      <a href="${link}" target="_blank" rel="noopener noreferrer" style="background-color: #4D0080; color: #ffffff; padding: 14px 32px; border-radius: 4px; text-decoration: none; font-weight: 700; display: inline-block; font-size: 13px; letter-spacing: 0.4px; text-transform: uppercase;">
        ${safeButton}
      </a>
    </div>
    <p style="font-size: 13px; color: #6b7280; text-align: center; line-height: 1.6; margin: 16px 0 0;">
      If the button does not work, copy and paste this link into your browser:<br>
      <a href="${link}" target="_blank" rel="noopener noreferrer" style="color: #4D0080; word-break: break-all;">${safeLinkText}</a>
    </p>
  `);
};

module.exports = {
  inviteTemplate,
};
