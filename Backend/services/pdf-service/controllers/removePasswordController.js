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
      if (error.message.includes('qpdf error:') && 
          (error.message.includes('password') || error.message.includes('authentication'))) {
        return res.status(401).json({
          error: 'Invalid password',
          details: 'The password you entered is incorrect. Please check the password and try again.'
        });
      }
      
      // Check stderr for password-related errors
      if (error.stderr && 
          (error.stderr.includes('password') || 
           error.stderr.includes('authentication') ||
           error.stderr.includes('invalid password') ||
           error.stderr.includes('incorrect password'))) {
        return res.status(401).json({
          error: 'Invalid password',
          details: 'The password you entered is incorrect. Please check the password and try again.'
        });
      }
      
      // Check for direct qpdf password error messages
      if (error.message.includes('invalid password') || 
          error.message.includes('incorrect password') ||
          error.message.includes('authentication failed')) {
        return res.status(401).json({
          error: 'Invalid password',
          details: 'The password you entered is incorrect. Please check the password and try again.'
        });
      }

      // Check if file is not password protected
      if (error.message.includes('qpdf error:') && 
          (error.message.includes('not encrypted') || error.message.includes('not password protected'))) {
        return res.status(400).json({
          error: 'File is not password protected',
          details: 'This PDF file is not password protected. No password removal is needed.'
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
        if (stdout.includes('File is not encrypted') || stdout.trim() === '') {
          return res.json({
            isProtected: false,
            message: 'File is not password protected'
          });
        }

        // Parse encryption info
        const encryptionInfo = {
          isProtected: true,
          encryptionType: 'Unknown',
          permissions: 'Unknown',
          message: 'File is password protected'
        };

        // Extract encryption type from qpdf output
        // qpdf shows R = 3 for RC4, R = 4 for AES-128, R = 5 for AES-256
        if (stdout.includes('R = 5')) {
          encryptionInfo.encryptionType = 'AES-256';
        } else if (stdout.includes('R = 4')) {
          encryptionInfo.encryptionType = 'AES-128';
        } else if (stdout.includes('R = 3')) {
          encryptionInfo.encryptionType = 'RC4-128';
        } else if (stdout.includes('R = 2')) {
          encryptionInfo.encryptionType = 'RC4-40';
        }

        // Extract permissions from qpdf output
        // Parse the P value and permission flags
        const pMatch = stdout.match(/P = (-?\d+)/);
        if (pMatch) {
          const pValue = parseInt(pMatch[1]);
          const permissions = [];
          
          // Parse individual permissions
          if (stdout.includes('extract for any purpose: allowed')) {
            permissions.push('Extract allowed');
          } else if (stdout.includes('extract for any purpose: not allowed')) {
            permissions.push('Extract restricted');
          }
          
          if (stdout.includes('print high resolution: allowed')) {
            permissions.push('High-res printing allowed');
          } else if (stdout.includes('print low resolution: allowed')) {
            permissions.push('Low-res printing allowed');
          } else if (stdout.includes('print high resolution: not allowed') && stdout.includes('print low resolution: not allowed')) {
            permissions.push('No printing allowed');
          }
          
          if (stdout.includes('modify anything: allowed')) {
            permissions.push('Full modification allowed');
          } else if (stdout.includes('modify other: allowed')) {
            permissions.push('Limited modification allowed');
          } else if (stdout.includes('modify other: not allowed')) {
            permissions.push('No modification allowed');
          }
          
          if (permissions.length > 0) {
            encryptionInfo.permissions = permissions.join(', ');
          }
        }

        // If we still don't have specific info, set defaults
        if (encryptionInfo.encryptionType === 'Unknown' && stdout.length > 0) {
          encryptionInfo.encryptionType = 'Password Protected';
        }

        if (encryptionInfo.permissions === 'Unknown' && stdout.length > 0) {
          encryptionInfo.permissions = 'Restricted (requires password)';
        }

        return res.json(encryptionInfo);

      } catch (qpdfError) {
        
        // Check if the error indicates the file is encrypted but we can't read it without password
        if (qpdfError.message.includes('password') || qpdfError.stderr?.includes('password')) {
          return res.json({
            isProtected: true,
            encryptionType: 'Password Protected',
            permissions: 'Restricted (requires password)',
            message: 'File is password protected'
          });
        }
        
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
