const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const pdfPoppler = require('pdf-poppler');
const pdfParse = require('pdf-parse');
const Epub = require('epub-gen');
const Tesseract = require('tesseract.js');
const { PDFDocument: PDFLibDoc, rgb, StandardFonts } = require('pdf-lib');
const sharp = require('sharp');
const mammoth = require('mammoth');
//const libre = require('libreoffice-convert');
const puppeteer = require('puppeteer');

// Import conversion functions from pdfController
const {
  convertDocToPdf,
  convertDocToPdfFallback,
  convertPdfToDoc,
  convertPdfToExcel,
  convertExcelToPdf,
  convertPdfToPpt,
  convertPptToPdf,
  convertPdfToTxt,
  convertTxtToPdf,
  convertPdfToHtml,
  convertHtmlToPdf
} = require('./pdfController');


function getExtension(filename) {
  return path.extname(filename).replace('.', '').toLowerCase();
}


// Paths
const uploadDir = path.join(__dirname, '..', 'uploads');
const outputDir = path.join(__dirname, '..', 'images');
const epubsDir = path.join(__dirname, '..', 'epubs');
const outputsDir = path.join(__dirname, '..', 'outputs'); // Add outputs directory
const outputPdfPath = path.join(__dirname, '..', 'output.pdf');
const editedDir = path.join(__dirname, '..', 'edited');

// Ensure directories exist
if (!fs.existsSync(editedDir)) fs.mkdirSync(editedDir);
if (!fs.existsSync(outputsDir)) fs.mkdirSync(outputsDir, { recursive: true });

// Create unique filenames
function generateFilename(base, ext) {
  const timestamp = Date.now();
  return `${base}_${timestamp}.${ext}`;
}

// Format plain text as HTML
function formatTextAsHtml(text) {
  return text
    .split('\n')
    .map(p => p.trim())
    .filter(p => p.length > 0)
    .map(p => `<p>${p}</p>`)
    .join('\n');
}

// PDF → Images
exports.convertPDFtoImage = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No PDF file uploaded" });
    const pdfPath = path.join(uploadDir, generateFilename('uploaded', 'pdf'));
    fs.writeFileSync(pdfPath, req.file.buffer);

    const options = {
      format: 'png',
      out_dir: outputDir,
      out_prefix: 'page',
      page: null,
    };

    await pdfPoppler.convert(pdfPath, options);
    
    // Wait for files to be written
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check what files were created
    const allFiles = fs.readdirSync(outputDir);
    console.log('Files in output directory:', allFiles);
    
    const imageFiles = allFiles.filter(file => 
      file.endsWith('.png') || file.endsWith('.jpg')
    );
    
    console.log('Generated image files:', imageFiles);
    
    if (imageFiles.length === 0) {
      throw new Error('No image files were created');
    }
    
    const fullImagePaths = imageFiles.map(file => path.join(outputDir, file));
    
    // Return relative paths for frontend (fix Windows path separators)
    const relativeFiles = fullImagePaths.map(file => {
      const relativePath = file.replace(process.cwd(), '');
      return relativePath.replace(/\\/g, '/');
    });
    
    res.json({ 
      message: "PDF converted to images successfully", 
      images: relativeFiles,
      outputDir: outputDir.replace(process.cwd(), '').replace(/\\/g, '/'),
      fileCount: imageFiles.length,
      originalFile: req.file.originalname,
      method: 'pdf-poppler'
    });
    
  } catch (err) {
    console.error('PDF to Image Error:', err.message);
    res.status(500).json({ 
      error: "Conversion failed", 
      details: err.message 
    });
  }
};

// Images → PDF
exports.convertImagesToPDF = async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: "No images uploaded" });
  }

  console.log('Converting images to PDF. Files received:', req.files.length);
  req.files.forEach((file, index) => {
    console.log(`File ${index + 1}:`, {
      originalname: file.originalname,
      filename: file.filename,
      path: file.path,
      size: file.size
    });
  });

  try {
    // Create a unique filename for the output PDF
    const outputPdfName = `output_${Date.now()}.pdf`;
    const outputPdfPath = path.join(__dirname, '..', outputPdfName); // Save to pdf-service root
    
    console.log('Creating PDF at:', outputPdfPath);
    console.log('Current directory:', __dirname);
    console.log('Root directory:', process.cwd());
    
    const doc = new PDFDocument({ autoFirstPage: false });
    const stream = fs.createWriteStream(outputPdfPath);
    doc.pipe(stream);

    req.files.forEach(file => {
      const image = doc.openImage(file.path);
      doc.addPage({ size: [image.width, image.height] });
      doc.image(file.path, 0, 0);
    });

    doc.end();

    stream.on('finish', () => {
      console.log('PDF created at:', outputPdfPath);
      
      // Return relative path for frontend (just the filename, not full path)
      const relativePath = `/${path.basename(outputPdfPath)}`;
      
      console.log('Sending response to frontend:', {
        message: "Images converted to PDF successfully",
        pdf: relativePath,
        originalFiles: req.files.map(f => f.originalname),
        fileCount: req.files.length
      });
      
      res.json({ 
        message: "Images converted to PDF successfully", 
        pdf: relativePath,
        originalFiles: req.files.map(f => f.originalname),
        fileCount: req.files.length
      });
    });

    stream.on('error', (error) => {
      console.error('Stream error:', error);
      res.status(500).json({ error: "Failed to create PDF stream" });
    });

  } catch (err) {
    console.error('Image to PDF Error:', err.message);
    res.status(500).json({ 
      error: "Conversion failed", 
      details: err.message 
    });
  }
};

// PDF → EPUB (with text + OCR from images)
exports.convertPdfToEpub = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No PDF file uploaded.' });

    const epubPdfPath = path.join(uploadDir, generateFilename('epub_input', 'pdf'));
    fs.writeFileSync(epubPdfPath, req.file.buffer);

    const pdfBuffer = fs.readFileSync(epubPdfPath);
    const pdfData = await pdfParse(pdfBuffer);

    // Convert to images for embedding in EPUB
    const epubImageDir = path.join(outputDir, path.basename(epubPdfPath, '.pdf'));
    if (!fs.existsSync(epubImageDir)) fs.mkdirSync(epubImageDir, { recursive: true });

    const popplerOptions = {
      format: 'png',
      out_dir: epubImageDir,
      out_prefix: 'page',
      page: null,
    };

    await pdfPoppler.convert(epubPdfPath, popplerOptions);

    const imageFiles = fs.readdirSync(epubImageDir).filter(f => f.endsWith('.png'));
    const imagePaths = imageFiles.map(f => path.join(epubImageDir, f));

    // Run OCR on each image
    const ocrTexts = await Promise.all(imagePaths.map(imagePath => {
      return Tesseract.recognize(imagePath, 'eng', { logger: () => { } })
        .then(result => result.data.text)
        .catch(err => {
          console.error('OCR error for', imagePath, err.message);
          return '';
        });
    }));

    const combinedOCRText = ocrTexts.join('\n');

    const htmlContent = `
      <h2>Extracted PDF Text</h2>
      ${formatTextAsHtml(pdfData.text)}

      <hr/>
      <h2>Text Extracted from Images (OCR)</h2>
      ${formatTextAsHtml(combinedOCRText)}
    `;

    const outputEpubFile = path.join(epubsDir, generateFilename('output', 'epub'));

    const epubOptions = {
      title: "Converted PDF with OCR",
      author: "Your App",
      content: [
        {
          title: "PDF Content + OCR",
          data: htmlContent
        }
      ],
      output: outputEpubFile
    };

    await new Epub(epubOptions).promise;
    
    // Return relative path for frontend
    const relativePath = `/epubs/${path.basename(outputEpubFile)}`;
    
    console.log('EPUB created at:', outputEpubFile);
    console.log('Sending response to frontend:', {
      message: 'PDF converted to EPUB successfully.',
      epub: relativePath
    });
    
    res.json({ 
      message: 'PDF converted to EPUB successfully.', 
      epub: relativePath 
    });
  } catch (err) {
    console.error('PDF to EPUB Error:', err.message);
    res.status(500).json({ 
      error: 'Failed to convert PDF to EPUB.',
      details: err.message 
    });
  }
};

// PDF → EPUB for batch conversion (handles individual file objects)
async function convertPdfToEpubForBatch(file) {
  try {
    // Create a temporary file path for the uploaded PDF
    const epubPdfPath = path.join(uploadDir, generateFilename('epub_input', 'pdf'));
    fs.writeFileSync(epubPdfPath, file.buffer);

    const pdfBuffer = fs.readFileSync(epubPdfPath);
    const pdfData = await pdfParse(pdfBuffer);

    // Convert to images for embedding in EPUB
    const epubImageDir = path.join(outputDir, path.basename(epubPdfPath, '.pdf'));
    if (!fs.existsSync(epubImageDir)) fs.mkdirSync(epubImageDir, { recursive: true });

    const popplerOptions = {
      format: 'png',
      out_dir: epubImageDir,
      out_prefix: 'page',
      page: null,
    };

    await pdfPoppler.convert(epubPdfPath, popplerOptions);

    const imageFiles = fs.readdirSync(epubImageDir).filter(f => f.endsWith('.png'));
    const imagePaths = imageFiles.map(f => path.join(epubImageDir, f));

    // Run OCR on each image
    const ocrTexts = await Promise.all(imagePaths.map(imagePath => {
      return Tesseract.recognize(imagePath, 'eng', { logger: () => { } })
        .then(result => result.data.text)
        .catch(err => {
          console.error('OCR error for', imagePath, err.message);
          return '';
        });
    }));

    const combinedOCRText = ocrTexts.join('\n');

    const htmlContent = `
      <h2>Extracted PDF Text</h2>
      ${formatTextAsHtml(pdfData.text)}

      <hr/>
      <h2>Text Extracted from Images (OCR)</h2>
      ${formatTextAsHtml(combinedOCRText)}
    `;

    const outputEpubFile = path.join(epubsDir, generateFilename('output', 'epub'));

    const epubOptions = {
      title: "Converted PDF with OCR",
      author: "Your App",
      content: [
        {
          title: "PDF Content + OCR",
          data: htmlContent
        }
      ],
      output: outputEpubFile
    };

    await new Epub(epubOptions).promise;
    
    // Return relative path for frontend
    const relativePath = `/epubs/${path.basename(outputEpubFile)}`;
    
    console.log('EPUB created at:', outputEpubFile);
    
    return {
      message: 'PDF converted to EPUB successfully.',
      epub: relativePath
    };
  } catch (err) {
    console.error('PDF to EPUB Error:', err.message);
    throw new Error(`Failed to convert PDF to EPUB: ${err.message}`);
  }
}

// Batch Conversion - Handle multiple files with different output formats
exports.batchConvert = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }

    if (req.files.length > 5) {
      return res.status(400).json({ error: "Maximum 5 files allowed" });
    }

    const { outputFormats } = req.body; // Array of desired output formats
    
    // Parse outputFormats if it's a JSON string
    let parsedOutputFormats;
    try {
      parsedOutputFormats = typeof outputFormats === 'string' ? JSON.parse(outputFormats) : outputFormats;
    } catch (error) {
      console.error('Error parsing outputFormats:', error);
      return res.status(400).json({ error: "Invalid outputFormats format" });
    }
    
    if (!parsedOutputFormats || !Array.isArray(parsedOutputFormats) || parsedOutputFormats.length !== req.files.length) {
      return res.status(400).json({ error: "Output formats array required for each file" });
    }

    console.log('Batch conversion started. Files:', req.files.length);
    console.log('Output formats:', parsedOutputFormats);
    console.log('Request body:', req.body);
    console.log('Files received:', req.files.map(f => ({ name: f.originalname, mimetype: f.mimetype, size: f.size })));

    const results = [];
    const convertedFiles = [];

    // Process each file according to its selected output format
    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      const targetFormat = parsedOutputFormats[i];
      
      console.log(`Processing file ${i + 1}: ${file.originalname} -> ${targetFormat}`);

      try {
        let result;
        
        // Determine conversion based on input and output formats
        if (file.mimetype === 'application/pdf') {
          // PDF input conversions
          switch (targetFormat) {
            case 'docx':
              // Create temporary file paths for conversion
              const tempPdfPath = path.join(uploadDir, generateFilename('temp_pdf', 'pdf'));
              const tempDocxPath = path.join(__dirname, '..', 'outputs', `converted_${Date.now()}.docx`);
              fs.writeFileSync(tempPdfPath, file.buffer);
              result = await convertPdfToDoc(tempPdfPath, tempDocxPath);
              break;
            case 'xlsx':
              const tempPdfPath2 = path.join(uploadDir, generateFilename('temp_pdf2', 'pdf'));
              const tempXlsxPath = path.join(__dirname, '..', 'outputs', `converted_${Date.now()}.xlsx`);
              fs.writeFileSync(tempPdfPath2, file.buffer);
              result = await convertPdfToExcel(tempPdfPath2, tempXlsxPath);
              break;
            case 'pptx':
              const tempPdfPath3 = path.join(uploadDir, generateFilename('temp_pdf3', 'pdf'));
              const tempPptxPath = path.join(__dirname, '..', 'outputs', `converted_${Date.now()}.pptx`);
              fs.writeFileSync(tempPdfPath3, file.buffer);
              result = await convertPdfToPpt(tempPdfPath3, tempPptxPath);
              break;
            case 'txt':
              const tempPdfPath4 = path.join(uploadDir, generateFilename('temp_pdf4', 'pdf'));
              const tempTxtPath = path.join(__dirname, '..', 'outputs', `converted_${Date.now()}.txt`);
              fs.writeFileSync(tempPdfPath4, file.buffer);
              result = await convertPdfToTxt(tempPdfPath4, tempTxtPath);
              break;
            case 'html':
              const tempPdfPath5 = path.join(uploadDir, generateFilename('temp_pdf5', 'pdf'));
              const tempHtmlPath = path.join(__dirname, '..', 'outputs', `converted_${Date.now()}.html`);
              fs.writeFileSync(tempPdfPath5, file.buffer);
              result = await convertPdfToHtml(tempPdfPath5, tempHtmlPath);
              break;
            case 'epub':
              // For batch conversion, we need to handle this differently since convertPdfToEpub expects req object
              result = await convertPdfToEpubForBatch(file);
              break;
            default:
              throw new Error(`Unsupported output format: ${targetFormat}`);
          }
        } else if (file.mimetype.includes('word') || file.originalname.endsWith('.doc') || file.originalname.endsWith('.docx')) {
          // Word document input conversions
          switch (targetFormat) {
            case 'pdf':
              const tempDocPath = path.join(uploadDir, generateFilename('temp_doc', path.extname(file.originalname)));
              const tempPdfPath6 = path.join(__dirname, '..', 'outputs', `converted_${Date.now()}.pdf`);
              fs.writeFileSync(tempDocPath, file.buffer);
              // Use the fallback method that doesn't require LibreOffice
              result = await convertDocToPdfFallback(tempDocPath, tempPdfPath6);
              break;
            default:
              throw new Error(`Unsupported output format: ${targetFormat}`);
          }
        } else if (file.mimetype.includes('excel') || file.originalname.endsWith('.xls') || file.originalname.endsWith('.xlsx')) {
          // Excel input conversions
          switch (targetFormat) {
            case 'pdf':
              const tempExcelPath = path.join(uploadDir, generateFilename('temp_excel', path.extname(file.originalname)));
              const tempPdfPath7 = path.join(__dirname, '..', 'outputs', `converted_${Date.now()}.pdf`);
              fs.writeFileSync(tempExcelPath, file.buffer);
              result = await convertExcelToPdf(tempExcelPath, tempPdfPath7);
              break;
            default:
              throw new Error(`Unsupported output format: ${targetFormat}`);
          }
        } else if (file.mimetype.includes('powerpoint') || file.originalname.endsWith('.ppt') || file.originalname.endsWith('.pptx')) {
          // PowerPoint input conversions
          switch (targetFormat) {
            case 'pdf':
              const tempPptPath = path.join(uploadDir, generateFilename('temp_ppt', path.extname(file.originalname)));
              const tempPdfPath8 = path.join(__dirname, '..', 'outputs', `converted_${Date.now()}.pdf`);
              fs.writeFileSync(tempPptPath, file.buffer);
              result = await convertPptToPdf(tempPptPath, tempPdfPath8);
              break;
            default:
              throw new Error(`Unsupported output format: ${targetFormat}`);
          }
        } else if (file.mimetype === 'text/plain' || file.originalname.endsWith('.txt')) {
          // Text input conversions
          switch (targetFormat) {
            case 'pdf':
              const tempTxtPath2 = path.join(uploadDir, generateFilename('temp_txt', 'txt'));
              const tempPdfPath9 = path.join(__dirname, '..', 'outputs', `converted_${Date.now()}.pdf`);
              fs.writeFileSync(tempTxtPath2, file.buffer);
              result = await convertTxtToPdf(tempTxtPath2, tempPdfPath9);
              break;
            default:
              throw new Error(`Unsupported output format: ${targetFormat}`);
          }
        } else if (file.mimetype === 'text/html' || file.originalname.endsWith('.html')) {
          // HTML input conversions
          switch (targetFormat) {
            case 'pdf':
              const tempHtmlPath2 = path.join(uploadDir, generateFilename('temp_html', 'html'));
              const tempPdfPath10 = path.join(__dirname, '..', 'outputs', `converted_${Date.now()}.pdf`);
              fs.writeFileSync(tempHtmlPath2, file.buffer);
              result = await convertHtmlToPdf(tempHtmlPath2, tempPdfPath10);
              break;
            default:
              throw new Error(`Unsupported output format: ${targetFormat}`);
          }
        } else {
          throw new Error(`Unsupported input file type: ${file.mimetype}`);
        }

        // Add successful result
        let downloadUrl;
        
        // Use the outputFile property from the result, or construct from the result properties
        if (result.outputFile) {
          downloadUrl = `/outputs/${result.outputFile}`;
        } else {
          // Fallback to other result properties
          downloadUrl = result.downloadUrl || result.pdf || result.epub;
          
          // Ensure the download URL has the proper format
          if (downloadUrl && !downloadUrl.startsWith('/')) {
            downloadUrl = `/outputs/${downloadUrl}`;
          } else if (downloadUrl && !downloadUrl.startsWith('/outputs/')) {
            downloadUrl = `/outputs${downloadUrl}`;
          }
        }
        
        results.push({
          fileName: file.originalname,
          inputFormat: path.extname(file.originalname).substring(1),
          outputFormat: targetFormat,
          status: 'success',
          downloadUrl: downloadUrl,
          message: result.message || 'Conversion successful'
        });

        // Store converted file info for zip creation
        if (downloadUrl) {
          convertedFiles.push({
            name: `${path.parse(file.originalname).name}.${targetFormat}`,
            path: downloadUrl,
            format: targetFormat
          });
        }
        
        // Clean up temporary input files
        try {
          if (tempPdfPath && fs.existsSync(tempPdfPath)) fs.unlinkSync(tempPdfPath);
          if (tempPdfPath2 && fs.existsSync(tempPdfPath2)) fs.unlinkSync(tempPdfPath2);
          if (tempPdfPath3 && fs.existsSync(tempPdfPath3)) fs.unlinkSync(tempPdfPath3);
          if (tempPdfPath4 && fs.existsSync(tempPdfPath4)) fs.unlinkSync(tempPdfPath4);
          if (tempPdfPath5 && fs.existsSync(tempPdfPath5)) fs.unlinkSync(tempPdfPath5);
          if (tempDocPath && fs.existsSync(tempDocPath)) fs.unlinkSync(tempDocPath);
          if (tempExcelPath && fs.existsSync(tempExcelPath)) fs.unlinkSync(tempExcelPath);
          if (tempPptPath && fs.existsSync(tempPptPath)) fs.unlinkSync(tempPptPath);
          if (tempTxtPath2 && fs.existsSync(tempTxtPath2)) fs.unlinkSync(tempTxtPath2);
          if (tempHtmlPath2 && fs.existsSync(tempHtmlPath2)) fs.unlinkSync(tempHtmlPath2);
        } catch (cleanupError) {
          console.log('Error cleaning up temporary files:', cleanupError.message);
        }

      } catch (error) {
        console.error(`Error converting ${file.originalname}:`, error);
        
        results.push({
          fileName: file.originalname,
          inputFormat: path.extname(file.originalname).substring(1),
          outputFormat: targetFormat,
          status: 'error',
          message: error.message || 'Conversion failed'
        });
      }
    }

    // Create zip file if there are successful conversions
    let zipUrl = null;
    if (convertedFiles.length > 0) {
      try {
        zipUrl = await createZipFile(convertedFiles);
      } catch (error) {
        console.error('Error creating zip file:', error);
      }
    }

    res.json({
      message: 'Batch conversion completed',
      results: results,
      zipUrl: zipUrl,
      totalFiles: req.files.length,
      successfulConversions: convertedFiles.length
    });

  } catch (error) {
    console.error('Batch conversion error:', error);
    res.status(500).json({
      error: 'Batch conversion failed',
      details: error.message
    });
  }
};

// Helper function to create zip file
async function createZipFile(files) {
  const archiver = require('archiver');
  const zipFileName = `batch_conversion_${Date.now()}.zip`;
  const zipPath = path.join(__dirname, '..', 'outputs', zipFileName);
  
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => {
      console.log('Zip file created:', zipPath);
      resolve(`/outputs/${zipFileName}`);
    });

    archive.on('error', (err) => {
      reject(err);
    });

    archive.pipe(output);

    // Add each converted file to the zip
    files.forEach(file => {
      const filePath = path.join(__dirname, '..', file.path.substring(1));
      if (fs.existsSync(filePath)) {
        archive.file(filePath, { name: file.name });
      }
    });

    archive.finalize();
  });
}