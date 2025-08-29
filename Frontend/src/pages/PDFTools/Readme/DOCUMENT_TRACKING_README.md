# Document Tracking Feature

## Overview

The Document Tracking feature provides comprehensive monitoring and analytics for document access, usage patterns, and activity across the PDF processing system. It automatically tracks documents processed by other features and provides manual tracking capabilities with shareable links.

## Features

### 🚀 **Automatic Tracking**
- **Seamless Integration**: Automatically tracks documents processed by other PDF tools
- **Real-time Logging**: Logs all document actions (view, download, edit, permission_set, metadata_removed, compressed, optimized)
- **User Context**: Captures user ID, IP address, user agent, and device information
- **Metadata Preservation**: Stores relevant processing details and results

### 📊 **Manual Tracking**
- **Document Upload**: Upload PDFs specifically for tracking purposes
- **Shareable Links**: Generate secure, time-limited links for document sharing
- **Access Monitoring**: Track who accesses documents via shared links
- **Expiration Control**: Set custom expiration dates for shared links

### 📈 **Dashboard & Analytics**
- **Real-time Statistics**: Total documents, actions, and activity metrics
- **Recent Activity**: Latest document actions across all users
- **Top Documents**: Most active documents with action counts
- **Action Distribution**: Breakdown of different action types

### 🔍 **Document Management**
- **Tracked Documents**: Comprehensive view of all monitored documents
- **Source Classification**: Distinguish between automatic, manual, and shared link tracking
- **Action History**: Detailed timeline of all document activities
- **Access Counts**: Track how many times documents have been accessed

### 📋 **Audit Trail**
- **Comprehensive Logging**: All document activities with full context
- **Advanced Filtering**: Filter by action type, date range, and other criteria
- **Export Capabilities**: Download tracking data in JSON or CSV format
- **Search & Pagination**: Efficient browsing through large datasets

## Data Collected

### **For Each Event**
- **Document Information**: ID, name, type, original filename
- **User Context**: User ID, IP address, user agent, device info
- **Action Details**: Type of action, timestamp, metadata
- **Tracking Context**: Source (automatic/manual/shared), tracking status

### **Automatic Tracking Events**
- **Permission Set**: When document permissions are configured
- **Metadata Removed**: When document metadata is cleaned
- **PDF Compressed**: When documents are compressed
- **Images Optimized**: When images within PDFs are optimized

### **Manual Tracking Events**
- **Document Upload**: When documents are uploaded for tracking
- **Shared Link Access**: When documents are accessed via shared links
- **Custom Actions**: Any additional user-defined tracking events

## Backend Implementation

### **Models**
```javascript
// Enhanced DocumentTracking model
const documentTrackingSchema = new mongoose.Schema({
  documentId: String,           // Unique document identifier
  documentName: String,         // Human-readable document name
  documentType: String,         // Document type (default: 'pdf')
  originalFilename: String,     // Original uploaded filename
  userId: String,               // User performing the action
  action: String,               // Action type (view, download, edit, etc.)
  timestamp: Date,              // When the action occurred
  ipAddress: String,            // Client IP address
  userAgent: String,            // Client user agent
  deviceInfo: String,           // Additional device information
  metadata: Object,             // Action-specific metadata
  isTracked: Boolean,           // Whether document is actively tracked
  trackingSource: String,       // automatic, manual, or shared_link
  shareableLink: String,        // Shareable link (if applicable)
  linkToken: String,            // Secure token for shared links
  expiresAt: Date,              // Link expiration date
  accessCount: Number,          // Number of times accessed
  lastAccessed: Date            // Last access timestamp
});
```

### **Controllers**
- **`logEvent`**: Log document events with full context
- **`uploadDocumentForTracking`**: Handle manual document uploads
- **`accessSharedDocument`**: Process shared link access
- **`getTrackedDocuments`**: Retrieve tracked document summaries
- **`getDocumentTracking`**: Get detailed tracking for specific documents
- **`getAuditTrail`**: Retrieve comprehensive audit logs
- **`getDashboardStats`**: Generate dashboard statistics

### **Routes**
```javascript
// Document tracking endpoints
POST   /document-tracking/log                    // Log events
POST   /document-tracking/upload                 // Upload for tracking
GET    /document-tracking/share/:linkToken       // Access shared document
GET    /document-tracking/documents              // Get tracked documents
GET    /document-tracking/document/:documentId   // Get document tracking
GET    /document-tracking/audit-trail            // Get audit trail
GET    /document-tracking/dashboard-stats        // Get dashboard stats
GET    /document-tracking/export                 // Export tracking data
```

## Frontend Implementation

### **Components**
- **`DocumentTracking`**: Main component with tabbed interface
- **Dashboard Tab**: Statistics, recent activity, top documents
- **Documents Tab**: List of tracked documents with details
- **Audit Trail Tab**: Comprehensive activity logs with filtering
- **Upload Tab**: Document upload and tracking setup

### **Services**
```typescript
// Enhanced document tracking service
export const documentTrackingService = {
  // Core functionality
  logEvent(request: LogEventRequest): Promise<LogEventResponse>
  uploadDocumentForTracking(request: UploadDocumentRequest): Promise<UploadDocumentResponse>
  getTrackedDocuments(filters: TrackingFilters): Promise<TrackedDocumentsResponse>
  getDocumentTracking(documentId: string, filters: TrackingFilters): Promise<DocumentTrackingResponse>
  
  // Analytics and reporting
  getDashboardStats(startDate?: string, endDate?: string): Promise<DashboardStatsResponse>
  getAuditTrail(filters: TrackingFilters): Promise<AuditTrailResponse>
  exportTrackingData(request: ExportRequest): Promise<void>
  
  // Helper methods for automatic tracking
  logDocumentPermissionSet(documentId: string, documentName: string, originalFilename: string, userId: string, metadata?: Record<string, any>): Promise<void>
  logDocumentMetadataRemoved(documentId: string, documentName: string, originalFilename: string, userId: string, metadata?: Record<string, any>): Promise<void>
  logDocumentCompressed(documentId: string, documentName: string, originalFilename: string, userId: string, metadata?: Record<string, any>): Promise<void>
  logDocumentOptimized(documentId: string, documentName: string, originalFilename: string, userId: string, metadata?: Record<string, any>): Promise<void>
};
```

## Integration Points

### **Automatic Tracking Integration**
The system automatically integrates with existing PDF processing features:

1. **Set Permissions**: Logs when document permissions are configured
2. **Remove Metadata**: Tracks metadata cleaning operations
3. **Compress PDF**: Monitors PDF compression activities
4. **Optimize Images**: Records image optimization processes

### **Manual Tracking Integration**
Users can manually upload documents for tracking:

1. **Upload PDF**: Select file and provide document name
2. **Configure Expiration**: Set link expiration (7 days to 1 year)
3. **Generate Link**: Create shareable tracking link
4. **Monitor Access**: Track all access via the shared link

## Usage Examples

### **Automatic Tracking (Backend)**
```javascript
// In any PDF processing controller
try {
  const DocumentTracking = require('../models/documentTracking');
  const trackingRecord = new DocumentTracking({
    documentId: crypto.randomBytes(16).toString('hex'),
    documentName: req.file.originalname,
    documentType: 'pdf',
    originalFilename: req.file.originalname,
    userId: req.user?.id || 'anonymous',
    action: 'permission_set', // or 'metadata_removed', 'compressed', 'optimized'
    ipAddress: req.ip,
    userAgent: req.get('User-Agent'),
    isTracked: true,
    trackingSource: 'automatic',
    metadata: { /* action-specific metadata */ }
  });
  
  await trackingRecord.save();
} catch (trackingError) {
  console.error('Failed to log tracking event:', trackingError);
  // Don't fail main operation if tracking fails
}
```

### **Manual Tracking (Frontend)**
```typescript
// Upload document for tracking
const result = await documentTrackingService.uploadDocumentForTracking({
  file: selectedFile,
  userId: 'current-user-id',
  documentName: 'Important Document',
  expiresInDays: 30
});

// Share the generated link
const shareableLink = result.shareableLink;
```

### **Dashboard Integration**
```typescript
// Load dashboard statistics
const stats = await documentTrackingService.getDashboardStats();
console.log(`Tracking ${stats.stats.totalDocuments} documents`);
console.log(`Total actions: ${stats.stats.totalActions}`);

// Get tracked documents
const documents = await documentTrackingService.getTrackedDocuments();
documents.documents.forEach(doc => {
  console.log(`${doc.documentName}: ${doc.totalActions} actions`);
});
```

## Performance Considerations

### **Database Optimization**
- **Indexed Fields**: Critical fields are indexed for fast queries
- **Compound Indexes**: Optimized for common query patterns
- **Aggregation Pipelines**: Efficient data grouping and statistics

### **Caching Strategy**
- **Dashboard Stats**: Cached for 5 minutes to reduce database load
- **Document Lists**: Paginated with configurable limits
- **Audit Trail**: Efficient filtering and pagination

### **Scalability**
- **Horizontal Scaling**: MongoDB supports horizontal scaling
- **Connection Pooling**: Efficient database connection management
- **Async Operations**: Non-blocking tracking operations

## Security Features

### **Data Protection**
- **IP Address Logging**: Tracks client IP addresses for security
- **User Agent Logging**: Records client browser/device information
- **Access Control**: JWT-based authentication for sensitive operations

### **Shared Link Security**
- **Time-limited Access**: Configurable expiration dates
- **Secure Tokens**: Cryptographically secure link generation
- **Access Monitoring**: Track all access attempts and patterns

## Monitoring and Maintenance

### **Health Checks**
- **Database Connectivity**: Monitor MongoDB connection status
- **Service Availability**: Track API endpoint response times
- **Error Logging**: Comprehensive error tracking and reporting

### **Data Retention**
- **Automatic Cleanup**: Old tracking records are automatically archived
- **Configurable Retention**: Adjustable retention periods per organization
- **Export Capabilities**: Download data before cleanup operations

### **Performance Monitoring**
- **Query Performance**: Monitor slow database queries
- **Response Times**: Track API endpoint performance
- **Resource Usage**: Monitor memory and CPU utilization

## Future Enhancements

### **Planned Features**
- **Real-time Notifications**: WebSocket-based activity alerts
- **Advanced Analytics**: Machine learning-based usage patterns
- **Integration APIs**: Third-party system integrations
- **Mobile App**: Native mobile tracking applications

### **Scalability Improvements**
- **Event Streaming**: Apache Kafka integration for high-volume tracking
- **Microservices**: Separate tracking service for better scalability
- **Global Distribution**: Multi-region deployment support

## Troubleshooting

### **Common Issues**
1. **Tracking Events Not Logged**: Check MongoDB connection and model imports
2. **Shared Links Not Working**: Verify link expiration and token validity
3. **Dashboard Not Loading**: Check API endpoint availability and authentication
4. **Performance Issues**: Monitor database indexes and query optimization

### **Debug Mode**
Enable debug logging for detailed tracking information:
```javascript
// In backend controllers
console.log('Document tracking event logged:', {
  documentId,
  action,
  userId,
  timestamp: new Date()
});
```

## Conclusion

The Document Tracking feature provides a comprehensive solution for monitoring document usage across the PDF processing system. With automatic integration, manual tracking capabilities, and powerful analytics, it offers valuable insights into document workflows and user behavior while maintaining security and performance standards.
