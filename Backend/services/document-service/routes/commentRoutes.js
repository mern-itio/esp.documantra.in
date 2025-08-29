const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');

// Get all comments for a document
router.get('/documents/:documentId/comments', commentController.getDocumentComments);

// Get comments by version
router.get('/documents/:documentId/versions/:versionId/comments', commentController.getCommentsByVersion);

// Create a new comment
router.post('/documents/:documentId/comments', commentController.createComment);

// Update a comment
router.put('/comments/:commentId', commentController.updateComment);

// Delete a comment
router.delete('/comments/:commentId', commentController.deleteComment);

// Toggle comment resolution (resolve/unresolve)
router.patch('/comments/:commentId/resolve', commentController.toggleCommentResolution);

// Add a reply to a comment
router.post('/comments/:commentId/replies', commentController.addCommentReply);

// Update a reply
router.put('/comments/:commentId/replies/:replyId', commentController.updateCommentReply);

// Delete a reply
router.delete('/comments/:commentId/replies/:replyId', commentController.deleteCommentReply);

module.exports = router;
