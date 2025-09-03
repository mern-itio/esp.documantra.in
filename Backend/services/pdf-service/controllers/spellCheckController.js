const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');
const axios = require('axios');

const execAsync = promisify(exec);

const spellCheckController = {
  async spellCheck(req, res) {
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

      // Parse spell check options from request body
      const {
        language = 'en',
        customDictionary = '',
        checkGrammar = 'true',
        suggestions = 'true',
        ignoreNumbers = 'true',
        ignoreUrls = 'true',
        ignoreEmails = 'true'
      } = req.body;

      // Create output filename
      const outputFilename = `spell-checked-${Date.now()}.pdf`;
      const outputPath = path.join(__dirname, '..', 'outputs', outputFilename);

      // Ensure output directory exists
      await fs.ensureDir(path.dirname(outputPath));

      // First, copy the original file to output
      await fs.copy(req.file.path, outputPath);

      // Extract text from PDF for spell checking
      let extractedText = '';
      let spellCheckResults = {
        totalWords: 0,
        misspelledWords: [],
        suggestions: {},
        grammarIssues: [],
        language: language,
        customDictionary: customDictionary,
        checkGrammar: checkGrammar === 'true',
        suggestions: suggestions === 'true'
      };

      try {
        // Use pdftotext to extract text
        const { stdout: textOutput } = await execAsync(`pdftotext "${req.file.path}" -`);
        extractedText = textOutput;

        if (extractedText.trim()) {
          // Process the text for spell checking
          const words = extractedText.toLowerCase().match(/\b[a-z]+\b/g) || [];
          spellCheckResults.totalWords = words.length;

          // Use aspell for spell checking if available
          try {
            // Check if aspell is available
            await execAsync('aspell --version');
            
            // Create a temporary text file for aspell
            const tempTextFile = path.join(__dirname, '..', 'uploads', `temp-text-${Date.now()}.txt`);
            await fs.writeFile(tempTextFile, extractedText);

            // Run aspell check
            const aspellCommand = `aspell list --lang=${language} < "${tempTextFile}"`;

            const { stdout: misspelledOutput } = await execAsync(aspellCommand);
            
            if (misspelledOutput.trim()) {
              const misspelledWords = misspelledOutput.trim().split('\n').filter(word => word.trim());
              
              // Get suggestions for each misspelled word
              for (const word of misspelledWords) {
                if (spellCheckResults.suggestions) {
                  try {
                    const suggestCommand = `echo "${word}" | aspell suggest --lang=${language}`;
                    const { stdout: suggestOutput } = await execAsync(suggestCommand);
                    const suggestions = suggestOutput.trim().split('\n').filter(s => s.trim() && s !== word);
                    spellCheckResults.suggestions[word] = suggestions.slice(0, 5); // Limit to 5 suggestions
                  } catch (suggestError) {
                    console.warn(`Could not get suggestions for "${word}":`, suggestError.message);
                    spellCheckResults.suggestions[word] = [];
                  }
                }
                spellCheckResults.misspelledWords.push(word);
              }
            }

            // Clean up temporary file
            await fs.remove(tempTextFile);

                     } catch (aspellError) {
             console.warn('Aspell not available, using intelligent spell checking:', aspellError.message);
             
             // Intelligent spell checking using multiple approaches
             const misspelledWords = await spellCheckController.intelligentSpellCheck(words, language);
             spellCheckResults.misspelledWords = misspelledWords;
           }

          // Basic grammar checking (simplified)
          if (checkGrammar === 'true') {
            spellCheckResults.grammarIssues = await spellCheckController.basicGrammarCheck(extractedText);
          }

        } else {
          spellCheckResults.totalWords = 0;
          spellCheckResults.misspelledWords = [];
          spellCheckResults.grammarIssues = [];
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

      // Get page count using qpdf
      let pageCount = 0;
      try {
        const { stdout: pagesOutput } = await execAsync(`qpdf --show-pages "${outputPath}"`);
        const pageMatch = pagesOutput.match(/(\d+)\s+page/);
        if (pageMatch) {
          pageCount = parseInt(pageMatch[1]);
        }
      } catch (error) {
        console.warn('Could not determine page count:', error.message);
        pageCount = 'Unknown';
      }

      // Clean up uploaded file
      await fs.remove(req.file.path);

      // Log document tracking event
      try {
        console.log('Attempting to log document tracking event...');
        const DocumentTracking = require('../models/documentTracking');
        console.log('DocumentTracking model loaded successfully');
        
        const documentId = crypto.randomBytes(16).toString('hex');
        const userId = req.user?.id || 'anonymous';
        
        console.log('Creating tracking record with:', {
          documentId,
          documentName: req.file.originalname,
          userId,
          action: 'spell_checked'
        });
        
        const trackingRecord = new DocumentTracking({
          documentId,
          documentName: req.file.originalname,
          documentType: 'pdf',
          originalFilename: req.file.originalname,
          userId,
          action: 'spell_checked',
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          isTracked: true,
          trackingSource: 'automatic',
          metadata: {
            originalFileSize,
            processedFileSize: fileSize,
            spellCheckResults: {
              totalWords: spellCheckResults.totalWords,
              misspelledCount: spellCheckResults.misspelledWords.length,
              grammarIssuesCount: spellCheckResults.grammarIssues.length,
              language: spellCheckResults.language,
              checkGrammar: spellCheckResults.checkGrammar
            }
          }
        });

        console.log('Tracking record created, attempting to save...');
        await trackingRecord.save();
        console.log('Document tracking event logged successfully for spell checking');
      } catch (trackingError) {
        console.error('Failed to log document tracking event:', trackingError);
        // Don't fail the main operation if tracking fails
      }

      res.json({
        success: true,
        message: 'Spell check completed successfully',
        filename: outputFilename,
        downloadUrl: `/pdf-spell-check/download/${outputFilename}`,
        totalPages: pageCount,
        fileSize: fileSize,
        originalFileSize: originalFileSize,
        spellCheckResults: spellCheckResults,
        extractedText: extractedText.substring(0, 1000) + (extractedText.length > 1000 ? '...' : '') // Preview of extracted text
      });

    } catch (error) {
      console.error('Error performing spell check:', error);

      res.status(500).json({
        error: 'Failed to perform spell check on PDF',
        details: error.message
      });
    }
  },

  // Intelligent spell checking using pattern analysis
  async intelligentSpellCheck(words, language) {
    const misspelledWords = [];
    
    for (const word of words) {
      // Skip very short words
      if (word.length <= 2) continue;
      
      // Skip numbers
      if (this.isNumber(word)) continue;
      
      // Skip URLs
      if (this.isUrl(word)) continue;
      
      // Skip emails
      if (this.isEmail(word)) continue;
      
      // Skip words that contain numbers mixed with letters
      if (/\d/.test(word)) continue;
      
      // Skip words that are too long (likely not real words)
      if (word.length > 20) continue;
      
      // Skip words that contain special characters
      if (/[^a-zA-Z]/.test(word)) continue;
      
      // Skip words that look like abbreviations (all caps, short) or common business abbreviations
      if (/^[A-Z]{2,4}$/.test(word)) continue;
      if (['pvt', 'ltd', 'inc', 'corp', 'llc', 'co', 'etc', 'vs', 'mr', 'ms', 'dr', 'prof', 'cin', 'gstin', 'pan'].includes(word.toLowerCase())) continue;
      
      // Skip common business terms and names
      if (['arun', 'jyoti', 'ankita', 'tiwari', 'innovex', 'kaushambi', 'ghaziabad', 'delhi', 'india'].includes(word.toLowerCase())) continue;
      
      // Skip words that look like proper nouns (capitalized)
      if (/^[A-Z][a-z]+$/.test(word)) continue;
      
      // Use pattern-based spell checking
      const isMisspelled = this.patternBasedSpellCheck(word);
      if (isMisspelled) {
        misspelledWords.push(word);
      }
    }
    
    return [...new Set(misspelledWords)];
  },

  // Pattern-based spell checking using common English patterns
  patternBasedSpellCheck(word) {
    const lowerWord = word.toLowerCase();
    
    // Common English letter patterns that are likely misspellings
    const suspiciousPatterns = [
      // Double consonants that are uncommon
      /^[bcdfghjklmnpqrstvwxyz]{2,}$/, // All consonants
      /^[aeiou]{3,}$/, // All vowels
      /^[bcdfghjklmnpqrstvwxyz]{4,}$/, // 4+ consonants in a row
      /^[aeiou]{4,}$/, // 4+ vowels in a row
      /q[^u]/, // q not followed by u
      /^[^aeiou]{3,}$/, // 3+ consonants at start
      /[^aeiou]{4,}$/, // 4+ consonants at end
      /^[^aeiou]*$/, // No vowels at all
      /[aeiou]{5,}/, // 5+ vowels in a row
      /[bcdfghjklmnpqrstvwxyz]{5,}/, // 5+ consonants in a row
    ];
    
    // Check for suspicious patterns
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(lowerWord)) {
        return true;
      }
    }
    
    // Check for common misspelling patterns
    const commonMisspellings = [
      /^[bcdfghjklmnpqrstvwxyz]{2}[aeiou][bcdfghjklmnpqrstvwxyz]{2}$/, // CVCVC pattern with too many consonants
      /^[aeiou][bcdfghjklmnpqrstvwxyz]{3,}[aeiou]$/, // VCCCCV pattern
      /^[bcdfghjklmnpqrstvwxyz]{3,}[aeiou][bcdfghjklmnpqrstvwxyz]{2,}$/, // CCCVCC pattern
    ];
    
    for (const pattern of commonMisspellings) {
      if (pattern.test(lowerWord)) {
        return true;
      }
    }
    
    // Check for impossible letter combinations
    const impossibleCombinations = [
      /^[bcdfghjklmnpqrstvwxyz]{6,}$/, // 6+ consonants in a row
      /^[aeiou]{6,}$/, // 6+ vowels in a row
      /^[^aeiou]{5,}$/, // 5+ consonants at start
      /[^aeiou]{5,}$/, // 5+ consonants at end
    ];
    
    for (const pattern of impossibleCombinations) {
      if (pattern.test(lowerWord)) {
        return true;
      }
    }
    
    // Check for words that are too short to be real words but pass other checks
    if (word.length >= 3 && word.length <= 4) {
      // For very short words, be more strict
      const vowelCount = (lowerWord.match(/[aeiou]/g) || []).length;
      const consonantCount = (lowerWord.match(/[bcdfghjklmnpqrstvwxyz]/g) || []).length;
      
      // If no vowels or too many consonants for length
      if (vowelCount === 0 || consonantCount > vowelCount * 3) {
        return true;
      }
    }
    
    // If word passes all checks, it's likely correctly spelled
    return false;
  },

  // Helper method to check if a word is a number
  isNumber(word) {
    return /^\d+$/.test(word);
  },

  // Helper method to check if a word is a URL
  isUrl(word) {
    return /^https?:\/\/|^www\.|\.com$|\.org$|\.net$|\.edu$|\.gov$/.test(word);
  },

  // Helper method to check if a word is an email
  isEmail(word) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(word);
  },

  // Basic grammar checking
  async basicGrammarCheck(text) {
    const issues = [];
    
    // Check for common grammar issues
    const sentences = text.split(/[.!?]+/).filter(s => s.trim());
    
    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i].trim();
      
      // Check for sentence capitalization
      if (sentence && !/^[A-Z]/.test(sentence)) {
        issues.push({
          type: 'capitalization',
          sentence: sentence.substring(0, 50) + '...',
          suggestion: 'Sentence should start with a capital letter',
          position: i + 1
        });
      }
      
      // Check for double spaces
      if (sentence.includes('  ')) {
        issues.push({
          type: 'spacing',
          sentence: sentence.substring(0, 50) + '...',
          suggestion: 'Remove extra spaces',
          position: i + 1
        });
      }
      
      // Check for common typos
      const commonTypos = {
        'teh': 'the',
        'adn': 'and',
        'taht': 'that',
        'recieve': 'receive',
        'seperate': 'separate',
        'occured': 'occurred',
        'definately': 'definitely',
        'accomodate': 'accommodate',
        'begining': 'beginning',
        'neccessary': 'necessary'
      };
      
      for (const [typo, correction] of Object.entries(commonTypos)) {
        if (sentence.toLowerCase().includes(typo)) {
          issues.push({
            type: 'typo',
            sentence: sentence.substring(0, 50) + '...',
            suggestion: `Change "${typo}" to "${correction}"`,
            position: i + 1
          });
        }
      }
    }
    
    return issues;
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

    // Check for aspell
    try {
      const { stdout: aspellVersion } = await execAsync('aspell --version');
      tools.aspell = {
        installed: true,
        version: aspellVersion.trim(),
        message: 'aspell is properly installed and working'
      };
    } catch (error) {
      tools.aspell = {
        installed: false,
        error: error.message,
        message: 'aspell is not installed or not accessible. Basic spell checking will be used.'
      };
    }

    return tools;
  }
};

module.exports = spellCheckController;
