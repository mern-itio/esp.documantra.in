const Comment = require('../models/Comment');
const Document = require('../models/Document');

class CommentController {
  // Get all comments for a document
  async getDocumentComments(req, res) {
    try {
      const { documentId } = req.params;
      const { versionId } = req.query; // Add version filtering
      const userId = req.user.data.id;
      const userEmail = req.user.data.email;

      // Check if user has access to the document
      const document = await Document.findOne({
        _id: documentId,
        $and: [
          {
            $or: [
              { ownerId: userId },
              { 'sharedWith.userId': userId },
              { 'sharedWith.userId': userEmail }, // Match email stored in userId field
              { 'sharedWith.email': userEmail },  // Match email field
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

      // Build query with optional version filtering
      const query = { documentId };
      if (versionId) {
        query.versionId = versionId;
      }

      const comments = await Comment.find(query)
        .sort({ timestamp: -1 })
        .populate('replies', null, null, { sort: { timestamp: 1 } })
        .populate('versionId', 'version description createdAt');

      res.json({
        success: true,
        data: comments
      });

    } catch (error) {
      console.error('Get comments error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch comments',
        error: error.message
      });
    }
  }

  // Create a new comment
  async createComment(req, res) {
    try {
      const { documentId } = req.params;
      const userId = req.user.data.id;
      const userEmail = req.user.data.email;
      const { content, position, mentions, attachments, versionId } = req.body;

      // Check if user has access to the document
      const document = await Document.findOne({
        _id: documentId,
        $and: [
          {
            $or: [
              { ownerId: userId },
              { 'sharedWith.userId': userId, 'sharedWith.permission': { $in: ['comment', 'edit', 'full'] } },
              { 'sharedWith.userId': userEmail, 'sharedWith.permission': { $in: ['comment', 'edit', 'full'] } }, // Match email stored in userId field
              { 'sharedWith.email': userEmail, 'sharedWith.permission': { $in: ['comment', 'edit', 'full'] } },  // Match email field
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

      // Get user info from auth token
      const userName = req.user.data.name || userEmail;

      // Get current version information if not provided
      let versionInfo = {};
      if (versionId) {
        // Use provided version ID
        const Version = require('../models/Version');
        const version = await Version.findById(versionId);
        if (version) {
          versionInfo = {
            versionId: version._id,
            versionNumber: version.version || 'Unknown',
            versionDescription: version.description || ''
          };
        }
      } else {
        // Get the most recent version
        const Version = require('../models/Version');
        const latestVersion = await Version.findOne({ documentId })
          .sort({ createdAt: -1 })
          .limit(1);
        
        if (latestVersion) {
          versionInfo = {
            versionId: latestVersion._id,
            versionNumber: latestVersion.version || 'Latest',
            versionDescription: latestVersion.description || 'Most recent version'
          };
        }
      }

      const comment = new Comment({
        documentId,
        author: userEmail,
        authorName: userName,
        authorAvatar: req.user.data.avatar || '',
        content,
        position: position || { page: 1, x: 0, y: 0 },
        mentions: mentions || [],
        attachments: attachments || [],
        ...versionInfo
      });

      await comment.save();

      // Populate the comment with replies for consistent response
      await comment.populate('replies');

      res.status(201).json({
        success: true,
        message: 'Comment created successfully',
        data: comment
      });

    } catch (error) {
      console.error('Create comment error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create comment',
        error: error.message
      });
    }
  }

  // Get comments by version
  async getCommentsByVersion(req, res) {
    try {
      const { documentId, versionId } = req.params;
      const userId = req.user.data.id;
      const userEmail = req.user.data.email;

      // Check if user has access to the document
      const document = await Document.findOne({
        _id: documentId,
        $and: [
          {
            $or: [
              { ownerId: userId },
              { 'sharedWith.userId': userId },
              { 'sharedWith.userId': userEmail }, // Match email stored in userId field
              { 'sharedWith.email': userEmail },  // Match email field
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

      // Get comments for specific version
      const comments = await Comment.find({ 
        documentId, 
        versionId 
      })
        .sort({ timestamp: -1 })
        .populate('replies', null, null, { sort: { timestamp: 1 } })
        .populate('versionId', 'version description createdAt');

      res.json({
        success: true,
        data: comments
      });

    } catch (error) {
      console.error('Get comments by version error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch comments by version',
        error: error.message
      });
    }
  }

  // Update a comment
  async updateComment(req, res) {
    try {
      const { commentId } = req.params;
      const userId = req.user.data.id;
      const { content, position, mentions, attachments } = req.body;

      const comment = await Comment.findById(commentId);
      if (!comment) {
        return res.status(404).json({
          success: false,
          message: 'Comment not found'
        });
      }

      // Check if user can edit this comment (author or document owner)
      const document = await Document.findOne({
        _id: comment.documentId,
        isDeleted: { $ne: true } // Exclude deleted documents
      });
      if (!document) {
        return res.status(404).json({
          success: false,
          message: 'Document not found or access denied'
        });
      }

      const canEdit = comment.author === userId || document.ownerId === userId;
      if (!canEdit) {
        return res.status(403).json({
          success: false,
          message: 'You can only edit your own comments'
        });
      }

      // Update fields
      if (content !== undefined) comment.content = content;
      if (position !== undefined) comment.position = position;
      if (mentions !== undefined) comment.mentions = mentions;
      if (attachments !== undefined) comment.attachments = attachments;

      await comment.save();
      await comment.populate('replies');

      res.json({
        success: true,
        message: 'Comment updated successfully',
        data: comment
      });

    } catch (error) {
      console.error('Update comment error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update comment',
        error: error.message
      });
    }
  }

  // Delete a comment
  async deleteComment(req, res) {
    try {
      const { commentId } = req.params;
      const userId = req.user.data.id;

      const comment = await Comment.findById(commentId);
      if (!comment) {
        return res.status(404).json({
          success: false,
          message: 'Comment not found'
        });
      }

      // Check if user can delete this comment (author or document owner)
      const document = await Document.findOne({
        _id: comment.documentId,
        isDeleted: { $ne: true } // Exclude deleted documents
      });
      if (!document) {
        return res.status(404).json({
          success: false,
          message: 'Document not found or access denied'
        });
      }

      const canDelete = comment.author === userId || document.ownerId === userId;
      if (!canDelete) {
        return res.status(403).json({
          success: false,
          message: 'You can only delete your own comments'
        });
      }

      await Comment.findByIdAndDelete(commentId);

      res.json({
        success: true,
        message: 'Comment deleted successfully'
      });

    } catch (error) {
      console.error('Delete comment error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete comment',
        error: error.message
      });
    }
  }

  // Resolve/Unresolve a comment
  async toggleCommentResolution(req, res) {
    try {
      const { commentId } = req.params;
      const userId = req.user.data.id;
      const userEmail = req.user.data.email;
      const { resolved } = req.body;

      const comment = await Comment.findById(commentId);
      if (!comment) {
        return res.status(404).json({
          success: false,
          message: 'Comment not found'
        });
      }

      // Check if user has access to the document
      const document = await Document.findOne({
        _id: comment.documentId,
        $and: [
          {
            $or: [
              { ownerId: userId },
              { 'sharedWith.userId': userId, 'sharedWith.permission': { $in: ['edit', 'full'] } },
              { 'sharedWith.userId': userEmail, 'sharedWith.permission': { $in: ['edit', 'full'] } }, // Match email stored in userId field
              { 'sharedWith.email': userEmail, 'sharedWith.permission': { $in: ['edit', 'full'] } },  // Match email field
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

      // Update resolution status
      comment.resolved = resolved;
      if (resolved) {
        comment.resolvedBy = userId;
        comment.resolvedAt = new Date();
      } else {
        comment.resolvedBy = null;
        comment.resolvedAt = null;
      }

      await comment.save();
      await comment.populate('replies');

      res.json({
        success: true,
        message: `Comment ${resolved ? 'resolved' : 'unresolved'} successfully`,
        data: comment
      });

    } catch (error) {
      console.error('Toggle comment resolution error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update comment resolution',
        error: error.message
      });
    }
  }

  // Add a reply to a comment
  async addCommentReply(req, res) {
    try {
      const { commentId } = req.params;
      const userId = req.user.data.id;
      const userEmail = req.user.data.email;
      const { content, mentions } = req.body;

      const comment = await Comment.findById(commentId);
      if (!comment) {
        return res.status(404).json({
          success: false,
          message: 'Comment not found'
        });
      }

      // Check if user has access to the document
      const document = await Document.findOne({
        _id: comment.documentId,
        $and: [
          {
            $or: [
              { ownerId: userId },
              { 'sharedWith.userId': userId, 'sharedWith.permission': { $in: ['comment', 'edit', 'full'] } },
              { 'sharedWith.userId': userEmail, 'sharedWith.permission': { $in: ['comment', 'edit', 'full'] } }, // Match email stored in userId field
              { 'sharedWith.email': userEmail, 'sharedWith.permission': { $in: ['comment', 'edit', 'full'] } },  // Match email field
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

      // Get user info from auth token
      const userName = req.user.data.name || userEmail;

      const reply = {
        author: userEmail,
        authorName: userName,
        authorAvatar: req.user.data.avatar || '',
        content,
        mentions: mentions || []
      };

      comment.replies.push(reply);
      await comment.save();
      await comment.populate('replies');

      res.status(201).json({
        success: true,
        message: 'Reply added successfully',
        data: comment
      });

    } catch (error) {
      console.error('Add reply error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add reply',
        error: error.message
      });
    }
  }

  // Update a reply
  async updateCommentReply(req, res) {
    try {
      const { commentId, replyId } = req.params;
      const userId = req.user.data.id;
      const { content, mentions } = req.body;

      const comment = await Comment.findById(commentId);
      if (!comment) {
        return res.status(404).json({
          success: false,
          message: 'Comment not found'
        });
      }

      const reply = comment.replies.id(replyId);
      if (!reply) {
        return res.status(404).json({
          success: false,
          message: 'Reply not found'
        });
      }

      // Check if user can edit this reply (author or document owner)
      const document = await Document.findOne({
        _id: comment.documentId,
        isDeleted: { $ne: true } // Exclude deleted documents
      });
      if (!document) {
        return res.status(404).json({
          success: false,
          message: 'Document not found or access denied'
        });
      }

      const canEdit = reply.author === userId || document.ownerId === userId;
      if (!canEdit) {
        return res.status(403).json({
          success: false,
          message: 'You can only edit your own replies'
        });
      }

      // Update reply fields
      if (content !== undefined) reply.content = content;
      if (mentions !== undefined) reply.mentions = mentions;

      await comment.save();
      await comment.populate('replies');

      res.json({
        success: true,
        message: 'Reply updated successfully',
        data: comment
      });

    } catch (error) {
      console.error('Update reply error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update reply',
        error: error.message
      });
    }
  }

  // Delete a reply
  async deleteCommentReply(req, res) {
    try {
      const { commentId, replyId } = req.params;
      const userId = req.user.data.id;

      const comment = await Comment.findById(commentId);
      if (!comment) {
        return res.status(404).json({
          success: false,
          message: 'Comment not found'
        });
      }

      const reply = comment.replies.id(replyId);
      if (!reply) {
        return res.status(404).json({
          success: false,
          message: 'Reply not found'
        });
      }

      // Check if user can delete this reply (author or document owner)
      const document = await Document.findOne({
        _id: comment.documentId,
        isDeleted: { $ne: true } // Exclude deleted documents
      });
      if (!document) {
        return res.status(404).json({
          success: false,
          message: 'Document not found or access denied'
        });
      }

      const canDelete = reply.author === userId || document.ownerId === userId;
      if (!canDelete) {
        return res.status(403).json({
          success: false,
          message: 'You can only delete your own replies'
        });
      }

      reply.remove();
      await comment.save();
      await comment.populate('replies');

      res.json({
        success: true,
        message: 'Reply deleted successfully',
        data: comment
      });

    } catch (error) {
      console.error('Delete reply error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete reply',
        error: error.message
      });
    }
  }
}

module.exports = new CommentController();
