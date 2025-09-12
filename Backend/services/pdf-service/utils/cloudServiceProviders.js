const axios = require('axios');

// Cloud Service Configuration - Dynamic function to get fresh env vars
function getCloudServices() {
  return {
    gdrive: {
      name: 'Google Drive',
      icon: '🔵',
      authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
      apiBaseUrl: 'https://www.googleapis.com/drive/v3',
      scopes: [
        'https://www.googleapis.com/auth/drive'
      ],
      clientId: process.env.GOOGLE_DRIVE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_DRIVE_CLIENT_SECRET,
      redirectUri: process.env.GOOGLE_DRIVE_REDIRECT_URI
    },
    dropbox: {
      name: 'Dropbox',
      icon: '📦',
      authUrl: 'https://www.dropbox.com/oauth2/authorize',
      tokenUrl: 'https://api.dropboxapi.com/oauth2/token',
      apiBaseUrl: 'https://api.dropboxapi.com/2',
      scopes: ['files.metadata.read', 'files.content.read', 'files.content.write', 'account_info.read'],
      clientId: process.env.DROPBOX_CLIENT_ID,
      clientSecret: process.env.DROPBOX_CLIENT_SECRET,
      redirectUri: process.env.DROPBOX_REDIRECT_URI
    },
  // onedrive: {
  //   name: 'OneDrive',
  //   icon: '☁️',
  //   authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
  //   tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
  //   apiBaseUrl: 'https://graph.microsoft.com/v1.0/me/drive',
  //   scopes: ['Files.Read', 'Files.ReadWrite'],
  //   clientId: process.env.ONEDRIVE_CLIENT_ID,
  //   clientSecret: process.env.ONEDRIVE_CLIENT_SECRET,
  //   redirectUri: process.env.ONEDRIVE_REDIRECT_URI
  // },
    box: {
      name: 'Box',
      icon: '📁',
      authUrl: 'https://account.box.com/api/oauth2/authorize',
      tokenUrl: 'https://api.box.com/oauth2/token',
      apiBaseUrl: 'https://api.box.com/2.0',
      scopes: ['root_readwrite'],
      clientId: process.env.BOX_CLIENT_ID,
      clientSecret: process.env.BOX_CLIENT_SECRET,
      redirectUri: process.env.BOX_REDIRECT_URI
    },
    // icloud: {
    //   name: 'iCloud Drive',
    //   icon: '🍎',
    //   authUrl: 'https://idmsa.apple.com/appleauth/auth/oauth/authorize',
    //   tokenUrl: 'https://idmsa.apple.com/appleauth/auth/oauth/token',
    //   apiBaseUrl: 'https://api.icloud.com',
    //   scopes: ['cloudkit'],
    //   clientId: process.env.ICLOUD_CLIENT_ID,
    //   clientSecret: process.env.ICLOUD_CLIENT_SECRET,
    //   redirectUri: process.env.ICLOUD_REDIRECT_URI
    // }
  };
}

class CloudServiceProvider {
  constructor(serviceId) {
    this.serviceId = serviceId;
    this.config = getCloudServices()[serviceId];
    if (!this.config) {
      throw new Error(`Unsupported cloud service: ${serviceId}`);
    }
  }

  // Generate OAuth authorization URL
  getAuthUrl(state) {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: 'code',
      scope: this.config.scopes.join(' '),
      state: state,
      access_type: 'offline',
      prompt: 'consent'
    });

    const authUrl = `${this.config.authUrl}?${params.toString()}`;
    
    // Debug logging
    console.log(`🔍 OAuth URL for ${this.serviceId}:`, {
      clientId: this.config.clientId,
      redirectUri: this.config.redirectUri,
      scopes: this.config.scopes,
      authUrl: authUrl
    });

    return authUrl;
  }

  // Exchange authorization code for access token
  async exchangeCodeForToken(code) {
    try {
      const response = await axios.post(this.config.tokenUrl, {
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: this.config.redirectUri
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      return {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        expiresIn: response.data.expires_in,
        tokenType: response.data.token_type
      };
    } catch (error) {
      console.error(`Error exchanging code for token (${this.serviceId}):`, error.response?.data || error.message);
      throw new Error(`Failed to exchange authorization code for ${this.config.name}`);
    }
  }

  // Exchange authorization code for tokens (alias for exchangeCodeForToken)
  async exchangeCodeForTokens(code, state) {
    return this.exchangeCodeForToken(code);
  }

  // Refresh access token
  async refreshAccessToken(refreshToken) {
    try {
      const response = await axios.post(this.config.tokenUrl, {
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token'
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      return {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token || refreshToken,
        expiresIn: response.data.expires_in
      };
    } catch (error) {
      console.error(`Error refreshing token (${this.serviceId}):`, error.response?.data || error.message);
      throw new Error(`Failed to refresh access token for ${this.config.name}`);
    }
  }

  // Get user profile information
  async getUserProfile(accessToken) {
    try {
      let response;
      
      switch (this.serviceId) {
        case 'gdrive':
          response = await axios.get(`${this.config.apiBaseUrl}/about`, {
            headers: { Authorization: `Bearer ${accessToken}` },
            params: { fields: 'user' }
          });
          return {
            id: response.data.user.permissionId,
            email: response.data.user.emailAddress,
            name: response.data.user.displayName
          };

        case 'dropbox':
          response = await axios.post(`${this.config.apiBaseUrl}/users/get_current_account`, null, {
            headers: { 
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          });
          return {
            id: response.data.account_id,
            email: response.data.email,
            name: response.data.name.display_name
          };

        case 'onedrive':
          response = await axios.get('https://graph.microsoft.com/v1.0/me', {
            headers: { Authorization: `Bearer ${accessToken}` }
          });
          return {
            id: response.data.id,
            email: response.data.mail || response.data.userPrincipalName,
            name: response.data.displayName
          };

        case 'box':
          response = await axios.get(`${this.config.apiBaseUrl}/users/me`, {
            headers: { Authorization: `Bearer ${accessToken}` }
          });
          return {
            id: response.data.id,
            email: response.data.login,
            name: response.data.name
          };

        default:
          throw new Error(`User profile not implemented for ${this.serviceId}`);
      }
    } catch (error) {
      console.error(`Error getting user profile (${this.serviceId}):`, error.response?.data || error.message);
      throw new Error(`Failed to get user profile for ${this.config.name}`);
    }
  }

  // Get storage information
  async getStorageInfo(accessToken) {
    try {
      let response;
      
      switch (this.serviceId) {
        case 'gdrive':
          response = await axios.get(`${this.config.apiBaseUrl}/about`, {
            headers: { Authorization: `Bearer ${accessToken}` },
            params: { fields: 'storageQuota' }
          });
          const quota = response.data.storageQuota;
          return {
            used: this.formatBytes(quota.usage || 0),
            total: this.formatBytes(quota.limit || 0),
            usedBytes: quota.usage || 0,
            totalBytes: quota.limit || 0
          };

        case 'dropbox':
          response = await axios.post(`${this.config.apiBaseUrl}/users/get_space_usage`, null, {
            headers: { 
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          });
          return {
            used: this.formatBytes(response.data.used),
            total: this.formatBytes(response.data.allocation.allocated),
            usedBytes: response.data.used,
            totalBytes: response.data.allocation.allocated
          };

        case 'onedrive':
          response = await axios.get(`${this.config.apiBaseUrl}/quota`, {
            headers: { Authorization: `Bearer ${accessToken}` }
          });
          return {
            used: this.formatBytes(response.data.used),
            total: this.formatBytes(response.data.total),
            usedBytes: response.data.used,
            totalBytes: response.data.total
          };

        case 'box':
          response = await axios.get(`${this.config.apiBaseUrl}/users/me`, {
            headers: { Authorization: `Bearer ${accessToken}` },
            params: { fields: 'space_amount,space_used' }
          });
          return {
            used: this.formatBytes(response.data.space_used),
            total: this.formatBytes(response.data.space_amount),
            usedBytes: response.data.space_used,
            totalBytes: response.data.space_amount
          };

        default:
          return {
            used: '0 GB',
            total: 'Unknown',
            usedBytes: 0,
            totalBytes: 0
          };
      }
    } catch (error) {
      console.error(`Error getting storage info (${this.serviceId}):`, error.response?.data || error.message);
      return {
        used: 'Unknown',
        total: 'Unknown',
        usedBytes: 0,
        totalBytes: 0
      };
    }
  }

  // List files from cloud service
  async listFiles(accessToken, folderId = null, limit = 100) {
    try {
      let response;
      
      switch (this.serviceId) {
        case 'gdrive':
          const gdriveParams = {
            q: folderId ? `'${folderId}' in parents` : "trashed=false",
            fields: 'files(id,name,mimeType,size,modifiedTime,parents,webViewLink)',
            pageSize: limit
          };
          response = await axios.get(`${this.config.apiBaseUrl}/files`, {
            headers: { Authorization: `Bearer ${accessToken}` },
            params: gdriveParams
          });
          
          return response.data.files.map(file => ({
            id: file.id,
            name: file.name,
            type: this.getFileType(file.mimeType),
            size: file.size ? parseInt(file.size) : 0,
            sizeFormatted: file.size ? this.formatBytes(parseInt(file.size)) : '0 Bytes',
            mimeType: file.mimeType,
            path: file.name,
            parentFolderId: file.parents ? file.parents[0] : null,
            downloadUrl: file.webViewLink,
            lastModified: new Date(file.modifiedTime),
            isFolder: file.mimeType === 'application/vnd.google-apps.folder'
          }));

        case 'dropbox':
          const dropboxParams = {
            path: folderId || '',
            recursive: false,
            include_media_info: true,
            include_deleted: false
          };
          response = await axios.post(`${this.config.apiBaseUrl}/files/list_folder`, dropboxParams, {
            headers: { Authorization: `Bearer ${accessToken}` }
          });
          
          return response.data.entries.map(file => ({
            id: file.id,
            name: file.name,
            type: this.getFileType(file['.tag']),
            size: file.size || 0,
            sizeFormatted: file.size ? this.formatBytes(file.size) : '0 Bytes',
            mimeType: file['.tag'] === 'folder' ? 'application/vnd.dropbox.folder' : 'application/octet-stream',
            path: file.path_display,
            parentFolderId: file.path_display.split('/').slice(0, -1).join('/') || null,
            downloadUrl: file['.tag'] === 'file' ? file.path_display : null,
            lastModified: new Date(file.server_modified),
            isFolder: file['.tag'] === 'folder'
          }));

        case 'box':
          const boxParams = {
            fields: 'id,name,type,size,modified_at,path_collection,download_url',
            limit: limit
          };
          
          // If folderId is provided, list items in that folder, otherwise list root items
          const boxUrl = folderId && folderId !== 'root' 
            ? `${this.config.apiBaseUrl}/folders/${folderId}/items`
            : `${this.config.apiBaseUrl}/folders/0/items`;
            
          response = await axios.get(boxUrl, {
            headers: { Authorization: `Bearer ${accessToken}` },
            params: boxParams
          });
          
          return response.data.entries.map(file => ({
            id: file.id,
            name: file.name,
            type: this.getFileType(file.type),
            size: file.size || 0,
            sizeFormatted: file.size ? this.formatBytes(file.size) : '0 Bytes',
            mimeType: file.type === 'folder' ? 'application/vnd.box.folder' : 'application/octet-stream',
            path: file.path_collection ? file.path_collection.entries.map(p => p.name).join('/') + '/' + file.name : file.name,
            parentFolderId: file.path_collection ? file.path_collection.entries[file.path_collection.entries.length - 1]?.id : '0',
            downloadUrl: file.download_url,
            lastModified: new Date(file.modified_at),
            isFolder: file.type === 'folder'
          }));

        default:
          throw new Error(`File listing not implemented for ${this.serviceId}`);
      }
    } catch (error) {
      console.error(`Error listing files (${this.serviceId}):`, error.response?.data || error.message);
      throw new Error(`Failed to list files from ${this.config.name}`);
    }
  }

  // Download file from cloud service
  async downloadFile(accessToken, fileId, filePath) {
    try {
      let response;
      
      switch (this.serviceId) {
        case 'gdrive':
          response = await axios.get(`${this.config.apiBaseUrl}/files/${fileId}`, {
            headers: { Authorization: `Bearer ${accessToken}` },
            params: { alt: 'media' },
            responseType: 'stream'
          });
          break;

        case 'dropbox':
          // Dropbox downloads use content.dropboxapi.com, not api.dropboxapi.com
          console.log('🔍 Dropbox download request:', { 
            url: 'https://content.dropboxapi.com/2/files/download',
            path: filePath,
            hasToken: !!accessToken
          });
          
          response = await axios.post('https://content.dropboxapi.com/2/files/download', null, {
            headers: { 
              Authorization: `Bearer ${accessToken}`,
              'Dropbox-API-Arg': JSON.stringify({ path: filePath })
            },
            responseType: 'stream',
            decompress: false // Don't auto-decompress gzipped responses
          });
          break;

        case 'box':
          response = await axios.get(`${this.config.apiBaseUrl}/files/${fileId}/content`, {
            headers: { Authorization: `Bearer ${accessToken}` },
            responseType: 'stream'
          });
          break;

        default:
          throw new Error(`File download not implemented for ${this.serviceId}`);
      }

      return response.data;
    } catch (error) {
      console.error(`Error downloading file (${this.serviceId}):`, error.response?.data || error.message);
      
      // Handle specific Dropbox errors
      if (this.serviceId === 'dropbox' && error.response?.data) {
        const errorData = error.response.data;
        console.error('🔍 Dropbox error details:', errorData);
        
        // Try to read the error message from the response
        if (error.response.status === 400) {
          // For 400 errors, try to extract the error message
          let errorMessage = 'Bad Request';
          if (typeof errorData === 'string') {
            errorMessage = errorData;
          } else if (errorData.error_summary) {
            errorMessage = errorData.error_summary;
          } else if (errorData.error) {
            errorMessage = JSON.stringify(errorData.error);
          }
          throw new Error(`Dropbox error (400): ${errorMessage}`);
        }
        
        if (typeof errorData === 'string') {
          throw new Error(`Dropbox error: ${errorData}`);
        } else if (errorData.error_summary) {
          throw new Error(`Dropbox error: ${errorData.error_summary}`);
        } else if (errorData.error) {
          throw new Error(`Dropbox error: ${JSON.stringify(errorData.error)}`);
        }
      }
      
      throw new Error(`Failed to download file from ${this.config.name}: ${error.message}`);
    }
  }

  // Upload file to cloud service
  async uploadFile(accessToken, fileName, fileData, parentFolderId = 'root') {
    try {
      const FormData = require('form-data');
      
      switch (this.serviceId) {
        case 'gdrive':
        case 'google-drive':
          // Google Drive requires multipart form data with specific structure
          const gdriveForm = new FormData();
          
          // Create metadata part
          const metadata = {
            name: fileName
          };
          
          // Only add parents if it's not root (Google Drive root doesn't need parents)
          if (parentFolderId && parentFolderId !== 'root') {
            metadata.parents = [parentFolderId];
          }
          
          // Add metadata
          gdriveForm.append('metadata', JSON.stringify(metadata), {
            contentType: 'application/json'
          });
          
          // Add file data
          gdriveForm.append('file', fileData.buffer, {
            filename: fileName,
            contentType: fileData.mimetype || 'application/octet-stream'
          });
          
          const driveResponse = await axios.post(
            'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
            gdriveForm,
            {
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                ...gdriveForm.getHeaders()
              }
            }
          );
          
          return {
            id: driveResponse.data.id,
            name: driveResponse.data.name,
            path: `/drive/${driveResponse.data.id}`, // Create a path for Google Drive files
            size: driveResponse.data.size,
            mimeType: driveResponse.data.mimeType,
            modifiedTime: driveResponse.data.modifiedTime
          };

        case 'dropbox':
          const dropboxResponse = await axios.post(
            `https://content.dropboxapi.com/2/files/upload`,
            fileData,
            {
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/octet-stream',
                'Dropbox-API-Arg': JSON.stringify({
                  path: `/${fileName}`,
                  mode: 'add',
                  autorename: true
                })
              }
            }
          );
          return {
            id: dropboxResponse.data.id,
            name: dropboxResponse.data.name,
            path: dropboxResponse.data.path_display,
            size: dropboxResponse.data.size,
            mimeType: 'application/octet-stream',
            modifiedTime: dropboxResponse.data.server_modified
          };

        case 'box':
          // Box requires multipart form data with specific structure
          const boxForm = new FormData();
          
          // Add file data
          boxForm.append('file', fileData.buffer, {
            filename: fileName,
            contentType: fileData.mimetype || 'application/octet-stream'
          });
          
          // Add attributes as JSON
          const attributes = {
            name: fileName,
            parent: { id: parentFolderId === 'root' ? '0' : parentFolderId }
          };
          boxForm.append('attributes', JSON.stringify(attributes));
          
          const boxResponse = await axios.post(
            `https://upload.box.com/api/2.0/files/content`,
            boxForm,
            {
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                ...boxForm.getHeaders()
              }
            }
          );
          
          const fileInfo = boxResponse.data.entries[0];
          return {
            id: fileInfo.id,
            name: fileInfo.name,
            path: fileInfo.path_collection ? fileInfo.path_collection.entries.map(p => p.name).join('/') + '/' + fileInfo.name : fileInfo.name,
            size: fileInfo.size,
            mimeType: fileInfo.type,
            modifiedTime: fileInfo.modified_at
          };

        default:
          throw new Error(`File upload not implemented for ${this.serviceId}`);
      }
    } catch (error) {
      console.error(`Error uploading file (${this.serviceId}):`, error.response?.data || error.message);
      
      // Handle specific error types
      if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        throw new Error(`Network error: Cannot connect to ${this.config.name} servers. Please check your internet connection.`);
      } else if (error.response?.status === 401) {
        throw new Error(`Authentication failed with ${this.config.name}. Please reconnect your account.`);
      } else if (error.response?.status === 413) {
        throw new Error(`File too large for ${this.config.name}. Please choose a smaller file.`);
      } else if (error.response?.data?.error_summary) {
        throw new Error(`${this.config.name} error: ${error.response.data.error_summary}`);
      }
      
      throw new Error(`Failed to upload file to ${this.config.name}: ${error.message}`);
    }
  }

  // Create folder in cloud service
  async createFolder(accessToken, folderName, parentFolderId = 'root') {
    try {
      switch (this.serviceId) {
        case 'gdrive':
        case 'google-drive':
          const folderData = {
            name: folderName,
            mimeType: 'application/vnd.google-apps.folder'
          };
          
          // Only add parents if it's not root (Google Drive root doesn't need parents)
          if (parentFolderId && parentFolderId !== 'root') {
            folderData.parents = [parentFolderId];
          }
          
          const driveResponse = await axios.post(
            'https://www.googleapis.com/drive/v3/files',
            folderData,
            {
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
              }
            }
          );
          return {
            id: driveResponse.data.id,
            name: driveResponse.data.name,
            path: `/drive/${driveResponse.data.id}`, // Create a path for Google Drive folders
            modifiedTime: driveResponse.data.modifiedTime
          };

        case 'dropbox':
          const dropboxResponse = await axios.post(
            'https://api.dropboxapi.com/2/files/create_folder_v2',
            {
              path: `/${folderName}`,
              autorename: true
            },
            {
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
              }
            }
          );
          return {
            id: dropboxResponse.data.metadata.id,
            name: dropboxResponse.data.metadata.name,
            path: dropboxResponse.data.metadata.path_display,
            modifiedTime: dropboxResponse.data.metadata.server_modified
          };

        case 'box':
          const boxResponse = await axios.post(
            'https://api.box.com/2.0/folders',
            {
              name: folderName,
              parent: { id: parentFolderId === 'root' ? '0' : parentFolderId }
            },
            {
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
              }
            }
          );
          return {
            id: boxResponse.data.id,
            name: boxResponse.data.name,
            path: boxResponse.data.path_collection ? boxResponse.data.path_collection.entries.map(p => p.name).join('/') + '/' + boxResponse.data.name : boxResponse.data.name,
            modifiedTime: boxResponse.data.modified_at
          };

        default:
          throw new Error(`Folder creation not implemented for ${this.serviceId}`);
      }
    } catch (error) {
      console.error(`Error creating folder (${this.serviceId}):`, error.response?.data || error.message);
      throw new Error(`Failed to create folder in ${this.config.name}`);
    }
  }

  // Helper methods
  getFileType(mimeType) {
    if (mimeType.includes('pdf')) return 'pdf';
    if (mimeType.includes('word') || mimeType.includes('document')) return 'doc';
    if (mimeType.includes('text')) return 'txt';
    if (mimeType.includes('image')) return 'image';
    if (mimeType.includes('folder')) return 'folder';
    
    // Handle Box specific types
    if (mimeType === 'folder') return 'folder';
    if (mimeType === 'file') return 'unknown';
    
    return 'unknown';
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

module.exports = {
  CLOUD_SERVICES: getCloudServices(),
  getCloudServices,
  CloudServiceProvider
};
