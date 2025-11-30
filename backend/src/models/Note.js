const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  content: {
    type: String,
    required: true,
    maxlength: 10000
  },
  tags: [String],
  isPinned: {
    type: Boolean,
    default: false
  },
  category: {
    type: String,
    default: 'general'
  },
  color: {
    type: String,
    default: '#ffffff'
  },
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session'
  }
}, {
  timestamps: true
});

// Indexes
noteSchema.index({ userId: 1, createdAt: -1 });
noteSchema.index({ userId: 1, isPinned: -1 });
noteSchema.index({ userId: 1, tags: 1 });

module.exports = mongoose.model('Note', noteSchema);
