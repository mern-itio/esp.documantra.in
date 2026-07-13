const mongoose = require('mongoose');

const AnchorSchema = new mongoose.Schema(
  {
    xPercent: { type: Number, required: true, min: 0, max: 100 },
    yPercent: { type: Number, required: true, min: 0, max: 100 },
    widthPercent: { type: Number, required: true, min: 0, max: 100 },
    heightPercent: { type: Number, required: true, min: 0, max: 100 },
  },
  { _id: false },
);

const CommentReplySchema = new mongoose.Schema(
  {
    authorType: { type: String, enum: ['sender', 'recipient'], required: true },
    authorName: { type: String, trim: true, default: '' },
    message: { type: String, trim: true, required: true, maxlength: 2000 },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true },
);

const EnvelopeCommentSchema = new mongoose.Schema(
  {
    envelopeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Envelope',
      required: true,
      index: true,
    },
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
      required: true,
      index: true,
    },
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Recipient',
      required: true,
      index: true,
    },
    authorName: { type: String, trim: true, default: '' },
    authorEmail: { type: String, trim: true, lowercase: true, default: '' },
    page: { type: Number, required: true, min: 1 },
    anchor: { type: AnchorSchema, required: true },
    selectedText: { type: String, trim: true, default: '', maxlength: 5000 },
    message: { type: String, trim: true, required: true, maxlength: 2000 },
    status: { type: String, enum: ['open', 'resolved'], default: 'open', index: true },
    replies: { type: [CommentReplySchema], default: [] },
    resolvedAt: { type: Date, default: null },
    resolvedByType: { type: String, enum: ['sender', 'recipient', null], default: null },
  },
  { timestamps: true },
);

EnvelopeCommentSchema.index({ envelopeId: 1, documentId: 1, page: 1, createdAt: -1 });

module.exports = mongoose.model('EnvelopeComment', EnvelopeCommentSchema);
