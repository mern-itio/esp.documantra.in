# Node.js Integration Guide

This document explains how to integrate the PDF Java Service APIs into your Node.js backend.

## Quick Start

### Install Dependencies

```bash
npm install axios
```

### Environment Variables

Add to your `.env`:

```env
PDF_SERVICE_URL=http://localhost:8081
PDF_SERVICE_TIMEOUT=30000
```

### Service Client

Create `services/pdfService.js`:

```javascript
const axios = require('axios');

const PDF_SERVICE_URL = process.env.PDF_SERVICE_URL || 'http://localhost:8081';
const TIMEOUT = parseInt(process.env.PDF_SERVICE_TIMEOUT) || 30000;

const pdfClient = axios.create({
  baseURL: `${PDF_SERVICE_URL}/api/pdf`,
  timeout: TIMEOUT,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Error handling middleware
pdfClient.interceptors.response.use(
  response => response,
  error => {
    console.error('PDF Service Error:', {
      status: error.response?.status,
      message: error.response?.data?.message,
      error: error.message
    });
    throw error;
  }
);

/**
 * Prepare PDF template with field placeholders
 * @param {Buffer} pdfBuffer - PDF file buffer
 * @param {Array} fieldDefinitions - Array of field definitions
 * @returns {Promise<string>} - Base64 encoded PDF
 */
async function prepareTemplate(pdfBuffer, fieldDefinitions) {
  const pdfBase64 = pdfBuffer.toString('base64');
  
  const response = await pdfClient.post('/prepare-template', {
    pdfBase64,
    fields: fieldDefinitions
  });
  
  if (!response.data.success) {
    throw new Error(`Failed to prepare template: ${response.data.message}`);
  }
  
  return response.data.pdfBase64;
}

/**
 * Embed field values into PDF
 * @param {string} pdfBase64 - Base64 encoded PDF
 * @param {Array} fieldValues - Array of field value objects
 * @returns {Promise<string>} - Base64 encoded PDF with embedded values
 */
async function embedValues(pdfBase64, fieldValues) {
  const response = await pdfClient.post('/embed-values', {
    pdfBase64,
    fieldValues
  });
  
  if (!response.data.success) {
    throw new Error(`Failed to embed values: ${response.data.message}`);
  }
  
  return response.data.pdfBase64;
}

/**
 * Health check
 * @returns {Promise<boolean>} - True if service is healthy
 */
async function healthCheck() {
  try {
    const response = await pdfClient.get('/health');
    return response.data.status === 'OK';
  } catch (error) {
    return false;
  }
}

module.exports = {
  pdfClient,
  prepareTemplate,
  embedValues,
  healthCheck
};
```

---

## Envelope Workflow

### Step 1: Create Envelope with Template

```javascript
const { prepareTemplate } = require('./services/pdfService');

async function createEnvelope(req, res) {
  try {
    const { documentFile, fieldDefinitions } = req.body;
    
    // Get fields from database
    const allFields = await Field.find({ 
      envelopeId: req.body.envelopeId 
    });
    
    // Prepare template with all fields
    const templatePdfBase64 = await prepareTemplate(
      documentFile.buffer,
      allFields.map(f => ({
        fieldId: f._id.toString(),
        page: f.page,
        x: f.x,
        y: f.y,
        width: f.width,
        height: f.height,
        type: f.type,
        label: f.label
      }))
    );
    
    // Save envelope with template
    const envelope = new Envelope({
      templatePdf: templatePdfBase64,
      currentPdf: templatePdfBase64,
      status: 'pending',
      documentName: documentFile.originalname
    });
    
    await envelope.save();
    
    res.json({
      success: true,
      envelopeId: envelope._id,
      message: 'Envelope created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
```

### Step 2: Submit Recipient Values

```javascript
const { embedValues } = require('./services/pdfService');

async function submitRecipientValues(req, res) {
  try {
    const { envelopeId, recipientId, fieldValues } = req.body;
    
    // Get envelope with current PDF
    const envelope = await Envelope.findById(envelopeId);
    if (!envelope) {
      return res.status(404).json({ error: 'Envelope not found' });
    }
    
    // Get recipient's field IDs from database
    const recipientFields = await Field.find({
      envelopeId,
      recipientId,
      type: 'text' // Only non-signature fields
    });
    
    // Create field value objects
    const fieldsToEmbed = recipientFields.map(field => ({
      fieldId: field._id.toString(),
      value: fieldValues[field.label] || ''
    }));
    
    // Embed values into current PDF
    const pdfWithValues = await embedValues(
      envelope.currentPdf,
      fieldsToEmbed
    );
    
    // Store the PDF with embedded values (before signature)
    await Envelope.updateOne(
      { _id: envelopeId },
      { currentPdf: pdfWithValues }
    );
    
    // Update recipient status
    await Recipient.updateOne(
      { _id: recipientId, envelopeId },
      { status: 'values_submitted' }
    );
    
    res.json({
      success: true,
      pdfWithValues,
      message: 'Values submitted. Send to signature provider'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
```

### Step 3: Handle Signature Callback

```javascript
async function handleSignatureCallback(req, res) {
  try {
    const { envelopeId, recipientId, signedPdfBase64 } = req.body;
    
    // The signedPdfBase64 comes from your third-party signature provider
    // It contains the embedded values + cryptographic signature
    
    // Update envelope with signed PDF
    await Envelope.updateOne(
      { _id: envelopeId },
      { currentPdf: signedPdfBase64 }
    );
    
    // Mark recipient as signed
    await Recipient.updateOne(
      { _id: recipientId, envelopeId },
      { 
        status: 'signed',
        signedAt: new Date()
      }
    );
    
    // Check if all recipients are signed
    const pendingRecipients = await Recipient.countDocuments({
      envelopeId,
      status: { $in: ['pending', 'values_submitted'] }
    });
    
    if (pendingRecipients === 0) {
      // All signed - envelope is complete
      await Envelope.updateOne(
        { _id: envelopeId },
        { status: 'completed', completedAt: new Date() }
      );
    } else {
      // Send to next recipient
      const nextRecipient = await Recipient.findOne({
        envelopeId,
        status: 'pending'
      });
      
      await notifyRecipient(nextRecipient);
    }
    
    res.json({
      success: true,
      message: 'Signature recorded successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
```

---

## Field Definition Format

When fetching fields from database, ensure they match this format:

```javascript
const fieldDefinition = {
  fieldId: field._id.toString(),           // Unique field identifier
  page: field.page,                        // 1-indexed page number
  x: field.x,                              // X coordinate (top-left origin)
  y: field.y,                              // Y coordinate (top-left origin)
  width: field.width,                      // Field width in points
  height: field.height,                    // Field height in points
  type: field.type,                        // 'text' or 'signature'
  label: field.label                       // Display label
};
```

---

## Error Handling

Always handle errors gracefully:

```javascript
try {
  const pdf = await embedValues(pdfBase64, fieldValues);
} catch (error) {
  if (error.response?.status === 400) {
    console.error('Invalid input:', error.response.data.message);
    // Handle validation error
  } else if (error.response?.status === 500) {
    console.error('Server error:', error.response.data.message);
    // Handle server error
  } else if (error.code === 'ECONNREFUSED') {
    console.error('PDF Service is not running');
    // Handle connection error
  } else {
    console.error('Unknown error:', error.message);
  }
}
```

---

## Base64 Conversion Helpers

```javascript
/**
 * Convert file buffer to base64
 */
function bufferToBase64(buffer) {
  return buffer.toString('base64');
}

/**
 * Convert base64 to buffer
 */
function base64ToBuffer(base64String) {
  return Buffer.from(base64String, 'base64');
}

/**
 * Save base64 PDF to file
 */
async function savePdfToFile(pdfBase64, filename) {
  const buffer = base64ToBuffer(pdfBase64);
  const fs = require('fs').promises;
  await fs.writeFile(filename, buffer);
}

/**
 * Get size of base64 PDF (approximate)
 */
function getPdfSizeInBytes(pdfBase64) {
  // Base64 adds ~33% overhead, remove padding
  const padding = (pdfBase64.match(/=/g) || []).length;
  return Math.ceil((pdfBase64.length * 3) / 4) - padding;
}
```

---

## API Routes Example

```javascript
const express = require('express');
const router = express.Router();

router.post('/envelopes/create', createEnvelope);
router.post('/envelopes/:envelopeId/recipient/:recipientId/values', submitRecipientValues);
router.post('/signature-callback', handleSignatureCallback);
router.get('/pdf-service/health', async (req, res) => {
  const { healthCheck } = require('./services/pdfService');
  const isHealthy = await healthCheck();
  res.json({ 
    healthy: isHealthy,
    service: 'PDF Service'
  });
});

module.exports = router;
```

---

## Performance Optimization

### Base64 Streaming (for large PDFs)

```javascript
async function prepareTemplateStream(pdfPath, fieldDefinitions) {
  const fs = require('fs');
  const pdfBuffer = fs.readFileSync(pdfPath);
  const pdfBase64 = pdfBuffer.toString('base64');
  
  // For very large PDFs, consider chunking
  const chunkSize = 10 * 1024 * 1024; // 10MB chunks
  
  if (pdfBase64.length > chunkSize) {
    console.warn('Large PDF detected. Consider implementing streaming.');
  }
  
  return prepareTemplate(pdfBuffer, fieldDefinitions);
}
```

### Caching

```javascript
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 3600 }); // 1 hour

async function prepareTemplateWithCache(pdfBuffer, fieldDefinitions) {
  const cacheKey = `template-${hash(pdfBuffer)}`;
  
  const cached = cache.get(cacheKey);
  if (cached) {
    return cached;
  }
  
  const result = await prepareTemplate(pdfBuffer, fieldDefinitions);
  cache.set(cacheKey, result);
  
  return result;
}
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `ECONNREFUSED` | Ensure Java service is running on port 8081 |
| `Invalid PDF` | Verify base64 encoding is correct |
| `Field not found` | Check fieldId matches template |
| `Timeout` | Increase `PDF_SERVICE_TIMEOUT` or check PDF size |

---

## Testing

```javascript
// test/pdfService.test.js
const { prepareTemplate, embedValues } = require('../services/pdfService');
const fs = require('fs');

describe('PDF Service', () => {
  let samplePdf;
  let sampleFields;
  
  before(() => {
    samplePdf = fs.readFileSync('./test/sample.pdf');
    sampleFields = [
      {
        fieldId: 'test_1',
        page: 1,
        x: 100,
        y: 100,
        width: 100,
        height: 30,
        type: 'text',
        label: 'Name'
      }
    ];
  });
  
  it('should prepare template', async () => {
    const result = await prepareTemplate(samplePdf, sampleFields);
    expect(result).to.be.a('string');
    expect(result.length).to.be.greaterThan(0);
  });
  
  it('should embed values', async () => {
    const template = await prepareTemplate(samplePdf, sampleFields);
    const result = await embedValues(template, [
      { fieldId: 'test_1', value: 'John Doe' }
    ]);
    expect(result).to.be.a('string');
  });
});
```

---

## Additional Resources

- [iText 7 Documentation](https://itextpdf.com/en)
- [PDF Specification](https://www.adobe.io/content/dam/udp/assets/open/pdf/specification/32000-1:2008.pdf)
- [Incremental Updates](https://www.adobe.io/content/dam/udp/assets/open/pdf/specification/32000-1:2008.pdf#page=104)
