const mongoose = require('mongoose');

const clanSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 50
  },
  description: {
    type: String,
    maxlength: 300
  },
  leaderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    role: {
      type: String,
      enum: ['leader', 'admin', 'member'],
      default: 'member'
    },
    contributionPoints: {
      type: Number,
      default: 0
    }
  }],
  totalPoints: {
    type: Number,
    default: 0,
    index: true
  },
  stats: {
    totalSessions: { type: Number, default: 0 },
    totalStudyTime: { type: Number, default: 0 },
    avgConcentration: { type: Number, default: 0 },
    memberCount: { type: Number, default: 1 }
  },
  maxMembers: {
    type: Number,
    default: 50
  },
  isPrivate: {
    type: Boolean,
    default: false
  },
  inviteCode: {
    type: String,
    unique: true,
    required: true,
    index: true
  },
  banner: String,
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
clanSchema.index({ totalPoints: -1 });
clanSchema.index({ 'members.userId': 1 });

// Update member count before saving
clanSchema.pre('save', function(next) {
  this.stats.memberCount = this.members.length;
  next();
});

module.exports = mongoose.model('Clan', clanSchema);
