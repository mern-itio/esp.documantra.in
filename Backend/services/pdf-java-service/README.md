# PDF Java Service - Integration Guide

## Overview

This is a Spring Boot REST service for handling PDF field management with support for incremental signatures. It provides two main APIs:

1. **`/prepare-template`** - Creates empty placeholder fields in a PDF
2. **`/embed-values`** - Embeds field values into PDF while preserving signatures

Both APIs use **incremental PDF updates**, ensuring that each modification creates a new PDF revision without invalidating previous cryptographic signatures.

---

## Architecture

```
Node.js Service (Orchestrator)
    ↓
    ├→ /prepare-template API
    |   └→ Returns PDF with field placeholders
    |
    ├→ /embed-values API
    |   └→ Embeds recipient values into PDF
    |
    └→ Third-party Signature Provider
        └→ Signs PDF incrementally
```

---

## APIs

### 1. Prepare Template

**Endpoint:** `POST /api/pdf/prepare-template`

**Purpose:** Creates all empty field placeholders (text & signature) in the PDF template

**Request Body:**
```json
{
  "pdfBase64": "JVBERi0xLjQK...",  // Base64 encoded PDF
  "fields": [
    {
      "fieldId": "68f23882ce4904231796c813",
      "page": 1,
      "x": 320.27,
      "y": 448.99,
      "width": 120,
      "height": 40,
      "type": "text",           // "text" or "signature"
      "label": "Name"
    },
    {
      "fieldId": "68f23882ce4904231796c814",
      "page": 1,
      "x": 320.27,
      "y": 500,
      "width": 150,
      "height": 50,
      "type": "signature",
      "label": "Signature"
    }
  ]
}
```

**Response:**
```json
{
  "pdfBase64": "JVBERi0xLjQK...",
  "message": "Template prepared successfully with 2 fields",
  "success": true
}
```

**Usage Flow:**
1. Call this API **once per envelope** at envelope creation
2. Returns PDF with all empty placeholders ready
3. Store this PDF or its reference (optional - can regenerate)

---

### 2. Embed Values

**Endpoint:** `POST /api/pdf/embed-values`

**Purpose:** Embeds field values into PDF placeholders while preserving signatures

**Request Body:**
```json
{
  "pdfBase64": "JVBERi0xLjQK...",  // PDF from previous step or from signature
  "fieldValues": [
    {
      "fieldId": "68f23882ce4904231796c813",
      "value": "John Doe"
    },
    {
      "fieldId": "68f23882ce4904231796c814",
      "value": "john@example.com"
    }
  ]
}
```

**Response:**
```json
{
  "pdfBase64": "JVBERi0xLjQK...",
  "message": "Values embedded successfully for 2 fields",
  "success": true
}
```

**Usage Flow:**
1. Call for **each recipient** before signature
2. Embeds only that recipient's field values
3. Creates a new PDF revision (preserves previous signatures)
4. Send returned PDF to third-party signature provider

---

## Complete Workflow Example

### Setup (Node.js)

```javascript
const envelopeId = "68f23669ce4904231796c7fb";
const recipients = [
  { id: "recipient_1", name: "John" },
  { id: "recipient_2", name: "Jane" }
];

// Get fields from database
const fields = await Field.find({ envelopeId });

// Convert to required format
const fieldDefinitions = fields.map(f => ({
  fieldId: f._id,
  page: f.page,
  x: f.x,
  y: f.y,
  width: f.width,
  height: f.height,
  type: f.type,
  label: f.label
}));
```

### Step 1: Prepare Template

```javascript
// Call Java service to prepare template
const response = await fetch('http://localhost:8081/api/pdf/prepare-template', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    pdfBase64: documentBase64,
    fields: fieldDefinitions
  })
});

const result = await response.json();
let currentPdf = result.pdfBase64;

// Store initial prepared PDF (optional)
await Envelope.updateOne(
  { _id: envelopeId },
  { templatePdf: currentPdf }
);
```

### Step 2: Recipient 1 Signs

```javascript
// When recipient 1 submits their values
const recipient1Values = [
  { fieldId: "field_1_name", value: "John Doe" },
  { fieldId: "field_1_email", value: "john@example.com" }
];

// Embed values
const embedResponse = await fetch('http://localhost:8081/api/pdf/embed-values', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    pdfBase64: currentPdf,
    fieldValues: recipient1Values
  })
});

const embedResult = await embedResponse.json();
let pdfWithValues = embedResult.pdfBase64;

// Send to third-party signature service
const signatureResponse = await signWithVSign(pdfWithValues, 'recipient_1');

// Signature service returns PDF with R1's signature embedded
currentPdf = signatureResponse.pdfBase64;

// Store signed PDF version
await Envelope.updateOne(
  { _id: envelopeId },
  { currentPdf: currentPdf }
);

// Mark R1 as completed
await Recipient.updateOne(
  { _id: 'recipient_1' },
  { status: 'signed' }
);
```

### Step 3: Recipient 2 Signs

```javascript
// When recipient 2 submits their values
const recipient2Values = [
  { fieldId: "field_2_name", value: "Jane Smith" },
  { fieldId: "field_2_phone", value: "+91-9876543210" }
];

// Load the PDF with R1's signature still intact
const envelope = await Envelope.findById(envelopeId);
currentPdf = envelope.currentPdf; // Has R1's signature

// Embed R2's values
const embedResponse = await fetch('http://localhost:8081/api/pdf/embed-values', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    pdfBase64: currentPdf,
    fieldValues: recipient2Values
  })
});

const embedResult = await embedResponse.json();
let pdfWithR2Values = embedResult.pdfBase64;

// Send to signature service
const signatureResponse = await signWithVSign(pdfWithR2Values, 'recipient_2');

// Now PDF has both R1's signature AND R2's signature (both valid!)
const finalPdf = signatureResponse.pdfBase64;

// Store final signed PDF
await Envelope.updateOne(
  { _id: envelopeId },
  { currentPdf: finalPdf, status: 'completed' }
);
```

---

## Technical Details

### Incremental Updates

- **Key Feature:** Each operation creates a new PDF revision without overwriting previous content
- **iText Usage:** `PdfWriter` uses `setSmartMode(true)` for incremental updates
- **PDF Structure:**
  ```
  Revision 1: Original + Placeholder fields
  Revision 2: Revision 1 + R1's values embedded
  Revision 3: Revisions 1-2 + R1's cryptographic signature
  Revision 4: Revisions 1-3 + R2's values embedded
  Revision 5: Revisions 1-4 + R2's cryptographic signature
  ```

### Signature Validation

- Each signature is bound to its own revision + all prior revisions
- Modifying earlier revisions invalidates dependent signatures
- Appending new revisions (incremental mode) keeps all previous signatures valid

### Coordinate System

- Input coordinates use **top-left origin** (common in web applications)
- PDF uses **bottom-left origin**
- Service automatically converts: `y_pdf = pageHeight - y_input - height`

---

## Setup & Installation

### Prerequisites

- Java 17+
- Maven 3.8+
- Spring Boot 3.2+

### Build

```bash
cd pdf-java-service

# Install dependencies
mvn clean install

# Run the service
mvn spring-boot:run
```

The service will start on `http://localhost:8081`

### Verify Installation

```bash
curl http://localhost:8081/api/pdf/health

# Response:
# {"status":"OK","service":"PDF Service"}
```

---

## Dependencies

The service uses the following key dependencies:

| Dependency | Version | Purpose |
|-----------|---------|---------|
| Spring Boot | 3.2.0 | REST API framework |
| iText 7 | 7.2.5 | PDF manipulation |
| Lombok | Latest | Reduce boilerplate |

---

## Integration Checklist

- [ ] Build and run the Java service on port 8081
- [ ] Create `/prepare-template` endpoint call at envelope creation
- [ ] Create `/embed-values` endpoint calls for each recipient
- [ ] Integrate with third-party signature provider
- [ ] Test with single recipient workflow
- [ ] Test with multiple recipients (verify signature validity)
- [ ] Store field definitions in Node.js database
- [ ] Handle base64 encoding/decoding in Node.js

---

## Error Handling

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `PDF base64 is required` | Empty pdfBase64 | Ensure PDF is encoded in base64 |
| `Fields definition is required` | Empty fields array | Check field definitions are sent |
| `Field not found` | fieldId doesn't exist | Verify fieldId matches template |
| `Invalid PDF` | Corrupted base64 | Validate base64 encoding before sending |

### Response Codes

- `200 OK` - Success
- `400 Bad Request` - Missing or invalid input
- `500 Internal Server Error` - Processing error

---

## Testing

### Test with cURL

```bash
# Prepare template
curl -X POST http://localhost:8081/api/pdf/prepare-template \
  -H "Content-Type: application/json" \
  -d '{
    "pdfBase64": "JVBERi0xLjQK...",
    "fields": [{
      "fieldId": "test_1",
      "page": 1,
      "x": 100,
      "y": 100,
      "width": 100,
      "height": 30,
      "type": "text",
      "label": "TestField"
    }]
  }'

# Embed values
curl -X POST http://localhost:8081/api/pdf/embed-values \
  -H "Content-Type: application/json" \
  -d '{
    "pdfBase64": "JVBERi0xLjQK...",
    "fieldValues": [{
      "fieldId": "test_1",
      "value": "Test Value"
    }]
  }'
```

---

## Logging

Service uses SLF4J with Logback. Configure in `application.properties`:

```properties
# Log levels
logging.level.com.pdfservice=DEBUG
logging.level.org.springframework.web=INFO
logging.level.com.itextpdf=WARN
```

---

## Performance Notes

- Template preparation is **one-time operation** per envelope
- Embedding values is incremental - **scales with PDF size**
- Base64 encoding adds ~33% overhead - consider file size limits
- For large documents (>10MB), consider streaming implementations

---

## Support

For issues:
1. Check logs in terminal output
2. Verify base64 encoding
3. Check field coordinates are valid
4. Ensure PDF is not encrypted
5. Review iText 7 documentation: https://itextpdf.com/en/resources/technote/itextpdf-7-release-notes

---

## License

This service is part of the ITIO Digital Signature Platform
