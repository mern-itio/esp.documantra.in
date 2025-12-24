const DocumentEmbedding = require('../models/DocumentEmbedding');
const embeddingService = require('./embeddingService');
const axios = require('axios');
class RAGService {
  constructor() {
    this.documentServiceUrl = process.env.DOCUMENT_SERVICE_URL || 'http://localhost:2102';
    this.eSignServiceUrl = process.env.ESIGN_SERVICE_URL || 'http://localhost:2103';
  }
  // Index a document for vector search
  async indexDocument(documentData, userId) {
    try {
      // Create searchable text from document metadata
      const searchableText = this.buildSearchableText(documentData);
      // Check if embedding already exists to avoid regenerating
      const existing = await DocumentEmbedding.findOne({
        documentId: documentData.id,
        ownerId: userId
      });
      let embedding;
      if (existing && existing.embedding && existing.embedding.length > 0) {
        embedding = existing.embedding;
      } else {
        try {
          embedding = await embeddingService.generateEmbedding(searchableText);
        } catch (embeddingError) {
          if (embeddingError.status === 429 || embeddingError.message?.includes('quota') || embeddingError.message?.includes('rate limit')) {
            console.warn('Embedding API quota exceeded. Storing document metadata only (no embedding).');
            embedding = [];
          } else {
            throw embeddingError;
          }
        }
      }
      const docEmbedding = await DocumentEmbedding.findOneAndUpdate(
        { documentId: documentData.id, ownerId: userId },
        {
          documentId: documentData.id,
          documentName: documentData.name || documentData.title || '',
          documentType: documentData.documentType || documentData.type || 'document',
          serviceType: documentData.serviceType || 'document-service',
          ownerId: userId,
          content: searchableText,
          metadata: {
            recipientName: documentData.recipientName,
            recipientEmail: documentData.recipientEmail,
            category: documentData.category,
            tags: documentData.tags || [],
            description: documentData.description || '',
            folderId: documentData.folderId,
            createdAt: documentData.createdAt,
            updatedAt: documentData.updatedAt
          },
          embedding: embedding,
          updatedAt: new Date()
        },
        { upsert: true, new: true }
      );
      return docEmbedding;
    } catch (error) {
      console.error('Error indexing document:', error);
      throw error;
    }
  }
  buildSearchableText(documentData) {
    const parts = [];
    if (documentData.name || documentData.title) {
      parts.push(documentData.name || documentData.title);
    }
    if (documentData.description) {
      parts.push(documentData.description);
    }
    if (documentData.recipientName) {
      parts.push(`sent to ${documentData.recipientName}`);
    }
    if (documentData.recipientEmail) {
      parts.push(`sent to ${documentData.recipientEmail}`);
    }
    if (documentData.category) {
      parts.push(`category: ${documentData.category}`);
    }
    if (documentData.tags && documentData.tags.length > 0) {
      parts.push(`tags: ${documentData.tags.join(', ')}`);
    }
    if (documentData.content) {
      parts.push(documentData.content);
    }
    return parts.join(' ');
  }
  async vectorSearch(query, userId, options = {}) {
    try {
      const {
        limit = 10,
        recipientName = null,
        recipientEmail = null,
        category = null,
        tags = [],
        dateFrom = null,
        dateTo = null,
        skipEmbedding = false 
      } = options;
      let queryEmbedding;
      try {
        queryEmbedding = await embeddingService.generateEmbedding(query);
      } catch (embeddingError) {
        if (embeddingError.status === 429 || embeddingError.message?.includes('quota') || embeddingError.message?.includes('rate limit')) {
          console.warn('Embedding API quota exceeded. Falling back to metadata-only search.');
          return this.metadataOnlySearch(query, userId, options);
        }
        throw embeddingError;
      }
      let queryFilter = { ownerId: userId };
      if (recipientName) {
        queryFilter['metadata.recipientName'] = { $regex: recipientName, $options: 'i' };
      }
      if (recipientEmail) {
        queryFilter['metadata.recipientEmail'] = { $regex: recipientEmail, $options: 'i' };
      }
      if (category) {
        queryFilter['metadata.category'] = category;
      }
      if (tags.length > 0) {
        queryFilter['metadata.tags'] = { $in: tags };
      }
      if (dateFrom || dateTo) {
        queryFilter['metadata.createdAt'] = {};
        if (dateFrom) queryFilter['metadata.createdAt'].$gte = new Date(dateFrom);
        if (dateTo) queryFilter['metadata.createdAt'].$lte = new Date(dateTo);
      }
      const documents = await DocumentEmbedding.find(queryFilter).lean();
      const scoredDocs = documents.map(doc => {
        const similarity = embeddingService.cosineSimilarity(queryEmbedding, doc.embedding);
        return {
          ...doc,
          similarity: similarity
        };
      });
      scoredDocs.sort((a, b) => b.similarity - a.similarity);
      const topDocs = scoredDocs.slice(0, limit);
      return topDocs.map(doc => ({
        documentId: doc.documentId,
        documentName: doc.documentName,
        documentType: doc.documentType,
        serviceType: doc.serviceType || 'document-service',
        metadata: doc.metadata,
        similarity: doc.similarity
      }));
    } catch (error) {
      console.error('Error in vector search:', error);
      throw error;
    }
  }
  async metadataOnlySearch(query, userId, options = {}) {
    try {
      const {
        limit = 10,
        recipientName = null,
        recipientEmail = null,
        category = null,
        tags = [],
        dateFrom = null,
        dateTo = null
      } = options;
      let queryFilter = { ownerId: userId };
      if (recipientName) {
        queryFilter['metadata.recipientName'] = { $regex: recipientName, $options: 'i' };
      }
      if (recipientEmail) {
        queryFilter['metadata.recipientEmail'] = { $regex: recipientEmail, $options: 'i' };
      }
      if (category) {
        queryFilter['metadata.category'] = category;
      }
      if (tags.length > 0) {
        queryFilter['metadata.tags'] = { $in: tags };
      }
      if (dateFrom || dateTo) {
        queryFilter['metadata.createdAt'] = {};
        if (dateFrom) queryFilter['metadata.createdAt'].$gte = new Date(dateFrom);
        if (dateTo) queryFilter['metadata.createdAt'].$lte = new Date(dateTo);
      }
      if (query) {
        queryFilter.$or = [
          { documentName: { $regex: query, $options: 'i' } },
          { content: { $regex: query, $options: 'i' } },
          { 'metadata.description': { $regex: query, $options: 'i' } }
        ];
      }
      const documents = await DocumentEmbedding.find(queryFilter)
        .limit(limit)
        .sort({ updatedAt: -1 })
        .lean();
      return documents.map(doc => ({
        documentId: doc.documentId,
        documentName: doc.documentName,
        documentType: doc.documentType,
        serviceType: doc.serviceType || 'document-service',
        metadata: doc.metadata,
        similarity: 0.5 
      }));
    } catch (error) {
      console.error('Error in metadata-only search:', error);
      throw error;
    }
  }
  async hybridSearch(searchParams, userId) {
    try {
      const {
        query,
        recipientName,
        recipientEmail,
        documentTitle,
        keywords,
        category,
        tags,
        folderId,
        dateFrom,
        dateTo
      } = searchParams;
      const vectorResults = await this.vectorSearch(query || '', userId, {
        limit: 20,
        recipientName,
        recipientEmail,
        category,
        tags,
        dateFrom,
        dateTo
      });
      try {
        const token = searchParams.token; 
        if (token) {
          const docServiceResponse = await axios.get(
            `${this.documentServiceUrl}/api/documents`,
            {
              params: {
                search: query || documentTitle,
                tags: tags?.join(','),
                type: category
              },
              headers: {
                Authorization: `Bearer ${token}`
              }
            }
          );
          let eSignResults = [];
          try {
            const eSignResponse = await axios.get(
              `${this.eSignServiceUrl}/api/e-sign/get-envelopes`,
              {
                params: {
                  search: query || documentTitle
                },
                headers: {
                  Authorization: `Bearer ${token}`
                }
              }
            );
            const envelopes = eSignResponse.data?.data || [];
            if (Array.isArray(envelopes) && envelopes.length > 0) {
              eSignResults = envelopes.map((env) => {
                const recipients = env.recipientIds || [];
                const firstRecipient = recipients[0] || {};
                return {
                  documentId: env._id || env.id,
                  documentName: env.subject || env.name || 'Untitled Envelope',
                  documentType: 'envelope',
                  serviceType: 'e-sign-service',
                  metadata: {
                    recipientName: firstRecipient.name,
                    recipientEmail: firstRecipient.email,
                    category: 'e-signature',
                    description: env.message || '',
                    status: env.status,
                    createdAt: env.createdAt
                  },
                  similarity: 0.5,
                  source: 'esign'
                };
              });
            }
          } catch (eSignError) {
            console.error('Error fetching from e-sign service:', eSignError);
          }
          const docServiceResults = docServiceResponse.data?.data?.documents || [];
          const resultMap = new Map();
          vectorResults.forEach(result => {
            resultMap.set(result.documentId, {
              ...result,
              source: 'vector'
            });
          });
          docServiceResults.forEach(doc => {
            if (!resultMap.has(doc._id || doc.id)) {
              resultMap.set(doc._id || doc.id, {
                documentId: doc._id || doc.id,
                documentName: doc.name,
                documentType: 'document',
                serviceType: 'document-service',
                metadata: {
                  recipientName: doc.recipientName,
                  recipientEmail: doc.recipientEmail,
                  category: doc.category,
                  tags: doc.tags || [],
                  description: doc.description,
                  folderId: doc.folderId
                },
                similarity: 0.5, 
                source: 'keyword'
              });
            }
          });
          eSignResults.forEach(env => {
            if (!resultMap.has(env.documentId)) {
              resultMap.set(env.documentId, env);
            }
          });
          return Array.from(resultMap.values())
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, 10);
        }
      } catch (apiError) {
        console.error('Error fetching from document service:', apiError);
      }
      return vectorResults.slice(0, 10);
    } catch (error) {
      console.error('Error in hybrid search:', error);
      throw error;
    }
  }
  async syncUserDocuments(userId, token) {
    try {
      const response = await axios.get(
        `${this.documentServiceUrl}/api/documents`,
        {
          params: { limit: 100 },
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      const documents = response.data?.data?.documents || [];
      for (const doc of documents) {
        await this.indexDocument({
          id: doc._id || doc.id,
          name: doc.name,
          type: doc.type,
          documentType: 'document',
          serviceType: 'document-service',
          description: doc.description,
          tags: doc.tags || [],
          category: doc.category,
          folderId: doc.folderId,
          createdAt: doc.createdAt,
          updatedAt: doc.updatedAt
        }, userId);
      }
      let envelopesCount = 0;
      try {
        const eSignResponse = await axios.get(
          `${this.eSignServiceUrl}/api/e-sign/get-envelopes`,
          {
            params: { limit: 100 },
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
        const envelopes = Array.isArray(eSignResponse.data?.data) ? eSignResponse.data.data : [];
        envelopesCount = envelopes.length;
        for (const env of envelopes) {
          const recipients = env.recipientIds || [];
          const recipientNames = recipients.map((r) => r.name).filter(Boolean).join(', ') || '';
          const recipientEmails = recipients.map((r) => r.email).filter(Boolean).join(', ') || '';
          await this.indexDocument({
            id: env._id || env.id,
            name: env.subject || 'Untitled Envelope',
            type: 'envelope',
            documentType: 'envelope',
            serviceType: 'e-sign-service',
            description: env.message || '',
            recipientName: recipientNames,
            recipientEmail: recipientEmails,
            category: 'e-signature',
            tags: [],
            createdAt: env.createdAt,
            updatedAt: env.updatedAt
          }, userId);
        }
      } catch (eSignError) {
        console.error('Error syncing e-sign envelopes:', eSignError);
      }
      return { 
        indexed: documents.length + envelopesCount,
        documents: documents.length,
        envelopes: envelopesCount
      };
    } catch (error) {
      console.error('Error syncing documents:', error);
      throw error;
    }
  }
}
module.exports = new RAGService();
