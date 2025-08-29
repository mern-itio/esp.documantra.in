const fs = require('fs-extra');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const XLSX = require('xlsx');

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
        pdftk: { installed: false, version: null, message: '' }
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

      res.json(tools);
    } catch (error) {
      console.error('Error checking tools:', error);
      res.status(500).json({
        success: false,
        error: 'Error checking tool availability'
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

  // Convert PDF to images for table detection
  const imagePath = await convertPDFToImage(file.path, pageRange);
  
  // Perform table detection and extraction
  const tables = await detectAndExtractTables(
    imagePath,
    detectionMethod,
    language,
    preserveFormatting,
    extractHeaders
  );

  // Generate output file
  const outputFilename = `tables_${path.parse(file.originalname).name}_${timestamp}_${randomSuffix}`;
  const outputPath = await generateOutputFile(
    tables,
    outputFormat,
    outputDir,
    outputFilename,
    mergeTables
  );

  // Cleanup temporary files
  await fs.remove(imagePath);

  const processingTime = Date.now() - startTime;

  return {
    filename: file.originalname,
    outputFilename: path.basename(outputPath),
    downloadUrl: `/pdf-extract-tables/download/${path.basename(outputPath)}`,
    originalSize: file.size,
    processedSize: await fs.stat(outputPath).then(stats => stats.size),
    tablesDetected: tables.length,
    totalRows: tables.reduce((sum, table) => sum + table.rows.length, 0),
    totalColumns: tables.reduce((sum, table) => Math.max(sum, table.columns), 0),
    detectionMethod,
    outputFormat,
    preserveFormatting,
    extractHeaders,
    mergeTables,
    processingTime,
    language
  };
}

async function convertPDFToImage(pdfPath, pageRange) {
  const timestamp = Date.now();
  const randomSuffix = Math.round(Math.random() * 1E9);
  const outputDir = path.join(__dirname, '../outputs');
  const imagePath = path.join(outputDir, `temp_${timestamp}_${randomSuffix}.png`);

  let gsCommand = `gs -sDEVICE=pngalpha -dNOPAUSE -dBATCH -dSAFER -dPDFSETTINGS=/printer -r300 -sOutputFile="${imagePath}"`;

  if (pageRange) {
    const pages = parsePageRange(pageRange);
    if (pages.length > 0) {
      gsCommand += ` -dFirstPage=${pages[0]} -dLastPage=${pages[pages.length - 1]}`;
    }
  }

  gsCommand += ` "${pdfPath}"`;

  try {
    await execAsync(gsCommand);
    return imagePath;
  } catch (error) {
    // Fallback to first page only
    const fallbackCommand = `gs -sDEVICE=pngalpha -dNOPAUSE -dBATCH -dSAFER -dPDFSETTINGS=/printer -r300 -dFirstPage=1 -dLastPage=1 -sOutputFile="${imagePath}" "${pdfPath}"`;
    await execAsync(fallbackCommand);
    return imagePath;
  }
}

async function detectAndExtractTables(
  imagePath,
  detectionMethod,
  language,
  preserveFormatting,
  extractHeaders
) {
  const tables = [];

  try {
    // Use Tesseract with better table detection
    let tesseractConfig = `--oem 3 --psm 6 -l ${language}`;
    
    if (detectionMethod === 'auto') {
      tesseractConfig += ` --tessdata-dir ${path.join(__dirname, '..')}`;
    }

    // Extract text with layout information
    const { stdout: textOutput } = await execAsync(`tesseract "${imagePath}" stdout ${tesseractConfig}`);
    
    // Parse the output to detect table structures
    const lines = textOutput.split('\n').filter(line => line.trim());
    console.log('Extracted text lines:', lines.length);
    console.log('Sample lines:', lines.slice(0, 5));
    
    const detectedTables = parseTextForTables(lines, preserveFormatting, extractHeaders);
    console.log('Detected tables:', detectedTables.length);
    
    tables.push(...detectedTables);

    // If no tables detected with auto method, try alternative approaches
    if (detectedTables.length === 0 && detectionMethod === 'auto') {
      console.log('No tables detected with auto method, trying alternative detection...');
      
      // Try with different PSM modes for better layout analysis
      const alternativeConfigs = [
        `--oem 3 --psm 3 -l ${language}`, // Fully automatic page segmentation
        `--oem 3 --psm 4 -l ${language}`, // Assume a single column of text
        `--oem 3 --psm 8 -l ${language}`, // Single word
        `--oem 3 --psm 13 -l ${language}`  // Raw line
      ];
      
      for (const altConfig of alternativeConfigs) {
        try {
          const { stdout: altTextOutput } = await execAsync(`tesseract "${imagePath}" stdout ${altConfig}`);
          const altLines = altTextOutput.split('\n').filter(line => line.trim());
          const altTables = parseTextForTables(altLines, preserveFormatting, extractHeaders);
          
          if (altTables.length > 0) {
            console.log(`Alternative detection with ${altConfig} found ${altTables.length} tables`);
            tables.push(...altTables);
            break;
          }
        } catch (altError) {
          console.log(`Alternative detection failed with ${altConfig}:`, altError.message);
        }
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

function parseTextForTables(lines, preserveFormatting, extractHeaders) {
  const tables = [];
  let currentTable = [];
  let tableStarted = false;
  let consecutiveTableRows = 0;
  let nonTableRows = 0;

  console.log('Parsing text for tables, total lines:', lines.length);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line.length === 0) continue;
    
    // Enhanced table detection
    const isTable = isTableRow(line);
    console.log(`Line ${i + 1}: "${line.substring(0, 50)}..." - Is table: ${isTable}`);
    
    if (isTable) {
      if (!tableStarted) {
        tableStarted = true;
        currentTable = [];
        consecutiveTableRows = 0;
        nonTableRows = 0;
      }
      
      consecutiveTableRows++;
      nonTableRows = 0;
      
      const cells = parseTableRow(line, preserveFormatting);
      currentTable.push(cells);
      console.log(`  Added table row with ${cells.length} cells:`, cells);
      
    } else if (tableStarted) {
      nonTableRows++;
      
      // Check if this might be a continuation of the table
      if (isLikelyTableContinuation(line, currentTable)) {
        const cells = parseTableRow(line, preserveFormatting);
        currentTable.push(cells);
        consecutiveTableRows++;
        nonTableRows = 0;
        console.log(`  Added continuation row with ${cells.length} cells:`, cells);
      } else {
        // If we have enough consecutive table rows and few non-table rows, continue
        if (consecutiveTableRows >= 2 && nonTableRows <= 2) {
          // This might still be part of the table
          const cells = parseTableRow(line, preserveFormatting);
          currentTable.push(cells);
          console.log(`  Added potential table row with ${cells.length} cells:`, cells);
        } else {
          // End of table
          if (currentTable.length > 0) {
            console.log(`  Ending table with ${currentTable.length} rows`);
            const table = createTableFromRows(currentTable, extractHeaders);
            tables.push(table);
          }
          tableStarted = false;
          currentTable = [];
          consecutiveTableRows = 0;
          nonTableRows = 0;
        }
      }
    }
  }

  // Add the last table if exists
  if (currentTable.length > 0) {
    console.log(`  Adding final table with ${currentTable.length} rows`);
    const table = createTableFromRows(currentTable, extractHeaders);
    tables.push(table);
  }

  console.log('Total tables detected:', tables.length);
  return tables;
}

function isTableRow(line) {
  // Multiple detection methods for table rows
  
  // Method 1: Check for consistent spacing patterns
  const spaces = line.match(/\s{2,}/g);
  const hasConsistentSpacing = spaces && spaces.length >= 2;
  
  // Method 2: Check for tab-separated content
  const tabs = line.match(/\t/g);
  const hasTabs = tabs && tabs.length >= 1;
  
  // Method 3: Check for pipe-separated content (common in tables)
  const pipes = line.match(/\|/g);
  const hasPipes = pipes && pipes.length >= 1;
  
  // Method 4: Check for consistent character patterns that suggest columns
  const words = line.split(/\s+/);
  const hasMultipleWords = words.length >= 3;
  
  // Method 5: Check for mixed content types (numbers, text, dates) suggesting table data
  const hasNumbers = /\d/.test(line);
  const hasLetters = /[a-zA-Z]/.test(line);
  const hasMixedContent = hasNumbers && hasLetters;
  
  // Method 6: Check for consistent line length and structure
  const isLongEnough = line.length > 15;
  
  // Combine multiple indicators
  const indicators = [
    hasConsistentSpacing,
    hasTabs,
    hasPipes,
    hasMultipleWords,
    hasMixedContent,
    isLongEnough
  ];
  
  const positiveIndicators = indicators.filter(Boolean).length;
  const isTable = positiveIndicators >= 3; // Need at least 3 indicators
  
  console.log(`  Table detection for "${line.substring(0, 30)}...":`, {
    hasConsistentSpacing,
    hasTabs,
    hasPipes,
    hasMultipleWords,
    hasMixedContent,
    isLongEnough,
    positiveIndicators,
    isTable
  });
  
  return isTable;
}

function isLikelyTableContinuation(line, currentTable) {
  if (currentTable.length === 0) return false;
  
  // Check if the line has similar structure to existing table rows
  const expectedColumns = currentTable[0].length;
  const spaces = line.match(/\s{2,}/g);
  return spaces && spaces.length >= expectedColumns - 1;
}

function parseTableRow(line, preserveFormatting) {
  let cells = [];
  
  // Try different separators in order of preference
  if (line.includes('\t')) {
    // Tab-separated
    cells = line.split('\t').map(cell => cell.trim());
  } else if (line.includes('|')) {
    // Pipe-separated
    cells = line.split('|').map(cell => cell.trim());
  } else if (line.match(/\s{3,}/)) {
    // Multiple spaces (3 or more)
    cells = line.split(/\s{3,}/).map(cell => cell.trim());
  } else if (line.match(/\s{2,}/)) {
    // Double spaces
    cells = line.split(/\s{2,}/).map(cell => cell.trim());
  } else {
    // Single spaces as fallback
    cells = line.split(/\s+/).map(cell => cell.trim());
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

function createTableFromRows(rows, extractHeaders) {
  if (rows.length === 0) return { name: 'Empty Table', rows: [], columns: 0, confidence: 0 };

  let tableRows = rows;
  let headers = [];

  if (extractHeaders && rows.length > 1) {
    headers = rows[0];
    tableRows = rows.slice(1);
  }

  const maxColumns = Math.max(...rows.map(row => row.length));
  
  // Normalize rows to have the same number of columns
  const normalizedRows = tableRows.map(row => {
    const normalized = [...row];
    while (normalized.length < maxColumns) {
      normalized.push('');
    }
    return normalized;
  });

  return {
    name: `Table ${Date.now()}`,
    rows: extractHeaders ? [headers, ...normalizedRows] : normalizedRows,
    columns: maxColumns,
    confidence: 0.8
  };
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

module.exports = extractTablesController;
