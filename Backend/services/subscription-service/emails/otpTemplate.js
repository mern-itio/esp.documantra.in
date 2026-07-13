const { wrapBrandedEmailBody } = require('@draftnsign/validators/brandConfig');

function escapeHtml(value) {
  if (value == null) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const otpTemplate = (recipientName, otp_code) => {
  const safeName = escapeHtml(recipientName);
  const safeCode = escapeHtml(otp_code);

  return wrapBrandedEmailBody(`
    <p style="font-size: 16px; color: #333333; line-height: 1.75; margin: 0 0 8px; text-align: center;">Hello <strong>${safeName}</strong>,</p>
    <p style="font-size: 15px; color: #777777; line-height: 1.65; margin: 0 0 24px; text-align: center;">
      Use this one-time code to verify your identity before accessing and signing a shared document.
    </p>
    <div style="text-align: center; margin: 28px 0 24px;">
      <div style="display: inline-block; letter-spacing: 8px; font-size: 32px; font-weight: 700; color: #333333; background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px 28px; font-family: 'Courier New', Courier, monospace;">
        ${safeCode}
      </div>
    </div>
    <p style="font-size: 14px; color: #777777; line-height: 1.65; margin: 0 0 8px; text-align: center;">
      Enter this code on the verification screen to continue.
    </p>
    <p style="font-size: 13px; color: #999999; line-height: 1.6; margin: 0; text-align: center;">
      If you did not initiate this verification, you can safely ignore this email.
    </p>
  `);
};

module.exports = {
  otpTemplate,
};
