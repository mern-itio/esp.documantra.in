# Quick Reference

## APIs at a Glance

| API | Method | Path | Purpose |
|-----|--------|------|---------|
| Prepare Template | `POST` | `/api/pdf/prepare-template` | Create empty field placeholders |
| Embed Values | `POST` | `/api/pdf/embed-values` | Embed field values into PDF |
| Health Check | `GET` | `/api/pdf/health` | Service health status |

---

## Request/Response Templates

### Prepare Template
```
POST /api/pdf/prepare-template

Request:
{
  "pdfBase64": "JVBERi0xLjQK...",
  "fields": [
    {
      "fieldId": "field_id",
      "page": 1,
      "x": 100.0,
      "y": 100.0,
      "width": 100.0,
      "height": 30.0,
      "type": "text",
      "label": "Field Label"
    }
  ]
}

Response:
{
  "pdfBase64": "JVBERi0xLjQK...",
  "message": "Template prepared successfully",
  "success": true
}
```

### Embed Values
```
POST /api/pdf/embed-values

Request:
{
  "pdfBase64": "JVBERi0xLjQK...",
  "fieldValues": [
    {
      "fieldId": "field_id",
      "value": "Field Value"
    }
  ]
}

Response:
{
  "pdfBase64": "JVBERi0xLjQK...",
  "message": "Values embedded successfully",
  "success": true
}
```

---

## Complete Flow

```
1. Prepare Template
   └─> PDF + All Field Definitions
       └─> PDF with empty placeholders

2. Recipient 1
   ├─> Embed Values (R1's values)
   │   └─> PDF with R1 values embedded
   └─> Third-party Signature
       └─> PDF with R1 signature

3. Recipient 2
   ├─> Embed Values (R2's values)
   │   └─> PDF with R1 signature + R2 values
   └─> Third-party Signature
       └─> PDF with R1 signature + R2 signature

4. Result
   ✓ Single PDF with multiple valid signatures
   ✓ Previous signatures remain intact
   ✓ All field values preserved
```

---

## Key Points

✓ Both APIs use **incremental PDF updates**
✓ Each operation creates a **new PDF revision**
✓ Previous signatures remain **cryptographically valid**
✓ Non-signature fields are **flattened** after embedding
✓ Only **one round of modification** per recipient

---

## Installation & Run

```bash
cd pdf-java-service
mvn clean install
mvn spring-boot:run
```

Service runs on `http://localhost:8081`

---

## Node.js Integration (Minimal Example)

```javascript
const axios = require('axios');

const pdfService = axios.create({
  baseURL: 'http://localhost:8081/api/pdf'
});

// Prepare template
async function prepareTemplate(pdfBase64, fields) {
  const { data } = await pdfService.post('/prepare-template', {
    pdfBase64,
    fields
  });
  return data.pdfBase64;
}

// Embed values
async function embedValues(pdfBase64, fieldValues) {
  const { data } = await pdfService.post('/embed-values', {
    pdfBase64,
    fieldValues
  });
  return data.pdfBase64;
}
```

---

## Field Coordinates

- **Origin:** Top-left (web standard)
- **X-axis:** Left to right
- **Y-axis:** Top to bottom
- **Units:** Points (1 point = 1/72 inch)

**Conversion Note:** Service automatically converts to PDF's bottom-left origin

---

## Incremental Signature Example

```
Original PDF: [Content]

After Prepare: [Content + Fields_R1 + Fields_R2]

After Embed R1: 
  Revision 1: [Content + Fields_R1 + Fields_R2]
  Revision 2: [Revision 1 + R1_Values]

After Sign R1:
  Revision 1: [Content + Fields_R1 + Fields_R2]
  Revision 2: [Revision 1 + R1_Values]
  Revision 3: [Revision 2 + R1_Signature]  ← R1 signature bound here

After Embed R2:
  Revision 4: [Revisions 1-3 + R2_Values]

After Sign R2:
  Revision 5: [Revisions 1-4 + R2_Signature]  ← R2 signature bound here

Result: Both signatures valid!
  R1 validates: Revision 1 + Revision 2 + Revision 3
  R2 validates: All revisions 1-5
```

---

## Troubleshooting

| Symptom | Check |
|---------|-------|
| Connection refused | Is Java service running on 8081? |
| Invalid PDF | Is base64 encoded correctly? |
| Field not found | Does fieldId match template? |
| Timeout | Is PDF too large? Check logs. |

---

## Database Schema Reference

```javascript
// Fields Collection
{
  _id: ObjectId,
  envelopeId: ObjectId,
  recipientId: ObjectId,
  page: Number,
  x: Number,       // Top-left X
  y: Number,       // Top-left Y
  width: Number,
  height: Number,
  type: String,    // "text" or "signature"
  label: String,
  status: String   // "pending", "filled", "signed"
}

// Envelopes Collection
{
  _id: ObjectId,
  templatePdf: String,  // Base64 from prepare-template
  currentPdf: String,   // Latest PDF version
  status: String        // "pending", "in_progress", "completed"
}

// Recipients Collection
{
  _id: ObjectId,
  envelopeId: ObjectId,
  email: String,
  order: Number,
  status: String  // "pending", "values_submitted", "signed"
}
```

---

## Environment Setup

```bash
# Java Service
PORT=8081
JAVA_HOME=/path/to/java

# Node.js Service
PDF_SERVICE_URL=http://localhost:8081
PDF_SERVICE_TIMEOUT=30000
```

---

## Common Base64 Operations

```javascript
// Buffer to Base64
const base64 = buffer.toString('base64');

// Base64 to Buffer
const buffer = Buffer.from(base64, 'base64');

// File to Base64
const base64 = fs.readFileSync('file.pdf').toString('base64');

// Base64 to File
fs.writeFileSync('file.pdf', Buffer.from(base64, 'base64'));
```

---

## Next Steps

1. ✓ Start Java service
2. ✓ Test with `/health` endpoint
3. ✓ Integrate `/prepare-template` at envelope creation
4. ✓ Integrate `/embed-values` before each signature
5. ✓ Integrate with third-party signature provider
6. ✓ Test multi-recipient workflow

---

**For detailed information, see README.md and NODE_INTEGRATION.md**
