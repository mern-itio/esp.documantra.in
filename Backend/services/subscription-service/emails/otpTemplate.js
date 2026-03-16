// emailTemplates.js

const otpTemplate = (recipientName, otp_code) => `
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
        <p style="font-size: 16px; color: #333;">Hello <strong>${recipientName}</strong>,</p>

        <p style="font-size: 15px; color: #555; line-height: 1.6;">
          <span style="display: inline-block; background: #f9f9f9; padding: 10px 14px; border-left: 4px solid #4D0080; border-radius: 4px;">
            Your One-Time Password (OTP) for verification is: <strong style="color: #4D0080; font-size: 18px;">${otp_code}</strong>
          </span>
        </p>
        <p style="font-size: 15px; color: #555; line-height: 1.6;">
         If you did not request this verification, please ignore this email.
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


module.exports = {
  otpTemplate
};
