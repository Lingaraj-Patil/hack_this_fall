const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  startTime: {
    type: Date,
    required: true,
    default: Date.now
  },
  endTime: Date,
  duration: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['active', 'paused', 'auto_paused', 'completed', 'abandoned'],
    default: 'active',
    index: true
  },
  pauseLog: [{
    pausedAt: Date,
    resumedAt: Date,
    reason: { type: String, enum: ['manual', 'auto', 'distraction'] }
  }],
  analytics: {
    totalDistractions: { type: Number, default: 0 },
    totalPauses: { type: Number, default: 0 },
    blockedSiteAttempts: { type: Number, default: 0 },
    avgConcentrationScore: { type: Number, default: 0 },
    postureAlerts: { type: Number, default: 0 },
    eyeTrackingAlerts: { type: Number, default: 0 },
    totalProductiveTime: { type: Number, default: 0 }
  },
  snapshots: [{
    timestamp: { type: Date, default: Date.now },
    eyeTracking: {
      lookingAway: Boolean,
      duration: Number,
      confidence: Number,
      headYaw: Number,
      headPitch: Number,
      eyeAspectRatio: Number
    },
    posture: {
      interestScore: Number,
      interestLevel: String,
      spineAngle: Number,
      slouch: Boolean,
      visibilityScore: Number
    },
    concentrationScore: Number
  }],
  pointsEarned: { type: Number, default: 0 },
  pointsLost: { type: Number, default: 0 },
  netPoints: { type: Number, default: 0 },
  notes: {
    type: String,
    maxlength: 500
  },
  tags: [String],
  metadata: {
    device: String,
    browser: String,
    ipAddress: String
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
sessionSchema.index({ userId: 1, createdAt: -1 });
sessionSchema.index({ userId: 1, status: 1 });
sessionSchema.index({ createdAt: -1 });

// Calculate duration before saving
sessionSchema.pre('save', function(next) {
  if (this.endTime && this.startTime) {
    this.duration = Math.floor((this.endTime - this.startTime) / 1000);
  }
  next();
});

// Virtual for formatted duration
sessionSchema.virtual('formattedDuration').get(function() {
  const hours = Math.floor(this.duration / 3600);
  const minutes = Math.floor((this.duration % 3600) / 60);
  const seconds = this.duration % 60;
  return `${hours}h ${minutes}m ${seconds}s`;
});

module.exports = mongoose.model('Session', sessionSchema);
