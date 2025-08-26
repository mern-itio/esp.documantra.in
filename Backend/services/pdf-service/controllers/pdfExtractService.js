const fs = require('fs-extra');
const path = require('path');
const { PDFDocument } = require('pdf-lib');

/**
 * Extract specific pages from a PDF file
 * @param {string} filePath - Path to the source PDF file
 * @param {Array<number>} pageNumbers - Array of page numbers to extract (1-based)
 * @param {string} outputName - Custom name for the output file
 * @returns {string} Path to the extracted PDF file
 */
const extractPages = async (filePath, pageNumbers, outputName = null) => {
  // Validate input parameters
  if (!pageNumbers || !Array.isArray(pageNumbers) || pageNumbers.length === 0) {
    throw new Error('pageNumbers must be a non-empty array');
  }

  // Validate page numbers are positive integers
  if (!pageNumbers.every(num => Number.isInteger(num) && num > 0)) {
    throw new Error('All page numbers must be positive integers');
  }

  const fileBytes = fs.readFileSync(filePath);
  const pdfDoc = await PDFDocument.load(fileBytes);
  const totalPages = pdfDoc.getPageCount();

  if (totalPages === 0) {
    throw new Error('PDF has no pages');
  }

  // Validate page numbers are within range
  const invalidPages = pageNumbers.filter(num => num > totalPages);
  if (invalidPages.length > 0) {
    throw new Error(`Page numbers ${invalidPages.join(', ')} exceed total pages (${totalPages})`);
  }

  // Create new PDF document
  const newPdf = await PDFDocument.create();

  // Convert page numbers to 0-based indices and sort them
  const pageIndices = pageNumbers.map(num => num - 1).sort((a, b) => a - b);

  // Copy selected pages
  const pages = await newPdf.copyPages(pdfDoc, pageIndices);
  pages.forEach(page => newPdf.addPage(page));

  // Ensure outputs directory exists
  const outputsDir = path.join(__dirname, '../outputs');
  await fs.ensureDir(outputsDir);

  // Generate output filename
  const timestamp = Date.now();
  const randomSuffix = Math.round(Math.random() * 1E9);
  const baseName = outputName || `extracted_pages_${pageNumbers.join('_')}`;
  const outputPath = path.join(outputsDir, `${baseName}_${timestamp}_${randomSuffix}.pdf`);

  // Save the new PDF
  const pdfBytes = await newPdf.save();
  await fs.writeFile(outputPath, pdfBytes);

  return outputPath;
};

/**
 * Extract a range of pages from a PDF file
 * @param {string} filePath - Path to the source PDF file
 * @param {number} startPage - Starting page number (1-based)
 * @param {number} endPage - Ending page number (1-based)
 * @param {string} outputName - Custom name for the output file
 * @returns {string} Path to the extracted PDF file
 */
const extractPageRange = async (filePath, startPage, endPage, outputName = null) => {
  // Validate input parameters
  if (!Number.isInteger(startPage) || startPage <= 0) {
    throw new Error('startPage must be a positive integer');
  }
  if (!Number.isInteger(endPage) || endPage <= 0) {
    throw new Error('endPage must be a positive integer');
  }
  if (startPage > endPage) {
    throw new Error('startPage cannot be greater than endPage');
  }

  const fileBytes = fs.readFileSync(filePath);
  const pdfDoc = await PDFDocument.load(fileBytes);
  const totalPages = pdfDoc.getPageCount();

  if (totalPages === 0) {
    throw new Error('PDF has no pages');
  }

  // Validate page range
  if (startPage > totalPages) {
    throw new Error(`startPage (${startPage}) exceeds total pages (${totalPages})`);
  }
  if (endPage > totalPages) {
    throw new Error(`endPage (${endPage}) exceeds total pages (${totalPages})`);
  }

  // Create new PDF document
  const newPdf = await PDFDocument.create();

  // Generate page indices (0-based)
  const pageIndices = [];
  for (let i = startPage - 1; i < endPage; i++) {
    pageIndices.push(i);
  }

  // Copy selected pages
  const pages = await newPdf.copyPages(pdfDoc, pageIndices);
  pages.forEach(page => newPdf.addPage(page));

  // Ensure outputs directory exists
  const outputsDir = path.join(__dirname, '../outputs');
  await fs.ensureDir(outputsDir);

  // Generate output filename
  const timestamp = Date.now();
  const randomSuffix = Math.round(Math.random() * 1E9);
  const baseName = outputName || `extracted_pages_${startPage}_to_${endPage}`;
  const outputPath = path.join(outputsDir, `${baseName}_${timestamp}_${randomSuffix}.pdf`);

  // Save the new PDF
  const pdfBytes = await newPdf.save();
  await fs.writeFile(outputPath, pdfBytes);

  return outputPath;
};

/**
 * Extract pages based on custom selection (mix of individual pages and ranges)
 * @param {string} filePath - Path to the source PDF file
 * @param {Array} selections - Array of selections: { type: 'page'|'range', value: number|{start, end} }
 * @param {string} outputName - Custom name for the output file
 * @returns {string} Path to the extracted PDF file
 */
const extractCustomSelection = async (filePath, selections, outputName = null) => {
  if (!selections || !Array.isArray(selections) || selections.length === 0) {
    throw new Error('selections must be a non-empty array');
  }

  const fileBytes = fs.readFileSync(filePath);
  const pdfDoc = await PDFDocument.load(fileBytes);
  const totalPages = pdfDoc.getPageCount();

  if (totalPages === 0) {
    throw new Error('PDF has no pages');
  }

  // Collect all page numbers
  const pageNumbers = new Set();
  
  for (const selection of selections) {
    if (selection.type === 'page') {
      if (!Number.isInteger(selection.value) || selection.value <= 0) {
        throw new Error('Page numbers must be positive integers');
      }
      if (selection.value > totalPages) {
        throw new Error(`Page number ${selection.value} exceeds total pages (${totalPages})`);
      }
      pageNumbers.add(selection.value);
    } else if (selection.type === 'range') {
      const { start, end } = selection.value;
      if (!Number.isInteger(start) || start <= 0 || !Number.isInteger(end) || end <= 0) {
        throw new Error('Range start and end must be positive integers');
      }
      if (start > end) {
        throw new Error('Range start cannot be greater than end');
      }
      if (start > totalPages || end > totalPages) {
        throw new Error(`Range ${start}-${end} exceeds total pages (${totalPages})`);
      }
      
      for (let i = start; i <= end; i++) {
        pageNumbers.add(i);
      }
    } else {
      throw new Error(`Invalid selection type: ${selection.type}. Use 'page' or 'range'`);
    }
  }

  if (pageNumbers.size === 0) {
    throw new Error('No valid pages selected');
  }

  // Create new PDF document
  const newPdf = await PDFDocument.create();

  // Convert page numbers to 0-based indices and sort them
  const pageIndices = Array.from(pageNumbers).map(num => num - 1).sort((a, b) => a - b);

  // Copy selected pages
  const pages = await newPdf.copyPages(pdfDoc, pageIndices);
  pages.forEach(page => newPdf.addPage(page));

  // Ensure outputs directory exists
  const outputsDir = path.join(__dirname, '../outputs');
  await fs.ensureDir(outputsDir);

  // Generate output filename
  const timestamp = Date.now();
  const randomSuffix = Math.round(Math.random() * 1E9);
  const baseName = outputName || `extracted_custom_${pageIndices.length}_pages`;
  const outputPath = path.join(outputsDir, `${baseName}_${timestamp}_${randomSuffix}.pdf`);

  // Save the new PDF
  const pdfBytes = await newPdf.save();
  await fs.writeFile(outputPath, pdfBytes);

  return outputPath;
};

module.exports = {
  extractPages,
  extractPageRange,
  extractCustomSelection,
};
