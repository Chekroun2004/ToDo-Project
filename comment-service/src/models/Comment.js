const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  todoId: { type: String, required: true, index: true },
  userId: { type: String, required: true },
  authorName: { type: String, required: true },
  content: { type: String, required: true, maxlength: 1000 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Comment', commentSchema);
