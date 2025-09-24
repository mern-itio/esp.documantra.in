const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fs = require('fs-extra');
const path = require('path');

const addHeaderFooterController = {
  async addHeaderFooter(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const {
        headerText = '',
        footerText = '',
        headerPosition = 'top-center',
        footerPosition = 'bottom-center',
        fontSize = 12,
        fontColor = '#000000',
        startPage = 1,
        endPage = '',
        margin = 20,
        customHeaderText = '',
        customFooterText = '',
        excludePages = '',
        headerEnabled = true,
        footerEnabled = true
      } = req.body;

      // console.log('Received request body:', req.body);

      // Parse font color
      const color = fontColor.startsWith('#') ? fontColor : `#${fontColor}`;
      const rgbColor = addHeaderFooterController.parseColor(color);

      // Parse exclude pages
      const excludePagesArray = excludePages ? excludePages.split(',').map(p => parseInt(p.trim())).filter(p => !isNaN(p)) : [];

      // Read the uploaded PDF
      const pdfBytes = await fs.readFile(req.file.path);
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const pages = pdfDoc.getPages();
      const totalPages = pages.length;

      // console.log(`Total pages in PDF: ${totalPages}`);

      // Determine actual start and end pages
      const actualStartPage = Math.max(1, parseInt(startPage));
      let actualEndPage;

      // Check if endPage is provided and is a valid number
      if (endPage !== null && endPage !== undefined && endPage.toString().trim() !== '' && !isNaN(parseInt(endPage))) {
        actualEndPage = Math.min(totalPages, parseInt(endPage));
        // console.log(`End page specified: ${actualEndPage}`);
      } else {
        actualEndPage = totalPages;
        // console.log(`No end page specified, processing all pages: ${actualEndPage}`);
      }

      // console.log(`Processing pages from ${actualStartPage} to ${actualEndPage} (total: ${totalPages})`);

      // Add headers and footers to specified pages
      let pagesModified = 0;
      for (let i = actualStartPage - 1; i < actualEndPage; i++) {
        const pageNum = i + 1;
        
        // Skip excluded pages
        if (excludePagesArray.includes(pageNum)) {
          // console.log(`Skipping excluded page ${pageNum}`);
          continue;
        }

        const page = pages[i];
        const { width, height } = page.getSize();

        // Add header if enabled
        if (headerEnabled && (headerText || customHeaderText)) {
          const headerCoords = addHeaderFooterController.calculatePosition(headerPosition, width, height, margin, true);
          const textAlign = addHeaderFooterController.getTextAlign(headerPosition);
          const headerTextToUse = customHeaderText || headerText;
          
          // Replace placeholders with actual values
          const processedHeaderText = addHeaderFooterController.replacePlaceholders(headerTextToUse, pageNum, totalPages);
          
          page.drawText(processedHeaderText, {
            x: headerCoords.x,
            y: headerCoords.y,
            size: parseInt(fontSize),
            color: rgbColor,
            font: await pdfDoc.embedFont(StandardFonts.Helvetica),
            textAlign: textAlign
          });
          // console.log(`Header added to page ${pageNum}: ${processedHeaderText}`);
        }

        // Add footer if enabled
        if (footerEnabled && (footerText || customFooterText)) {
          const footerCoords = addHeaderFooterController.calculatePosition(footerPosition, width, height, margin, false);
          const textAlign = addHeaderFooterController.getTextAlign(footerPosition);
          const footerTextToUse = customFooterText || footerText;
          
          // Replace placeholders with actual values
          const processedFooterText = addHeaderFooterController.replacePlaceholders(footerTextToUse, pageNum, totalPages);
          
          page.drawText(processedFooterText, {
            x: footerCoords.x,
            y: footerCoords.y,
            size: parseInt(fontSize),
            color: rgbColor,
            font: await pdfDoc.embedFont(StandardFonts.Helvetica),
            textAlign: textAlign
          });
          // console.log(`Footer added to page ${pageNum}: ${processedFooterText}`);
        }

        pagesModified++;
      }

      // console.log(`Successfully processed ${pagesModified} pages`);

      // Save the modified PDF
      const modifiedPdfBytes = await pdfDoc.save();
      const outputFilename = `header-footer-${Date.now()}.pdf`;
      const outputPath = path.join(__dirname, '..', 'outputs', outputFilename);

      // Ensure output directory exists
      await fs.ensureDir(path.dirname(outputPath));
      await fs.writeFile(outputPath, modifiedPdfBytes);

      // console.log(`PDF saved successfully: ${outputFilename}`);

      // Clean up uploaded file
      await fs.remove(req.file.path);

      res.json({
        success: true,
        message: 'Headers and footers added successfully',
        filename: outputFilename,
        downloadUrl: `/pdf-header-footer/download/${outputFilename}`,
        previewUrl: `/pdf-header-footer/preview/${outputFilename}`,
        totalPages,
        pagesModified,
        startPage: actualStartPage,
        endPage: actualEndPage
      });

    } catch (error) {
      console.error('Error adding headers and footers:', error);
      res.status(500).json({
        error: 'Failed to add headers and footers to PDF',
        details: error.message
      });
    }
  },

  async getHeaderFooterPreview(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const {
        headerText = '',
        footerText = '',
        headerPosition = 'top-center',
        footerPosition = 'bottom-center',
        fontSize = 12,
        fontColor = '#000000',
        startPage = 1,
        endPage = '',
        margin = 20,
        customHeaderText = '',
        customFooterText = '',
        excludePages = '',
        headerEnabled = true,
        footerEnabled = true
      } = req.body;

      // Parse font color
      const color = fontColor.startsWith('#') ? fontColor : `#${fontColor}`;
      const rgbColor = addHeaderFooterController.parseColor(color);

      // Parse exclude pages
      const excludePagesArray = excludePages ? excludePages.split(',').map(p => parseInt(p.trim())).filter(p => !isNaN(p)) : [];

      // Read the uploaded PDF
      const pdfBytes = await fs.readFile(req.file.path);
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const pages = pdfDoc.getPages();
      const totalPages = pages.length;

      // Determine actual start and end pages
      const actualStartPage = Math.max(1, parseInt(startPage));
      let actualEndPage;

      if (endPage !== null && endPage !== undefined && endPage.toString().trim() !== '' && !isNaN(parseInt(endPage))) {
        actualEndPage = Math.min(totalPages, parseInt(endPage));
      } else {
        actualEndPage = totalPages;
      }

      // Add headers and footers to specified pages for preview (same logic as main function)
      let pagesModified = 0;
      for (let i = actualStartPage - 1; i < actualEndPage; i++) {
        const pageNum = i + 1;
        
        // Skip excluded pages
        if (excludePagesArray.includes(pageNum)) {
          // console.log(`Skipping excluded page ${pageNum} in preview`);
          continue;
        }

        const page = pages[i];
        const { width, height } = page.getSize();

        // Add header if enabled
        if (headerEnabled && (headerText || customHeaderText)) {
          const headerCoords = addHeaderFooterController.calculatePosition(headerPosition, width, height, margin, true);
          const textAlign = addHeaderFooterController.getTextAlign(headerPosition);
          const headerTextToUse = customHeaderText || headerText;
          
          // Replace placeholders with actual values
          const processedHeaderText = addHeaderFooterController.replacePlaceholders(headerTextToUse, pageNum, totalPages);
          
          page.drawText(processedHeaderText, {
            x: headerCoords.x,
            y: headerCoords.y,
            size: parseInt(fontSize),
            color: rgbColor,
            font: await pdfDoc.embedFont(StandardFonts.Helvetica),
            textAlign: textAlign
          });
        }

        // Add footer if enabled
        if (footerEnabled && (footerText || customFooterText)) {
          const footerCoords = addHeaderFooterController.calculatePosition(footerPosition, width, height, margin, false);
          const textAlign = addHeaderFooterController.getTextAlign(footerPosition);
          const footerTextToUse = customFooterText || footerText;
          
          // Replace placeholders with actual values
          const processedFooterText = addHeaderFooterController.replacePlaceholders(footerTextToUse, pageNum, totalPages);
          
          page.drawText(processedFooterText, {
            x: footerCoords.x,
            y: footerCoords.y,
            size: parseInt(fontSize),
            color: rgbColor,
            font: await pdfDoc.embedFont(StandardFonts.Helvetica),
            textAlign: textAlign
          });
        }

        pagesModified++;
      }

      // Save the preview PDF
      const previewPdfBytes = await pdfDoc.save();
      const previewFilename = `preview-header-footer-${Date.now()}.pdf`;
      const previewPath = path.join(__dirname, '..', 'outputs', previewFilename);

      // Ensure output directory exists
      await fs.ensureDir(path.dirname(previewPath));
      await fs.writeFile(previewPath, previewPdfBytes);

      // console.log(`Preview PDF saved successfully: ${previewFilename}`);

      // Clean up uploaded file
      await fs.remove(req.file.path);

      res.json({
        success: true,
        message: 'Preview generated successfully',
        filename: previewFilename,
        previewUrl: `/pdf-header-footer/preview/${previewFilename}`,
        totalPages,
        pagesModified,
        startPage: actualStartPage,
        endPage: actualEndPage,
        sampleText: `Headers and footers added to ${pagesModified} pages (${actualStartPage}-${actualEndPage})`
      });

    } catch (error) {
      console.error('Error generating preview:', error);
      res.status(500).json({
        error: 'Failed to generate preview',
        details: error.message
      });
    }
  },

  calculatePosition(position, width, height, margin, isHeader) {
    const marginValue = parseInt(margin);
    
    switch (position) {
      case 'top-left':
        return { x: marginValue, y: height - marginValue - (isHeader ? 20 : 0) };
      case 'top-center':
        return { x: width / 2, y: height - marginValue - (isHeader ? 20 : 0) };
      case 'top-right':
        return { x: width - marginValue, y: height - marginValue - (isHeader ? 20 : 0) };
      case 'bottom-left':
        return { x: marginValue, y: marginValue + (isHeader ? 0 : 20) };
      case 'bottom-center':
        return { x: width / 2, y: marginValue + (isHeader ? 0 : 20) };
      case 'bottom-right':
        return { x: width - marginValue, y: marginValue + (isHeader ? 0 : 20) };
      case 'left-center':
        return { x: marginValue, y: height / 2 };
      case 'right-center':
        return { x: width - marginValue, y: height / 2 };
      default:
        return { x: width / 2, y: isHeader ? height - marginValue - 20 : marginValue + 20 };
    }
  },

  getTextAlign(position) {
    switch (position) {
      case 'top-left':
      case 'bottom-left':
      case 'left-center':
        return 'left';
      case 'top-right':
      case 'bottom-right':
      case 'right-center':
        return 'right';
      case 'top-center':
      case 'bottom-center':
      default:
        return 'center';
    }
  },

  parseColor(color) {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;
    return rgb(r, g, b);
  },

  replacePlaceholders(text, currentPage, totalPages) {
    if (!text) return text;
    
    return text
      .replace(/\{page\}/g, currentPage.toString())
      .replace(/\{total\}/g, totalPages.toString());
  }
};

module.exports = addHeaderFooterController;
