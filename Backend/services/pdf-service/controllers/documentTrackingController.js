const DocumentTracking = require('../models/documentTracking');
const fs = require('fs-extra');
const path = require('path');
const multer = require('multer');
const crypto = require('crypto');
// Configure multer for document uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'tracking-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  },
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

const documentTrackingController = {
  // Log an event (enhanced version)
  async logEvent(req, res) {
    try {
      const {
        documentId,
        documentName,
        documentType = 'pdf',
        originalFilename,
        userId,
        action,
        ipAddress,
        userAgent,
        deviceInfo,
        metadata = {}
      } = req.body;

      if (!documentId || !documentName || !originalFilename || !userId || !action) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields'
        });
      }

      const trackingRecord = new DocumentTracking({
        documentId,
        documentName,
        documentType,
        originalFilename,
        userId,
        action,
        ipAddress: ipAddress || req.ip,
        userAgent: userAgent || req.get('User-Agent'),
        deviceInfo,
        metadata,
        isTracked: true,
        trackingSource: 'automatic'
      });

      await trackingRecord.save();

      res.json({
        success: true,
        message: 'Event logged successfully',
        trackingId: trackingRecord._id
      });
    } catch (error) {
      console.error('Error logging event:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to log event',
        details: error.message
      });
    }
  },

  // Upload document for tracking
  async uploadDocumentForTracking(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, error: 'PDF file is required' });
      }

      const { userId, documentName, expiresInDays = 30 } = req.body;
      
      // console.log('Upload request received:', {
      //   userId,
      //   documentName,
      //   expiresInDays,
      //   file: req.file.originalname
      // });
      
      if (!userId || userId === 'anonymous' || !documentName) {
        return res.status(400).json({ 
          success: false, 
          error: 'User ID and document name are required. Please ensure you are logged in.' 
        });
      }

      const documentId = crypto.randomBytes(16).toString('hex');
      const linkToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + (expiresInDays * 24 * 60 * 60 * 1000));
      
      // Create shareable link - point to backend public route
      const backendUrl = `${req.protocol}://${req.get('host')}`;
      const shareableLink = `${backendUrl}/shared-document/${linkToken}`;

      // Log the upload event
      const trackingRecord = new DocumentTracking({
        documentId,
        documentName,
        documentType: 'pdf',
        originalFilename: req.file.originalname,
        savedFilename: req.file.filename, // Save the actual filename on disk
        userId,
        action: 'upload',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        isTracked: true,
        trackingSource: 'manual',
        shareableLink,
        linkToken,
        expiresAt,
        accessCount: 0
      });

      await trackingRecord.save();

      res.json({
        success: true,
        message: 'Document uploaded for tracking successfully',
        documentId,
        shareableLink,
        expiresAt,
        trackingId: trackingRecord._id
      });
    } catch (error) {
      console.error('Error uploading document for tracking:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to upload document for tracking',
        details: error.message
      });
    }
  },

  // Access document via shareable link
  async accessSharedDocument(req, res) {
    try {
      const { linkToken } = req.params;
      
      console.log('Accessing shared document with token:', linkToken);
      console.log('Request method:', req.method);
      
      const trackingRecord = await DocumentTracking.findOne({ 
        linkToken, 
        isTracked: true,
        expiresAt: { $gt: new Date() }
      });

      console.log('Found tracking record:', trackingRecord ? 'Yes' : 'No');
      
      if (!trackingRecord) {
        console.log('Document not found or expired for token:', linkToken);
        return res.status(404).json({ error: 'Document not found or link expired' });
      }

      // If this is a GET request (direct link access), redirect to frontend
      if (req.method === 'GET') {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        return res.redirect(`${frontendUrl}/shared-document/${linkToken}`);
      }

      // If this is a POST request (from frontend), log the access and serve document
      if (req.method === 'POST') {
        // Log the access - use userId from request body if provided
        const accessRecord = new DocumentTracking({
          documentId: trackingRecord.documentId,
          documentName: trackingRecord.documentName,
          documentType: trackingRecord.documentType,
          originalFilename: trackingRecord.originalFilename,
          userId: req.body.userId || 'anonymous', // Use provided userId or fallback to anonymous
          action: 'view',
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          isTracked: true,
          trackingSource: 'shared_link',
          metadata: { accessedVia: 'shared_link' }
        });

        await accessRecord.save();

        // Update access count and last accessed
        await DocumentTracking.findByIdAndUpdate(trackingRecord._id, {
          $inc: { accessCount: 1 },
          lastAccessed: new Date()
        });

        // Return document info for frontend to display
        const responseData = {
          success: true,
          documentId: trackingRecord.documentId,
          documentName: trackingRecord.documentName,
          originalFilename: trackingRecord.originalFilename,
          downloadUrl: `/document-tracking/download/${linkToken}`,
          message: 'Document access logged successfully'
        };
        
        console.log('Returning document info:', responseData);
        res.json(responseData);
      }
    } catch (error) {
      console.error('Error accessing shared document:', error);
      res.status(500).json({ error: 'Failed to access document' });
    }
  },

  // Download shared document
  async downloadSharedDocument(req, res) {
    try {
      const { linkToken } = req.params;
      
      const trackingRecord = await DocumentTracking.findOne({ 
        linkToken, 
        isTracked: true,
        expiresAt: { $gt: new Date() }
      });

      if (!trackingRecord) {
        return res.status(404).json({ error: 'Document not found or link expired' });
      }

      // Serve the document
      const filePath = path.join(__dirname, '..', 'uploads', trackingRecord.savedFilename || trackingRecord.originalFilename);
      
      if (await fs.pathExists(filePath)) {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${trackingRecord.documentName}.pdf"`);
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);
      } else {
        res.status(404).json({ error: 'Document file not found' });
      }
    } catch (error) {
      console.error('Error downloading shared document:', error);
      res.status(500).json({ error: 'Failed to download document' });
    }
  },

  // Get tracked documents summary
  async getTrackedDocuments(req, res) {
    try {
      const { page = 1, limit = 10 } = req.query;
      const skip = (page - 1) * limit;

      // Get current user ID from request (set by JWT middleware)
      const currentUserId = req.user?.data?.id;
      
      if (!currentUserId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
      }

      // Only show documents for the current user
      let query = { isTracked: true, userId: currentUserId };

      const documents = await DocumentTracking.aggregate([
        { $match: query },
        { $group: {
          _id: '$documentId',
          documentName: { $first: '$documentName' },
          documentType: { $first: '$documentType' },
          originalFilename: { $first: '$originalFilename' },
          trackingSource: { $first: '$trackingSource' },
          shareableLink: { $first: '$shareableLink' },
          expiresAt: { $first: '$expiresAt' },
          accessCount: { $first: '$accessCount' },
          lastAccessed: { $first: '$lastAccessed' },
          totalActions: { $sum: 1 },
          lastAction: { $max: '$timestamp' },
          actions: { $push: { action: '$action', timestamp: '$timestamp' } }
        }},
        { $sort: { lastAction: -1 } },
        { $skip: skip },
        { $limit: parseInt(limit) }
      ]);

      const total = await DocumentTracking.aggregate([
        { $match: query },
        { $group: { _id: '$documentId' } },
        { $count: 'total' }
      ]);

      res.json({
        success: true,
        documents,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: total[0]?.total || 0,
          pages: Math.ceil((total[0]?.total || 0) / limit)
        }
      });
    } catch (error) {
      console.error('Error getting tracked documents:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get tracked documents',
        details: error.message
      });
    }
  },

  // Get document tracking (existing method, enhanced)
  async getDocumentTracking(req, res) {
    try {
      const { documentId } = req.params;
      const { page = 1, limit = 20 } = req.query;
      const skip = (page - 1) * limit;

      // Get current user ID from request (set by JWT middleware)
      const currentUserId = req.user?.data?.id;
      
      if (!currentUserId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
      }

      // First verify the document belongs to the current user
      const documentOwner = await DocumentTracking.findOne({ 
        documentId, 
        userId: currentUserId,
        isTracked: true 
      });

      if (!documentOwner) {
        return res.status(403).json({
          success: false,
          error: 'Access denied: Document not found or you do not have permission to view it'
        });
      }

      const trackingRecords = await DocumentTracking.find({ documentId })
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await DocumentTracking.countDocuments({ documentId });

      // Get document summary
      const documentSummary = await DocumentTracking.aggregate([
        { $match: { documentId } },
        { $group: {
          _id: '$documentId',
          documentName: { $first: '$documentName' },
          documentType: { $first: '$documentType' },
          originalFilename: { $first: '$originalFilename' },
          trackingSource: { $first: '$trackingSource' },
          shareableLink: { $first: '$shareableLink' },
          expiresAt: { $first: '$expiresAt' },
          accessCount: { $first: '$accessCount' },
          lastAccessed: { $first: '$lastAccessed' },
          totalActions: { $sum: 1 },
          actions: { $push: { action: '$action', timestamp: '$timestamp', userId: '$userId' } }
        }}
      ]);

      res.json({
        success: true,
        documentSummary: documentSummary[0] || null,
        trackingRecords,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Error getting document tracking:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get document tracking',
        details: error.message
      });
    }
  },

  // Get user activity (existing method)
  async getUserActivity(req, res) {
    try {
      const { page = 1, limit = 20 } = req.query;
      const skip = (page - 1) * limit;

      // Get current user ID from request (set by JWT middleware)
      const currentUserId = req.user?.data?.id;
      
      if (!currentUserId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
      }

      const userActivity = await DocumentTracking.find({ userId: currentUserId })
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await DocumentTracking.countDocuments({ userId: currentUserId });

      res.json({
        success: true,
        userActivity,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Error getting user activity:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get user activity',
        details: error.message
      });
    }
  },

  // Get audit trail (existing method)
  async getAuditTrail(req, res) {
    try {
      const { page = 1, limit = 50, action, startDate, endDate } = req.query;
      const skip = (page - 1) * limit;

      // Get current user ID from request (set by JWT middleware)
      const currentUserId = req.user?.data?.id;
      
      if (!currentUserId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
      }

      let query = { userId: currentUserId };
      if (action) query.action = action;
      if (startDate || endDate) {
        query.timestamp = {};
        if (startDate) query.timestamp.$gte = new Date(startDate);
        if (endDate) query.timestamp.$lte = new Date(endDate);
      }

      const auditTrail = await DocumentTracking.find(query)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await DocumentTracking.countDocuments(query);

      res.json({
        success: true,
        auditTrail,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Error getting audit trail:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get audit trail',
        details: error.message
      });
    }
  },

  // Get dashboard stats (existing method, enhanced)
  async getDashboardStats(req, res) {
    try {
      const { startDate, endDate } = req.query;
      
      // Get current user ID from request (set by JWT middleware)
      const currentUserId = req.user?.data?.id;
      
      if (!currentUserId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
      }
      
      let dateQuery = { userId: currentUserId };
      if (startDate || endDate) {
        dateQuery.timestamp = {};
        if (startDate) dateQuery.timestamp.$gte = new Date(startDate);
        if (endDate) dateQuery.timestamp.$lte = new Date(endDate);
      }

      const [
        totalDocuments,
        totalActions,
        actionsByType,
        recentActivity,
        topDocuments
      ] = await Promise.all([
        DocumentTracking.distinct('documentId', dateQuery),
        DocumentTracking.countDocuments(dateQuery),
        DocumentTracking.aggregate([
          { $match: dateQuery },
          { $group: { _id: '$action', count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ]),
        DocumentTracking.find(dateQuery)
          .sort({ timestamp: -1 })
          .limit(10)
          .select('documentName action timestamp userId'),
        DocumentTracking.aggregate([
          { $match: dateQuery },
          { $group: {
            _id: '$documentId',
            documentName: { $first: '$documentName' },
            actionCount: { $sum: 1 },
            lastAction: { $max: '$timestamp' }
          }},
          { $sort: { actionCount: -1 } },
          { $limit: 5 }
        ])
      ]);

      res.json({
        success: true,
        stats: {
          totalDocuments: totalDocuments.length,
          totalActions,
          actionsByType,
          recentActivity,
          topDocuments
        }
      });
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get dashboard stats',
        details: error.message
      });
    }
  },

  // Export tracking data (existing method)
  async exportTrackingData(req, res) {
    try {
      const { format = 'json', startDate, endDate } = req.query;
      
      // Get current user ID from request (set by JWT middleware)
      const currentUserId = req.user?.data?.id;
      
      if (!currentUserId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
      }
      
      let query = { userId: currentUserId };
      if (startDate || endDate) {
        query.timestamp = {};
        if (startDate) query.timestamp.$gte = new Date(startDate);
        if (endDate) query.timestamp.$lte = new Date(endDate);
      }

      const data = await DocumentTracking.find(query).sort({ timestamp: -1 });

      if (format === 'csv') {
        // Convert to CSV format
        const csvData = data.map(record => {
          return `${record.documentId},${record.documentName},${record.action},${record.userId},${record.timestamp},${record.ipAddress}`;
        }).join('\n');
        
        const csvHeader = 'Document ID,Document Name,Action,User ID,Timestamp,IP Address\n';
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="document_tracking.csv"');
        res.send(csvHeader + csvData);
      } else {
        res.json({
          success: true,
          data,
          exportInfo: {
            format,
            totalRecords: data.length,
            exportDate: new Date()
          }
        });
      }
    } catch (error) {
      console.error('Error exporting tracking data:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to export tracking data',
        details: error.message
      });
    }
  }
};

module.exports = {
  ...documentTrackingController,
  upload
};
