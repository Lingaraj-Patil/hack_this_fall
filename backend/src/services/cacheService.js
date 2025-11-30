const { getRedisClient } = require('../config/redis');
const logger = require('../utils/logger');

class CacheService {
  async get(key) {
    const redisClient = getRedisClient();
    if (!redisClient) return null;

    try {
      const value = await redisClient.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('Cache get error:', error);
      return null;
    }
  }

  async set(key, value, ttl = 3600) {
    const redisClient = getRedisClient();
    if (!redisClient) return false;

    try {
      await redisClient.setEx(key, ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      logger.error('Cache set error:', error);
      return false;
    }
  }

  async delete(key) {
    const redisClient = getRedisClient();
    if (!redisClient) return false;

    try {
      await redisClient.del(key);
      return true;
    } catch (error) {
      logger.error('Cache delete error:', error);
      return false;
    }
  }

  async deletePattern(pattern) {
    const redisClient = getRedisClient();
    if (!redisClient) return false;

    try {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
      return true;
    } catch (error) {
      logger.error('Cache delete pattern error:', error);
      return false;
    }
  }

  async invalidateUserCache(userId) {
    await this.deletePattern(`user:${userId}:*`);
  }

  async invalidateLeaderboardCache() {
    await this.deletePattern('leaderboard:*');
  }
}

module.exports = new CacheService();
