const Document = require('../models/Document');
const Folder = require('../models/Folder');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const unlinkAsync = promisify(fs.unlink);

// Helper function to extract text content from different file types
const extractFileContent = async (filePath, mimeType) => {
  try {
    const fileExtension = path.extname(filePath).toLowerCase();

    // For text files, read directly
    if (['.txt', '.md', '.html', '.json', '.xml', '.csv', '.js', '.ts', '.py', '.java', '.cpp', '.c'].includes(fileExtension)) {
      const content = await fs.promises.readFile(filePath, 'utf8');
      return content;
    }

    // For PDF files - extract actual text content
    if (fileExtension === '.pdf') {
      try {
        const pdfParse = require('pdf-parse');
        const dataBuffer = await fs.promises.readFile(filePath);
        const data = await pdfParse(dataBuffer);
        return `\n\n${data.text}\n\n---\nPages: ${data.numpages}\nFile: ${path.basename(filePath)}`;
      } catch (pdfError) {
        console.error('PDF parsing error:', pdfError);
        return `[PDF Document Content]\n\nUnable to extract text from PDF. This might be a scanned document or image-based PDF.\n\nFile: ${path.basename(filePath)}\nError: ${pdfError.message}`;
      }
    }

    // For DOC/DOCX files - extract actual text content
    if (['.doc', '.docx'].includes(fileExtension)) {
      try {
        const mammoth = require('mammoth');
        const result = await mammoth.extractRawText({ path: filePath });
        return `[Word Document Content]\n\n${result.value}\n\n---\nFile: ${path.basename(filePath)}`;
      } catch (wordError) {
        console.error('Word document parsing error:', wordError);
        return `[Word Document Content]\n\nUnable to extract text from Word document.\n\nFile: ${path.basename(filePath)}\nError: ${wordError.message}`;
      }
    }

    // For other file types, return file information
    const stats = await fs.promises.stat(filePath);
    return `[${mimeType.toUpperCase()} File]\n\nFile: ${path.basename(filePath)}\nSize: ${(stats.size / 1024 / 1024).toFixed(2)} MB\nType: ${mimeType}\n\nThis file type doesn't support direct text extraction, but you can add notes and comments here.`;
  } catch (error) {
    console.error('Error extracting file content:', error);
    return `[File Content]\n\nUnable to extract content from this file.\nFile: ${path.basename(filePath)}\nError: ${error.message}`;
  }
};

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

      // Extract content from the uploaded file
      const extractedContent = await extractFileContent(req.file.path, req.file.mimetype);

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
        tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
        content: extractedContent
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
        tags,
        favoritesOnly,
        archivedOnly
      } = req.query;

      const skip = (page - 1) * limit;

      // Build query
      let query = {
        $and: [
          {
            $or: [
              { ownerId: userId },
              { 'sharedWith.userId': userId },
              { 'sharedWith.userId': req.user.data.email }, // match email stored in userId
              { 'sharedWith.email': req.user.data.email },  // match email field
              { isPublic: true }
            ]
          },
          { isDeleted: { $ne: true } } // Exclude deleted documents
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

      if (favoritesOnly === 'true') {
        query.isFavorite = true;
      }

      if (archivedOnly === 'true') {
        query.isArchived = true;
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
        $and: [
          {
            $or: [
              { ownerId: userId },
              { 'sharedWith.userId': userId },
              { isPublic: true }
            ]
          },
          { isDeleted: { $ne: true } } // Exclude deleted documents
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
        $and: [
          {
            $or: [
              { ownerId: userId },
              { 'sharedWith.userId': userId },
              { isPublic: true }
            ]
          },
          { isDeleted: { $ne: true } } // Exclude deleted documents
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
      const { name, description, tags, isFavorite, isArchived, content } = req.body;

      const document = await Document.findOne({
        _id: id,
        $and: [
          {
            $or: [
              { ownerId: userId },
              { 'sharedWith.userId': userId, 'sharedWith.permission': { $in: ['edit', 'full'] } }
            ]
          },
          { isDeleted: { $ne: true } } // Exclude deleted documents
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
      if (content !== undefined) document.content = content;

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

      // Find document and check ownership
      const document = await Document.findOne({
        _id: id,
        ownerId: userId
      });

      if (!document) {
        return res.status(404).json({
          success: false,
          message: 'Document not found or access denied'
        });
      }

      // Soft delete - mark as deleted and set deletion date
      document.isDeleted = true;
      document.deletedAt = new Date();
      document.modifiedAt = new Date();
      await document.save();

      // Update folder statistics if document was in a folder
      if (document.folderId) {
        await Folder.findByIdAndUpdate(document.folderId, {
          $inc: { 
            documentCount: -1,
            totalSize: -(document.size || 0)
          }
        });
      }

      res.json({
        success: true,
        message: 'Document moved to trash successfully',
        data: {
          documentId: id,
          deletedAt: document.deletedAt
        }
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

  // Restore document from trash
  async restoreDocument(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.data.id;

      // Find deleted document and check ownership
      const document = await Document.findOne({
        _id: id,
        ownerId: userId,
        isDeleted: true
      });

      if (!document) {
        return res.status(404).json({
          success: false,
          message: 'Deleted document not found or access denied'
        });
      }

      // Restore document
      document.isDeleted = false;
      document.deletedAt = null;
      document.modifiedAt = new Date();
      await document.save();

      // Update folder statistics if document was in a folder
      if (document.folderId) {
        await Folder.findByIdAndUpdate(document.folderId, {
          $inc: { 
            documentCount: 1,
            totalSize: (document.size || 0)
          }
        });
      }

      res.json({
        success: true,
        message: 'Document restored successfully',
        data: {
          documentId: id,
          restoredAt: document.modifiedAt
        }
      });

    } catch (error) {
      console.error('Restore document error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to restore document',
        error: error.message
      });
    }
  }

  // Permanently delete document
  async permanentlyDeleteDocument(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.data.id;

      // Find deleted document and check ownership
      const document = await Document.findOne({
        _id: id,
        ownerId: userId,
        isDeleted: true
      });

      if (!document) {
        return res.status(404).json({
          success: false,
          message: 'Deleted document not found or access denied'
        });
      }

      // Delete the physical file
      if (document.filePath && fs.existsSync(document.filePath)) {
        await unlinkAsync(document.filePath);
      }

      // Delete the document record
      await Document.findByIdAndDelete(id);

      res.json({
        success: true,
        message: 'Document permanently deleted successfully',
        data: {
          documentId: id
        }
      });

    } catch (error) {
      console.error('Permanently delete document error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to permanently delete document',
        error: error.message
      });
    }
  }

  // Get deleted documents (trash)
  async getDeletedDocuments(req, res) {
    try {
      const userId = req.user.data.id;
      const { page = 1, limit = 20, search } = req.query;

      const query = {
        ownerId: userId,
        isDeleted: true
      };

      // Add search functionality
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { tags: { $in: [new RegExp(search, 'i')] } }
        ];
      }

      const skip = (page - 1) * limit;

      const [documents, total] = await Promise.all([
        Document.find(query)
          .sort({ deletedAt: -1 })
          .skip(skip)
          .limit(parseInt(limit))
          .populate('folderId', 'name color'),
        Document.countDocuments(query)
      ]);

      const totalPages = Math.ceil(total / limit);

      res.json({
        success: true,
        data: {
          documents,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: totalPages
          }
        }
      });

    } catch (error) {
      console.error('Get deleted documents error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get deleted documents',
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
        ownerId: userId,
        isDeleted: { $ne: true } // Exclude deleted documents
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

  // Share document with collaborator
  async shareDocument(req, res) {
    try {
      const { id } = req.params;
      const { email, permission, message } = req.body;
      const userId = req.user.data.id;

      // Validate input
      if (!email || !permission) {
        return res.status(400).json({
          success: false,
          message: 'Email and permission are required'
        });
      }

      if (!['view', 'edit', 'comment'].includes(permission)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid permission. Must be view, edit, or comment'
        });
      }

      // Check if document exists and user owns it
      const document = await Document.findOne({
        _id: id,
        ownerId: userId,
        isDeleted: { $ne: true } // Exclude deleted documents
      });
      if (!document) {
        return res.status(404).json({
          success: false,
          message: 'Document not found or access denied'
        });
      }



      // Check if already shared with this user
      const existingShare = document.sharedWith?.find(share =>
        share.userId === email || share.email === email
      );

      if (existingShare) {
        // Update existing permission
        existingShare.permission = permission;
        existingShare.updatedAt = new Date();
        if (message) {
          existingShare.message = message;
        }
      } else {
        // Add new share
        if (!document.sharedWith) {
          document.sharedWith = [];
        }

        document.sharedWith.push({
          userId: email,
          email: email,
          permission: permission,
          message: message || '',
          sharedAt: new Date(),
          updatedAt: new Date(),
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
        });
      }

      // Save document
      await document.save();

      // Send email notification
      try {
        const emailService = require('../services/emailService');
        if (emailService.isConfigured()) {
          await emailService.sendDocumentShareNotification(
            email,
            document.name,
            id,
            req.user.data.name || req.user.data.email,
            permission,
            message
          );
        }
      } catch (emailError) {
        console.log('⚠️ Email notification failed:', emailError.message);
        // Continue even if email fails
      }

      res.json({
        success: true,
        message: 'Document shared successfully',
        data: {
          documentId: id,
          sharedWith: email,
          permission: permission
        }
      });

    } catch (error) {
      console.error('Share document error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to share document',
        error: error.message
      });
    }
  }

  // Move document to folder
  async moveDocument(req, res) {
    try {
      const { id } = req.params;
      const { folderId } = req.body;
      const userId = req.user.data.id;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'Document ID is required'
        });
      }

      // Check if document exists and user has access
      const document = await Document.findOne({
        _id: id,
        $and: [
          {
            $or: [
              { ownerId: userId },
              { 'sharedWith.userId': userId, 'sharedWith.permission': { $in: ['edit', 'admin'] } }
            ]
          },
          { isDeleted: { $ne: true } } // Exclude deleted documents
        ]
      });

      if (!document) {
        return res.status(404).json({
          success: false,
          message: 'Document not found or access denied'
        });
      }

      // If moving to a folder, validate folder access
      if (folderId) {
        const folder = await Folder.findOne({
          _id: folderId,
          $or: [
            { ownerId: userId },
            { 'permissions.userId': userId }
          ]
        });

        if (!folder) {
          return res.status(404).json({
            success: false,
            message: 'Target folder not found or access denied'
          });
        }
      }

      // Update old folder document count and size
      if (document.folderId) {
        await Folder.findByIdAndUpdate(document.folderId, {
          $inc: { 
            documentCount: -1,
            totalSize: -(document.size || 0)
          }
        });
      }

      // Update new folder document count and size
      if (folderId) {
        await Folder.findByIdAndUpdate(folderId, {
          $inc: { 
            documentCount: 1,
            totalSize: (document.size || 0)
          }
        });
      }

      // Update document
      document.folderId = folderId || null;
      document.modifiedAt = new Date();
      await document.save();

      res.json({
        success: true,
        message: 'Document moved successfully',
        data: {
          documentId: id,
          folderId: folderId,
          newLocation: folderId ? 'folder' : 'root'
        }
      });

    } catch (error) {
      console.error('Move document error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to move document',
        error: error.message
      });
    }
  }

  // Move multiple documents to folder
  async moveMultipleDocuments(req, res) {
    try {
      const { documentIds, folderId } = req.body;
      const userId = req.user.data.id;

      if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Document IDs array is required'
        });
      }

      // Check if all documents exist and user has access
      const documents = await Document.find({
        _id: { $in: documentIds },
        $and: [
          {
            $or: [
              { ownerId: userId },
              { 'sharedWith.userId': userId, 'sharedWith.permission': { $in: ['edit', 'admin'] } }
            ]
          },
          { isDeleted: { $ne: true } } // Exclude deleted documents
        ]
      });

      if (documents.length !== documentIds.length) {
        return res.status(404).json({
          success: false,
          message: 'Some documents not found or access denied'
        });
      }

      // If moving to a folder, validate folder access
      if (folderId) {
        const folder = await Folder.findOne({
          _id: folderId,
          $or: [
            { ownerId: userId },
            { 'permissions.userId': userId }
          ]
        });

        if (!folder) {
          return res.status(404).json({
            success: false,
            message: 'Target folder not found or access denied'
          });
        }
      }

      // Track folder updates
      const folderUpdates = {};

      // Update documents and track folder changes
      for (const document of documents) {
        // Update old folder
        if (document.folderId) {
          if (!folderUpdates[document.folderId]) {
            folderUpdates[document.folderId] = { count: 0, size: 0 };
          }
          folderUpdates[document.folderId].count--;
          folderUpdates[document.folderId].size -= (document.size || 0);
        }

        // Update new folder
        if (folderId) {
          if (!folderUpdates[folderId]) {
            folderUpdates[folderId] = { count: 0, size: 0 };
          }
          folderUpdates[folderId].count++;
          folderUpdates[folderId].size += (document.size || 0);
        }

        // Update document
        document.folderId = folderId || null;
        document.modifiedAt = new Date();
        await document.save();
      }

      // Update folder statistics
      for (const [folderId, update] of Object.entries(folderUpdates)) {
        await Folder.findByIdAndUpdate(folderId, {
          $inc: { 
            documentCount: update.count,
            totalSize: update.size
          }
        });
      }

      res.json({
        success: true,
        message: `${documents.length} documents moved successfully`,
        data: {
          movedCount: documents.length,
          folderId: folderId,
          newLocation: folderId ? 'folder' : 'root'
        }
      });

    } catch (error) {
      console.error('Move multiple documents error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to move documents',
        error: error.message
      });
    }
  }

  // Clean up expired documents (run this as a scheduled task)
  async cleanupExpiredDocuments() {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Find documents that have been in trash for more than 30 days
      const expiredDocuments = await Document.find({
        isDeleted: true,
        deletedAt: { $lt: thirtyDaysAgo }
      });

      let deletedCount = 0;
      for (const document of expiredDocuments) {
        try {
          // Delete the physical file
          if (document.filePath && fs.existsSync(document.filePath)) {
            await unlinkAsync(document.filePath);
          }

          // Delete the document record
          await Document.findByIdAndDelete(document._id);
          deletedCount++;

          console.log(`Permanently deleted expired document: ${document.name} (ID: ${document._id})`);
        } catch (error) {
          console.error(`Failed to delete expired document ${document._id}:`, error);
        }
      }

      console.log(`Cleanup completed: ${deletedCount} expired documents permanently deleted`);
      return deletedCount;

    } catch (error) {
      console.error('Cleanup expired documents error:', error);
      throw error;
    }
  }
}

module.exports = new DocumentController();
