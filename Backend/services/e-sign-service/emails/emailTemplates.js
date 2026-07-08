// emailTemplates.js
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

function wrapEmailBody(contentHtml) {
  return wrapBrandedEmailBody(contentHtml);
}

const signRequestTemplate = (recipientName, envelopeSubject, envelopeMessage, signLink) => {
  const safeName = escapeHtml(recipientName);
  const safeSubject = escapeHtml(envelopeSubject);
  const safeMessage = escapeHtml(envelopeMessage) || 'No message provided.';
  const safeLinkText = escapeHtml(signLink);

  return wrapEmailBody(`
        <h2 style="margin: 0 0 16px; font-size: 20px; color: #111827;">Document signing request</h2>
        <p style="font-size: 16px; color: #333;">Hello <strong>${safeName}</strong>,</p>
        <p style="font-size: 15px; color: #555; line-height: 1.6;">
          You have been requested to sign:
          <strong style="color: #4D0080;">${safeSubject}</strong>.
        </p>
        <p style="font-size: 15px; color: #555; line-height: 1.6;">
          <em>Message from sender:</em><br>
          <span style="display: inline-block; background: #f9f9f9; padding: 10px 14px; border-left: 4px solid #4D0080; border-radius: 4px;">
            ${safeMessage}
          </span>
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${signLink}" target="_blank" style="background: #4D0080; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block; font-size: 16px;">
            Review &amp; sign document
          </a>
        </div>
        <p style="font-size: 14px; color: #777; text-align: center; line-height: 1.5;">
          If the button does not work, copy and paste this link into your browser:<br>
          <a href="${signLink}" target="_blank" style="color: #4D0080;">${safeLinkText}</a>
        </p>
  `);
};

const signReminderTemplate = (recipientName, envelopeSubject, envelopeMessage, signLink) => {
  const safeName = escapeHtml(recipientName);
  const safeSubject = escapeHtml(envelopeSubject);
  const safeMessage = escapeHtml(envelopeMessage) || 'No message provided.';
  const safeLinkText = escapeHtml(signLink);

  return wrapEmailBody(`
        <h2 style="margin: 0 0 16px; font-size: 20px; color: #111827;">Reminder: signature requested</h2>
        <p style="font-size: 16px; color: #333;">Hello <strong>${safeName}</strong>,</p>
        <p style="font-size: 15px; color: #555; line-height: 1.6;">
          This is a reminder to sign:
          <strong style="color: #4D0080;">${safeSubject}</strong>.
        </p>
        <p style="font-size: 15px; color: #555; line-height: 1.6;">
          <em>Message from sender:</em><br>
          <span style="display: inline-block; background: #f9f9f9; padding: 10px 14px; border-left: 4px solid #4D0080; border-radius: 4px;">
            ${safeMessage}
          </span>
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${signLink}" target="_blank" style="background: #4D0080; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block; font-size: 16px;">
            Review &amp; sign document
          </a>
        </div>
        <p style="font-size: 14px; color: #777; text-align: center; line-height: 1.5;">
          If the button does not work, copy and paste this link into your browser:<br>
          <a href="${signLink}" target="_blank" style="color: #4D0080;">${safeLinkText}</a>
        </p>
  `);
};

const envelopeCompletedTemplate = (recipientName, envelopeSubject) => {
  const safeName = escapeHtml(recipientName);
  const safeSubject = escapeHtml(envelopeSubject);

  return wrapEmailBody(`
        <h2 style="margin: 0 0 16px; font-size: 20px; color: #111827;">Document completed</h2>
        <p style="font-size: 16px; color: #333;">Hello <strong>${safeName}</strong>,</p>
        <p style="font-size: 15px; color: #555; line-height: 1.6;">
          The document <strong style="color: #4D0080;">${safeSubject}</strong> has been fully signed and completed.
        </p>
        <p style="font-size: 15px; color: #555; line-height: 1.6;">
          The signed document and completion certificate are attached to this email.
        </p>
        <p style="font-size: 15px; color: #555; line-height: 1.6; margin-top: 25px;">Thank you for using ${escapeHtml(getBrandName())}.</p>
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
        <h2 style="margin: 0 0 16px; font-size: 20px; color: #111827;">Signing request reassigned to you</h2>
        <p style="font-size: 15px; color: #111827;">Hello <strong>${safeName}</strong>,</p>
        <p style="font-size: 14px; color: #0f172a; line-height: 1.5;">
          Reassigned by <strong>${safeReassignedByName}</strong>${safeReassignedByEmail ? ` (${safeReassignedByEmail})` : ''}.
          ${safeReason ? `<br>Reason: ${safeReason}` : ''}
        </p>
        <p style="font-size: 15px; color: #111827; font-weight: 700; margin: 16px 0 8px;">${safeSubject || 'Untitled document'}</p>
        <p style="font-size: 14px; color: #111827; line-height: 1.6; background: #f9fafb; border-radius: 8px; padding: 10px 12px; white-space: pre-wrap;">${safeMessage}</p>
        <div style="text-align: center; margin: 24px 0 12px;">
          <a href="${signLink}" target="_blank" style="background: #2563eb; color: #ffffff; padding: 12px 22px; border-radius: 10px; text-decoration: none; font-weight: 700; display: inline-block; font-size: 15px;">
            Review and sign
          </a>
        </div>
        <p style="font-size: 13px; color: #6b7280; text-align: center; line-height: 1.5; margin: 0;">
          If the button does not work, copy and paste this link into your browser:<br>
          <a href="${signLink}" target="_blank" style="color: #1d4ed8; word-break: break-all;">${safeLinkText}</a>
        </p>
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
        <h2 style="margin: 0 0 16px; font-size: 20px; color: #111827;">You are now CC on this envelope</h2>
        <p style="font-size: 15px; color: #111827;">Hello <strong>${safeOwnerName}</strong>,</p>
        <p style="font-size: 14px; color: #0f172a; line-height: 1.5;">
          You reassigned signing for <strong>${safeSubject}</strong> to
          <strong>${safeReplacementName}</strong>${safeReplacementEmail ? ` (${safeReplacementEmail})` : ''}.
          ${safeReason ? `<br>Reason: ${safeReason}` : ''}
        </p>
        <ul style="margin: 16px 0; padding-left: 18px; font-size: 14px; color: #0f172a; line-height: 1.6;">
          <li>You no longer need to sign this document.</li>
          <li>You will receive updates as a CC recipient.</li>
          <li>You can still open the document to view its status.</li>
        </ul>
        ${
          viewLink
            ? `<div style="text-align:center; margin: 18px 0 12px;">
                 <a href="${viewLink}" target="_blank" style="background: #2563eb; color: #ffffff; padding: 12px 22px; border-radius: 10px; text-decoration: none; font-weight: 700; display: inline-block; font-size: 15px;">
                   View document status
                 </a>
               </div>
               <p style="font-size: 13px; color: #6b7280; text-align: center; line-height: 1.5; margin: 0;">
                 If the button does not work, copy and paste this link into your browser:<br>
                 <a href="${viewLink}" target="_blank" style="color: #1d4ed8; word-break: break-all;">${safeViewLinkText}</a>
               </p>`
            : ''
        }
  `);
};

module.exports = {
  signRequestTemplate,
  envelopeCompletedTemplate,
  signReminderTemplate,
  reassignedSignRequestTemplate,
  reassignedOwnerCcTemplate,
};
