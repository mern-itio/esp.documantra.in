const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fs = require('fs-extra');
const path = require('path');
const multer = require('multer');
const pdfParse = require('pdf-parse');

// File upload setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    fs.ensureDirSync(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + '.pdf');
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  }
});

// Extract text from PDF
const extractTextFromPDF = async (pdfPath) => {
  try {
    const pdfBytes = await fs.readFile(pdfPath);
    const pdfData = await pdfParse(pdfBytes);
    
    // Split text into lines
    const lines = pdfData.text.split('\n').filter(line => line.trim().length > 0);
    
    const textBlocks = [];
    let yPosition = 100;
    
    // Create text blocks for each line
    lines.forEach((line, index) => {
      if (line.trim().length > 0) {
        textBlocks.push({
          id: `text_${index}`,
          pageNumber: 1,
          x: 50,
          y: yPosition,
          width: Math.max(line.length * 8, 200),
          height: 30,
          originalText: line.trim(),
          editedText: line.trim()
        });
        yPosition += 40;
      }
    });
    
    return textBlocks;
  } catch (error) {
    console.error('Error extracting text:', error);
    return [];
  }
};

// Edit PDF by replacing text
const editPDFText = async (originalPdfPath, textEdits) => {
  try {
    const pdfBytes = await fs.readFile(originalPdfPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();
    const page = pages[0]; // Work with first page for now
    const { height } = page.getSize();
    
    // Apply each text edit
    textEdits.forEach(edit => {
      if (edit.editedText && edit.editedText !== edit.originalText) {
        // Convert Y coordinate (PDF coordinates are inverted)
        const y = height - edit.y;
        
        // Draw new text at the position
        page.drawText(edit.editedText, {
          x: edit.x,
          y: y + 20,
          size: 12,
          font: StandardFonts.Helvetica,
          color: rgb(0, 0, 0)
        });
      }
    });
    
    return await pdfDoc.save();
  } catch (error) {
    console.error('Error editing PDF:', error);
    throw error;
  }
};

// Extract text from uploaded PDF
const extractText = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file uploaded' });
    }
    
    const textBlocks = await extractTextFromPDF(req.file.path);
    
    res.json({
      success: true,
      textBlocks: textBlocks,
      originalFileName: req.file.originalname,
      uploadedFileName: req.file.filename
    });
  } catch (error) {
    console.error('Error extracting text:', error);
    res.status(500).json({ error: 'Failed to extract text' });
  }
};

// Edit PDF text
const editText = async (req, res) => {
  try {
    const { textEdits, originalFileName, uploadedFileName } = req.body;
    
    // Find the uploaded PDF file
    const uploadsDir = path.join(__dirname, '../uploads');
    const files = await fs.readdir(uploadsDir);
    
    let originalFile = files.find(file => file === uploadedFileName);
    if (!originalFile) {
      originalFile = files.find(file => file.includes(originalFileName.split('.')[0]));
    }
    
    if (!originalFile) {
      return res.status(404).json({ error: 'PDF file not found' });
    }
    
    const originalPdfPath = path.join(uploadsDir, originalFile);
    
    // Edit the PDF
    const editedPdfBytes = await editPDFText(originalPdfPath, textEdits);
    
    // Save edited PDF
    const editedFileName = `edited_${Date.now()}.pdf`;
    const editedPdfPath = path.join(uploadsDir, editedFileName);
    await fs.writeFile(editedPdfPath, editedPdfBytes);
    
    res.json({
      success: true,
      editedFileName: editedFileName
    });
    
  } catch (error) {
    console.error('Error editing text:', error);
    res.status(500).json({ error: 'Failed to edit PDF' });
  }
};

// Download edited PDF
const downloadEditedPDF = async (req, res) => {
  try {
    const { fileName } = req.params;
    const filePath = path.join(__dirname, '../uploads', fileName);
    
    if (!await fs.pathExists(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
    
    // Clean up after download
    fileStream.on('end', async () => {
      try {
        await fs.remove(filePath);
      } catch (cleanupError) {
        console.error('Error cleaning up file:', cleanupError);
      }
    });
    
  } catch (error) {
    console.error('Error downloading PDF:', error);
    res.status(500).json({ error: 'Failed to download PDF' });
  }
};

module.exports = {
  upload,
  extractText,
  editText,
  downloadEditedPDF
};
