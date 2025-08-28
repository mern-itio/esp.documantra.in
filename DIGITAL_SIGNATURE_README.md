# Digital Signature Module

A comprehensive digital signature solution for PDF documents with certificate validation, timestamp authority, and signature verification capabilities.

## Features

### 🔐 Certificate Management
- **Self-signed Certificate Generation**: Create X.509 certificates with custom details
- **Certificate Storage**: Secure storage of private keys and certificates
- **Certificate Validation**: Built-in validation for certificate integrity
- **Multiple Certificate Support**: Manage multiple certificates for different purposes

### ✍️ Digital Signature Creation
- **PDF Signing**: Add cryptographic signatures to PDF documents
- **Signature Fields**: Create and position signature fields on PDF pages
- **Customizable Metadata**: Set reason, location, and contact information
- **Timestamp Authority**: Optional integration with timestamp services
- **Multiple Signature Support**: Support for multiple signatures on single documents

### 🔍 Signature Verification
- **Signature Validation**: Verify signature authenticity and integrity
- **Certificate Chain Validation**: Validate certificate trust chains
- **Signature Details**: Extract and display signature metadata
- **Batch Verification**: Verify multiple signatures simultaneously
- **Status Reporting**: Clear status indicators for verification results

### ⏰ Timestamp Authority
- **Hash-based Timestamping**: Generate timestamps for document hashes
- **Authority Integration**: Simulated timestamp authority service
- **Policy Compliance**: Support for different timestamp policies
- **Audit Trail**: Maintain timestamp verification records

## Architecture

### Backend Services

#### Digital Signature Controller (`digitalSignatureController.js`)
- **Certificate Generation**: RSA key pair generation and X.509 certificate creation
- **PDF Signing**: PDF manipulation using pdf-lib and cryptographic operations
- **Signature Verification**: PDF analysis and signature validation
- **Timestamp Services**: Hash-based timestamp generation
- **Certificate Management**: File-based certificate storage and retrieval

#### API Routes (`digitalSignatureRoute.js`)
- **POST** `/generate-certificate` - Generate new certificates
- **GET** `/list-certificates` - List available certificates
- **POST** `/add-signature` - Add digital signature to PDF
- **POST** `/verify-signature` - Verify PDF signatures
- **POST** `/timestamp-authority` - Get timestamp tokens
- **GET** `/download/:filename` - Download signed PDFs
- **GET** `/health` - Service health check

### Frontend Components

#### Digital Signature Component (`DigitalSignature.tsx`)
- **Tabbed Interface**: Three main sections for different operations
- **File Upload**: Drag-and-drop PDF file selection
- **Certificate Selection**: Dropdown selection of available certificates
- **Form Validation**: Real-time validation of user inputs
- **Progress Indicators**: Visual feedback during operations
- **Result Display**: Comprehensive results with download options

#### Service Layer (`digitalSignatureService.ts`)
- **API Integration**: HTTP client for backend communication
- **File Handling**: File upload and download management
- **Error Handling**: Comprehensive error handling and user feedback
- **Validation**: Client-side validation for forms and inputs

#### Type Definitions (`digitalSignature.ts`)
- **TypeScript Interfaces**: Strong typing for all data structures
- **Request/Response Types**: API contract definitions
- **Certificate Types**: Certificate and validation type definitions
- **Signature Types**: Signature and verification result types

## Installation & Setup

### Backend Dependencies

```bash
cd Backend/services/pdf-service
npm install node-forge
```

### Frontend Dependencies

The frontend uses existing dependencies:
- React with TypeScript
- Axios for HTTP requests
- Tailwind CSS for styling
- Lucide React for icons

### Environment Configuration

Ensure the following environment variables are set:

```env
VITE_PDF_SERVICE_URL=http://localhost:2104
```

## Usage

### 1. Generate Certificate

```typescript
const certificateRequest = {
  commonName: 'John Doe',
  organization: 'Acme Corp',
  country: 'US'
};

const response = await digitalSignatureService.generateCertificate(certificateRequest);
```

### 2. Add Digital Signature

```typescript
const signatureRequest = {
  file: pdfFile,
  privateKeyFile: 'private-key-1234567890.pem',
  certificateFile: 'certificate-1234567890.pem',
  reason: 'Document approval',
  location: 'Digital signature',
  contactInfo: 'signer@example.com',
  timestamp: true
};

const response = await digitalSignatureService.addDigitalSignature(signatureRequest);
```

### 3. Verify Signature

```typescript
const verifyRequest = {
  file: signedPdfFile
};

const response = await digitalSignatureService.verifyDigitalSignature(verifyRequest);
```

### 4. Get Timestamp

```typescript
const timestampRequest = {
  hash: 'document-hash-value'
};

const response = await digitalSignatureService.getTimestampAuthority(timestampRequest);
```

## API Endpoints

### Certificate Management

#### Generate Certificate
```http
POST /pdf-digital-signature/generate-certificate
Content-Type: application/json

{
  "commonName": "John Doe",
  "organization": "Acme Corp",
  "country": "US"
}
```

#### List Certificates
```http
GET /pdf-digital-signature/list-certificates
```

### Digital Signing

#### Add Signature
```http
POST /pdf-digital-signature/add-signature
Content-Type: multipart/form-data

file: [PDF file]
privateKeyFile: "private-key-1234567890.pem"
certificateFile: "certificate-1234567890.pem"
reason: "Document approval"
location: "Digital signature"
contactInfo: "signer@example.com"
timestamp: "true"
```

#### Verify Signature
```http
POST /pdf-digital-signature/verify-signature
Content-Type: multipart/form-data

file: [PDF file]
```

### Timestamp Services

#### Get Timestamp
```http
POST /pdf-digital-signature/timestamp-authority
Content-Type: application/json

{
  "hash": "document-hash-value"
}
```

### File Downloads

#### Download Signed PDF
```http
GET /pdf-digital-signature/download/:filename
```

## Security Features

### Cryptographic Security
- **RSA-2048**: Strong asymmetric encryption for key pairs
- **SHA-256**: Secure hash algorithm for document integrity
- **X.509 Certificates**: Industry-standard certificate format
- **Private Key Protection**: Secure storage of private keys

### Validation & Verification
- **Certificate Chain Validation**: Verify certificate trust relationships
- **Signature Integrity**: Ensure signatures haven't been tampered with
- **Timestamp Validation**: Verify document timestamps
- **Format Validation**: Validate PDF and certificate formats

### Access Control
- **File Upload Validation**: Restrict file types and sizes
- **Certificate Access**: Secure access to private keys
- **Download Security**: Secure file serving with proper headers

## Error Handling

### Common Error Scenarios

#### Certificate Errors
- Invalid certificate format
- Expired certificates
- Certificate chain validation failures
- Private key mismatches

#### PDF Errors
- Invalid PDF format
- Corrupted PDF files
- PDF security restrictions
- File size limitations

#### Signature Errors
- Invalid signature data
- Signature verification failures
- Missing signature fields
- Timestamp validation errors

### Error Response Format

```json
{
  "error": "Error description",
  "details": "Detailed error information",
  "code": "ERROR_CODE"
}
```

## Performance Considerations

### File Size Limits
- **PDF Upload**: Maximum 50MB per file
- **Certificate Files**: Maximum 10KB per certificate
- **Batch Processing**: Support for multiple files

### Processing Times
- **Certificate Generation**: ~2-5 seconds
- **PDF Signing**: ~5-15 seconds (depending on file size)
- **Signature Verification**: ~2-8 seconds
- **Timestamp Generation**: ~1-3 seconds

### Memory Usage
- **PDF Processing**: Efficient memory management for large files
- **Certificate Storage**: Optimized certificate caching
- **Stream Processing**: File streaming for large documents

## Testing

### Backend Testing

```bash
cd Backend/services/pdf-service
npm test
```

### Frontend Testing

```bash
cd Frontend
npm test
```

### Manual Testing

1. **Certificate Generation Test**
   - Generate test certificate
   - Verify certificate format
   - Check certificate validity

2. **Signature Creation Test**
   - Upload test PDF
   - Add digital signature
   - Verify output file

3. **Signature Verification Test**
   - Upload signed PDF
   - Verify signature
   - Check verification results

## Troubleshooting

### Common Issues

#### Certificate Generation Fails
- Check node-forge installation
- Verify file permissions for certificates directory
- Check available disk space

#### PDF Signing Fails
- Verify PDF file integrity
- Check certificate and private key files
- Ensure sufficient memory for large files

#### Verification Errors
- Check PDF format compatibility
- Verify signature field existence
- Check certificate validity

### Debug Information

Enable debug logging by setting:

```env
DEBUG=pdf-service:digital-signature
```

### Support Commands

```bash
# Check service health
curl http://localhost:2104/pdf-digital-signature/health

# List certificates
curl http://localhost:2104/pdf-digital-signature/list-certificates

# Test certificate generation
curl -X POST http://localhost:2104/pdf-digital-signature/test-certificate
```

## Future Enhancements

### Planned Features
- **Advanced Certificate Management**: PKI integration
- **Batch Processing**: Multiple file signing
- **Cloud Storage**: Certificate cloud storage
- **Audit Logging**: Comprehensive audit trails
- **Compliance Reporting**: Regulatory compliance features

### Integration Opportunities
- **LDAP Integration**: Enterprise directory services
- **Hardware Security Modules**: HSM integration
- **Blockchain Timestamping**: Distributed timestamp services
- **Multi-factor Authentication**: Enhanced security options

## Contributing

### Development Setup
1. Fork the repository
2. Create feature branch
3. Implement changes
4. Add tests
5. Submit pull request

### Code Standards
- Follow existing code style
- Add TypeScript types
- Include error handling
- Write comprehensive tests
- Update documentation

## License

This module is part of the Final Draft and Sign platform and follows the same licensing terms.

## Support

For technical support and questions:
- Create an issue in the repository
- Check the troubleshooting section
- Review the API documentation
- Contact the development team

---

**Note**: This digital signature module provides cryptographic security for PDF documents. Ensure compliance with local regulations and security requirements when implementing in production environments.
