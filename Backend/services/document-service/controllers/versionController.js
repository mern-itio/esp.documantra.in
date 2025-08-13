const Version = require('../models/Version');
const Document = require('../models/Document');

class VersionController {
  // Get all versions for a document
  async getDocumentVersions(req, res) {
    try {
      const { documentId } = req.params;
      const userId = req.user.data.id;

      // Check if user has access to this document
      const document = await Document.findById(documentId);
      if (!document) {
        return res.status(404).json({ 
          success: false, 
          message: 'Document not found' 
        });
      }

      // Check if user owns the document or if it's shared with them
      const isOwner = document.ownerId === userId;
      const isShared = document.sharedWith.some(share => share.userId === userId);
      
      if (!isOwner && !isShared) {
        return res.status(403).json({ 
          success: false, 
          message: 'Access denied' 
        });
      }

      const versions = await Version.find({ documentId })
        .sort({ createdAt: -1 })
        .lean();

      res.json({ 
        success: true, 
        data: versions 
      });
    } catch (error) {
      console.error('Error getting document versions:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to get document versions',
        error: error.message 
      });
    }
  }

  // Create a new version
  async createVersion(req, res) {
    try {
      const { documentId } = req.params;
      const userId = req.user.data.id;
      const { content, description, changes } = req.body;

      // Check if user has access to this document
      const document = await Document.findById(documentId);
      if (!document) {
        return res.status(404).json({ 
          success: false, 
          message: 'Document not found' 
        });
      }

      // Check if user owns the document or if it's shared with them
      const isOwner = document.ownerId === userId;
      const isShared = document.sharedWith.some(share => share.userId === userId);
      
      if (!isOwner && !isShared) {
        return res.status(403).json({ 
          success: false, 
          message: 'Access denied' 
        });
      }

      // Get the latest version number
      const latestVersion = await Version.findOne({ documentId })
        .sort({ version: -1 })
        .lean();
      
      const newVersionNumber = latestVersion 
        ? (parseInt(latestVersion.version) + 1).toString()
        : '1';

      // Create new version
      const newVersion = new Version({
        documentId,
        version: newVersionNumber,
        content: content || document.content || '',
        description: description || `Content updated by ${req.user.data.name || req.user.data.email}`,
        author: req.user.data.email,
        authorName: req.user.data.name || req.user.data.email,
        authorAvatar: req.user.data.avatar || '',
        size: content ? content.length : (document.content ? document.content.length : 0),
        changes: changes || { additions: 0, deletions: 0, modifications: 0 },
        tags: [],
        approved: false,
        metadata: {
          editor: 'CollaborativeEditor',
          changeType: 'content_edit',
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        }
      });

      await newVersion.save();

      res.status(201).json({ 
        success: true, 
        message: 'Version created successfully', 
        data: newVersion 
      });
    } catch (error) {
      console.error('Error creating version:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to create version',
        error: error.message 
      });
    }
  }

  // Get a specific version
  async getVersion(req, res) {
    try {
      const { versionId } = req.params;
      const userId = req.user.data.id;

      const version = await Version.findById(versionId);
      if (!version) {
        return res.status(404).json({ 
          success: false, 
          message: 'Version not found' 
        });
      }

      // Check if user has access to the document
      const document = await Document.findById(version.documentId);
      if (!document) {
        return res.status(404).json({ 
          success: false, 
          message: 'Document not found' 
        });
      }

      const isOwner = document.ownerId === userId;
      const isShared = document.sharedWith.some(share => share.userId === userId);
      
      if (!isOwner && !isShared) {
        return res.status(403).json({ 
          success: false, 
          message: 'Access denied' 
        });
      }

      res.json({ 
        success: true, 
        data: version 
      });
    } catch (error) {
      console.error('Error getting version:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to get version',
        error: error.message 
      });
    }
  }

  // Update version metadata (tags, approval, etc.)
  async updateVersion(req, res) {
    try {
      const { versionId } = req.params;
      const userId = req.user.data.id;
      const updates = req.body;

      const version = await Version.findById(versionId);
      if (!version) {
        return res.status(404).json({ 
          success: false, 
          message: 'Version not found' 
        });
      }

      // Check if user has access to the document
      const document = await Document.findById(version.documentId);
      if (!document) {
        return res.status(404).json({ 
          success: false, 
          message: 'Document not found' 
        });
      }

      const isOwner = document.ownerId === userId;
      const isShared = document.sharedWith.some(share => share.userId === userId);
      
      if (!isOwner && !isShared) {
        return res.status(403).json({ 
          success: false, 
          message: 'Access denied' 
        });
      }

      // Only allow updating certain fields
      const allowedUpdates = ['tags', 'approved', 'description'];
      const filteredUpdates = {};
      
      allowedUpdates.forEach(field => {
        if (updates[field] !== undefined) {
          filteredUpdates[field] = updates[field];
        }
      });

      const updatedVersion = await Version.findByIdAndUpdate(
        versionId,
        filteredUpdates,
        { new: true, runValidators: true }
      );

      res.json({ 
        success: true, 
        message: 'Version updated successfully', 
        data: updatedVersion 
      });
    } catch (error) {
      console.error('Error updating version:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to update version',
        error: error.message 
      });
    }
  }

  // Delete a version (only document owner can delete)
  async deleteVersion(req, res) {
    try {
      const { versionId } = req.params;
      const userId = req.user.data.id;

      const version = await Version.findById(versionId);
      if (!version) {
        return res.status(404).json({ 
          success: false, 
          message: 'Version not found' 
        });
      }

      // Check if user owns the document
      const document = await Document.findById(version.documentId);
      if (!document) {
        return res.status(404).json({ 
          success: false, 
          message: 'Document not found' 
        });
      }

      if (document.ownerId !== userId) {
        return res.status(403).json({ 
          success: false, 
          message: 'Only document owner can delete versions' 
        });
      }

      await Version.findByIdAndDelete(versionId);

      res.json({ 
        success: true, 
        message: 'Version deleted successfully' 
      });
    } catch (error) {
      console.error('Error deleting version:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to delete version',
        error: error.message 
      });
    }
  }

  // Compare two versions
  async compareVersions(req, res) {
    try {
      const { fromVersionId, toVersionId } = req.params;
      const userId = req.user.data.id;

      const [fromVersion, toVersion] = await Promise.all([
        Version.findById(fromVersionId),
        Version.findById(toVersionId)
      ]);

      if (!fromVersion || !toVersion) {
        return res.status(404).json({ 
          success: false, 
          message: 'One or both versions not found' 
        });
      }

      // Check if user has access to the document
      const document = await Document.findById(fromVersion.documentId);
      if (!document) {
        return res.status(404).json({ 
          success: false, 
          message: 'Document not found' 
        });
      }

      const isOwner = document.ownerId === userId;
      const isShared = document.sharedWith.some(share => share.userId === userId);
      
      if (!isOwner && !isShared) {
        return res.status(403).json({ 
          success: false, 
          message: 'Access denied' 
        });
      }

      // Simple text comparison (you can implement more sophisticated diffing)
      const fromContent = fromVersion.content || '';
      const toContent = toVersion.content || '';
      
      const fromLines = fromContent.split('\n');
      const toLines = toContent.split('\n');
      
      let additions = 0;
      let deletions = 0;
      let modifications = 0;
      
      const maxLines = Math.max(fromLines.length, toLines.length);
      for (let i = 0; i < maxLines; i++) {
        if (i >= fromLines.length) {
          additions++;
        } else if (i >= toLines.length) {
          deletions++;
        } else if (fromLines[i] !== toLines[i]) {
          modifications++;
        }
      }

      const comparison = {
        fromVersion: fromVersion.version,
        toVersion: toVersion.version,
        fromVersionId: fromVersion._id,
        toVersionId: toVersion._id,
        changes: {
          additions,
          deletions,
          modifications,
          total: additions + deletions + modifications
        },
        fromContent: fromContent,
        toContent: toContent
      };

      res.json({ 
        success: true, 
        data: comparison 
      });
    } catch (error) {
      console.error('Error comparing versions:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to compare versions',
        error: error.message 
      });
    }
  }
}

module.exports = new VersionController();
