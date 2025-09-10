const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);
const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    fs.ensureDirSync(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `highlight-${uniqueSuffix}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

// Highlight text in PDF
router.post('/highlight-text', upload.single('file'), async (req, res) => {
  try {
    console.log('Highlight request received:', {
      highlightsCount: req.body.highlights ? JSON.parse(req.body.highlights).length : 0,
      preserveLayout: req.body.preserveLayout,
      outputFormat: req.body.outputFormat
    });

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const inputPath = req.file.path;
    const outputFilename = `highlighted-${Date.now()}.pdf`;
    const outputPath = path.join(path.dirname(inputPath), outputFilename);

    const highlights = req.body.highlights ? JSON.parse(req.body.highlights) : [];
    const preserveLayout = req.body.preserveLayout === 'true';
    const outputFormat = req.body.outputFormat || 'pdf';

    if (highlights.length === 0) {
      return res.status(400).json({ error: 'No highlights provided' });
    }

    // Create Python script for highlighting
    const pythonScript = createHighlightScript(inputPath, outputPath, highlights, preserveLayout, outputFormat);
    const scriptsDir = path.join(__dirname, '../scripts');
    await fs.ensureDir(scriptsDir);
    const scriptPath = path.join(scriptsDir, `highlight_${Date.now()}.py`);
    
    await fs.writeFile(scriptPath, pythonScript);

    console.log('Highlighting PDF with Python script...');
    console.log('Input:', inputPath);
    console.log('Output:', outputPath);
    console.log('Highlights:', highlights.length);
    console.log('Script path:', scriptPath);

    // Check if script file exists
    const scriptExists = await fs.pathExists(scriptPath);
    console.log('Script exists:', scriptExists);
    
    if (scriptExists) {
      const scriptContent = await fs.readFile(scriptPath, 'utf8');
      console.log('Script content length:', scriptContent.length);
      console.log('Script first 200 chars:', scriptContent.substring(0, 200));
    }

    const { stdout, stderr } = await execAsync(`python3 "${scriptPath}"`);
    
    if (stderr) {
      console.error('Python script stderr:', stderr);
    }

    console.log('Python script stdout:', stdout);
    
    // Check if the script execution was successful
    if (stderr && stderr.includes('ModuleNotFoundError')) {
      throw new Error(`Python module not found: ${stderr}`);
    }

    // Check if output file exists
    const outputExists = await fs.pathExists(outputPath);
    if (!outputExists) {
      throw new Error('Highlighted PDF was not created');
    }

    const stats = await fs.stat(outputPath);
    const originalStats = await fs.stat(inputPath);

    console.log('Highlighted file created successfully:', outputPath);
    console.log('File size:', stats.size, 'bytes');

    // Clean up temporary files
    await fs.remove(scriptPath);
    await fs.remove(inputPath);

    const response = {
      success: true,
      message: 'Text highlighting completed successfully',
      filename: outputFilename,
      downloadUrl: `/pdf-highlight/download/${outputFilename}`,
      totalPages: 0, // Will be calculated by Python script
      fileSize: stats.size,
      originalFileSize: originalStats.size,
      highlightResults: {
        totalHighlights: highlights.length,
        highlights: highlights,
        pagesAffected: [...new Set(highlights.map(h => h.pageNumber))],
        processingTime: 0
      },
      extractedText: ''
    };

    res.json(response);

  } catch (error) {
    console.error('Highlight error:', error);
    res.status(500).json({ 
      error: 'Highlight failed', 
      message: error.message 
    });
  }
});

// Preview highlights without making changes
router.post('/preview-highlights', upload.single('file'), async (req, res) => {
  try {
    console.log('Preview highlights request received');

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const inputPath = req.file.path;
    const searchText = req.body.searchText || '';
    const useRegex = req.body.useRegex === 'true';
    const caseSensitive = req.body.caseSensitive === 'true';

    // Create Python script for preview
    const pythonScript = createPreviewScript(inputPath, searchText, useRegex, caseSensitive);
    const scriptsDir = path.join(__dirname, '../scripts');
    await fs.ensureDir(scriptsDir);
    const scriptPath = path.join(scriptsDir, `preview_${Date.now()}.py`);
    
    await fs.writeFile(scriptPath, pythonScript);

    console.log('Previewing highlights with Python script...');

    const { stdout, stderr } = await execAsync(`python3 "${scriptPath}"`);
    
    if (stderr) {
      console.error('Python script stderr:', stderr);
    }

    // Check if the script execution was successful
    if (stderr && stderr.includes('ModuleNotFoundError')) {
      throw new Error(`Python module not found: ${stderr}`);
    }

    // Parse JSON output, handle any extra text
    let jsonOutput = stdout.trim();
    
    // Find JSON object in the output (in case there's extra text)
    const jsonStart = jsonOutput.indexOf('{');
    const jsonEnd = jsonOutput.lastIndexOf('}') + 1;
    
    if (jsonStart !== -1 && jsonEnd > jsonStart) {
      jsonOutput = jsonOutput.substring(jsonStart, jsonEnd);
    }
    
    console.log('JSON output to parse:', jsonOutput);
    const result = JSON.parse(jsonOutput);

    // Clean up temporary files
    await fs.remove(scriptPath);
    await fs.remove(inputPath);

    res.json({
      success: true,
      message: 'Preview completed successfully',
      totalMatches: result.totalMatches,
      matches: result.matches,
      pages: result.pages,
      extractedText: result.extractedText
    });

  } catch (error) {
    console.error('Preview error:', error);
    res.status(500).json({ 
      error: 'Preview failed', 
      message: error.message 
    });
  }
});

// Download highlighted file
router.get('/download/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, '../uploads', filename);

    console.log('Download request for file:', filename);
    console.log('File path:', filePath);

    if (!fs.existsSync(filePath)) {
      console.log('File not found:', filePath);
      return res.status(404).json({ error: 'File not found' });
    }

    res.download(filePath, filename, (err) => {
      if (err) {
        console.error('Download error:', err);
        res.status(500).json({ error: 'Download failed' });
      } else {
        console.log('File downloaded successfully:', filename);
      }
    });

  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'Download failed' });
  }
});

// Get highlight presets
router.get('/presets', (req, res) => {
  const presets = [
    {
      id: 'yellow-highlight',
      name: 'Yellow Highlight',
      description: 'Standard yellow highlighting',
      style: {
        color: '#FFFF00',
        opacity: 0.3,
        type: 'highlight',
        thickness: 1
      },
      category: 'standard',
      isDefault: true
    },
    {
      id: 'red-underline',
      name: 'Red Underline',
      description: 'Red underline for important text',
      style: {
        color: '#FF0000',
        opacity: 0.8,
        type: 'underline',
        thickness: 2
      },
      category: 'standard',
      isDefault: true
    },
    {
      id: 'green-strikethrough',
      name: 'Green Strikethrough',
      description: 'Green strikethrough for corrections',
      style: {
        color: '#00FF00',
        opacity: 0.6,
        type: 'strikethrough',
        thickness: 2
      },
      category: 'standard',
      isDefault: true
    },
    {
      id: 'blue-squiggly',
      name: 'Blue Squiggly',
      description: 'Blue squiggly underline for suggestions',
      style: {
        color: '#0000FF',
        opacity: 0.7,
        type: 'squiggly',
        thickness: 1
      },
      category: 'standard',
      isDefault: true
    }
  ];

  res.json({ presets });
});

// Test tools installation
router.get('/test-tools', async (req, res) => {
  try {
    // Test Python version
    const { stdout: pythonVersion } = await execAsync('python3 --version');
    
    // Test PyMuPDF import
    const testScript = `
import sys
try:
    import fitz
    print("PyMuPDF version:", fitz.version)
    print("PyMuPDF available: True")
except ImportError as e:
    print("PyMuPDF import error:", str(e))
    print("PyMuPDF available: False")
    sys.exit(1)
`;
    
    const testScriptPath = path.join(__dirname, '../scripts', 'test_pymupdf.py');
    await fs.ensureDir(path.dirname(testScriptPath));
    await fs.writeFile(testScriptPath, testScript);
    
    const { stdout: pymupdfTest, stderr } = await execAsync(`python3 "${testScriptPath}"`);
    
    // Clean up test script
    await fs.remove(testScriptPath);
    
    res.json({ 
      success: true, 
      message: 'Python and PyMuPDF are available',
      pythonVersion: pythonVersion.trim(),
      pymupdfTest: pymupdfTest.trim(),
      stderr: stderr || null
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Python or PyMuPDF is not available',
      error: error.message 
    });
  }
});

// Helper function to create highlighting Python script
function createHighlightScript(inputPath, outputPath, highlights, preserveLayout, outputFormat) {
  return `
import fitz
import json
import sys
import os

def highlight_pdf(input_path, output_path, highlights, preserve_layout=True, output_format='pdf'):
    try:
        # Open the PDF
        doc = fitz.open(input_path)
        
        # Processing highlights
        
        # Process each highlight
        for i, highlight in enumerate(highlights):
            page_num = highlight['pageNumber'] - 1  # Convert to 0-based index
            
            if page_num >= len(doc):
                print(f"Warning: Page {highlight['pageNumber']} does not exist")
                continue
                
            page = doc[page_num]
            highlight_text = highlight.get('text', '')
            
            # Get highlight style
            style = highlight.get('style', {})
            color = style.get('color', '#FFFF00')
            opacity = style.get('opacity', 0.3)
            highlight_type = style.get('type', 'highlight')
            thickness = style.get('thickness', 1)
            
            # Convert hex color to RGB
            if color.startswith('#'):
                color = color[1:]
            r = int(color[0:2], 16) / 255.0
            g = int(color[2:4], 16) / 255.0
            b = int(color[4:6], 16) / 255.0
            
            # Find text instances on the page
            text_instances = page.search_for(highlight_text)
            
            if not text_instances:
                # Text not found, using fallback position
                # Use provided position as fallback
                pos = highlight.get('position', {})
                x = pos.get('x', 0)
                y = pos.get('y', 0)
                width = pos.get('width', 100)
                height = pos.get('height', 20)
                rect = fitz.Rect(x, y, x + width, y + height)
            else:
                # Use the first found instance
                rect = text_instances[0]
                # Found text at position
            
            # Apply highlight based on type
            if highlight_type == 'highlight':
                # Create highlight annotation
                annot = page.add_highlight_annot(rect)
                annot.set_colors(stroke=(r, g, b))
                annot.set_opacity(opacity)
                annot.update()
                
            elif highlight_type == 'underline':
                # Create underline annotation
                annot = page.add_underline_annot(rect)
                annot.set_colors(stroke=(r, g, b))
                annot.set_opacity(opacity)
                annot.set_border(width=thickness)
                annot.update()
                
            elif highlight_type == 'strikethrough':
                # Create strikethrough annotation
                annot = page.add_strikeout_annot(rect)
                annot.set_colors(stroke=(r, g, b))
                annot.set_opacity(opacity)
                annot.set_border(width=thickness)
                annot.update()
                
            elif highlight_type == 'squiggly':
                # Create squiggly underline annotation
                annot = page.add_squiggly_annot(rect)
                annot.set_colors(stroke=(r, g, b))
                annot.set_opacity(opacity)
                annot.set_border(width=thickness)
                annot.update()
            
            # Added highlight
        
        # Save the document
        if output_format == 'pdfa':
            doc.save(output_path, garbage=4, deflate=True, clean=True)
        else:
            doc.save(output_path)
        
        doc.close()
        
        # Highlighted PDF saved
        return True
        
    except Exception as e:
        # Error highlighting PDF
        return False

# Main execution
if __name__ == "__main__":
    input_path = "${inputPath.replace(/\\/g, '\\\\')}"
    output_path = "${outputPath.replace(/\\/g, '\\\\')}"
    highlights = ${JSON.stringify(highlights)}
    preserve_layout = ${preserveLayout ? 'True' : 'False'}
    output_format = "${outputFormat}"
    
    success = highlight_pdf(input_path, output_path, highlights, preserve_layout, output_format)
    
    if success:
        print("Highlighting completed successfully")
    else:
        print("Highlighting failed")
        sys.exit(1)
`;
}

// Helper function to create preview Python script
function createPreviewScript(inputPath, searchText, useRegex, caseSensitive) {
  return `
import fitz
import re
import json
import sys

def preview_highlights(input_path, search_text, use_regex=False, case_sensitive=True):
    try:
        doc = fitz.open(input_path)
        matches = []
        pages = {}
        
        for page_num in range(len(doc)):
            page = doc[page_num]
            text = page.get_text()
            
            if not search_text:
                continue
                
            # Prepare search pattern
            if use_regex:
                try:
                    flags = 0 if case_sensitive else re.IGNORECASE
                    pattern = re.compile(search_text, flags)
                except re.error as e:
                    print(f"Invalid regex pattern: {e}")
                    continue
            else:
                pattern = re.compile(re.escape(search_text), 0 if case_sensitive else re.IGNORECASE)
            
            # Find matches
            for match in pattern.finditer(text):
                match_text = match.group()
                start_pos = match.start()
                end_pos = match.end()
                
                # Get context
                context_start = max(0, start_pos - 50)
                context_end = min(len(text), end_pos + 50)
                context = text[context_start:context_end]
                
                # Get coordinates (approximate)
                rects = page.search_for(match_text)
                if rects:
                    rect = rects[0]
                    x, y, width, height = rect.x0, rect.y0, rect.width, rect.height
                else:
                    x, y, width, height = 100, 100, 100, 20
                
                match_data = {
                    "text": match_text,
                    "position": start_pos,
                    "page": page_num + 1,
                    "context": context,
                    "contextStart": context_start,
                    "contextEnd": context_end,
                    "matchStart": start_pos - context_start,
                    "matchEnd": end_pos - context_start,
                    "coordinates": {
                        "x": x,
                        "y": y,
                        "width": width,
                        "height": height
                    }
                }
                
                matches.append(match_data)
                
                # Group by page
                if page_num + 1 not in pages:
                    pages[page_num + 1] = []
                pages[page_num + 1].append(match_data)
        
        # Convert pages to array format
        pages_array = []
        for page_num in sorted(pages.keys()):
            pages_array.append({
                "page": page_num,
                "matchCount": len(pages[page_num]),
                "matches": pages[page_num]
            })
        
        result = {
            "totalMatches": len(matches),
            "matches": matches,
            "pages": pages_array,
            "extractedText": text[:1000] if 'text' in locals() else ""
        }
        
        # Output only JSON, no extra text
        print(json.dumps(result))
        
    except Exception as e:
        # Error previewing highlights
        sys.exit(1)
    finally:
        if 'doc' in locals():
            doc.close()

# Main execution
if __name__ == "__main__":
    input_path = "${inputPath.replace(/\\/g, '\\\\')}"
    search_text = "${searchText}"
    use_regex = ${useRegex ? 'True' : 'False'}
    case_sensitive = ${caseSensitive ? 'True' : 'False'}
    
    preview_highlights(input_path, search_text, use_regex, case_sensitive)
`;
}

module.exports = router;
