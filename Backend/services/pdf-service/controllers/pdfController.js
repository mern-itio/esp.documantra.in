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
const { exec } = require('child_process');
const { promisify } = require('util');
const os = require('os');
// Remove the problematic pdf2html import
// const pdf2html = require('pdf2html');
// Utilities for page image rendering and splitting
const { convertSinglePageToImage } = require('./pdfToImage');
const { splitByPages } = require('./pdfSplitService');
// High-fidelity page rendering
const pdfjsLib = require('pdfjs-dist');
const { createCanvas } = require('canvas');

const execAsync = promisify(exec);

/**
 * Test LibreOffice installation and availability
 * @returns {Promise<Object>} - Test result object
 */
async function testLibreOfficeInstallation() {
  try {
    const { stdout, stderr } = await execAsync('libreoffice --version', {
      timeout: 10000
    });
    
    return {
      success: true,
      version: stdout.trim(),
      message: 'LibreOffice is properly installed and accessible'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      message: 'LibreOffice is not properly installed or accessible'
    };
  }
}

/**
 * Get supported LibreOffice conversion formats
 * @returns {Promise<Object>} - Available formats object
 */
async function getLibreOfficeFormats() {
  try {
    const { stdout } = await execAsync('libreoffice --help | grep -A 50 "convert-to"', {
      timeout: 10000
    });
    
    return {
      success: true,
      formats: stdout,
      message: 'LibreOffice formats retrieved successfully'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      message: 'Failed to retrieve LibreOffice formats'
    };
  }
}
/**
 * Convert DOC/DOCX to PDF using LibreOffice for layout preservation
 * @param {string} inputPath - Path to input DOC/DOCX file
 * @param {string} outputPath - Path where PDF will be saved
 * @returns {Promise<Object>} - Result object with file size
 */
async function convertDocToPdf(inputPath, outputPath) {
  try {
    console.log('Starting DOC to PDF conversion using LibreOffice for layout preservation...');

    // Ensure input file exists
    if (!await fs.pathExists(inputPath)) {
      throw new Error(`Input DOC/DOCX file not found: ${inputPath}`);
    }

    // Get file stats for input
    const inputStats = await fs.stat(inputPath);
    const inputSize = inputStats.size;

    // Create output directory if it doesn't exist
    const outputDir = path.dirname(outputPath);
    await fs.ensureDir(outputDir);

    // Use LibreOffice for DOC/DOCX to PDF conversion with enhanced parameters for better layout preservation
    const inputFileName = path.basename(inputPath, path.extname(inputPath));

    // Build a temp LO user profile to avoid profile/lock issues
    const profileDir = path.join(os.tmpdir(), `lo_profile_${Date.now()}`);
    await fs.ensureDir(profileDir);
    const profileUrl = `file://${profileDir.replace(/\\/g, '/')}`;

    // Two candidate binaries to try
    const candidates = ['soffice', 'libreoffice'];
    let conversionOk = false;
    let lastStdout = '';
    let lastStderr = '';
    for (const bin of candidates) {
      const cmd = `${bin} --headless --nodefault --nolockcheck --nologo --norestore --nofirststartwizard -env:UserInstallation=${profileUrl} --convert-to pdf:writer_pdf_Export --outdir "${outputDir}" "${inputPath}"`;
      console.log(`Executing LibreOffice command (DOC to PDF): ${cmd}`);
      try {
        const { stdout, stderr } = await execAsync(cmd, {
          timeout: 300000,
          maxBuffer: 1024 * 1024 * 20,
          env: {
            ...process.env,
            HOME: '/tmp',
            SAL_USE_VCLPLUGIN: 'headless',
            SAL_DISABLE_OPENCL: '1',
            SAL_DISABLE_OPENCL_IMAGING: '1',
            DISPLAY: ''
          }
        });
        lastStdout = stdout || '';
        lastStderr = stderr || '';
      } catch (e) {
        lastStdout = e.stdout || '';
        lastStderr = e.stderr || e.message || '';
      }

      const expectedOutputPath = path.join(outputDir, `${inputFileName}.pdf`);
      if (await fs.pathExists(expectedOutputPath)) {
        conversionOk = true;
        break;
      } else {
        console.warn(`LibreOffice attempt with ${bin} did not produce output. stdout:`, lastStdout);
        console.warn(`LibreOffice attempt with ${bin} stderr:`, lastStderr);

        // Fallback: try running via xvfb-run if available
        const xvfbCmd = `xvfb-run -a ${cmd}`;
        console.log(`Retrying with xvfb-run: ${xvfbCmd}`);
        try {
          const { stdout, stderr } = await execAsync(xvfbCmd, {
            timeout: 300000,
            maxBuffer: 1024 * 1024 * 20,
            env: {
              ...process.env,
              HOME: '/tmp',
              SAL_USE_VCLPLUGIN: 'gen',
              SAL_DISABLE_OPENCL: '1',
              SAL_DISABLE_OPENCL_IMAGING: '1'
            }
          });
          lastStdout = stdout || '';
          lastStderr = stderr || '';
        } catch (e2) {
          lastStdout = e2.stdout || '';
          lastStderr = e2.stderr || e2.message || '';
        }

        const expectedOutputPathX = path.join(outputDir, `${inputFileName}.pdf`);
        if (await fs.pathExists(expectedOutputPathX)) {
          conversionOk = true;
          break;
        } else {
          console.warn(`xvfb-run attempt did not produce output. stdout:`, lastStdout);
          console.warn(`xvfb-run attempt stderr:`, lastStderr);
        }
      }
    }

    // Cleanup the temp profile
    try { await fs.remove(profileDir); } catch (_) {}

    if (!conversionOk) {
      throw new Error('LibreOffice DOC to PDF conversion failed - output file not created');
    }

    // LibreOffice creates output file with same name but .pdf extension
    const expectedOutputPath = path.join(outputDir, `${inputFileName}.pdf`);
    if (expectedOutputPath !== outputPath) {
      await fs.move(expectedOutputPath, outputPath, { overwrite: true });
    }

    console.log('LibreOffice DOC to PDF conversion successful');

    // Get output file stats
    const outputStats = await fs.stat(outputPath);
    const outputSize = outputStats.size;

    console.log('DOC to PDF conversion completed successfully using LibreOffice.');

    return {
      success: true,
      fileSize: outputSize,
      inputFileSize: inputSize,
      message: 'DOC/DOCX converted to PDF using LibreOffice with full layout and image preservation',
      outputFile: path.basename(outputPath),
      conversionMethod: 'LibreOffice CLI',
      compressionRatio: inputSize > 0 ? ((inputSize - outputSize) / inputSize * 100).toFixed(2) + '%' : 'N/A'
    };
    
  } catch (error) {
    console.error('Error in DOC to PDF conversion using LibreOffice:', error);
    
    // Fallback to simple text extraction method if LibreOffice fails
    console.log('LibreOffice conversion failed, falling back to text extraction method...');
    
    try {
      return await convertDocToPdfSimple(inputPath, outputPath);
    } catch (fallbackError) {
      console.error('Fallback conversion also failed:', fallbackError);
      throw new Error(`Failed to convert DOC to PDF: ${error.message}. Fallback also failed: ${fallbackError.message}`);
    }
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
    // console.log('Starting simple DOC to PDF conversion using text extraction...');
    
    // Read the document
    const buffer = await fs.readFile(inputPath);
    
    // Extract text content using mammoth (without HTML conversion)
    const result = await mammoth.extractRawText({ buffer });
    const textContent = result.value;
    
    // console.log(`Extracted ${textContent.length} characters of text`);
    
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
    
    // console.log('Simple DOC to PDF conversion completed successfully');
    
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
 * Convert PDF to DOCX using LibreOffice CLI for exact layout preservation
 * @param {string} inputPath - Path to input PDF file
 * @param {string} outputPath - Path where DOCX will be saved
 * @returns {Promise<Object>} - Result object with file size
 */
async function convertPdfToDoc(inputPath, outputPath) {
  try {
    console.log('Starting PDF to DOCX conversion using LibreOffice CLI...');

    // Ensure input file exists
    if (!await fs.pathExists(inputPath)) {
      throw new Error(`Input PDF file not found: ${inputPath}`);
    }

    // Get file stats for input
    const inputStats = await fs.stat(inputPath);
    const inputSize = inputStats.size;

    // Create output directory if it doesn't exist
    const outputDir = path.dirname(outputPath);
    await fs.ensureDir(outputDir);

    // LibreOffice doesn't have good PDF import capabilities
    // We'll use a Python-based approach with pdf2docx library for better conversion
    const inputFileName = path.basename(inputPath, path.extname(inputPath));
    
    // Use Python script for PDF to DOCX conversion
    const pythonScript = path.join(__dirname, '..', 'scripts', 'pdf_to_docx_converter.py');
    const pythonCmd = `python "${pythonScript}" "${inputPath}" "${outputPath}"`;
    
    console.log(`Executing Python PDF to DOCX converter: ${pythonCmd}`);

    // Execute Python conversion
    const { stdout, stderr } = await execAsync(pythonCmd, {
      timeout: 300000, // 5 minutes timeout
      maxBuffer: 1024 * 1024 * 10 // 10MB buffer
    });

    if (stderr && stderr.includes('Error')) {
      console.warn('Python converter stderr:', stderr);
    }

    // Parse Python script output
    let pythonResult;
    try {
      pythonResult = JSON.parse(stdout);
    } catch (parseError) {
      console.warn('Failed to parse Python script output:', parseError);
      pythonResult = { success: false, error: 'Failed to parse Python script output' };
    }

    // Check if conversion was successful
    if (!pythonResult.success || !await fs.pathExists(outputPath)) {
      throw new Error(`Python PDF to DOCX conversion failed: ${pythonResult.error || 'Output file not created'}`);
    }

    console.log('Python PDF to DOCX conversion successful:', pythonResult.message);

    // Get output file stats
    const outputStats = await fs.stat(outputPath);
    const outputSize = outputStats.size;

    console.log('PDF to DOCX conversion completed successfully using Python pdf2docx.');

    return {
      success: true,
      fileSize: outputSize,
      inputFileSize: inputSize,
      message: pythonResult.message || 'PDF converted to DOCX using Python pdf2docx library',
      outputFile: path.basename(outputPath),
      conversionMethod: pythonResult.conversionMethod || 'Python pdf2docx',
      compressionRatio: inputSize > 0 ? ((inputSize - outputSize) / inputSize * 100).toFixed(2) + '%' : 'N/A',
      warning: pythonResult.warning || null
    };

  } catch (error) {
    console.error('Error in PDF to DOCX conversion using Python pdf2docx:', error);
    
    // Fallback to simple text extraction method if Python conversion fails
    console.log('Python pdf2docx conversion failed, falling back to text extraction method...');
    
    try {
    // Read PDF as buffer
    const pdfBuffer = await fs.readFile(inputPath);
    const pdfData = await pdfParse(pdfBuffer);
    const textContent = pdfData.text;
    const pageCount = pdfData.numpages;

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

    return {
      success: true,
      fileSize: stats.size,
        message: 'PDF converted to DOCX using fallback text extraction method (LibreOffice failed)',
      extractedPages: pageCount,
      extractedCharacters: textContent.length,
        outputFile: path.basename(outputPath),
        conversionMethod: 'Fallback Text Extraction',
        warning: 'Layout preservation may be limited with fallback method'
      };

    } catch (fallbackError) {
      console.error('Fallback conversion also failed:', fallbackError);
      throw new Error(`Failed to convert PDF to DOCX: ${error.message}. Fallback also failed: ${fallbackError.message}`);
    }
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
    // console.log('Starting DOC to PDF conversion using docx-pdf...');
    
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
    
    // console.log('DOC to PDF conversion completed successfully');
    
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
    // console.log('🔍 Reading PDF...');
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

    // Write to file with correct format
    XLSX.writeFile(workbook, outputPath, { bookType: 'xlsx' });

    // console.log('✅ PDF to Excel conversion completed.');
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
 * Convert Excel (.xlsx/.xls) to PDF preserving layout using LibreOffice via Python script
 * @param {string} inputPath
 * @param {string} outputPath
 */
async function convertExcelToPdf(inputPath, outputPath) {
  try {
    // Ensure input exists
    if (!await fs.pathExists(inputPath)) {
      throw new Error(`Input Excel file not found: ${inputPath}`);
    }

    // Prepare Python command
    const pythonScript = path.join(__dirname, '..', 'scripts', 'excel_to_pdf_converter.py');
    const pythonCmd = `python "${pythonScript}" "${inputPath}" "${outputPath}"`;

    // Execute conversion
    const { stdout, stderr } = await execAsync(pythonCmd, {
      timeout: 300000,
      maxBuffer: 1024 * 1024 * 20
    });

    // Parse Python output
    let result;
    try {
      result = JSON.parse(stdout);
    } catch (e) {
      result = { success: false, error: 'Failed to parse Python output', raw: stdout };
    }

    if (!result || !result.success) {
      const errMsg = (result && result.error) ? result.error : 'Unknown error from Python converter';
      throw new Error(`Excel to PDF conversion failed: ${errMsg}`);
    }

    // Validate output
    if (!await fs.pathExists(outputPath)) {
      throw new Error('Output PDF was not created');
    }

    const stats = await fs.stat(outputPath);
    return {
      success: true,
      outputFile: path.basename(outputPath),
      fileSize: stats.size
    };
  } catch (error) {
    console.error('❌ Error converting Excel to PDF (LibreOffice):', error);
    throw new Error('Failed to convert Excel to PDF');
  }
}



/**
 * Convert PDF to PowerPoint (PPTX) preserving layout using Python script (PyMuPDF + python-pptx)
 * @param {string} inputPath - PDF file path
 * @param {string} outputPath - Output PPTX file path
 */
async function convertPdfToPpt(inputPath, outputPath) {
  try {
    if (!await fs.pathExists(inputPath)) {
      throw new Error(`Input PDF not found: ${inputPath}`);
    }

    const pythonScript = path.join(__dirname, '..', 'scripts', 'pdf_to_pptx_converter.py');
    const pythonCmd = `python "${pythonScript}" "${inputPath}" "${outputPath}"`;

    const { stdout, stderr } = await execAsync(pythonCmd, {
      timeout: 300000,
      maxBuffer: 1024 * 1024 * 20
    });

    let result;
    try {
      result = JSON.parse(stdout);
    } catch (e) {
      result = { success: false, error: 'Failed to parse Python output', raw: stdout };
    }

    if (!result || !result.success) {
      const errMsg = (result && result.error) ? result.error : 'Unknown error from Python converter';
      throw new Error(`PDF to PPTX conversion failed: ${errMsg}`);
    }

    if (!await fs.pathExists(outputPath)) {
      throw new Error('Output PPTX was not created');
    }

    const stats = await fs.stat(outputPath);
    return {
      success: true,
      outputFile: path.basename(outputPath),
      fileSize: stats.size,
      pages: result.pages
    };
  } catch (error) {
    console.error('❌ Failed to convert PDF to PPTX (python):', error);
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
    if (!await fs.pathExists(inputPath)) {
      throw new Error(`Input PPT/PPTX not found: ${inputPath}`);
    }
    const pythonScript = path.join(__dirname, '..', 'scripts', 'ppt_to_pdf_converter.py');
    const pythonCmd = `python "${pythonScript}" "${inputPath}" "${outputPath}"`;
    const { stdout } = await execAsync(pythonCmd, {
      timeout: 300000,
      maxBuffer: 1024 * 1024 * 20
    });
    let result;
    try {
      result = JSON.parse(stdout);
    } catch {
      result = { success: false, error: 'Failed to parse Python output', raw: stdout };
    }
    if (!result || !result.success) {
      const errMsg = (result && result.error) ? result.error : 'Unknown error from Python converter';
      throw new Error(`PPT to PDF conversion failed: ${errMsg}`);
    }
    if (!await fs.pathExists(outputPath)) {
      throw new Error('Output PDF was not created');
    }
    const stats = await fs.stat(outputPath);
    return {
      success: true,
      fileSize: stats.size,
      outputFile: path.basename(outputPath)
    };
  } catch (error) {
    console.error('Error in PPT to PDF conversion (LibreOffice):', error);
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
    // console.log('Starting advanced PPT to PDF conversion...');
    
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
        // console.log('Attempting to extract content using pptxgenjs...');
        
        try {
          const PptxGenJS = require('pptxgenjs');
          const pptx = new PptxGenJS();
          
          // Load the existing presentation
          await pptx.load(pptBuffer);
          const slides = pptx.getSlides();
          slideCount = slides.length;
          
          // console.log(`Found ${slideCount} slides using pptxgenjs`);
          
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
            // console.log(`Successfully processed ${slideCount} slides with content`);
          }
        } catch (pptxError) {
        console.log('pptxgenjs failed, trying manual extraction...', pptxError.message);
        
        // Method 2: Manual text extraction from PPTX file
            try {
              // console.log('Attempting manual PPTX content extraction...');
              
              // Try to extract text using a different approach
              const extractedText = await extractTextFromPptx(pptBuffer);
              
              if (extractedText && extractedText.length > 0) {
                // Split into slides based on common patterns
                const slides = extractedText.split(/\n\s*\n/).filter(slide => slide.trim().length > 0);
                slideCount = slides.length;
                
                // console.log(`Manually extracted ${slideCount} slides`);
                
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
                // console.log(`Successfully processed ${slideCount} slides manually`);
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
    
    // console.log('Advanced PPT to PDF conversion completed successfully.');
    
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
    // console.log('Starting manual PPTX content extraction...');
    
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
      
      // console.log(`Found ${slideFiles.length} slide XML files`);
      
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
    
    // console.log(`Extracted ${extractedText.length} characters of text`);
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

  // console.log(`✅ PDF created: ${outputPath}`);
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
    // console.log('Starting PDF to TXT conversion...');

    const pdfBuffer = await fs.readFile(inputPath);
    const pdfData = await pdfParse(pdfBuffer);
    const textContent = pdfData.text;
    const pageCount = pdfData.numpages;

    await fs.writeFile(outputPath, textContent, 'utf8');
    const stats = await fs.stat(outputPath);

    // console.log('PDF to TXT conversion completed.');

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
    // console.log('Starting TXT to PDF conversion...');

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

    // console.log('TXT to PDF conversion completed.');

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
    // console.log('Starting PDF to HTML conversion...');

    // Read PDF and extract text with error handling
    const pdfBuffer = await fs.readFile(inputPath);
    
    let pdfData;
    try {
      pdfData = await pdfParse(pdfBuffer);
    } catch (parseError) {
      // console.log('PDF parsing failed, creating fallback HTML...');
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

    // Prepare outputs directory paths
    const outputsDir = path.join(__dirname, '..', 'outputs');
    await fs.ensureDir(outputsDir);

    // Create an images subfolder alongside the HTML output
    const outputBaseName = path.basename(outputPath, path.extname(outputPath));
    const imagesFolderName = `${outputBaseName}_images`;
    const imagesDir = path.join(outputsDir, imagesFolderName);
    await fs.ensureDir(imagesDir);

    // Render pages to images using pdfjs-dist for exact visual fidelity
    let imageFiles = [];
    try {
      const loadingTask = pdfjsLib.getDocument({ data: pdfBuffer });
      const pdf = await loadingTask.promise;
      const numPages = pdf.numPages || pageCount || 0;
      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2.0 });
        const canvas = createCanvas(viewport.width, viewport.height);
        const context = canvas.getContext('2d');
        await page.render({ canvasContext: context, viewport }).promise;
        const buffer = canvas.toBuffer('image/png');
        const imageFileName = `page_${i}.png`;
        const imageOutPath = path.join(imagesDir, imageFileName);
        await fs.writeFile(imageOutPath, buffer);
        imageFiles.push(imageFileName);
      }
    } catch (renderErr) {
      // Fallback: split + external renderer chain
      try {
        const splitPaths = await splitByPages(inputPath, 1);
        for (let i = 0; i < splitPaths.length; i++) {
          const singlePagePdfPath = splitPaths[i];
          const imageFileName = `page_${i + 1}.png`;
          const imageOutPath = path.join(imagesDir, imageFileName);
          const ok = await convertSinglePageToImage(singlePagePdfPath, i, imageOutPath);
          if (ok) {
            imageFiles.push(imageFileName);
          }
          try { await fs.remove(singlePagePdfPath); } catch {}
        }
      } catch {}
    }

    // Split text into paragraphs for inclusion below images
    const paragraphs = (textContent || '')
      .split(/\r?\n/)
      .filter(line => line.trim().length > 0);

    // Build HTML that embeds page images (if any) and extracted text
    // Prefer embedding images inline (base64) to ensure they display regardless of hosting path
    let imagesHtml = '';
    if (imageFiles && imageFiles.length > 0) {
      const tags = [];
      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        try {
          const imgBuf = await fs.readFile(path.join(imagesDir, file));
          const dataUri = `data:image/png;base64,${imgBuf.toString('base64')}`;
          tags.push(`<div class="pdf-page"><img alt="Page ${i + 1}" src="${dataUri}" /></div>`);
        } catch {
          const fallbackSrc = `${imagesFolderName}/${file}`;
          tags.push(`<div class="pdf-page"><img alt="Page ${i + 1}" src="${fallbackSrc}" /></div>`);
        }
      }
      imagesHtml = tags.join('\n');
    }

    // If we have images, prefer showing only images to preserve layout
    const textHtml = imageFiles.length > 0 ? '' : paragraphs.map(para => `<div class="paragraph">${para}</div>`).join('\n');

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
            max-width: 900px;
            margin-left: auto;
            margin-right: auto;
        }
        .pdf-page { margin: 0 0 24px 0; }
        .pdf-page img { max-width: 100%; height: auto; display: block; border: 1px solid #e0e0e0; }
        .paragraph { margin-bottom: 1em; }
        .header { text-align: center; margin-bottom: 2em; color: #333; }
    </style>
</head>
<body>
    <div class="header"></div>
    ${imagesHtml}
    ${textHtml}
</body>
</html>`;

    await fs.writeFile(outputPath, htmlContent, 'utf8');
    const stats = await fs.stat(outputPath);

    return {
      success: true,
      fileSize: stats.size,
      message: imageFiles.length > 0
        ? 'PDF converted to HTML with page images and extracted text'
        : 'PDF text extracted and converted to HTML',
      extractedPages: pageCount,
      extractedCharacters: (textContent || '').length,
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
    // console.log('Starting HTML to PDF conversion using simple text extraction...');

    // Read the HTML file
    let htmlContent = await fs.readFile(inputPath, 'utf8');
    // console.log(`HTML content length: ${htmlContent.length} characters`);
    
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
    
    // console.log(`Extracted ${textContent.length} characters of text`);
    
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
    
    // console.log('HTML to PDF conversion completed successfully using text extraction.');
    
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
    // console.log('Starting DOCX to XLSX conversion...');
    
    // Read the DOCX file and extract text
    const result = await mammoth.extractRawText({ path: inputPath });
    const textContent = result.value;
    
    // console.log(`Extracted ${textContent.length} characters from DOCX`);
    
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
    XLSX.writeFile(workbook, outputPath, { bookType: 'xlsx' });
    
    const stats = await fs.stat(outputPath);
    
    // console.log('DOCX to XLSX conversion completed successfully.');
    
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
        // console.log(`Cleaned up old file: ${file}`);
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
  testLibreOfficeInstallation,
  getLibreOfficeFormats,
  cleanupOldFiles
}; 