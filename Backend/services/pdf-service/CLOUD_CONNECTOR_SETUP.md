# Cloud Connector Setup Guide

## Overview

The Cloud Connector module provides integration with popular cloud storage services including Google Drive, Dropbox, OneDrive, Box, and iCloud Drive. This allows users to sync, download, and manage PDF files directly from their cloud storage accounts.

## Features

- **OAuth Authentication**: Secure connection to cloud services
- **File Synchronization**: Sync PDF files from cloud storage
- **File Management**: View, download, and manage cloud files
- **Storage Information**: Display storage usage and limits
- **Real-time Updates**: Automatic sync and status updates

## Backend Setup

### 1. Environment Variables

Add the following environment variables to your `.env` file:

```env
# Google Drive
GOOGLE_DRIVE_CLIENT_ID=your-google-drive-client-id
GOOGLE_DRIVE_CLIENT_SECRET=your-google-drive-client-secret
GOOGLE_DRIVE_REDIRECT_URI=http://localhost:2104/cloud-connector/callback

# Dropbox
DROPBOX_CLIENT_ID=your-dropbox-client-id
DROPBOX_CLIENT_SECRET=your-dropbox-client-secret
DROPBOX_REDIRECT_URI=http://localhost:2104/cloud-connector/callback

# OneDrive
ONEDRIVE_CLIENT_ID=your-onedrive-client-id
ONEDRIVE_CLIENT_SECRET=your-onedrive-client-secret
ONEDRIVE_REDIRECT_URI=http://localhost:2104/cloud-connector/callback

# Box
BOX_CLIENT_ID=your-box-client-id
BOX_CLIENT_SECRET=your-box-client-secret
BOX_REDIRECT_URI=http://localhost:2104/cloud-connector/callback

# iCloud Drive
ICLOUD_CLIENT_ID=your-icloud-client-id
ICLOUD_CLIENT_SECRET=your-icloud-client-secret
ICLOUD_REDIRECT_URI=http://localhost:2104/cloud-connector/callback
```

### 2. OAuth App Registration

#### Google Drive
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google Drive API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:2104/cloud-connector/callback`
6. Copy Client ID and Client Secret

#### Dropbox
1. Go to [Dropbox App Console](https://www.dropbox.com/developers/apps)
2. Create a new app
3. Select "Scoped access" and "Full Dropbox"
4. Add redirect URI: `http://localhost:2104/cloud-connector/callback`
5. Copy App key and App secret

#### OneDrive
1. Go to [Azure Portal](https://portal.azure.com/)
2. Register a new application
3. Add redirect URI: `http://localhost:2104/cloud-connector/callback`
4. Copy Application (client) ID and Client secret

#### Box
1. Go to [Box Developer Console](https://app.box.com/developers/console)
2. Create a new app
3. Select "Custom App" and "OAuth 2.0 with JWT"
4. Add redirect URI: `http://localhost:2104/cloud-connector/callback`
5. Copy Client ID and Client Secret

### 3. Database Models

The following MongoDB collections are created automatically:

- **cloudServiceConnections**: Stores OAuth tokens and connection info
- **cloudFiles**: Stores file metadata and sync status

## API Endpoints

### Authentication
- `GET /cloud-connector/auth/:serviceId` - Get OAuth authorization URL
- `GET /cloud-connector/callback` - Handle OAuth callback

### Services
- `GET /cloud-connector/services` - Get available cloud services
- `GET /cloud-connector/connected` - Get user's connected services
- `DELETE /cloud-connector/disconnect/:serviceId` - Disconnect a service

### Files
- `GET /cloud-connector/files` - Get files from connected services
- `POST /cloud-connector/sync/:serviceId` - Sync files from a service
- `GET /cloud-connector/download/:fileId` - Download a file

## Frontend Integration

### Service Usage

```typescript
import { cloudConnectorService } from '../services/cloudConnectorService';

// Get available services
const services = await cloudConnectorService.getAvailableServices();

// Connect to a service
await cloudConnectorService.initiateOAuthFlow('gdrive');

// Get connected services
const connected = await cloudConnectorService.getConnectedServices();

// Sync files
await cloudConnectorService.syncFiles('gdrive');

// Get files
const files = await cloudConnectorService.getFiles();

// Download file
const blob = await cloudConnectorService.downloadFile(fileId);
```

### OAuth Flow

1. User clicks "Connect" on a service
2. Frontend calls `getAuthUrl()` to get OAuth URL
3. Opens OAuth window with the URL
4. User authorizes the app
5. OAuth callback is handled by backend
6. Frontend receives success/error event
7. UI updates to show connected status

## Security Features

- **JWT Authentication**: All endpoints require valid JWT token
- **OAuth State Verification**: Prevents CSRF attacks
- **Token Refresh**: Automatic token refresh when expired
- **Secure Storage**: Tokens stored encrypted in database
- **Scope Limitation**: Minimal required permissions

## Error Handling

The system includes comprehensive error handling for:
- OAuth failures
- Token expiration
- Network issues
- Service unavailability
- File access errors

## Testing

### Manual Testing
1. Start the PDF service
2. Navigate to Cloud Connector in frontend
3. Try connecting to different services
4. Test file sync and download functionality

### API Testing
Use tools like Postman to test endpoints:
- Ensure JWT token is included in headers
- Test OAuth flow with real credentials
- Verify file operations work correctly

## Troubleshooting

### Common Issues

1. **OAuth Redirect URI Mismatch**
   - Ensure redirect URI in OAuth app matches backend URL
   - Check for trailing slashes and protocol (http vs https)

2. **Token Expiration**
   - Tokens are automatically refreshed
   - Check refresh token is properly stored

3. **File Access Errors**
   - Verify OAuth scopes include file access
   - Check file permissions in cloud service

4. **CORS Issues**
   - Ensure frontend URL is in CORS configuration
   - Check API base URL configuration

### Debug Mode

Enable debug logging by setting:
```env
DEBUG=cloud-connector:*
```

## Production Deployment

### Security Considerations
- Use HTTPS for all OAuth redirects
- Store secrets in secure environment variables
- Enable CORS only for trusted domains
- Use production OAuth app credentials

### Performance
- Implement rate limiting for API calls
- Cache file metadata to reduce API calls
- Use background jobs for large file syncs
- Monitor API quota usage

## Future Enhancements

- **File Upload**: Upload files to cloud storage
- **Bulk Operations**: Bulk download/upload files
- **File Sharing**: Share files between users
- **Advanced Sync**: Real-time file synchronization
- **Storage Analytics**: Detailed storage usage analytics
