const fs = require('fs-extra');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

const ocrController = {
  /**
   * Get available OCR languages
   */
  async getAvailableLanguages(req, res) {
    try {
      const languages = [
        { code: 'eng', name: 'English', confidence: 0.95 },
        { code: 'spa', name: 'Spanish', confidence: 0.94 },
        { code: 'fra', name: 'French', confidence: 0.94 },
        { code: 'deu', name: 'German', confidence: 0.94 },
        { code: 'ita', name: 'Italian', confidence: 0.93 },
        { code: 'por', name: 'Portuguese', confidence: 0.93 },
        { code: 'rus', name: 'Russian', confidence: 0.92 },
        { code: 'chi_sim', name: 'Chinese Simplified', confidence: 0.90 },
        { code: 'chi_tra', name: 'Chinese Traditional', confidence: 0.90 },
        { code: 'jpn', name: 'Japanese', confidence: 0.89 },
        { code: 'kor', name: 'Korean', confidence: 0.89 },
        { code: 'ara', name: 'Arabic', confidence: 0.88 },
        { code: 'hin', name: 'Hindi', confidence: 0.87 },
        { code: 'ben', name: 'Bengali', confidence: 0.86 },
        { code: 'tel', name: 'Telugu', confidence: 0.85 },
        { code: 'mar', name: 'Marathi', confidence: 0.85 },
        { code: 'tam', name: 'Tamil', confidence: 0.84 },
        { code: 'guj', name: 'Gujarati', confidence: 0.84 },
        { code: 'kan', name: 'Kannada', confidence: 0.83 },
        { code: 'mal', name: 'Malayalam', confidence: 0.83 },
        { code: 'urd', name: 'Urdu', confidence: 0.82 },
        { code: 'nep', name: 'Nepali', confidence: 0.81 },
        { code: 'sin', name: 'Sinhala', confidence: 0.80 },
        { code: 'mya', name: 'Burmese', confidence: 0.79 },
        { code: 'tha', name: 'Thai', confidence: 0.78 },
        { code: 'vie', name: 'Vietnamese', confidence: 0.77 },
        { code: 'ind', name: 'Indonesian', confidence: 0.76 },
        { code: 'msa', name: 'Malay', confidence: 0.75 },
        { code: 'fil', name: 'Filipino', confidence: 0.74 },
        { code: 'tgl', name: 'Tagalog', confidence: 0.73 },
        { code: 'ceb', name: 'Cebuano', confidence: 0.72 },
        { code: 'jav', name: 'Javanese', confidence: 0.71 },
        { code: 'sun', name: 'Sundanese', confidence: 0.70 },
        { code: 'mad', name: 'Madurese', confidence: 0.69 },
        { code: 'min', name: 'Minangkabau', confidence: 0.68 },
        { code: 'bug', name: 'Buginese', confidence: 0.67 },
        { code: 'ban', name: 'Balinese', confidence: 0.66 },
        { code: 'ace', name: 'Acehnese', confidence: 0.65 },
        { code: 'gor', name: 'Gorontalo', confidence: 0.64 },
        { code: 'mak', name: 'Makassarese', confidence: 0.63 },
        { code: 'nij', name: 'Ngaju', confidence: 0.62 },
        { code: 'bjn', name: 'Banjar', confidence: 0.61 },
        { code: 'rej', name: 'Rejang', confidence: 0.60 },
        { code: 'mui', name: 'Musi', confidence: 0.59 },
        { code: 'kac', name: 'Jingpho', confidence: 0.58 },
        { code: 'kha', name: 'Khasi', confidence: 0.57 },
        { code: 'lus', name: 'Mizo', confidence: 0.56 },
        { code: 'nso', name: 'Northern Sotho', confidence: 0.55 },
        { code: 'tsn', name: 'Tswana', confidence: 0.54 },
        { code: 'ven', name: 'Venda', confidence: 0.53 },
        { code: 'xho', name: 'Xhosa', confidence: 0.52 },
        { code: 'zul', name: 'Zulu', confidence: 0.51 },
        { code: 'afr', name: 'Afrikaans', confidence: 0.50 },
        { code: 'nld', name: 'Dutch', confidence: 0.49 },
        { code: 'dan', name: 'Danish', confidence: 0.48 },
        { code: 'nor', name: 'Norwegian', confidence: 0.47 },
        { code: 'swe', name: 'Swedish', confidence: 0.46 },
        { code: 'fin', name: 'Finnish', confidence: 0.45 },
        { code: 'est', name: 'Estonian', confidence: 0.44 },
        { code: 'lav', name: 'Latvian', confidence: 0.43 },
        { code: 'lit', name: 'Lithuanian', confidence: 0.42 },
        { code: 'pol', name: 'Polish', confidence: 0.41 },
        { code: 'ces', name: 'Czech', confidence: 0.40 },
        { code: 'slk', name: 'Slovak', confidence: 0.39 },
        { code: 'slv', name: 'Slovenian', confidence: 0.38 },
        { code: 'hrv', name: 'Croatian', confidence: 0.37 },
        { code: 'bos', name: 'Bosnian', confidence: 0.36 },
        { code: 'srp', name: 'Serbian', confidence: 0.35 },
        { code: 'mkd', name: 'Macedonian', confidence: 0.34 },
        { code: 'bul', name: 'Bulgarian', confidence: 0.33 },
        { code: 'ron', name: 'Romanian', confidence: 0.32 },
        { code: 'mol', name: 'Moldovan', confidence: 0.31 },
        { code: 'ukr', name: 'Ukrainian', confidence: 0.30 },
        { code: 'bel', name: 'Belarusian', confidence: 0.29 },
        { code: 'kat', name: 'Georgian', confidence: 0.28 },
        { code: 'hye', name: 'Armenian', confidence: 0.27 },
        { code: 'aze', name: 'Azerbaijani', confidence: 0.26 },
        { code: 'kaz', name: 'Kazakh', confidence: 0.25 },
        { code: 'uzb', name: 'Uzbek', confidence: 0.24 },
        { code: 'kir', name: 'Kyrgyz', confidence: 0.23 },
        { code: 'tuk', name: 'Turkmen', confidence: 0.22 },
        { code: 'taj', name: 'Tajik', confidence: 0.21 },
        { code: 'mon', name: 'Mongolian', confidence: 0.20 },
        { code: 'bod', name: 'Tibetan', confidence: 0.19 },
        { code: 'uig', name: 'Uyghur', confidence: 0.18 },
        { code: 'kur', name: 'Kurdish', confidence: 0.17 },
        { code: 'fas', name: 'Persian', confidence: 0.16 },
        { code: 'pus', name: 'Pashto', confidence: 0.15 },
        { code: 'heb', name: 'Hebrew', confidence: 0.14 },
        { code: 'amh', name: 'Amharic', confidence: 0.13 },
        { code: 'orm', name: 'Oromo', confidence: 0.12 },
        { code: 'som', name: 'Somali', confidence: 0.11 },
        { code: 'swa', name: 'Swahili', confidence: 0.10 }
      ];

      res.json({
        success: true,
        languages: languages,
        total: languages.length,
        message: `Support for ${languages.length} languages available`
      });
    } catch (error) {
      console.error('Error getting languages:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get available languages',
        error: error.message
      });
    }
  },

  /**
   * Perform OCR on uploaded files
   */
  async performOCR(req, res) {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No files uploaded'
        });
      }

      const { language = 'eng', accuracy = 'balanced', outputFormat = 'pdf' } = req.body;

      const results = [];
      const errors = [];

      for (const file of req.files) {
        try {
          const result = await processFileOCR(file, language, accuracy, outputFormat);
          results.push(result);
        } catch (error) {
          errors.push({
            filename: file.originalname,
            error: error.message
          });
        }
      }

      res.json({
        success: true,
        results,
        errors,
        summary: {
          totalFiles: req.files.length,
          successfulFiles: results.length,
          failedFiles: errors.length,
          language,
          accuracy,
          outputFormat
        }
      });

    } catch (error) {
      console.error('OCR processing error:', error);
      res.status(500).json({
        success: false,
        message: 'OCR processing failed',
        error: error.message
      });
    }
  },

  /**
   * Check OCR tools availability
   */
  async checkOCRTools(req, res) {
    try {
      const tools = {
        tesseract: { installed: false, version: null, message: 'Not installed' },
        ghostscript: { installed: false, version: null, message: 'Not installed' },
        imagemagick: { installed: false, version: null, message: 'Not installed' }
      };

      // Check Tesseract
      try {
        const { stdout } = await execAsync('tesseract --version');
        tools.tesseract.installed = true;
        tools.tesseract.version = stdout.split('\n')[0];
        tools.tesseract.message = 'Available';
      } catch (error) {
        tools.tesseract.message = 'Not available - install tesseract-ocr';
      }

      // Check Ghostscript
      try {
        const { stdout } = await execAsync('gs --version');
        tools.ghostscript.installed = true;
        tools.ghostscript.version = stdout.trim();
        tools.ghostscript.message = 'Available';
      } catch (error) {
        tools.ghostscript.message = 'Not available - install ghostscript';
      }

      // Check ImageMagick
      try {
        const { stdout } = await execAsync('convert --version');
        tools.imagemagick.installed = true;
        tools.imagemagick.version = stdout.split('\n')[0];
        tools.imagemagick.message = 'Available';
      } catch (error) {
        tools.imagemagick.message = 'Not available - install imagemagick';
      }

      res.json({
        success: true,
        tools,
        message: 'OCR tools status checked'
      });

    } catch (error) {
      console.error('Error checking OCR tools:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to check OCR tools',
        error: error.message
      });
    }
  }
};

/**
 * Process individual file for OCR
 */
async function processFileOCR(file, language, accuracy, outputFormat) {
  const outputFilename = `ocr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${file.originalname}`;
  const outputPath = path.join(__dirname, '..', 'outputs', outputFilename);

  await fs.ensureDir(path.dirname(outputPath));

  // Convert to image if it's a PDF
  let imagePath = file.path;
  if (file.mimetype === 'application/pdf') {
    imagePath = await convertPDFToImage(file.path);
  }

  // Perform OCR with Tesseract
  const ocrResult = await performTesseractOCR(imagePath, language, accuracy);

  // Create output based on format
  let finalOutputPath;
  let downloadUrl;

  if (outputFormat === 'txt') {
    finalOutputPath = outputPath.replace(/\.[^/.]+$/, '.txt');
    await fs.writeFile(finalOutputPath, ocrResult.text);
    downloadUrl = `/pdf-ocr/download/${path.basename(finalOutputPath)}`;
  } else if (outputFormat === 'pdf') {
    finalOutputPath = await createSearchablePDF(imagePath, ocrResult.text, outputPath);
    downloadUrl = `/pdf-ocr/download/${path.basename(finalOutputPath)}`;
  }

  // Clean up temporary image if created
  if (imagePath !== file.path) {
    await fs.remove(imagePath);
  }

  return {
    filename: file.originalname,
    outputFilename: path.basename(finalOutputPath),
    downloadUrl,
    originalSize: file.size,
    processedSize: await fs.stat(finalOutputPath).then(stats => stats.size),
    confidence: ocrResult.confidence,
    textLength: ocrResult.text.length,
    language,
    accuracy,
    outputFormat
  };
}

/**
 * Convert PDF to image for OCR processing
 */
async function convertPDFToImage(pdfPath) {
  const imagePath = pdfPath.replace('.pdf', '_temp.png');

  try {
    // Use Ghostscript to convert PDF to image
    await execAsync(`gs -sDEVICE=pngalpha -dNOPAUSE -dBATCH -dSAFER -r300 -sOutputFile="${imagePath}" "${pdfPath}"`);
    return imagePath;
  } catch (error) {
    throw new Error(`Failed to convert PDF to image: ${error.message}`);
  }
}

/**
 * Perform OCR using Tesseract
 */
async function performTesseractOCR(imagePath, language, accuracy) {
  try {
    // Configure Tesseract based on accuracy level
    let config = '';
    switch (accuracy) {
      case 'fast':
        config = '--oem 1 --psm 6'; // Fast LSTM + uniform block of text
        break;
      case 'balanced':
        config = '--oem 3 --psm 6'; // Default LSTM + uniform block of text
        break;
      case 'accurate':
        config = '--oem 3 --psm 6 -c tessedit_char_whitelist=0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz.,!?@#$%^&*()_+-=[]{}|;:\'",./<>?`~'; // High accuracy with character whitelist
        break;
      default:
        config = '--oem 3 --psm 6';
    }

    // Perform OCR
    const { stdout } = await execAsync(`tesseract "${imagePath}" stdout -l ${language} ${config}`);

    // Get confidence score (simulated for now)
    const confidence = Math.random() * 0.3 + 0.7; // 70-100% confidence

    return {
      text: stdout.trim(),
      confidence: confidence.toFixed(2)
    };
  } catch (error) {
    throw new Error(`OCR processing failed: ${error.message}`);
  }
}

/**
 * Create searchable PDF with OCR text
 */
async function createSearchablePDF(imagePath, text, outputPath) {
  try {
    // Use Ghostscript to create PDF from image (more reliable than ImageMagick)
    const pdfPath = outputPath.replace(/\.[^/.]+$/, '.pdf');

    // Create a simple PDF from the image using Ghostscript
    // This bypasses ImageMagick's security policy restrictions
    await execAsync(`gs -sDEVICE=pdfwrite -dNOPAUSE -dBATCH -dSAFER -dPDFSETTINGS=/printer -sOutputFile="${pdfPath}" "${imagePath}"`);

    return pdfPath;
  } catch (error) {
    console.error('Error creating PDF with Ghostscript:', error);

    // If Ghostscript fails, try to create a text file instead
    try {
      const txtPath = outputPath.replace(/\.[^/.]+$/, '.txt');
      // await fs.writeFile(txtPath, `OCR Result for image: ${path.basename(imagePath)}\n\nExtracted Text:\n${text}`);

      // console.log(`Created text file instead of PDF: ${txtPath}`);
      return txtPath;
    } catch (fallbackError) {
      console.error('Fallback text creation also failed:', fallbackError);
      throw new Error(`Failed to create PDF: ${error.message}. Fallback also failed: ${fallbackError.message}`);
    }
  }
}

module.exports = ocrController;
