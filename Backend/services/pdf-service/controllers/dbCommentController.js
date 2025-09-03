const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');
const CommentedDocument = require('../models/CommentedDocument');
const DocumentTracking = require('../models/documentTracking');

const execAsync = promisify(exec);

const dbCommentController = {
  // Create a new commented document with shareable link
  async createCommentedDocument(req, res) {
    let pdfFile = null;
    
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No PDF file uploaded'
        });
      }

      pdfFile = req.file;
      const { comments, userInfo, shareableLink = true, expiresInDays = 30 } = req.body;

      // console.log('Creating commented document:', {
      //   commentsCount: comments ? JSON.parse(comments).length : 0,
      //   userInfo: userInfo ? JSON.parse(userInfo).name : '[EMPTY]',
      //   filename: pdfFile.originalname
      // });

      // Validate input
      if (!comments) {
        return res.status(400).json({
          success: false,
          message: 'No comments provided'
        });
      }

      const commentsData = JSON.parse(comments);
      const userData = JSON.parse(userInfo);

      if (!Array.isArray(commentsData) || commentsData.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'At least one comment is required'
        });
      }

      // Generate unique filename
      const timestamp = Date.now();
      const outputFilename = `commented-${timestamp}.pdf`;
      const outputPath = path.join(__dirname, '..', 'uploads', outputFilename);

      // console.log('Creating commented document with:', {
      //   originalFilename: pdfFile.originalname,
      //   outputFilename: outputFilename,
      //   outputPath: outputPath
      // });

      // Perform comment addition
      const commentResult = await dbCommentController.performCommentAddition(
        pdfFile.path,
        outputPath,
        commentsData,
        userData
      );

      if (!commentResult.success) {
        return res.status(500).json({
          success: false,
          message: commentResult.message || 'Comment addition failed'
        });
      }

      // Create commented document record
      const commentedDoc = new CommentedDocument({
        originalDocumentId: `doc_${timestamp}`,
        documentName: pdfFile.originalname,
        originalFilename: pdfFile.originalname,
        filePath: outputPath,
        fileSize: commentResult.fileSize,
        ownerId: userData.id,
        ownerName: userData.name,
        ownerEmail: userData.email,
        comments: commentsData.map(comment => ({
          id: comment.id || crypto.randomUUID(),
          text: comment.text,
          position: comment.position,
          author: userData.id,
          authorName: userData.name,
          authorEmail: userData.email,
          timestamp: new Date(),
          replies: [],
          parentId: comment.parentId || null,
          isResolved: comment.isResolved || false,
          color: comment.color || 'yellow',
          pageNumber: comment.pageNumber,
          threadId: comment.threadId || crypto.randomUUID()
        })),
        allowComments: true,
        allowAnonymousComments: true,
        requireApproval: false
      });

      // Generate shareable link if requested
      if (shareableLink === 'true' || shareableLink === true) {
        const link = commentedDoc.generateShareableLink();
        if (expiresInDays && parseInt(expiresInDays) > 0) {
          const expirationDate = new Date();
          expirationDate.setDate(expirationDate.getDate() + parseInt(expiresInDays));
          commentedDoc.expiresAt = expirationDate;
        }
      }

      await commentedDoc.save();

      // console.log('Saved commented document:', {
      //   id: commentedDoc._id,
      //   filePath: commentedDoc.filePath,
      //   filename: path.basename(commentedDoc.filePath)
      // });

      // Track document creation
      await DocumentTracking.create({
        documentId: commentedDoc._id.toString(),
        documentName: pdfFile.originalname,
        documentType: 'pdf',
        originalFilename: pdfFile.originalname,
        savedFilename: outputFilename,
        userId: userData.id,
        action: 'upload',
        metadata: {
          commentsCount: commentsData.length,
          shareableLink: commentedDoc.shareableLink,
          isShared: commentedDoc.isShared
        }
      });

      res.json({
        success: true,
        message: 'Commented document created successfully',
        documentId: commentedDoc._id,
        filename: outputFilename,
        downloadUrl: `/pdf-comments-db/download/${outputFilename}`,
        previewUrl: `/pdf-comments-db/preview/${outputFilename}`,
        shareableLink: commentedDoc.shareableLink,
        linkToken: commentedDoc.linkToken,
        expiresAt: commentedDoc.expiresAt,
        originalFileSize: commentResult.originalFileSize,
        fileSize: commentResult.fileSize,
        commentDetails: {
          totalComments: commentedDoc.totalComments,
          totalThreads: commentedDoc.totalThreads,
          resolvedComments: commentedDoc.resolvedComments,
          unresolvedComments: commentedDoc.unresolvedComments
        }
      });

    } catch (error) {
      console.error('Create commented document error:', error);
      
      // Clean up uploaded files
      if (pdfFile && pdfFile.path) {
        try {
          await fs.remove(pdfFile.path);
        } catch (cleanupError) {
          console.error('PDF cleanup error:', cleanupError);
        }
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error during document creation',
        error: error.message
      });
    }
  },

  // Get document by shareable link
  async getDocumentByLink(req, res) {
    try {
      const { linkToken } = req.params;

      // console.log('Getting document by link token:', linkToken);

      const document = await CommentedDocument.findOne({
        linkToken,
        isActive: true,
        isDeleted: false
      });

      // console.log('Document query result:', {
      //   found: !!document,
      //   documentId: document?._id,
      //   documentName: document?.documentName,
      //   linkToken: document?.linkToken
      // });

      if (!document) {
        return res.status(404).json({
          success: false,
          message: 'Document not found or link has expired'
        });
      }

      if (!document.isLinkValid()) {
        return res.status(410).json({
          success: false,
          message: 'Link has expired'
        });
      }

      // Update access count and last accessed
      document.accessCount += 1;
      document.lastAccessed = new Date();
      await document.save();

      // Track access
      await DocumentTracking.create({
        documentId: document._id.toString(),
        documentName: document.documentName,
        documentType: 'pdf',
        originalFilename: document.originalFilename,
        userId: 'anonymous',
        action: 'view',
        trackingSource: 'shared_link',
        metadata: {
          linkToken,
          accessCount: document.accessCount
        }
      });

      const filename = path.basename(document.filePath);
      // console.log('Document file info:', {
      //   filePath: document.filePath,
      //   filename: filename,
      //   previewUrl: `/pdf-comments-db/preview/${filename}`,
      //   downloadUrl: `/pdf-comments-db/download/${filename}`
      // });

      res.json({
        success: true,
        document: {
          id: document._id,
          documentName: document.documentName,
          ownerName: document.ownerName,
          comments: document.comments,
          totalComments: document.totalComments,
          totalThreads: document.totalThreads,
          resolvedComments: document.resolvedComments,
          unresolvedComments: document.unresolvedComments,
          allowComments: document.allowComments,
          allowAnonymousComments: document.allowAnonymousComments,
          createdAt: document.createdAt,
          lastAccessed: document.lastAccessed,
          previewUrl: `/pdf-comments-db/preview/${filename}`,
          downloadUrl: `/pdf-comments-db/download/${filename}`
        }
      });

    } catch (error) {
      console.error('Get document by link error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  },

  // Add comment to existing document
  async addComment(req, res) {
    try {
      const { linkToken } = req.params;
      const { text, position, color = 'yellow', parentId = null, authorInfo } = req.body;

      // console.log('Adding comment to document:', {
      //   linkToken,
      //   text: text?.substring(0, 50) + '...',
      //   position,
      //   authorInfo: authorInfo?.name || 'Anonymous'
      // });

      if (!text || !position) {
        return res.status(400).json({
          success: false,
          message: 'Comment text and position are required'
        });
      }

      const document = await CommentedDocument.findOne({
        linkToken,
        isActive: true,
        isDeleted: false
      });

      // console.log('Document found:', {
      //   found: !!document,
      //   documentId: document?._id,
      //   allowComments: document?.allowComments,
      //   allowAnonymousComments: document?.allowAnonymousComments
      // });

      if (!document) {
        return res.status(404).json({
          success: false,
          message: 'Document not found'
        });
      }

      if (!document.allowComments) {
        return res.status(403).json({
          success: false,
          message: 'Comments are not allowed on this document'
        });
      }

      // Check if anonymous comments are allowed
      if (!document.allowAnonymousComments && !authorInfo) {
        return res.status(403).json({
          success: false,
          message: 'Anonymous comments are not allowed'
        });
      }

      const newComment = {
        id: crypto.randomUUID(),
        text,
        position,
        author: authorInfo?.id || 'anonymous',
        authorName: authorInfo?.name || 'Anonymous',
        authorEmail: authorInfo?.email || '',
        timestamp: new Date(),
        replies: [],
        parentId,
        isResolved: false,
        color,
        pageNumber: position.pageNumber,
        threadId: parentId ? 
          document.comments.find(c => c.id === parentId)?.threadId || crypto.randomUUID() :
          crypto.randomUUID()
      };

      document.comments.push(newComment);
      await document.save();

      res.json({
        success: true,
        message: 'Comment added successfully',
        comment: newComment,
        totalComments: document.totalComments
      });

    } catch (error) {
      console.error('Add comment error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  },

  // Reply to a comment
  async replyToComment(req, res) {
    try {
      const { linkToken, commentId } = req.params;
      const { text, authorInfo } = req.body;

      if (!text) {
        return res.status(400).json({
          success: false,
          message: 'Reply text is required'
        });
      }

      const document = await CommentedDocument.findOne({
        linkToken,
        isActive: true,
        isDeleted: false
      });

      if (!document) {
        return res.status(404).json({
          success: false,
          message: 'Document not found'
        });
      }

      const parentComment = document.comments.id(commentId);
      if (!parentComment) {
        return res.status(404).json({
          success: false,
          message: 'Comment not found'
        });
      }

      const reply = {
        id: crypto.randomUUID(),
        text,
        author: authorInfo?.id || 'anonymous',
        authorName: authorInfo?.name || 'Anonymous',
        authorEmail: authorInfo?.email || '',
        timestamp: new Date(),
        position: {
          x: parentComment.position.x + 20,
          y: parentComment.position.y + 20,
          pageNumber: parentComment.position.pageNumber
        }
      };

      parentComment.replies.push(reply);
      await document.save();

      res.json({
        success: true,
        message: 'Reply added successfully',
        reply,
        totalComments: document.totalComments
      });

    } catch (error) {
      console.error('Reply to comment error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  },

  // Resolve/unresolve a comment
  async toggleCommentResolution(req, res) {
    try {
      const { linkToken, commentId } = req.params;
      const { resolved, authorInfo } = req.body;

      const document = await CommentedDocument.findOne({
        linkToken,
        isActive: true,
        isDeleted: false
      });

      if (!document) {
        return res.status(404).json({
          success: false,
          message: 'Document not found'
        });
      }

      const comment = document.comments.id(commentId);
      if (!comment) {
        return res.status(404).json({
          success: false,
          message: 'Comment not found'
        });
      }

      comment.isResolved = resolved;
      await document.save();

      res.json({
        success: true,
        message: `Comment ${resolved ? 'resolved' : 'unresolved'} successfully`,
        comment: comment,
        totalComments: document.totalComments
      });

    } catch (error) {
      console.error('Toggle comment resolution error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  },

  // Get user's commented documents
  async getUserDocuments(req, res) {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 10 } = req.query;

      const documents = await CommentedDocument.find({
        ownerId: userId,
        isActive: true,
        isDeleted: false
      })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('documentName originalFilename createdAt totalComments totalThreads resolvedComments unresolvedComments isShared shareableLink');

      const total = await CommentedDocument.countDocuments({
        ownerId: userId,
        isActive: true,
        isDeleted: false
      });

      res.json({
        success: true,
        documents,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total
        }
      });

    } catch (error) {
      console.error('Get user documents error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  },

  // Perform the actual comment addition using PyMuPDF (same as before)
  async performCommentAddition(inputPath, outputPath, comments, userInfo) {
    try {
      // Create Python script for comment addition
      const pythonScript = `
import fitz  # PyMuPDF
import json
import sys
from datetime import datetime

def add_comments(input_pdf, output_pdf, comments_data, user_info):
    try:
        # Open the PDF
        doc = fitz.open(input_pdf)
        
        # Color mapping
        color_map = {
            'yellow': (1, 1, 0),
            'green': (0, 1, 0),
            'blue': (0, 0, 1),
            'pink': (1, 0.75, 0.8),
            'orange': (1, 0.5, 0),
            'purple': (0.5, 0, 0.5),
            'red': (1, 0, 0),
            'gray': (0.5, 0.5, 0.5)
        }
        
        total_comments = 0
        comments_by_page = {}
        resolved_comments = 0
        
        print(f"Processing {len(comments_data)} comments...")
        
        for comment in comments_data:
            page_num = comment['position']['pageNumber'] - 1  # Convert to 0-based
            if page_num < 0 or page_num >= len(doc):
                print(f"Warning: Page {page_num + 1} not found, skipping comment")
                continue
                
            page = doc[page_num]
            x = comment['position']['x']
            y = comment['position']['y']
            
            # Get comment color
            color = color_map.get(comment['color'], (1, 1, 0))  # Default to yellow
            
            # Add visual indicator (small colored rectangle)
            indicator_rect = fitz.Rect(x, y, x + 20, y + 20)
            page.draw_rect(indicator_rect, color=color, fill=color)
            
            # Add comment text as overlay
            text_rect = fitz.Rect(x + 25, y, x + 200, y + 100)
            page.insert_textbox(
                text_rect,
                f"{user_info['name']}: {comment['text']}",
                fontsize=10,
                color=(0, 0, 0),
                align=0  # Left align
            )
            
            total_comments += 1
            comments_by_page[page_num + 1] = comments_by_page.get(page_num + 1, 0) + 1
            
            if comment.get('isResolved', False):
                resolved_comments += 1
            
            print(f"Added comment to page {page_num + 1}: {comment['text'][:50]}...")
        
        # Save the commented PDF
        doc.save(output_pdf)
        doc.close()
        
        print(f"Successfully added {total_comments} comments")
        
        return {
            'success': True,
            'totalComments': total_comments,
            'commentsByPage': comments_by_page,
            'resolvedComments': resolved_comments,
            'unresolvedComments': total_comments - resolved_comments,
            'totalPages': len(doc)
        }
        
    except Exception as e:
        print(f"Error during comment addition: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }

if __name__ == "__main__":
    import json
    
    input_pdf = "${inputPath}"
    output_pdf = "${outputPath}"
    comments_data = json.loads('${JSON.stringify(comments).replace(/'/g, "\\'")}')
    user_info = json.loads('${JSON.stringify(userInfo).replace(/'/g, "\\'")}')
    
    print(f"Starting comment addition process...")
    print(f"Input: {input_pdf}")
    print(f"Output: {output_pdf}")
    print(f"Comments: {len(comments_data)}")
    print(f"User: {user_info['name']}")
    
    result = add_comments(input_pdf, output_pdf, comments_data, user_info)
    if result['success']:
        print("Comment addition completed successfully")
    else:
        print("Comment addition failed")
`;

      // Write and execute Python script
      const pythonScriptFile = path.join(__dirname, '..', 'uploads', `comment_${Date.now()}.py`);
      await fs.writeFile(pythonScriptFile, pythonScript);

      try {
        const { stdout, stderr } = await execAsync(`python3 "${pythonScriptFile}"`);
        console.log('Comment addition completed:', stdout);
        if (stderr) {
          console.log('Python stderr:', stderr);
        }
        
        // Check if output file exists
        const outputExists = await fs.pathExists(outputPath);
        if (!outputExists) {
          throw new Error('Output file was not created');
        }

        // Parse result from stdout
        const result = {
          success: true,
          details: {
            totalComments: comments.length,
            totalThreads: new Set(comments.map(c => c.threadId || c.id)).size,
            commentsByPage: {},
            resolvedComments: comments.filter(c => c.isResolved).length,
            unresolvedComments: comments.filter(c => !c.isResolved).length
          },
          totalPages: 0,
          fileSize: 0,
          originalFileSize: 0
        };

        // Get file stats
        try {
          const stats = await fs.stat(outputPath);
          result.fileSize = stats.size;
        } catch (statError) {
          console.warn('Could not get file stats:', statError);
        }

        try {
          const originalStats = await fs.stat(inputPath);
          result.originalFileSize = originalStats.size;
        } catch (statError) {
          console.warn('Could not get original file stats:', statError);
        }

        // Clean up Python script
        await fs.remove(pythonScriptFile);
        
        return result;

      } catch (execError) {
        console.error('Python execution error:', execError);
        throw new Error(`Comment addition failed: ${execError.message}`);
      }

    } catch (error) {
      console.error('Error in performCommentAddition:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }
};

module.exports = dbCommentController;
