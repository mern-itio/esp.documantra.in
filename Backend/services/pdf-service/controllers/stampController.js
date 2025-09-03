const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs-extra');
const path = require('path');

const execAsync = promisify(exec);

const stampController = {
  // Main stamp function
  async addStamps(req, res) {
    let pdfFile = null;
    let customImageFile = null;
    
    try {
      if (!req.files || !req.files.file || !req.files.file[0]) {
        return res.status(400).json({
          success: false,
          message: 'No PDF file uploaded'
        });
      }

      pdfFile = req.files.file[0];
      customImageFile = req.files.customImage ? req.files.customImage[0] : null;

      const {
        stampType = 'approved',
        customText = '',
        position = 'bottom-right',
        pageNumber = 'all',
        stampColor = 'red',
        stampSize = 'medium',
        includeDate = 'false',
        dateFormat = 'MM/DD/YYYY',
        opacity = '0.8'
      } = req.body;

      console.log('Stamp request received:', {
        stampType,
        customText: customText || '[EMPTY]',
        customTextLength: customText ? customText.length : 0,
        customImage: customImageFile ? '[PROVIDED]' : '[EMPTY]',
        position,
        pageNumber,
        stampColor,
        stampSize,
        includeDate,
        dateFormat,
        opacity
      });

      // Validate input
      if (stampType === 'custom' && !customText.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Custom text is required for custom stamps'
        });
      }

      if (stampType === 'custom-image' && !customImageFile) {
        return res.status(400).json({
          success: false,
          message: 'Custom image is required for custom image stamps'
        });
      }

      // Generate unique filename
      const timestamp = Date.now();
      const outputFilename = `stamped-${timestamp}.pdf`;
      const outputPath = path.join(__dirname, '..', 'uploads', outputFilename);

      // Perform stamping
      const stampResult = await stampController.performStamping(
        pdfFile.path,
        outputPath,
        {
          stampType,
          customText,
          customImagePath: customImageFile ? customImageFile.path : null,
          position,
          pageNumber,
          stampColor,
          stampSize,
          includeDate: includeDate === 'true',
          dateFormat,
          opacity: parseFloat(opacity)
        }
      );

      if (!stampResult.success) {
        return res.status(500).json({
          success: false,
          message: stampResult.message || 'Stamping failed'
        });
      }

      // Get file stats
      const stats = await fs.stat(outputPath);
      const originalStats = await fs.stat(pdfFile.path);

      // Clean up uploaded files
      await fs.remove(pdfFile.path);
      if (customImageFile) {
        await fs.remove(customImageFile.path);
      }

      res.json({
        success: true,
        message: 'Stamps added successfully',
        filename: outputFilename,
        downloadUrl: `/pdf-stamps/download/${outputFilename}`,
        originalFileSize: originalStats.size,
        fileSize: stats.size,
        stampDetails: stampResult.details
      });

    } catch (error) {
      console.error('Stamping error:', error);
      
      // Clean up uploaded files
      if (pdfFile && pdfFile.path) {
        try {
          await fs.remove(pdfFile.path);
        } catch (cleanupError) {
          console.error('PDF cleanup error:', cleanupError);
        }
      }
      if (customImageFile && customImageFile.path) {
        try {
          await fs.remove(customImageFile.path);
        } catch (cleanupError) {
          console.error('Image cleanup error:', cleanupError);
        }
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error during stamping',
        error: error.message
      });
    }
  },

  // Perform the actual stamping using PyMuPDF
  async performStamping(inputPath, outputPath, options) {
    try {
      const {
        stampType,
        customText,
        customImagePath,
        position,
        pageNumber,
        stampColor,
        stampSize,
        includeDate,
        dateFormat,
        opacity
      } = options;

      // Create Python script for stamping
      const pythonScript = `
import fitz  # PyMuPDF
import re
import json
from datetime import datetime

def add_stamps(input_path, output_path, stamp_type, custom_text, custom_image_path, position, page_number, stamp_color, stamp_size, include_date, date_format, opacity):
    """Add stamps to PDF using PyMuPDF"""
    try:
        doc = fitz.open(input_path)
        total_stamps = 0
        
        # Convert color name to RGB
        color_map = {
            'red': (1, 0, 0),
            'blue': (0, 0, 1),
            'green': (0, 1, 0),
            'black': (0, 0, 0),
            'gray': (0.5, 0.5, 0.5),
            'orange': (1, 0.5, 0),
            'purple': (0.5, 0, 1)
        }
        stamp_color_rgb = color_map.get(stamp_color.lower(), (1, 0, 0))
        
        # Size mapping
        size_map = {
            'small': 12,
            'medium': 16,
            'large': 20,
            'xlarge': 24
        }
        font_size = size_map.get(stamp_size.lower(), 16)
        
        # Position mapping
        position_map = {
            'top-left': (50, 50),
            'top-center': (300, 50),
            'top-right': (550, 50),
            'center-left': (50, 400),
            'center': (300, 400),
            'center-right': (550, 400),
            'bottom-left': (50, 750),
            'bottom-center': (300, 750),
            'bottom-right': (550, 750)
        }
        
        # Get stamp text or image
        if stamp_type == 'custom-image' and custom_image_path:
            # Handle custom image stamp
            stamp_image_path = custom_image_path
            stamp_text = None
        else:
            # Handle text stamp
            stamp_text = custom_text if stamp_type == 'custom' else stamp_type.replace('_', ' ').title()
            stamp_image_path = None
            
            # Add date if requested
            if include_date:
                current_date = datetime.now().strftime(date_format.replace('MM', '%m').replace('DD', '%d').replace('YYYY', '%Y'))
                stamp_text += f"\\n{current_date}"
        
        # Determine which pages to stamp
        pages_to_stamp = []
        if page_number == 'all':
            pages_to_stamp = list(range(len(doc)))
        else:
            try:
                page_num = int(page_number) - 1  # Convert to 0-based index
                if 0 <= page_num < len(doc):
                    pages_to_stamp = [page_num]
            except ValueError:
                pages_to_stamp = list(range(len(doc)))
        
        print(f"Stamping {len(pages_to_stamp)} pages")
        
        for page_idx in pages_to_stamp:
            page = doc[page_idx]
            page_rect = page.rect
            
            # Calculate position based on page size
            base_x, base_y = position_map.get(position, (550, 750))
            
            # Adjust position based on page size
            if page_rect.width > 0:
                x = min(base_x, page_rect.width - 200)
            else:
                x = base_x
                
            if page_rect.height > 0:
                y = min(base_y, page_rect.height - 50)
            else:
                y = base_y
            
            if stamp_image_path:
                # Handle image stamp
                try:
                    # Open the image
                    img = fitz.open(stamp_image_path)
                    img_rect = img[0].rect
                    
                    # Calculate image size (max 200x50)
                    max_width = 200
                    max_height = 50
                    scale_x = max_width / img_rect.width
                    scale_y = max_height / img_rect.height
                    scale = min(scale_x, scale_y)
                    
                    # Create image rectangle
                    img_width = img_rect.width * scale
                    img_height = img_rect.height * scale
                    img_rect = fitz.Rect(x, y, x + img_width, y + y + img_height)
                    
                    # Insert image
                    page.insert_image(img_rect, filename=stamp_image_path)
                    img.close()
                    
                except Exception as e:
                    print(f"Error inserting image: {str(e)}")
                    # Fallback to text stamp
                    stamp_text = "IMAGE ERROR"
                    stamp_image_path = None
            
            if not stamp_image_path and stamp_text:
                # Handle text stamp
                print(f"Adding text stamp: '{stamp_text}' at position ({x}, {y})")
                # Create stamp rectangle
                stamp_rect = fitz.Rect(x, y, x + 200, y + 50)
                
                # Add background rectangle
                page.draw_rect(stamp_rect, color=stamp_color_rgb, width=2)
                # Create a semi-transparent fill by adjusting the color values
                fill_color = tuple(c * opacity for c in stamp_color_rgb)
                page.draw_rect(stamp_rect, color=fill_color, fill=fill_color)
                
                # Add text
                text_rect = fitz.Rect(x + 10, y + 10, x + 190, y + 40)
                page.insert_textbox(
                    text_rect,
                    stamp_text,
                    fontsize=font_size,
                    color=(1, 1, 1),  # White text
                    align=1,  # Center alignment
                    fontname="helv"  # Helvetica font
                )
                print(f"Text stamp added successfully")
            else:
                print(f"Skipping text stamp - stamp_image_path: {stamp_image_path}, stamp_text: '{stamp_text}'")
            
            total_stamps += 1
            print(f"Added stamp to page {page_idx + 1}")
        
        # Save the stamped PDF
        doc.save(output_path)
        doc.close()
        
        print(f"Total stamps added: {total_stamps}")
        return {
            'success': True,
            'total_stamps': total_stamps,
            'pages_stamped': len(pages_to_stamp)
        }
        
    except Exception as e:
        print(f"Error during stamping: {str(e)}")
        import traceback
        traceback.print_exc()
        return {
            'success': False,
            'error': str(e)
        }

if __name__ == "__main__":
    input_pdf = "${inputPath}"
    output_pdf = "${outputPath}"
    stamp_type = "${stampType}"
    custom_text = "${customText}"
    custom_image_path = "${customImagePath || ''}"
    position = "${position}"
    page_number = "${pageNumber}"
    stamp_color = "${stampColor}"
    stamp_size = "${stampSize}"
    include_date = ${includeDate ? 'True' : 'False'}
    date_format = "${dateFormat}"
    opacity = ${opacity}
    
    print(f"Starting stamping process...")
    print(f"Input: {input_pdf}")
    print(f"Output: {output_pdf}")
    print(f"Stamp type: {stamp_type}")
    print(f"Custom text: '{custom_text}'")
    print(f"Custom text length: {len(custom_text) if custom_text else 0}")
    print(f"Custom image: {custom_image_path}")
    print(f"Position: {position}")
    print(f"Pages: {page_number}")
    
    result = add_stamps(input_pdf, output_pdf, stamp_type, custom_text, custom_image_path, position, page_number, stamp_color, stamp_size, include_date, date_format, opacity)
    if result['success']:
        print("Stamping completed successfully")
    else:
        print("Stamping failed")
`;

      // Write and execute Python script
      const pythonScriptFile = path.join(__dirname, '..', 'uploads', `stamp_${Date.now()}.py`);
      await fs.writeFile(pythonScriptFile, pythonScript);

      try {
        const { stdout, stderr } = await execAsync(`python3 "${pythonScriptFile}"`);
        console.log('Stamping completed:', stdout);
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
        let stampDetails = {
          totalStamps: 0,
          pagesStamped: 0
        };

        // Extract stamp count from output
        const stampMatch = stdout.match(/Total stamps added: (\d+)/);
        if (stampMatch) {
          stampDetails.totalStamps = parseInt(stampMatch[1]);
        }

        const pagesMatch = stdout.match(/Stamping (\d+) pages/);
        if (pagesMatch) {
          stampDetails.pagesStamped = parseInt(pagesMatch[1]);
        }

        // Clean up script file
        await fs.remove(pythonScriptFile);

        return {
          success: true,
          details: stampDetails
        };

      } catch (pythonError) {
        console.warn('PyMuPDF stamping failed, using fallback:', pythonError.message);
        
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
            totalStamps: 0,
            pagesStamped: 0,
            fallbackUsed: true
          },
          message: 'Stamping not available, original file returned'
        };
      }

    } catch (error) {
      console.error('Error in performStamping:', error);
      return {
        success: false,
        message: error.message
      };
    }
  },

  // Get available stamp types
  getStampTypes() {
    return [
      { value: 'approved', label: 'Approved', description: 'Approval stamp' },
      { value: 'confidential', label: 'Confidential', description: 'Confidentiality stamp' },
      { value: 'draft', label: 'Draft', description: 'Draft document stamp' },
      { value: 'urgent', label: 'Urgent', description: 'Urgent processing stamp' },
      { value: 'reviewed', label: 'Reviewed', description: 'Document reviewed stamp' },
      { value: 'signed', label: 'Signed', description: 'Document signed stamp' },
      { value: 'received', label: 'Received', description: 'Document received stamp' },
      { value: 'rejected', label: 'Rejected', description: 'Document rejected stamp' },
      { value: 'pending', label: 'Pending', description: 'Pending approval stamp' },
      { value: 'custom', label: 'Custom', description: 'Custom text stamp' }
    ];
  },

  // Download stamped file
  async downloadStampedFile(req, res) {
    try {
      const { filename } = req.params;
      const filePath = path.join(__dirname, '..', 'uploads', filename);

      console.log(`Download request for file: ${filename}`);
      console.log(`File path: ${filePath}`);

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

  // Preview stamps (same as addStamps but returns preview URL)
  async previewStamps(req, res) {
    let pdfFile = null;
    let customImageFile = null;
    
    try {
      if (!req.files || !req.files.file) {
        return res.status(400).json({
          success: false,
          message: 'No PDF file uploaded'
        });
      }

      pdfFile = req.files.file[0];
      customImageFile = req.files.customImage ? req.files.customImage[0] : null;

      const {
        stampType = 'approved',
        customText = '',
        position = 'bottom-right',
        pageNumber = 'all',
        stampColor = 'red',
        stampSize = 'medium',
        includeDate = 'false',
        dateFormat = 'MM/DD/YYYY',
        opacity = '0.8'
      } = req.body;

      console.log('Preview stamp request received:', {
        stampType,
        customText: customText || '[EMPTY]',
        customTextLength: customText ? customText.length : 0,
        customImage: customImageFile ? '[PROVIDED]' : '[EMPTY]',
        position,
        pageNumber,
        stampColor,
        stampSize,
        includeDate,
        dateFormat,
        opacity
      });

      // Validate input
      if (stampType === 'custom' && !customText.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Custom text is required for custom stamp type'
        });
      }

      if (stampType === 'custom-image' && !customImageFile) {
        return res.status(400).json({
          success: false,
          message: 'Custom image is required for custom image stamp type'
        });
      }

      // Generate unique filename for preview
      const timestamp = Date.now();
      const outputFilename = `preview-${timestamp}.pdf`;
      const outputPath = path.join(__dirname, '..', 'uploads', outputFilename);

      // Perform stamping (same logic as addStamps)
      const result = await stampController.performStamping(pdfFile.path, outputPath, {
        stampType,
        customText,
        customImagePath: customImageFile ? customImageFile.path : null,
        position,
        pageNumber,
        stampColor,
        stampSize,
        includeDate: includeDate === 'true',
        dateFormat,
        opacity: parseFloat(opacity)
      });

      if (result.success) {
        // Return preview URL instead of download URL
        const previewUrl = `/pdf-stamps/preview/${outputFilename}`;
        
        res.json({
          success: true,
          message: 'Preview generated successfully',
          filename: outputFilename,
          previewUrl: previewUrl,
          downloadUrl: `/pdf-stamps/download/${outputFilename}`,
          totalPages: result.totalPages || 0,
          fileSize: result.fileSize || 0,
          originalFileSize: result.originalFileSize || 0,
          stampDetails: {
            totalStamps: result.totalStamps || 0,
            pagesStamped: result.pagesStamped || 0,
            stampType: stampType,
            position: position,
            color: stampColor,
            size: stampSize
          }
        });
      } else {
        res.status(500).json({
          success: false,
          message: result.error || 'Failed to generate preview'
        });
      }

      // Clean up uploaded files
      try {
        await fs.unlink(pdfFile.path);
        if (customImageFile) {
          await fs.unlink(customImageFile.path);
        }
      } catch (cleanupError) {
        console.warn('Cleanup error:', cleanupError);
      }
    } catch (error) {
      console.error('Preview stamping error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during preview generation'
      });
    }
  }
};

module.exports = stampController;
