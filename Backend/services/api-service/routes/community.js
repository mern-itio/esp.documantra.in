const express = require('express');
const router = express.Router();
const postController = require('../controllers/communityController');

// Create Post
router.post('/create', postController.createPost);
// Get posts by tags (example: /api/community/posts?tags=api,webhooks)
router.get('/posts', postController.getPostsByTags);

router.post('/:id/comments', postController.addComment);
router.post('/:id/like', postController.likePost);
router.get('/stats', postController.getPostStats);
router.get('/all-posts', postController.getAllPosts);

module.exports = router;
