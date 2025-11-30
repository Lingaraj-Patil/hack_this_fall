module.exports = {
  SESSION_STATUS: {
    IDLE: 'idle',
    ACTIVE: 'active',
    PAUSED: 'paused',
    AUTO_PAUSED: 'auto_paused',
    COMPLETED: 'completed',
    ABANDONED: 'abandoned'
  },

  LEADERBOARD_TYPES: {
    DAILY: 'daily',
    WEEKLY: 'weekly',
    MONTHLY: 'monthly',
    ALL_TIME: 'alltime',
    CLAN: 'clan'
  },

  CLAN_ROLES: {
    LEADER: 'leader',
    ADMIN: 'admin',
    MEMBER: 'member'
  },

  CACHE_TTL: {
    SESSION: 3600, // 1 hour
    LEADERBOARD_DAILY: 300, // 5 minutes
    LEADERBOARD_WEEKLY: 600, // 10 minutes
    USER_HEARTS: 7200, // 2 hours
    CLAN_MEMBERS: 1800 // 30 minutes
  },

  POINTS: {
    PER_SECOND: parseFloat(process.env.POINTS_PER_SECOND) || 0.1,
    DISTRACTION_PENALTY: parseInt(process.env.DISTRACTION_PENALTY) || 10,
    PAUSE_PENALTY: parseInt(process.env.PAUSE_PENALTY) || 5,
    BLOCKED_SITE_PENALTY: parseInt(process.env.BLOCKED_SITE_PENALTY) || 15,
    CONCENTRATION_BONUS_MULTIPLIER: 50
  },

  HEARTS: {
    MAX: parseInt(process.env.MAX_HEARTS) || 5,
    REGEN_HOURS: parseInt(process.env.HEARTS_REGEN_HOURS) || 3,
    LOSS_PER_MAJOR_DISTRACTION: 1
  },

  VISION_THRESHOLDS: {
    LOOKING_AWAY_DURATION: 10, // seconds
    LOW_CONCENTRATION: 0.4,
    SLOUCH_ANGLE: 20, // degrees
    AUTO_PAUSE_DELAY: 30 // seconds
  }
};
