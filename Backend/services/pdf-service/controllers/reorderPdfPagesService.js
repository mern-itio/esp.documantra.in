const fs = require('fs-extra');
const path = require('path');
const { PDFDocument } = require('pdf-lib');

const reorderPdfPages = async (filePath, newOrder = []) => {
  try {
    const fileBytes = fs.readFileSync(filePath);
    const originalPdf = await PDFDocument.load(fileBytes);
    const totalPages = originalPdf.getPageCount();

    if (totalPages === 0) {
      throw new Error('PDF has no pages');
    }

    // Validate page numbers
    for (const pageNum of newOrder) {
      if (pageNum < 1 || pageNum > totalPages) {
        throw new Error(`Page number ${pageNum} is out of range (1-${totalPages})`);
      }
    }

    const newPdf = await PDFDocument.create();

    // Convert to 0-based index
    const pageIndices = newOrder.map(p => parseInt(p) - 1);

    for (const index of pageIndices) {
      const [copiedPage] = await newPdf.copyPages(originalPdf, [index]);
      newPdf.addPage(copiedPage);
    }

    // Ensure outputs directory exists
    const outputsDir = path.join(__dirname, '../outputs');
    await fs.ensureDir(outputsDir);

    // Generate output filename
    const timestamp = Date.now();
    const randomSuffix = Math.round(Math.random() * 1E9);
    const outputPath = path.join(outputsDir, `reordered-pages-${timestamp}-${randomSuffix}.pdf`);

    const pdfBytes = await newPdf.save();
    await fs.writeFile(outputPath, pdfBytes);

    return outputPath;
  } catch (error) {
    throw new Error(`Failed to reorder pages: ${error.message}`);
  }
};

module.exports = { reorderPdfPages };
