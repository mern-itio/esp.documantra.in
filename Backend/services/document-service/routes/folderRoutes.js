const express = require('express');
const folderController = require('../controllers/folderController');

const router = express.Router();

// Folder routes
router.post('/', folderController.createFolder);
router.get('/', folderController.getUserFolders);
router.get('/:id', folderController.getFolder);
router.put('/:id', folderController.updateFolder);
router.delete('/:id', folderController.deleteFolder);
router.post('/:id/move', folderController.moveFolder);
router.get('/:id/breadcrumbs', folderController.getFolderBreadcrumbs);

module.exports = router;
