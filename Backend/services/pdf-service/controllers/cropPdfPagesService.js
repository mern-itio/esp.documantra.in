const fs = require('fs-extra');
const path = require('path');
const { PDFDocument } = require('pdf-lib');

const cropPdfPages = async (filePath, crops = []) => {
  try {
    const fileBytes = fs.readFileSync(filePath);
    const pdfDoc = await PDFDocument.load(fileBytes);
    const totalPages = pdfDoc.getPageCount();

    if (totalPages === 0) {
      throw new Error('PDF has no pages');
    }

    // Validate crop data
    for (const crop of crops) {
      if (!crop.page || !crop.x || !crop.y || !crop.width || !crop.height) {
        throw new Error('Each crop must have page, x, y, width, and height properties');
      }
      
      if (crop.page < 1 || crop.page > totalPages) {
        throw new Error(`Page number ${crop.page} is out of range (1-${totalPages})`);
      }
      
      if (crop.width <= 0 || crop.height <= 0) {
        throw new Error(`Invalid dimensions: width and height must be positive`);
      }
      
      if (crop.x < 0 || crop.y < 0) {
        throw new Error(`Invalid coordinates: x and y must be non-negative`);
      }
    }

    // Create new PDF with cropped pages
    const newPdf = await PDFDocument.create();

    // Process each page
    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      const page = pdfDoc.getPage(pageNum - 1);
      const pageWidth = page.getWidth();
      const pageHeight = page.getHeight();
      
      // Find crop data for this page
      const pageCrop = crops.find(crop => crop.page === pageNum);
      
      if (pageCrop) {
        // Validate crop dimensions against page size
        if (pageCrop.x + pageCrop.width > pageWidth || pageCrop.y + pageCrop.height > pageHeight) {
          throw new Error(`Crop dimensions exceed page ${pageNum} boundaries`);
        }
        
        // Create cropped page
        const [copiedPage] = await newPdf.copyPages(pdfDoc, [pageNum - 1]);
        
        // Set crop box (crop area)
        copiedPage.setCropBox(pageCrop.x, pageCrop.y, pageCrop.width, pageCrop.height);
        
        // Set media box to match crop box for proper display
        copiedPage.setMediaBox(pageCrop.x, pageCrop.y, pageCrop.width, pageCrop.height);
        
        newPdf.addPage(copiedPage);
      } else {
        // Add page without cropping
        const [copiedPage] = await newPdf.copyPages(pdfDoc, [pageNum - 1]);
        newPdf.addPage(copiedPage);
      }
    }

    // Ensure outputs directory exists
    const outputsDir = path.join(__dirname, '../outputs');
    await fs.ensureDir(outputsDir);

    // Generate output filename
    const timestamp = Date.now();
    const randomSuffix = Math.round(Math.random() * 1E9);
    const outputPath = path.join(outputsDir, `cropped-pages-${timestamp}-${randomSuffix}.pdf`);

    const pdfBytes = await newPdf.save();
    await fs.writeFile(outputPath, pdfBytes);

    return outputPath;
  } catch (error) {
    throw new Error(`Failed to crop pages: ${error.message}`);
  }
};

module.exports = { cropPdfPages };
