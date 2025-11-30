const Leaderboard = require('../models/Leaderboard');
const Session = require('../models/Session');
const User = require('../models/User');
const Clan = require('../models/Clan');
const { getRedisClient } = require('../config/redis');
const logger = require('../utils/logger');
const { LEADERBOARD_TYPES, CACHE_TTL } = require('../config/constants');

class LeaderboardService {
  async getOrGenerateLeaderboard(type, clanId = null) {
    const redisClient = getRedisClient();
    const cacheKey = `leaderboard:${type}${clanId ? ':' + clanId : ''}`;

    // Try cache first
    if (redisClient) {
      try {
        const cached = await redisClient.get(cacheKey);
        if (cached) {
          logger.debug(`Leaderboard cache hit: ${cacheKey}`);
          return JSON.parse(cached);
        }
      } catch (error) {
        logger.warn('Redis get error:', error);
      }
    }

    // Generate fresh leaderboard
    const period = this._getPeriodDate(type);
    let leaderboard = await Leaderboard.findOne({ type, period, clanId });

    // If not in DB or expired, regenerate
    if (!leaderboard || leaderboard.lastUpdated < Date.now() - CACHE_TTL.LEADERBOARD_DAILY) {
      leaderboard = await this._generateLeaderboard(type, period, clanId);
    }

    // Cache result
    if (redisClient) {
      try {
        await redisClient.setEx(
          cacheKey,
          type === LEADERBOARD_TYPES.DAILY ? CACHE_TTL.LEADERBOARD_DAILY : CACHE_TTL.LEADERBOARD_WEEKLY,
          JSON.stringify(leaderboard)
        );
      } catch (error) {
        logger.warn('Redis set error:', error);
      }
    }

    return leaderboard;
  }

  async _generateLeaderboard(type, period, clanId = null) {
    const matchQuery = {
      status: 'completed',
      createdAt: { $gte: period }
    };

    if (clanId) {
      const clan = await Clan.findById(clanId);
      if (!clan) throw new Error('Clan not found');
      const memberIds = clan.members.map(m => m.userId);
      matchQuery.userId = { $in: memberIds };
    }

    const entries = await Session.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$userId',
          points: { $sum: '$netPoints' },
          sessions: { $sum: 1 },
          studyTime: { $sum: '$duration' }
        }
      },
      { $sort: { points: -1 } },
      { $limit: 100 }
    ]);

    const populatedEntries = await Promise.all(
      entries.map(async (entry, index) => {
        const user = await User.findById(entry._id)
          .select('username profile.avatar clanId');
        
        if (!user) return null;
        
        let clanName = null;
        if (user.clanId) {
          const userClan = await Clan.findById(user.clanId).select('name');
          clanName = userClan?.name;
        }
        
        return {
          userId: entry._id,
          username: user.username,
          avatar: user.profile.avatar,
          points: entry.points,
          rank: index + 1,
          sessions: entry.sessions,
          studyTime: entry.studyTime,
          clanName
        };
      })
    );

    // Filter out null entries
    const validEntries = populatedEntries.filter(e => e !== null);

    const expiresAt = this._calculateExpiryDate(type, period);

    const leaderboard = await Leaderboard.findOneAndUpdate(
      { type, period, clanId },
      {
        entries: validEntries,
        lastUpdated: new Date(),
        expiresAt
      },
      { upsert: true, new: true }
    );

    return leaderboard;
  }

  async updateUserRankCache(userId) {
    const user = await User.findById(userId).select('gamification.totalPoints');
    const redisClient = getRedisClient();

    if (redisClient && user) {
      try {
        await redisClient.zAdd('user:ranks', {
          score: user.gamification.totalPoints,
          value: userId.toString()
        });
      } catch (error) {
        logger.warn('Redis zAdd error:', error);
      }
    }
  }

  _getPeriodDate(type) {
    const now = new Date();
    switch (type) {
      case LEADERBOARD_TYPES.DAILY:
        return new Date(now.setHours(0, 0, 0, 0));
      case LEADERBOARD_TYPES.WEEKLY:
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(now.setDate(diff));
      case LEADERBOARD_TYPES.MONTHLY:
        return new Date(now.getFullYear(), now.getMonth(), 1);
      case LEADERBOARD_TYPES.ALL_TIME:
        return new Date(0);
      default:
        return new Date(0);
    }
  }

  _calculateExpiryDate(type, period) {
    switch (type) {
      case LEADERBOARD_TYPES.DAILY:
        return new Date(period.getTime() + 24 * 60 * 60 * 1000);
      case LEADERBOARD_TYPES.WEEKLY:
        return new Date(period.getTime() + 7 * 24 * 60 * 60 * 1000);
      case LEADERBOARD_TYPES.MONTHLY:
        const nextMonth = new Date(period);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        return nextMonth;
      case LEADERBOARD_TYPES.ALL_TIME:
        return new Date('2099-12-31');
      default:
        return new Date('2099-12-31');
    }
  }
}

module.exports = new LeaderboardService();
