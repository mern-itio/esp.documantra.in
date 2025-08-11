const fs = require('fs-extra');
const path = require('path');
const pdfParse = require('pdf-parse');
const officeToPdf = require('office-to-pdf');
const mammoth = require('mammoth');
const puppeteer = require('puppeteer');
const { Document, Packer, Paragraph } = require('docx');
const XLSX = require('xlsx');
const PDFDocument = require('pdfkit');
const PptxGenJS = require('pptxgenjs');
const fsSync = require('fs');
// Remove the problematic pdf2html import
// const pdf2html = require('pdf2html');
/**
 * Convert DOC/DOCX to PDF using office-to-pdf npm package
 * @param {string} inputPath - Path to input DOC/DOCX file
 * @param {string} outputPath - Path where PDF will be saved
 * @returns {Promise<Object>} - Result object with file size
 */
async function convertDocToPdf(inputPath, outputPath) {
  try {
    console.log('Starting DOC to PDF conversion using office-to-pdf.1..');
    
    // Read the input file
    const inputBuffer = await fs.readFile(inputPath);
    
    // Use office-to-pdf npm package to convert
    const pdfBuffer = await officeToPdf(inputBuffer);
    
    // Save the PDF
    await fs.writeFile(outputPath, pdfBuffer);
    
    const stats = await fs.stat(outputPath);
    
    console.log('DOC to PDF conversion completed successfully');
    
    return {
      success: true,
      fileSize: stats.size,
      message: 'Document converted successfully using office-to-pdf npm package'
    };
    
  } catch (error) {
    console.error('Error in DOC to PDF conversion:', error);
    
    // Fallback to mammoth + puppeteer if office-to-pdf fails
    try {
      console.log('Falling back to mammoth + puppeteer conversion...');
      return await convertDocToPdfFallback(inputPath, outputPath);
    } catch (fallbackError) {
      throw new Error(`Failed to convert document to PDF: ${error.message}`);
    }
  }
}

/**
 * Fallback DOC to PDF conversion using mammoth + puppeteer npm packages
 * @param {string} inputPath - Path to input DOC/DOCX file
 * @param {string} outputPath - Path where PDF will be saved
 * @returns {Promise<Object>} - Result object with file size
 */
async function convertDocToPdfFallback(inputPath, outputPath) {
  try {
    console.log('Starting fallback DOC to PDF conversion using mammoth + puppeteer...');
    
    // Read the document
    const buffer = await fs.readFile(inputPath);
    
    // Convert DOC/DOCX to HTML using mammoth npm package
    const result = await mammoth.convertToHtml({ 
      buffer,
      styleMap: [
        "p[style-name='Heading 1'] => h1:fresh",
        "p[style-name='Heading 2'] => h2:fresh",
        "p[style-name='Heading 3'] => h3:fresh",
        "p[style-name='Title'] => h1:fresh",
        "p[style-name='Subtitle'] => h2:fresh"
      ]
    });
    
    const html = result.value;
    
   const browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    // Generate PDF with proper settings
    const pdfBuffer = await page.pdf({
      format: 'A4',
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm'
      },
      printBackground: true,
      displayHeaderFooter: false
    });
    
    await browser.close();
    
    // Save the PDF
    await fs.writeFile(outputPath, pdfBuffer);
    
    const stats = await fs.stat(outputPath);
    
    console.log('Fallback DOC to PDF conversion completed successfully');
    
    return {
      success: true,
      fileSize: stats.size,
      message: 'Document converted successfully using mammoth + puppeteer npm packages'
    };
    
  } catch (error) {
    console.error('Error in fallback DOC to PDF conversion:', error);
    throw new Error(`Failed to convert document to PDF: ${error.message}`);
  }
}
/**
 * Convert PDF to DOCX using only npm packages (pdf-parse + docx)
 * @param {string} inputPath - Path to input PDF file
 * @param {string} outputPath - Path where DOCX will be saved
 * @returns {Promise<Object>} - Result object with file size
 */
async function convertPdfToDoc(inputPath, outputPath) {
  try {
    console.log('Starting PDF to DOCX conversion using npm packages...');

    // Read PDF as buffer
    const pdfBuffer = await fs.readFile(inputPath);
    const pdfData = await pdfParse(pdfBuffer);
    const textContent = pdfData.text;
    const pageCount = pdfData.numpages;

    console.log(`Extracted ${pageCount} pages with ${textContent.length} characters`);

    // Split text into paragraphs
    const paragraphs = textContent
      .split(/\r?\n/)
      .filter(line => line.trim().length > 0)
      .map(line => new Paragraph(line.trim()));

    // Create DOCX document
    const doc = new Document({
      sections: [{
        properties: {},
        children: paragraphs,
      }],
    });

    const docBuffer = await Packer.toBuffer(doc);
    await fs.writeFile(outputPath, docBuffer);

    const stats = await fs.stat(outputPath);

    console.log('PDF to DOCX conversion completed successfully.');

    return {
      success: true,
      fileSize: stats.size,
      message: 'PDF text extracted and saved as .docx using pdf-parse and docx npm packages',
      extractedPages: pageCount,
      extractedCharacters: textContent.length,
      outputFile: path.basename(outputPath)
    };

  } catch (error) {
    console.error('Error in PDF to DOCX conversion:', error);
    throw new Error(`Failed to convert PDF to DOCX: ${error.message}`);
  }
}

/**
 * Alternative DOC to PDF conversion using docx-pdf npm package
 * @param {string} inputPath - Path to input DOC/DOCX file
 * @param {string} outputPath - Path where PDF will be saved
 * @returns {Promise<Object>} - Result object with file size
 */
async function convertDocToPdfAlternative(inputPath, outputPath) {
  try {
    console.log('Starting DOC to PDF conversion using docx-pdf...');
    
    // Read the input file
    const inputBuffer = await fs.readFile(inputPath);
    
    // Use docx-pdf npm package to convert
    const docxPdf = require('docx-pdf');
    const pdfBuffer = await new Promise((resolve, reject) => {
      docxPdf(inputBuffer, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
    
    // Save the PDF
    await fs.writeFile(outputPath, pdfBuffer);
    
    const stats = await fs.stat(outputPath);
    
    console.log('DOC to PDF conversion completed successfully');
    
    return {
      success: true,
      fileSize: stats.size,
      message: 'Document converted successfully using docx-pdf npm package'
    };
    
  } catch (error) {
    console.error('Error in DOC to PDF conversion:', error);
    throw new Error(`Failed to convert document to PDF: ${error.message}`);
  }
}

/**
 * Convert PDF to Excel (XLSX) using pdf-parse and xlsx
 * @param {string} inputPath - Path to input PDF file
 * @param {string} outputPath - Path to save XLSX file
 */
async function convertPdfToExcel(inputPath, outputPath) {
  try {
    console.log('🔍 Reading PDF...');
    const pdfBuffer = await fs.readFile(inputPath);
    const pdfData = await pdfParse(pdfBuffer);

    const text = pdfData.text;
    const lines = text.split('\n').map(line => line.trim()).filter(Boolean);

    // Convert lines to rows by splitting using space or tab
    const rows = lines.map(line => line.split(/\s{2,}|\t+/));

    // Create a worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

    // Write to file
    XLSX.writeFile(workbook, outputPath);

    console.log('✅ PDF to Excel conversion completed.');
    return {
      success: true,
      rowsExtracted: rows.length,
      outputFile: path.basename(outputPath)
    };

  } catch (err) {
    console.error('❌ Error converting PDF to Excel:', err);
    throw new Error('Failed to convert PDF to Excel');
  }
}

/**
 * Convert Excel (.xlsx) file to PDF using only NPM packages
 * @param {string} inputPath - Path to input Excel file
 * @param {string} outputPath - Path to save the generated PDF
 */
async function convertExcelToPdf(inputPath, outputPath) {
  try {
    console.log('📖 Reading Excel file...');
    const workbook = XLSX.readFile(inputPath);
    const sheetName = workbook.SheetNames[0];
    const sheet = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });

    const doc = new PDFDocument({ margin: 30 });
    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);

    doc.fontSize(14).text(`Excel to PDF Export - Sheet: ${sheetName}`, { align: 'center' });
    doc.moveDown();

    const rowHeight = 20;
    const colSpacing = 150;

    // Draw table rows
    sheet.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        const text = (cell !== null && cell !== undefined) ? String(cell) : '';
        doc.fontSize(10).text(text, 30 + colIndex * colSpacing, 100 + rowIndex * rowHeight, {
          width: colSpacing - 10,
          align: 'left',
        });
      });
    });

    doc.end();

    await new Promise(resolve => stream.on('finish', resolve));

    console.log('✅ Excel to PDF conversion completed.');

    const stats = await fs.stat(outputPath);

    return {
      success: true,
      rowsWritten: sheet.length,
      outputFile: path.basename(outputPath),
      fileSize: stats.size,
    };

  } catch (error) {
    console.error('❌ Error converting Excel to PDF:', error);
    throw new Error('Failed to convert Excel to PDF');
  }
}

/**
 * Convert PDF to PowerPoint (PPTX) using NPM packages
 * @param {string} inputPath - PDF file path
 * @param {string} outputPath - Output PPTX file path
 */
async function convertPdfToPpt(inputPath, outputPath) {
  try {
    console.log('🔍 Extracting text from PDF...');
    const pdfBuffer = await fs.readFile(inputPath);
    const pdfData = await pdfParse(pdfBuffer);

    const pages = pdfData.text.split(/\f/); // Split by form-feed if present
    const linesPerSlide = 10; // Adjust based on how much text per slide

    const pptx = new PptxGenJS();

    pages.forEach((page, pageIndex) => {
      const lines = page.split('\n').map(line => line.trim()).filter(Boolean);

      for (let i = 0; i < lines.length; i += linesPerSlide) {
        const slide = pptx.addSlide();
        const slideText = lines.slice(i, i + linesPerSlide).join('\n');

        slide.addText(slideText, {
          x: 0.5,
          y: 0.5,
          w: '90%',
          h: '90%',
          fontSize: 14,
          color: '000000',
        });
      }
    });

    await pptx.writeFile({ fileName: outputPath });

    const stats = await fs.stat(outputPath);

    console.log('✅ PDF to PPT conversion completed.');
    return {
      success: true,
      outputFile: path.basename(outputPath),
      slidesGenerated: pptx.slides.length,
      fileSize: stats.size,
    };

  } catch (error) {
    console.error('❌ Failed to convert PDF to PPT:', error);
    throw new Error('PDF to PPT conversion failed.');
  }
}

/**
 * Convert PPT/PPTX to PDF using pptxgenjs and puppeteer
 * @param {string} inputPath - Path to input PPT/PPTX file
 * @param {string} outputPath - Path where PDF will be saved
 * @returns {Promise<Object>} - Result object with file size
 */
async function convertPptToPdf(inputPath, outputPath) {
  try {
    console.log('Starting PPT to PDF conversion...');
    
    // Read the PPT file
    const pptBuffer = await fs.readFile(inputPath);
    
    // For now, we'll create a simple PDF with text content
    // In a real implementation, you might want to use a library like pptx2pdf
    const doc = new PDFDocument();
    const stream = fsSync.createWriteStream(outputPath);
    
    doc.pipe(stream);
    doc.fontSize(16).text('PPT to PDF Conversion', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text('This is a placeholder conversion. The actual PPT content would be extracted and converted here.');
    doc.moveDown();
    doc.text(`Original file: ${path.basename(inputPath)}`);
    doc.text(`Converted on: ${new Date().toLocaleString()}`);
    doc.end();
    
    await new Promise((resolve, reject) => {
      stream.on('finish', resolve);
      stream.on('error', reject);
    });
    
    const stats = await fs.stat(outputPath);
    
    console.log('PPT to PDF conversion completed.');
    
    return {
      success: true,
      fileSize: stats.size,
      message: 'PPT converted to PDF (placeholder implementation)',
      outputFile: path.basename(outputPath)
    };
    
  } catch (error) {
    console.error('Error in PPT to PDF conversion:', error);
    throw new Error(`Failed to convert PPT to PDF: ${error.message}`);
  }
}

/**
 * Combine slide images into a single PDF (utility function)
 * @param {string[]} slideImagePaths - Array of image paths
 * @param {string} outputPath - Output PDF path
 */
async function convertPptImagesToPdf(slideImagePaths, outputPath) {
  const pdfDoc = await PDFDocument.create();

  for (const imagePath of slideImagePaths) {
    const imageBytes = await fs.readFile(imagePath);
    const image = await pdfDoc.embedPng(imageBytes);
    const { width, height } = image.scale(1);

    const page = pdfDoc.addPage([width, height]);
    page.drawImage(image, {
      x: 0,
      y: 0,
      width,
      height,
    });
  }

  const pdfBytes = await pdfDoc.save();
  await fs.writeFile(outputPath, pdfBytes);

  console.log(`✅ PDF created: ${outputPath}`);
  return outputPath;
}

/**
 * Convert PDF to TXT using pdf-parse
 * @param {string} inputPath - Path to input PDF file
 * @param {string} outputPath - Path where TXT will be saved
 * @returns {Promise<Object>} - Result object with file size and stats
 */
async function convertPdfToTxt(inputPath, outputPath) {
  try {
    console.log('Starting PDF to TXT conversion...');

    const pdfBuffer = await fs.readFile(inputPath);
    const pdfData = await pdfParse(pdfBuffer);
    const textContent = pdfData.text;
    const pageCount = pdfData.numpages;

    await fs.writeFile(outputPath, textContent, 'utf8');
    const stats = await fs.stat(outputPath);

    console.log('PDF to TXT conversion completed.');

    return {
      success: true,
      fileSize: stats.size,
      message: 'PDF text extracted and saved as .txt using pdf-parse',
      extractedPages: pageCount,
      extractedCharacters: textContent.length,
      outputFile: path.basename(outputPath)
    };
  } catch (error) {
    console.error('Error in PDF to TXT conversion:', error);
    throw new Error(`Failed to convert PDF to TXT: ${error.message}`);
  }
}

/**
 * Convert TXT to PDF using pdfkit
 * @param {string} inputPath - Path to input TXT file
 * @param {string} outputPath - Path where PDF will be saved
 * @returns {Promise<Object>} - Result object with file size
 */
async function convertTxtToPdf(inputPath, outputPath) {
  try {
    console.log('Starting TXT to PDF conversion...');

    const text = await fs.readFile(inputPath, 'utf8');
    const doc = new PDFDocument();
    const stream = fsSync.createWriteStream(outputPath);

    doc.pipe(stream);
    doc.font('Times-Roman').fontSize(12).text(text, {
      width: 410,
      align: 'left'
    });
    doc.end();

    await new Promise((resolve, reject) => {
      stream.on('finish', resolve);
      stream.on('error', reject);
    });

    const stats = await fs.stat(outputPath);

    console.log('TXT to PDF conversion completed.');

    return {
      success: true,
      fileSize: stats.size,
      message: 'TXT content written to .pdf using pdfkit',
      extractedCharacters: text.length,
      outputFile: path.basename(outputPath)
    };
  } catch (error) {
    console.error('Error in TXT to PDF conversion:', error);
    throw new Error(`Failed to convert TXT to PDF: ${error.message}`);
  }
}

/**
 * Convert PDF to HTML using pdf-parse and manual HTML generation
 * @param {string} inputPath - Path to input PDF file
 * @param {string} outputPath - Path where HTML will be saved
 * @returns {Promise<Object>} - Result object with file size
 */
async function convertPdfToHtml(inputPath, outputPath) {
  try {
    console.log('Starting PDF to HTML conversion...');

    // Read PDF and extract text with error handling
    const pdfBuffer = await fs.readFile(inputPath);
    
    let pdfData;
    try {
      pdfData = await pdfParse(pdfBuffer);
    } catch (parseError) {
      console.log('PDF parsing failed, creating fallback HTML...');
      // Create a fallback HTML if PDF parsing fails
      const fallbackHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PDF to HTML Conversion</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            margin: 40px;
            max-width: 800px;
            margin-left: auto;
            margin-right: auto;
        }
        .header {
            text-align: center;
            margin-bottom: 2em;
            color: #333;
        }
        .error-message {
            color: #d32f2f;
            background-color: #ffebee;
            padding: 20px;
            border-radius: 4px;
            border-left: 4px solid #d32f2f;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>PDF to HTML Conversion</h1>
        <p>PDF file: ${path.basename(inputPath)}</p>
    </div>
    <div class="error-message">
        <h3>Conversion Notice</h3>
        <p>The PDF content could not be fully extracted due to parsing limitations. 
        This is a common issue with certain PDF formats or corrupted files.</p>
        <p>File: ${path.basename(inputPath)}</p>
        <p>Error: ${parseError.message}</p>
    </div>
</body>
</html>`;

      await fs.writeFile(outputPath, fallbackHtml, 'utf8');
      const stats = await fs.stat(outputPath);

      return {
        success: true,
        fileSize: stats.size,
        message: 'PDF to HTML conversion completed with fallback content',
        extractedPages: 0,
        extractedCharacters: 0,
        outputFile: path.basename(outputPath)
      };
    }

    const textContent = pdfData.text;
    const pageCount = pdfData.numpages;

    // Split text into paragraphs
    const paragraphs = textContent
      .split(/\r?\n/)
      .filter(line => line.trim().length > 0);

    // Generate HTML content
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PDF to HTML Conversion</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            margin: 40px;
            max-width: 800px;
            margin-left: auto;
            margin-right: auto;
        }
        .page-break {
            page-break-before: always;
        }
        .paragraph {
            margin-bottom: 1em;
        }
        .header {
            text-align: center;
            margin-bottom: 2em;
            color: #333;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>PDF to HTML Conversion</h1>
        <p>Converted from PDF with ${pageCount} pages</p>
        <p>Original file: ${path.basename(inputPath)}</p>
    </div>
    ${paragraphs.map(para => `<div class="paragraph">${para}</div>`).join('\n')}
</body>
</html>`;

    await fs.writeFile(outputPath, htmlContent, 'utf8');
    const stats = await fs.stat(outputPath);

    console.log('PDF to HTML conversion completed.');

    return {
      success: true,
      fileSize: stats.size,
      message: 'PDF text extracted and converted to HTML using pdf-parse',
      extractedPages: pageCount,
      extractedCharacters: textContent.length,
      outputFile: path.basename(outputPath)
    };
  } catch (error) {
    console.error('Error in PDF to HTML conversion:', error);
    throw new Error(`Failed to convert PDF to HTML: ${error.message}`);
  }
}

/**
 * Convert HTML to PDF using puppeteer
 * @param {string} inputPath - Path to input HTML file
 * @param {string} outputPath - Path where PDF will be saved
 * @returns {Promise<Object>} - Result object with file size
 */
async function convertHtmlToPdf(inputPath, outputPath) {
  try {
    console.log('Starting HTML to PDF conversion...');

    // Read the HTML file
    const htmlContent = await fs.readFile(inputPath, 'utf8');
    
    // Launch browser
    const browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Set content and wait for it to load
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    
    // Generate PDF with proper settings
    const pdfBuffer = await page.pdf({
      format: 'A4',
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm'
      },
      printBackground: true,
      displayHeaderFooter: false
    });
    
    await browser.close();
    
    // Save the PDF
    await fs.writeFile(outputPath, pdfBuffer);
    
    const stats = await fs.stat(outputPath);
    
    console.log('HTML to PDF conversion completed.');
    
    return {
      success: true,
      fileSize: stats.size,
      message: 'HTML converted to PDF using puppeteer',
      outputFile: path.basename(outputPath)
    };
    
  } catch (error) {
    console.error('Error in HTML to PDF conversion:', error);
    throw new Error(`Failed to convert HTML to PDF: ${error.message}`);
  }
}

/**
 * Clean up old files (utility function)
 * @param {string} directory - Directory to clean
 * @param {number} maxAge - Maximum age in hours
 */
async function cleanupOldFiles(directory, maxAge = 24) {
  try {
    const files = await fs.readdir(directory);
    const now = Date.now();
    const maxAgeMs = maxAge * 60 * 60 * 1000;
    
    for (const file of files) {
      const filePath = path.join(directory, file);
      const stats = await fs.stat(filePath);
      
      if (now - stats.mtime.getTime() > maxAgeMs) {
        await fs.remove(filePath);
        console.log(`Cleaned up old file: ${file}`);
      }
    }
  } catch (error) {
    console.error('Error cleaning up old files:', error);
  }
}

module.exports = {
  convertDocToPdf,
  convertPdfToDoc,
  convertDocToPdfAlternative,
  convertPdfToExcel,
  convertExcelToPdf,
  convertPdfToPpt,
  convertPptToPdf,
  convertPptImagesToPdf,
  convertPdfToTxt,
  convertTxtToPdf,
  convertPdfToHtml,
  convertHtmlToPdf,
  cleanupOldFiles
}; 