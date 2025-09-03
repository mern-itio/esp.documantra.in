const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs-extra');
const path = require('path');

const execAsync = promisify(exec);

const commentController = {
  // Main comment function
  async addComments(req, res) {
    let pdfFile = null;
    
    try {
      // console.log('Request file:', req.file);
      // console.log('Request body:', req.body);
      
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No PDF file uploaded'
        });
      }

      pdfFile = req.file;
      const { comments, userInfo } = req.body;

      // console.log('Comment request received:', {
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

      // Perform comment addition
      const commentResult = await commentController.performCommentAddition(
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

      // Get file stats
      const originalStats = await fs.stat(pdfFile.path);
      const stats = await fs.stat(outputPath);

      res.json({
        success: true,
        message: 'Comments added successfully',
        filename: outputFilename,
        downloadUrl: `/pdf-comments/download/${outputFilename}`,
        originalFileSize: originalStats.size,
        fileSize: stats.size,
        commentDetails: commentResult.details
      });

    } catch (error) {
      console.error('Comment addition error:', error);
      
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
        message: 'Internal server error during comment addition',
        error: error.message
      });
    }
  },

  // Preview comments (same as addComments but returns preview URL)
  async previewComments(req, res) {
    let pdfFile = null;
    
    try {
      // console.log('Preview - Request file:', req.file);
      // console.log('Preview - Request body:', req.body);
      
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No PDF file uploaded'
        });
      }

      pdfFile = req.file;
      const { comments, userInfo } = req.body;

      // console.log('Preview comment request received:', {
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

      // Generate unique filename for preview
      const timestamp = Date.now();
      const outputFilename = `preview-${timestamp}.pdf`;
      const outputPath = path.join(__dirname, '..', 'uploads', outputFilename);

      // Perform comment addition (same logic as addComments)
      const commentResult = await commentController.performCommentAddition(
        pdfFile.path,
        outputPath,
        commentsData,
        userData
      );

      if (commentResult.success) {
        // Return preview URL instead of download URL
        const previewUrl = `/pdf-comments/preview/${outputFilename}`;
        
        res.json({
          success: true,
          message: 'Preview generated successfully',
          filename: outputFilename,
          previewUrl: previewUrl,
          downloadUrl: `/pdf-comments/download/${outputFilename}`,
          totalPages: commentResult.totalPages || 0,
          fileSize: commentResult.fileSize || 0,
          originalFileSize: commentResult.originalFileSize || 0,
          commentDetails: commentResult.details
        });
      } else {
        res.status(500).json({
          success: false,
          message: commentResult.error || 'Failed to generate preview'
        });
      }

      // Clean up uploaded files
      try {
        await fs.unlink(pdfFile.path);
      } catch (cleanupError) {
        console.warn('Cleanup error:', cleanupError);
      }
    } catch (error) {
      console.error('Preview comment error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during preview generation'
      });
    }
  },

  // Perform the actual comment addition using PyMuPDF
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
        
      #  print(f"Processing {len(comments_data)} comments...")
        
        for comment in comments_data:
            page_num = comment['position']['pageNumber'] - 1  # Convert to 0-based
            if page_num < 0 or page_num >= len(doc):
               # print(f"Warning: Page {page_num + 1} not found, skipping comment")
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
            
           # print(f"Added comment to page {page_num + 1}: {comment['text'][:50]}...")
        
        # Save the commented PDF
        doc.save(output_pdf)
        doc.close()
        
       # print(f"Successfully added {total_comments} comments")
        
        return {
            'success': True,
            'totalComments': total_comments,
            'commentsByPage': comments_by_page,
            'resolvedComments': resolved_comments,
            'unresolvedComments': total_comments - resolved_comments,
            'totalPages': len(doc)
        }
        
    except Exception as e:
        # print(f"Error during comment addition: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }

if __name__ == "__main__":
    input_pdf = "${inputPath}"
    output_pdf = "${outputPath}"
    comments_data = ${JSON.stringify(comments)}
    user_info = ${JSON.stringify(userInfo)}
    
   # print(f"Starting comment addition process...")
   # print(f"Input: {input_pdf}")
   # print(f"Output: {output_pdf}")
   # print(f"Comments: {len(comments_data)}")
   # print(f"User: {user_info['name']}")
    
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
  },

  // Get comment library
  getCommentLibrary() {
    return {
      templates: [
        {
          id: 'approval',
          name: 'Approval',
          text: 'Approved by reviewer',
          color: 'green',
          category: 'Review'
        },
        {
          id: 'revision',
          name: 'Needs Revision',
          text: 'Please revise this section',
          color: 'orange',
          category: 'Review'
        },
        {
          id: 'question',
          name: 'Question',
          text: 'Can you clarify this?',
          color: 'blue',
          category: 'Inquiry'
        },
        {
          id: 'suggestion',
          name: 'Suggestion',
          text: 'Consider this alternative approach',
          color: 'purple',
          category: 'Suggestion'
        },
        {
          id: 'error',
          name: 'Error Found',
          text: 'Error detected here',
          color: 'red',
          category: 'Error'
        },
        {
          id: 'note',
          name: 'General Note',
          text: 'Note for reference',
          color: 'yellow',
          category: 'Note'
        }
      ],
      categories: ['Review', 'Inquiry', 'Suggestion', 'Error', 'Note']
    };
  },

  // Download commented file
  async downloadCommentedFile(req, res) {
    try {
      const filename = req.params.filename;
      const filePath = path.join(__dirname, '..', 'uploads', filename);

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'File not found' });
      }

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('Access-Control-Allow-Origin', '*');

      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
    } catch (error) {
      console.error('Download error:', error);
      res.status(500).json({
        success: false,
        message: 'Download failed'
      });
    }
  }
};

module.exports = commentController;
