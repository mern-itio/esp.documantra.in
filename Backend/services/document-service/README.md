# Document Management Service

A comprehensive document management service built with Node.js, Express, and MongoDB. This service handles document uploads, folder management, user permissions, and file operations.

## Features

- **Document Management**: Upload, download, update, delete documents
- **Folder Organization**: Hierarchical folder structure with permissions
- **User Authentication**: JWT-based authentication and authorization
- **File Storage**: Local file storage with user-specific directories
- **Search & Filtering**: Advanced document search and filtering
- **Bulk Operations**: Bulk delete and move operations
- **Permission System**: Role-based access control

## API Endpoints

### Documents

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/documents/upload` | Upload a new document |
| GET | `/api/documents` | Get user documents with filters |
| GET | `/api/documents/:id` | Get document details |
| PUT | `/api/documents/:id` | Update document metadata |
| DELETE | `/api/documents/:id` | Delete a document |
| POST | `/api/documents/:id/download` | Download a document |
| POST | `/api/documents/bulk-delete` | Bulk delete documents |

### Folders

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/folders` | Create a new folder |
| GET | `/api/folders` | Get user folders |
| GET | `/api/folders/:id` | Get folder details |
| PUT | `/api/folders/:id` | Update folder |
| DELETE | `/api/folders/:id` | Delete a folder |
| POST | `/api/folders/:id/move` | Move folder to new location |
| GET | `/api/folders/:id/breadcrumbs` | Get folder breadcrumbs |

## Setup Instructions

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (v5 or higher)
- npm or yarn

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Environment Configuration:**
   Create a `.env` file with the following variables:
   ```env
   PORT=4002
   NODE_ENV=development
   MONGO_URI=mongodb://localhost:27017/document_management
   ACCESS_TOKEN_SECRET=your_jwt_secret_key_here
   ```

3. **Database Setup:**
   Ensure MongoDB is running and accessible at the configured URI.

4. **Start the service:**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## File Upload Configuration

### Supported File Types

- **Documents**: PDF, DOC, DOCX, TXT, RTF
- **Spreadsheets**: XLS, XLSX, CSV
- **Presentations**: PPT, PPTX
- **Images**: JPG, PNG, GIF, BMP, TIFF
- **Other**: HTML, XML, JSON, ZIP

### File Limits

- **Maximum file size**: 50MB
- **Maximum files per upload**: 10
- **Storage location**: User-specific directories under `/uploads`

## Authentication

The service uses JWT tokens for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## Usage Examples

### Upload Document

```bash
curl -X POST http://localhost:4002/api/documents/upload \
  -H "Authorization: Bearer <token>" \
  -F "file=@document.pdf" \
  -F "folderId=60f7b3b3b3b3b3b3b3b3b3b3" \
  -F "description=Important document" \
  -F "tags=important,work"
```

### Create Folder

```bash
curl -X POST http://localhost:4002/api/folders \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Work Documents",
    "description": "Important work-related documents",
    "color": "#3b82f6"
  }'
```

### Get Documents

```bash
curl -X GET "http://localhost:4002/api/documents?page=1&limit=20&folderId=60f7b3b3b3b3b3b3b3b3b3b3" \
  -H "Authorization: Bearer <token>"
```

## Error Handling

The service returns consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error information"
}
```

### Common HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `500` - Internal Server Error

## Database Models

### Document Schema

- Basic file information (name, type, size, MIME type)
- File storage details (path, filename)
- User ownership and permissions
- Metadata (description, tags, status flags)
- Statistics (views, downloads)
- Timestamps

### Folder Schema

- Basic information (name, description)
- Hierarchy (parent folder, path)
- Ownership and permissions
- Organization (color, icon)
- Statistics (document count, folder count)
- Timestamps

## Security Features

- JWT-based authentication
- User-specific file storage
- Role-based permissions
- File type validation
- File size limits
- CORS configuration

## Development

### Running Tests

```bash
npm test
```

### Code Linting

```bash
npm run lint
```

### Database Migrations

The service automatically creates necessary indexes and collections on startup.

## Docker Support

The service includes Docker configuration for easy deployment:

```bash
docker build -t document-service .
docker run -p 4002:4002 document-service
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

# Document Service - Trash Functionality

This service includes a comprehensive trash system for managing deleted documents with automatic cleanup after 30 days.

## Features

- **Soft Delete**: Documents are marked as deleted instead of being permanently removed
- **30-Day Retention**: Deleted documents are kept for 30 days before automatic permanent deletion
- **Restore Functionality**: Users can restore documents from trash at any time within the 30-day period
- **Manual Cleanup**: Option to permanently delete documents before the 30-day period
- **Automatic Cleanup**: Scheduled cleanup of expired documents

## API Endpoints

### Get Deleted Documents (Trash)
```
GET /api/documents/trash
Query Parameters:
- page: Page number (default: 1)
- limit: Documents per page (default: 20)
- search: Search term for document names, descriptions, or tags
```

### Restore Document
```
POST /api/documents/:id/restore
Restores a deleted document from trash
```

### Permanently Delete Document
```
DELETE /api/documents/:id/permanent
Permanently deletes a document (only works after 30 days in trash)
```

### Move Document to Trash
```
DELETE /api/documents/:id
Moves a document to trash (soft delete)
```

## Database Schema

The Document model includes these new fields:
- `isDeleted`: Boolean flag indicating if document is in trash
- `deletedAt`: Date when document was moved to trash

## Cleanup Process

### Automatic Cleanup
Documents are automatically cleaned up after 30 days in trash. The cleanup process:
1. Finds documents that have been in trash for more than 30 days
2. Deletes the physical files from storage
3. Removes the document records from the database

### Manual Cleanup
You can run the cleanup script manually:
```bash
npm run cleanup
```

### Scheduled Cleanup
For production environments, set up a cron job or scheduled task to run the cleanup script daily:
```bash
# Example cron job (runs daily at 2 AM)
0 2 * * * cd /path/to/document-service && npm run cleanup
```

## Frontend Integration

The frontend includes:
- **TrashPage**: Displays all deleted documents with restore and permanent delete options
- **DocumentCard**: Updated to show "Move to Trash" instead of "Delete"
- **Store Functions**: New functions for trash operations (`moveToTrash`, `restoreFromTrash`, `permanentlyDelete`)

## Usage Examples

### Moving a Document to Trash
```typescript
const { moveToTrash } = useDocumentStore();
await moveToTrash(documentId);
```

### Restoring a Document
```typescript
const { restoreFromTrash } = useDocumentStore();
await restoreFromTrash(documentId);
```

### Permanently Deleting a Document
```typescript
const { permanentlyDelete } = useDocumentStore();
await permanentlyDelete(documentId);
```

## Security Considerations

- Only document owners can move documents to trash
- Only document owners can restore documents from trash
- Only document owners can permanently delete documents
- Documents must be in trash for at least 30 days before permanent deletion
- Physical files are properly cleaned up to prevent storage bloat

## Monitoring

The cleanup script provides detailed logging:
- Number of documents found for cleanup
- Success/failure counts for each operation
- Cutoff date used for cleanup
- Individual document cleanup results

## Error Handling

- Failed cleanup operations are logged but don't stop the overall process
- Physical file deletion errors are handled gracefully
- Database operation errors are logged with details
- The cleanup script continues processing other documents even if some fail
