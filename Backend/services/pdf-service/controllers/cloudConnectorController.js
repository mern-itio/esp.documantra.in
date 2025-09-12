const CloudServiceConnection = require('../models/cloudServiceConnection');
const CloudFile = require('../models/cloudFile');
const { CloudServiceProvider, getCloudServices } = require('../utils/cloudServiceProviders');
const crypto = require('crypto');

class CloudConnectorController {
  // Get all available cloud services
  async getAvailableServices(req, res) {
    try {
      const cloudServices = getCloudServices();
      const services = Object.keys(cloudServices).map(serviceId => ({
        id: serviceId,
        name: cloudServices[serviceId].name,
        icon: cloudServices[serviceId].icon,
        connected: false // Will be updated based on user's connections
      }));

      res.json({
        success: true,
        data: services
      });
    } catch (error) {
      console.error('Error getting available services:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get available services'
      });
    }
  }

  // Get user's connected services
  async getConnectedServices(req, res) {
    try {
      const userId = req.user?.data?.id || req.user?.id || 'anonymous';
      
      const connections = await CloudServiceConnection.findByUser(userId);
      
      const services = connections.map(conn => ({
        id: conn.serviceId,
        name: conn.serviceName,
        icon: conn.metadata?.serviceIcon || getCloudServices()[conn.serviceId]?.icon,
        connected: conn.connected,
        lastSync: conn.lastSync,
        storageUsed: conn.storageInfo.used,
        storageTotal: conn.storageInfo.total,
        accountEmail: conn.metadata?.accountEmail,
        accountName: conn.metadata?.accountName
      }));

      res.json({
        success: true,
        data: services
      });
    } catch (error) {
      console.error('Error getting connected services:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get connected services'
      });
    }
  }

  // Get OAuth authorization URL for a service
  async getAuthUrl(req, res) {
    try {
      const { serviceId } = req.params;
      const userId = req.user?.data?.id || req.user?.id || 'anonymous';
      
      const cloudServices = getCloudServices();
      if (!cloudServices[serviceId]) {
        return res.status(400).json({
          success: false,
          error: 'Unsupported cloud service'
        });
      }

      const provider = new CloudServiceProvider(serviceId);
      const state = crypto.randomBytes(32).toString('hex');
      
      // Store state in session or database for verification
      if (req.session) {
        req.session.oauthState = state;
        req.session.oauthServiceId = serviceId;
        req.session.oauthUserId = userId;
      
      } else {
        console.warn('Session not available, using fallback state storage');
      }

      const authUrl = provider.getAuthUrl(state);

      // Store OAuth state in session
      if (req.session) {
        req.session.oauthUserId = userId;
        req.session.oauthServiceId = serviceId;
        req.session.oauthState = state;
        
      }

      // Also store OAuth state in database as backup
      try {
        const OAuthState = require('../models/oauthState');
        await OAuthState.findOneAndUpdate(
          { state },
          {
            userId,
            serviceId,
            state,
            createdAt: new Date()
          },
          { upsert: true, new: true }
        );
      } catch (error) {
        console.error('Error storing OAuth state in database:', error);
      }

      res.json({
        success: true,
        data: {
          authUrl,
          state
        }
      });
    } catch (error) {
      console.error('Error getting auth URL:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get authorization URL'
      });
    }
  }

  // Handle OAuth callback and connect service
  async connectService(req, res) {
    try {
      const { code, state, error, error_description } = req.query;
      let userId = req.session?.oauthUserId || req.user?.data?.id || req.user?.id || 'anonymous';
      let serviceId = req.session?.oauthServiceId;     

      // If no session data, try to get from database using state
      if (!serviceId && state) {
        try {
          const OAuthState = require('../models/oauthState');
          const oauthState = await OAuthState.findOne({ state });
          
          if (oauthState) {
            serviceId = oauthState.serviceId;
            userId = oauthState.userId;
            
            // Clean up the OAuth state after use
            await OAuthState.deleteOne({ state });
          } else {
            console.log('No OAuth state found in database for state:', state);
          }
        } catch (error) {
          console.error('Error retrieving OAuth state from database (redirect):', error);
        }
      }
      
      // Check for OAuth errors first
      if (error) {
        console.error('OAuth error:', error, error_description);
        return res.status(400).json({
          success: false,
          error: `OAuth authorization failed: ${error}`,
          details: error_description || 'User denied access or app configuration issue'
        });
      }

      // Check if we have the authorization code
      if (!code) {
        return res.status(400).json({
          success: false,
          error: 'Missing authorization code',
          details: 'No authorization code received from OAuth provider'
        });
      }
      
      if (req.session && req.session.oauthState && state !== req.session.oauthState) {
        return res.status(400).json({
          success: false,
          error: 'Invalid state parameter'
        });
      }

      let finalServiceId = serviceId;
      if (!finalServiceId) {
        const referer = req.get('Referer') || '';
        if (referer.includes('dropbox')) {
          finalServiceId = 'dropbox';
        } else if (referer.includes('google') || referer.includes('gdrive')) {
          finalServiceId = 'gdrive';
        } else {
          finalServiceId = 'dropbox';
        }
      }

      
      if (!finalServiceId || !getCloudServices()[finalServiceId]) {
        return res.status(400).json({
          success: false,
          error: 'Invalid service ID'
        });
      }

      const provider = new CloudServiceProvider(finalServiceId);
      
      // Exchange code for tokens
      const tokenData = await provider.exchangeCodeForToken(code);
      
      // Get user profile
      const userProfile = await provider.getUserProfile(tokenData.accessToken);
      
      // Get storage information
      const storageInfo = await provider.getStorageInfo(tokenData.accessToken);

      // Calculate token expiry
      const tokenExpiry = new Date(Date.now() + (tokenData.expiresIn * 1000));

      // Save or update connection
      const connectionData = {
        userId,
        serviceId: finalServiceId,
        serviceName: getCloudServices()[finalServiceId].name,
        accessToken: tokenData.accessToken,
        refreshToken: tokenData.refreshToken,
        tokenExpiry,
        connected: true,
        lastSync: new Date(),
        storageInfo: {
          used: storageInfo.used,
          total: storageInfo.total
        },
        metadata: {
          accountEmail: userProfile.email,
          accountName: userProfile.name,
          serviceIcon: getCloudServices()[finalServiceId].icon,
          permissions: getCloudServices()[finalServiceId].scopes
        }
      };

      await CloudServiceConnection.findOneAndUpdate(
        { userId, serviceId: finalServiceId },
        connectionData,
        { upsert: true, new: true }
      );

      // Clear session data
      if (req.session) {
        delete req.session.oauthState;
        delete req.session.oauthServiceId;
        delete req.session.oauthUserId;
      }

      // Redirect to frontend OAuth callback page with success parameters
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      res.redirect(`${frontendUrl}/oauth-callback?code=${code}&state=${state}&service=${finalServiceId}&success=true`);
    } catch (error) {
      console.error('Error connecting service:', error);
      
      // Redirect to frontend OAuth callback page with error parameters
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const { code, state, error: oauthError } = req.query;
      const serviceId = req.session?.oauthServiceId || 'unknown';
      
      if (oauthError) {
        res.redirect(`${frontendUrl}/oauth-callback?error=${oauthError}&state=${state}&service=${serviceId}`);
      } else {
        res.redirect(`${frontendUrl}/oauth-callback?error=connection_failed&state=${state}&service=${serviceId}`);
      }
    }
  }

  // Handle OAuth callback from frontend service (returns JSON instead of redirect)
  async handleOAuthCallback(req, res) {
    try {
      const { code, state, error, error_description } = req.query;
      const userId = req.user?.data?.id || req.user?.id || 'anonymous';
      
      
      // Check for OAuth errors first
      if (error) {
        console.error('OAuth error:', error, error_description);
        return res.status(400).json({
          success: false,
          error: `OAuth authorization failed: ${error}`,
          details: error_description || 'User denied access or app configuration issue'
        });
      }

      if (!code || !state) {
        return res.status(400).json({
          success: false,
          error: 'Missing authorization code or state parameter'
        });
      }

      // Determine service ID from session or database
      let serviceId = req.session?.oauthServiceId;
      // userId is already declared above
      
      // If no session data, try to get from database using state
      if (!serviceId) {
        try {
          const OAuthState = require('../models/oauthState');
          const oauthState = await OAuthState.findOne({ state });
          
          if (oauthState) {
            serviceId = oauthState.serviceId;
            // Update userId if we got it from database
            if (oauthState.userId) {
              userId = oauthState.userId;
            }
            
            // Clean up the OAuth state after use
            await OAuthState.deleteOne({ state });
          } else {
            return res.status(400).json({
              success: false,
              error: 'Unable to determine service ID. Please try connecting again.'
            });
          }
        } catch (error) {
          console.error('Error retrieving OAuth state from database:', error);
          return res.status(400).json({
            success: false,
            error: 'Unable to determine service ID. Please try connecting again.'
          });
        }
      }

      const finalServiceId = serviceId;

      // Get cloud service configuration
      const cloudServices = getCloudServices();
      if (!cloudServices[finalServiceId]) {
        return res.status(400).json({
          success: false,
          error: 'Invalid service ID'
        });
      }

      // Exchange code for tokens
      const provider = new CloudServiceProvider(finalServiceId);
      const tokenData = await provider.exchangeCodeForTokens(code, state);
      
      // Get user profile and storage info
      const [userProfile, storageInfo] = await Promise.all([
        provider.getUserProfile(tokenData.accessToken),
        provider.getStorageInfo(tokenData.accessToken)
      ]);

      // Calculate token expiry
      const tokenExpiry = new Date(Date.now() + (tokenData.expiresIn * 1000));

      // Save or update connection
      const connectionData = {
        userId,
        serviceId: finalServiceId,
        serviceName: getCloudServices()[finalServiceId].name,
        accessToken: tokenData.accessToken,
        refreshToken: tokenData.refreshToken,
        tokenExpiry,
        connected: true,
        lastSync: new Date(),
        storageInfo: {
          used: storageInfo.used,
          total: storageInfo.total
        },
        metadata: {
          accountEmail: userProfile.email,
          accountName: userProfile.name,
          serviceIcon: getCloudServices()[finalServiceId].icon,
          permissions: getCloudServices()[finalServiceId].scopes
        }
      };

      const connection = await CloudServiceConnection.findOneAndUpdate(
        { userId, serviceId: finalServiceId },
        connectionData,
        { upsert: true, new: true }
      );

      // Clear session data
      if (req.session) {
        delete req.session.oauthState;
        delete req.session.oauthServiceId;
        delete req.session.oauthUserId;
      }

      res.json({
        success: true,
        data: {
          serviceId: finalServiceId,
          serviceName: getCloudServices()[finalServiceId].name,
          accountEmail: userProfile.email,
          accountName: userProfile.name
        }
      });
    } catch (error) {
      console.error('Error handling OAuth callback:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to process OAuth callback'
      });
    }
  }

  // Disconnect a service
  async disconnectService(req, res) {
    try {
      const { serviceId } = req.params;
      const userId = req.user?.data?.id || req.user?.id || 'anonymous';

      const connection = await CloudServiceConnection.findByUserAndService(userId, serviceId);
      
      if (!connection) {
        return res.status(404).json({
          success: false,
          error: 'Service not connected'
        });
      }

      // Delete the connection entirely instead of updating with null values
      await CloudServiceConnection.deleteOne({ userId, serviceId });

      // Remove all files for this service
      await CloudFile.deleteMany({ userId, serviceId });

      res.json({
        success: true,
        message: `Successfully disconnected from ${connection.serviceName}`
      });
    } catch (error) {
      console.error('Error disconnecting service:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to disconnect service'
      });
    }
  }

  // Sync files from a service
  async syncFiles(req, res) {
    try {
      const { serviceId } = req.params;
      const userId = req.user?.data?.id || req.user?.id || 'anonymous';

      const connection = await CloudServiceConnection.findByUserAndService(userId, serviceId);
      
      if (!connection || !connection.connected) {
        return res.status(404).json({
          success: false,
          error: 'Service not connected'
        });
      }

      // Check if token needs refresh
      let accessToken = connection.accessToken;
      if (connection.tokenExpiry && new Date() > connection.tokenExpiry) {
        if (!connection.refreshToken) {
          return res.status(401).json({
            success: false,
            error: 'Access token expired and no refresh token available'
          });
        }

        const provider = new CloudServiceProvider(serviceId);
        const tokenData = await provider.refreshAccessToken(connection.refreshToken);
        
        connection.accessToken = tokenData.accessToken;
        connection.refreshToken = tokenData.refreshToken;
        connection.tokenExpiry = new Date(Date.now() + (tokenData.expiresIn * 1000));
        await connection.save();
        
        accessToken = tokenData.accessToken;
      }

      // Get files from cloud service
      const provider = new CloudServiceProvider(serviceId);
      const cloudFiles = await provider.listFiles(accessToken);

      // Update storage info
      const storageInfo = await provider.getStorageInfo(accessToken);
      connection.storageInfo = {
        used: storageInfo.used,
        total: storageInfo.total
      };
      connection.lastSync = new Date();
      await connection.save();

      // Process and save files
      const savedFiles = [];
      for (const cloudFile of cloudFiles) {
        // Only process PDF files for now
        if (cloudFile.type === 'pdf') {
          const fileData = {
            userId,
            serviceId,
            fileId: cloudFile.id,
            fileName: cloudFile.name,
            fileType: cloudFile.type,
            fileSize: cloudFile.size,
            fileSizeFormatted: cloudFile.sizeFormatted,
            mimeType: cloudFile.mimeType,
            filePath: cloudFile.path,
            parentFolderId: cloudFile.parentFolderId,
            downloadUrl: cloudFile.downloadUrl,
            lastModified: cloudFile.lastModified,
            synced: true,
            lastSyncDate: new Date()
          };

          const savedFile = await CloudFile.findOneAndUpdate(
            { userId, fileId: cloudFile.id, serviceId },
            fileData,
            { upsert: true, new: true }
          );

          savedFiles.push(savedFile);
        }
      }

      res.json({
        success: true,
        message: `Successfully synced ${savedFiles.length} files from ${connection.serviceName}`,
        data: {
          filesSynced: savedFiles.length,
          lastSync: connection.lastSync,
          storageInfo: connection.storageInfo
        }
      });
    } catch (error) {
      console.error('Error syncing files:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to sync files'
      });
    }
  }

  // Get files from a service
  async getFiles(req, res) {
    try {
      const { serviceId, folderId } = req.query;
      const userId = req.user?.data?.id || req.user?.id || 'anonymous';
      let query = { userId };
      if (serviceId) {
        query.serviceId = serviceId;
      }
      
      if (folderId && folderId !== 'root') {
        query.parentFolderId = folderId;
      } else {
        query.$or = [
          { parentFolderId: { $exists: false } },
          { parentFolderId: null },
          { parentFolderId: 'root' }
        ];
      }

      const files = await CloudFile.find(query).sort({ lastModified: -1 });

      const formattedFiles = files.map(file => ({
        id: file._id,
        fileId: file.fileId,
        name: file.fileName,
        type: file.fileType,
        size: file.fileSizeFormatted,
        modified: CloudConnectorController.formatRelativeTime(file.lastModified || new Date()),
        service: file.serviceId,
        synced: file.synced,
        downloadUrl: file.downloadUrl,
        lastSyncDate: file.lastSyncDate
      }));

      res.json({
        success: true,
        data: formattedFiles
      });
    } catch (error) {
      console.error('Error getting files:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get files'
      });
    }
  }

  // Download file from cloud service
  async downloadFile(req, res) {
    try {
      const { fileId } = req.params;
      const userId = req.user?.data?.id || req.user?.id || 'anonymous';

      // Check if fileId is a valid MongoDB ObjectId (24 hex characters)
      const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(fileId);
      
      let file;
      if (isValidObjectId) {
        // Try to find by MongoDB _id first
        file = await CloudFile.findOne({ _id: fileId, userId });
      }
      
      // If not found by _id or not a valid ObjectId, try by cloud fileId
      if (!file) {
        file = await CloudFile.findOne({ fileId: fileId, userId });
      }
      
      if (!file) {
        return res.status(404).json({
          success: false,
          error: 'File not found'
        });
      }

      const connection = await CloudServiceConnection.findByUserAndService(userId, file.serviceId);
      
      if (!connection || !connection.connected) {
        return res.status(404).json({
          success: false,
          error: 'Service not connected'
        });
      }

      // Check if token needs refresh
      let accessToken = connection.accessToken;
      if (connection.tokenExpiry && new Date() > connection.tokenExpiry) {
        if (!connection.refreshToken) {
          return res.status(401).json({
            success: false,
            error: 'Access token expired and no refresh token available'
          });
        }

        const provider = new CloudServiceProvider(file.serviceId);
        const tokenData = await provider.refreshAccessToken(connection.refreshToken);
        
        connection.accessToken = tokenData.accessToken;
        connection.refreshToken = tokenData.refreshToken;
        connection.tokenExpiry = new Date(Date.now() + (tokenData.expiresIn * 1000));
        await connection.save();
        
        accessToken = tokenData.accessToken;
      }

      const provider = new CloudServiceProvider(file.serviceId);
      const fileStream = await provider.downloadFile(accessToken, file.fileId, file.filePath);

      res.setHeader('Content-Type', file.mimeType || 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${file.fileName}"`);
      
      fileStream.pipe(res);
    } catch (error) {
      console.error('Error downloading file:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to download file'
      });
    }
  }

  // Upload file to cloud service
  async uploadFile(req, res) {
    try {
      const { serviceId, fileName, parentFolderId } = req.body;
      const fileData = req.file; // File from multer
      const userId = req.user?.data?.id || req.user?.id;
     
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
      }

      if (!fileData) {
        return res.status(400).json({
          success: false,
          error: 'No file provided'
        });
      }

      if (!serviceId) {
        return res.status(400).json({
          success: false,
          error: 'Service ID is required'
        });
      }

      // Get connection details
      const connection = await CloudServiceConnection.findOne({
        userId,
        serviceId
      });

      if (!connection) {
        return res.status(404).json({
          success: false,
          error: 'Service not connected'
        });
      }

      // Check if token is expired
      if (new Date() > connection.tokenExpiry) {
        return res.status(401).json({
          success: false,
          error: 'Token expired. Please reconnect the service.'
        });
      }

      // Upload file to cloud service
      const provider = new CloudServiceProvider(serviceId);
      const uploadResult = await provider.uploadFile(
        connection.accessToken,
        fileName,
        fileData,
        parentFolderId || 'root'
      );

      // Determine file type from file name or MIME type
      const getFileType = (fileName, mimeType) => {
        const extension = fileName.split('.').pop().toLowerCase();
        
        // Check by extension first
        if (['pdf'].includes(extension)) return 'pdf';
        if (['doc', 'docx'].includes(extension)) return 'doc';
        if (['txt'].includes(extension)) return 'txt';
        if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(extension)) return 'image';
        
        // Check by MIME type as fallback
        if (mimeType) {
          if (mimeType.includes('pdf')) return 'pdf';
          if (mimeType.includes('document') || mimeType.includes('word')) return 'doc';
          if (mimeType.includes('text')) return 'txt';
          if (mimeType.includes('image')) return 'image';
        }
        
        // Default fallback
        return 'txt';
      };

      // Save file metadata to database
      const cloudFile = new CloudFile({
        fileId: uploadResult.id,
        fileName: fileName,
        fileType: getFileType(fileName, uploadResult.mimeType),
        filePath: uploadResult.path,
        fileSize: uploadResult.size,
        mimeType: uploadResult.mimeType,
        serviceId: serviceId,
        userId: userId,
        parentFolderId: parentFolderId || 'root',
        lastModified: uploadResult.modifiedTime ? new Date(uploadResult.modifiedTime) : new Date(),
        synced: true,
        lastSyncDate: new Date()
      });

      try {
        await cloudFile.save();
      } catch (saveError) {
        // Handle duplicate key error
        if (saveError.code === 11000) {
          return res.status(409).json({
            success: false,
            error: 'File already exists in your cloud storage. Please choose a different file or rename it.'
          });
        }
        throw saveError; // Re-throw other errors
      }

      res.json({
        success: true,
        data: {
          fileId: uploadResult.id,
          fileName: fileName,
          filePath: uploadResult.path,
          size: uploadResult.size,
          message: 'File uploaded successfully'
        }
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      
      // Determine appropriate status code and error message
      let statusCode = 500;
      let errorMessage = 'Failed to upload file';
      
      if (error.message.includes('Network error')) {
        statusCode = 503; // Service Unavailable
        errorMessage = error.message;
      } else if (error.message.includes('Authentication failed')) {
        statusCode = 401;
        errorMessage = error.message;
      } else if (error.message.includes('File too large')) {
        statusCode = 413; // Payload Too Large
        errorMessage = error.message;
      } else if (error.message.includes('error:')) {
        statusCode = 400; // Bad Request
        errorMessage = error.message;
      }
      
      res.status(statusCode).json({
        success: false,
        error: errorMessage
      });
    }
  }

  // Create folder in cloud service
  async createFolder(req, res) {
    try {
      const { serviceId, folderName, parentFolderId } = req.body;
      const userId = req.user?.data?.id || req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
      }

      // Get connection details
      const connection = await CloudServiceConnection.findOne({
        userId,
        serviceId
      });

      if (!connection) {
        return res.status(404).json({
          success: false,
          error: 'Service not connected'
        });
      }

      // Check if token is expired
      if (new Date() > connection.tokenExpiry) {
        return res.status(401).json({
          success: false,
          error: 'Token expired. Please reconnect the service.'
        });
      }

      // Create folder in cloud service
      const provider = new CloudServiceProvider(serviceId);
      const folderResult = await provider.createFolder(
        connection.accessToken,
        folderName,
        parentFolderId || 'root'
      );

      // Save folder metadata to database
      const cloudFile = new CloudFile({
        fileId: folderResult.id,
        fileName: folderName,
        fileType: 'folder',
        filePath: folderResult.path,
        fileSize: 0,
        mimeType: 'application/vnd.google-apps.folder',
        serviceId: serviceId,
        userId: userId,
        parentFolderId: parentFolderId || 'root',
        lastModified: folderResult.modifiedTime ? new Date(folderResult.modifiedTime) : new Date(),
        synced: true,
        lastSyncDate: new Date(),
        isFolder: true
      });

      await cloudFile.save();

      res.json({
        success: true,
        data: {
          folderId: folderResult.id,
          folderName: folderName,
          folderPath: folderResult.path,
          message: 'Folder created successfully'
        }
      });
    } catch (error) {
      console.error('Error creating folder:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create folder'
      });
    }
  }

  // Helper method to format relative time
  static formatRelativeTime(date) {
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} months ago`;
    return `${Math.floor(diffInSeconds / 31536000)} years ago`;
  }
}

module.exports = new CloudConnectorController();
