// emailTemplates.js

function escapeHtml(value) {
  if (value == null) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const signRequestTemplate = (recipientName, envelopeSubject, envelopeMessage, signLink) => {
  const safeName = escapeHtml(recipientName);
  const safeSubject = escapeHtml(envelopeSubject);
  const safeMessage = escapeHtml(envelopeMessage) || 'No message provided.';
  const safeLinkText = escapeHtml(signLink);

  return `
  <div style="
    font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    background-color: #f4f4f7;
    padding: 40px 0;
    margin: 0;
  ">
    <div style="
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 10px;
      box-shadow: 0 4px 10px rgba(0,0,0,0.1);
      overflow: hidden;
    ">
      <div style="
        background: linear-gradient(90deg, #4D0080, #8E2DE2);
        color: #ffffff;
        text-align: center;
        padding: 20px 10px;
      ">
        <h2 style="margin: 0; font-weight: 600;">Document Signing Request</h2>
      </div>

      <div style="padding: 30px;">
        <p style="font-size: 16px; color: #333;">Hello <strong>${safeName}</strong>,</p>

        <p style="font-size: 15px; color: #555; line-height: 1.6;">
          You’ve been requested to sign the document: <br>
          <strong style="color: #4D0080;">${safeSubject}</strong>.
        </p>

        <p style="font-size: 15px; color: #555; line-height: 1.6;">
          <em>Message from sender:</em><br>
          <span style="display: inline-block; background: #f9f9f9; padding: 10px 14px; border-left: 4px solid #4D0080; border-radius: 4px;">
            ${safeMessage}
          </span>
        </p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${signLink}" target="_blank" style="
            background: linear-gradient(90deg, #4D0080, #8E2DE2);
            color: #ffffff;
            padding: 12px 24px;
            border-radius: 6px;
            text-decoration: none;
            font-weight: 600;
            display: inline-block;
            font-size: 16px;
          ">
            ✍️ Review & Sign Document
          </a>
        </div>

        <p style="font-size: 14px; color: #777; text-align: center; line-height: 1.5;">
          If the button doesn’t work, copy and paste this link into your browser:<br>
          <a href="${signLink}" target="_blank" style="color: #4D0080;">${safeLinkText}</a>
        </p>
      </div>

      <div style="
        background-color: #f4f4f7;
        text-align: center;
        padding: 15px;
        font-size: 13px;
        color: #888;
      ">
        © ${new Date().getFullYear()} Draft & Sign. All rights reserved.
      </div>
    </div>
  </div>
`;
};

const signReminderTemplate = (recipientName, envelopeSubject, envelopeMessage, signLink) => {
  const safeName = escapeHtml(recipientName);
  const safeSubject = escapeHtml(envelopeSubject);
  const safeMessage = escapeHtml(envelopeMessage) || 'No message provided.';
  const safeLinkText = escapeHtml(signLink);

  return `
 
   <div style="
    font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    background-color: #f4f4f7;
    padding: 40px 0;
    margin: 0;
  ">
    <div style="
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 10px;
      box-shadow: 0 4px 10px rgba(0,0,0,0.1);
      overflow: hidden;
    ">
      <div style="
        background: linear-gradient(90deg, #4D0080, #8E2DE2);
        color: #ffffff;
        text-align: center;
        padding: 20px 10px;
      ">
        <h2 style="margin: 0; font-weight: 600;">Reminder: Signature Requested</h2>
      </div>

      <div style="padding: 30px;">
        <p style="font-size: 16px; color: #333;">Hello <strong>${safeName}</strong>,</p>

        <p style="font-size: 15px; color: #555; line-height: 1.6;">
          This is a reminder to sign the document:
          <strong style="color: #4D0080;">${safeSubject}</strong>.
        </p>

        <p style="font-size: 15px; color: #555; line-height: 1.6;">
          <em>Message from sender:</em><br>
          <span style="display: inline-block; background: #f9f9f9; padding: 10px 14px; border-left: 4px solid #4D0080; border-radius: 4px;">
            ${safeMessage}
          </span>
        </p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${signLink}" target="_blank" style="
            background: linear-gradient(90deg, #4D0080, #8E2DE2);
            color: #ffffff;
            padding: 12px 24px;
            border-radius: 6px;
            text-decoration: none;
            font-weight: 600;
            display: inline-block;
            font-size: 16px;
          ">
            ✍️ Review & Sign Document
          </a>
        </div>

        <p style="font-size: 14px; color: #777; text-align: center; line-height: 1.5;">
          If the button doesn’t work, copy and paste this link into your browser:<br>
          <a href="${signLink}" target="_blank" style="color: #4D0080;">${safeLinkText}</a>
        </p>
      </div>

      <div style="
        background-color: #f4f4f7;
        text-align: center;
        padding: 15px;
        font-size: 13px;
        color: #888;
      ">
        © ${new Date().getFullYear()} Draft & Sign. All rights reserved.
      </div>
    </div>
  </div>
`;
};

const envelopeCompletedTemplate = (recipientName, envelopeSubject) => {
  const safeName = escapeHtml(recipientName);
  const safeSubject = escapeHtml(envelopeSubject);

  return `
  <div style="
    font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    background-color: #f4f4f7;
    padding: 40px 0;
    margin: 0;
  ">
    <div style="
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 10px;
      box-shadow: 0 4px 10px rgba(0,0,0,0.1);
      overflow: hidden;
    ">

      <div style="
        background: linear-gradient(90deg, #4D0080, #8E2DE2);
        color: #ffffff;
        text-align: center;
        padding: 20px 10px;
      ">
        <h2 style="margin: 0; font-weight: 600;">✅ Document Completed</h2>
      </div>

      <div style="padding: 30px;">

        <p style="font-size: 16px; color: #333;">
          Hello <strong>${safeName}</strong>,
        </p>

        <p style="font-size: 15px; color: #555; line-height: 1.6;">
          The document:
          <strong style="color: #4D0080;">${safeSubject}</strong>
          has been fully signed and successfully completed.
        </p>

        <p style="font-size: 15px; color: #555; line-height: 1.6;">
          You will find the <strong>signed document</strong> along with its
          <strong>completion certificate</strong> attached to this email.
        </p>

        <div style="
          background: #f9f9f9;
          border-left: 4px solid #4D0080;
          padding: 12px 14px;
          border-radius: 4px;
          font-size: 14px;
          color: #555;
          margin-top: 20px;
        ">
          If you have any questions or require further action, feel free to reach out.
        </div>

        <p style="font-size: 15px; color: #555; line-height: 1.6; margin-top: 25px;">
          Thank you for using our service!
        </p>

      </div>

      <div style="
        background-color: #f4f4f7;
        text-align: center;
        padding: 15px;
        font-size: 13px;
        color: #888;
      ">
        © ${new Date().getFullYear()} Draft & Sign. All rights reserved.
      </div>

    </div>
  </div>
`;
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

  return `
  <div style="
    font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    background-color: #f4f4f7;
    padding: 40px 0;
    margin: 0;
  ">
    <div style="
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 12px;
      box-shadow: 0 6px 18px rgba(0,0,0,0.10);
      overflow: hidden;
      border: 1px solid #e9e9ef;
    ">
      <div style="
        background: linear-gradient(90deg, #0f172a, #1f2937);
        color: #ffffff;
        text-align: left;
        padding: 20px 22px;
      ">
        <div style="font-size: 12px; color: #cbd5e1; letter-spacing: 0.4px;">SIGNING REQUEST REASSIGNED</div>
        <h2 style="margin: 6px 0 0; font-weight: 700; font-size: 20px;">Action required: sign document</h2>
      </div>

      <div style="padding: 24px 22px;">
        <p style="font-size: 15px; color: #111827; margin: 0 0 14px;">
          Hello <strong>${safeName}</strong>,
        </p>

        <div style="
          background: #f0f9ff;
          border: 1px solid #bae6fd;
          border-left: 6px solid #0284c7;
          border-radius: 10px;
          padding: 12px 14px;
          margin: 0 0 16px;
          color: #0f172a;
        ">
          <div style="font-size: 13px; color: #075985; margin-bottom: 6px;"><strong>This request was reassigned to you</strong></div>
          <div style="font-size: 14px; line-height: 1.5;">
            Reassigned by: <strong>${safeReassignedByName}</strong>${safeReassignedByEmail ? ` (${safeReassignedByEmail})` : ''}
          </div>
          ${
            safeReason
              ? `<div style="font-size: 14px; line-height: 1.5; margin-top: 6px;">
                   Reason: <span style="color:#0f172a;">${safeReason}</span>
                 </div>`
              : ''
          }
        </div>

        <div style="
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 14px 14px;
          margin-bottom: 18px;
        ">
          <div style="font-size: 12px; color: #6b7280; margin-bottom: 6px;">Document</div>
          <div style="font-size: 15px; color: #111827; font-weight: 700; margin-bottom: 8px;">
            ${safeSubject || 'Untitled document'}
          </div>

          <div style="font-size: 12px; color: #6b7280; margin-bottom: 6px;">Message</div>
          <div style="
            font-size: 14px;
            color: #111827;
            line-height: 1.6;
            background: #f9fafb;
            border: 1px solid #eef2f7;
            border-radius: 10px;
            padding: 10px 12px;
            white-space: pre-wrap;
          ">
            ${safeMessage}
          </div>
        </div>

        <div style="text-align: center; margin: 18px 0 12px;">
          <a href="${signLink}" target="_blank" style="
            background: linear-gradient(90deg, #2563eb, #1d4ed8);
            color: #ffffff;
            padding: 12px 22px;
            border-radius: 10px;
            text-decoration: none;
            font-weight: 700;
            display: inline-block;
            font-size: 15px;
          ">
            Review and sign
          </a>
        </div>

        <p style="font-size: 13px; color: #6b7280; text-align: center; line-height: 1.5; margin: 0;">
          If the button doesn’t work, copy and paste this link into your browser:<br>
          <a href="${signLink}" target="_blank" style="color: #1d4ed8; word-break: break-all;">${safeLinkText}</a>
        </p>
      </div>

      <div style="
        background-color: #f4f4f7;
        text-align: center;
        padding: 15px;
        font-size: 13px;
        color: #888;
      ">
        © ${new Date().getFullYear()} Draft & Sign. All rights reserved.
      </div>
    </div>
  </div>
`;
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

  return `
  <div style="
    font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    background-color: #f4f4f7;
    padding: 40px 0;
    margin: 0;
  ">
    <div style="
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 12px;
      box-shadow: 0 6px 18px rgba(0,0,0,0.10);
      overflow: hidden;
      border: 1px solid #e9e9ef;
    ">
      <div style="
        background: linear-gradient(90deg, #0f172a, #1f2937);
        color: #ffffff;
        text-align: left;
        padding: 20px 22px;
      ">
        <div style="font-size: 12px; color: #cbd5e1; letter-spacing: 0.4px;">SIGNING REQUEST REASSIGNED</div>
        <h2 style="margin: 6px 0 0; font-weight: 700; font-size: 20px;">You are now a carbon copy (CC)</h2>
      </div>

      <div style="padding: 24px 22px;">
        <p style="font-size: 15px; color: #111827; margin: 0 0 14px;">
          Hello <strong>${safeOwnerName}</strong>,
        </p>

        <div style="
          background: #fffbeb;
          border: 1px solid #fde68a;
          border-left: 6px solid #f59e0b;
          border-radius: 10px;
          padding: 12px 14px;
          margin: 0 0 16px;
          color: #0f172a;
        ">
          <div style="font-size: 13px; color: #92400e; margin-bottom: 6px;"><strong>Signing responsibility transferred</strong></div>
          <div style="font-size: 14px; line-height: 1.5;">
            You reassigned signing for <strong>${safeSubject}</strong> to
            <strong>${safeReplacementName}</strong>
            ${safeReplacementEmail ? `(${safeReplacementEmail})` : ''}.
          </div>
          ${
            safeReason
              ? `<div style="font-size: 14px; line-height: 1.5; margin-top: 6px;">
                   Reason: <span style="color:#0f172a;">${safeReason}</span>
                 </div>`
              : ''
          }
        </div>

        <div style="
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          border-radius: 12px;
          padding: 12px 14px;
          margin-bottom: 18px;
          color: #0f172a;
        ">
          <div style="font-size: 13px; font-weight: 700; color: #166534; margin-bottom: 6px;">What happens now?</div>
          <ul style="margin: 0; padding-left: 18px; font-size: 14px; color: #0f172a; line-height: 1.6;">
            <li>You no longer need to sign this document.</li>
            <li>You will receive updates as a <strong>CC (view-only)</strong> recipient.</li>
            <li>You can still open the document to view its status.</li>
          </ul>
        </div>

        ${
          viewLink
            ? `<div style="text-align:center; margin: 18px 0 12px;">
                 <a href="${viewLink}" target="_blank" style="
                   background: linear-gradient(90deg, #2563eb, #1d4ed8);
                   color: #ffffff;
                   padding: 12px 22px;
                   border-radius: 10px;
                   text-decoration: none;
                   font-weight: 700;
                   display: inline-block;
                   font-size: 15px;
                 ">
                   View document status
                 </a>
               </div>
               <p style="font-size: 13px; color: #6b7280; text-align: center; line-height: 1.5; margin: 0;">
                 If the button doesn’t work, copy and paste this link into your browser:<br>
                 <a href="${viewLink}" target="_blank" style="color: #1d4ed8; word-break: break-all;">${safeViewLinkText}</a>
               </p>`
            : ''
        }
      </div>

      <div style="
        background-color: #f4f4f7;
        text-align: center;
        padding: 15px;
        font-size: 13px;
        color: #888;
      ">
        © ${new Date().getFullYear()} Draft & Sign. All rights reserved.
      </div>
    </div>
  </div>
`;
};


module.exports = {
  signRequestTemplate,
  envelopeCompletedTemplate,
  signReminderTemplate,
  reassignedSignRequestTemplate,
  reassignedOwnerCcTemplate,
};
