const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  title: {
    type: String,
    default: 'New Chat'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  messages: [{
    role: {
      type: String,
      enum: ['user', 'assistant', 'system'],
      required: true
    },
    content: {
      type: String,
      required: true
    },
    action: {
      type: String,
      enum: ['search_document', 'send_document', 'prepare_document', 'create_and_send_envelope', 'clarification', 'list_auth_providers', 'generate_document', 'list_documents_by_category', 'list_shared_documents', 'list_signed_documents', 'select_document', null],
      default: null
    },
    parameters: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  lastDocumentList: [{
    index: Number,
    id: String,
    name: String,
    category: String
  }],
  selectedDocument: {
    id: String,
    name: String,
    category: String,
    serviceType: String, // 'e-sign-service' or 'document-service'
    docType: String, // 'envelope' or 'document'
    envelopeId: String, // For e-sign service documents
    documentId: String // For document service documents
  },
  recipientMappings: [{
    name: {
      type: String,
      required: true,
      lowercase: true // Store lowercase for case-insensitive matching
    },
    email: {
      type: String,
      required: true
    },
    lastUsed: {
      type: Date,
      default: Date.now
    }
  }],
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

conversationSchema.index({ userId: 1, updatedAt: -1 });

module.exports = mongoose.model('Conversation', conversationSchema);

