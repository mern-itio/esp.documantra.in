const mongoose = require('mongoose');

const documentEmbeddingSchema = new mongoose.Schema({
  documentId: {
    type: String,
    required: true,
    index: true
  },
  documentName: {
    type: String,
    required: true
  },
  documentType: {
    type: String,
    enum: ['document', 'envelope', 'esign'],
    default: 'document'
  },
  serviceType: {
    type: String,
    enum: ['document-service', 'e-sign-service'],
    default: 'document-service'
  },
  ownerId: {
    type: String,
    required: true,
    index: true
  },
  content: {
    type: String,
    default: ''
  },
  metadata: {
    recipientName: String,
    recipientEmail: String,
    category: String,
    tags: [String],
    description: String,
    folderId: String,
    createdAt: Date,
    updatedAt: Date
  },
  embedding: {
    type: [Number],
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for vector search (if using MongoDB Atlas Vector Search)
documentEmbeddingSchema.index({ embedding: '2dsphere' });
documentEmbeddingSchema.index({ ownerId: 1, documentId: 1 });

module.exports = mongoose.model('DocumentEmbedding', documentEmbeddingSchema);

