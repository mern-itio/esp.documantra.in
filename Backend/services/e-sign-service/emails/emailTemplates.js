// emailTemplates.js
const { getBrandName, wrapBrandedEmailBody } = require('@draftnsign/validators/brandConfig');

const BRAND_PURPLE = '#4D0080';
const BRAND_GREEN = '#248567';
const TEXT_PRIMARY = '#1f2937';
const TEXT_SECONDARY = '#6b7280';

function escapeHtml(value) {
  if (value == null) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function wrapEmailBody(contentHtml) {
  return wrapBrandedEmailBody(contentHtml);
}

function emailHeading(title) {
  return `<h2 style="margin: 0 0 20px; font-size: 22px; font-weight: 700; color: ${TEXT_PRIMARY}; text-align: center; line-height: 1.3;">${title}</h2>`;
}

function emailGreeting(name) {
  return `<p style="font-size: 16px; color: ${TEXT_PRIMARY}; line-height: 1.6; margin: 0 0 12px;">Hello${name ? ` <strong>${name}</strong>` : ''},</p>`;
}

function emailParagraph(text) {
  return `<p style="font-size: 15px; color: ${TEXT_SECONDARY}; line-height: 1.65; margin: 0 0 20px;">${text}</p>`;
}

function emailMessageQuote(safeMessage) {
  return `<p style="font-size: 15px; color: ${TEXT_SECONDARY}; line-height: 1.65; margin: 0 0 20px;">
    <span style="color: ${TEXT_PRIMARY}; font-weight: 600;">Message from sender</span><br>
    <span style="display: block; margin-top: 8px; background: #f9fafb; padding: 14px 16px; border-left: 3px solid ${BRAND_PURPLE}; border-radius: 4px; color: ${TEXT_PRIMARY};">
      ${safeMessage}
    </span>
  </p>`;
}

function emailCtaButton(href, label, backgroundColor = BRAND_PURPLE) {
  return `<div style="text-align: center; margin: 28px 0 20px;">
    <a href="${href}" target="_blank" rel="noopener noreferrer" style="background-color: ${backgroundColor}; color: #ffffff; padding: 14px 32px; border-radius: 4px; text-decoration: none; font-weight: 700; display: inline-block; font-size: 13px; letter-spacing: 0.4px; text-transform: uppercase;">
      ${escapeHtml(label)}
    </a>
  </div>`;
}

function emailFallbackLink(href, safeLinkText) {
  return `<p style="font-size: 13px; color: ${TEXT_SECONDARY}; text-align: center; line-height: 1.6; margin: 16px 0 0;">
    If the button does not work, copy and paste this link into your browser:<br>
    <a href="${href}" target="_blank" rel="noopener noreferrer" style="color: ${BRAND_PURPLE}; word-break: break-all;">${safeLinkText}</a>
  </p>`;
}

function emailOtpBox(safeCode) {
  return `<div style="text-align: center; margin: 28px 0 24px;">
    <div style="display: inline-block; letter-spacing: 8px; font-size: 32px; font-weight: 700; color: ${TEXT_PRIMARY}; background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px 28px; font-family: 'Courier New', Courier, monospace;">
      ${safeCode}
    </div>
  </div>`;
}

const signRequestTemplate = (recipientName, envelopeSubject, envelopeMessage, signLink, portalLink) => {
  const safeName = escapeHtml(recipientName);
  const safeSubject = escapeHtml(envelopeSubject);
  const safeMessage = escapeHtml(envelopeMessage) || 'No message provided.';
  const safeLinkText = escapeHtml(signLink);

  return wrapEmailBody(`
        ${emailHeading('Document signing request')}
        ${emailGreeting(safeName)}
        ${emailParagraph(`You have been requested to sign <strong style="color: ${BRAND_PURPLE};">${safeSubject}</strong>.`)}
        ${emailMessageQuote(safeMessage)}
        ${emailCtaButton(signLink, 'Open the document', BRAND_PURPLE)}
        ${portalLink ? emailCtaButton(portalLink, 'View my documents', BRAND_GREEN) : ''}
        ${emailFallbackLink(signLink, safeLinkText)}
  `);
};

const signReminderTemplate = (recipientName, envelopeSubject, envelopeMessage, signLink, portalLink) => {
  const safeName = escapeHtml(recipientName);
  const safeSubject = escapeHtml(envelopeSubject);
  const safeMessage = escapeHtml(envelopeMessage) || 'No message provided.';
  const safeLinkText = escapeHtml(signLink);

  return wrapEmailBody(`
        ${emailHeading('Reminder: signature requested')}
        ${emailGreeting(safeName)}
        ${emailParagraph(`This is a reminder to sign <strong style="color: ${BRAND_PURPLE};">${safeSubject}</strong>.`)}
        ${emailMessageQuote(safeMessage)}
        ${emailCtaButton(signLink, 'Open the document', BRAND_PURPLE)}
        ${portalLink ? emailCtaButton(portalLink, 'View my documents', BRAND_GREEN) : ''}
        ${emailFallbackLink(signLink, safeLinkText)}
  `);
};

const recipientPortalOtpTemplate = ({ recipientEmail, otpCode, expiresInMinutes = 10 }) => {
  const safeEmail = escapeHtml(recipientEmail);
  const safeCode = escapeHtml(otpCode);

  return wrapEmailBody(`
        ${emailHeading('Complete your sign-in')}
        ${emailGreeting()}
        ${emailParagraph(`You requested access to your documents. Use this one-time code to sign in to your document inbox for <strong style="color: ${TEXT_PRIMARY};">${safeEmail}</strong>.`)}
        ${emailOtpBox(safeCode)}
        ${emailParagraph(`This code expires in <strong>${Number(expiresInMinutes) || 10} minutes</strong>.`)}
        <p style="font-size: 13px; color: ${TEXT_SECONDARY}; line-height: 1.6; text-align: center; margin: 0;">
          If you did not request this code, you can safely ignore this email.
        </p>
  `);
};

const envelopeCompletedTemplate = (recipientName, envelopeSubject) => {
  const safeName = escapeHtml(recipientName);
  const safeSubject = escapeHtml(envelopeSubject);

  return wrapEmailBody(`
        ${emailHeading('Document completed')}
        ${emailGreeting(safeName)}
        ${emailParagraph(`The document <strong style="color: ${BRAND_PURPLE};">${safeSubject}</strong> has been fully signed and completed.`)}
        ${emailParagraph('The signed document and completion certificate are attached to this email.')}
        <p style="font-size: 15px; color: ${TEXT_SECONDARY}; line-height: 1.65; margin: 24px 0 0; text-align: center;">Thank you for using ${escapeHtml(getBrandName())}.</p>
  `);
};

const reassignedSignRequestTemplate = ({
  recipientName,
  envelopeSubject,
  envelopeMessage,
  signLink,
  reassignedByName,
  reassignedByEmail,
  reassignmentReason,
}) => {
  const safeName = escapeHtml(recipientName);
  const safeSubject = escapeHtml(envelopeSubject);
  const safeMessage = escapeHtml(envelopeMessage) || 'No message provided.';
  const safeReassignedByName = escapeHtml(reassignedByName || 'Signer');
  const safeReassignedByEmail = escapeHtml(reassignedByEmail);
  const safeReason = escapeHtml(reassignmentReason);
  const safeLinkText = escapeHtml(signLink);

  return wrapEmailBody(`
        ${emailHeading('Signing request reassigned to you')}
        ${emailGreeting(safeName)}
        ${emailParagraph(`Reassigned by <strong>${safeReassignedByName}</strong>${safeReassignedByEmail ? ` (${safeReassignedByEmail})` : ''}.${safeReason ? ` Reason: ${safeReason}` : ''}`)}
        <p style="font-size: 16px; color: ${TEXT_PRIMARY}; font-weight: 700; margin: 0 0 12px; text-align: center;">${safeSubject || 'Untitled document'}</p>
        ${emailMessageQuote(safeMessage)}
        ${emailCtaButton(signLink, 'Review and sign', BRAND_PURPLE)}
        ${emailFallbackLink(signLink, safeLinkText)}
  `);
};

const reassignedOwnerCcTemplate = ({
  ownerName,
  envelopeSubject,
  replacementRecipientName,
  replacementRecipientEmail,
  reassignmentReason,
  viewLink,
}) => {
  const safeOwnerName = escapeHtml(ownerName || 'Signer');
  const safeSubject = escapeHtml(envelopeSubject || 'an envelope');
  const safeReplacementName = escapeHtml(replacementRecipientName || 'a new signer');
  const safeReplacementEmail = escapeHtml(replacementRecipientEmail);
  const safeReason = escapeHtml(reassignmentReason);
  const safeViewLinkText = escapeHtml(viewLink);

  return wrapEmailBody(`
        ${emailHeading('You are now CC on this envelope')}
        ${emailGreeting(safeOwnerName)}
        ${emailParagraph(`You reassigned signing for <strong>${safeSubject}</strong> to <strong>${safeReplacementName}</strong>${safeReplacementEmail ? ` (${safeReplacementEmail})` : ''}.${safeReason ? ` Reason: ${safeReason}` : ''}`)}
        <ul style="margin: 0 0 20px; padding-left: 20px; font-size: 15px; color: ${TEXT_SECONDARY}; line-height: 1.65;">
          <li>You no longer need to sign this document.</li>
          <li>You will receive updates as a CC recipient.</li>
          <li>You can still open the document to view its status.</li>
        </ul>
        ${viewLink ? `${emailCtaButton(viewLink, 'View document status', BRAND_PURPLE)}${emailFallbackLink(viewLink, safeViewLinkText)}` : ''}
  `);
};

module.exports = {
  signRequestTemplate,
  envelopeCompletedTemplate,
  signReminderTemplate,
  reassignedSignRequestTemplate,
  reassignedOwnerCcTemplate,
  recipientPortalOtpTemplate,
};
