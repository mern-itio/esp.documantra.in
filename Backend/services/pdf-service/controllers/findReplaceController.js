const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs-extra');
const path = require('path');

const execAsync = promisify(exec);

const findReplaceController = {
  async findReplace(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      // Verify uploaded file exists
      if (!await fs.pathExists(req.file.path)) {
        throw new Error(`Uploaded file not found at path: ${req.file.path}`);
      }

      // Ensure uploads directory exists
      const uploadsDir = path.dirname(req.file.path);
      await fs.ensureDir(uploadsDir);

      // Parse find & replace options from request body
      const {
        searchText = '',
        replaceText = '',
        useRegex = 'false',
        caseSensitive = 'False',
        wholeWord = 'false',
        replaceAll = 'false',
        selectedMatches = null
      } = req.body;

      // Parse selectedMatches if it's a string (from form data)
      let parsedSelectedMatches = selectedMatches;
      if (typeof selectedMatches === 'string') {
        try {
          parsedSelectedMatches = selectedMatches ? JSON.parse(selectedMatches) : null;
        } catch (e) {
          console.error('Failed to parse selectedMatches:', e);
          parsedSelectedMatches = null;
        }
      }

      // console.log('Backend received:', {
      //   searchText,
      //   replaceText,
      //   replaceAll,
      //   selectedMatches: parsedSelectedMatches,
      //   selectedMatchesType: typeof parsedSelectedMatches,
      //   selectedMatchesLength: parsedSelectedMatches ? parsedSelectedMatches.length : 'null'
      // });

      if (!searchText.trim()) {
        return res.status(400).json({ error: 'Search text is required' });
      }

      // Create output filename
      const outputFilename = `find-replace-${Date.now()}.pdf`;
      const outputPath = path.join(__dirname, '..', 'outputs', outputFilename);

      // Ensure output directory exists
      await fs.ensureDir(path.dirname(outputPath));

      // First, copy the original file to output
      await fs.copy(req.file.path, outputPath);

      // Extract text from PDF for analysis
      let extractedText = '';
      let findReplaceResults = {
        searchText: searchText,
        replaceText: replaceText,
        useRegex: useRegex === 'true',
        caseSensitive: caseSensitive === 'true',
        wholeWord: wholeWord === 'true',
        replaceAll: replaceAll === 'true',
        totalMatches: 0,
        matches: [],
        replacements: [],
        pages: []
      };

      try {
        // Use pdftotext to extract text with page information
        const { stdout: textOutput } = await execAsync(`pdftotext -layout "${req.file.path}" -`);
        extractedText = textOutput;

        // Initialize actualReplacements variable
        let actualReplacements = [];

        if (extractedText.trim()) {
          // Get page count first to improve match accuracy
          let tempPageCount = 0;
          try {
            const { stdout: tempPagesOutput } = await execAsync(`pdfinfo "${req.file.path}"`);
            const tempInfoMatch = tempPagesOutput.match(/Pages:\s*(\d+)/i);
            if (tempInfoMatch) {
              tempPageCount = parseInt(tempInfoMatch[1]);
            }
          } catch (error) {
            console.warn('Could not get page count for match calculation:', error.message);
          }
          
          // Find matches in the text with accurate page calculation
          const matches = findReplaceController.findMatches(
            extractedText,
            searchText,
            {
              useRegex: useRegex === 'true',
              caseSensitive: caseSensitive === 'true',
              wholeWord: wholeWord === 'true'
            },
            tempPageCount
          );

          findReplaceResults.totalMatches = matches.length;
          findReplaceResults.matches = matches;

          // If replaceText is provided, perform replacements
          if (replaceText !== undefined && replaceText !== null && replaceText !== '') {
            let replacedText;

            // Handle selected matches if provided
            if (parsedSelectedMatches && Array.isArray(parsedSelectedMatches) && parsedSelectedMatches.length > 0) {
              replacedText = findReplaceController.replaceSelectedMatches(
                extractedText,
                matches,
                parsedSelectedMatches,
                replaceText
              );
            } else {
              // Use existing replace logic for replaceAll/first match
              replacedText = findReplaceController.replaceText(
                extractedText,
                searchText,
                replaceText,
                {
                  useRegex: useRegex === 'true',
                  caseSensitive: caseSensitive === 'true',
                  wholeWord: wholeWord === 'true',
                  replaceAll: replaceAll === 'true'
                }
              );
            }

            // Create a new PDF with replaced text (preserving layout)
            await findReplaceController.createPdfWithReplacedText(req.file.path, outputPath, {
              searchText,
              replaceText,
              selectedMatches: parsedSelectedMatches,
              matches,
              useRegex: useRegex === 'true',
              caseSensitive: caseSensitive === 'true',
              wholeWord: wholeWord === 'true',
              replaceAll: replaceAll === 'true'
            });

            // Track replacements made (only count actual replacements)
            if (parsedSelectedMatches && Array.isArray(parsedSelectedMatches) && parsedSelectedMatches.length > 0) {
              // Use selected matches
              actualReplacements = parsedSelectedMatches
                .filter(index => index >= 0 && index < matches.length)
                .map(index => matches[index]);
            } else {
              // Use replaceAll logic
              actualReplacements = replaceAll === 'true' ? matches : matches.slice(0, 1);
            }

            findReplaceResults.replacements = actualReplacements.map(match => ({
              original: match.text,
              replacement: replaceText,
              position: match.position,
              page: match.page
            }));
          }

          // Analyze page distribution - only count pages that were actually affected by replacements
          const affectedPages = findReplaceController.analyzePageDistribution(actualReplacements);
          findReplaceResults.pages = affectedPages;
        } else {
          findReplaceResults.totalMatches = 0;
          findReplaceResults.matches = [];
          findReplaceResults.pages = [];
        }

      } catch (textError) {
        console.error('Text extraction failed:', textError.message);
        throw new Error(`Failed to extract text from PDF: ${textError.message}`);
      }

      // Get file size
      const stats = await fs.stat(outputPath);
      const fileSize = stats.size;
      const originalStats = await fs.stat(req.file.path);
      const originalFileSize = originalStats.size;

      // Get page count using simple and reliable methods
      let pageCount = 0;
      let methodUsed = '';
      
      // Method 1: Try pdfinfo first (most reliable and simple)
      try {
        console.log(`Attempting pdfinfo page count for: ${outputPath}`);
        const { stdout: pdfInfoOutput } = await execAsync(`pdfinfo "${outputPath}"`);
        console.log(`pdfinfo output: ${pdfInfoOutput}`);
        
        const infoMatch = pdfInfoOutput.match(/Pages:\s*(\d+)/i);
        if (infoMatch) {
          pageCount = parseInt(infoMatch[1]);
          methodUsed = 'pdfinfo';
          console.log(`pdfinfo found ${pageCount} pages`);
        }
      } catch (pdfInfoError) {
        console.warn('pdfinfo page count failed:', pdfInfoError.message);
      }
      
      // Method 2: Try qpdf if pdfinfo didn't work
      if (pageCount <= 0) {
        try {
          console.log(`Attempting qpdf page count for: ${outputPath}`);
          const { stdout: pagesOutput } = await execAsync(`qpdf --show-pages "${outputPath}"`);
          console.log(`qpdf output: ${pagesOutput}`);
          
          // Simple regex - just look for any number in the output
          const numberMatch = pagesOutput.match(/(\d+)/);
          if (numberMatch) {
            pageCount = parseInt(numberMatch[1]);
            methodUsed = 'qpdf';
            console.log(`qpdf found ${pageCount} pages`);
          }
        } catch (error) {
          console.warn('qpdf page count failed:', error.message);
        }
      }
      
      // Method 3: Try pdftk if previous methods didn't work
      if (pageCount <= 0) {
        try {
          console.log(`Attempting pdftk page count for: ${outputPath}`);
          const { stdout: pdftkOutput } = await execAsync(`pdftk "${outputPath}" dump_data`);
          console.log(`pdftk output: ${pdftkOutput}`);
          
          const pdftkMatch = pdftkOutput.match(/NumberOfPages:\s*(\d+)/i);
          if (pdftkMatch) {
            pageCount = parseInt(pdftkMatch[1]);
            methodUsed = 'pdftk';
            console.log(`pdftk found ${pageCount} pages`);
          }
        } catch (pdftkError) {
          console.warn('pdftk page count failed:', pdftkError.message);
        }
      }
      
      // Method 4: Calculate from matches data (reliable fallback)
      if (pageCount <= 0 && findReplaceResults.matches && findReplaceResults.matches.length > 0) {
        const maxPage = Math.max(...findReplaceResults.matches.map(match => match.page));
        if (maxPage > 0) {
          pageCount = maxPage;
          methodUsed = 'matches-data';
          console.log(`Calculated page count from matches: ${pageCount}`);
        }
      }
      
      // Method 5: Fallback - estimate from file size
      if (pageCount <= 0) {
        const stats = await fs.stat(outputPath);
        const estimatedPages = Math.max(1, Math.floor(stats.size / 50000)); // Rough estimate: 50KB per page
        pageCount = estimatedPages;
        methodUsed = 'file-size-estimate';
        console.log(`Using estimated page count: ${pageCount} (based on file size: ${stats.size} bytes)`);
      }
      
      // Final validation
      if (typeof pageCount !== 'number' || isNaN(pageCount) || pageCount <= 0) {
        pageCount = 1; // Default to 1 page if all methods fail
        methodUsed = 'default';
        console.warn('All page count methods failed, defaulting to 1 page');
      }
      
      console.log(`Final page count: ${pageCount} (method: ${methodUsed})`);

      // Clean up uploaded file
      await fs.remove(req.file.path);

      // Calculate statistics for frontend
      const totalMatches = findReplaceResults.totalMatches || 0;
      const totalReplacements = findReplaceResults.replacements ? findReplaceResults.replacements.length : 0;
      const pagesAffected = findReplaceResults.pages ? findReplaceResults.pages.length : 0;
      const searchLength = searchText.length;

      res.json({
        success: true,
        message: 'Find & Replace completed successfully',
        filename: outputFilename,
        downloadUrl: `/pdf-find-replace/download/${outputFilename}`,
        totalPages: pageCount,
        pageCountMethod: methodUsed, // Debug info
        fileSize: fileSize,
        originalFileSize: originalFileSize,
        findReplaceResults: findReplaceResults,
        extractedText: extractedText.substring(0, 1000) + (extractedText.length > 1000 ? '...' : ''), // Preview of extracted text
        stats: {
          totalMatches,
          totalReplacements,
          pagesAffected,
          searchLength
        }
      });

    } catch (error) {
      console.error('Error performing find & replace:', error);

      res.status(500).json({
        error: 'Failed to perform find & replace on PDF',
        details: error.message
      });
    }
  },

  // Find matches in text based on search criteria
  findMatches(text, searchText, options, totalPages = null) {
    const matches = [];
    const { useRegex, caseSensitive, wholeWord } = options;

    let searchPattern;

    if (useRegex) {
      try {
        const flags = caseSensitive ? 'g' : 'gi';
        searchPattern = new RegExp(searchText, flags);
      } catch (error) {
        // If regex is invalid, treat as literal text
        searchPattern = new RegExp(searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), caseSensitive ? 'g' : 'gi');
      }
    } else {
      // Escape special regex characters for literal search
      const escapedText = searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

      if (wholeWord) {
        // Use word boundaries for whole word matching
        searchPattern = new RegExp(`\\b${escapedText}\\b`, caseSensitive ? 'g' : 'gi');
      } else {
        searchPattern = new RegExp(escapedText, caseSensitive ? 'g' : 'gi');
      }
    }

    let match;
    let position = 0;

    while ((match = searchPattern.exec(text)) !== null) {
      // Calculate page number more accurately
      let page = 1;
      if (totalPages && totalPages > 0) {
        // Use actual page count if available
        const charsPerPage = Math.ceil(text.length / totalPages);
        page = Math.min(totalPages, Math.floor(match.index / charsPerPage) + 1);
      } else {
        // Fallback to character-based estimation (more accurate)
        const charsPerPage = Math.max(1000, Math.floor(text.length / 6)); // Assume at least 6 pages or use text length
        page = Math.floor(match.index / charsPerPage) + 1;
      }

      // Get context around the match
      const contextStart = Math.max(0, match.index - 50);
      const contextEnd = Math.min(text.length, match.index + match[0].length + 50);
      const context = text.substring(contextStart, contextEnd);

      matches.push({
        text: match[0],
        position: match.index,
        page: page,
        context: context,
        contextStart: contextStart,
        contextEnd: contextEnd,
        matchStart: match.index - contextStart,
        matchEnd: match.index - contextStart + match[0].length
      });

      // Prevent infinite loop with zero-length matches
      if (match.index === searchPattern.lastIndex) {
        searchPattern.lastIndex++;
      }
    }

    return matches;
  },

  // Replace text based on search criteria
  replaceText(text, searchText, replaceText, options) {
    const { useRegex, caseSensitive, wholeWord, replaceAll } = options;

    let searchPattern;

    if (useRegex) {
      try {
        // Use global flag only if replaceAll is true
        const flags = caseSensitive ? (replaceAll ? 'g' : '') : (replaceAll ? 'gi' : 'i');
        searchPattern = new RegExp(searchText, flags);
      } catch (error) {
        // If regex is invalid, treat as literal text
        const flags = caseSensitive ? (replaceAll ? 'g' : '') : (replaceAll ? 'gi' : 'i');
        searchPattern = new RegExp(searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags);
      }
    } else {
      // Escape special regex characters for literal search
      const escapedText = searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

      if (wholeWord) {
        // Use word boundaries for whole word matching
        const flags = caseSensitive ? (replaceAll ? 'g' : '') : (replaceAll ? 'gi' : 'i');
        searchPattern = new RegExp(`\\b${escapedText}\\b`, flags);
      } else {
        const flags = caseSensitive ? (replaceAll ? 'g' : '') : (replaceAll ? 'gi' : 'i');
        searchPattern = new RegExp(escapedText, flags);
      }
    }

    return text.replace(searchPattern, replaceText);
  },

  // Replace only selected matches
  replaceSelectedMatches(text, matches, selectedIndices, replaceText) {
    console.log('replaceSelectedMatches called with:', {
      textLength: text.length,
      matchesCount: matches.length,
      selectedIndices,
      replaceText
    });

    // Sort selected indices in descending order to avoid position shifts
    const sortedIndices = [...selectedIndices].sort((a, b) => b - a);

    let result = text;
    let replacementCount = 0;

    // Replace matches from end to beginning to maintain correct positions
    sortedIndices.forEach(index => {
      if (index >= 0 && index < matches.length) {
        const match = matches[index];
        const before = result.substring(0, match.position);
        const after = result.substring(match.position + match.text.length);
        result = before + replaceText + after;
        replacementCount++;
        // console.log(`Replaced match ${index} at position ${match.position}: "${match.text}" -> "${replaceText}"`);
      }
    });

    // console.log(`Total replacements made: ${replacementCount}`);
    return result;
  },

  // Create PDF with replaced text (preserving original layout)
  async createPdfWithReplacedText(originalPdfPath, outputPath, options) {
    try {
      // console.log('Creating PDF with replaced text using PDFtk...');

      // Prepare replacement data
      const replacementData = options.matches
        .filter((match, index) => {
          if (options.selectedMatches && options.selectedMatches.length > 0) {
            return options.selectedMatches.includes(index);
          }
          return options.replaceAll ? true : index === 0; // First match only if not replaceAll
        })
        .map(match => ({
          page: match.page,
          position: match.position,
          originalText: match.text,
          replacementText: options.replaceText
        }));

      // console.log(`Processing ${replacementData.length} replacements out of ${options.matches.length} total matches`);
      // console.log(`Replace All: ${options.replaceAll}, Selected Matches: ${JSON.stringify(options.selectedMatches)}`);

      // Create a Python script using PyMuPDF for proper text replacement
      const pythonScript = `
import fitz  # PyMuPDF
import sys
import json
import re

def replace_text_in_pdf(input_path, output_path, search_text, replace_text, case_sensitive, replace_all, selected_matches):
    """Replace text in PDF while preserving layout using PyMuPDF"""
    try:
        doc = fitz.open(input_path)
        
        # Create regex pattern
        if case_sensitive:
            pattern = re.compile(re.escape(search_text))
        else:
            pattern = re.compile(re.escape(search_text), re.IGNORECASE)
        
        total_replacements = 0
        match_count = 0

        # print(f"Starting replacement: search='{search_text}', replace='{replace_text}', replace_all={replace_all}, selected_matches={selected_matches}")

        for page_num in range(len(doc)):
            page = doc[page_num]
            
            # Get text instances
            text_dict = page.get_text("dict")
            
            for block in text_dict["blocks"]:
                if "lines" in block:
                    for line in block["lines"]:
                        for span in line["spans"]:
                            original_text = span["text"]
                            
                            # Check if this span contains our search text
                            if pattern.search(original_text):
                                match_count += 1
                                
                                # Determine if we should replace this match
                                should_replace = False
                                if selected_matches and len(selected_matches) > 0:
                                    # Use selected matches (0-based index)
                                    should_replace = (match_count - 1) in selected_matches
                                    print(f"Match {match_count}: selected_matches mode, should_replace={should_replace}")
                                elif replace_all:
                                    # Replace all matches
                                    should_replace = True
                                    print(f"Match {match_count}: replace_all mode, should_replace={should_replace}")
                                else:
                                    # Replace only first match
                                    should_replace = (match_count == 1)
                                    print(f"Match {match_count}: first_match mode, should_replace={should_replace}")
                                
                                if should_replace:
                                    # Apply replacement
                                    new_text = pattern.sub(replace_text, original_text)
                                    
                                    if new_text != original_text:
                                        total_replacements += 1
                                        print(f"Replacing match {match_count}: '{original_text}' -> '{new_text}'")
                                        
                                        # Get the bounding box
                                        bbox = span["bbox"]
                                        rect = fitz.Rect(bbox)
                                        
                                        # Redact the old text (white rectangle)
                                        page.add_redact_annot(rect, fill=(1, 1, 1))
                                        page.apply_redactions()
                                        
                                        # Insert new text at the same position
                                        page.insert_text(
                                            (bbox[0], bbox[3] - 2),
                                            new_text,
                                            fontsize=span["size"],
                                            color=(0, 0, 0)
                                        )
        
        doc.save(output_path)
        doc.close()
        # print(f"Successfully replaced {total_replacements} instances out of {match_count} matches found")
        return True
        
    except Exception as e:
        # print(f"Error: {str(e)}")
        return False

if __name__ == "__main__":
    input_pdf = "${originalPdfPath}"
    output_pdf = "${outputPath}"
    search_text = "${options.searchText}"
    replace_text = "${options.replaceText}"
    case_sensitive = ${options.caseSensitive ? 'True' : 'False'}
    replace_all = ${options.replaceAll ? 'True' : 'False'}
    selected_matches = ${JSON.stringify(options.selectedMatches || [])}
    
    success = replace_text_in_pdf(input_pdf, output_pdf, search_text, replace_text, case_sensitive, replace_all, selected_matches)
    if not success:
        import shutil
        shutil.copy2(input_pdf, output_pdf)
        print("Fallback: Copied original PDF")
`;

      // Write and execute Python script
      const pythonScriptFile = path.join(__dirname, '..', 'uploads', `replace_${Date.now()}.py`);
      await fs.writeFile(pythonScriptFile, pythonScript);

      try {
        await execAsync(`python3 "${pythonScriptFile}"`);
        // console.log('PDF text replacement completed successfully');
      } catch (pythonError) {
        console.warn('PyMuPDF not available, trying PDFtk:', pythonError.message);

        // Fallback: Use PDFtk for basic operations
        try {
          // PDFtk doesn't directly support text replacement, but we can use it for other operations
          // For now, copy the original and log the issue
          await execAsync(`pdftk "${originalPdfPath}" output "${outputPath}"`);
          // console.log('PDFtk processing completed (text replacement not available)');
        } catch (pdftkError) {
          console.warn('PDFtk failed, copying original PDF:', pdftkError.message);
          await fs.copy(originalPdfPath, outputPath);
        }
      }

      // Clean up
      try {
        await fs.remove(pythonScriptFile);
      } catch (cleanupError) {
        console.warn('Cleanup error:', cleanupError.message);
      }

    } catch (error) {
      console.error('Error creating PDF with replaced text:', error);
      await fs.copy(originalPdfPath, outputPath);
      throw error;
    }
  },

  // Analyze page distribution of matches
  analyzePageDistribution(matches) {
    const pageMap = new Map();

    matches.forEach(match => {
      const page = match.page;
      if (!pageMap.has(page)) {
        pageMap.set(page, []);
      }
      pageMap.get(page).push(match);
    });

    return Array.from(pageMap.entries()).map(([page, pageMatches]) => ({
      page: page,
      matchCount: pageMatches.length,
      matches: pageMatches
    })).sort((a, b) => a.page - b.page);
  },

  // Preview find & replace without making changes
  async previewFindReplace(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const {
        searchText = '',
        useRegex = 'false',
        caseSensitive = 'false',
        wholeWord = 'false'
      } = req.body;

      if (!searchText.trim()) {
        return res.status(400).json({ error: 'Search text is required' });
      }

      // Extract text from PDF
      const { stdout: textOutput } = await execAsync(`pdftotext -layout "${req.file.path}" -`);
      const extractedText = textOutput;

      // Get page count first to improve match accuracy
      let tempPageCount = 0;
      try {
        const { stdout: tempPagesOutput } = await execAsync(`pdfinfo "${req.file.path}"`);
        const tempInfoMatch = tempPagesOutput.match(/Pages:\s*(\d+)/i);
        if (tempInfoMatch) {
          tempPageCount = parseInt(tempInfoMatch[1]);
        }
      } catch (error) {
        console.warn('Could not get page count for match calculation:', error.message);
      }
      
      // Find matches with accurate page calculation
      const matches = findReplaceController.findMatches(
        extractedText,
        searchText,
        {
          useRegex: useRegex === 'true',
          caseSensitive: caseSensitive === 'true',
          wholeWord: wholeWord === 'true'
        },
        tempPageCount
      );

      // Analyze page distribution
      const pages = findReplaceController.analyzePageDistribution(matches);

      // Clean up uploaded file
      await fs.remove(req.file.path);

      res.json({
        success: true,
        message: 'Preview completed successfully',
        totalMatches: matches.length,
        matches: matches.slice(0, 100), // Limit to first 100 matches for preview
        pages: pages,
        extractedText: extractedText.substring(0, 2000) + (extractedText.length > 2000 ? '...' : '')
      });

    } catch (error) {
      console.error('Error previewing find & replace:', error);

      res.status(500).json({
        error: 'Failed to preview find & replace',
        details: error.message
      });
    }
  },

  // Helper method to test tools installation
  async testToolsInstallation() {
    const tools = {};

    try {
      const { stdout: qpdfVersion } = await execAsync('qpdf --version');
      tools.qpdf = {
        installed: true,
        version: qpdfVersion.trim(),
        message: 'qpdf is properly installed and working'
      };
    } catch (error) {
      tools.qpdf = {
        installed: false,
        error: error.message,
        message: 'qpdf is not installed or not accessible'
      };
    }

    // Check for pdftotext
    try {
      const { stdout: pdftotextVersion } = await execAsync('pdftotext -v');
      tools.pdftotext = {
        installed: true,
        version: pdftotextVersion.trim(),
        message: 'pdftotext is properly installed and working'
      };
    } catch (error) {
      tools.pdftotext = {
        installed: false,
        error: error.message,
        message: 'pdftotext is not installed or not accessible'
      };
    }

    // Check for enscript (optional)
    try {
      const { stdout: enscriptVersion } = await execAsync('enscript --version');
      tools.enscript = {
        installed: true,
        version: enscriptVersion.trim(),
        message: 'enscript is properly installed and working'
      };
    } catch (error) {
      tools.enscript = {
        installed: false,
        error: error.message,
        message: 'enscript is not installed or not accessible. Basic text replacement will be used.'
      };
    }

    // Check for Python with reportlab (optional)
    try {
      const { stdout: pythonVersion } = await execAsync('python3 --version');
      await execAsync('python3 -c "import reportlab"');
      tools.python_reportlab = {
        installed: true,
        version: pythonVersion.trim(),
        message: 'Python with reportlab is properly installed and working'
      };
    } catch (error) {
      tools.python_reportlab = {
        installed: false,
        error: error.message,
        message: 'Python with reportlab is not installed or not accessible. Basic text replacement will be used.'
      };
    }

    return tools;
  }
};

module.exports = findReplaceController;
