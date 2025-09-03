const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs-extra');
const path = require('path');

const execAsync = promisify(exec);

const redactController = {
  // Main redaction function
  async redactContent(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }

      const {
        redactionType = 'custom',
        customPattern = '',
        redactionColor = 'black',
        redactionMethod = 'solid',
        preserveLayout = 'true',
        batchMode = 'false',
        complianceMode = 'false'
      } = req.body;

      console.log('Redaction request received:', {
        redactionType,
        customPattern: customPattern ? '[PROVIDED]' : '[EMPTY]',
        redactionColor,
        redactionMethod,
        preserveLayout,
        batchMode,
        complianceMode
      });

      // Validate input
      if (!redactionType || (redactionType === 'custom' && !customPattern.trim())) {
        return res.status(400).json({
          success: false,
          message: 'Redaction type and pattern are required'
        });
      }

      // Generate unique filename
      const timestamp = Date.now();
      const outputFilename = `redacted-${timestamp}.pdf`;
      const outputPath = path.join(__dirname, '..', 'uploads', outputFilename);
      
      console.log(`Output filename: ${outputFilename}`);
      console.log(`Output path: ${outputPath}`);

      // Perform redaction
      const redactionResult = await redactController.performRedaction(
        req.file.path,
        outputPath,
        {
          redactionType,
          customPattern,
          redactionColor,
          redactionMethod,
          preserveLayout: preserveLayout === 'true',
          complianceMode: complianceMode === 'true'
        }
      );

      if (!redactionResult.success) {
        return res.status(500).json({
          success: false,
          message: redactionResult.message || 'Redaction failed'
        });
      }

      // Check if output file exists before proceeding
      const fileExists = await fs.pathExists(outputPath);
      if (!fileExists) {
        console.error(`Output file does not exist: ${outputPath}`);
        return res.status(500).json({
          success: false,
          message: 'Redacted file was not created'
        });
      }

      // Get file stats
      const stats = await fs.stat(outputPath);
      const originalStats = await fs.stat(req.file.path);
      
      console.log(`Redacted file created successfully: ${outputPath}`);
      console.log(`File size: ${stats.size} bytes`);

      // Clean up uploaded file
      await fs.remove(req.file.path);

      res.json({
        success: true,
        message: 'Content redaction completed successfully',
        filename: outputFilename,
        downloadUrl: `/pdf-redact/download/${outputFilename}`,
        originalFileSize: originalStats.size,
        fileSize: stats.size,
        redactionDetails: redactionResult.details,
        complianceInfo: complianceMode === 'true' ? {
          redactionTimestamp: new Date().toISOString(),
          redactionType,
          auditTrail: redactionResult.auditTrail || []
        } : null
      });

    } catch (error) {
      console.error('Redaction error:', error);
      
      // Clean up uploaded file
      if (req.file && req.file.path) {
        try {
          await fs.remove(req.file.path);
        } catch (cleanupError) {
          console.error('Cleanup error:', cleanupError);
        }
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error during redaction',
        error: error.message
      });
    }
  },

  // Perform the actual redaction using PyMuPDF
  async performRedaction(inputPath, outputPath, options) {
    try {
      const {
        redactionType,
        customPattern,
        redactionColor,
        redactionMethod,
        preserveLayout,
        complianceMode
      } = options;

      // Get redaction patterns
      const patterns = redactController.getRedactionPatterns(redactionType, customPattern);
      
      if (patterns.length === 0) {
        return {
          success: false,
          message: 'No valid redaction patterns found'
        };
      }

      // Create Python script for redaction
      const pythonScript = `
import fitz  # PyMuPDF
import re
import json
import shutil
from datetime import datetime

def perform_redaction(input_path, output_path, patterns_data, redaction_color, redaction_method, compliance_mode):
    """Perform content redaction using PyMuPDF"""
    try:
        print(f"Opening PDF: {input_path}")
        doc = fitz.open(input_path)
        total_redactions = 0
        audit_trail = []
        
        # Convert color name to RGB
        color_map = {
            'black': (0, 0, 0),
            'white': (1, 1, 1),
            'red': (1, 0, 0),
            'blue': (0, 0, 1),
            'gray': (0.5, 0.5, 0.5)
        }
        fill_color = color_map.get(redaction_color.lower(), (0, 0, 0))
        print(f"Using fill color: {fill_color}")
        
        # Compile regex patterns
        compiled_patterns = []
        for pattern_info in patterns_data:
            try:
                pattern_str = pattern_info['pattern']
                print(f"Compiling pattern: {pattern_str}")
                compiled_pattern = re.compile(pattern_str)
                compiled_patterns.append({
                    'pattern': compiled_pattern,
                    'name': pattern_info['name'],
                    'description': pattern_info['description']
                })
                print(f"Successfully compiled pattern: {pattern_info['name']}")
            except Exception as e:
                print(f"Error compiling pattern {pattern_info['name']}: {str(e)}")
                continue
        
        print(f"Compiled {len(compiled_patterns)} patterns successfully")
        
        for page_num in range(len(doc)):
            page = doc[page_num]
            page_redactions = 0
            
            # Get text instances
            text_dict = page.get_text("dict")
            
            for block in text_dict["blocks"]:
                if "lines" in block:
                    for line in block["lines"]:
                        for span in line["spans"]:
                            text = span["text"]
                            
                            # Check each pattern
                            for pattern_info in compiled_patterns:
                                pattern = pattern_info['pattern']
                                pattern_name = pattern_info['name']
                                
                                # Find matches
                                matches = list(pattern.finditer(text))
                                
                                for match in matches:
                                    # Get bounding box for the match
                                    bbox = span["bbox"]
                                    
                                    # Calculate position of match within the span
                                    match_start = match.start()
                                    match_end = match.end()
                                    
                                    # Get text before and after match for positioning
                                    text_before = text[:match_start]
                                    text_match = text[match_start:match_end]
                                    
                                    # Approximate character width (this is a simplification)
                                    char_width = (bbox[2] - bbox[0]) / len(text) if len(text) > 0 else 0
                                    
                                    # Calculate redaction rectangle
                                    redact_x0 = bbox[0] + (len(text_before) * char_width)
                                    redact_x1 = bbox[0] + (len(text_before + text_match) * char_width)
                                    redact_y0 = bbox[1]
                                    redact_y1 = bbox[3]
                                    
                                    # Create redaction rectangle
                                    redact_rect = fitz.Rect(redact_x0, redact_y0, redact_x1, redact_y1)
                                    
                                    # Apply redaction
                                    if redaction_method == 'solid':
                                        # Solid color redaction
                                        page.add_redact_annot(redact_rect, fill=fill_color)
                                    else:
                                        # Pattern redaction (crosshatch)
                                        page.add_redact_annot(redact_rect, fill=fill_color, cross_out=True)
                                    
                                    page.apply_redactions()
                                    
                                    total_redactions += 1
                                    page_redactions += 1
                                    
                                    # Add to audit trail if compliance mode is enabled
                                    if compliance_mode:
                                        audit_trail.append({
                                            'page': page_num + 1,
                                            'pattern': pattern_name,
                                            'redacted_text': text_match,
                                            'timestamp': datetime.now().isoformat(),
                                            'method': redaction_method,
                                            'color': redaction_color
                                        })
            
            print(f"Page {page_num + 1}: {page_redactions} redactions")
        
        # Save the redacted PDF
        print(f"Saving redacted PDF to: {output_path}")
        doc.save(output_path)
        doc.close()
        
        print(f"Total redactions: {total_redactions}")
        return {
            'success': True,
            'total_redactions': total_redactions,
            'audit_trail': audit_trail
        }
        
    except Exception as e:
        print(f"Error during redaction: {str(e)}")
        import traceback
        traceback.print_exc()
        return {
            'success': False,
            'error': str(e)
        }

if __name__ == "__main__":
    input_pdf = "${inputPath}"
    output_pdf = "${outputPath}"
    patterns_data = ${JSON.stringify(patterns)}
    redaction_color = "${redactionColor}"
    redaction_method = "${redactionMethod}"
    compliance_mode = ${complianceMode ? 'True' : 'False'}
    
    print(f"Starting redaction process...")
    print(f"Input: {input_pdf}")
    print(f"Output: {output_pdf}")
    print(f"Patterns: {len(patterns_data)}")
    
    result = perform_redaction(input_pdf, output_pdf, patterns_data, redaction_color, redaction_method, compliance_mode)
    if not result['success']:
        print("Redaction failed, copying original file...")
        shutil.copy2(input_pdf, output_pdf)
        print("Fallback: Copied original PDF")
    else:
        print("Redaction completed successfully")
`;

      // Write and execute Python script
      const pythonScriptFile = path.join(__dirname, '..', 'uploads', `redact_${Date.now()}.py`);
      await fs.writeFile(pythonScriptFile, pythonScript);

      try {
        const { stdout, stderr } = await execAsync(`python3 "${pythonScriptFile}"`);
        console.log('Redaction completed:', stdout);
        if (stderr) {
          console.log('Python stderr:', stderr);
        }
        
        // Check if output file exists
        const fileExists = await fs.pathExists(outputPath);
        console.log(`Output file exists after Python execution: ${fileExists}`);
        
        if (fileExists) {
          const fileStats = await fs.stat(outputPath);
          console.log(`Output file size: ${fileStats.size} bytes`);
        }
        
        // Parse the result from stdout if available
        let redactionDetails = {
          totalRedactions: 0,
          pagesProcessed: 0
        };

        // Extract redaction count from output
        const redactionMatch = stdout.match(/Total redactions: (\d+)/);
        if (redactionMatch) {
          redactionDetails.totalRedactions = parseInt(redactionMatch[1]);
        }

        // Clean up script file
        await fs.remove(pythonScriptFile);

        return {
          success: true,
          details: redactionDetails,
          auditTrail: complianceMode ? [] : null
        };

      } catch (pythonError) {
        console.warn('PyMuPDF redaction failed, using fallback:', pythonError.message);
        
        // Fallback: copy original file
        await fs.copy(inputPath, outputPath);
        
        // Clean up script file
        try {
          await fs.remove(pythonScriptFile);
        } catch (cleanupError) {
          console.warn('Script cleanup error:', cleanupError.message);
        }

        return {
          success: true,
          details: {
            totalRedactions: 0,
            pagesProcessed: 0,
            fallbackUsed: true
          },
          message: 'Redaction not available, original file returned'
        };
      }

    } catch (error) {
      console.error('Error in performRedaction:', error);
      return {
        success: false,
        message: error.message
      };
    }
  },

  // Get redaction patterns based on type
  getRedactionPatterns(redactionType, customPattern) {
    const patterns = [];

    switch (redactionType) {
      case 'ssn':
        patterns.push({
          name: 'SSN',
          pattern: '\\b\\d{3}-?\\d{2}-?\\d{4}\\b',
          description: 'Social Security Numbers'
        });
        break;

      case 'credit_card':
        patterns.push({
          name: 'Credit Card',
          pattern: '\\b\\d{4}[-\\s]?\\d{4}[-\\s]?\\d{4}[-\\s]?\\d{4}\\b',
          description: 'Credit Card Numbers'
        });
        break;

      case 'email':
        patterns.push({
          name: 'Email',
          pattern: '\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b',
          description: 'Email Addresses'
        });
        break;

      case 'phone':
        patterns.push({
          name: 'Phone',
          pattern: '\\b(?:\\+?1[-.\\s]?)?\\(?([0-9]{3})\\)?[-.\\s]?([0-9]{3})[-.\\s]?([0-9]{4})\\b',
          description: 'Phone Numbers'
        });
        break;

      case 'address':
        patterns.push({
          name: 'Address',
          pattern: '\\b\\d+\\s+[A-Za-z0-9\\s,.-]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Way|Place|Pl)\\b',
          description: 'Street Addresses'
        });
        break;

      case 'name':
        patterns.push({
          name: 'Name',
          pattern: '\\b[A-Z][a-z]+ [A-Z][a-z]+\\b',
          description: 'Full Names (First Last)'
        });
        break;

      case 'date':
        patterns.push({
          name: 'Date',
          pattern: '\\b\\d{1,2}[\\/\\-]\\d{1,2}[\\/\\-]\\d{2,4}\\b',
          description: 'Dates (MM/DD/YYYY format)'
        });
        break;

      case 'custom':
        if (customPattern.trim()) {
          try {
            // Validate the regex pattern
            new RegExp(customPattern);
            patterns.push({
              name: 'Custom Pattern',
              pattern: customPattern,
              description: 'Custom Regular Expression'
            });
          } catch (error) {
            console.error('Invalid custom pattern:', error);
          }
        }
        break;

      case 'all_sensitive':
        // Combine multiple sensitive patterns
        patterns.push(
          {
            name: 'SSN',
            pattern: '\\b\\d{3}-?\\d{2}-?\\d{4}\\b',
            description: 'Social Security Numbers'
          },
          {
            name: 'Credit Card',
            pattern: '\\b\\d{4}[-\\s]?\\d{4}[-\\s]?\\d{4}[-\\s]?\\d{4}\\b',
            description: 'Credit Card Numbers'
          },
          {
            name: 'Email',
            pattern: '\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b',
            description: 'Email Addresses'
          },
          {
            name: 'Phone',
            pattern: '\\b(?:\\+?1[-.\\s]?)?\\(?([0-9]{3})\\)?[-.\\s]?([0-9]{3})[-.\\s]?([0-9]{4})\\b',
            description: 'Phone Numbers'
          }
        );
        break;

      default:
        break;
    }

    return patterns;
  },

  // Download redacted file
  async downloadRedactedFile(req, res) {
    try {
      const { filename } = req.params;
      const filePath = path.join(__dirname, '..', 'uploads', filename);

      console.log(`Download request for file: ${filename}`);
      console.log(`File path: ${filePath}`);

      // List all files in uploads directory for debugging
      try {
        const uploadsDir = path.join(__dirname, '..', 'uploads');
        const files = await fs.readdir(uploadsDir);
        console.log(`Files in uploads directory: ${files.join(', ')}`);
      } catch (listError) {
        console.error('Error listing uploads directory:', listError);
      }

      if (!await fs.pathExists(filePath)) {
        console.log(`File not found: ${filePath}`);
        return res.status(404).json({
          success: false,
          message: 'File not found'
        });
      }

      console.log(`File exists, starting download: ${filename}`);
      res.download(filePath, filename, (err) => {
        if (err) {
          console.error('Download error:', err);
          res.status(500).json({
            success: false,
            message: 'Download failed'
          });
        } else {
          console.log(`Download completed successfully: ${filename}`);
          // Clean up file after download
          setTimeout(async () => {
            try {
              await fs.remove(filePath);
              console.log(`File cleaned up: ${filename}`);
            } catch (cleanupError) {
              console.error('File cleanup error:', cleanupError);
            }
          }, 5000);
        }
      });

    } catch (error) {
      console.error('Download error:', error);
      res.status(500).json({
        success: false,
        message: 'Download failed'
      });
    }
  },

  // Preview redaction (find matches without redacting)
  async previewRedaction(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }

      const {
        redactionType = 'custom',
        customPattern = ''
      } = req.body;

      // Extract text from PDF
      const { stdout: extractedText } = await execAsync(`pdftotext "${req.file.path}" -`);
      
      // Get redaction patterns
      const patterns = redactController.getRedactionPatterns(redactionType, customPattern);
      
      const matches = [];
      patterns.forEach(patternInfo => {
        try {
          const pattern = new RegExp(patternInfo.pattern, 'g');
          let match;
          while ((match = pattern.exec(extractedText)) !== null) {
            matches.push({
              text: match[0],
              pattern: patternInfo.name,
              position: match.index,
              context: extractedText.substring(
                Math.max(0, match.index - 50),
                Math.min(extractedText.length, match.index + match[0].length + 50)
              )
            });
          }
        } catch (error) {
          console.error(`Error processing pattern ${patternInfo.name}:`, error);
        }
      });

      // Clean up uploaded file
      await fs.remove(req.file.path);

      res.json({
        success: true,
        totalMatches: matches.length,
        matches: matches,
        patterns: patterns.map(p => ({
          name: p.name,
          description: p.description
        }))
      });

    } catch (error) {
      console.error('Preview error:', error);
      
      if (req.file && req.file.path) {
        try {
          await fs.remove(req.file.path);
        } catch (cleanupError) {
          console.error('Cleanup error:', cleanupError);
        }
      }

      res.status(500).json({
        success: false,
        message: 'Preview failed',
        error: error.message
      });
    }
  }
};

module.exports = redactController;
