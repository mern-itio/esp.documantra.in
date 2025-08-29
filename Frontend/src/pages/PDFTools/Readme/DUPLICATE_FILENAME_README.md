# Duplicate Filename Prevention Feature

## Overview
This feature prevents users from uploading documents with the same filename in the same folder. When a duplicate is detected, users are prompted to rename the file before proceeding with the upload.

## Features

### 1. Pre-upload Duplicate Check
- Automatically checks for duplicate filenames before uploading
- Prevents unnecessary file uploads when duplicates are detected
- Improves user experience by catching issues early

### 2. Duplicate Resolution Modal
- User-friendly interface to resolve filename conflicts
- Shows information about both the new file and existing document
- Allows users to enter a custom filename
- Automatically preserves file extensions

### 3. Smart Filename Generation
- Generates unique filenames with timestamps and random suffixes
- "Generate Unique Name" button for quick resolution
- Ensures no conflicts with existing documents

### 4. Backend Validation
- Server-side duplicate filename checking
- Returns detailed error information including existing document details
- Proper HTTP status codes (409 Conflict) for duplicate scenarios

## Implementation Details

### Backend Changes

#### New API Endpoint
```
POST /api/documents/check-duplicate
```
- Checks if a filename already exists in a specific folder
- Returns duplicate status and existing document information

#### Enhanced Upload Endpoint
- Added duplicate filename validation in `uploadDocument` controller
- Returns 409 Conflict status with detailed error information
- Prevents file storage when duplicates are detected

#### New Controller Method
```javascript
async checkDuplicateFilename(req, res)
```
- Validates folder access permissions
- Checks for existing documents with the same name
- Returns structured response with duplicate status

### Frontend Changes

#### New Components
- `DuplicateFilenameModal.tsx` - Modal for resolving filename conflicts
- Enhanced `UploadModal.tsx` - Integrated duplicate checking

#### API Service Updates
- Added `checkDuplicateFilename` method to `documentAPI`
- Enhanced error handling for duplicate filename responses
- Proper error propagation with structured data

#### State Management
- Added duplicate filename state handling in upload modal
- Seamless integration with existing upload flow
- Automatic retry after filename resolution

## User Experience Flow

1. **File Selection**: User selects files for upload
2. **Duplicate Check**: System automatically checks for filename conflicts
3. **Conflict Detection**: If duplicates found, modal appears
4. **Resolution Options**:
   - Enter custom filename
   - Generate unique filename automatically
   - Cancel upload
5. **Upload Proceed**: After resolution, upload continues automatically

## Error Handling

### Duplicate Filename Error (409)
```json
{
  "success": false,
  "message": "A document with this name already exists in this folder",
  "code": "DUPLICATE_FILENAME",
  "data": {
    "existingDocument": {
      "id": "document_id",
      "name": "filename.pdf",
      "uploadedAt": "2024-01-15T10:30:00Z"
    }
  }
}
```

### Frontend Error Handling
- Automatic duplicate detection and modal display
- Graceful fallback if duplicate check fails
- User-friendly error messages and resolution options

## Configuration

### Supported File Types
- PDF, Word, Text, and other document formats
- Automatic file extension preservation
- Configurable file size limits

### Folder Context
- Duplicate checking is folder-aware
- Same filename can exist in different folders
- Root folder and subfolder separation

## Benefits

1. **Prevents Data Loss**: No accidental overwrites of existing documents
2. **Improves User Experience**: Clear feedback and resolution options
3. **Maintains Data Integrity**: Ensures unique document identification
4. **Reduces Storage Waste**: Prevents duplicate file uploads
5. **Professional Workflow**: Better document management practices

## Future Enhancements

1. **Bulk Rename**: Handle multiple duplicate files simultaneously
2. **Smart Suggestions**: AI-powered filename suggestions
3. **Version Control**: Option to create new versions instead of renaming
4. **Conflict Resolution History**: Track and manage filename conflicts
5. **Auto-rename Rules**: Configurable automatic naming conventions

## Testing

### Test Scenarios
1. Upload file with unique name (should succeed)
2. Upload file with duplicate name (should show modal)
3. Resolve duplicate with custom name (should succeed)
4. Resolve duplicate with generated name (should succeed)
5. Cancel duplicate resolution (should return to upload state)

### Backend Testing
```bash
# Test duplicate check endpoint
curl -X POST http://localhost:2102/api/documents/check-duplicate \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"filename": "test.pdf", "folderId": "folder_id"}'
```

## Security Considerations

1. **Permission Validation**: Users can only check duplicates in accessible folders
2. **Input Sanitization**: Filename input is properly validated
3. **Rate Limiting**: Duplicate check endpoints are rate-limited
4. **Audit Logging**: All duplicate resolution actions are logged

## Performance Considerations

1. **Efficient Queries**: Database queries use proper indexing
2. **Caching**: Duplicate check results can be cached for short periods
3. **Batch Operations**: Multiple files checked efficiently
4. **Async Processing**: Non-blocking duplicate resolution flow
