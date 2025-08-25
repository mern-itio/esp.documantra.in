const fs = require('fs');
const path = require('path');
const { PDFDocument } = require('pdf-lib');
// const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');

const splitByPages = async (filePath, pagesPerSplit) => {
  // Validate input parameters
  if (!pagesPerSplit || pagesPerSplit <= 0) {
    throw new Error('pagesPerSplit must be a positive number');
  }

  const fileBytes = fs.readFileSync(filePath);
  const pdfDoc = await PDFDocument.load(fileBytes);
  const totalPages = pdfDoc.getPageCount();

  if (totalPages === 0) {
    throw new Error('PDF has no pages');
  }

  const outputFiles = [];

  for (let i = 0; i < totalPages; i += pagesPerSplit) {
    const newPdf = await PDFDocument.create();
    const end = Math.min(i + pagesPerSplit, totalPages);

    // Create array of page indices to copy (0-based)
    const pageIndices = [];
    for (let j = i; j < end; j++) {
      pageIndices.push(j);
    }

    const pages = await newPdf.copyPages(pdfDoc, pageIndices);
    pages.forEach(p => newPdf.addPage(p));

    const outputPath = path.join('split', `split_${i + 1}_to_${end}.pdf`);
    const pdfBytes = await newPdf.save();
    
    // Ensure split directory exists
    if (!fs.existsSync('split')) {
      fs.mkdirSync('split', { recursive: true });
    }
    
    fs.writeFileSync(outputPath, pdfBytes);

    outputFiles.push(outputPath);
  }

  return outputFiles;
};

// Stub for bookmarks and size (can be implemented based on need)
const splitByBookmarks = async (filePath) => {
  // Placeholder: would use pdfjs-dist to extract outline/bookmark data and split accordingly
  throw new Error("Split by bookmarks not yet implemented");
};

const splitBySize = async (filePath, maxSizeInMB) => {
  // Placeholder: tricky to implement precisely. You can approximate based on page sizes.
  throw new Error("Split by file size not yet implemented");
};

module.exports = {
  splitByPages,
  splitByBookmarks,
  splitBySize,
};
