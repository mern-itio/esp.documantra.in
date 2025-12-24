const { MongoDBAtlasVectorSearch } = require('@langchain/mongodb');
const { OpenAIEmbeddings } = require('@langchain/openai');
const { MongoClient } = require('mongodb');
const mongoose = require('mongoose');
const DocumentEmbedding = require('../models/DocumentEmbedding');
const axios = require('axios');

class RAGServiceLangChain {
  constructor() {
    this.documentServiceUrl = process.env.DOCUMENT_SERVICE_URL || 'http://localhost:2102';
    this.eSignServiceUrl = process.env.ESIGN_SERVICE_URL || 'http://localhost:2103';
    
    // Initialize embeddings
    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName: 'text-embedding-3-small'
    });

    // Initialize vector store (will be set up when MongoDB connection is ready)
    this.vectorStore = null;
  }

  // Initialize vector store with MongoDB Atlas Vector Search
  async initializeVectorStore() {
    try {
      // Use mongoose connection or create new client
      let collection;
      
      if (mongoose.connection.db) {
        collection = mongoose.connection.db.collection('documentembeddings');
      } else {
        // Fallback: create new client connection
        const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/draftnsign';
        const client = new MongoClient(mongoUri);
        await client.connect();
        const db = client.db();
        collection = db.collection('documentembeddings');
      }
      
      // Create vector search index if it doesn't exist
      await this.ensureVectorIndex(collection);

      this.vectorStore = new MongoDBAtlasVectorSearch(this.embeddings, {
        collection: collection,
        indexName: 'vector_index', // Name of the Atlas Vector Search index
        textKey: 'content',
        embeddingKey: 'embedding'
      });

      return this.vectorStore;
    } catch (error) {
      console.error('Error initializing vector store:', error);
      console.warn('Falling back to manual vector search');
      // Fallback to manual search if Atlas Vector Search is not available
      return null;
    }
  }

  // Ensure vector search index exists
  async ensureVectorIndex(collection) {
    try {
      const indexes = await collection.indexes();
      const hasVectorIndex = indexes.some(idx => idx.name === 'vector_index');

      if (!hasVectorIndex) {
        console.warn('Vector search index not found. Please create it in MongoDB Atlas.');
        console.warn('Index definition: { "fields": [{ "type": "vector", "path": "embedding", "numDimensions": 1536, "similarity": "cosine" }] }');
      }
    } catch (error) {
      console.warn('Could not check vector index:', error.message);
    }
  }

  // Index a document for vector search
  async indexDocument(documentData, userId) {
    try {
      const searchableText = this.buildSearchableText(documentData);
      
      // Check if embedding already exists
      const existing = await DocumentEmbedding.findOne({
        documentId: documentData.id,
        ownerId: userId
      });

      let embedding;
      if (existing && existing.embedding && existing.embedding.length > 0) {
        embedding = existing.embedding;
      } else {
        try {
          // Generate embedding using LangChain
          const embeddingResult = await this.embeddings.embedQuery(searchableText);
          embedding = embeddingResult;
        } catch (embeddingError) {
          if (embeddingError.status === 429 || embeddingError.message?.includes('quota')) {
            console.warn('Embedding API quota exceeded. Storing document metadata only.');
            embedding = [];
          } else {
            throw embeddingError;
          }
        }
      }

      // Store in database
      const docEmbedding = await DocumentEmbedding.findOneAndUpdate(
        { documentId: documentData.id, ownerId: userId },
        {
          documentId: documentData.id,
          documentName: documentData.name || documentData.title || '',
          documentType: documentData.documentType || documentData.type || 'document',
          serviceType: documentData.serviceType || 'document-service',
          ownerId: userId,
          content: searchableText,
          embedding: embedding,
          metadata: {
            recipientName: documentData.recipientName || null,
            recipientEmail: documentData.recipientEmail || null,
            category: documentData.category || null,
            tags: documentData.tags || [],
            description: documentData.description || '',
            folderId: documentData.folderId || null,
            createdAt: documentData.createdAt || new Date(),
            updatedAt: documentData.updatedAt || new Date()
          },
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
      parts.push(`Recipient: ${documentData.recipientName}`);
    }
    
    if (documentData.recipientEmail) {
      parts.push(`Email: ${documentData.recipientEmail}`);
    }
    
    if (documentData.category) {
      parts.push(`Category: ${documentData.category}`);
    }
    
    if (documentData.tags && Array.isArray(documentData.tags)) {
      parts.push(`Tags: ${documentData.tags.join(', ')}`);
    }
    
    if (documentData.content) {
      parts.push(documentData.content);
    }

    return parts.join(' ');
  }

  // Vector search using MongoDB Atlas Vector Search
  async vectorSearch(query, userId, options = {}) {
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

      // Initialize vector store if not already done
      if (!this.vectorStore) {
        await this.initializeVectorStore();
      }

      // Build metadata filter
      const metadataFilter = { ownerId: userId };
      
      if (recipientName) {
        metadataFilter['metadata.recipientName'] = { $regex: recipientName, $options: 'i' };
      }
      if (recipientEmail) {
        metadataFilter['metadata.recipientEmail'] = { $regex: recipientEmail, $options: 'i' };
      }
      if (category) {
        metadataFilter['metadata.category'] = category;
      }
      if (tags.length > 0) {
        metadataFilter['metadata.tags'] = { $in: tags };
      }
      if (dateFrom || dateTo) {
        metadataFilter['metadata.createdAt'] = {};
        if (dateFrom) metadataFilter['metadata.createdAt'].$gte = new Date(dateFrom);
        if (dateTo) metadataFilter['metadata.createdAt'].$lte = new Date(dateTo);
      }

      let results = [];

      // Try using MongoDB Atlas Vector Search if available
      if (this.vectorStore) {
        try {
          const vectorResults = await this.vectorStore.similaritySearchWithScore(
            query,
            limit,
            metadataFilter
          );

          results = vectorResults.map(([doc, score]) => ({
            documentId: doc.metadata.documentId || doc.metadata.id,
            documentName: doc.metadata.documentName || doc.pageContent,
            documentType: doc.metadata.documentType || 'document',
            serviceType: doc.metadata.serviceType || 'document-service',
            metadata: doc.metadata,
            similarity: score
          }));
        } catch (vectorError) {
          console.warn('Vector search failed, falling back to manual search:', vectorError.message);
          // Fall back to manual search
          results = await this.manualVectorSearch(query, userId, options);
        }
      } else {
        // Fall back to manual search if vector store not available
        results = await this.manualVectorSearch(query, userId, options);
      }

      return results;
    } catch (error) {
      console.error('Error in vector search:', error);
      // Fallback to metadata-only search
      return this.metadataOnlySearch(query, userId, options);
    }
  }

  // Manual vector search fallback (when Atlas Vector Search is not available)
  async manualVectorSearch(query, userId, options = {}) {
    try {
      const { limit = 10 } = options;

      // Generate query embedding
      const queryEmbedding = await this.embeddings.embedQuery(query);

      // Build filter
      const queryFilter = { ownerId: userId };
      
      if (options.recipientName) {
        queryFilter['metadata.recipientName'] = { $regex: options.recipientName, $options: 'i' };
      }
      if (options.recipientEmail) {
        queryFilter['metadata.recipientEmail'] = { $regex: options.recipientEmail, $options: 'i' };
      }
      if (options.category) {
        queryFilter['metadata.category'] = options.category;
      }
      if (options.tags && options.tags.length > 0) {
        queryFilter['metadata.tags'] = { $in: options.tags };
      }

      const documents = await DocumentEmbedding.find(queryFilter).lean();

      // Calculate cosine similarity
      const scoredDocs = documents.map(doc => {
        if (!doc.embedding || doc.embedding.length === 0) {
          return { ...doc, similarity: 0 };
        }
        
        const similarity = this.cosineSimilarity(queryEmbedding, doc.embedding);
        return {
          ...doc,
          similarity: similarity
        };
      });

      // Sort by similarity and limit
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
      console.error('Error in manual vector search:', error);
      throw error;
    }
  }

  // Cosine similarity calculation
  cosineSimilarity(vecA, vecB) {
    if (vecA.length !== vecB.length) {
      throw new Error('Vectors must have the same length');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  // Metadata-only search fallback
  async metadataOnlySearch(query, userId, options = {}) {
    try {
      const { limit = 10 } = options;

      let queryFilter = { ownerId: userId };
      
      if (options.recipientName) {
        queryFilter['metadata.recipientName'] = { $regex: options.recipientName, $options: 'i' };
      }
      if (options.recipientEmail) {
        queryFilter['metadata.recipientEmail'] = { $regex: options.recipientEmail, $options: 'i' };
      }
      if (options.category) {
        queryFilter['metadata.category'] = options.category;
      }
      if (options.tags && options.tags.length > 0) {
        queryFilter['metadata.tags'] = { $in: options.tags };
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

  // Hybrid search (vector + metadata + keyword)
  async hybridSearch(searchParams, userId) {
    try {
      const {
        query = '',
        documentTitle = null,
        recipientName = null,
        recipientEmail = null,
        category = null,
        tags = [],
        dateFrom = null,
        dateTo = null,
        token = null
      } = searchParams;

      const searchQuery = query || documentTitle || '';
      const limit = 10;

      // Vector search
      let vectorResults = [];
      try {
        vectorResults = await this.vectorSearch(searchQuery, userId, {
          limit: limit * 2,
          recipientName,
          recipientEmail,
          category,
          tags,
          dateFrom,
          dateTo
        });
      } catch (vectorError) {
        console.warn('Vector search failed:', vectorError.message);
      }

      // Also search document service and e-sign service
      let docServiceResults = [];
      let eSignResults = [];

      if (token) {
        try {
          const docServiceResponse = await axios.get(
            `${this.documentServiceUrl}/api/documents`,
            {
              params: {
                search: searchQuery || documentTitle,
                tags: tags.join(','),
                type: category
              },
              headers: { Authorization: `Bearer ${token}` }
            }
          );
          docServiceResults = docServiceResponse.data?.data?.documents || [];
        } catch (docError) {
          console.warn('Document service search failed:', docError.message);
        }

        try {
          const eSignResponse = await axios.get(
            `${this.eSignServiceUrl}/api/e-sign/get-envelopes`,
            {
              params: { search: searchQuery || documentTitle },
              headers: { Authorization: `Bearer ${token}` }
            }
          );
          eSignResults = eSignResponse.data?.data || [];
        } catch (eSignError) {
          console.warn('E-sign service search failed:', eSignError.message);
        }
      }

      // Combine and deduplicate results
      const allResults = new Map();

      // Add vector search results
      vectorResults.forEach(doc => {
        allResults.set(doc.documentId, {
          ...doc,
          source: 'vector-search'
        });
      });

      // Add document service results
      docServiceResults.forEach(doc => {
        if (!allResults.has(doc._id || doc.id)) {
          allResults.set(doc._id || doc.id, {
            documentId: doc._id || doc.id,
            documentName: doc.name,
            documentType: doc.type || 'document',
            serviceType: 'document-service',
            metadata: {
              tags: doc.tags || [],
              description: doc.description || ''
            },
            similarity: 0.7,
            source: 'document-service'
          });
        }
      });

      // Add e-sign service results
      eSignResults.forEach(env => {
        if (!allResults.has(env._id || env.id)) {
          allResults.set(env._id || env.id, {
            documentId: env._id || env.id,
            documentName: env.subject || 'Untitled Envelope',
            documentType: 'envelope',
            serviceType: 'e-sign-service',
            metadata: {
              status: env.status,
              recipients: env.recipients || []
            },
            similarity: 0.7,
            source: 'e-sign-service'
          });
        }
      });

      // Sort by similarity and return top results
      const sortedResults = Array.from(allResults.values())
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit);

      return sortedResults;
    } catch (error) {
      console.error('Error in hybrid search:', error);
      throw error;
    }
  }

  // Sync documents from both services
  async syncUserDocuments(userId, token) {
    try {
      let documentsCount = 0;
      let envelopesCount = 0;

      // Sync from document service
      try {
        const docResponse = await axios.get(
          `${this.documentServiceUrl}/api/documents`,
          {
            params: { limit: 100 },
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        const documents = docResponse.data?.data?.documents || [];
        documentsCount = documents.length;

        for (const doc of documents) {
          await this.indexDocument({
            id: doc._id || doc.id,
            name: doc.name,
            type: doc.type,
            documentType: 'document',
            serviceType: 'document-service',
            description: doc.description || '',
            tags: doc.tags || [],
            category: doc.category || null,
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt
          }, userId);
        }
      } catch (docError) {
        console.error('Error syncing documents:', docError);
      }

      // Sync from e-sign service
      try {
        const eSignResponse = await axios.get(
          `${this.eSignServiceUrl}/api/e-sign/get-envelopes`,
          {
            params: { limit: 100 },
            headers: { Authorization: `Bearer ${token}` }
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
        indexed: documentsCount + envelopesCount,
        documents: documentsCount,
        envelopes: envelopesCount
      };
    } catch (error) {
      console.error('Error syncing documents:', error);
      throw error;
    }
  }
}

module.exports = new RAGServiceLangChain();

