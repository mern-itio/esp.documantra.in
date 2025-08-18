const DocumentAnalysis = require('../models/DocumentAnalysis');
const Document = require('../models/Document');
const documentAnalysisService = require('../services/documentAnalysisService');
const path = require('path');

class DocumentAnalysisController {
  constructor() {
    // Bind methods to preserve 'this' context
    this.processDocument = this.processDocument.bind(this);
    this.processDocumentAsync = this.processDocumentAsync.bind(this);
    this.getDocumentAnalysis = this.getDocumentAnalysis.bind(this);
    this.getAnalysisStatus = this.getAnalysisStatus.bind(this);
    this.reprocessDocument = this.reprocessDocument.bind(this);
    this.getUserAnalyses = this.getUserAnalyses.bind(this);
    this.deleteAnalysis = this.deleteAnalysis.bind(this);
  }

  /**
   * Process a document for analysis
   */
  async processDocument(req, res) {
    try {
      const { documentId } = req.params;
      
      if (!documentId) {
        return res.status(400).json({
          success: false,
          message: 'Document ID is required'
        });
      }

      console.log(`🔍 Processing document analysis for: ${documentId}`);

      // Check if document exists
      const document = await Document.findById(documentId);
      if (!document) {
        return res.status(404).json({
          success: false,
          message: 'Document not found'
        });
      }

      // Check if analysis already exists and is recent (within 24 hours)
      // Also check for stuck processing analyses (older than 10 minutes)
      const existingAnalysis = await DocumentAnalysis.findOne({ 
        documentId: document._id,
        processingStatus: 'completed',
        processedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      });

      // Check for stuck processing analyses and reset them
      const stuckAnalysis = await DocumentAnalysis.findOne({
        documentId: document._id,
        processingStatus: 'processing',
        processedAt: { $lt: new Date(Date.now() - 10 * 60 * 1000) } // Older than 10 minutes
      });

      if (stuckAnalysis) {
        console.log(`🔄 Resetting stuck analysis for document: ${documentId}`);
        await DocumentAnalysis.findByIdAndUpdate(stuckAnalysis._id, {
          processingStatus: 'failed',
          processingError: 'Analysis was stuck and has been reset'
        });
      }

      if (existingAnalysis) {
        console.log(`✅ Using existing analysis for document: ${documentId}`);
        return res.json({
          success: true,
          message: 'Using existing analysis',
          data: existingAnalysis
        });
      }

      // Create or update analysis record with pending status
      let analysisRecord = await DocumentAnalysis.findOneAndUpdate(
        { documentId: document._id },
        { 
          processingStatus: 'processing',
          processedAt: new Date(),
          analysis: {
            wordCount: 0,
            pageCount: 1,
            readabilityScore: 50,
            sentiment: 'neutral',
            language: 'en',
            topics: [],
            entities: [],
            keyPhrases: [],
            summary: 'Processing...'
          },
          ocrResults: {
            confidence: 0,
            extractedText: '',
            regions: []
          },
          classification: {
            category: 'general',
            confidence: 0,
            suggestedTags: []
          },
          compliance: {
            issues: [],
            score: 0,
            recommendations: ['Processing...']
          }
        },
        { upsert: true, new: true }
      );

      // Get the full file path - document.filePath should already contain the full path
      let filePath = document.filePath;
      
      // If filePath is relative, construct the full path
      if (!path.isAbsolute(filePath)) {
        const uploadsDir = path.join(__dirname, '../../uploads');
        filePath = path.join(uploadsDir, document.filePath);
      }

      // Process document asynchronously
      this.processDocumentAsync(documentId, filePath, document.mimeType, analysisRecord._id);

      // Return immediate response
      res.json({
        success: true,
        message: 'Document analysis started',
        data: {
          id: analysisRecord._id,
          documentId: documentId,
          processingStatus: 'processing',
          processedAt: new Date()
        }
      });

    } catch (error) {
      console.error('❌ Error processing document analysis:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process document analysis',
        error: error.message
      });
    }
  }

  /**
   * Process document analysis asynchronously
   */
  async processDocumentAsync(documentId, filePath, mimeType, analysisId) {
    try {
      console.log(`🔄 Starting async analysis for document: ${documentId}`);
      console.log(`📁 File path: ${filePath}`);
      console.log(`📄 MIME type: ${mimeType}`);

      // Check if file exists
      const fs = require('fs');
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found at path: ${filePath}`);
      }

      // Perform the actual analysis with timeout
      console.log(`🔍 Calling documentAnalysisService.analyzeDocument...`);
      const analysisResult = await Promise.race([
        documentAnalysisService.analyzeDocument(documentId, filePath, mimeType),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Analysis timeout after 5 minutes')), 5 * 60 * 1000)
        )
      ]);

      console.log(`📊 Analysis result:`, analysisResult);

      // Update the analysis record
      const updatedAnalysis = await DocumentAnalysis.findByIdAndUpdate(
        analysisId,
        {
          ...analysisResult,
          processingStatus: 'completed',
          processedAt: new Date()
        },
        { new: true }
      );

      console.log(`✅ Async analysis completed for document: ${documentId}`);

      // Update document with extracted content if available
      // if (analysisResult.analysis && analysisResult.analysis.summary) {
      //   await Document.findByIdAndUpdate(documentId, {
      //     content: analysisResult.analysis.summary,
      //     modifiedAt: new Date()
      //   });
      // }

    } catch (error) {
      console.error(`❌ Async analysis failed for document ${documentId}:`, error);
      console.error(`❌ Error stack:`, error.stack);
      
      // Update analysis record with error status
      await DocumentAnalysis.findByIdAndUpdate(analysisId, {
        processingStatus: 'failed',
        processingError: error.message,
        processedAt: new Date()
      });
    }
  }

  /**
   * Get document analysis results
   */
  async getDocumentAnalysis(req, res) {
    try {
      const { documentId } = req.params;
      
      if (!documentId) {
        return res.status(400).json({
          success: false,
          message: 'Document ID is required'
        });
      }

      console.log(`🔍 Fetching analysis for document: ${documentId}`);

      // Find the most recent analysis for this document
      const analysis = await DocumentAnalysis.findOne({ 
        documentId: documentId,
        processingStatus: 'completed'
      }).sort({ processedAt: -1 });

      if (!analysis) {
        return res.json({
          success: false,
          message: 'Document analysis not found',
          data: null
        });
      }

      res.json({
        success: true,
        message: 'Document analysis retrieved successfully',
        data: analysis
      });

    } catch (error) {
      console.error('❌ Error fetching document analysis:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch document analysis',
        error: error.message
      });
    }
  }

  /**
   * Get analysis processing status
   */
  async getAnalysisStatus(req, res) {
    try {
      const { documentId } = req.params;
      
      if (!documentId) {
        return res.status(400).json({
          success: false,
          message: 'Document ID is required'
        });
      }

      const analysis = await DocumentAnalysis.findOne({ 
        documentId: documentId 
      }).sort({ processedAt: -1 });

      if (!analysis) {
        return res.json({
          success: true,
          data: {
            processingStatus: 'not_started',
            processedAt: null
          }
        });
      }

      res.json({
        success: true,
        data: {
          processingStatus: analysis.processingStatus,
          processedAt: analysis.processedAt,
          processingError: analysis.processingError
        }
      });

    } catch (error) {
      console.error('❌ Error fetching analysis status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch analysis status',
        error: error.message
      });
    }
  }

  /**
   * Reprocess document analysis
   */
  async reprocessDocument(req, res) {
    try {
      const { documentId } = req.params;
      
      if (!documentId) {
        return res.status(400).json({
          success: false,
          message: 'Document ID is required'
        });
      }

      console.log(`🔄 Reprocessing document analysis for: ${documentId}`);

      // Check if document exists
      const document = await Document.findById(documentId);
      if (!document) {
        return res.status(404).json({
          success: false,
          message: 'Document not found'
        });
      }

      // Delete existing analysis
      await DocumentAnalysis.deleteMany({ documentId: document._id });

      // Create new analysis record with pending status and default values
      const analysisRecord = await DocumentAnalysis.create({
        documentId: document._id,
        processingStatus: 'processing',
        processedAt: new Date(),
        analysis: {
          wordCount: 0,
          pageCount: 1,
          readabilityScore: 50,
          sentiment: 'neutral',
          language: 'en',
          topics: [],
          entities: [],
          keyPhrases: [],
          summary: 'Processing...'
        },
        ocrResults: {
          confidence: 0,
          extractedText: '',
          regions: []
        },
        classification: {
          category: 'general',
          confidence: 0,
          suggestedTags: []
        },
        compliance: {
          issues: [],
          score: 0,
          recommendations: ['Processing...']
        }
      });

      // Get the full file path - document.filePath should already contain the full path
      let filePath = document.filePath;
      
      // If filePath is relative, construct the full path
      if (!path.isAbsolute(filePath)) {
        const uploadsDir = path.join(__dirname, '../../uploads');
        filePath = path.join(uploadsDir, document.filePath);
      }

      // Process document asynchronously
      this.processDocumentAsync(documentId, filePath, document.mimeType, analysisRecord._id);

      res.json({
        success: true,
        message: 'Document reprocessing started',
        data: {
          id: analysisRecord._id,
          documentId: documentId,
          processingStatus: 'processing',
          processedAt: new Date()
        }
      });

    } catch (error) {
      console.error('❌ Error reprocessing document analysis:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to reprocess document analysis',
        error: error.message
      });
    }
  }

  /**
   * Get all analyses for a user
   */
  async getUserAnalyses(req, res) {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 10, status } = req.query;
      
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required'
        });
      }

      console.log(`🔍 Fetching analyses for user: ${userId}`);

      // Build query
      const query = {};
      if (status) {
        query.processingStatus = status;
      }

      // Find documents by user and get their analyses
      const userDocuments = await Document.find({ 
        $or: [
          { uploadedBy: userId },
          { ownerId: userId }
        ]
      }).select('_id');

      const documentIds = userDocuments.map(doc => doc._id);
      query.documentId = { $in: documentIds };

      // Pagination
      const skip = (page - 1) * limit;
      
      const analyses = await DocumentAnalysis.find(query)
        .sort({ processedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('documentId', 'name type size');

      const total = await DocumentAnalysis.countDocuments(query);

      res.json({
        success: true,
        message: 'User analyses retrieved successfully',
        data: {
          analyses,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          }
        }
      });

    } catch (error) {
      console.error('❌ Error fetching user analyses:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch user analyses',
        error: error.message
      });
    }
  }

  /**
   * Delete document analysis
   */
  async deleteAnalysis(req, res) {
    try {
      const { analysisId } = req.params;
      
      if (!analysisId) {
        return res.status(400).json({
          success: false,
          message: 'Analysis ID is required'
        });
      }

      console.log(`🗑️ Deleting analysis: ${analysisId}`);

      const deletedAnalysis = await DocumentAnalysis.findByIdAndDelete(analysisId);
      
      if (!deletedAnalysis) {
        return res.status(404).json({
          success: false,
          message: 'Analysis not found'
        });
      }

      res.json({
        success: true,
        message: 'Analysis deleted successfully',
        data: deletedAnalysis
      });

    } catch (error) {
      console.error('❌ Error deleting analysis:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete analysis',
        error: error.message
      });
    }
  }
}

module.exports = new DocumentAnalysisController();
