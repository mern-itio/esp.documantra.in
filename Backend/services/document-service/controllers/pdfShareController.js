const Document = require('../models/Document');
const SharedDocument = require('../models/SharedDocument');
const emailService = require('../services/emailService');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { promisify } = require('util');
const unlinkAsync = promisify(fs.unlink);

class PDFShareController {
  // Upload PDF for sharing
  async uploadPDFForSharing(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No PDF file uploaded'
        });
      }

      // Validate file type
      if (req.file.mimetype !== 'application/pdf') {
        await unlinkAsync(req.file.path);
        return res.status(400).json({
          success: false,
          message: 'Only PDF files are allowed for sharing'
        });
      }

      const userId = req.user.data.id;
      const userEmail = req.user.data.email;
      const userName = req.user.data.name || req.user.data.email;

      // Create document record
      const document = new Document({
        name: req.file.originalname,
        originalName: req.file.originalname,
        type: 'pdf',
        size: req.file.size,
        mimeType: req.file.mimetype,
        filePath: req.file.path,
        fileName: req.file.filename,
        uploadedBy: userId,
        ownerId: userId,
        description: 'PDF uploaded for sharing',
        isPublic: false,
        shared: false
      });

      await document.save();

      res.status(201).json({
        success: true,
        message: 'PDF uploaded successfully',
        data: {
          documentId: document._id,
          fileName: document.name,
          fileSize: document.size,
          uploadDate: document.createdAt
        }
      });

    } catch (error) {
      console.error('Error uploading PDF for sharing:', error);
      
      // Clean up uploaded file if document creation failed
      if (req.file && req.file.path) {
        try {
          await unlinkAsync(req.file.path);
        } catch (unlinkError) {
          console.error('Error cleaning up uploaded file:', unlinkError);
        }
      }

      res.status(500).json({
        success: false,
        message: 'Failed to upload PDF',
        error: error.message
      });
    }
  }

  // Create share link and send emails
  async createShareAndSendEmails(req, res) {
    try {
      const { 
        documentId, 
        toRecipients = [], 
        ccRecipients = [], 
        bccRecipients = [],
        subject, 
        message, 
        allowDownload = true, 
        allowComments = false,
        expiresAt = null,
        password = null
      } = req.body;

      const userId = req.user.data.id;
      const userEmail = req.user.data.email;
      const userName = req.user.data.name || req.user.data.email;

      // Validate document exists and user owns it
      const document = await Document.findOne({
        _id: documentId,
        ownerId: userId,
        isDeleted: false
      });

      if (!document) {
        return res.status(404).json({
          success: false,
          message: 'Document not found or access denied'
        });
      }

      // Validate that at least one TO recipient is provided
      if (!toRecipients || !Array.isArray(toRecipients) || toRecipients.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'At least one recipient is required'
        });
      }

      // Validate email format for all recipients
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const allRecipients = [...toRecipients, ...(ccRecipients || []), ...(bccRecipients || [])];
      
      for (const recipient of allRecipients) {
        if (!emailRegex.test(recipient.email)) {
          return res.status(400).json({
            success: false,
            message: `Invalid email format: ${recipient.email}`
          });
        }
      }

      // Before creating the share, consume credits from subscription-service for pdf:share
      try {
        // Use service hostname by default for container-to-container calls
        const subscriptionServiceUrl = process.env.SUBSCRIPTION_SERVICE_URL || 'http://165.22.215.73:2110';
        const authHeader = req.headers['authorization'] || '';
        const resp = await fetch(`${subscriptionServiceUrl}/usage/consume`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(authHeader ? { Authorization: authHeader } : {})
          },
          body: JSON.stringify({ action: 'pdf:share' })
        });

        if (!resp.ok) {
          const body = await resp.json().catch(() => ({}));
          const status = resp.status;
          if (status === 402) {
            return res.status(402).json({ success: false, message: body?.message || 'Insufficient credits', data: body?.data || null });
          }
          return res.status(status).json({ success: false, message: body?.message || 'Failed to consume credits', data: body?.data || null });
        }
      } catch (consumeErr) {
        console.error('Error consuming credits for pdf:share:', consumeErr);
        return res.status(500).json({ success: false, message: 'Unable to verify credits for sharing. Please try again.' });
      }

      // Create shared document record
      const sharedDocument = new SharedDocument({
        documentId: document._id,
        ownerId: userId,
        ownerEmail: userEmail,
        ownerName: userName,
        toRecipients: toRecipients.map(recipient => ({
          email: recipient.email,
          name: recipient.name || ''
        })),
        ccRecipients: (ccRecipients || []).map(recipient => ({
          email: recipient.email,
          name: recipient.name || ''
        })),
        bccRecipients: (bccRecipients || []).map(recipient => ({
          email: recipient.email,
          name: recipient.name || ''
        })),
        allowDownload,
        allowComments,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        password,
        subject: subject || `Document shared: ${document.name}`,
        message: message || ''
      });

      await sharedDocument.save();

      // Update document as shared
      document.shared = true;
      await document.save();

      // Send emails with proper BCC handling
      const emailResults = [];
      
      // Send email to TO and CC recipients (they see all recipients)
      try {
        const emailSent = await emailService.sendPDFShareNotification(
          toRecipients.map(r => r.email).join(', '), // TO recipients
          document.name,
          sharedDocument.shareToken,
          userName,
          sharedDocument.subject,
          sharedDocument.message,
          sharedDocument.shareUrl,
          userEmail,
          ccRecipients || [],
          [], // Don't include BCC recipients in this email
          'TO_CC',
          sharedDocument.createdAt // Pass the actual share time
        );

        // Update TO and CC recipient email statuses
        for (const recipient of toRecipients) {
          const recipientDoc = sharedDocument.toRecipients.find(r => r.email === recipient.email);
          if (recipientDoc) {
            recipientDoc.emailSent = emailSent;
            recipientDoc.emailSentAt = new Date();
          }
          emailResults.push({
            email: recipient.email,
            type: 'TO',
            sent: emailSent
          });
        }

        for (const recipient of ccRecipients || []) {
          const recipientDoc = sharedDocument.ccRecipients.find(r => r.email === recipient.email);
          if (recipientDoc) {
            recipientDoc.emailSent = emailSent;
            recipientDoc.emailSentAt = new Date();
          }
          emailResults.push({
            email: recipient.email,
            type: 'CC',
            sent: emailSent
          });
        }

      } catch (emailError) {
        console.error(`Failed to send email to TO/CC recipients:`, emailError);
        
        // Mark TO and CC recipients as failed
        for (const recipient of toRecipients) {
          emailResults.push({
            email: recipient.email,
            type: 'TO',
            sent: false,
            error: emailError.message
          });
        }
        for (const recipient of ccRecipients || []) {
          emailResults.push({
            email: recipient.email,
            type: 'CC',
            sent: false,
            error: emailError.message
          });
        }
      }

      // Send separate emails to BCC recipients (they see all recipients but are in BCC field)
      for (const recipient of bccRecipients || []) {
        try {
          const emailSent = await emailService.sendPDFShareNotification(
            toRecipients.map(r => r.email).join(', '), // TO recipients (what BCC recipient sees as TO)
            document.name,
            sharedDocument.shareToken,
            userName,
            sharedDocument.subject,
            sharedDocument.message,
            sharedDocument.shareUrl,
            userEmail,
            ccRecipients || [], // CC recipients (what BCC recipient sees as CC)
            recipient.email, // BCC recipient (what BCC recipient sees as BCC)
            'BCC',
            sharedDocument.createdAt // Pass the actual share time
          );

          // Update BCC recipient email status
          const recipientDoc = sharedDocument.bccRecipients.find(r => r.email === recipient.email);
          if (recipientDoc) {
            recipientDoc.emailSent = emailSent;
            recipientDoc.emailSentAt = new Date();
          }

          emailResults.push({
            email: recipient.email,
            type: 'BCC',
            sent: emailSent
          });
        } catch (emailError) {
          console.error(`Failed to send email to BCC ${recipient.email}:`, emailError);
          emailResults.push({
            email: recipient.email,
            type: 'BCC',
            sent: false,
            error: emailError.message
          });
        }
      }

      await sharedDocument.save();

      res.status(201).json({
        success: true,
        message: 'Document shared successfully',
        data: {
          shareToken: sharedDocument.shareToken,
          shareUrl: sharedDocument.shareUrl,
          documentName: document.name,
          recipients: emailResults,
          expiresAt: sharedDocument.expiresAt,
          allowDownload: sharedDocument.allowDownload,
          allowComments: sharedDocument.allowComments
        }
      });

    } catch (error) {
      console.error('Error creating share and sending emails:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to share document',
        error: error.message
      });
    }
  }

  // Get shared document (public access)
  async getSharedDocument(req, res) {
    try {
      
      const { shareToken } = req.params;

      const sharedDocument = await SharedDocument.findOne({ shareToken })
        .populate('documentId');     

      if (!sharedDocument) {
        return res.status(404).json({
          success: false,
          message: 'Shared document not found'
        });
      }

      // Check if share is accessible
      if (!sharedDocument.isAccessible()) {
        return res.status(403).json({
          success: false,
          message: 'This shared document is no longer accessible'
        });
      }

      // Check password if required
      const password = req.body.password || req.query.password;
      if (sharedDocument.password && password !== sharedDocument.password) {
        return res.status(401).json({
          success: false,
          message: 'Password required to access this document',
          requiresPassword: true
        });
      }

      // Increment view count
      await sharedDocument.incrementView();

      // Mark recipient as viewed if email provided
      const email = req.body.email || req.query.email;
      if (email) {
        await sharedDocument.markAsViewed(email);
      }

      res.json({
        success: true,
        data: {
          document: {
            id: sharedDocument.documentId._id,
            name: sharedDocument.documentId.name,
            size: sharedDocument.documentId.size,
            createdAt: sharedDocument.documentId.createdAt
          },
          share: {
            shareToken: sharedDocument.shareToken,
            ownerName: sharedDocument.ownerName,
            allowDownload: sharedDocument.allowDownload,
            allowComments: sharedDocument.allowComments,
            message: sharedDocument.message,
            expiresAt: sharedDocument.expiresAt,
            viewCount: sharedDocument.viewCount
          }
        }
      });

    } catch (error) {
      console.error('Error getting shared document:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve shared document',
        error: error.message
      });
    }
  }

  // Get comments for shared document
  async getSharedDocumentComments(req, res) {
    try {
      
      const { shareToken } = req.params;

      const sharedDocument = await SharedDocument.findOne({ shareToken });
      if (!sharedDocument) {
        return res.status(404).json({
          success: false,
          message: 'Shared document not found'
        });
      }

      // Check if share is accessible
      if (!sharedDocument.isAccessible()) {
        return res.status(403).json({
          success: false,
          message: 'This shared document is no longer accessible'
        });
      }

    
      const Comment = require('../models/Comment');
      const comments = await Comment.find({ documentId: sharedDocument.documentId })
        .sort({ timestamp: -1 })
        .populate('replies', null, null, { sort: { timestamp: 1 } });

      res.json({
        success: true,
        data: comments
      });

    } catch (error) {
      console.error('Error getting shared document comments:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve comments',
        error: error.message
      });
    }
  }

  // Add comment to shared document
  async addSharedDocumentComment(req, res) {
    try {
      const { shareToken } = req.params;
      const { content, position, authorName, authorEmail } = req.body;

      const sharedDocument = await SharedDocument.findOne({ shareToken });
      if (!sharedDocument) {
        return res.status(404).json({
          success: false,
          message: 'Shared document not found'
        });
      }

      // Check if share is accessible
      if (!sharedDocument.isAccessible()) {
        return res.status(403).json({
          success: false,
          message: 'This shared document is no longer accessible'
        });
      }

      // Check if comments are allowed for adding new comments
      if (!sharedDocument.allowComments) {
        return res.status(403).json({
          success: false,
          message: 'Comments are not allowed for this document'
        });
      }

      const Comment = require('../models/Comment');
      const comment = new Comment({
        documentId: sharedDocument.documentId,
        author: authorEmail || 'anonymous',
        authorName: authorName || 'Anonymous',
        authorAvatar: '',
        content,
        position: position || { page: 1, x: 0, y: 0 },
        mentions: [],
        attachments: []
      });

      await comment.save();
      await comment.populate('replies');

      res.status(201).json({
        success: true,
        message: 'Comment added successfully',
        data: comment
      });

    } catch (error) {
      console.error('Error adding shared document comment:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add comment',
        error: error.message
      });
    }
  }

  // Add admin comment to shared document (authenticated)
  async addAdminComment(req, res) {
    try {
      
      const { shareToken } = req.params;
      const { content, position } = req.body;
      
      if (!req.user || !req.user.data) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }
      
      const userId = req.user.data.id;
      const userEmail = req.user.data.email;
      const userName = req.user.data.name || req.user.data.email;
      

      const sharedDocument = await SharedDocument.findOne({ shareToken });
      if (!sharedDocument) {
        return res.status(404).json({
          success: false,
          message: 'Shared document not found'
        });
      }

      // Check if user is the owner of the shared document
      if (sharedDocument.ownerId.toString() !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Only the document owner can add admin comments'
        });
      }

      // Check if share is accessible
      if (!sharedDocument.isAccessible()) {
        return res.status(403).json({
          success: false,
          message: 'This shared document is no longer accessible'
        });
      }

      // Admin can always comment, no need to check allowComments

      const Comment = require('../models/Comment');
      const comment = new Comment({
        documentId: sharedDocument.documentId,
        author: userEmail,
        authorName: userName,
        authorAvatar: '',
        content,
        position: position || { page: 1, x: 0, y: 0 },
        mentions: [],
        attachments: [],
        isAdminComment: true,
        adminUserId: userId
      });

      await comment.save();
      await comment.populate('replies');

      res.status(201).json({
        success: true,
        message: 'Admin comment added successfully',
        data: comment
      });

    } catch (error) {
      console.error('Error adding admin comment:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add admin comment',
        error: error.message
      });
    }
  }

  // Download shared document
  async downloadSharedDocument(req, res) {
    try {
      const { shareToken } = req.params;

      const sharedDocument = await SharedDocument.findOne({ shareToken })
        .populate('documentId');

      if (!sharedDocument) {
        return res.status(404).json({
          success: false,
          message: 'Shared document not found'
        });
      }

      // Check if share is accessible
      if (!sharedDocument.isAccessible()) {
        return res.status(403).json({
          success: false,
          message: 'This shared document is no longer accessible'
        });
      }

      // Check if download is allowed
      if (!sharedDocument.allowDownload) {
        return res.status(403).json({
          success: false,
          message: 'Download is not allowed for this document'
        });
      }

      // Check password if required
      if (sharedDocument.password && req.body.password !== sharedDocument.password) {
        return res.status(401).json({
          success: false,
          message: 'Password required to download this document',
          requiresPassword: true
        });
      }

      const document = sharedDocument.documentId;
      const filePath = document.filePath;

      // Check if file exists
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          success: false,
          message: 'File not found on server'
        });
      }

      // Increment download count
      await sharedDocument.incrementDownload();

      // Set headers for file download
      res.setHeader('Content-Type', document.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${document.originalName}"`);
      res.setHeader('Content-Length', document.size);

      // Stream the file
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);

    } catch (error) {
      console.error('Error downloading shared document:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to download document',
        error: error.message
      });
    }
  }

  // Get user's shared documents
  async getUserSharedDocuments(req, res) {
    try {
      const userId = req.user.data.id;
      const userEmail = req.user.data.email;
      const { page = 1, limit = 10 } = req.query;

      // Find documents where user is owner OR recipient (check all recipient types)
      const sharedDocuments = await SharedDocument.find({
        $or: [
          { ownerId: userId },
          { 'recipients.email': userEmail },
          { 'toRecipients.email': userEmail },
          { 'ccRecipients.email': userEmail },
          { 'bccRecipients.email': userEmail }
        ]
      })
        .populate('documentId', 'name size createdAt')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await SharedDocument.countDocuments({
        $or: [
          { ownerId: userId },
          { 'recipients.email': userEmail },
          { 'toRecipients.email': userEmail },
          { 'ccRecipients.email': userEmail },
          { 'bccRecipients.email': userEmail }
        ]
      });

      res.json({
        success: true,
        data: {
          sharedDocuments: sharedDocuments.map(share => ({
            id: share._id,
            shareToken: share.shareToken,
            shareUrl: share.shareUrl,
            document: share.documentId,
            toRecipients: share.toRecipients || [],
            ccRecipients: share.ccRecipients || [],
            bccRecipients: share.bccRecipients || [],
            recipients: share.recipients || [], // Legacy support
            viewCount: share.viewCount,
            downloadCount: share.downloadCount,
            isActive: share.isActive,
            expiresAt: share.expiresAt,
            createdAt: share.createdAt,
            allowComments: share.allowComments,
            isOwner: share.ownerId === userId
          })),
          pagination: {
            current: parseInt(page),
            pages: Math.ceil(total / limit),
            total
          }
        }
      });

    } catch (error) {
      console.error('Error getting user shared documents:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve shared documents',
        error: error.message
      });
    }
  }

  // Revoke shared document
  async revokeSharedDocument(req, res) {
    try {
      const { shareToken } = req.params;
      const userId = req.user.data.id;

      const sharedDocument = await SharedDocument.findOne({
        shareToken,
        ownerId: userId
      });

      if (!sharedDocument) {
        return res.status(404).json({
          success: false,
          message: 'Shared document not found or access denied'
        });
      }

      sharedDocument.isActive = false;
      await sharedDocument.save();

      res.json({
        success: true,
        message: 'Shared document revoked successfully'
      });

    } catch (error) {
      console.error('Error revoking shared document:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to revoke shared document',
        error: error.message
      });
    }
  }

  // Get all shared documents (Admin view, optional user filter)
  async getAllSharedDocuments(req, res) {
    try {
      const userType = req?.userType;
      const filterUserId = req.query.userId;

      const filter = {};
      if (userType === 'admin') {
        if (filterUserId) {
          filter.ownerId = filterUserId;
        }
      } else {
        // Non-admins see only their own shares
        const userId = req?.user?.data?.id;
        filter.ownerId = userId;
      }

      const sharedDocs = await SharedDocument.find(filter)
        .populate('documentId', 'name size createdAt')
        .sort({ createdAt: -1 })
        .lean();

      const formatted = (sharedDocs || []).map(share => ({
        id: share._id,
        shareToken: share.shareToken,
        shareUrl: share.shareUrl,
        document: share.documentId,
        toRecipients: share.toRecipients || [],
        ccRecipients: share.ccRecipients || [],
        bccRecipients: share.bccRecipients || [],
        viewCount: share.viewCount,
        downloadCount: share.downloadCount,
        isActive: share.isActive,
        expiresAt: share.expiresAt,
        createdAt: share.createdAt,
        allowComments: share.allowComments,
        ownerId: share.ownerId,
      }));

      return res.status(200).json({ success: true, data: formatted });
    } catch (error) {
      console.error('Error fetching shared documents (admin):', error);
      return res.status(500).json({ success: false, message: 'Failed to fetch shared documents' });
    }
  }
}

module.exports = new PDFShareController();
