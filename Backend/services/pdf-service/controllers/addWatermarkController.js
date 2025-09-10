const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fs = require('fs-extra');
const path = require('path');
const multer = require('multer');
const sharp = require('sharp');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    fs.ensureDirSync(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and image files are allowed'));
    }
  }
});

// Add text watermark
const addTextWatermark = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file uploaded' });
    }

    const {
      text,
      position = 'center',
      fontSize = 48,
      fontColor = '#FF0000',
      opacity = 0.3,
      rotation = -45,
      startPage = 1,
      endPage = null,
      excludePages = ''
    } = req.body;

    if (!text || text.trim() === '') {
      return res.status(400).json({ error: 'Watermark text is required' });
    }

    const inputPath = req.file.path;
    const outputDir = path.join(__dirname, '../outputs');
    await fs.ensureDir(outputDir);

    const outputFilename = `watermarked-${Date.now()}-${Math.round(Math.random() * 1E9)}.pdf`;
    const outputPath = path.join(outputDir, outputFilename);

    // Read the PDF
    const pdfBytes = await fs.readFile(inputPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();

    // Parse page ranges
    const startPageNum = parseInt(startPage) || 1;
    const endPageNum = endPage ? parseInt(endPage) : pages.length;
    const excludePagesArray = excludePages ? excludePages.split(',').map(p => parseInt(p.trim())).filter(p => !isNaN(p)) : [];

    // Convert hex color to RGB
    const hexToRgb = (hex) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16) / 255,
        g: parseInt(result[2], 16) / 255,
        b: parseInt(result[3], 16) / 255
      } : { r: 1, g: 0, b: 0 };
    };

    const color = hexToRgb(fontColor);

    // Add watermark to specified pages
    for (let i = 0; i < pages.length; i++) {
      const pageNum = i + 1;
      
      // Skip if page is not in range or is excluded
      if (pageNum < startPageNum || pageNum > endPageNum || excludePagesArray.includes(pageNum)) {
        continue;
      }

      const page = pages[i];
      const { width, height } = page.getSize();

      // Calculate position
      let x, y;
      switch (position) {
        case 'top-left':
          x = 50;
          y = height - 50;
          break;
        case 'top-center':
          x = width / 2;
          y = height - 50;
          break;
        case 'top-right':
          x = width - 50;
          y = height - 50;
          break;
        case 'bottom-left':
          x = 50;
          y = 50;
          break;
        case 'bottom-center':
          x = width / 2;
          y = 50;
          break;
        case 'bottom-right':
          x = width - 50;
          y = 50;
          break;
        case 'middle-left':
          x = 50;
          y = height / 2;
          break;
        case 'middle-right':
          x = width - 50;
          y = height / 2;
          break;
        case 'center':
        default:
          x = width / 2;
          y = height / 2;
          break;
      }

      // Add watermark text
      page.drawText(text, {
        x,
        y,
        size: parseInt(fontSize),
        color: rgb(color.r, color.g, color.b),
        opacity: parseFloat(opacity),
        rotate: { angle: parseFloat(rotation), type: 'degrees' }
      });
    }

    // Save the modified PDF
    const modifiedPdfBytes = await pdfDoc.save();
    await fs.writeFile(outputPath, modifiedPdfBytes);

    // Clean up input file
    await fs.remove(inputPath);

    res.json({
      success: true,
      message: 'Watermark added successfully',
      filename: outputFilename,
      downloadUrl: `/outputs/${outputFilename}`,
      fileSize: modifiedPdfBytes.length,
      pagesProcessed: pages.length
    });

  } catch (error) {
    console.error('Error adding text watermark:', error);
    res.status(500).json({ error: 'Failed to add watermark: ' + error.message });
  }
};

// Add image watermark
const addImageWatermark = async (req, res) => {
  try {
    if (!req.files || !req.files.pdf || !req.files.image) {
      return res.status(400).json({ error: 'Both PDF and image files are required' });
    }

    const {
      position = 'center',
      opacity = 0.3,
      rotation = 0,
      scale = 1.0,
      startPage = 1,
      endPage = null,
      excludePages = ''
    } = req.body;

    const pdfFile = req.files.pdf[0];
    const imageFile = req.files.image[0];

    const inputPdfPath = pdfFile.path;
    const inputImagePath = imageFile.path;
    const outputDir = path.join(__dirname, '../outputs');
    await fs.ensureDir(outputDir);

    const outputFilename = `image-watermarked-${Date.now()}-${Math.round(Math.random() * 1E9)}.pdf`;
    const outputPath = path.join(outputDir, outputFilename);

    // Read the PDF
    const pdfBytes = await fs.readFile(inputPdfPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();

    // Process the image
    let imageBytes;
    try {
      // Convert image to PNG if it's not already
      const processedImage = await sharp(inputImagePath)
        .png()
        .toBuffer();
      imageBytes = processedImage;
    } catch (imageError) {
      console.error('Error processing image:', imageError);
      return res.status(400).json({ error: 'Failed to process image file' });
    }

    // Embed the image
    let image;
    try {
      image = await pdfDoc.embedPng(imageBytes);
    } catch (embedError) {
      // Try embedding as JPEG if PNG fails
      try {
        const jpegImage = await sharp(inputImagePath)
          .jpeg()
          .toBuffer();
        image = await pdfDoc.embedJpg(jpegImage);
      } catch (jpegError) {
        return res.status(400).json({ error: 'Failed to embed image. Please use PNG or JPEG format.' });
      }
    }

    // Parse page ranges
    const startPageNum = parseInt(startPage) || 1;
    const endPageNum = endPage ? parseInt(endPage) : pages.length;
    const excludePagesArray = excludePages ? excludePages.split(',').map(p => parseInt(p.trim())).filter(p => !isNaN(p)) : [];

    // Add watermark to specified pages
    for (let i = 0; i < pages.length; i++) {
      const pageNum = i + 1;
      
      // Skip if page is not in range or is excluded
      if (pageNum < startPageNum || pageNum > endPageNum || excludePagesArray.includes(pageNum)) {
        continue;
      }

      const page = pages[i];
      const { width, height } = page.getSize();

      // Calculate position
      let x, y;
      const imageWidth = image.width * parseFloat(scale);
      const imageHeight = image.height * parseFloat(scale);

      switch (position) {
        case 'top-left':
          x = 50;
          y = height - imageHeight - 50;
          break;
        case 'top-center':
          x = (width - imageWidth) / 2;
          y = height - imageHeight - 50;
          break;
        case 'top-right':
          x = width - imageWidth - 50;
          y = height - imageHeight - 50;
          break;
        case 'bottom-left':
          x = 50;
          y = 50;
          break;
        case 'bottom-center':
          x = (width - imageWidth) / 2;
          y = 50;
          break;
        case 'bottom-right':
          x = width - imageWidth - 50;
          y = 50;
          break;
        case 'middle-left':
          x = 50;
          y = (height - imageHeight) / 2;
          break;
        case 'middle-right':
          x = width - imageWidth - 50;
          y = (height - imageHeight) / 2;
          break;
        case 'center':
        default:
          x = (width - imageWidth) / 2;
          y = (height - imageHeight) / 2;
          break;
      }

      // Add watermark image
      page.drawImage(image, {
        x,
        y,
        width: imageWidth,
        height: imageHeight,
        opacity: parseFloat(opacity),
        rotate: { angle: parseFloat(rotation), type: 'degrees' }
      });
    }

    // Save the modified PDF
    const modifiedPdfBytes = await pdfDoc.save();
    await fs.writeFile(outputPath, modifiedPdfBytes);

    // Clean up input files
    await fs.remove(inputPdfPath);
    await fs.remove(inputImagePath);

    res.json({
      success: true,
      message: 'Image watermark added successfully',
      filename: outputFilename,
      downloadUrl: `/outputs/${outputFilename}`,
      fileSize: modifiedPdfBytes.length,
      pagesProcessed: pages.length
    });

  } catch (error) {
    console.error('Error adding image watermark:', error);
    res.status(500).json({ error: 'Failed to add image watermark: ' + error.message });
  }
};

// Preview watermark (returns all pages with watermark)
const previewWatermark = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file uploaded' });
    }

    const {
      text,
      position = 'center',
      fontSize = 48,
      fontColor = '#FF0000',
      opacity = 0.3,
      rotation = -45,
      startPage = 1,
      endPage = null,
      excludePages = ''
    } = req.body;

    if (!text || text.trim() === '') {
      return res.status(400).json({ error: 'Watermark text is required' });
    }

    const inputPath = req.file.path;
    const outputDir = path.join(__dirname, '../outputs');
    await fs.ensureDir(outputDir);

    const outputFilename = `preview-${Date.now()}-${Math.round(Math.random() * 1E9)}.pdf`;
    const outputPath = path.join(outputDir, outputFilename);

    // Read the PDF
    const pdfBytes = await fs.readFile(inputPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();

    // Parse page ranges (same logic as main watermark function)
    const startPageNum = parseInt(startPage) || 1;
    const endPageNum = endPage ? parseInt(endPage) : pages.length;
    const excludePagesArray = excludePages ? excludePages.split(',').map(p => parseInt(p.trim())).filter(p => !isNaN(p)) : [];

    // Convert hex color to RGB
    const hexToRgb = (hex) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16) / 255,
        g: parseInt(result[2], 16) / 255,
        b: parseInt(result[3], 16) / 255
      } : { r: 1, g: 0, b: 0 };
    };

    const color = hexToRgb(fontColor);

    // Add watermark to all specified pages (same logic as main watermark function)
    for (let i = 0; i < pages.length; i++) {
      const pageNum = i + 1;
      
      // Skip if page is not in range or is excluded
      if (pageNum < startPageNum || pageNum > endPageNum || excludePagesArray.includes(pageNum)) {
        continue;
      }

      const page = pages[i];
      const { width, height } = page.getSize();

      // Calculate position
      let x, y;
      switch (position) {
        case 'top-left':
          x = 50;
          y = height - 50;
          break;
        case 'top-center':
          x = width / 2;
          y = height - 50;
          break;
        case 'top-right':
          x = width - 50;
          y = height - 50;
          break;
        case 'bottom-left':
          x = 50;
          y = 50;
          break;
        case 'bottom-center':
          x = width / 2;
          y = 50;
          break;
        case 'bottom-right':
          x = width - 50;
          y = 50;
          break;
        case 'middle-left':
          x = 50;
          y = height / 2;
          break;
        case 'middle-right':
          x = width - 50;
          y = height / 2;
          break;
        case 'center':
        default:
          x = width / 2;
          y = height / 2;
          break;
      }

      // Add watermark text
      page.drawText(text, {
        x,
        y,
        size: parseInt(fontSize),
        color: rgb(color.r, color.g, color.b),
        opacity: parseFloat(opacity),
        rotate: { angle: parseFloat(rotation), type: 'degrees' }
      });
    }

    // Save the preview PDF
    const modifiedPdfBytes = await pdfDoc.save();
    await fs.writeFile(outputPath, modifiedPdfBytes);

    // Clean up input file
    await fs.remove(inputPath);

    res.json({
      success: true,
      message: 'Preview generated successfully',
      filename: outputFilename,
      previewUrl: `/outputs/${outputFilename}`,
      fileSize: modifiedPdfBytes.length,
      pagesProcessed: pages.length
    });

  } catch (error) {
    console.error('Error generating preview:', error);
    res.status(500).json({ error: 'Failed to generate preview: ' + error.message });
  }
};

module.exports = {
  addTextWatermark,
  addImageWatermark,
  previewWatermark,
  upload
};
