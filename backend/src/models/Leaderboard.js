const mongoose = require('mongoose');

const leaderboardSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'alltime', 'clan'],
    required: true,
    index: true
  },
  period: {
    type: Date,
    required: true,
    index: true
  },
  entries: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    username: String,
    avatar: String,
    points: Number,
    rank: Number,
    sessions: Number,
    studyTime: Number,
    clanName: String
  }],
  clanId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Clan'
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    required: true
  }
}, {
  timestamps: true
});

// Compound indexes
leaderboardSchema.index({ type: 1, period: 1 });
leaderboardSchema.index({ clanId: 1, type: 1 });
leaderboardSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Leaderboard', leaderboardSchema);
