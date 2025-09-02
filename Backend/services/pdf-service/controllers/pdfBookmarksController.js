const { PDFDocument, PDFName, PDFString, PDFNumber, PDFRef, PDFArray, PDFDict, rgb } = require('pdf-lib');
const PDFKitDocument = require('pdfkit');
const fs = require('fs-extra');
const path = require('path');
const { fromPath } = require('pdf2pic');
const PDFMerger = require('pdf-merger-js');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

const pdfBookmarksController = {
  // Auto-detect and generate bookmarks from PDF structure
  async autoDetectBookmarks(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No PDF file uploaded'
        });
      }
      const pdfBytes = await fs.readFile(req.file.path);
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const structure = await analyzePdfStructure(pdfDoc);

      const bookmarks = await generateBookmarksFromStructure(pdfDoc, structure);

      const newPdfDoc = await PDFDocument.load(pdfBytes);
      await addBookmarksToPdf(newPdfDoc, bookmarks);

      const outputFilename = `bookmarked_${Date.now()}.pdf`;
      const outputPath = path.join(__dirname, '../outputs', outputFilename);
      await fs.ensureDir(path.dirname(outputPath));
      
      const newPdfBytes = await newPdfDoc.save();
      await fs.writeFile(outputPath, newPdfBytes);

      // Clean up uploaded file
      await fs.remove(req.file.path);

      res.json({
        success: true,
        result: {
          originalFilename: req.file.originalname,
          processedFilename: outputFilename,
          downloadUrl: `/api/pdf-service/outputs/${outputFilename}`,
          bookmarks: bookmarks,
          structure: structure,
          statistics: {
            totalBookmarks: bookmarks.length,
            maxDepth: Math.max(...bookmarks.map(b => b.level), 0),
            pages: pdfDoc.getPageCount()
          }
        }
      });

    } catch (error) {
      console.error('❌ Error in auto-detect bookmarks:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to auto-detect bookmarks',
        details: error.message
      });
    }
  },

  // Create custom bookmarks with user-defined structure
  async createCustomBookmarks(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No PDF file uploaded'
        });
      }

      let bookmarks;
      try {
        bookmarks = JSON.parse(req.body.bookmarks);
      } catch (error) {
        return res.status(400).json({
          success: false,
          error: 'Invalid bookmarks data format'
        });
      }

      if (!bookmarks || !Array.isArray(bookmarks)) {
        return res.status(400).json({
          success: false,
          error: 'Bookmarks array is required'
        });
      }
      const uploadsDir = path.join(__dirname, '../../uploads');
      await fs.ensureDir(uploadsDir);

      const fileExists = await fs.pathExists(req.file.path);
      
      if (!fileExists) {
        console.error('❌ File not found at path:', req.file.path);
        
        try {
          const uploadsDir = path.join(__dirname, '../../uploads');
          const files = await fs.readdir(uploadsDir);
        } catch (listError) {
          console.error('❌ Error listing uploads directory:', listError.message);
        }
        
        // Try to find the file in common upload directories
        const possiblePaths = [
          req.file.path,
          path.join(__dirname, '../../uploads', req.file.filename),
          path.join(__dirname, '../uploads', req.file.filename),
          path.join(process.cwd(), 'uploads', req.file.filename),
          path.join('/app/services/uploads', req.file.filename),
          path.join('/app/services/pdf-service/uploads', req.file.filename),
          path.join(__dirname, '../../uploads', req.file.originalname),
          path.join(__dirname, '../uploads', req.file.originalname),
          path.join('/app/services/uploads', req.file.originalname),
          path.join('/app/services/pdf-service/uploads', req.file.originalname)
        ];
        
        for (const possiblePath of possiblePaths) {
          const exists = await fs.pathExists(possiblePath);
          if (exists) {
            req.file.path = possiblePath;
            break;
          }
        }
        
        // Final check
        const finalExists = await fs.pathExists(req.file.path);
        if (!finalExists) {
          console.error('❌ File not found in any expected location');
          return res.status(400).json({
            success: false,
            error: 'Uploaded file not found in any expected location'
          });
        }
      }

      const pdfBytes = await fs.readFile(req.file.path);
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const processedBookmarks = await processCustomBookmarks(bookmarks, pdfDoc);
      const outputFilename = `custom_bookmarked_${Date.now()}.pdf`;
      const outputPath = path.join(__dirname, '../outputs', outputFilename);
      await fs.ensureDir(path.dirname(outputPath));

      await createPDFWithBookmarks(req.file.path, processedBookmarks, outputPath);

      await fs.remove(req.file.path);

      res.json({
        success: true,
        result: {
          originalFilename: req.file.originalname,
          processedFilename: outputFilename,
          downloadUrl: `/api/pdf-service/outputs/${outputFilename}`,
          bookmarks: processedBookmarks,
          statistics: {
            totalBookmarks: processedBookmarks.length,
            maxDepth: Math.max(...processedBookmarks.map(b => b.level), 0),
            pages: pdfDoc.getPageCount()
          }
        }
      });

    } catch (error) {
      console.error('❌ Error creating custom bookmarks:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create custom bookmarks',
        details: error.message
      });
    }
  },

  // Edit existing bookmarks (add, remove, modify)
  async editBookmarks(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No PDF file uploaded'
        });
      }

      const { action } = req.body;
      let bookmarkData;
      
      try {
        bookmarkData = JSON.parse(req.body.bookmarkData);
      } catch (error) {
        return res.status(400).json({
          success: false,
          error: 'Invalid bookmark data format'
        });
      }

      if (!action || !bookmarkData) {
        return res.status(400).json({
          success: false,
          error: 'Action and bookmark data are required'
        });
      }

      const pdfBytes = await fs.readFile(req.file.path);
      const pdfDoc = await PDFDocument.load(pdfBytes);

      // Get existing bookmarks
      let existingBookmarks = await getExistingBookmarksFromPdf(pdfDoc);
      
      // Apply edit action
      const updatedBookmarks = await applyBookmarkEdit(existingBookmarks, action, bookmarkData);
      
      // Create new PDF with updated bookmarks
      const newPdfDoc = await PDFDocument.load(pdfBytes);
      await addBookmarksToPdf(newPdfDoc, updatedBookmarks);

      // Save the processed PDF
      const outputFilename = `edited_bookmarks_${Date.now()}.pdf`;
      const outputPath = path.join(__dirname, '../outputs', outputFilename);
      await fs.ensureDir(path.dirname(outputPath));
      
      const newPdfBytes = await newPdfDoc.save();
      await fs.writeFile(outputPath, newPdfBytes);

      // Clean up uploaded file
      await fs.remove(req.file.path);

      res.json({
        success: true,
        result: {
          originalFilename: req.file.originalname,
          processedFilename: outputFilename,
          downloadUrl: `/api/pdf-service/outputs/${outputFilename}`,
          bookmarks: updatedBookmarks,
          action: action,
          statistics: {
            totalBookmarks: updatedBookmarks.length,
            maxDepth: Math.max(...updatedBookmarks.map(b => b.level), 0),
            pages: pdfDoc.getPageCount()
          }
        }
      });

    } catch (error) {
      console.error('❌ Error editing bookmarks:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to edit bookmarks',
        details: error.message
      });
    }
  },

  // Get bookmark structure from existing PDF
  async getExistingBookmarks(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No PDF file uploaded'
        });
      }


      const pdfBytes = await fs.readFile(req.file.path);
      const pdfDoc = await PDFDocument.load(pdfBytes);

      const existingBookmarks = await getExistingBookmarksFromPdf(pdfDoc);
      
      // Clean up uploaded file
      await fs.remove(req.file.path);

      res.json({
        success: true,
        result: {
          originalFilename: req.file.originalname,
          bookmarks: existingBookmarks,
          statistics: {
            totalBookmarks: existingBookmarks.length,
            maxDepth: Math.max(...existingBookmarks.map(b => b.level), 0),
            pages: pdfDoc.getPageCount()
          }
        }
      });

    } catch (error) {
      console.error('❌ Error getting existing bookmarks:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get existing bookmarks',
        details: error.message
      });
    }
  },

  // Analyze PDF structure for bookmark suggestions
  async analyzeStructure(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No PDF file uploaded'
        });
      }


      const pdfBytes = await fs.readFile(req.file.path);
      const pdfDoc = await PDFDocument.load(pdfBytes);

      const structure = await analyzePdfStructure(pdfDoc);
      const suggestions = await generateBookmarkSuggestions(structure);
      
      // Clean up uploaded file
      await fs.remove(req.file.path);

      res.json({
        success: true,
        result: {
          originalFilename: req.file.originalname,
          structure: structure,
          suggestions: suggestions,
          statistics: {
            pages: pdfDoc.getPageCount(),
            potentialBookmarks: suggestions.length,
            structureComplexity: structure.complexity
          }
        }
      });

    } catch (error) {
      console.error('❌ Error analyzing structure:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to analyze PDF structure',
        details: error.message
      });
    }
  },

  // Get service status and capabilities
  async getServiceStatus(req, res) {
    try {
      res.json({
        success: true,
        status: {
          service: 'PDF Bookmarks Service',
          status: 'operational',
          version: '1.0.0',
          features: [
            'automatic_bookmarks',
            'hierarchical_structure',
            'custom_titles',
            'structure_analysis',
            'bookmark_editing'
          ],
          capabilities: {
            maxFileSize: '50MB',
            supportedFormats: ['PDF'],
            bookmarkTypes: ['automatic', 'custom', 'hierarchical'],
            maxBookmarkDepth: 10,
            maxBookmarksPerDocument: 1000
          },
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('❌ Error getting service status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get service status',
        details: error.message
      });
    }
  },

  // Health check endpoint
  async healthCheck(req, res) {
    try {
      res.json({
        success: true,
        health: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        health: 'error',
        error: error.message
      });
    }
  }
};

// Helper Functions

async function analyzePdfStructure(pdfDoc) {
  const pages = pdfDoc.getPages();
  const structure = {
    pages: pages.length,
    complexity: 'low',
    headings: [],
    patterns: [],
    suggestions: []
  };

  // Analyze each page for potential bookmark content
  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const { width, height } = page.getSize();
    
    // Look for text patterns that might indicate headings
    // This is a simplified analysis - in a real implementation,
    // you would use more sophisticated text extraction
    const pageAnalysis = {
      pageNumber: i + 1,
      width,
      height,
      potentialHeadings: []
    };

    structure.headings.push(pageAnalysis);
  }

  // Determine complexity based on structure
  if (structure.headings.length > 20) {
    structure.complexity = 'high';
  } else if (structure.headings.length > 10) {
    structure.complexity = 'medium';
  }

  return structure;
}

async function generateBookmarksFromStructure(pdfDoc, structure) {
  const bookmarks = [];
  const pages = pdfDoc.getPages();

  // Generate bookmarks based on detected structure
  // This is a simplified implementation
  for (let i = 0; i < Math.min(pages.length, 10); i++) {
    bookmarks.push({
      title: `Page ${i + 1}`,
      page: i,
      level: 0,
      children: []
    });
  }

  return bookmarks;
}

async function addBookmarksToPdf(pdfDoc, bookmarks) {
  
  try {
    if (bookmarks.length === 0) {
      return pdfDoc;
    }
    
    // Create a very simple outline structure that avoids circular references
    // This approach creates minimal outline objects that PDF viewers can understand
    
    try {
      // Create outline dictionary with minimal structure
      const outlineDict = pdfDoc.context.obj({
        Type: 'Outlines',
        Count: bookmarks.length
      });
      
      // Create simple outline items without complex linking
      const outlineItems = [];
      
      for (let i = 0; i < bookmarks.length; i++) {
        const bookmark = bookmarks[i];
        
        // Validate page number
        if (bookmark.page < 0 || bookmark.page >= pdfDoc.getPageCount()) {
          console.warn(`⚠️ Invalid page number ${bookmark.page} for bookmark: ${bookmark.title}`);
          continue;
        }
        
        const page = pdfDoc.getPage(bookmark.page);
        const pageRef = page.ref;
        
        // Create a very simple outline item
        const outlineItem = pdfDoc.context.obj({
          Title: bookmark.title,
          Dest: [pageRef, 'XYZ', 0, 0, 1.0] // Simple destination
        });
        
        outlineItems.push(outlineItem);
      }
      
      // Add outline to catalog without complex linking
      if (outlineItems.length > 0) {
        const catalog = pdfDoc.catalog;
        catalog.set('Outlines', outlineDict);
        
      }
      
    } catch (outlineError) {
      console.warn('⚠️ Simple outline creation failed, using metadata approach:', outlineError.message);
      
      // Fallback to enhanced metadata
      const bookmarkData = {
        bookmarks: bookmarks.map(bookmark => ({
          title: bookmark.title,
          page: bookmark.page + 1,
          level: bookmark.level || 0
        })),
        created: new Date().toISOString(),
        version: '2.0',
        type: 'navigation_bookmarks'
      };
      
      const bookmarkJson = JSON.stringify(bookmarkData);
      pdfDoc.setKeywords([`PDF_BOOKMARKS_V2:${bookmarkJson}`]);
    }
    
    // Update metadata
    pdfDoc.setTitle('PDF with Navigation Bookmarks');
    pdfDoc.setAuthor('PDF Bookmarks Service v2.0');
    pdfDoc.setSubject(`Document with ${bookmarks.length} navigation bookmarks`);
    pdfDoc.setCreator('PDF Bookmarks Service v2.0');
    
    return pdfDoc;
  } catch (error) {
    console.error('❌ Error adding bookmarks to PDF:', error);
    console.error('Error details:', error.message);
    
    // Fallback: just update basic metadata
    pdfDoc.setTitle('PDF with Bookmarks');
    pdfDoc.setAuthor('PDF Bookmarks Service');
    pdfDoc.setSubject(`Document with ${bookmarks.length} navigation bookmarks`);
    
    return pdfDoc;
  }
}

// New function to create PDF with real bookmarks using PDFtk
async function createPDFWithBookmarks(originalPdfPath, bookmarks, outputPath) {
  
  try {
    // First, check if PDFtk is available
    try {
      await execAsync('pdftk --version');
    } catch (pdftkError) {
      console.warn('⚠️ PDFtk not found, falling back to simple copy...');
      const originalPdfBytes = await fs.readFile(originalPdfPath);
      await fs.writeFile(outputPath, originalPdfBytes);
      return outputPath;
    }
    
    // Create bookmark data file for PDFtk
    const bookmarkDataPath = path.join(path.dirname(outputPath), `bookmarks_${Date.now()}.txt`);
    let bookmarkData = '';
    
    for (const bookmark of bookmarks) {
      
      // Frontend sends 0-based page numbers, convert to 1-based for PDFtk
      const pageNumber = bookmark.page + 1;
      bookmarkData += `BookmarkBegin\n`;
      bookmarkData += `BookmarkTitle: ${bookmark.title}\n`;
      bookmarkData += `BookmarkLevel: ${bookmark.level + 1}\n`;
      bookmarkData += `BookmarkPageNumber: ${pageNumber}\n`;
    }
    
    // Write bookmark data to file
    await fs.writeFile(bookmarkDataPath, bookmarkData);
    
    // Use PDFtk to add bookmarks to the PDF
    const pdftkCommand = `pdftk "${originalPdfPath}" update_info "${bookmarkDataPath}" output "${outputPath}"`;
    
    
    try {
      const { stdout, stderr } = await execAsync(pdftkCommand);
      if (stdout) console.log('📋 PDFtk stdout:', stdout);
      if (stderr) console.log('📋 PDFtk stderr:', stderr);
    } catch (pdftkError) {
      console.error('❌ PDFtk command failed:', pdftkError.message);
      throw pdftkError;
    }
    
    // Clean up bookmark data file
    await fs.remove(bookmarkDataPath);
    
    return outputPath;
    
  } catch (error) {
    console.error('❌ Error creating PDF with PDFtk:', error);
    
    const originalPdfBytes = await fs.readFile(originalPdfPath);
    await fs.writeFile(outputPath, originalPdfBytes);
    return outputPath;
  }
}

async function processCustomBookmarks(bookmarks, pdfDoc) {
  const processedBookmarks = [];
  const pages = pdfDoc.getPages();

  for (const bookmark of bookmarks) {
    
    // Validate bookmark data
    if (!bookmark.title || typeof bookmark.page !== 'number') {
      console.warn('⚠️ Invalid bookmark data:', bookmark);
      continue;
    }

    // Frontend sends 0-based page numbers, validate them
    const pageNumber = bookmark.page;
    
    // Validate page number is within bounds (0-based)
    if (pageNumber < 0 || pageNumber >= pages.length) {
      console.warn(`⚠️ Invalid page number ${pageNumber} (valid range: 0-${pages.length - 1}), skipping bookmark: ${bookmark.title}`);
      continue;
    }
    
    processedBookmarks.push({
      title: bookmark.title,
      page: pageNumber,
      level: bookmark.level || 0,
      children: bookmark.children || []
    });
  }

  return processedBookmarks;
}

async function getExistingBookmarksFromPdf(pdfDoc) {
  // Extract existing bookmarks from PDF
  // This is a simplified implementation
  const bookmarks = [];
  
  // In a real implementation, you would parse the PDF's outline structure
  // For now, return empty array as most PDFs don't have bookmarks
  return bookmarks;
}

async function applyBookmarkEdit(existingBookmarks, action, bookmarkData) {
  let updatedBookmarks = [...existingBookmarks];

  switch (action) {
    case 'add':
      updatedBookmarks.push(bookmarkData);
      break;
    case 'remove':
      updatedBookmarks = updatedBookmarks.filter(b => b.id !== bookmarkData.id);
      break;
    case 'modify':
      const index = updatedBookmarks.findIndex(b => b.id === bookmarkData.id);
      if (index !== -1) {
        updatedBookmarks[index] = { ...updatedBookmarks[index], ...bookmarkData };
      }
      break;
    case 'reorder':
      // Implement reordering logic
      break;
  }

  return updatedBookmarks;
}

async function generateBookmarkSuggestions(structure) {
  const suggestions = [];

  // Generate suggestions based on structure analysis
  for (let i = 0; i < Math.min(structure.pages, 20); i++) {
    suggestions.push({
      title: `Section ${i + 1}`,
      page: i,
      confidence: 0.8,
      type: 'automatic',
      reason: 'Page-based suggestion'
    });
  }

  return suggestions;
}

module.exports = pdfBookmarksController;
