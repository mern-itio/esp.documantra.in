const fs = require('fs-extra');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const XLSX = require('xlsx');
const TableExtractionErrorHandler = require('./errorHandler');

const extractTablesController = {
  async extractTables(req, res) {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No files uploaded'
        });
      }

      const {
        detectionMethod = 'auto',
        outputFormat = 'xlsx',
        preserveFormatting = true,
        extractHeaders = true,
        mergeTables = false,
        pageRange = null,
        language = 'eng'
      } = req.body;

      const results = [];
      const errors = [];

      for (const file of req.files) {
        try {
          const result = await processFileExtractTables(
            file,
            detectionMethod,
            outputFormat,
            preserveFormatting,
            extractHeaders,
            mergeTables,
            pageRange,
            language
          );
          results.push(result);
        } catch (error) {
          console.error(`Error processing file ${file.originalname}:`, error);
          errors.push({
            filename: file.originalname,
            error: error.message
          });
        }
      }

      const summary = {
        totalFiles: req.files.length,
        successfulFiles: results.length,
        failedFiles: errors.length,
        detectionMethod,
        outputFormat,
        preserveFormatting,
        extractHeaders,
        mergeTables
      };

      res.json({
        success: true,
        results,
        errors,
        summary
      });

    } catch (error) {
      console.error('Error in extractTables:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error during table extraction'
      });
    }
  },

  async checkTools(req, res) {
    try {
      const tools = {
        tesseract: { installed: false, version: null, message: '' },
        ghostscript: { installed: false, version: null, message: '' },
        pdftk: { installed: false, version: null, message: '' },
        python: { installed: false, version: null, message: '' },
        pythonScript: { available: false, path: '', message: '' }
      };

      // Check Tesseract
      try {
        const { stdout } = await execAsync('tesseract --version');
        tools.tesseract.installed = true;
        tools.tesseract.version = stdout.split('\n')[0];
        tools.tesseract.message = 'Tesseract OCR is available for table detection';
      } catch (error) {
        tools.tesseract.message = 'Tesseract OCR not found. Install for better table detection.';
      }

      // Check Ghostscript
      try {
        const { stdout } = await execAsync('gs --version');
        tools.ghostscript.installed = true;
        tools.ghostscript.version = stdout.trim();
        tools.ghostscript.message = 'Ghostscript is available for PDF processing';
      } catch (error) {
        tools.ghostscript.message = 'Ghostscript not found. Install for PDF to image conversion.';
      }

      // Check PDFtk
      try {
        const { stdout } = await execAsync('pdftk --version');
        tools.pdftk.installed = true;
        tools.pdftk.version = stdout.split('\n')[0];
        tools.pdftk.message = 'PDFtk is available for PDF manipulation';
      } catch (error) {
        tools.pdftk.message = 'PDFtk not found. Install for advanced PDF operations.';
      }

      // Check Python
      try {
        const { stdout } = await execAsync('python3 --version');
        tools.python.installed = true;
        tools.python.version = stdout.trim();
        tools.python.message = 'Python 3 is available for advanced table extraction';
      } catch (error) {
        try {
          const { stdout } = await execAsync('python --version');
          tools.python.installed = true;
          tools.python.version = stdout.trim();
          tools.python.message = 'Python is available for advanced table extraction';
        } catch (error2) {
          tools.python.message = 'Python not found. Install Python 3.7+ for better table extraction.';
        }
      }

      // Check Python script
      const scriptPath = path.join(__dirname, '../scripts/extract_tables_pdfplumber.py');
      try {
        const exists = await fs.pathExists(scriptPath);
        tools.pythonScript.available = exists;
        tools.pythonScript.path = scriptPath;
        tools.pythonScript.message = exists ? 'Python table extraction script is available' : 'Python table extraction script not found';
      } catch (error) {
        tools.pythonScript.message = 'Error checking Python script availability';
      }

      res.json(tools);
    } catch (error) {
      console.error('Error checking tools:', error);
      res.status(500).json({
        success: false,
        error: 'Error checking tool availability'
      });
    }
  },

  async diagnoseErrors(req, res) {
    try {
      // console.log('Running diagnostic...');
      
      // Run Python diagnostic script
      const diagnosticScript = path.join(__dirname, '../scripts/diagnose_errors.py');
      
      if (!await fs.pathExists(diagnosticScript)) {
        return res.status(404).json({
          success: false,
          error: 'Diagnostic script not found'
        });
      }

      const { stdout, stderr } = await execAsync(`python3 "${diagnosticScript}"`);
      
      res.json({
        success: true,
        diagnostic: stdout,
        warnings: stderr
      });
      
    } catch (error) {
      console.error('Diagnostic failed:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        details: error.stack
      });
    }
  }
};

async function processFileExtractTables(
  file,
  detectionMethod,
  outputFormat,
  preserveFormatting,
  extractHeaders,
  mergeTables,
  pageRange,
  language
) {
  const startTime = Date.now();
  const timestamp = Date.now();
  const randomSuffix = Math.round(Math.random() * 1E9);
  const outputDir = path.join(__dirname, '../outputs');
  await fs.ensureDir(outputDir);

  try {
    // Check if Python script exists
    const pythonScript = path.join(__dirname, '../scripts/extract_tables_pdfplumber.py');
    
    if (!await fs.pathExists(pythonScript)) {
      console.warn('Python script not found, falling back to OCR method');
      throw new Error('Python script not found');
    }

    // Check if Python is available
    let pythonCmd = 'python3';
    try {
      await execAsync('python3 --version');
    } catch (error) {
      try {
        await execAsync('python --version');
        pythonCmd = 'python';
      } catch (error2) {
        throw new Error('Python not found. Please install Python 3.7+');
      }
    }

    // Build Python command with proper escaping
    const args = [
      pythonScript,
      `"${file.path}"`,
      '--output-dir', `"${outputDir}"`,
      '--detection-method', detectionMethod,
      '--output-format', outputFormat,
      '--json'
    ];

    if (preserveFormatting) {
      args.push('--preserve-formatting');
    }

    if (extractHeaders) {
      args.push('--extract-headers');
    }

    if (mergeTables) {
      args.push('--merge-tables');
    }

    if (pageRange) {
      args.push('--page-range', pageRange);
    }

    if (language !== 'eng') {
      args.push('--language', language);
    }

    const fullCommand = `${pythonCmd} ${args.join(' ')}`;
    // console.log('Running Python table extraction:', fullCommand);
    
    // Execute with timeout and proper error handling
    const { stdout, stderr } = await execAsync(fullCommand, {
      timeout: 300000, // 5 minutes timeout
      maxBuffer: 10 * 1024 * 1024 // 10MB buffer
    });
    
    // Log warnings but don't fail on them
    if (stderr && !stderr.includes('INFO') && !stderr.includes('WARNING')) {
      console.warn('Python script stderr:', stderr);
    }

    // Validate stdout
    if (!stdout || stdout.trim() === '') {
      throw new Error('Python script returned empty output');
    }

    let result;
    try {
      result = JSON.parse(stdout);
    } catch (parseError) {
      console.error('Failed to parse Python script output:', stdout);
      throw new Error('Invalid JSON output from Python script');
    }
    
    if (!result.success) {
      throw new Error(result.error || 'Python script failed');
    }

    // Validate output file exists
    if (!result.output_file || !await fs.pathExists(result.output_file)) {
      throw new Error('Python script did not create output file');
    }

    const processingTime = Date.now() - startTime;

    return {
      filename: file.originalname,
      outputFilename: path.basename(result.output_file),
      downloadUrl: `/pdf-extract-tables/download/${path.basename(result.output_file)}`,
      originalSize: file.size,
      processedSize: await fs.stat(result.output_file).then(stats => stats.size).catch(() => 0),
      tablesDetected: result.tables_found || 0,
      totalRows: result.tables ? result.tables.reduce((sum, table) => sum + (table.rows ? table.rows.length : 0), 0) : 0,
      totalColumns: result.tables ? result.tables.reduce((sum, table) => Math.max(sum, table.columns || 0), 0) : 0,
      pagesProcessed: result.stats?.total_pages || 1,
      detectionMethod,
      outputFormat,
      preserveFormatting,
      extractHeaders,
      mergeTables,
      processingTime,
      language,
      confidence: result.tables && result.tables.length > 0 ? 
        result.tables.reduce((sum, table) => sum + (table.confidence || 0), 0) / result.tables.length : 0
    };

  } catch (pythonError) {
    // Get detailed error information
    const detailedErrorInfo = await TableExtractionErrorHandler.getDetailedErrorInfo(
      pythonError, 
      { 
        file: file.originalname,
        detectionMethod,
        outputFormat,
        preserveFormatting,
        extractHeaders,
        mergeTables,
        pageRange,
        language
      }
    );
    
    // Log detailed error
    TableExtractionErrorHandler.logError(pythonError, detailedErrorInfo);
    
    console.error('Python script failed, falling back to OCR method:', pythonError.message);
    
    // Fallback to original OCR-based method
    return await processFileExtractTablesOCR(
      file,
      detectionMethod,
      outputFormat,
      preserveFormatting,
      extractHeaders,
      mergeTables,
      pageRange,
      language
    );
  }
}

async function processFileExtractTablesOCR(
  file,
  detectionMethod,
  outputFormat,
  preserveFormatting,
  extractHeaders,
  mergeTables,
  pageRange,
  language
) {
  const startTime = Date.now();
  const timestamp = Date.now();
  const randomSuffix = Math.round(Math.random() * 1E9);
  const outputDir = path.join(__dirname, '../outputs');
  await fs.ensureDir(outputDir);

  // Convert PDF to images for table detection (all pages)
  const imagePaths = await convertPDFToImages(file.path, pageRange);
  
  // Perform table detection and extraction on all pages
  const allTables = [];
  for (const { path: imagePath, pageNum } of imagePaths) {
    const pageTables = await detectAndExtractTables(
      imagePath,
      detectionMethod,
      language,
      preserveFormatting,
      extractHeaders,
      pageNum
    );
    
    // Add page information to each table
    pageTables.forEach(table => {
      table.pageNumber = pageNum;
      table.name = `Page ${pageNum} - ${table.name}`;
    });
    
    allTables.push(...pageTables);
  }

  // Generate output file
  const outputFilename = `tables_${path.parse(file.originalname).name}_${timestamp}_${randomSuffix}`;
  const outputPath = await generateOutputFile(
    allTables,
    outputFormat,
    outputDir,
    outputFilename,
    mergeTables
  );

  // Cleanup temporary files
  for (const { path: imagePath } of imagePaths) {
    await fs.remove(imagePath);
  }

  const processingTime = Date.now() - startTime;

  return {
    filename: file.originalname,
    outputFilename: path.basename(outputPath),
    downloadUrl: `/pdf-extract-tables/download/${path.basename(outputPath)}`,
    originalSize: file.size,
    processedSize: await fs.stat(outputPath).then(stats => stats.size),
    tablesDetected: allTables.length,
    totalRows: allTables.reduce((sum, table) => sum + table.rows.length, 0),
    totalColumns: allTables.reduce((sum, table) => Math.max(sum, table.columns), 0),
    pagesProcessed: imagePaths.length,
    detectionMethod,
    outputFormat,
    preserveFormatting,
    extractHeaders,
    mergeTables,
    processingTime,
    language
  };
}

async function convertPDFToImages(pdfPath, pageRange) {
  const timestamp = Date.now();
  const randomSuffix = Math.round(Math.random() * 1E9);
  const outputDir = path.join(__dirname, '../outputs');
  const imagePaths = [];

  // First, get the total number of pages in the PDF
  let totalPages = 1;
  try {
    // Try multiple methods to get page count
    const methods = [
      `gs -q -dNODISPLAY -c "(${pdfPath}) (r) file runpdfbegin pdfpagecount = quit"`,
      `pdfinfo "${pdfPath}" | grep Pages | awk '{print $2}'`,
      `qpdf --show-npages "${pdfPath}"`
    ];
    
    for (const method of methods) {
      try {
        const { stdout } = await execAsync(method);
        const pageCount = parseInt(stdout.trim());
        if (pageCount && pageCount > 0) {
          totalPages = pageCount;
          break;
        }
      } catch (methodError) {
        // console.log(`Method failed: ${method.split(' ')[0]}`);
        continue;
      }
    }
    
    if (totalPages === 1) {
      // console.log('Could not determine page count, defaulting to 1 page');
    }
  } catch (error) {
    console.log('Could not determine page count, defaulting to 1 page');
  }

  // Determine which pages to process
  let pagesToProcess = [];
  if (pageRange) {
    pagesToProcess = parsePageRange(pageRange);
    // Filter out pages that don't exist
    pagesToProcess = pagesToProcess.filter(page => page >= 1 && page <= totalPages);
  } else {
    // Process all pages if no range specified
    pagesToProcess = Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  // Convert each page to a separate image
  for (const pageNum of pagesToProcess) {
    const imagePath = path.join(outputDir, `temp_${timestamp}_${randomSuffix}_page_${pageNum}.png`);
    
    // Enhanced Ghostscript command for better OCR quality
    const gsCommand = `gs -sDEVICE=pngalpha -dNOPAUSE -dBATCH -dSAFER -dPDFSETTINGS=/printer -r600 -dTextAlphaBits=4 -dGraphicsAlphaBits=4 -dFirstPage=${pageNum} -dLastPage=${pageNum} -sOutputFile="${imagePath}" "${pdfPath}"`;

    try {
      await execAsync(gsCommand);
      imagePaths.push({ path: imagePath, pageNum });
    } catch (error) {
      // Fallback to standard settings
      const fallbackCommand = `gs -sDEVICE=pngalpha -dNOPAUSE -dBATCH -dSAFER -dPDFSETTINGS=/printer -r300 -dFirstPage=${pageNum} -dLastPage=${pageNum} -sOutputFile="${imagePath}" "${pdfPath}"`;
      try {
        await execAsync(fallbackCommand);
        imagePaths.push({ path: imagePath, pageNum });
      } catch (fallbackError) {
        console.error(`Failed to convert page ${pageNum}:`, fallbackError.message);
        // Continue with other pages
      }
    }
  }

  return imagePaths;
}

async function detectAndExtractTables(
  imagePath,
  detectionMethod,
  language,
  preserveFormatting,
  extractHeaders,
  pageNum = 1
) {
  const tables = [];

  try {
    // Enhanced OCR configuration for better table detection
    let tesseractConfig = `--oem 3 --psm 6 -l ${language}`;
    
    if (detectionMethod === 'auto') {
      tesseractConfig += ` --tessdata-dir ${path.join(__dirname, '..')}`;
    }

    // Try multiple OCR approaches for better results
    const ocrAttempts = [
      { config: `--oem 3 --psm 6 -l ${language}`, name: 'PSM 6 (uniform block)' },
      { config: `--oem 3 --psm 3 -l ${language}`, name: 'PSM 3 (fully automatic)' },
      { config: `--oem 3 --psm 4 -l ${language}`, name: 'PSM 4 (single column)' },
      { config: `--oem 3 --psm 11 -l ${language}`, name: 'PSM 11 (sparse text with OSD)' }
    ];
    
    let bestResult = { tables: [], lines: [], quality: 0 };
    
    for (const attempt of ocrAttempts) {
      try {
        const { stdout: textOutput } = await execAsync(`tesseract "${imagePath}" stdout ${attempt.config}`);
        
        // Parse the output to detect table structures
        const lines = textOutput.split('\n').filter(line => line.trim());
        
        if (lines.length > 0) {
          
          const detectedTables = parseTextForTables(lines, preserveFormatting, extractHeaders);
          
          // Calculate quality score based on table count and line count
          const quality = detectedTables.length * 10 + lines.length;
          
          if (quality > bestResult.quality) {
            bestResult = { tables: detectedTables, lines, quality };
          }
        }
      } catch (attemptError) {
        console.log(`OCR attempt failed with ${attempt.name}:`, attemptError.message);
      }
    }
    
    tables.push(...bestResult.tables);

    // If no tables detected or poor quality, try alternative approaches
    if (bestResult.tables.length === 0 || hasPoorQualityText(bestResult.lines)) {
      
      // Try different PSM modes for better layout analysis
      const alternativeConfigs = [
        `--oem 3 --psm 8 -l ${language}`, // Single word
        `--oem 3 --psm 13 -l ${language}`, // Raw line
        `--oem 3 --psm 12 -l ${language}`  // Sparse text without OSD
      ];
      
      for (const altConfig of alternativeConfigs) {
        try {
          const { stdout: altTextOutput } = await execAsync(`tesseract "${imagePath}" stdout ${altConfig}`);
          const altLines = altTextOutput.split('\n').filter(line => line.trim());
          
          if (hasBetterQualityText(altLines, bestResult.lines)) {
            const altTables = parseTextForTables(altLines, preserveFormatting, extractHeaders);
            
            if (altTables.length > 0) {
              // Replace the tables with better quality ones
              tables.length = 0;
              tables.push(...altTables);
              break;
            }
          }
        } catch (altError) {
          console.log(`Alternative detection failed with ${altConfig}:`, altError.message);
        }
      }
    }

      // If still no tables, try with different image preprocessing
  if (tables.length === 0) {
    const preprocessedTables = await tryImagePreprocessing(imagePath, language, preserveFormatting, extractHeaders);
    if (preprocessedTables.length > 0) {
      tables.push(...preprocessedTables);
    }
  }
  
  // Final fallback: try to reconstruct table from partial data
  if (tables.length === 0) {
    const reconstructedTables = await reconstructTableFromPartialData(lines, preserveFormatting, extractHeaders);
    if (reconstructedTables.length > 0) {
      tables.push(...reconstructedTables);
    }
  }

  } catch (error) {
    console.error('Error in table detection:', error);
    
    // Fallback: create a simple table from the extracted text
    try {
      const { stdout: fallbackText } = await execAsync(`tesseract "${imagePath}" stdout -l ${language}`);
      const fallbackTable = createFallbackTable(fallbackText, preserveFormatting, extractHeaders);
      tables.push(fallbackTable);
    } catch (fallbackError) {
      console.error('Fallback table creation failed:', fallbackError);
      // Create a more informative fallback table
      tables.push({
        name: 'Extracted Data',
        rows: [
          ['No table structure detected'],
          ['The PDF may not contain tables or table detection failed.'],
          [''],
          ['Possible reasons:'],
          ['- PDF contains only text without table formatting'],
          ['- Table detection algorithm needs adjustment'],
          ['- Image quality is too low for OCR'],
          [''],
          ['Try:'],
          ['- Different detection method (manual or all content)'],
          ['- Higher image quality settings'],
          ['- Different language selection']
        ],
        columns: 1,
        confidence: 0.3
      });
    }
  }

  return tables;
}

async function reconstructTableFromPartialData(lines, preserveFormatting, extractHeaders) {
  const tables = [];
  
  try {
    // console.log('Attempting table reconstruction from partial data...');
    
    // Look for lines that could be table data based on structure
    const tableData = [];
    
    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      
      // Skip title lines
      if (lowerLine.includes('table') || lowerLine.includes('data')) {
        continue;
      }
      
      // Check if line has table-like structure (multiple words, some spacing)
      const words = line.split(/\s+/);
      if (words.length >= 3 && line.length > 15) {
        tableData.push(line);
      }
    }
    
    if (tableData.length > 0) {
      
      // Try to reconstruct the table structure
      const reconstructedTable = await reconstructTableStructure(tableData, [], preserveFormatting, extractHeaders);
      if (reconstructedTable) {
        tables.push(reconstructedTable);
      }
    }
    
  } catch (error) {
    console.log('Table reconstruction failed:', error.message);
  }
  
  return tables;
}

async function reconstructTableStructure(dataRows, headers, preserveFormatting, extractHeaders) {
  try {
    // Parse the data rows
    const parsedRows = [];
    for (const row of dataRows) {
      const cells = parseTableRow(row, preserveFormatting);
      if (cells.length >= 2) { // Minimum 2 columns
        parsedRows.push(cells);
      }
    }
    
    if (parsedRows.length === 0) return null;
    
    // Find the maximum number of columns
    const maxColumns = Math.max(...parsedRows.map(row => row.length));
    
    // Create generic headers if none provided
    const genericHeaders = Array.from({ length: maxColumns }, (_, index) => `Column ${index + 1}`);
    
    // Normalize all rows to have the same number of columns
    const normalizedRows = parsedRows.map(row => {
      const normalized = [...row];
      while (normalized.length < maxColumns) {
        normalized.push('');
      }
      return normalized;
    });
    
    // Create the reconstructed table
    const table = {
      name: 'Reconstructed Table',
      rows: extractHeaders ? [genericHeaders, ...normalizedRows] : normalizedRows,
      columns: maxColumns,
      confidence: 0.6
    };
    
     return table;
    
  } catch (error) {
    console.log('Table structure reconstruction failed:', error.message);
    return null;
  }
}

function hasPoorQualityText(lines) {
  if (lines.length === 0) return true;
  
  // Check for common OCR quality issues
  let garbledLines = 0;
  let shortLines = 0;
  
  for (const line of lines) {
    // Check for garbled text (lots of single characters or random spacing)
    const words = line.split(/\s+/);
    const hasGarbledText = words.some(word => word.length === 1 && /[a-zA-Z]/.test(word)) && 
                           words.filter(word => word.length === 1).length > words.length * 0.3;
    
    if (hasGarbledText) garbledLines++;
    
    // Check for very short lines that might be incomplete
    if (line.length < 10) shortLines++;
  }
  
  const garbledRatio = garbledLines / lines.length;
  const shortRatio = shortLines / lines.length;
  
  return garbledRatio > 0.3 || shortRatio > 0.5;
}

function hasBetterQualityText(newLines, oldLines) {
  if (newLines.length === 0) return false;
  
  // Simple heuristic: prefer longer, more complete lines
  const newAvgLength = newLines.reduce((sum, line) => sum + line.length, 0) / newLines.length;
  const oldAvgLength = oldLines.reduce((sum, line) => sum + line.length, 0) / oldLines.length;
  
  // Also check for more complete words
  const newWordCount = newLines.reduce((sum, line) => sum + line.split(/\s+/).length, 0);
  const oldWordCount = oldLines.reduce((sum, line) => sum + line.split(/\s+/).length, 0);
  
  return newAvgLength > oldAvgLength && newWordCount > oldWordCount;
}

async function tryImagePreprocessing(imagePath, language, preserveFormatting, extractHeaders) {
  const tables = [];
  
  try {
    // Try with different image preprocessing options
    const preprocessingCommands = [
      // Increase contrast and brightness
      `convert "${imagePath}" -contrast-stretch 0 -brightness-contrast 0x30 "${imagePath}_enhanced.png"`,
      // Sharpen the image
      `convert "${imagePath}" -unsharp 0x1+1+0 "${imagePath}_sharpened.png"`,
      // Convert to grayscale and enhance
      `convert "${imagePath}" -colorspace Gray -contrast-stretch 0 "${imagePath}_gray.png"`
    ];
    
    for (const command of preprocessingCommands) {
      try {
        await execAsync(command);
        const processedImagePath = command.split('"').pop().replace('"', '');
        
        // Try OCR on processed image
        const { stdout: processedText } = await execAsync(`tesseract "${processedImagePath}" stdout --oem 3 --psm 6 -l ${language}`);
        const processedLines = processedText.split('\n').filter(line => line.trim());
        
        if (hasBetterQualityText(processedLines, [])) {
          const processedTables = parseTextForTables(processedLines, preserveFormatting, extractHeaders);
          if (processedTables.length > 0) {
            tables.push(...processedTables);
            break;
          }
        }
        
        // Clean up processed image
        await fs.remove(processedImagePath);
        
      } catch (preprocessError) {
        console.log(`Image preprocessing failed:`, preprocessError.message);
      }
    }
    
  } catch (error) {
    console.log('Image preprocessing not available:', error.message);
  }
  
  return tables;
}

function parseTextForTables(lines, preserveFormatting, extractHeaders) {
  const tables = [];
  let currentTable = [];
  let tableStarted = false;
  let tableHeaders = [];
  let inTableSection = false;
  let tableCount = 0;

  // First pass: identify potential table sections
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line.length === 0) continue;
    
    // Check if this line might be a table header or title
    const isTableTitle = isTableTitleLine(line);
    const isTableHeader = isTableHeaderLine(line);
    const isTableData = isTableDataLine(line);
   // Start table if we find a header OR if we find data and no table is started yet
    // But don't start a new table if we just found a title
    if ((isTableHeader || isTableData) && !tableStarted && !isTableTitle) {
      tableStarted = true;
      currentTable = [];
      tableHeaders = [];
      inTableSection = false;
    }
    
    if (isTableHeader && tableStarted && !inTableSection) {
      // This might be a header row
      tableHeaders = parseTableRow(line, preserveFormatting);
      inTableSection = true;
      continue;
    }
    
    if (isTableData && tableStarted) {
      // This is table data
      const cells = parseTableRow(line, preserveFormatting);
      currentTable.push(cells);
      inTableSection = true; // Mark that we're in table section
      continue;
    }
    
    // If we have a table started but no clear headers, and we find data,
    // treat the first data row as potential headers
    if (tableStarted && !inTableSection && isTableData && tableHeaders.length === 0) {
      // This might be the header row
      tableHeaders = parseTableRow(line, preserveFormatting);
      inTableSection = true;
      continue;
    }
    
    if (tableStarted && !isTableData && !isTableHeader) {
      // Check if this might be a continuation or if we should end the table
      if (isLikelyTableContinuation(line, currentTable, tableHeaders)) {
        const cells = parseTableRow(line, preserveFormatting);
        currentTable.push(cells);
      } else {
        // Check if this might be the start of a new table
        const isNewTableStart = isTableTitleLine(line) || isTableHeaderLine(line);
        
        if (isNewTableStart && currentTable.length > 0) {
          // Only end current table if we found a new table title (not just headers)
          if (isTableTitleLine(line)) {
            const table = createTableFromRowsAndHeaders(tableHeaders, currentTable, extractHeaders);
            if (table.rows.length > 0) {
              tableCount++;
              table.name = `Table ${tableCount}`;
              tables.push(table);
            }
            
            // Start new table
            tableStarted = true;
            currentTable = [];
            tableHeaders = [];
            inTableSection = false;
          } else if (isTableHeaderLine(line)) {
            tableHeaders = parseTableRow(line, preserveFormatting);
            inTableSection = true;
          }
        } else if (isNewTableStart && currentTable.length === 0) {
          // Start a new table only if it's a title, not just headers
          if (isTableTitleLine(line)) {
            tableStarted = true;
            currentTable = [];
            tableHeaders = [];
            inTableSection = false;
          }
        } else {
          // Check for clear table separation patterns
          const isClearTableEnd = isClearTableEndMarker(line);
          
          if (isClearTableEnd && currentTable.length > 0) {
            // End current table
            const table = createTableFromRowsAndHeaders(tableHeaders, currentTable, extractHeaders);
            if (table.rows.length > 0) {
              tableCount++;
              table.name = `Table ${tableCount}`;
              tables.push(table);
            }
            tableStarted = false;
            currentTable = [];
            tableHeaders = [];
            inTableSection = false;
          } else {
            // Only end the table if we have a significant gap or clear end marker
            const isVeryDifferent = !isLikelyTableRelated(line);
            
            // Don't end table immediately on non-table content, wait for more evidence
            if (isVeryDifferent && currentTable.length > 0 && !isLikelyTableRelated(line)) {
              // Check if the next few lines are also non-table content
              let consecutiveNonTableLines = 1;
              let hasMoreDataAhead = false;
              
              for (let j = i + 1; j < Math.min(i + 2, lines.length); j++) {
                if (!isTableDataLine(lines[j]) && !isTableHeaderLine(lines[j]) && !isTableTitleLine(lines[j])) {
                  consecutiveNonTableLines++;
                } else {
                  hasMoreDataAhead = true;
                  break;
                }
              }
              
              // Only end table if we have consecutive non-table lines AND no more data ahead
              if (consecutiveNonTableLines >= 3 && !hasMoreDataAhead && currentTable.length >= 3) {
                // End of table section
                const table = createTableFromRowsAndHeaders(tableHeaders, currentTable, extractHeaders);
                if (table.rows.length > 0) {
                  tableCount++;
                  table.name = `Table ${tableCount}`;
                  tables.push(table);
                }
                tableStarted = false;
                currentTable = [];
                tableHeaders = [];
                inTableSection = false;
              }
            }
          }
        }
      }
    }
  }

  // Add the last table if exists
  if (currentTable.length > 0 || tableHeaders.length > 0) {
    const table = createTableFromRowsAndHeaders(tableHeaders, currentTable, extractHeaders);
    if (table.rows.length > 0) {
      tableCount++;
      table.name = `Table ${tableCount}`;
      tables.push(table);
    }
  }
  
  // If we have multiple tables with the same structure, merge them
  if (tables.length > 1) {
    const mergedTables = [];
    const processedTables = new Set();
    
    for (let i = 0; i < tables.length; i++) {
      if (processedTables.has(i)) continue;
      
      const currentTable = tables[i];
      const similarTables = [currentTable];
      processedTables.add(i);
      
      // Find tables with similar structure (same number of columns)
      for (let j = i + 1; j < tables.length; j++) {
        if (processedTables.has(j)) continue;
        
        const otherTable = tables[j];
        // Merge tables with same column count and reasonable data
        if (otherTable.columns === currentTable.columns && 
            otherTable.rows.length > 0 && 
            currentTable.rows.length > 0) {
          similarTables.push(otherTable);
          processedTables.add(j);
        }
      }
      
      // Merge similar tables
      if (similarTables.length > 1) {
        const mergedTable = {
          name: `Table ${mergedTables.length + 1}`,
          rows: [],
          columns: currentTable.columns,
          confidence: 0.9
        };
        
        // Add headers from first table (if it has headers)
        if (similarTables[0].rows.length > 0) {
          mergedTable.rows.push(similarTables[0].rows[0]);
        }
        
        // Add data rows from all tables
        for (const table of similarTables) {
          const startIndex = similarTables[0].rows.length > 0 ? 1 : 0; // Skip header if already added
          for (let k = startIndex; k < table.rows.length; k++) {
            mergedTable.rows.push(table.rows[k]);
          }
        }
        
        mergedTables.push(mergedTable);
      } else {
        mergedTables.push(currentTable);
      }
    }
    
    return mergedTables;
  }

  return tables;
}

function isTableTitleLine(line) {
  // Check if line looks like a table title based on structure
  const lowerLine = line.toLowerCase();
  
  // Check for table numbering patterns
  const hasTableNumber = /\btable\s+\d+/i.test(line) || /\bfigure\s+\d+/i.test(line);
  
  // Check for lines that start with "Table" followed by a number or colon
  const hasTableStart = /^table\s*\d*:?/i.test(line.trim());
  
  // Check for page references like "Page 1 - Table", "Page 2 - Table"
  const hasPageReference = /^page\s+\d+\s*-\s*table/i.test(line.trim());
  
  // Check for lines that are likely titles (short, no numbers, reasonable length)
  const isShortTitle = line.length < 50 && !/\d/.test(line) && line.length > 3 && line.length < 30;
  
  return hasTableNumber || hasTableStart || hasPageReference || isShortTitle;
}

function isTableHeaderLine(line) {
  // Check if line looks like table headers based on structure, not content
  const words = line.split(/\s+/);
  const lowerLine = line.toLowerCase();
  
  // Filter out table titles and page references
  if (isTableTitleLine(line)) {
    return false;
  }
  
  // Filter out garbled text
  const specialCharCount = (line.match(/[^a-zA-Z0-9\s.,;:()%$€£¥°'"-]/g) || []).length;
  const specialCharRatio = specialCharCount / line.length;
  if (specialCharRatio > 0.3) {
    return false;
  }
  
  // Check for specific header patterns like "ID Name Score"
  if (lowerLine.includes('id') && lowerLine.includes('name') && lowerLine.includes('score')) {
    return true;
  }
  
  // Check for consistent spacing (at least 2 spaces between words)
  const spaces = line.match(/\s{2,}/g);
  if (spaces && spaces.length >= 2) {
    // Headers usually don't contain numbers
    const hasNumbers = /\d/.test(line);
    if (!hasNumbers) {
      return true;
    }
  }
  
  // Check for multiple words that could be headers
  if (words.length >= 3) {
    const hasNumbers = /\d/.test(line);
    if (!hasNumbers) {
      // Check if words have reasonable length (not too short, not garbled)
      const hasReasonableWords = words.every(word => word.length >= 2 && word.length <= 20);
      if (hasReasonableWords) {
        return true;
      }
    }
  }
  
  return false;
}

function isTableDataLine(line) {
  // Simple table data detection based on actual content structure
  const words = line.split(/\s+/);
  const lowerLine = line.toLowerCase();
  
  // Filter out table titles and page references
  if (isTableTitleLine(line)) {
    return false;
  }
  
  // Filter out lines that look like headers (ID, Name, Score)
  if (lowerLine.includes('id') && lowerLine.includes('name') && lowerLine.includes('score')) {
    return false;
  }
  
  // Filter out lines that are just "Page X - Table"
  if (/^page\s+\d+\s*-\s*table$/i.test(line.trim())) {
    return false;
  }
  
  // Filter out clearly garbled OCR text
  const specialCharCount = (line.match(/[^a-zA-Z0-9\s.,;:()%$€£¥°'"-]/g) || []).length;
  const specialCharRatio = specialCharCount / line.length;
  if (specialCharRatio > 0.4) {
    return false;
  }
  
  // Filter out lines with too many single characters (garbled OCR)
  const singleCharWords = words.filter(word => word.length === 1 && /[a-zA-Z]/.test(word));
  const singleCharRatio = singleCharWords.length / words.length;
  if (singleCharRatio > 0.5) {
    return false;
  }
  
  // Filter out very short lines unless they contain numbers
  if (line.length < 8) {
    const hasNumbers = /\d/.test(line);
    if (!hasNumbers) {
      return false;
    }
  }
  
  // Must have at least 2 words
  if (words.length < 2) return false;
  
  // Check for mixed content (text and numbers) which is typical in table data
  const hasNumbers = /\d/.test(line);
  const hasLetters = /[a-zA-Z]/.test(line);
  const hasMixedContent = hasNumbers && hasLetters;
  
  // Check for consistent spacing (at least 2 spaces between words)
  const spaces = line.match(/\s{2,}/g);
  
  // Check for specific patterns like "User X" or "X User Y" or "X | User Y | Z"
  const hasUserPattern = /user\s+\d+/i.test(line) || /\d+\s+user\s+\d+/i.test(line) || /\d+\s*\|\s*user\s+\d+/i.test(line);
  
  // Basic indicators for table data
  const indicators = [
    spaces && spaces.length >= 1, // Has some spacing
    words.length >= 2,            // Has multiple words
    hasMixedContent,              // Has both text and numbers
    hasNumbers,                   // Has numbers
    line.length > 10,             // Is reasonably long
    hasUserPattern                // Has user pattern
  ];
  
  const positiveIndicators = indicators.filter(Boolean).length;
  return positiveIndicators >= 2; // Need at least 2 indicators (reduced from 3)
}

function isLikelyTableContinuation(line, currentTable, tableHeaders) {
  if (currentTable.length === 0) return false;
  
  // Check if the line has similar structure to existing table rows
  const expectedColumns = Math.max(
    tableHeaders.length,
    currentTable.length > 0 ? currentTable[0].length : 0
  );
  
  if (expectedColumns === 0) return false;
  
  // Check for consistent spacing that suggests columns
  const spaces = line.match(/\s{2,}/g);
  return spaces && spaces.length >= expectedColumns - 1;
}

function isLikelyTableRelated(line) {
  // Check if the line is likely related to table content based on structure
  const lowerLine = line.toLowerCase();
  
  // Check for numbers (common in table data)
  const hasNumbers = /\d/.test(line);
  
  // Check for mixed content (text and numbers)
  const hasLetters = /[a-zA-Z]/.test(line);
  const hasMixedContent = hasNumbers && hasLetters;
  
  // Check for multiple words (typical table structure)
  const words = line.split(/\s+/);
  const hasMultipleWords = words.length >= 2;
  
  // If it has mixed content and multiple words, it's likely table-related
  return hasMixedContent && hasMultipleWords;
}

function isClearTableEndMarker(line) {
  // Check for clear indicators that a table has ended
  const lowerLine = line.toLowerCase();
  
  // Check for footnote patterns
  const hasFootnotes = /^\(\d+\)/.test(line.trim());
  
  // Check for empty lines or very short lines that might indicate table end
  const isEmptyOrShort = line.trim().length === 0 || line.trim().length < 3;
  
  // Check for new table titles that indicate end of previous table
  const isNewTableTitle = /^table\s*\d*:?/i.test(line.trim()) || /^page\s+\d+\s*-\s*table/i.test(line.trim());
  
  // Check for lines that are clearly section headers or titles (long descriptive text)
  const isSectionHeader = line.length > 30 && !/\d/.test(line) && lowerLine.includes(' ');
  
  // Don't treat single numbers as table end markers (they might be part of the data)
  const isSingleNumber = /^\d+$/.test(line.trim());
  
  return (hasFootnotes || isEmptyOrShort || isNewTableTitle || isSectionHeader) && !isSingleNumber;
}

function parseTableRow(line, preserveFormatting) {
  let cells = [];
  
  // Enhanced parsing that handles various separators and spacing
  if (line.includes('\t')) {
    // Tab-separated
    cells = line.split('\t').map(cell => cell.trim());
  } else if (line.includes('|')) {
    // Pipe-separated
    cells = line.split('|').map(cell => cell.trim());
  } else {
    // For your specific table structure, use intelligent parsing
    // Look for patterns of 2+ spaces that indicate column boundaries
    const spacePattern = /\s{2,}/g;
    let lastIndex = 0;
    const matches = [];
    let match;
    
    while ((match = spacePattern.exec(line)) !== null) {
      matches.push(match.index);
    }
    
    if (matches.length >= 4) { // We expect at least 5 columns (4 separators)
      // Split on the space boundaries
      for (let i = 0; i < matches.length; i++) {
        const start = i === 0 ? 0 : matches[i - 1] + 1;
        const end = matches[i];
        const cell = line.substring(start, end).trim();
        if (cell) {
          cells.push(cell);
        }
      }
      
      // Add the last cell
      const lastCell = line.substring(matches[matches.length - 1] + 1).trim();
      if (lastCell) {
        cells.push(lastCell);
      }
    } else {
      // Simple parsing based on spacing
      const parts = line.split(/\s+/);
      
      // Try to split based on multiple spaces first
      const spacePattern = /\s{2,}/g;
      const spaceMatches = [...line.matchAll(spacePattern)];
      
      if (spaceMatches.length >= 2) {
        // Split on multiple spaces
        let lastIndex = 0;
        for (const match of spaceMatches) {
          const cell = line.substring(lastIndex, match.index).trim();
          if (cell) cells.push(cell);
          lastIndex = match.index + match[0].length;
        }
        // Add the last cell
        const lastCell = line.substring(lastIndex).trim();
        if (lastCell) cells.push(lastCell);
      } else {
        // Fall back to simple word splitting
        cells = parts.map(part => part.trim()).filter(part => part.length > 0);
      }
    }
  }
  
  // Clean up cells
  if (cells.length > 0) {
    cells = cells.map(cell => cell.trim()).filter(cell => cell.length > 0);
  }
  
  // Filter out empty cells and clean up
  cells = cells.filter(cell => cell.length > 0);
  
  if (preserveFormatting) {
    return cells.map(cell => {
      // Preserve basic formatting like numbers, dates, etc.
      return cell.replace(/\s+/g, ' ').trim();
    });
  }
  
  return cells.map(cell => cell.replace(/\s+/g, ' ').trim());
}

function createTableFromRowsAndHeaders(headers, dataRows, extractHeaders) {
  if (dataRows.length === 0 && headers.length === 0) {
    return { name: 'Empty Table', rows: [], columns: 0, confidence: 0 };
  }

  let tableRows = dataRows;
  let tableHeaders = headers;

  // If we have headers but no data, create a single row table
  if (headers.length > 0 && dataRows.length === 0) {
    tableRows = [headers.map(() => '')];
  }

  // If we have data but no headers, create generic headers
  if (headers.length === 0 && dataRows.length > 0) {
    // Create generic column headers based on the number of columns
    const maxColumns = Math.max(...dataRows.map(row => row.length));
    tableHeaders = Array.from({ length: maxColumns }, (_, index) => `Column ${index + 1}`);
    // Keep all data rows
    tableRows = dataRows;
  }

  const maxColumns = Math.max(
    tableHeaders.length,
    ...tableRows.map(row => row.length)
  );
  
  // Normalize rows to have the same number of columns
  const normalizedHeaders = [...tableHeaders];
  while (normalizedHeaders.length < maxColumns) {
    normalizedHeaders.push(`Column ${normalizedHeaders.length + 1}`);
  }

  const normalizedRows = tableRows.map(row => {
    const normalized = [...row];
    while (normalized.length < maxColumns) {
      normalized.push('');
    }
    return normalized;
  });

  const table = {
    name: `Table ${Date.now()}`,
    rows: extractHeaders ? [normalizedHeaders, ...normalizedRows] : normalizedRows,
    columns: maxColumns,
    confidence: 0.8
  }; 

  return table;
}

function createFallbackTable(text, preserveFormatting, extractHeaders) {
  const lines = text.split('\n').filter(line => line.trim());
  
  if (lines.length === 0) {
    return {
      name: 'Extracted Text',
      rows: [['No text content found']],
      columns: 1,
      confidence: 0.3
    };
  }

  // Create a simple table from the text
  const rows = lines.map(line => [line.trim()]);
  
  return {
    name: 'Extracted Text',
    rows: extractHeaders ? [['Content'], ...rows] : rows,
    columns: 1,
    confidence: 0.5
  };
}

function parsePageRange(pageRange) {
  if (!pageRange) return [];
  
  const pages = [];
  const ranges = pageRange.split(',').map(r => r.trim());
  
  for (const range of ranges) {
    if (range.includes('-')) {
      const [start, end] = range.split('-').map(p => parseInt(p.trim()));
      if (!isNaN(start) && !isNaN(end) && start <= end) {
        for (let i = start; i <= end; i++) {
          pages.push(i);
        }
      }
    } else {
      const page = parseInt(range);
      if (!isNaN(page)) {
        pages.push(page);
      }
    }
  }
  
  return pages.sort((a, b) => a - b);
}

async function generateOutputFile(tables, outputFormat, outputDir, outputFilename, mergeTables) {
  let outputPath;

  if (outputFormat === 'xlsx') {
    outputPath = path.join(outputDir, `${outputFilename}.xlsx`);
    await generateExcelFile(tables, outputPath, mergeTables);
  } else if (outputFormat === 'csv') {
    outputPath = path.join(outputDir, `${outputFilename}.csv`);
    await generateCSVFile(tables, outputPath, mergeTables);
  } else {
    // Default to Excel
    outputPath = path.join(outputDir, `${outputFilename}.xlsx`);
    await generateExcelFile(tables, outputPath, mergeTables);
  }

  return outputPath;
}

async function generateExcelFile(tables, outputPath, mergeTables) {
  const workbook = XLSX.utils.book_new();

  // Ensure we have valid tables with data
  const validTables = tables.filter(table => table && table.rows && table.rows.length > 0);
  
  if (validTables.length === 0) {
    // Create a default sheet with error message if no valid tables
    const defaultData = [
      ['No tables detected'],
      ['The PDF may not contain table structures or table detection failed.'],
      [''],
      ['Extracted text content:'],
      ['Please check if the PDF contains tables or try different detection settings.']
    ];
    const worksheet = XLSX.utils.aoa_to_sheet(defaultData);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'No Tables Found');
  } else if (mergeTables && validTables.length > 1) {
    // Merge all tables into one sheet
    const allRows = [];
    let currentRow = 0;

    for (let i = 0; i < validTables.length; i++) {
      const table = validTables[i];
      
      // Add table name as header if multiple tables
      if (validTables.length > 1) {
        allRows.push([`Table ${i + 1}: ${table.name}`]);
        allRows.push([]);
        currentRow += 2;
      }

      // Add table data
      for (const row of table.rows) {
        allRows.push(row);
        currentRow++;
      }

      // Add spacing between tables
      if (i < validTables.length - 1) {
        allRows.push([]);
        currentRow++;
      }
    }

    const worksheet = XLSX.utils.aoa_to_sheet(allRows);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Merged Tables');
  } else {
    // Create separate sheets for each table
    for (let i = 0; i < validTables.length; i++) {
      const table = validTables[i];
      const sheetName = `Table_${i + 1}`.substring(0, 31); // Excel sheet name limit
      
      const worksheet = XLSX.utils.aoa_to_sheet(table.rows);
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    }
  }

  XLSX.writeFile(workbook, outputPath);
}

async function generateCSVFile(tables, outputPath, mergeTables) {
  let csvContent = '';

  // Ensure we have valid tables with data
  const validTables = tables.filter(table => table && table.rows && table.rows.length > 0);
  
  if (validTables.length === 0) {
    // Create a default CSV with error message if no valid tables
    csvContent = 'No tables detected\n';
    csvContent += 'The PDF may not contain table structures or table detection failed.\n';
    csvContent += 'Please check if the PDF contains tables or try different detection settings.\n';
  } else if (mergeTables && validTables.length > 1) {
    // Merge all tables with separators
    for (let i = 0; i < validTables.length; i++) {
      const table = validTables[i];
      
      if (validTables.length > 1) {
        csvContent += `Table ${i + 1}: ${table.name}\n\n`;
      }

      for (const row of table.rows) {
        csvContent += row.map(cell => `"${cell}"`).join(',') + '\n';
      }

      if (i < validTables.length - 1) {
        csvContent += '\n';
      }
    }
  } else {
    // Use the first table or combine all
    const table = validTables[0] || { rows: [] };
          for (const row of table.rows) {
        csvContent += row.map(cell => `"${cell}"`).join(',') + '\n';
      }
  }

  await fs.writeFile(outputPath, csvContent);
}

module.exports = {
  ...extractTablesController,
  // Export helper functions for testing
  parseTextForTables,
  parseTableRow,
  isTableTitleLine,
  isTableHeaderLine,
  isTableDataLine,
  reconstructTableFromPartialData,
  reconstructTableStructure,
  // Export main processing functions for testing
  convertPDFToImages,
  detectAndExtractTables,
  processFileExtractTables
};
