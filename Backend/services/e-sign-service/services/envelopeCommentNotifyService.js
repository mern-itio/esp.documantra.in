const axios = require('axios');
const Envelope = require('../models/Envelope');
const Notification = require('../models/Notification');
const { documentCommentNotificationTemplate, documentCommentReplyTemplate } = require('../emails/emailTemplates');
const { logActivity } = require('./activityLogService');
const { buildPublicSignerUrl } = require('../helpers/signerAccessToken');

async function fetchUserEmail(userId, authorizationHeader) {
  if (!userId) return '';
  try {
    const resp = await axios.get(`${process.env.AUTH_URL}/api/user-details/${userId}`, {
      headers: authorizationHeader ? { Authorization: authorizationHeader } : {},
      timeout: 15000,
    });
    return String(resp?.data?.data?.email || '').trim();
  } catch {
    return '';
  }
}

async function fetchUserFullname(userId, authorizationHeader) {
  if (!userId) return '';
  try {
    const resp = await axios.get(`${process.env.AUTH_URL}/api/user-details/${userId}`, {
      headers: authorizationHeader ? { Authorization: authorizationHeader } : {},
      timeout: 15000,
    });
    const data = resp?.data?.data || {};
    return String(data.fullname || data.name || '').trim();
  } catch {
    return '';
  }
}

async function dispatchEnvelopeEmail({ userId, toEmail, subject, html }) {
  const emailServiceUrl = process.env.EMAIL_SERVICE_URL;
  if (!emailServiceUrl || !toEmail) return;

  const mongoose = require('mongoose');
  const validUserId =
    userId &&
    userId !== 'undefined' &&
    userId !== 'null' &&
    mongoose.Types.ObjectId.isValid(String(userId));

  const mailPath = validUserId
    ? `${emailServiceUrl}/mail/send/${userId}`
    : `${emailServiceUrl}/mail/send-by-system`;
  const mailBody = validUserId
    ? { toEmail, subject, html }
    : { to: toEmail, subject, html };

  await axios.post(mailPath, mailBody, { timeout: 90000 });
}

async function notifySenderNewComment({ envelopeId, comment, authorizationHeader }) {
  const envelope = await Envelope.findById(envelopeId).select('sender subject').lean();
  if (!envelope?.sender) return;

  const senderEmail = await fetchUserEmail(envelope.sender, authorizationHeader);
  const envelopeSubject = envelope.subject || 'Document';
  const authorName = comment.authorName || comment.authorEmail || 'A signer';
  const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/+$/, '');
  const viewLink = `${frontendUrl}/e-sign/envelope/${envelopeId}?section=comments`;

  try {
    await Notification.create({
      userId: envelope.sender.toString(),
      envelopeId,
      recipientId: comment.recipientId,
      recipientName: authorName,
      envelopeSubject,
      type: 'document_comment',
      message: `${authorName} added a comment on "${envelopeSubject}"`,
    });
  } catch (err) {
    console.error('notifySenderNewComment notification error:', err);
  }

  try {
    await logActivity(envelopeId, 'COMMENT_ADDED', 'Recipient', {
      commentId: comment._id,
      recipientId: comment.recipientId,
      page: comment.page,
      authorName,
    });
  } catch (err) {
    console.error('notifySenderNewComment activity log error:', err);
  }

  if (!senderEmail) return;

  try {
    const html = documentCommentNotificationTemplate({
      ownerName: 'there',
      envelopeSubject,
      authorName,
      commentMessage: comment.message,
      selectedText: comment.selectedText,
      viewLink,
    });
    await dispatchEnvelopeEmail({
      userId: envelope.sender,
      toEmail: senderEmail,
      subject: `New document comment on "${envelopeSubject}"`,
      html,
    });
  } catch (err) {
    console.error('notifySenderNewComment email error:', err);
  }
}

async function notifyRecipientSenderReply({ envelopeId, comment, replyMessage, senderName }) {
  const envelope = await Envelope.findById(envelopeId).select('sender subject').lean();
  if (!envelope || !comment?.authorEmail) return;

  const signLink = buildPublicSignerUrl(envelopeId, comment.recipientId);
  const envelopeSubject = envelope.subject || 'Document';

  try {
    const html = documentCommentReplyTemplate({
      recipientName: comment.authorName || 'Signer',
      envelopeSubject,
      senderName: senderName || 'Sender',
      replyMessage,
      selectedText: comment.selectedText,
      signLink,
    });
    await dispatchEnvelopeEmail({
      userId: envelope.sender,
      toEmail: comment.authorEmail,
      subject: `Reply to your comment on "${envelopeSubject}"`,
      html,
    });
  } catch (err) {
    console.error('notifyRecipientSenderReply email error:', err);
  }
}

async function notifySenderRecipientReply({
  envelopeId,
  comment,
  replyMessage,
  authorName,
  authorizationHeader,
}) {
  const envelope = await Envelope.findById(envelopeId).select('sender subject').lean();
  if (!envelope?.sender) return;

  const senderEmail = await fetchUserEmail(envelope.sender, authorizationHeader);
  const envelopeSubject = envelope.subject || 'Document';
  const signerName = authorName || comment.authorName || 'A signer';
  const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/+$/, '');
  const viewLink = `${frontendUrl}/e-sign/envelope/${envelopeId}?section=comments`;

  try {
    await Notification.create({
      userId: envelope.sender.toString(),
      envelopeId,
      recipientId: comment.recipientId,
      recipientName: signerName,
      envelopeSubject,
      type: 'document_comment',
      message: `${signerName} replied to a comment on "${envelopeSubject}"`,
    });
  } catch (err) {
    console.error('notifySenderRecipientReply notification error:', err);
  }

  if (!senderEmail) return;

  try {
    const html = documentCommentNotificationTemplate({
      ownerName: 'there',
      envelopeSubject,
      authorName: signerName,
      commentMessage: replyMessage,
      selectedText: comment.selectedText,
      viewLink,
    });
    await dispatchEnvelopeEmail({
      userId: envelope.sender,
      toEmail: senderEmail,
      subject: `Reply on document comment — "${envelopeSubject}"`,
      html,
    });
  } catch (err) {
    console.error('notifySenderRecipientReply email error:', err);
  }
}

module.exports = {
  notifySenderNewComment,
  notifyRecipientSenderReply,
  notifySenderRecipientReply,
  fetchUserEmail,
  fetchUserFullname,
};
