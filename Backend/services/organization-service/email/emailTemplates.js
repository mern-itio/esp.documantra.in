const { getBrandName, renderEmailLogoHeader } = require('@draftnsign/validators/brandConfig');

const inviteTemplate = (recipientName, emailSubject, emailMessage, link, LinkButtonText='Click Here') => `
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
      <div style="padding: 24px 24px 0; text-align: center;">
        ${renderEmailLogoHeader()}
      </div>
      <div style="
        background: linear-gradient(90deg, #4D0080, #8E2DE2);
        color: #ffffff;
        text-align: center;
        padding: 20px 10px;
      ">
        <h2 style="margin: 0; font-weight: 600;">${emailSubject}</h2>
      </div>

      <div style="padding: 30px;">
        <p style="font-size: 16px; color: #333;">Hello <strong>${recipientName}</strong>,</p>

        <p style="font-size: 15px; color: #555; line-height: 1.6;">
          <strong style="color: #4D0080;">${emailSubject}</strong>.
        </p>

        <p style="font-size: 15px; color: #555; line-height: 1.6;">
          <em>Message from sender:</em><br>
          <span style="display: inline-block; background: #f9f9f9; padding: 10px 14px; border-left: 4px solid #4D0080; border-radius: 4px;">
            ${emailMessage || "No message provided."}
          </span>
        </p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${link}" target="_blank" style="
            background: linear-gradient(90deg, #4D0080, #8E2DE2);
            color: #ffffff;
            padding: 12px 24px;
            border-radius: 6px;
            text-decoration: none;
            font-weight: 600;
            display: inline-block;
            font-size: 16px;
          ">
            ${LinkButtonText || 'Click Here'}
          </a>
        </div>

        <p style="font-size: 14px; color: #777; text-align: center; line-height: 1.5;">
          If the button doesn’t work, copy and paste this link into your browser:<br>
          <a href="${link}" target="_blank" style="color: #4D0080;">${link}</a>
        </p>
      </div>

      <div style="
        background-color: #f4f4f7;
        text-align: center;
        padding: 15px;
        font-size: 13px;
        color: #888;
      ">
        © ${new Date().getFullYear()} ${getBrandName()}. All rights reserved.
      </div>
    </div>
  </div>
`;
module.exports = {
  inviteTemplate
};
