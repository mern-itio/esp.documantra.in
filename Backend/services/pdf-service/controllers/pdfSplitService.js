const fs = require('fs-extra');
const path = require('path');
const { PDFDocument } = require('pdf-lib');

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

    const outputsDir = path.join(__dirname, '../outputs');
    await fs.ensureDir(outputsDir);
    
    const outputPath = path.join(outputsDir, `split_${i + 1}_to_${end}.pdf`);
    const pdfBytes = await newPdf.save();
    
    await fs.writeFile(outputPath, pdfBytes);

    outputFiles.push(outputPath);
  }

  return outputFiles;
};

// Split by custom page ranges
const splitByCustomRanges = async (filePath, ranges) => {
  if (!ranges || !Array.isArray(ranges) || ranges.length === 0) {
    throw new Error('Custom ranges must be a non-empty array');
  }

  const fileBytes = fs.readFileSync(filePath);
  const pdfDoc = await PDFDocument.load(fileBytes);
  const totalPages = pdfDoc.getPageCount();

  if (totalPages === 0) {
    throw new Error('PDF has no pages');
  }

  const outputFiles = [];
  const outputsDir = path.join(__dirname, '../outputs');
  await fs.ensureDir(outputsDir);

  for (let i = 0; i < ranges.length; i++) {
    const range = ranges[i];
    const { start, end, name } = range;
    
    // Validate range
    if (start < 1 || end > totalPages || start > end) {
      throw new Error(`Invalid range: ${start}-${end}. Pages must be between 1 and ${totalPages}`);
    }

    const newPdf = await PDFDocument.create();
    
    // Create array of page indices to copy (0-based)
    const pageIndices = [];
    for (let j = start - 1; j < end; j++) {
      pageIndices.push(j);
    }

    const pages = await newPdf.copyPages(pdfDoc, pageIndices);
    pages.forEach(p => newPdf.addPage(p));

    const outputPath = path.join(outputsDir, `split_${name || `${start}_to_${end}`}.pdf`);
    const pdfBytes = await newPdf.save();
    
    await fs.writeFile(outputPath, pdfBytes);
    outputFiles.push(outputPath);
  }

  return outputFiles;
};

// Split by bookmarks (placeholder for future implementation)
const splitByBookmarks = async (filePath) => {
  // This would require pdfjs-dist to extract outline/bookmark data
  // For now, we'll split into individual pages as a fallback
  console.log('Split by bookmarks not yet implemented, falling back to individual pages');
  return await splitByPages(filePath, 1);
};

// Split by file size (approximate)
const splitBySize = async (filePath, maxSizeInMB) => {
  const maxSizeBytes = maxSizeInMB * 1024 * 1024;
  
  const fileBytes = fs.readFileSync(filePath);
  const pdfDoc = await PDFDocument.load(fileBytes);
  const totalPages = pdfDoc.getPageCount();

  if (totalPages === 0) {
    throw new Error('PDF has no pages');
  }

  // Estimate size per page (rough approximation)
  const estimatedSizePerPage = fileBytes.length / totalPages;
  const pagesPerSplit = Math.max(1, Math.floor(maxSizeBytes / estimatedSizePerPage));

  console.log(`Estimated ${estimatedSizePerPage} bytes per page, splitting into chunks of ${pagesPerSplit} pages`);
  
  return await splitByPages(filePath, pagesPerSplit);
};

module.exports = {
  splitByPages,
  splitByCustomRanges,
  splitByBookmarks,
  splitBySize,
};
