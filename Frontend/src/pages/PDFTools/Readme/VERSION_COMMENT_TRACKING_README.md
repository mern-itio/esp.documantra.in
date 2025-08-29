# Version Comment Tracking Feature

## Overview
This feature allows users to track which version of a document a comment was made on. When users add comments, the system automatically captures the current document version, enabling better traceability and version-specific discussions.

## Features

### 1. Automatic Version Capture
- Comments automatically capture the current document version when created
- Version information includes version ID, number, and description
- Fallback to latest version if no specific version is provided

### 2. Version-Based Comment Filtering
- Filter comments by specific document versions
- View all comments across all versions
- Version selector dropdown in the comment interface

### 3. Version Information Display
- Each comment shows which version it was made on
- Version badges with version number and description
- Visual indicators for version-specific comments

### 4. Version Comment Statistics
- Summary showing comment counts per version
- Total comment count across all versions
- Quick overview of discussion activity

## Implementation Details

### Backend Changes

#### Comment Model Updates
```javascript
// New fields added to Comment schema
versionId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Version',
  required: false
},
versionNumber: {
  type: String,
  required: false
},
versionDescription: {
  type: String,
  required: false
}
```

#### New API Endpoints
```
GET /api/documents/:documentId/versions/:versionId/comments
```
- Retrieves comments for a specific document version
- Includes version information in response
- Maintains access control and permissions

#### Enhanced Comment Creation
- Automatically captures current version information
- Supports explicit version specification
- Fallback to latest version if none provided

### Frontend Changes

#### Comment Interface Updates
- Version selector dropdown
- Version information display in comments
- Version-based filtering controls

#### Comment Display Enhancements
- Version badges on each comment
- Version summary statistics
- Filtered comment views by version

## User Experience Flow

1. **Document Viewing**: User opens a document with multiple versions
2. **Comment Creation**: User adds a comment (automatically captures current version)
3. **Version Selection**: User can filter comments by specific versions
4. **Version Tracking**: Each comment displays its associated version
5. **Version Comparison**: Users can see how discussions evolved across versions

## API Usage Examples

### Create Comment with Version
```javascript
// Comment automatically captures current version
const comment = await commentAPI.createComment(documentId, {
  content: "This section needs revision",
  position: { page: 1, x: 100, y: 100 }
});
```

### Get Comments by Version
```javascript
// Get comments for specific version
const versionComments = await commentAPI.getDocumentComments(documentId, versionId);

// Get all comments (across versions)
const allComments = await commentAPI.getDocumentComments(documentId);
```

### Comment Response Structure
```json
{
  "success": true,
  "data": [
    {
      "_id": "comment_id",
      "content": "Comment text",
      "author": "user@example.com",
      "timestamp": "2024-01-15T10:30:00Z",
      "versionId": {
        "_id": "version_id",
        "version": "v2.1",
        "description": "Updated content section",
        "createdAt": "2024-01-15T09:00:00Z"
      },
      "versionNumber": "v2.1",
      "versionDescription": "Updated content section"
    }
  ]
}
```

## Benefits

1. **Traceability**: Know exactly which version a comment refers to
2. **Context Awareness**: Understand discussion context across versions
3. **Version Management**: Better organization of feedback and discussions
4. **Collaboration**: Team members can focus on version-specific issues
5. **Document Evolution**: Track how feedback influenced document changes

## Use Cases

### 1. Document Review Process
- Reviewers comment on specific versions
- Track feedback implementation across versions
- Maintain review history per version

### 2. Collaborative Editing
- Team members discuss changes in context
- Version-specific discussions and decisions
- Clear feedback attribution

### 3. Quality Assurance
- QA comments linked to specific versions
- Bug reports with version context
- Issue resolution tracking

### 4. Client Feedback
- Client comments on specific versions
- Version comparison discussions
- Approval process tracking

## Configuration Options

### Version Display
- Show/hide version information
- Customize version badge styling
- Configure version selector behavior

### Comment Filtering
- Default version filter
- Version grouping options
- Cross-version comment linking

### Statistics Display
- Comment count thresholds
- Version summary format
- Activity indicators

## Future Enhancements

1. **Cross-Version Linking**: Link related comments across versions
2. **Version Comparison**: Side-by-side comment comparison
3. **Comment Migration**: Move comments between versions
4. **Version Branches**: Support for document branching
5. **Comment Templates**: Predefined comment types per version

## Testing Scenarios

1. **Version Capture**: Verify comments capture correct version
2. **Version Filtering**: Test comment filtering by version
3. **Version Display**: Ensure version information shows correctly
4. **Version Changes**: Test behavior when switching versions
5. **Fallback Handling**: Verify fallback to latest version

## Security Considerations

1. **Version Access Control**: Users can only see comments for accessible versions
2. **Permission Validation**: Comment creation respects document permissions
3. **Data Integrity**: Version information cannot be tampered with
4. **Audit Logging**: Track version-related comment activities

## Performance Considerations

1. **Efficient Queries**: Optimized database queries for version filtering
2. **Caching**: Cache version information for better performance
3. **Lazy Loading**: Load version details as needed
4. **Indexing**: Proper database indexing for version queries
