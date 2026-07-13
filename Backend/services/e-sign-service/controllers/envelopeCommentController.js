const mongoose = require('mongoose');
const Envelope = require('../models/Envelope');
const Recipient = require('../models/Recipient');
const RecipientPermission = require('../models/RecipientPermission');
const EnvelopeComment = require('../models/EnvelopeComment');
const {
  notifySenderNewComment,
  notifyRecipientSenderReply,
  notifySenderRecipientReply,
} = require('../services/envelopeCommentNotifyService');
const { logActivity } = require('../services/activityLogService');

function toObjectId(value) {
  if (!value) return null;
  if (value instanceof mongoose.Types.ObjectId) return value;
  if (!mongoose.Types.ObjectId.isValid(String(value))) return null;
  return new mongoose.Types.ObjectId(String(value));
}

function clampPercent(value) {
  const num = Number(value);
  if (Number.isNaN(num)) return 0;
  return Math.min(100, Math.max(0, num));
}

function normalizeAnchor(anchor = {}) {
  return {
    xPercent: clampPercent(anchor.xPercent),
    yPercent: clampPercent(anchor.yPercent),
    widthPercent: clampPercent(anchor.widthPercent),
    heightPercent: clampPercent(anchor.heightPercent),
  };
}

async function assertEnvelopeDocument(envelopeId, documentId) {
  const envelope = await Envelope.findById(envelopeId).select('documentIds status').lean();
  if (!envelope) {
    return { ok: false, status: 404, message: 'Envelope not found' };
  }

  const docId = String(documentId);
  const belongs = (envelope.documentIds || []).some((id) => String(id) === docId);
  if (!belongs) {
    return { ok: false, status: 400, message: 'Document does not belong to this envelope' };
  }

  return { ok: true, envelope };
}

async function assertRecipientOnEnvelope(envelopeId, recipientId) {
  const permission = await RecipientPermission.findOne({ envelopeId, recipientId })
    .select('role status')
    .lean();
  if (!permission) {
    return { ok: false, status: 404, message: 'Recipient access not found' };
  }

  const recipient = await Recipient.findById(recipientId).select('name email').lean();
  if (!recipient) {
    return { ok: false, status: 404, message: 'Recipient not found' };
  }

  return { ok: true, recipient, permission };
}

async function fetchCommentsForEnvelope(envelopeId, documentId) {
  const filter = { envelopeId: toObjectId(envelopeId) };
  if (documentId) {
    const docObjectId = toObjectId(documentId);
    if (!docObjectId) {
      return { ok: false, status: 400, message: 'Invalid documentId' };
    }
    const docCheck = await assertEnvelopeDocument(envelopeId, docObjectId);
    if (!docCheck.ok) {
      return { ok: false, status: docCheck.status, message: docCheck.message };
    }
    filter.documentId = docObjectId;
  }

  const comments = await EnvelopeComment.find(filter).sort({ createdAt: 1 }).lean();
  return { ok: true, comments };
}

async function markCommentResolved(comment, resolvedByType) {
  comment.status = 'resolved';
  comment.resolvedAt = new Date();
  comment.resolvedByType = resolvedByType;
  await comment.save();
  return comment;
}

const listEnvelopeComments = async (req, res) => {
  try {
    const { envelopeId, recipientId } = req.params;

    const recipientCheck = await assertRecipientOnEnvelope(envelopeId, recipientId);
    if (!recipientCheck.ok) {
      return res.status(recipientCheck.status).json({
        status: 'error',
        message: recipientCheck.message,
      });
    }

    const result = await fetchCommentsForEnvelope(envelopeId, req.query.documentId);
    if (!result.ok) {
      return res.status(result.status).json({ status: 'error', message: result.message });
    }

    return res.status(200).json({
      status: 'success',
      comments: result.comments,
    });
  } catch (error) {
    console.error('listEnvelopeComments error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to load comments',
    });
  }
};

const listEnvelopeCommentsForSender = async (req, res) => {
  try {
    const envelopeId = req.params.envelopeId || req.params.id;
    const result = await fetchCommentsForEnvelope(envelopeId, req.query.documentId);
    if (!result.ok) {
      return res.status(result.status).json({ status: 'error', message: result.message });
    }

    return res.status(200).json({
      status: 'success',
      comments: result.comments,
    });
  } catch (error) {
    console.error('listEnvelopeCommentsForSender error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to load comments',
    });
  }
};

const createEnvelopeComment = async (req, res) => {
  try {
    const { envelopeId, recipientId } = req.params;
    const {
      documentId,
      page,
      anchor,
      selectedText = '',
      message,
    } = req.body || {};

    const recipientCheck = await assertRecipientOnEnvelope(envelopeId, recipientId);
    if (!recipientCheck.ok) {
      return res.status(recipientCheck.status).json({
        status: 'error',
        message: recipientCheck.message,
      });
    }

    const role = String(recipientCheck.permission?.role || '').toLowerCase();
    if (role === 'carbon_copy' || role === 'cc') {
      return res.status(403).json({
        status: 'error',
        message: 'CC recipients cannot add document comments',
      });
    }

    const docObjectId = toObjectId(documentId);
    if (!docObjectId) {
      return res.status(400).json({ status: 'error', message: 'Valid documentId is required' });
    }

    const docCheck = await assertEnvelopeDocument(envelopeId, docObjectId);
    if (!docCheck.ok) {
      return res.status(docCheck.status).json({ status: 'error', message: docCheck.message });
    }

    const pageNumber = Number(page);
    if (!Number.isInteger(pageNumber) || pageNumber < 1) {
      return res.status(400).json({ status: 'error', message: 'Valid page number is required' });
    }

    const trimmedMessage = String(message || '').trim();
    if (!trimmedMessage) {
      return res.status(400).json({ status: 'error', message: 'Comment message is required' });
    }
    if (trimmedMessage.length > 2000) {
      return res.status(400).json({ status: 'error', message: 'Comment message is too long' });
    }

    const normalizedAnchor = normalizeAnchor(anchor);
    if (normalizedAnchor.widthPercent <= 0 || normalizedAnchor.heightPercent <= 0) {
      return res.status(400).json({ status: 'error', message: 'Valid anchor is required' });
    }

    const comment = await EnvelopeComment.create({
      envelopeId: toObjectId(envelopeId),
      documentId: docObjectId,
      recipientId: toObjectId(recipientId),
      authorName: recipientCheck.recipient.name || '',
      authorEmail: recipientCheck.recipient.email || '',
      page: pageNumber,
      anchor: normalizedAnchor,
      selectedText: String(selectedText || '').trim().slice(0, 5000),
      message: trimmedMessage,
      status: 'open',
      replies: [],
    });

    notifySenderNewComment({
      envelopeId,
      comment: comment.toObject ? comment.toObject() : comment,
      authorizationHeader: req.headers?.authorization || '',
    }).catch((err) => console.error('notifySenderNewComment async error:', err));

    return res.status(201).json({
      status: 'success',
      comment,
    });
  } catch (error) {
    console.error('createEnvelopeComment error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to create comment',
    });
  }
};

const resolveEnvelopeComment = async (req, res) => {
  try {
    const { envelopeId, recipientId, commentId } = req.params;

    const recipientCheck = await assertRecipientOnEnvelope(envelopeId, recipientId);
    if (!recipientCheck.ok) {
      return res.status(recipientCheck.status).json({
        status: 'error',
        message: recipientCheck.message,
      });
    }

    const commentObjectId = toObjectId(commentId);
    if (!commentObjectId) {
      return res.status(400).json({ status: 'error', message: 'Invalid comment id' });
    }

    const comment = await EnvelopeComment.findOne({
      _id: commentObjectId,
      envelopeId: toObjectId(envelopeId),
    });

    if (!comment) {
      return res.status(404).json({ status: 'error', message: 'Comment not found' });
    }

    await markCommentResolved(comment, 'recipient');

    return res.status(200).json({
      status: 'success',
      comment,
    });
  } catch (error) {
    console.error('resolveEnvelopeComment error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to resolve comment',
    });
  }
};

const resolveEnvelopeCommentBySender = async (req, res) => {
  try {
    const envelopeId = req.params.envelopeId || req.params.id;
    const { commentId } = req.params;

    const commentObjectId = toObjectId(commentId);
    if (!commentObjectId) {
      return res.status(400).json({ status: 'error', message: 'Invalid comment id' });
    }

    const comment = await EnvelopeComment.findOne({
      _id: commentObjectId,
      envelopeId: toObjectId(envelopeId),
    });

    if (!comment) {
      return res.status(404).json({ status: 'error', message: 'Comment not found' });
    }

    await markCommentResolved(comment, 'sender');

    try {
      await logActivity(envelopeId, 'COMMENT_RESOLVED', 'Sender', {
        commentId: comment._id,
        resolvedByType: 'sender',
      });
    } catch (_) {}

    return res.status(200).json({
      status: 'success',
      comment,
    });
  } catch (error) {
    console.error('resolveEnvelopeCommentBySender error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to resolve comment',
    });
  }
};

const replyToEnvelopeCommentBySender = async (req, res) => {
  try {
    const envelopeId = req.params.envelopeId || req.params.id;
    const { commentId } = req.params;
    const message = String(req.body?.message || '').trim();

    if (!message) {
      return res.status(400).json({ status: 'error', message: 'Reply message is required' });
    }
    if (message.length > 2000) {
      return res.status(400).json({ status: 'error', message: 'Reply message is too long' });
    }

    const commentObjectId = toObjectId(commentId);
    if (!commentObjectId) {
      return res.status(400).json({ status: 'error', message: 'Invalid comment id' });
    }

    const comment = await EnvelopeComment.findOne({
      _id: commentObjectId,
      envelopeId: toObjectId(envelopeId),
    });

    if (!comment) {
      return res.status(404).json({ status: 'error', message: 'Comment not found' });
    }

    const senderName =
      req?.user?.data?.fullname ||
      req?.user?.data?.name ||
      req?.user?.fullname ||
      'Sender';

    comment.replies.push({
      authorType: 'sender',
      authorName: senderName,
      message,
      createdAt: new Date(),
    });
    await comment.save();

    notifyRecipientSenderReply({
      envelopeId,
      comment: comment.toObject ? comment.toObject() : comment,
      replyMessage: message,
      senderName,
    }).catch((err) => console.error('notifyRecipientSenderReply async error:', err));

    try {
      await logActivity(envelopeId, 'COMMENT_REPLIED', 'Sender', {
        commentId: comment._id,
        senderName,
      });
    } catch (_) {}

    return res.status(200).json({
      status: 'success',
      comment,
    });
  } catch (error) {
    console.error('replyToEnvelopeCommentBySender error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to reply to comment',
    });
  }
};

const replyToEnvelopeCommentByRecipient = async (req, res) => {
  try {
    const { envelopeId, recipientId, commentId } = req.params;
    const message = String(req.body?.message || '').trim();

    if (!message) {
      return res.status(400).json({ status: 'error', message: 'Reply message is required' });
    }
    if (message.length > 2000) {
      return res.status(400).json({ status: 'error', message: 'Reply message is too long' });
    }

    const recipientCheck = await assertRecipientOnEnvelope(envelopeId, recipientId);
    if (!recipientCheck.ok) {
      return res.status(recipientCheck.status).json({
        status: 'error',
        message: recipientCheck.message,
      });
    }

    const role = String(recipientCheck.permission?.role || '').toLowerCase();
    if (role === 'carbon_copy' || role === 'cc') {
      return res.status(403).json({
        status: 'error',
        message: 'CC recipients cannot reply to document comments',
      });
    }

    const commentObjectId = toObjectId(commentId);
    if (!commentObjectId) {
      return res.status(400).json({ status: 'error', message: 'Invalid comment id' });
    }

    const comment = await EnvelopeComment.findOne({
      _id: commentObjectId,
      envelopeId: toObjectId(envelopeId),
    });

    if (!comment) {
      return res.status(404).json({ status: 'error', message: 'Comment not found' });
    }

    if (String(comment.recipientId) !== String(recipientId)) {
      return res.status(403).json({
        status: 'error',
        message: 'You can only reply to your own comment thread',
      });
    }

    if (comment.status === 'resolved') {
      return res.status(400).json({
        status: 'error',
        message: 'This suggestion has been resolved',
      });
    }

    const authorName = recipientCheck.recipient.name || recipientCheck.recipient.email || 'Signer';

    comment.replies.push({
      authorType: 'recipient',
      authorName,
      message,
      createdAt: new Date(),
    });
    await comment.save();

    notifySenderRecipientReply({
      envelopeId,
      comment: comment.toObject ? comment.toObject() : comment,
      replyMessage: message,
      authorName,
      authorizationHeader: req.headers?.authorization || '',
    }).catch((err) => console.error('notifySenderRecipientReply async error:', err));

    try {
      await logActivity(envelopeId, 'COMMENT_REPLIED', 'Recipient', {
        commentId: comment._id,
        authorName,
      });
    } catch (_) {}

    return res.status(200).json({
      status: 'success',
      comment,
    });
  } catch (error) {
    console.error('replyToEnvelopeCommentByRecipient error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to reply to comment',
    });
  }
};

module.exports = {
  listEnvelopeComments,
  listEnvelopeCommentsForSender,
  createEnvelopeComment,
  resolveEnvelopeComment,
  resolveEnvelopeCommentBySender,
  replyToEnvelopeCommentBySender,
  replyToEnvelopeCommentByRecipient,
};
