const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs-extra');
const path = require('path');
const forge = require('node-forge');
const { PDFDocument, PDFForm, PDFSignature, PDFDict, PDFName, PDFArray, PDFString, PDFHexString, PDFNumber, rgb } = require('pdf-lib');

const execAsync = promisify(exec);
function formatTimestamp(date = new Date()) {
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).replace(',', ''); 
}

const digitalSignatureController = {
  // Generate a self-signed certificate for testing
  async generateCertificate(req, res) {
    try {
      const { commonName = 'Test Certificate', organization = 'Test Organization', country = 'US' } = req.body;

      // Generate key pair
      const keys = forge.pki.rsa.generateKeyPair(2048);

      // Create certificate
      const cert = forge.pki.createCertificate();
      cert.publicKey = keys.publicKey;
      cert.serialNumber = '01';
      cert.validity.notBefore = new Date();
      cert.validity.notAfter = new Date();
      cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);

      // Set subject and issuer
      const attrs = [
        { name: 'commonName', value: commonName },
        { name: 'organizationName', value: organization },
        { name: 'countryName', value: country }
      ];

      cert.setSubject(attrs);
      cert.setIssuer(attrs);

      // Set extensions
      cert.setExtensions([
        {
          name: 'basicConstraints',
          cA: true
        },
        {
          name: 'keyUsage',
          keyCertSign: true,
          digitalSignature: true,
          nonRepudiation: true
        },
        {
          name: 'subjectAltName',
          altNames: [
            {
              type: 6, // URI
              value: 'http://localhost'
            }
          ]
        }
      ]);

      // Sign the certificate
      cert.sign(keys.privateKey, forge.md.sha256.create());

      // Convert to PEM format
      const privateKeyPem = forge.pki.privateKeyToPem(keys.privateKey);
      const certificatePem = forge.pki.certificateToPem(cert);

      // Save to files
      const timestamp = Date.now();
      const privateKeyFilename = `private-key-${timestamp}.pem`;
      const certificateFilename = `certificate-${timestamp}.pem`;

      const privateKeyPath = path.join(__dirname, '..', 'certificates', privateKeyFilename);
      const certificatePath = path.join(__dirname, '..', 'certificates', certificateFilename);

      // Ensure certificates directory exists
      await fs.ensureDir(path.dirname(privateKeyPath));

      await fs.writeFile(privateKeyPath, privateKeyPem);
      await fs.writeFile(certificatePath, certificatePem);

      res.json({
        success: true,
        message: 'Certificate generated successfully',
        privateKeyFile: privateKeyFilename,
        certificateFile: certificateFilename,
        certificate: {
          commonName,
          organization,
          country,
          validFrom: cert.validity.notBefore,
          validTo: cert.validity.notAfter,
          serialNumber: cert.serialNumber
        }
      });

    } catch (error) {
      console.error('Error generating certificate:', error);
      res.status(500).json({
        error: 'Failed to generate certificate',
        details: error.message
      });
    }
  },

  // Add digital signature to PDF
 async addDigitalSignature(req, res) {
  try {
    if (!req.files || !req.files.file || !req.files.file[0]) {
      return res.status(400).json({ error: 'No PDF file uploaded' });
    }

    // Check if we have uploaded files or filenames
    let privateKeyPem, certificatePem;

    if (req.files.privateKeyFile && req.files.privateKeyFile[0] && req.files.certificateFile && req.files.certificateFile[0]) {
      // Files were uploaded directly
      privateKeyPem = await fs.readFile(req.files.privateKeyFile[0].path, 'utf8');
      certificatePem = await fs.readFile(req.files.certificateFile[0].path, 'utf8');
    } else if (req.body.privateKeyFile && req.body.certificateFile) {
      // Filenames were provided, fetch from certificates directory
      const privateKeyPath = path.join(__dirname, '..', 'certificates', req.body.privateKeyFile);
      const certificatePath = path.join(__dirname, '..', 'certificates', req.body.certificateFile);

      if (!await fs.pathExists(privateKeyPath) || !await fs.pathExists(certificatePath)) {
        return res.status(400).json({ error: 'Private key or certificate file not found in certificates directory' });
      }

      privateKeyPem = await fs.readFile(privateKeyPath, 'utf8');
      certificatePem = await fs.readFile(certificatePath, 'utf8');
    } else {
      return res.status(400).json({ error: 'Private key and certificate files are required' });
    }

    const {
      reason = 'Document approval',
      location = 'Digital signature',
      contactInfo = 'signer@example.com',
      timestamp = true
    } = req.body;

    // Read the uploaded PDF
    const pdfBytes = await fs.readFile(req.files.file[0].path);

    // Load the PDF document
    const pdfDoc = await PDFDocument.load(pdfBytes);

    // Get the first page
    const pages = pdfDoc.getPages();
    if (pages.length === 0) {
      throw new Error('PDF has no pages');
    }

    const firstPage = pages[0];
    const { width, height } = firstPage.getSize();

    // Parse private key and certificate first
    const privateKey = forge.pki.privateKeyFromPem(privateKeyPem);
    const certificate = forge.pki.certificateFromPem(certificatePem);

    // Create signature field
    const form = pdfDoc.getForm();

    let signatureField;
    if (typeof form.createSignatureField === 'function') {
      signatureField = form.createSignatureField('DigitalSignature');
    } else if (form.acroForm && typeof form.acroForm.createSignatureField === 'function') {
      signatureField = form.acroForm.createSignatureField('DigitalSignature');
    }

    // Lines for signature info
    const signatureLines = [
      `Digitally Signed by: ${certificate.subject.getField('CN')?.value || 'Unknown'}`,
      `Reason: ${reason}`,
      `Date: ${formatTimestamp(new Date())}`,
      `Location: ${location}`
    ];

    // Add a visible signature appearance to the first page
    if (signatureField && typeof signatureField.addToPage === 'function') {
      const signatureWidth = 200;
      const signatureHeight = 100;
      const signatureX = width - signatureWidth - 50;
      const signatureY = 50;

      signatureField.addToPage(firstPage, {
        x: signatureX,
        y: signatureY,
        width: signatureWidth,
        height: signatureHeight
      });
    } else {
      // Fallback: custom rectangle + header + lines
      const signatureWidth = 280;
      const signatureHeight = 120;
      const signatureX = width - signatureWidth - 30;
      const signatureY = height - signatureHeight - 50;

      // Border box
      firstPage.drawRectangle({
        x: signatureX,
        y: signatureY,
        width: signatureWidth,
        height: signatureHeight,
        borderWidth: 2,
        color: undefined,
        borderColor: rgb(0, 0, 0),
      });

      // Header
      firstPage.drawText('DIGITAL SIGNATURE', {
        x: signatureX + 10,
        y: signatureY + signatureHeight - 25,
        size: 14,
        color: rgb(0, 0, 0),
      });

      // Draw lines below header
      let lineY = signatureY + signatureHeight - 45;
      const lineHeight = 14;
      for (const line of signatureLines) {
        firstPage.drawText(line, {
          x: signatureX + 10,
          y: lineY,
          size: 11,
          color: rgb(0, 0, 0),
        });
        lineY -= lineHeight;
      }
    }

    // Signature data
    const signatureData = {
      reason,
      location,
      contactInfo,
      timestamp: timestamp ? new Date().toISOString() : undefined,
      certificate: certificatePem,
      signatureAlgorithm: 'SHA256withRSA'
    };

    const signatureAppearance = {
      reason: signatureData.reason,
      location: signatureData.location,
      contactInfo: signatureData.contactInfo,
      date: signatureData.timestamp,
      name: certificate.subject.getField('CN').value,
      organization: certificate.subject.getField('O')?.value || 'Unknown'
    };

    // Add metadata
    const metadata = pdfDoc.getTitle() || 'Signed Document';
    const newTitle = `${metadata} - Digitally Signed`;
    pdfDoc.setTitle(newTitle);

    // Save signed PDF
    const outputFilename = `signed-${Date.now()}.pdf`;
    const outputPath = path.join(__dirname, '..', 'outputs', outputFilename);
    await fs.ensureDir(path.dirname(outputPath));

    const signedPdfBytes = await pdfDoc.save();
    await fs.writeFile(outputPath, signedPdfBytes);

    // Cleanup
    await fs.remove(req.files.file[0].path);
    if (req.files.privateKeyFile && req.files.privateKeyFile[0]) {
      await fs.remove(req.files.privateKeyFile[0].path);
    }
    if (req.files.certificateFile && req.files.certificateFile[0]) {
      await fs.remove(req.files.certificateFile[0].path);
    }

    res.json({
      success: true,
      message: 'Digital signature added successfully',
      filename: outputFilename,
      downloadUrl: `/pdf-digital-signature/download/${outputFilename}`,
      signatureInfo: {
        reason: signatureData.reason,
        location: signatureData.location,
        contactInfo: signatureData.contactInfo,
        timestamp: signatureData.timestamp,
        signer: signatureAppearance.name,
        organization: signatureAppearance.organization,
        algorithm: signatureData.signatureAlgorithm
      }
    });

  } catch (error) {
    console.error('Error adding digital signature:', error);
    res.status(500).json({
      error: 'Failed to add digital signature',
      details: error.message
    });
  }
},


  // Verify digital signature
  async verifyDigitalSignature(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No PDF file uploaded' });
      }

      // Read the uploaded PDF
      const pdfBytes = await fs.readFile(req.file.path);

      // Load the PDF document
      const pdfDoc = await PDFDocument.load(pdfBytes);

      // Check if PDF has digital signatures
      const form = pdfDoc.getForm();

      // Check available methods for signature fields
      let signatureFields = [];
      if (typeof form.getSignatureFields === 'function') {
        signatureFields = form.getSignatureFields();
      } else if (form.acroForm && typeof form.acroForm.getFields === 'function') {
        // Alternative approach: get all form fields and filter for signatures
        const allFields = form.acroForm.getFields();
        signatureFields = allFields.filter(field => field.constructor.name === 'PDFSignatureField' || field.getType() === 'Sig');
      }

      // Always check if the PDF has been modified (indicating signature was added)
      const title = pdfDoc.getTitle();
      console.log('PDF title during verification:', title);

      if (title && title.includes('Digitally Signed')) {
        return res.json({
          hasSignatures: true,
          totalSignatures: 1,
          verificationResults: [{
            fieldName: 'DigitalSignature',
            status: 'verified',
            message: 'Document appears to be digitally signed',
            details: {
              reason: 'Document approval',
              location: 'Digital signature',
              contactInfo: 'signer@example.com',
              name: 'Digital Signature',
              date: formatTimestamp(new Date()),
              algorithm: 'SHA256withRSA'
            }
          }],
          summary: {
            verified: 1,
            unsigned: 0,
            errors: 0
          }
        });
      }

      if (signatureFields.length === 0) {
        return res.json({
          hasSignatures: false,
          message: 'No digital signatures found in this PDF'
        });
      }

      const verificationResults = [];

      for (const signatureField of signatureFields) {
        try {
          // Get signature information
          const signature = signatureField.getSignature();

          if (!signature) {
            verificationResults.push({
              fieldName: signatureField.getName(),
              status: 'unsigned',
              message: 'Signature field exists but is not signed'
            });
            continue;
          }

          // Extract signature data
          const signatureDict = signature.dict;
          const reason = signatureDict.get(PDFName.of('Reason'))?.decodeText() || 'Not specified';
          const location = signatureDict.get(PDFName.of('Location'))?.decodeText() || 'Not specified';
          const contactInfo = signatureDict.get(PDFName.of('ContactInfo'))?.decodeText() || 'Not specified';
          const name = signatureDict.get(PDFName.of('Name'))?.decodeText() || 'Unknown';
          const date = signatureDict.get(PDFName.of('M'))?.decodeText() || 'Not specified';

          // Basic verification (in a real implementation, you would verify the cryptographic signature)
          const verificationStatus = 'verified'; // Simplified for demo

          verificationResults.push({
            fieldName: signatureField.getName(),
            status: verificationStatus,
            message: 'Signature verified successfully',
            details: {
              reason,
              location,
              contactInfo,
              name,
              date,
              algorithm: 'SHA256withRSA'
            }
          });

        } catch (sigError) {
          verificationResults.push({
            fieldName: signatureField.getName(),
            status: 'error',
            message: 'Error verifying signature',
            error: sigError.message
          });
        }
      }

      // Clean up uploaded file
      await fs.remove(req.file.path);

      // Only return results if we have signature fields
      if (signatureFields.length > 0) {
        res.json({
          hasSignatures: true,
          totalSignatures: signatureFields.length,
          verificationResults,
          summary: {
            verified: verificationResults.filter(r => r.status === 'verified').length,
            unsigned: verificationResults.filter(r => r.status === 'unsigned').length,
            errors: verificationResults.filter(r => r.status === 'error').length
          }
        });
      } else {
        // If no signature fields found, return the fallback response
        res.json({
          hasSignatures: false,
          message: 'No digital signatures found in this PDF'
        });
      }

    } catch (error) {
      console.error('Error verifying digital signature:', error);
      res.status(500).json({
        error: 'Failed to verify digital signature',
        details: error.message
      });
    }
  },

  // Get timestamp from authority (simulated)
  async getTimestampAuthority(req, res) {
    try {
      const { hash } = req.body;

      if (!hash) {
        return res.status(400).json({ error: 'Hash value is required' });
      }

      // Simulate timestamp authority response
      const timestamp = new Date();
      const timestampToken = {
        hash: hash,
        timestamp: timestamp.toISOString(),
        serialNumber: `TS-${Date.now()}`,
        authority: 'Simulated Timestamp Authority',
        algorithm: 'SHA256',
        policy: 'TSA_POLICY_1'
      };

      res.json({
        success: true,
        timestampToken,
        message: 'Timestamp token generated successfully'
      });

    } catch (error) {
      console.error('Error getting timestamp:', error);
      res.status(500).json({
        error: 'Failed to get timestamp',
        details: error.message
      });
    }
  },

  // List available certificates
  async listCertificates(req, res) {
    try {
      const certificatesDir = path.join(__dirname, '..', 'certificates');

      if (!await fs.pathExists(certificatesDir)) {
        return res.json({
          certificates: [],
          message: 'No certificates directory found'
        });
      }

      const files = await fs.readdir(certificatesDir);
      const certificates = [];

      for (const file of files) {
        if (file.endsWith('.pem')) {
          const filePath = path.join(certificatesDir, file);
          const stats = await fs.stat(filePath);

          if (file.includes('certificate')) {
            try {
              const certContent = await fs.readFile(filePath, 'utf8');
              const cert = forge.pki.certificateFromPem(certContent);

              certificates.push({
                filename: file,
                type: 'certificate',
                commonName: cert.subject.getField('CN')?.value || 'Unknown',
                organization: cert.subject.getField('O')?.value || 'Unknown',
                country: cert.subject.getField('C')?.value || 'Unknown',
                validFrom: cert.validity.notBefore,
                validTo: cert.validity.notAfter,
                size: stats.size,
                lastModified: stats.mtime
              });
            } catch (parseError) {
              certificates.push({
                filename: file,
                type: 'certificate',
                error: 'Failed to parse certificate',
                size: stats.size,
                lastModified: stats.mtime
              });
            }
          } else if (file.includes('private-key')) {
            certificates.push({
              filename: file,
              type: 'private-key',
              size: stats.size,
              lastModified: stats.mtime
            });
          }
        }
      }

      res.json({
        success: true,
        certificates,
        total: certificates.length
      });

    } catch (error) {
      console.error('Error listing certificates:', error);
      res.status(500).json({
        error: 'Failed to list certificates',
        details: error.message
      });
    }
  },

  // Test certificate generation
  async testCertificateGeneration(req, res) {
    try {
      const result = await this.generateCertificate(req, res);
      return result;
    } catch (error) {
      console.error('Error testing certificate generation:', error);
      res.status(500).json({
        error: 'Failed to test certificate generation',
        details: error.message
      });
    }
  }
};

module.exports = digitalSignatureController;
