const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
  userId:   { type: String, required: true },
  name:     { type: String, required: true },
  content:  { type: String, required: true },
  createdAt:{ type: Date, default: Date.now }
});

const PostSchema = new mongoose.Schema({
  title:      { type: String, required: true },
  authorName:       { type: String, required: true },
  content:    { type: String, required: true },
  category:   { type: String, required: true, enum: ['general', 'api', 'webhooks', 'sdk','announcements'] },
  tags:       { type: [String], default: [] },
  userId:     { type: String, required: true },
  createdAt:  { type: Date, default: Date.now },
  comments:   { type: [CommentSchema], default: [] },
  likes:      { type: [String], default: [] }   // array of userIds who liked
});

module.exports = mongoose.model('Post', PostSchema);
