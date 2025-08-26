// emailTemplates.js

const signRequestTemplate = (recipientName, envelopeSubject, envelopeMessage, signLink) => `
  <p>Hello ${recipientName},</p>
  <p>You have been requested to sign the document: <strong>${envelopeSubject}</strong>.</p>
  <p>Message from sender: ${envelopeMessage || "No message"}</p>
  <p>Please click the link below to review and sign:</p>
  <p><a href="${signLink}" target="_blank">Sign Document</a></p>
  <p>Thank you!</p>
`;

const envelopeCompletedTemplate = (recipientName, envelopeSubject) => `
  <p>Hello ${recipientName},</p>
  <p>The document <strong>${envelopeSubject}</strong> has been fully signed and completed.</p>
  <p>Thank you for your action!</p>
`;

module.exports = {
  signRequestTemplate,
  envelopeCompletedTemplate,
};
