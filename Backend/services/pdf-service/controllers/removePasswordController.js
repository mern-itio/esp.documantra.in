const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs-extra');
const path = require('path');

const execAsync = promisify(exec);

const removePasswordController = {
  async removePassword(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const { password = '' } = req.body;

      // Use qpdf for decryption
      const outputFilename = `unprotected-${Date.now()}.pdf`;
      const outputPath = path.join(__dirname, '..', 'outputs', outputFilename);

      // Ensure output directory exists
      await fs.ensureDir(path.dirname(outputPath));

      // Build qpdf command for decryption
      // qpdf --password=<password> --decrypt <input> <output>
      let qpdfCommand = `qpdf --password="${password}" --decrypt "${req.file.path}" "${outputPath}"`;

      // Execute qpdf command
      const { stdout, stderr } = await execAsync(qpdfCommand);

      if (stderr && !stderr.includes('qpdf: warning:')) {
        throw new Error(`qpdf error: ${stderr}`);
      }

      // Verify the output file was created
      if (!await fs.pathExists(outputPath)) {
        throw new Error('Output file was not created by qpdf');
      }

      // Get file info
      const decryptedFileSize = (await fs.stat(outputPath)).size;

      // Get page count using qpdf --show-pages
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

              res.json({
          success: true,
          message: 'Password protection removed successfully',
          filename: outputFilename,
          downloadUrl: `/pdf-remove-password/remove-password/download/${outputFilename}`,
          totalPages: pageCount,
          protectionInfo: {
            wasProtected: true,
            isNowUnprotected: true,
            tool: 'qpdf'
          }
        });

    } catch (error) {
      console.error('Error removing password protection:', error);
      
      // Check if it's a password error
      if (error.message.includes('qpdf error:') && error.message.includes('password')) {
        return res.status(400).json({
          error: 'Incorrect password or file is not password protected',
          details: 'Please check the password or ensure the file has password protection'
        });
      }

      res.status(500).json({
        error: 'Failed to remove password protection from PDF',
        details: error.message
      });
    }
  },

  // Helper method to check if PDF is password protected
  async checkPasswordProtection(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      // Use qpdf to check if file is encrypted
      try {
        const { stdout, stderr } = await execAsync(`qpdf --show-encryption "${req.file.path}"`);
        
        // If no encryption info, file is not protected
        if (stdout.includes('File is not encrypted')) {
          return res.json({
            isProtected: false,
            message: 'File is not password protected'
          });
        }

        // Parse encryption info
        const encryptionInfo = {
          isProtected: true,
          encryptionType: 'Unknown',
          permissions: 'Unknown'
        };

        // Extract encryption type
        if (stdout.includes('256-bit')) {
          encryptionInfo.encryptionType = 'AES-256';
        } else if (stdout.includes('128-bit')) {
          encryptionInfo.encryptionType = 'AES-128';
        } else if (stdout.includes('40-bit')) {
          encryptionInfo.encryptionType = 'RC4-40';
        }

        // Extract permissions
        if (stdout.includes('print=full')) {
          encryptionInfo.permissions = 'Full printing allowed';
        } else if (stdout.includes('print=none')) {
          encryptionInfo.permissions = 'No printing allowed';
        }

        return res.json(encryptionInfo);

      } catch (qpdfError) {
        // If qpdf fails, file might be corrupted or not a valid PDF
        return res.status(400).json({
          error: 'Unable to analyze PDF encryption',
          details: 'File might be corrupted or not a valid PDF'
        });
      }

    } catch (error) {
      console.error('Error checking password protection:', error);
      res.status(500).json({
        error: 'Failed to check password protection',
        details: error.message
      });
    } finally {
      // Clean up uploaded file
      if (req.file && req.file.path) {
        await fs.remove(req.file.path);
      }
    }
  },

  // Helper method to test qpdf installation
  async testQpdfInstallation() {
    try {
      const { stdout } = await execAsync('qpdf --version');
      return {
        installed: true,
        version: stdout.trim(),
        message: 'qpdf is properly installed and working'
      };
    } catch (error) {
      return {
        installed: false,
        error: error.message,
        message: 'qpdf is not installed or not accessible'
      };
    }
  }
};

module.exports = removePasswordController;
