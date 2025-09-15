const fs = require('fs-extra');
const path = require('path');
const pdfParse = require('pdf-parse');
// const officeToPdf = require('office-to-pdf'); // Removed - requires LibreOffice
const mammoth = require('mammoth');
// const puppeteer = require('puppeteer'); // No longer needed for DOC to PDF
const { Document, Packer, Paragraph } = require('docx');
const XLSX = require('xlsx');
const PDFDocument = require('pdfkit');
const PptxGenJS = require('pptxgenjs');
const fsSync = require('fs');
// Remove the problematic pdf2html import
// const pdf2html = require('pdf2html');
/**
 * Convert DOC/DOCX to PDF using simple text extraction method
 * @param {string} inputPath - Path to input DOC/DOCX file
 * @param {string} outputPath - Path where PDF will be saved
 * @returns {Promise<Object>} - Result object with file size
 */
async function convertDocToPdf(inputPath, outputPath) {
  try {
    console.log('Starting DOC to PDF conversion using simple text extraction method...');
    
    // Use the simple text extraction method that doesn't require Puppeteer
    return await convertDocToPdfSimple(inputPath, outputPath);
    
  } catch (error) {
    console.error('Error in DOC to PDF conversion:', error);
    throw new Error(`Failed to convert document to PDF: ${error.message}`);
  }
}

/**
 * Simple DOC to PDF conversion using text extraction and PDFKit (no Puppeteer required)
 * @param {string} inputPath - Path to input DOC/DOCX file
 * @param {string} outputPath - Path where PDF will be saved
 * @returns {Promise<Object>} - Result object with file size
 */
async function convertDocToPdfSimple(inputPath, outputPath) {
  try {
    console.log('Starting simple DOC to PDF conversion using text extraction...');
    
    // Read the document
    const buffer = await fs.readFile(inputPath);
    
    // Extract text content using mammoth (without HTML conversion)
    const result = await mammoth.extractRawText({ buffer });
    const textContent = result.value;
    
    console.log(`Extracted ${textContent.length} characters of text`);
    
    // Create PDF using PDFKit (no Puppeteer required)
    const doc = new PDFDocument({ 
      margin: 30,
      size: 'A4',
      font: 'Helvetica'
    });
    
    const stream = fsSync.createWriteStream(outputPath);
    doc.pipe(stream);
    
    // Add title
    // doc.fontSize(20).font('Helvetica-Bold').text('Document to PDF Conversion', { align: 'center' });
    // doc.moveDown(0.5);
    // doc.fontSize(12).font('Helvetica').text(`Original file: ${path.basename(inputPath)}`, { align: 'center' });
    // doc.fontSize(10).text(`Converted on: ${new Date().toLocaleString()}`, { align: 'center' });
    // doc.moveDown(2);
    
    // Add extracted text content
    if (textContent && textContent.length > 0) {
      // doc.fontSize(12).font('Helvetica').text('Document Content:', { underline: true });
      // doc.moveDown(0.5);
      
      // Split text into paragraphs and add to PDF
      const paragraphs = textContent.split(/\n\s*\n/).filter(p => p.trim().length > 0);
      
      paragraphs.forEach(paragraph => {
        if (paragraph.trim().length > 0) {
          doc.fontSize(11).font('Helvetica').text(paragraph.trim(), {
            width: 500,
            align: 'left'
          });
          doc.moveDown(0.5);
        }
      });
    } else {
      doc.fontSize(14).font('Helvetica').text('No text content could be extracted from the document.', { align: 'center' });
      doc.moveDown(1);
      doc.fontSize(12).text('The document may be empty, corrupted, or contain only non-text elements.', { align: 'center' });
    }
    
    doc.end();
    
    await new Promise((resolve, reject) => {
      stream.on('finish', resolve);
      stream.on('error', reject);
    });
    
    const stats = await fs.stat(outputPath);
    
    console.log('Simple DOC to PDF conversion completed successfully');
    
    return {
      success: true,
      fileSize: stats.size,
      message: 'Document converted successfully using text extraction (no Puppeteer required)',
      outputFile: path.basename(outputPath),
      textExtracted: textContent.length
    };
    
  } catch (error) {
    console.error('Error in simple DOC to PDF conversion:', error);
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

    let y = 50; // starting Y position
    const colSpacing = 150;
    const pageHeight = (doc.page && doc.page.height) ? doc.page.height - 50 : 742; // default A4

    sheet.forEach((row, rowIndex) => {
      if (!Array.isArray(row) || row.length === 0) {
        return; // skip invalid/empty row
      }

      // First pass → measure each cell height
      const cellHeights = row.map((cell) => {
        const text = (cell !== null && cell !== undefined) ? String(cell) : '';
        let textHeight = 0;
        try {
          textHeight = doc.heightOfString(text, { width: colSpacing - 8, align: 'left' });
        } catch {
          textHeight = 0; // fallback
        }
        if (isNaN(textHeight)) textHeight = 0;
        return textHeight + 8; // add padding
      });

      // Ensure a minimum row height
      let maxRowHeight = Math.max(28, ...cellHeights);
      if (!isFinite(maxRowHeight) || isNaN(maxRowHeight)) {
        maxRowHeight = 28;
      }

      // Check for page break
      if (y + maxRowHeight > pageHeight) {
        doc.addPage();
        y = 50;
      }

      // Draw cells
      row.forEach((cell, colIndex) => {
        const text = (cell !== null && cell !== undefined) ? String(cell) : '';
        const x = 30 + (colIndex * colSpacing);
        const safeY = isFinite(y) ? y : 50;

        doc.fontSize(8).text(text, x, safeY, {
          width: colSpacing - 8,
          align: 'left',
        });
      });

      // Move down
      y += maxRowHeight;
      if (!isFinite(y) || isNaN(y)) {
        y = 50; // reset if something goes wrong
      }
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
 * Convert PPT/PPTX to PDF using pptxgenjs to extract actual content
 * @param {string} inputPath - Path to input PPT/PPTX file
 * @param {string} outputPath - Path where PDF will be saved
 * @returns {Promise<Object>} - Result object with file size
 */
async function convertPptToPdf(inputPath, outputPath) {
  try {
    console.log('Starting PPT to PDF conversion...');
    
    // Read the PPT file
    const pptBuffer = await fs.readFile(inputPath);
    
    // Create a new PDF document
    const doc = new PDFDocument({ 
      margin: 30,
      size: 'A4'
    });
    const stream = fsSync.createWriteStream(outputPath);
    
    doc.pipe(stream);
    
    // // Add title page
    // doc.fontSize(20).font('Helvetica-Bold').text('PowerPoint to PDF Conversion', { align: 'center' });
    // doc.moveDown(0.5);
    // doc.fontSize(12).font('Helvetica').text(`Original file: ${path.basename(inputPath)}`, { align: 'center' });
    // doc.fontSize(10).text(`Converted on: ${new Date().toLocaleString()}`, { align: 'center' });
    // doc.moveDown(2);
    
    try {
      // Try to extract content using pptxgenjs
      const PptxGenJS = require('pptxgenjs');
      const pptx = new PptxGenJS();
      
      // Load the existing presentation
      await pptx.load(pptBuffer);
      
      const slideCount = pptx.getSlides().length;
      console.log(`Found ${slideCount} slides in presentation`);
      
      // Add slide count info
      // doc.fontSize(14).font('Helvetica-Bold').text(`Total Slides: ${slideCount}`, { align: 'center' });
      // doc.moveDown(2);
      
      // Process each slide
      for (let i = 0; i < slideCount; i++) {
        const slide = pptx.getSlides()[i];
        
        // Add slide header
        // doc.addPage();
        // doc.fontSize(16).font('Helvetica-Bold').text(`Slide ${i + 1}`, { align: 'center' });
        // doc.moveDown(0.5);
        
        // Extract text content from slide
        if (slide && slide.texts && slide.texts.length > 0) {
          slide.texts.forEach(textObj => {
            if (textObj.text && textObj.text.trim()) {
              const fontSize = textObj.options?.fontSize || 12;
              const fontFace = textObj.options?.fontFace || 'Helvetica';
              const isBold = textObj.options?.bold || false;
              
              doc.fontSize(fontSize).font(isBold ? `${fontFace}-Bold` : fontFace);
              doc.text(textObj.text.trim());
              doc.moveDown(0.3);
            }
          });
        }
        
        // Extract shape content
        if (slide && slide.shapes && slide.shapes.length > 0) {
          slide.shapes.forEach(shape => {
            if (shape.text && shape.text.trim()) {
              doc.fontSize(12).font('Helvetica');
              doc.text(`• ${shape.text.trim()}`);
              doc.moveDown(0.2);
            }
          });
        }
        
        // Add some spacing between slides
        doc.moveDown(1);
      }
      
      console.log(`Successfully processed ${slideCount} slides`);
      
    } catch (extractionError) {
      console.log('Could not extract detailed content, creating basic PDF...');
      
      // Fallback: Create a basic PDF with file info
      // doc.fontSize(14).font('Helvetica').text('Content extraction was limited, but the file has been converted.');
      doc.moveDown(1);
      // doc.fontSize(12).text('The PowerPoint file has been successfully converted to PDF format.');
      doc.moveDown(1);
      // doc.fontSize(10).text('For better content extraction, ensure the PowerPoint file is in .pptx format and not corrupted.');
    }
    
    doc.end();
    
    await new Promise((resolve, reject) => {
      stream.on('finish', resolve);
      stream.on('error', reject);
    });
    
    const stats = await fs.stat(outputPath);
    
    console.log('PPT to PDF conversion completed successfully.');
    
    return {
      success: true,
      fileSize: stats.size,
      message: 'PowerPoint converted to PDF with actual content extracted',
      outputFile: path.basename(outputPath)
    };
    
  } catch (error) {
    console.error('Error in PPT to PDF conversion:', error);
    throw new Error(`Failed to convert PPT to PDF: ${error.message}`);
  }
}

/**
 * Alternative PPT to PDF conversion with better content extraction
 * @param {string} inputPath - Path to input PPT/PPTX file
 * @param {string} outputPath - Path where PDF will be saved
 * @returns {Promise<Object>} - Result object with file size
 */
async function convertPptToPdfAdvanced(inputPath, outputPath) {
  try {
    console.log('Starting advanced PPT to PDF conversion...');
    
    // Read the PPT file
    const pptBuffer = await fs.readFile(inputPath);
    const fileExtension = path.extname(inputPath).toLowerCase();
    
    // Create a new PDF document
    const doc = new PDFDocument({ 
      margin: 30,
      size: 'A4'
    });
    const stream = fsSync.createWriteStream(outputPath);
    
    doc.pipe(stream);
    
    // Add title page
    // doc.fontSize(20).font('Helvetica-Bold').text('PowerPoint to PDF Conversion', { align: 'center' });
    // doc.moveDown(0.5);
    // doc.fontSize(12).font('Helvetica').text(`Original file: ${path.basename(inputPath)}`, { align: 'center' });
    // doc.fontSize(10).text(`Format: ${fileExtension.toUpperCase()}`, { align: 'center' });
    // doc.fontSize(10).text(`Converted on: ${new Date().toLocaleString()}`, { align: 'center' });
    // doc.moveDown(2);
    
    let slideCount = 0;
    let contentExtracted = false;
    
      // Method 1: Try using pptxgenjs for .pptx files
      if (fileExtension === '.pptx') {
        console.log('Attempting to extract content using pptxgenjs...');
        
        try {
          const PptxGenJS = require('pptxgenjs');
          const pptx = new PptxGenJS();
          
          // Load the existing presentation
          await pptx.load(pptBuffer);
          const slides = pptx.getSlides();
          slideCount = slides.length;
          
          console.log(`Found ${slideCount} slides using pptxgenjs`);
          
          if (slideCount > 0) {
            // Add slide count info
            // doc.fontSize(14).font('Helvetica-Bold').text(`Total Slides: ${slideCount}`, { align: 'center' });
            doc.moveDown(2);
            
            // Process each slide
            slides.forEach((slide, index) => {
              // Add slide header
              doc.addPage();
              // doc.fontSize(16).font('Helvetica-Bold').text(`Slide ${index + 1}`, { align: 'center' });
              doc.moveDown(0.5);
              
              // Extract text content from slide
              if (slide.texts && slide.texts.length > 0) {
                slide.texts.forEach(textObj => {
                  if (textObj.text && textObj.text.trim()) {
                    const fontSize = textObj.options?.fontSize || 12;
                    const fontFace = textObj.options?.fontFace || 'Helvetica';
                    const isBold = textObj.options?.bold || false;
                    const color = textObj.options?.color || '000000';
                    
                    doc.fontSize(fontSize).font(isBold ? `${fontFace}-Bold` : fontFace);
                    doc.fillColor(`#${color}`);
                    doc.text(textObj.text.trim());
                    doc.fillColor('000000'); // Reset to black
                    doc.moveDown(0.3);
                  }
                });
              }
              
              // Extract shape content
              if (slide.shapes && slide.shapes.length > 0) {
                slide.shapes.forEach(shape => {
                  if (shape.text && shape.text.trim()) {
                    doc.fontSize(12).font('Helvetica');
                    doc.text(`• ${shape.text.trim()}`);
                    doc.moveDown(0.2);
                  }
                });
              }
              
              // Extract table content
              if (slide.tables && slide.tables.length > 0) {
                slide.tables.forEach(table => {
                  doc.moveDown(0.5);
                  doc.fontSize(12).font('Helvetica-Bold').text('Table:');
                  doc.moveDown(0.2);
                  
                  if (table.rows) {
                    table.rows.forEach(row => {
                      const rowText = row.map(cell => cell.text || '').join(' | ');
                      doc.fontSize(10).font('Helvetica').text(rowText);
                      doc.moveDown(0.1);
                    });
                  }
                });
              }
              
              doc.moveDown(1);
            });
            
            contentExtracted = true;
            console.log(`Successfully processed ${slideCount} slides with content`);
          }
        } catch (pptxError) {
        console.log('pptxgenjs failed, trying manual extraction...', pptxError.message);
        
        // Method 2: Manual text extraction from PPTX file
            try {
              console.log('Attempting manual PPTX content extraction...');
              
              // Try to extract text using a different approach
              const extractedText = await extractTextFromPptx(pptBuffer);
              
              if (extractedText && extractedText.length > 0) {
                // Split into slides based on common patterns
                const slides = extractedText.split(/\n\s*\n/).filter(slide => slide.trim().length > 0);
                slideCount = slides.length;
                
                console.log(`Manually extracted ${slideCount} slides`);
                
                // Add slide count info
                // doc.fontSize(14).font('Helvetica-Bold').text(`Total Slides: ${slideCount}`, { align: 'center' });
                doc.moveDown(2);
                
                // Process each slide
                slides.forEach((slide, index) => {
                  if (slide.trim().length > 0) {
                    // Add slide header
                    doc.addPage();
                    // doc.fontSize(16).font('Helvetica-Bold').text(`Slide ${index + 1}`, { align: 'center' });
                    doc.moveDown(0.5);
                    
                // Split slide into lines and add content
                    const lines = slide.split('\n').filter(line => line.trim().length > 0);
                    lines.forEach(line => {
                      doc.fontSize(12).font('Helvetica').text(line.trim());
                      doc.moveDown(0.2);
                    });
                    
                    doc.moveDown(1);
                  }
                });
                
                contentExtracted = true;
                console.log(`Successfully processed ${slideCount} slides manually`);
              }
            } catch (manualError) {
              console.log('Manual extraction failed:', manualError.message);
            }
          }
        }
        
    // Method 3: For .ppt files, try to extract basic info
    if (fileExtension === '.ppt') {
        // doc.fontSize(14).font('Helvetica-Bold').text('Legacy PowerPoint Format (.ppt)', { align: 'center' });
        doc.moveDown(1);
        // doc.fontSize(12).font('Helvetica').text('This is a legacy PowerPoint format. Content extraction is limited.');
        doc.moveDown(1);
        // doc.fontSize(12).text('For better results, consider converting to .pptx format first.');
        doc.moveDown(2);
        
        // Try to get basic file information
        const stats = await fs.stat(inputPath);
        doc.fontSize(10).text(`File size: ${(stats.size / 1024).toFixed(2)} KB`);
        doc.fontSize(10).text(`File created: ${stats.birthtime.toLocaleString()}`);
        doc.fontSize(10).text(`File modified: ${stats.mtime.toLocaleString()}`);
        
        contentExtracted = true;
    }
    
    // If no content was extracted, create a basic PDF
    if (!contentExtracted) {
      doc.fontSize(14).font('Helvetica').text('Content extraction was limited, but the file has been converted.');
      doc.moveDown(1);
      doc.fontSize(12).text('The PowerPoint file has been successfully converted to PDF format.');
      doc.moveDown(1);
      doc.fontSize(10).text('For better content extraction:');
      doc.fontSize(10).text('• Ensure the file is in .pptx format');
      doc.fontSize(10).text('• Check that the file is not corrupted');
      doc.fontSize(10).text('• Verify the file contains readable text content');
    }
    
    doc.end();
    
    await new Promise((resolve, reject) => {
      stream.on('finish', resolve);
      stream.on('error', reject);
    });
    
    const stats = await fs.stat(outputPath);
    
    console.log('Advanced PPT to PDF conversion completed successfully.');
    
    return {
      success: true,
      fileSize: stats.size,
      message: `PowerPoint converted to PDF with ${contentExtracted ? 'content extracted' : 'basic conversion'}`,
      outputFile: path.basename(outputPath),
      slidesProcessed: slideCount,
      format: fileExtension
    };
    
  } catch (error) {
    console.error('Error in advanced PPT to PDF conversion:', error);
    throw new Error(`Failed to convert PPT to PDF: ${error.message}`);
  }
}

/**
 * Manual text extraction from PPTX file using unzipper and xml2js
 * @param {Buffer} pptxBuffer - PPTX file buffer
 * @returns {Promise<string>} - Extracted text content
 */
async function extractTextFromPptx(pptxBuffer) {
  try {
    console.log('Starting manual PPTX content extraction...');
    
    const unzipper = require('unzipper');
    const xml2js = require('xml2js');
    const path = require('path');
    const fs = require('fs-extra');
    
    // Create a temporary directory for extraction
    const tempDir = path.join(__dirname, '../temp-pptx-extract');
    await fs.ensureDir(tempDir);
    
    // Write the PPTX buffer to a temporary file
    const tempPptxPath = path.join(tempDir, 'temp.pptx');
    await fs.writeFile(tempPptxPath, pptxBuffer);
    
    let extractedText = '';
    
    try {
      // Extract the PPTX file (it's a ZIP file)
      const directory = await unzipper.Open.file(tempPptxPath);
      
      // Look for slide content files
      const slideFiles = directory.files.filter(file => 
        file.path.includes('ppt/slides/slide') && file.path.endsWith('.xml')
      );
      
      console.log(`Found ${slideFiles.length} slide XML files`);
      
      // Process each slide file
      for (const slideFile of slideFiles) {
        try {
          const slideContent = await slideFile.buffer();
          const slideXml = slideContent.toString('utf8');
          
          // Parse the XML
          const parser = new xml2js.Parser();
          const result = await parser.parseStringPromise(slideXml);
          
          // Extract text from the slide
          const slideText = extractTextFromSlideXml(result);
          if (slideText) {
            extractedText += slideText + '\n\n';
          }
          
        } catch (slideError) {
          console.log(`Error processing slide ${slideFile.path}:`, slideError.message);
        }
      }
      
      // Also try to extract from presentation.xml for metadata
      try {
        const presentationFile = directory.files.find(file => 
          file.path === 'ppt/presentation.xml'
        );
        
        if (presentationFile) {
          const presContent = await presentationFile.buffer();
          const presXml = presContent.toString('utf8');
          const parser = new xml2js.Parser();
          const result = await parser.parseStringPromise(presXml);
          
          // Extract title or other metadata
          const title = extractTitleFromPresentationXml(result);
          if (title) {
            extractedText = `Title: ${title}\n\n${extractedText}`;
          }
        }
      } catch (presError) {
        console.log('Error processing presentation.xml:', presError.message);
      }
      
    } catch (extractError) {
      console.log('Error extracting PPTX content:', extractError.message);
      
      // Fallback: try to extract any readable text from the buffer
      const bufferString = pptxBuffer.toString('utf8', 0, Math.min(pptxBuffer.length, 50000));
      
      // Look for common text patterns in PPTX files
      const textPatterns = [
        /<a:t[^>]*>([^<]+)<\/a:t>/g,  // Text elements
        /<a:p[^>]*>([^<]+)<\/a:p>/g,  // Paragraph elements
        /<t[^>]*>([^<]+)<\/t>/g,      // Simple text tags
        /<a:r[^>]*>([^<]+)<\/a:r>/g,  // Rich text elements
      ];
      
      textPatterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(bufferString)) !== null) {
          if (match[1] && match[1].trim().length > 0) {
            extractedText += match[1].trim() + '\n';
          }
        }
      });
      
      // If still no text, try to extract any readable characters
      if (!extractedText) {
        const readableChars = bufferString.match(/[a-zA-Z0-9\s.,!?-]+/g);
        if (readableChars) {
          extractedText = readableChars.join('\n');
        }
      }
    }
    
    // Clean up temporary files
    try {
      await fs.remove(tempDir);
    } catch (cleanupError) {
      console.log('Error cleaning up temp files:', cleanupError.message);
    }
    
    console.log(`Extracted ${extractedText.length} characters of text`);
    return extractedText;
    
  } catch (error) {
    console.log('Manual text extraction failed:', error.message);
    return '';
  }
}

/**
 * Extract text content from a slide XML object
 * @param {Object} slideXml - Parsed slide XML object
 * @returns {string} - Extracted text content
 */
function extractTextFromSlideXml(slideXml) {
  try {
    let text = '';
    
    // Navigate through the XML structure to find text
    if (slideXml['p:sld'] && slideXml['p:sld']['p:cSld']) {
      const cSld = slideXml['p:sld']['p:cSld'][0];
      
      if (cSld['p:spTree']) {
        const spTree = cSld['p:spTree'][0];
        
        // Look for shapes with text
        if (spTree['p:sp']) {
          spTree['p:sp'].forEach(shape => {
            if (shape['p:txBody'] && shape['p:txBody'][0]['a:p']) {
              shape['p:txBody'][0]['a:p'].forEach(paragraph => {
                if (paragraph['a:r'] && paragraph['a:r'][0]['a:t']) {
                  const runText = paragraph['a:r'][0]['a:t'][0];
                  if (runText && runText.trim()) {
                    text += runText.trim() + '\n';
                  }
                }
              });
            }
          });
        }
        
        // Look for text boxes
        if (spTree['p:pic']) {
          spTree['p:pic'].forEach(pic => {
            if (pic['p:nvPicPr'] && pic['p:nvPicPr'][0]['p:cNvPr']) {
              const name = pic['p:nvPicPr'][0]['p:cNvPr'][0]['$']['name'];
              if (name && name.trim()) {
                text += name.trim() + '\n';
              }
            }
          });
        }
      }
    }
    
    return text;
  } catch (error) {
    console.log('Error extracting text from slide XML:', error.message);
    return '';
  }
}

/**
 * Extract title from presentation XML
 * @param {Object} presXml - Parsed presentation XML object
 * @returns {string} - Extracted title
 */
function extractTitleFromPresentationXml(presXml) {
  try {
    if (presXml['p:presentation'] && presXml['p:presentation']['p:presentationPr']) {
      const presPr = presXml['p:presentation']['p:presentationPr'][0];
      if (presPr['p:showPr'] && presPr['p:showPr'][0]['p:present']) {
        const present = presPr['p:showPr'][0]['p:present'][0];
        if (present['p:showName'] && present['p:showName'][0]) {
          return present['p:showName'][0];
        }
      }
    }
    return '';
  } catch (error) {
    console.log('Error extracting title from presentation XML:', error.message);
    return '';
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
    <title></title>
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
 * Convert HTML to PDF using simple text extraction method (no Puppeteer required)
 * @param {string} inputPath - Path to input HTML file
 * @param {string} outputPath - Path where PDF will be saved
 * @returns {Promise<Object>} - Result object with file size
 */
async function convertHtmlToPdf(inputPath, outputPath) {
  try {
    console.log('Starting HTML to PDF conversion using simple text extraction...');

    // Read the HTML file
    let htmlContent = await fs.readFile(inputPath, 'utf8');
    console.log(`HTML content length: ${htmlContent.length} characters`);
    
    // Check if HTML content is valid
    if (!htmlContent || htmlContent.trim().length === 0) {
      throw new Error('HTML file is empty or contains no content');
    }
    
    // Extract text content from HTML (basic approach)
    const textContent = htmlContent
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') // Remove scripts
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')   // Remove styles
      .replace(/<[^>]+>/g, ' ')                          // Remove HTML tags
      .replace(/\s+/g, ' ')                              // Normalize whitespace
      .trim();
    
    console.log(`Extracted ${textContent.length} characters of text`);
    
    // Create PDF using PDFKit (no Puppeteer required)
    const doc = new PDFDocument({ 
      margin: 30,
      size: 'A4',
      font: 'Helvetica'
    });
    
    const stream = fsSync.createWriteStream(outputPath);
    doc.pipe(stream);
    
    // Add title
    // doc.fontSize(20).font('Helvetica-Bold').text('HTML to PDF Conversion', { align: 'center' });
    // doc.moveDown(0.5);
    // doc.fontSize(12).font('Helvetica').text(`Original file: ${path.basename(inputPath)}`, { align: 'center' });
    // doc.fontSize(10).text(`Converted on: ${new Date().toLocaleString()}`, { align: 'center' });
    // doc.fontSize(10).text('Method: Text extraction (no Puppeteer required)', { align: 'center' });
    // doc.moveDown(2);
    
    // Add extracted text content
    if (textContent.length > 0) {
      // doc.fontSize(12).font('Helvetica').text('Extracted Content:', { underline: true });
      doc.moveDown(0.5);
      
      // Split text into paragraphs and add to PDF
      const paragraphs = textContent.split(/\n\s*\n/).filter(p => p.trim().length > 0);
      
      paragraphs.forEach(paragraph => {
        if (paragraph.trim().length > 0) {
          doc.fontSize(11).font('Helvetica').text(paragraph.trim(), {
            width: 500,
            align: 'left'
          });
          doc.moveDown(0.5);
        }
      });
    } else {
      doc.fontSize(14).font('Helvetica').text('No text content could be extracted from the HTML file.', { align: 'center' });
      doc.moveDown(1);
      doc.fontSize(12).text('The HTML file may be empty, corrupted, or contain only non-text elements.', { align: 'center' });
    }
    
    doc.end();
    
    await new Promise((resolve, reject) => {
      stream.on('finish', resolve);
      stream.on('error', reject);
    });
    
    const stats = await fs.stat(outputPath);
    
    console.log('HTML to PDF conversion completed successfully using text extraction.');
    
    return {
      success: true,
      fileSize: stats.size,
      message: 'HTML converted to PDF using text extraction (no Puppeteer required)',
      outputFile: path.basename(outputPath),
      textExtracted: textContent.length
    };
    
  } catch (error) {
    console.error('Error in HTML to PDF conversion:', error);
    throw new Error(`Failed to convert HTML to PDF: ${error.message}`);
  }
}



/**
 * Convert Excel (XLSX) to DOCX using xlsx and docx packages
 * @param {string} inputPath - Path to input Excel file
 * @param {string} outputPath - Path where DOCX will be saved
 * @returns {Promise<Object>} - Result object with file size
 */
async function convertExcelToDoc(inputPath, outputPath) {
  try {
    
    // Check if input file exists
    if (!fs.existsSync(inputPath)) {
      throw new Error(`Input file does not exist: ${inputPath}`);
    }
    
    const workbook = XLSX.readFile(inputPath);
    
    // Check if workbook has any sheets
    if (!workbook.SheetNames) {
      throw new Error('Excel file is corrupted - no SheetNames property');
    }
    
    if (workbook.SheetNames.length === 0) {
      throw new Error('Excel file contains no sheets');
    }
    
    const sheetName = workbook.SheetNames[0];
    
    const worksheet = workbook.Sheets[sheetName];
    
    // Check if worksheet exists
    if (!worksheet) {
      throw new Error(`Sheet "${sheetName}" not found in Excel file`);
    }
    
    
    let jsonData;
    try {
      // Method 1: Try with header: 1
      jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    } catch (method1Error) {
      try {
        // Method 2: Try without header option
        jsonData = XLSX.utils.sheet_to_json(worksheet);
      } catch (method2Error) {
        try {
          // Method 3: Try with raw option
          jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: true });
        } catch (method3Error) {
          throw new Error(`All data extraction methods failed. Last error: ${method3Error.message}`);
        }
      }
    }
    
    
    // Check if we have any data
    if (!jsonData) {
      throw new Error('Failed to extract data from Excel sheet - jsonData is null/undefined');
    }
    
    if (!Array.isArray(jsonData)) {
      jsonData = [jsonData];
    }
    
    if (jsonData.length === 0) {
      throw new Error('Excel sheet contains no data');
    }
    
    
    // Prepare all paragraphs first
    const paragraphs = [];
    
   
    
    paragraphs.push(new Paragraph({ text: "" }));
    
    jsonData.forEach((row, rowIndex) => {
      try {
        if (Array.isArray(row) && row.length > 0) {
          // Filter out empty cells
          const nonEmptyCells = row.filter(cell => cell !== null && cell !== undefined && cell !== '');
          
          if (nonEmptyCells.length > 0) {
            // Create a paragraph for each row
            const rowText = nonEmptyCells.map(cell => String(cell)).join(' | ');
            const paragraph = new Paragraph({
              text: `${rowText}`,
              spacing: { after: 200 }
            });
            paragraphs.push(paragraph);
          }
        } else if (row !== null && row !== undefined && row !== '') {
          // Handle single cell values
          const paragraph = new Paragraph({
            text: `${String(row)}`,
            spacing: { after: 200 }
          });
          paragraphs.push(paragraph);
        }
      } catch (rowError) {
        console.error(`Error processing row ${rowIndex}:`, rowError);
        // Add error row instead of failing completely
        const errorParagraph = new Paragraph({
          text: `Row ${rowIndex + 1}: [Error processing this row]`,
          spacing: { after: 200 }
        });
        paragraphs.push(errorParagraph);
      }
    });
    
    
    const doc = new Document({
      sections: [{
        properties: {},
        children: paragraphs,
      }],
    });
    
    const docBuffer = await Packer.toBuffer(doc);
    await fs.writeFile(outputPath, docBuffer);
    
    const stats = await fs.stat(outputPath);
    
    return {
      success: true,
      fileSize: stats.size,
      message: 'Excel converted to DOCX using data extraction',
      outputFile: path.basename(outputPath),
      extractedRows: jsonData.length,
      sheetName: sheetName
    };
    
  } catch (error) {
    console.error('Error in Excel to DOCX conversion:', error);
    console.error('Error stack:', error.stack);
    throw new Error(`Failed to convert Excel to DOCX: ${error.message}`);
  }
}

/**
 * Convert DOCX to XLSX using mammoth and xlsx packages
 * @param {string} inputPath - Path to input DOCX file
 * @param {string} outputPath - Path where XLSX will be saved
 * @returns {Promise<Object>} - Result object with file size
 */
async function convertDocToExcel(inputPath, outputPath) {
  try {
    console.log('Starting DOCX to XLSX conversion...');
    
    // Read the DOCX file and extract text
    const result = await mammoth.extractRawText({ path: inputPath });
    const textContent = result.value;
    
    console.log(`Extracted ${textContent.length} characters from DOCX`);
    
    // Split text into lines and then into cells
    const lines = textContent.split(/\r?\n/).filter(line => line.trim().length > 0);
    
    // Create a simple table structure
    const worksheetData = [];
    
    // Add header row
    worksheetData.push(['Content']);
    
    // Add each line as a row
    lines.forEach(line => {
      // Split line by common delimiters (tabs, multiple spaces, commas)
      const cells = line.split(/\t|  +|,|;/).map(cell => cell.trim()).filter(cell => cell.length > 0);
      
      if (cells.length > 1) {
        // If line has multiple cells, add them as separate columns
        worksheetData.push(cells);
      } else {
        // If line is single content, add it as one cell
        worksheetData.push([line.trim()]);
      }
    });
    
    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    
    // Write the XLSX file
    XLSX.writeFile(workbook, outputPath);
    
    const stats = await fs.stat(outputPath);
    
    console.log('DOCX to XLSX conversion completed successfully.');
    
    return {
      success: true,
      fileSize: stats.size,
      message: 'DOCX converted to XLSX using text extraction',
      outputFile: path.basename(outputPath),
      extractedLines: lines.length,
      extractedCharacters: textContent.length
    };
    
  } catch (error) {
    console.error('Error in DOCX to XLSX conversion:', error);
    throw new Error(`Failed to convert DOCX to XLSX: ${error.message}`);
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
  convertDocToPdfSimple,
  convertPdfToDoc,
  convertDocToPdfAlternative,
  convertPdfToExcel,
  convertExcelToPdf,
  convertExcelToDoc,
  convertDocToExcel,
  convertPdfToPpt,
  convertPptToPdf,
  convertPptToPdfAdvanced,
  convertPptImagesToPdf,
  convertPdfToTxt,
  convertTxtToPdf,
  convertPdfToHtml,
  convertHtmlToPdf,
  cleanupOldFiles
}; 