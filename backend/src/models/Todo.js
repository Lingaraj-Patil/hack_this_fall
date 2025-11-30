const mongoose = require('mongoose');

const todoSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  text: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  completed: {
    type: Boolean,
    default: false,
    index: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  dueDate: Date,
  category: {
    type: String,
    default: 'general'
  },
  order: {
    type: Number,
    default: 0
  },
  completedAt: Date
}, {
  timestamps: true
});

// Indexes
todoSchema.index({ userId: 1, completed: 1, createdAt: -1 });
todoSchema.index({ userId: 1, dueDate: 1 });

module.exports = mongoose.model('Todo', todoSchema);
