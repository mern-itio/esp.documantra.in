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
        recipients, 
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

      // Validate recipients
      if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'At least one recipient is required'
        });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      for (const recipient of recipients) {
        if (!emailRegex.test(recipient.email)) {
          return res.status(400).json({
            success: false,
            message: `Invalid email format: ${recipient.email}`
          });
        }
      }

      // Create shared document record
      const sharedDocument = new SharedDocument({
        documentId: document._id,
        ownerId: userId,
        ownerEmail: userEmail,
        ownerName: userName,
        recipients: recipients.map(recipient => ({
          email: recipient.email,
          name: recipient.name || '',
          isCC: recipient.isCC || false
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

      // Send emails to recipients
      const emailResults = [];
      for (const recipient of recipients) {
        try {
          const emailSent = await emailService.sendPDFShareNotification(
            recipient.email,
            document.name,
            sharedDocument.shareToken,
            userName,
            sharedDocument.subject,
            sharedDocument.message,
            sharedDocument.shareUrl,
            userEmail
          );

          // Update recipient email status
          const recipientDoc = sharedDocument.recipients.find(r => r.email === recipient.email);
          if (recipientDoc) {
            recipientDoc.emailSent = emailSent;
            recipientDoc.emailSentAt = new Date();
          }

          emailResults.push({
            email: recipient.email,
            sent: emailSent
          });
        } catch (emailError) {
          console.error(`Failed to send email to ${recipient.email}:`, emailError);
          emailResults.push({
            email: recipient.email,
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
      if (sharedDocument.password && req.body.password !== sharedDocument.password) {
        return res.status(401).json({
          success: false,
          message: 'Password required to access this document',
          requiresPassword: true
        });
      }

      // Increment view count
      await sharedDocument.incrementView();

      // Mark recipient as viewed if email provided
      if (req.body.email) {
        await sharedDocument.markAsViewed(req.body.email);
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
      const { page = 1, limit = 10 } = req.query;

      const sharedDocuments = await SharedDocument.find({ ownerId: userId })
        .populate('documentId', 'name size createdAt')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await SharedDocument.countDocuments({ ownerId: userId });

      res.json({
        success: true,
        data: {
          sharedDocuments: sharedDocuments.map(share => ({
            id: share._id,
            shareToken: share.shareToken,
            shareUrl: share.shareUrl,
            document: share.documentId,
            recipients: share.recipients,
            viewCount: share.viewCount,
            downloadCount: share.downloadCount,
            isActive: share.isActive,
            expiresAt: share.expiresAt,
            createdAt: share.createdAt
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
}

module.exports = new PDFShareController();
