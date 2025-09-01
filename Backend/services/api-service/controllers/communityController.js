const Post = require('../models/community');

// Create a new post
exports.createPost = async (req, res) => {
  try {
    const { title, content, category, tags } = req.body;
    console.log(req.body);
    const userId = req.user.data.id;
    const authorName = req.user.data.fullname;

    // Basic validation
    if (!title || !content || !category) {
      return res.status(400).json({ message: "Title, content, and category are required." });
    }
    if (!['general', 'api', 'webhooks', 'sdk', 'announcements'].includes(category)) {
      return res.status(400).json({ message: "Invalid category." });
    }

    // Format tags if needed
    let tagsArr = [];
    if (tags && typeof tags === 'string') {
      tagsArr = tags.split(',').map(tag => tag.trim()).filter(Boolean);
    } else if (Array.isArray(tags)) {
      tagsArr = tags.map(tag => tag.trim());
    }

    // Create and save
    const post = new Post({ title, content, category, tags, userId, authorName });
    await post.save();

    return res.status(201).json({ message: "Post created successfully", postId: post._id });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};
exports.getPostsByTags = async (req, res) => {
  try {
    let tags = req.query.tags;
    // Convert string tags to array, filter empty
    if (tags) {
      tags = tags.split(',').map(tag => tag.trim()).filter(Boolean);
    } else {
      tags = [];
    }

    let posts;
    // NEW: If tags array includes "all", return all posts without filtering
    if (tags.includes("all")) {
      posts = await Post.find().sort({ createdAt: -1 });
    } else if (tags.length > 0) {
      posts = await Post.find({ tags: { $in: tags } }).sort({ createdAt: -1 });
    } else {
      posts = await Post.find().sort({ createdAt: -1 }); // No filter: return all
    }

    res.status(200).json(posts);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.addComment = async (req, res) => {
    console.log(req.user);
  try {
    const postId = req.params.id;
    const userId = req.user.data.id;
    const name = req.user.data.fullname;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ message: "Comment content required." });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found." });
    }

    post.comments.push({ userId, content, name });
    await post.save();

    res.status(201).json({ message: "Comment added.", comments: post.comments });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
exports.likePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user.data.id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found." });
    }

    if (post.likes.includes(userId)) {
      return res.status(400).json({ message: "Already liked." });
    }

    post.likes.push(userId);
    await post.save();

    res.status(200).json({ message: "Post liked!", likes: post.likes.length });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
exports.getPostStats = async (req, res) => {
  try {
    // 1. Total unique users
    const userCounts = await Post.distinct('userId');
    const totalUserCount = userCounts.length;

    // 2. Total posts
    const totalPostCount = await Post.countDocuments();

    // 3. Posts this week (Monday se aaj tak)
    // Get Monday of this week (IST timezone assumed)
    const now = new Date();
    const monday = new Date(now);
    monday.setDate(now.getDate() - (now.getDay() === 0 ? 6 : now.getDay() - 1));
    monday.setHours(0, 0, 0, 0);

    const postsThisWeek = await Post.countDocuments({
      createdAt: { $gte: monday, $lte: now }
    });

    res.status(200).json({
      totalUsers: totalUserCount,
      totalPosts: totalPostCount,
      postsThisWeek: postsThisWeek
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
exports.getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 }); // latest first
    res.status(200).json(posts);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
