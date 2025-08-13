const Folder = require('../models/Folder');
const Document = require('../models/Document');

class FolderController {
  // Create folder
  async createFolder(req, res) {
    try {
      const { name, description, parentId, color, icon } = req.body;
      const userId = req.user.data.id;

      if (!name || name.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Folder name is required'
        });
      }

      // Check if folder with same name exists in parent folder
      const existingFolder = await Folder.findOne({
        name: name.trim(),
        parentId: parentId || null,
        ownerId: userId
      });

      if (existingFolder) {
        return res.status(400).json({
          success: false,
          message: 'Folder with this name already exists in the current location'
        });
      }

      // Validate parent folder if provided
      let parentPath = '/';
      if (parentId) {
        const parentFolder = await Folder.findOne({
          _id: parentId,
          $or: [
            { ownerId: userId },
            { 'permissions.userId': userId }
          ]
        });

        if (!parentFolder) {
          return res.status(404).json({
            success: false,
            message: 'Parent folder not found or access denied'
          });
        }

        parentPath = parentFolder.path;
      }

      // Create folder
      const folder = new Folder({
        name: name.trim(),
        description: description || '',
        parentId: parentId || null,
        path: parentPath,
        ownerId: userId,
        createdBy: userId,
        color: color || '#3b82f6',
        icon: icon || 'Folder'
      });

      await folder.save();

      // Update parent folder subfolder count
      if (parentId) {
        await Folder.findByIdAndUpdate(parentId, {
          $inc: { folderCount: 1 }
        });
      }

      res.status(201).json({
        success: true,
        message: 'Folder created successfully',
        data: folder
      });

    } catch (error) {
      console.error('Create folder error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create folder',
        error: error.message
      });
    }
  }

  // Get user folders
  async getUserFolders(req, res) {
    try {
      const userId = req.user.data.id;
      const { parentId, search, includeArchived = false } = req.query;

      let query = {
        $or: [
          { ownerId: userId },
          { 'permissions.userId': userId }
        ]
      };

      if (parentId !== undefined) {
        query.parentId = parentId === 'root' ? null : parentId;
      }

      if (!includeArchived) {
        query.isArchived = false;
      }

      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }

      const folders = await Folder.find(query)
        .sort({ name: 1 })
        .populate('parentId', 'name color');

      res.json({
        success: true,
        data: folders
      });

    } catch (error) {
      console.error('Get folders error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch folders',
        error: error.message
      });
    }
  }

  // Get folder details
  async getFolder(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.data.id;

      const folder = await Folder.findOne({
        _id: id,
        $or: [
          { ownerId: userId },
          { 'permissions.userId': userId }
        ]
      }).populate('parentId', 'name color');

      if (!folder) {
        return res.status(404).json({
          success: false,
          message: 'Folder not found or access denied'
        });
      }

      // Get subfolders
      const subfolders = await Folder.find({
        parentId: id,
        $or: [
          { ownerId: userId },
          { 'permissions.userId': userId }
        ]
      }).sort({ name: 1 });

      // Get documents in folder
      const documents = await Document.find({
        folderId: id,
        $or: [
          { ownerId: userId },
          { 'sharedWith.userId': userId },
          { isPublic: true }
        ]
      }).select('-filePath -fileName')
        .sort({ createdAt: -1 });

      res.json({
        success: true,
        data: {
          folder,
          subfolders,
          documents
        }
      });

    } catch (error) {
      console.error('Get folder error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch folder',
        error: error.message
      });
    }
  }

  // Update folder
  async updateFolder(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.data.id;
      const { name, description, color, icon, isFavorite, isArchived } = req.body;

      const folder = await Folder.findOne({
        _id: id,
        $or: [
          { ownerId: userId },
          { 'permissions.userId': userId, 'permissions.permission': { $in: ['edit', 'admin'] } }
        ]
      });

      if (!folder) {
        return res.status(404).json({
          success: false,
          message: 'Folder not found or access denied'
        });
      }

      // Check if name change conflicts with existing folder
      if (name && name !== folder.name) {
        const existingFolder = await Folder.findOne({
          name: name.trim(),
          parentId: folder.parentId,
          ownerId: userId,
          _id: { $ne: id }
        });

        if (existingFolder) {
          return res.status(400).json({
            success: false,
            message: 'Folder with this name already exists in the current location'
          });
        }
      }

      // Update fields
      if (name !== undefined) folder.name = name.trim();
      if (description !== undefined) folder.description = description;
      if (color !== undefined) folder.color = color;
      if (icon !== undefined) folder.icon = icon;
      if (isFavorite !== undefined) folder.isFavorite = isFavorite;
      if (isArchived !== undefined) folder.isArchived = isArchived;

      folder.modifiedAt = new Date();
      await folder.save();

      res.json({
        success: true,
        message: 'Folder updated successfully',
        data: folder
      });

    } catch (error) {
      console.error('Update folder error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update folder',
        error: error.message
      });
    }
  }

  // Delete folder
  async deleteFolder(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.data.id;

      const folder = await Folder.findOne({
        _id: id,
        ownerId: userId // Only owner can delete
      });

      if (!folder) {
        return res.status(404).json({
          success: false,
          message: 'Folder not found or access denied'
        });
      }

      // Check if folder has subfolders
      const subfolderCount = await Folder.countDocuments({ parentId: id });
      if (subfolderCount > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete folder with subfolders. Please delete subfolders first.'
        });
      }

      // Check if folder has documents
      const documentCount = await Document.countDocuments({ folderId: id });
      if (documentCount > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete folder with documents. Please move or delete documents first.'
        });
      }

      // Update parent folder subfolder count
      if (folder.parentId) {
        await Folder.findByIdAndUpdate(folder.parentId, {
          $inc: { folderCount: -1 }
        });
      }

      // Delete folder
      await Folder.findByIdAndDelete(id);

      res.json({
        success: true,
        message: 'Folder deleted successfully'
      });

    } catch (error) {
      console.error('Delete folder error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete folder',
        error: error.message
      });
    }
  }

  // Move folder
  async moveFolder(req, res) {
    try {
      const { id } = req.params;
      const { newParentId } = req.body;
      const userId = req.user.data.id;

      const folder = await Folder.findOne({
        _id: id,
        ownerId: userId
      });

      if (!folder) {
        return res.status(404).json({
          success: false,
          message: 'Folder not found or access denied'
        });
      }

      // Prevent moving to itself or its subfolder
      if (newParentId === id) {
        return res.status(400).json({
          success: false,
          message: 'Cannot move folder to itself'
        });
      }

      // Check if new parent exists and user has access
      let newParentPath = '/';
      if (newParentId) {
        const newParent = await Folder.findOne({
          _id: newParentId,
          $or: [
            { ownerId: userId },
            { 'permissions.userId': userId }
          ]
        });

        if (!newParent) {
          return res.status(404).json({
            success: false,
            message: 'New parent folder not found or access denied'
          });
        }

        newParentPath = newParent.path;
      }

      // Update old parent folder count
      if (folder.parentId) {
        await Folder.findByIdAndUpdate(folder.parentId, {
          $inc: { folderCount: -1 }
        });
      }

      // Update new parent folder count
      if (newParentId) {
        await Folder.findByIdAndUpdate(newParentId, {
          $inc: { folderCount: 1 }
        });
      }

      // Update folder
      folder.parentId = newParentId || null;
      folder.path = newParentPath;
      folder.modifiedAt = new Date();
      await folder.save();

      res.json({
        success: true,
        message: 'Folder moved successfully',
        data: folder
      });

    } catch (error) {
      console.error('Move folder error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to move folder',
        error: error.message
      });
    }
  }

  // Get folder breadcrumbs
  async getFolderBreadcrumbs(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.data.id;

      const breadcrumbs = [];
      let currentId = id;

      while (currentId) {
        const folder = await Folder.findOne({
          _id: currentId,
          $or: [
            { ownerId: userId },
            { 'permissions.userId': userId }
          ]
        }).select('name color parentId');

        if (!folder) break;

        breadcrumbs.unshift({
          id: folder._id,
          name: folder.name,
          color: folder.color
        });

        currentId = folder.parentId;
      }

      res.json({
        success: true,
        data: breadcrumbs
      });

    } catch (error) {
      console.error('Get breadcrumbs error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch breadcrumbs',
        error: error.message
      });
    }
  }
}

module.exports = new FolderController();
