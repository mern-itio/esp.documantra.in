const nodemailer = require("nodemailer");
require("dotenv").config(); // <-- make sure env vars are loaded

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Send an email using a provided template
 * @param to - recipient email
 * @param subject - email subject
 * @param html - html content of email
 */
const sendEmail = async (to, subject, html) => {
  if (!to) throw new Error("Recipient email not provided");

  const mailOptions = {
    from: `"${process.env.SENDER_NAME}" <${process.env.SENDER_EMAIL}>`,
    to,
    subject,
    html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent to:", to, "MessageId:", info.messageId);
    return info;
  } catch (error) {
    console.error("Failed to send email:", error);
    throw error;
  }
};

module.exports = sendEmail;
