// emailTemplates.js
const { getBrandName, wrapBrandedEmailBody } = require('@draftnsign/validators/brandConfig');

const BRAND_GREEN = '#248567';
const TEXT_PRIMARY = '#333333';
const TEXT_SECONDARY = '#777777';

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

function emailCtaButton(href, label, backgroundColor = BRAND_GREEN) {
  return `<div style="text-align: center; margin: 28px 0 8px;">
    <a href="${href}" target="_blank" rel="noopener noreferrer" style="background-color: ${backgroundColor}; color: #ffffff; padding: 16px 40px; border-radius: 4px; text-decoration: none; font-weight: 700; display: inline-block; font-size: 14px; letter-spacing: 0.5px; text-transform: uppercase;">
      ${escapeHtml(label)}
    </a>
  </div>`;
}

function emailFallbackLink(href, safeLinkText) {
  return `<p style="font-size: 12px; color: #999999; text-align: center; line-height: 1.6; margin: 20px 0 0;">
    If the button does not work, copy and paste this link into your browser:<br>
    <a href="${href}" target="_blank" rel="noopener noreferrer" style="color: ${BRAND_GREEN}; word-break: break-all;">${safeLinkText}</a>
  </p>`;
}

function emailPortalLink(portalLink) {
  return `<p style="text-align: center; margin: 16px 0 0;">
    <a href="${portalLink}" target="_blank" rel="noopener noreferrer" style="color: ${BRAND_GREEN}; font-size: 13px; font-weight: 600; text-decoration: underline;">
      View my documents
    </a>
  </p>`;
}

function emailSenderAvatarRow(safeSenderName) {
  const initials = safeSenderName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || 'S';

  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 0 0 24px;">
    <tr>
      <td width="56" valign="top" style="padding-right: 16px;">
        <div style="width: 48px; height: 48px; border-radius: 4px; background-color: #e5e7eb; color: #6b7280; font-size: 16px; font-weight: 700; line-height: 48px; text-align: center;">
          ${escapeHtml(initials)}
        </div>
      </td>
      <td valign="middle" style="text-align: left;">
        <p style="font-size: 15px; color: ${TEXT_PRIMARY}; line-height: 1.65; margin: 0;">
          <strong>${safeSenderName}</strong> sent you a document awaiting your signature. Click below to review and sign.
        </p>
      </td>
    </tr>
  </table>`;
}

function emailSignBody({ safeSubject, safeMessage, signLink, portalLink, safeLinkText, isReminder = false, senderName }) {
  const safeSender = escapeHtml(senderName || getBrandName());
  const introRow = emailSenderAvatarRow(safeSender);

  const reminderNote = isReminder
    ? `<p style="font-size: 14px; color: ${TEXT_SECONDARY}; line-height: 1.6; margin: 0 0 20px; text-align: left;">
        Reminder: <strong>${escapeHtml(safeSubject)}</strong> is still awaiting your signature.
      </p>`
    : '';

  const messageBlock =
    safeMessage && safeMessage !== 'No message provided.'
      ? `<p style="font-size: 14px; color: ${TEXT_SECONDARY}; line-height: 1.65; margin: 0 0 24px; font-style: italic; text-align: left;">&ldquo;${safeMessage}&rdquo;</p>`
      : '';

  return `
    ${introRow}
    ${reminderNote}
    ${messageBlock}
    ${emailCtaButton(signLink, 'Open the document', BRAND_GREEN)}
    ${portalLink ? emailPortalLink(portalLink) : ''}
    ${emailFallbackLink(signLink, safeLinkText)}
  `;
}

function emailOtpBox(safeCode) {
  return `<div style="text-align: center; margin: 28px 0 24px;">
    <div style="display: inline-block; letter-spacing: 8px; font-size: 32px; font-weight: 700; color: ${TEXT_PRIMARY}; background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px 28px; font-family: 'Courier New', Courier, monospace;">
      ${safeCode}
    </div>
  </div>`;
}

const signRequestTemplate = (recipientName, envelopeSubject, envelopeMessage, signLink, portalLink, senderName) => {
  const safeSubject = escapeHtml(envelopeSubject);
  const safeMessage = escapeHtml(envelopeMessage) || 'No message provided.';
  const safeLinkText = escapeHtml(signLink);

  return wrapEmailBody(
    emailSignBody({
      safeSubject,
      safeMessage,
      signLink,
      portalLink,
      safeLinkText,
      isReminder: false,
      senderName,
    }),
  );
};

const signReminderTemplate = (recipientName, envelopeSubject, envelopeMessage, signLink, portalLink, senderName) => {
  const safeSubject = escapeHtml(envelopeSubject);
  const safeMessage = escapeHtml(envelopeMessage) || 'No message provided.';
  const safeLinkText = escapeHtml(signLink);

  return wrapEmailBody(
    emailSignBody({
      safeSubject,
      safeMessage,
      signLink,
      portalLink,
      safeLinkText,
      isReminder: true,
      senderName,
    }),
  );
};

const recipientPortalOtpTemplate = ({ recipientEmail, otpCode, expiresInMinutes = 10 }) => {
  const safeEmail = escapeHtml(recipientEmail);
  const safeCode = escapeHtml(otpCode);

  return wrapEmailBody(`
    <p style="font-size: 16px; color: ${TEXT_PRIMARY}; line-height: 1.75; margin: 0 0 8px; text-align: center;">Hello,</p>
    <p style="font-size: 15px; color: ${TEXT_SECONDARY}; line-height: 1.65; margin: 0 0 24px; text-align: center;">
      You requested access to your documents for <strong style="color: ${TEXT_PRIMARY};">${safeEmail}</strong>. Use this one-time code to sign in.
    </p>
    ${emailOtpBox(safeCode)}
    <p style="font-size: 14px; color: ${TEXT_SECONDARY}; line-height: 1.6; text-align: center; margin: 0 0 8px;">
      This code expires in <strong>${Number(expiresInMinutes) || 10} minutes</strong>.
    </p>
    <p style="font-size: 13px; color: #999999; line-height: 1.6; text-align: center; margin: 0;">
      If you did not request this code, you can safely ignore this email.
    </p>
  `);
};

const envelopeCompletedTemplate = (recipientName, envelopeSubject) => {
  const safeName = escapeHtml(recipientName);
  const safeSubject = escapeHtml(envelopeSubject);

  return wrapEmailBody(`
    <p style="font-size: 16px; color: ${TEXT_PRIMARY}; line-height: 1.75; margin: 0 0 8px; text-align: center;">Hello <strong>${safeName}</strong>,</p>
    <p style="font-size: 15px; color: ${TEXT_SECONDARY}; line-height: 1.65; margin: 0 0 16px; text-align: center;">
      The document <strong>${safeSubject}</strong> has been fully signed and completed.
    </p>
    <p style="font-size: 15px; color: ${TEXT_SECONDARY}; line-height: 1.65; margin: 0; text-align: center;">
      The signed document and completion certificate are attached to this email.
    </p>
    <p style="font-size: 14px; color: #999999; line-height: 1.65; margin: 24px 0 0; text-align: center;">Thank you for using ${escapeHtml(getBrandName())}.</p>
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
    <p style="font-size: 16px; color: ${TEXT_PRIMARY}; line-height: 1.75; margin: 0 0 8px; text-align: center;">Hello <strong>${safeName}</strong>,</p>
    <p style="font-size: 15px; color: ${TEXT_SECONDARY}; line-height: 1.65; margin: 0 0 16px; text-align: center;">
      <strong>${safeReassignedByName}</strong>${safeReassignedByEmail ? ` (${safeReassignedByEmail})` : ''} reassigned signing for <strong>${safeSubject || 'your document'}</strong> to you.
      ${safeReason ? ` Reason: ${safeReason}` : ''}
    </p>
    <p style="font-size: 14px; color: ${TEXT_SECONDARY}; line-height: 1.65; margin: 0 0 24px; font-style: italic; text-align: center;">&ldquo;${safeMessage}&rdquo;</p>
    ${emailCtaButton(signLink, 'Review and sign', BRAND_GREEN)}
    ${emailFallbackLink(signLink, safeLinkText)}
  `);
};

const documentCommentNotificationTemplate = ({
  ownerName,
  envelopeSubject,
  authorName,
  commentMessage,
  selectedText,
  viewLink,
}) => {
  const safeOwner = escapeHtml(ownerName || 'there');
  const safeSubject = escapeHtml(envelopeSubject || 'Document');
  const safeAuthor = escapeHtml(authorName || 'A signer');
  const safeMessage = escapeHtml(commentMessage || '');
  const safeSelected = escapeHtml(selectedText || '');
  const safeViewLinkText = escapeHtml(viewLink);

  return wrapEmailBody(`
    <p style="font-size: 16px; color: ${TEXT_PRIMARY}; line-height: 1.75; margin: 0 0 8px; text-align: left;">Hello <strong>${safeOwner}</strong>,</p>
    <p style="font-size: 15px; color: ${TEXT_SECONDARY}; line-height: 1.65; margin: 0 0 16px; text-align: left;">
      <strong>${safeAuthor}</strong> added a comment on <strong>${safeSubject}</strong>.
    </p>
    ${safeSelected ? `<p style="font-size: 14px; color: ${TEXT_SECONDARY}; line-height: 1.65; margin: 0 0 12px; font-style: italic; text-align: left; background:#fff8e6; padding:12px; border-radius:4px;">&ldquo;${safeSelected}&rdquo;</p>` : ''}
    <p style="font-size: 14px; color: ${TEXT_PRIMARY}; line-height: 1.65; margin: 0 0 24px; text-align: left;">${safeMessage}</p>
    ${emailCtaButton(viewLink, 'View suggestions', BRAND_GREEN)}
    ${emailFallbackLink(viewLink, safeViewLinkText)}
  `);
};

const documentCommentReplyTemplate = ({
  recipientName,
  envelopeSubject,
  senderName,
  replyMessage,
  selectedText,
  signLink,
}) => {
  const safeName = escapeHtml(recipientName || 'Signer');
  const safeSubject = escapeHtml(envelopeSubject || 'Document');
  const safeSender = escapeHtml(senderName || 'Sender');
  const safeReply = escapeHtml(replyMessage || '');
  const safeSelected = escapeHtml(selectedText || '');
  const safeLinkText = escapeHtml(signLink);

  return wrapEmailBody(`
    <p style="font-size: 16px; color: ${TEXT_PRIMARY}; line-height: 1.75; margin: 0 0 8px; text-align: left;">Hello <strong>${safeName}</strong>,</p>
    <p style="font-size: 15px; color: ${TEXT_SECONDARY}; line-height: 1.65; margin: 0 0 16px; text-align: left;">
      <strong>${safeSender}</strong> replied to your comment on <strong>${safeSubject}</strong>.
    </p>
    ${safeSelected ? `<p style="font-size: 14px; color: ${TEXT_SECONDARY}; line-height: 1.65; margin: 0 0 12px; font-style: italic; text-align: left; background:#fff8e6; padding:12px; border-radius:4px;">&ldquo;${safeSelected}&rdquo;</p>` : ''}
    <p style="font-size: 14px; color: ${TEXT_PRIMARY}; line-height: 1.65; margin: 0 0 24px; text-align: left;">${safeReply}</p>
    ${emailCtaButton(signLink, 'Open the document', BRAND_GREEN)}
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
    <p style="font-size: 16px; color: ${TEXT_PRIMARY}; line-height: 1.75; margin: 0 0 8px; text-align: center;">Hello <strong>${safeOwnerName}</strong>,</p>
    <p style="font-size: 15px; color: ${TEXT_SECONDARY}; line-height: 1.65; margin: 0 0 16px; text-align: center;">
      You reassigned signing for <strong>${safeSubject}</strong> to <strong>${safeReplacementName}</strong>${safeReplacementEmail ? ` (${safeReplacementEmail})` : ''}.
      ${safeReason ? ` Reason: ${safeReason}` : ''}
    </p>
    <p style="font-size: 14px; color: ${TEXT_SECONDARY}; line-height: 1.65; margin: 0 0 8px; text-align: center;">You no longer need to sign. You will receive updates as a CC recipient.</p>
    ${viewLink ? `${emailCtaButton(viewLink, 'View document status', BRAND_GREEN)}${emailFallbackLink(viewLink, safeViewLinkText)}` : ''}
  `);
};

module.exports = {
  signRequestTemplate,
  envelopeCompletedTemplate,
  signReminderTemplate,
  reassignedSignRequestTemplate,
  reassignedOwnerCcTemplate,
  recipientPortalOtpTemplate,
  documentCommentNotificationTemplate,
  documentCommentReplyTemplate,
};
