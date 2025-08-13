const Document = require('../models/Document');
const Folder = require('../models/Folder');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const unlinkAsync = promisify(fs.unlink);

class DocumentController {
  // Upload document
  async uploadDocument(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ 
          success: false, 
          message: 'No file uploaded' 
        });
      }

      const { folderId, description, tags } = req.body;
      const userId = req.user.data.id; // From JWT token

      // Validate file size (50MB limit)
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (req.file.size > maxSize) {
        // Delete uploaded file
        await unlinkAsync(req.file.path);
        return res.status(400).json({
          success: false,
          message: 'File size exceeds 50MB limit'
        });
      }

      // Check if folder exists and user has access
      if (folderId) {
        const folder = await Folder.findOne({ 
          _id: folderId, 
          $or: [
            { ownerId: userId },
            { 'permissions.userId': userId }
          ]
        });
        
        if (!folder) {
          await unlinkAsync(req.file.path);
          return res.status(404).json({
            success: false,
            message: 'Folder not found or access denied'
          });
        }
      }

      // Create document record
      const document = new Document({
        name: req.file.originalname,
        originalName: req.file.originalname,
        type: path.extname(req.file.originalname).substring(1).toLowerCase(),
        size: req.file.size,
        mimeType: req.file.mimetype,
        filePath: req.file.path,
        fileName: req.file.filename,
        uploadedBy: userId,
        ownerId: userId,
        folderId: folderId || null,
        description: description || '',
        tags: tags ? tags.split(',').map(tag => tag.trim()) : []
      });

      await document.save();

      // Update folder document count
      if (folderId) {
        await Folder.findByIdAndUpdate(folderId, {
          $inc: { documentCount: 1, totalSize: req.file.size }
        });
      }

      res.status(201).json({
        success: true,
        message: 'Document uploaded successfully',
        data: {
          id: document._id,
          name: document.name,
          type: document.type,
          size: document.size,
          uploadedAt: document.createdAt
        }
      });

    } catch (error) {
      console.error('Upload error:', error);
      
      // Clean up file if document creation fails
      if (req.file) {
        try {
          await unlinkAsync(req.file.path);
        } catch (unlinkError) {
          console.error('Failed to delete file:', unlinkError);
        }
      }

      res.status(500).json({
        success: false,
        message: 'Failed to upload document',
        error: error.message
      });
    }
  }

  // Get user documents
  async getUserDocuments(req, res) {
    try {
      const userId = req.user.data.id;
      const { 
        page = 1, 
        limit = 20, 
        folderId, 
        search, 
        sortBy = 'createdAt', 
        sortOrder = 'desc',
        type,
        tags
      } = req.query;

      const skip = (page - 1) * limit;
      
      // Build query
      let query = { 
        $or: [
          { ownerId: userId },
          { 'sharedWith.userId': userId },
          { isPublic: true }
        ]
      };

      if (folderId) {
        query.folderId = folderId;
      }

      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { tags: { $in: [new RegExp(search, 'i')] } }
        ];
      }

      if (type) {
        query.type = { $in: type.split(',') };
      }

      if (tags) {
        query.tags = { $in: tags.split(',') };
      }

      // Build sort object
      const sort = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

      // Execute query
      const documents = await Document.find(query)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .select('-filePath -fileName')
        .populate('folderId', 'name color');

      const total = await Document.countDocuments(query);

      res.json({
        success: true,
        data: {
          documents,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          }
        }
      });

    } catch (error) {
      console.error('Get documents error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch documents',
        error: error.message
      });
    }
  }

  // Get single document
  async getDocument(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.data.id;

      const document = await Document.findOne({
        _id: id,
        $or: [
          { ownerId: userId },
          { 'sharedWith.userId': userId },
          { isPublic: true }
        ]
      }).populate('folderId', 'name color');

      if (!document) {
        return res.status(404).json({
          success: false,
          message: 'Document not found or access denied'
        });
      }

      // Increment view count
      document.views += 1;
      document.lastAccessedAt = new Date();
      await document.save();

      res.json({
        success: true,
        data: document
      });

    } catch (error) {
      console.error('Get document error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch document',
        error: error.message
      });
    }
  }

  // Download document
  async downloadDocument(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.data.id;

      const document = await Document.findOne({
        _id: id,
        $or: [
          { ownerId: userId },
          { 'sharedWith.userId': userId },
          { isPublic: true }
        ]
      });

      if (!document) {
        return res.status(404).json({
          success: false,
          message: 'Document not found or access denied'
        });
      }

      // Check if file exists
      if (!fs.existsSync(document.filePath)) {
        return res.status(404).json({
          success: false,
          message: 'File not found on server'
        });
      }

      // Increment download count
      document.downloads += 1;
      document.lastAccessedAt = new Date();
      await document.save();

      // Set headers and send file
      res.setHeader('Content-Type', document.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${document.originalName}"`);
      res.setHeader('Content-Length', document.size);

      res.download(document.filePath, document.originalName);

    } catch (error) {
      console.error('Download error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to download document',
        error: error.message
      });
    }
  }

  // Update document metadata
  async updateDocument(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.data.id;
      const { name, description, tags, isFavorite, isArchived } = req.body;

      const document = await Document.findOne({
        _id: id,
        $or: [
          { ownerId: userId },
          { 'sharedWith.userId': userId, 'sharedWith.permission': { $in: ['edit', 'full'] } }
        ]
      });

      if (!document) {
        return res.status(404).json({
          success: false,
          message: 'Document not found or access denied'
        });
      }

      // Update fields
      if (name !== undefined) document.name = name;
      if (description !== undefined) document.description = description;
      if (tags !== undefined) document.tags = tags.split(',').map(tag => tag.trim());
      if (isFavorite !== undefined) document.isFavorite = isFavorite;
      if (isArchived !== undefined) document.isArchived = isArchived;

      document.modifiedAt = new Date();
      await document.save();

      res.json({
        success: true,
        message: 'Document updated successfully',
        data: document
      });

    } catch (error) {
      console.error('Update document error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update document',
        error: error.message
      });
    }
  }

  // Delete document
  async deleteDocument(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.data.id;

      const document = await Document.findOne({
        _id: id,
        ownerId: userId // Only owner can delete
      });

      if (!document) {
        return res.status(404).json({
          success: false,
          message: 'Document not found or access denied'
        });
      }

      // Delete file from storage
      if (fs.existsSync(document.filePath)) {
        await unlinkAsync(document.filePath);
      }

      // Update folder stats if document was in a folder
      if (document.folderId) {
        await Folder.findByIdAndUpdate(document.folderId, {
          $inc: { documentCount: -1, totalSize: -document.size }
        });
      }

      // Delete document record
      await Document.findByIdAndDelete(id);

      res.json({
        success: true,
        message: 'Document deleted successfully'
      });

    } catch (error) {
      console.error('Delete document error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete document',
        error: error.message
      });
    }
  }

  // Bulk delete documents
  async bulkDeleteDocuments(req, res) {
    try {
      const { documentIds } = req.body;
      const userId = req.user.data.id;

      if (!documentIds || !Array.isArray(documentIds)) {
        return res.status(400).json({
          success: false,
          message: 'Document IDs array is required'
        });
      }

      // Get documents that user owns
      const documents = await Document.find({
        _id: { $in: documentIds },
        ownerId: userId
      });

      if (documents.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No documents found or access denied'
        });
      }

      // Delete files from storage
      for (const doc of documents) {
        if (fs.existsSync(doc.filePath)) {
          try {
            await unlinkAsync(doc.filePath);
          } catch (error) {
            console.error(`Failed to delete file: ${doc.filePath}`, error);
          }
        }
      }

      // Update folder stats
      const folderUpdates = {};
      documents.forEach(doc => {
        if (doc.folderId) {
          if (!folderUpdates[doc.folderId]) {
            folderUpdates[doc.folderId] = { count: 0, size: 0 };
          }
          folderUpdates[doc.folderId].count++;
          folderUpdates[doc.folderId].size += doc.size;
        }
      });

      // Apply folder updates
      for (const [folderId, update] of Object.entries(folderUpdates)) {
        await Folder.findByIdAndUpdate(folderId, {
          $inc: { 
            documentCount: -update.count, 
            totalSize: -update.size 
          }
        });
      }

      // Delete document records
      await Document.deleteMany({ _id: { $in: documentIds } });

      res.json({
        success: true,
        message: `Successfully deleted ${documents.length} documents`
      });

    } catch (error) {
      console.error('Bulk delete error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete documents',
        error: error.message
      });
    }
  }
}

module.exports = new DocumentController();
