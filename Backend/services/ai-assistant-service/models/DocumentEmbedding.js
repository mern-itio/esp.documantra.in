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

// Indexes for vector search and queries
documentEmbeddingSchema.index({ ownerId: 1, documentId: 1 });
documentEmbeddingSchema.index({ ownerId: 1, 'metadata.category': 1 });
documentEmbeddingSchema.index({ ownerId: 1, 'metadata.recipientEmail': 1 });
documentEmbeddingSchema.index({ ownerId: 1, 'metadata.tags': 1 });
documentEmbeddingSchema.index({ ownerId: 1, updatedAt: -1 });

// Note: MongoDB Atlas Vector Search index must be created manually in Atlas UI
// When creating the index in Atlas, paste ONLY this in JSON Editor:
// {
//   "fields": [
//     {
//       "type": "vector",
//       "path": "embedding",
//       "numDimensions": 1536,
//       "similarity": "cosine"
//     }
//   ]
// }
// MongoDB Atlas will automatically add name, type, and wrap in definition

module.exports = mongoose.model('DocumentEmbedding', documentEmbeddingSchema);

