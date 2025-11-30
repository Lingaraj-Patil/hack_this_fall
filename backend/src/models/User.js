const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    minlength: 3,
    maxlength: 30,
    index: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    index: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  profile: {
    avatar: {
      type: String,
      default: 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'
    },
    bio: {
      type: String,
      maxlength: 200,
      default: ''
    }
  },
  gamification: {
    totalPoints: { type: Number, default: 0, index: true },
    currentHearts: { type: Number, default: 5 },
    maxHearts: { type: Number, default: 5 },
    level: { type: Number, default: 1 },
    streak: { type: Number, default: 0 },
    lastHeartRegen: { type: Date, default: Date.now },
    lastSessionDate: Date
  },
  settings: {
  blockedSites: [{
    url: String,
    isActive: { type: Boolean, default: true }
  }],
  allowedSites: [{
    url: String,
    isActive: { type: Boolean, default: true }
  }],
  sessionGoals: {
    dailyMinutes: { type: Number, default: 120 },
    breakInterval: { type: Number, default: 25 }
  },
  notifications: {
    voice: { type: Boolean, default: true },
    push: { type: Boolean, default: true },
    email: { type: Boolean, default: false }
  },
  theme: {
    background: { type: String, default: 'forest' },
    accentColor: { type: String, default: '#10b981' }
  }
  },
  clanId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Clan',
    default: null
  },
  refreshTokens: [{
    token: String,
    createdAt: { type: Date, default: Date.now },
    expiresAt: Date
  }],
  isActive: { type: Boolean, default: true },
  lastLogin: Date
}, {
  timestamps: true
});

// Indexes
userSchema.index({ 'gamification.totalPoints': -1 });
userSchema.index({ createdAt: -1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Remove sensitive data when converting to JSON
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  delete user.refreshTokens;
  return user;
};

module.exports = mongoose.model('User', userSchema);
