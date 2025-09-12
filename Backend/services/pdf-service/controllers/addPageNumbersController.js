const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fs = require('fs-extra');
const path = require('path');

const addPageNumbersController = {
  async addPageNumbers(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No PDF file uploaded' });
      }

      
      const {
        position = 'bottom-center',
        fontSize = 12,
        fontColor = '#000000',
        startPage = 1,
        endPage = null,
        format = 'Page {page} of {total}',
        margin = 20,
        customText = '',
        excludePages = []
      } = req.body;

      // Ensure numeric parameters are properly converted
      const fontSizeNum = parseInt(fontSize) || 12;
      const marginNum = parseInt(margin) || 20;
      const startPageNum = parseInt(startPage) || 1;

      // Validate numeric ranges
      if (fontSizeNum < 8 || fontSizeNum > 72) {
        return res.status(400).json({ error: 'Font size must be between 8 and 72' });
      }
      if (marginNum < 5 || marginNum > 100) {
        return res.status(400).json({ error: 'Margin must be between 5 and 100' });
      }
      if (startPageNum < 1) {
        return res.status(400).json({ error: 'Start page must be at least 1' });
      }

      // Parse font color
      let parsedColor;
      try {
        if (fontColor.startsWith('#')) {
          const hex = fontColor.substring(1);
          const r = parseInt(hex.substring(0, 2), 16) / 255;
          const g = parseInt(hex.substring(2, 4), 16) / 255;
          const b = parseInt(hex.substring(4, 6), 16) / 255;
          parsedColor = rgb(r, g, b);
        } else {
          parsedColor = rgb(0, 0, 0); // Default to black
        }
      } catch (error) {
        parsedColor = rgb(0, 0, 0);
      }

      // Read the uploaded PDF
      const pdfBytes = await fs.readFile(req.file.path);
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const pages = pdfDoc.getPages();
      const totalPages = pages.length;

      // Parse exclude pages
      let excludePageNumbers = [];
      if (excludePages) {
        // Handle both string and array formats
        let pagesToExclude = excludePages;
        if (typeof excludePages === 'string') {
          // Parse string format (e.g., "1,2,3" or "[1,2,3]")
          try {
            pagesToExclude = JSON.parse(excludePages);
          } catch (e) {
            // If JSON parsing fails, try comma-separated values
            pagesToExclude = excludePages.split(',').map(p => p.trim());
          }
        }
        
        if (Array.isArray(pagesToExclude) && pagesToExclude.length > 0) {
          excludePageNumbers = pagesToExclude.map(p => parseInt(p)).filter(p => !isNaN(p) && p > 0);
        }
      }

              // Determine page range
        const actualStartPage = Math.max(1, startPageNum);
        let actualEndPage;
        
        
        if (endPage !== null && endPage !== undefined && endPage !== '' && !isNaN(parseInt(endPage))) {
          actualEndPage = Math.min(totalPages, parseInt(endPage));
        } else {
          actualEndPage = totalPages;
        }
      
      for (let i = actualStartPage - 1; i <= actualEndPage - 1; i++) {
        
        if (excludePageNumbers.includes(i + 1)) {
          continue; // Skip excluded pages
        }

        const page = pages[i];
        const { width, height } = page.getSize();
        
        // Calculate position coordinates
        let x, y;
        console.log(`Adding page number to page ${i + 1}`);
        const pageNumber = i + 1;
        
        switch (position) {
          case 'top-left':
            x = marginNum;
            y = height - marginNum;
            break;
          case 'top-center':
            x = width / 2;
            y = height - marginNum;
            break;
          case 'top-right':
            x = width - marginNum;
            y = height - marginNum;
            break;
          case 'bottom-left':
            x = marginNum;
            y = marginNum;
            break;
          case 'bottom-center':
            x = width / 2;
            y = marginNum;
            break;
          case 'bottom-right':
            x = width - marginNum;
            y = marginNum;
            break;
          case 'middle-left':
            x = marginNum;
            y = height / 2;
            break;
          case 'middle-right':
            x = width - marginNum;
            y = height / 2;
            break;
          case 'center':
            x = width / 2;
            y = height / 2;
            break;
          default:
            x = width / 2;
            y = marginNum;
        }

        // Create text content
        let textContent = format
          .replace('{page}', pageNumber)
          .replace('{total}', totalPages);
        
        if (customText) {
          textContent = customText + ' ' + textContent;
        }

        // Add text to page
        page.drawText(textContent, {
          x,
          y,
          size: fontSizeNum,
          color: parsedColor,
          font: await pdfDoc.embedFont(StandardFonts.Helvetica),
          textAlign: position.includes('center') ? 'center' : 
                    position.includes('right') ? 'right' : 'left'
        });
        
      }

             // Save the modified PDF
       const modifiedPdfBytes = await pdfDoc.save();
       const timestamp = Date.now();
       const outputFilename = `page-numbers-${timestamp}.pdf`;
       const outputPath = path.join(__dirname, '..', 'outputs', outputFilename);
       
       // Ensure outputs directory exists
       try {
         await fs.ensureDir(path.dirname(outputPath));
         await fs.writeFile(outputPath, modifiedPdfBytes);
       } catch (writeError) {
         throw new Error(`Failed to save PDF file: ${writeError.message}`);
       }

      // Clean up uploaded file
      await fs.remove(req.file.path);

                     res.json({
          success: true,
          message: 'Page numbers added successfully',
          filename: outputFilename,
          downloadUrl: `/pdf-page-numbers/download/${outputFilename}`,
          previewUrl: `/pdf-page-numbers/preview/${outputFilename}`,
          totalPages,
          pagesModified: actualEndPage - actualStartPage + 1
        });

    } catch (error) {
      console.error('Error adding page numbers:', error);
      res.status(500).json({ 
        error: 'Failed to add page numbers to PDF',
        details: error.message 
      });
    }
  },

  async getPageNumberPreview(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No PDF file uploaded' });
      }

      const {
        position = 'bottom-center',
        fontSize = 12,
        fontColor = '#000000',
        format = 'Page {page} of {total}',
        margin = 20,
        excludePages = []
      } = req.body;

      // Ensure numeric parameters are properly converted
      const fontSizeNum = parseInt(fontSize) || 12;
      const marginNum = parseInt(margin) || 20;

      // Validate numeric ranges
      if (fontSizeNum < 8 || fontSizeNum > 72) {
        return res.status(400).json({ error: 'Font size must be between 8 and 72' });
      }
      if (marginNum < 5 || marginNum > 100) {
        return res.status(400).json({ error: 'Margin must be between 5 and 100' });
      }

      // Read the uploaded PDF
      const pdfBytes = await fs.readFile(req.file.path);
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const pages = pdfDoc.getPages();
      const totalPages = pages.length;

      // Parse exclude pages
      let excludePageNumbers = [];
      if (excludePages) {
        // Handle both string and array formats
        let pagesToExclude = excludePages;
        if (typeof excludePages === 'string') {
          // Parse string format (e.g., "1,2,3" or "[1,2,3]")
          try {
            pagesToExclude = JSON.parse(excludePages);
          } catch (e) {
            // If JSON parsing fails, try comma-separated values
            pagesToExclude = excludePages.split(',').map(p => p.trim());
          }
        }
        
        if (Array.isArray(pagesToExclude) && pagesToExclude.length > 0) {
          excludePageNumbers = pagesToExclude.map(p => parseInt(p)).filter(p => !isNaN(p) && p > 0);
        }
      }

      // Parse font color
      let parsedColor;
      try {
        if (fontColor.startsWith('#')) {
          const hex = fontColor.substring(1);
          const r = parseInt(hex.substring(0, 2), 16) / 255;
          const g = parseInt(hex.substring(2, 4), 16) / 255;
          const b = parseInt(hex.substring(4, 6), 16) / 255;
          parsedColor = rgb(r, g, b);
        } else {
          parsedColor = rgb(0, 0, 0);
        }
      } catch (error) {
        parsedColor = rgb(0, 0, 0);
      }

       
       for (let i = 0; i < totalPages; i++) {
         // Skip excluded pages
         if (excludePageNumbers.includes(i + 1)) {
           continue;
         }

         const page = pages[i];
         const { width, height } = page.getSize();
         
         // Calculate position coordinates
         let x, y;
         
         switch (position) {
           case 'top-left':
             x = marginNum;
             y = height - marginNum;
             break;
           case 'top-center':
             x = width / 2;
             y = height - marginNum;
             break;
           case 'top-right':
             x = width - marginNum;
             y = height - marginNum;
             break;
           case 'bottom-left':
             x = marginNum;
             y = marginNum;
             break;
           case 'bottom-center':
             x = width / 2;
             y = marginNum;
             break;
           case 'bottom-right':
             x = width - marginNum;
             y = marginNum;
             break;
           case 'middle-left':
             x = marginNum;
             y = height / 2;
             break;
           case 'middle-right':
             x = width - marginNum;
             y = height / 2;
             break;
           case 'center':
             x = width / 2;
             y = height / 2;
             break;
           default:
             x = width / 2;
             y = marginNum;
         }

         // Create text content for preview
         const textContent = format
           .replace('{page}', i + 1)
           .replace('{total}', totalPages);

         // Add text to page
         page.drawText(textContent, {
           x,
           y,
           size: fontSizeNum,
           color: parsedColor,
           font: await pdfDoc.embedFont(StandardFonts.Helvetica),
           textAlign: position.includes('center') ? 'center' : 
                     position.includes('right') ? 'right' : 'left'
         });
         
       }

             // Save the preview PDF
       const previewPdfBytes = await pdfDoc.save();
       const timestamp = Date.now();
       const previewFilename = `preview-page-numbers-${timestamp}.pdf`;
       const previewPath = path.join(__dirname, '..', 'outputs', previewFilename);
       
       // Ensure outputs directory exists
       try {
         await fs.ensureDir(path.dirname(previewPath));
         await fs.writeFile(previewPath, previewPdfBytes);
       } catch (writeError) {
         console.error('Error saving preview PDF file:', writeError);
         throw new Error(`Failed to save preview PDF file: ${writeError.message}`);
       }

      // Clean up uploaded file
      await fs.remove(req.file.path);

                           res.json({
          success: true,
          message: 'Preview generated successfully',
          filename: previewFilename,
          previewUrl: `/pdf-page-numbers/preview/${previewFilename}`,
          totalPages,
          sampleText: `Page numbers added to all ${totalPages} pages`
        });

    } catch (error) {
      console.error('Error generating preview:', error);
      res.status(500).json({ 
        error: 'Failed to generate preview',
        details: error.message 
      });
    }
  }
};

module.exports = addPageNumbersController;
