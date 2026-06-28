const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  todoId: { type: String, required: true },
  todoTitle: { type: String, required: true },
  type: { type: String, enum: ['overdue', 'due_soon'], required: true },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Notification', notificationSchema);
