const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs-extra');
const path = require('path');

const execAsync = promisify(exec);

const addPasswordController = {
  async addPassword(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const {
        ownerPassword = '',
        userPassword = '',
        permissions = 'all', // all, print, copy, modify, annotate
        encryptionLevel = 'AES-256' // AES-256, AES-128
      } = req.body;

      // Convert AES encryption level to qpdf numeric format
      let qpdfEncryptionLevel = '256'; // default
      if (encryptionLevel === 'AES-256' || encryptionLevel === '256') {
        qpdfEncryptionLevel = '256';
      } else if (encryptionLevel === 'AES-128' || encryptionLevel === '128') {
        qpdfEncryptionLevel = '128';
      } else if (encryptionLevel === '40') {
        qpdfEncryptionLevel = '40';
      }

      // console.log('Received password protection request:', {
      //   ownerPassword: ownerPassword ? '***' : 'not set',
      //   userPassword: userPassword ? '***' : 'not set',
      //   permissions,
      //   encryptionLevel,
      //   qpdfEncryptionLevel
      // });

      // Validate passwords
      if (!ownerPassword && !userPassword) {
        return res.status(400).json({
          error: 'At least one password (owner or user) must be provided'
        });
      }

      // Ensure we have at least a user password for encryption to work
      if (!userPassword) {
        return res.status(400).json({
          error: 'User password is required for PDF encryption to work properly'
        });
      }


      // Use qpdf for encryption with proper permissions
      const outputFilename = `password-protected-${Date.now()}.pdf`;
      const outputPath = path.join(__dirname, '..', 'outputs', outputFilename);

      // Ensure output directory exists
      await fs.ensureDir(path.dirname(outputPath));
      let qpdfCommand = `qpdf --encrypt "${userPassword}" "${ownerPassword || userPassword}" ${qpdfEncryptionLevel}`;

      // Permissions (use new flags for AES-128/256)
      if (permissions === 'all') {
        qpdfCommand += ' --print=full --modify=all --extract=y --annotate=y';
      } else if (permissions === 'print') {
        qpdfCommand += ' --print=full --modify=none --extract=n --annotate=n';
      } else if (permissions === 'copy') {
        qpdfCommand += ' --print=none --modify=none --extract=y --annotate=n';
      } else if (permissions === 'modify') {
        qpdfCommand += ' --print=none --modify=all --extract=n --annotate=n';
      } else if (permissions === 'annotate') {
        qpdfCommand += ' --print=none --modify=annotate --extract=n --annotate=y';
      }

      // Terminate options and add input/output
      qpdfCommand += ` -- "${req.file.path}" "${outputPath}"`;
      // Execute qpdf command
      const { stdout, stderr } = await execAsync(qpdfCommand);

      if (stderr && !stderr.includes('qpdf: warning:')) {
        throw new Error(`qpdf error: ${stderr}`);
      }

      // console.log('qpdf stdout:', stdout);
      // if (stderr) console.log('qpdf stderr:', stderr);

      // Verify the output file was created
      if (!await fs.pathExists(outputPath)) {
        throw new Error('Output file was not created by qpdf');
      }

      // Get file info
      const encryptedFileSize = (await fs.stat(outputPath)).size;
      // console.log(`Password-protected PDF saved successfully: ${outputFilename}`);
      // console.log('File size on disk:', encryptedFileSize, 'bytes');

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
        message: 'Password protection added successfully using qpdf',
        filename: outputFilename,
        downloadUrl: `/pdf-password/download/${outputFilename}`,
        totalPages: pageCount,
        protectionInfo: {
          hasOwnerPassword: !!ownerPassword,
          hasUserPassword: !!userPassword,
          permissions,
          encryptionLevel: `${qpdfEncryptionLevel}-bit`,
          tool: 'qpdf'
        }
      });

    } catch (error) {
      console.error('Error adding password protection with qpdf:', error);
      res.status(500).json({
        error: 'Failed to add password protection to PDF using qpdf',
        details: error.message
      });
    }
  },

  // Helper method to validate password strength
  validatePassword(password) {
    if (!password) return { valid: false, message: 'Password cannot be empty' };
    if (password.length < 6) return { valid: false, message: 'Password must be at least 6 characters long' };
    if (password.length > 32) return { valid: false, message: 'Password cannot exceed 32 characters' };
    return { valid: true, message: 'Password is valid' };
  },

  // Helper method to get permission description
  getPermissionDescription(permissions) {
    const permissionMap = {
      'all': 'Full access (print, copy, modify, annotate)',
      'print': 'Print only (no copying or modifying)',
      'copy': 'Copy content only',
      'modify': 'Modify content only',
      'annotate': 'Add annotations only'
    };
    return permissionMap[permissions] || 'Custom permissions';
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

module.exports = addPasswordController;
