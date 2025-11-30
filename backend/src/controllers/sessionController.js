const Session = require('../models/Session');
const User = require('../models/User');
const ApiResponse = require('../utils/response');
const pointsService = require('../services/pointsService');
const notificationService = require('../services/notificationService');
const cacheService = require('../services/cacheService');
const leaderboardService = require('../services/leaderboardService');
const logger = require('../utils/logger');
const { SESSION_STATUS } = require('../config/constants');

class SessionController {
  async startSession(req, res, next) {
    try {
      const { tags, notes } = req.body;

      // Check active session in cache first
      const cacheKey = `user:${req.userId}:session:active`;
      const cachedSession = await cacheService.get(cacheKey);
      
      if (cachedSession) {
        return ApiResponse.error(res, 'You already have an active session', 400);
      }

      // Double-check database
      const activeSession = await Session.findOne({
        userId: req.userId,
        status: { $in: [SESSION_STATUS.ACTIVE, SESSION_STATUS.PAUSED] }
      });

      if (activeSession) {
        await cacheService.set(cacheKey, activeSession, 3600);
        return ApiResponse.error(res, 'You already have an active session', 400);
      }

      // Check hearts
      if (req.user.gamification.currentHearts <= 0) {
        return ApiResponse.error(res, 'No hearts remaining. Wait for regeneration.', 403);
      }

      // Create session
      const session = new Session({
        userId: req.userId,
        startTime: new Date(),
        status: SESSION_STATUS.ACTIVE,
        tags,
        notes,
        metadata: {
          device: req.headers['user-agent'],
          ipAddress: req.ip
        }
      });

      await session.save();

      // Cache active session
      await cacheService.set(cacheKey, session, 3600);

      // Emit via socket
      if (global.io) {
        global.io.to(`user:${req.userId}`).emit('session:started', { sessionId: session._id });
      }

      logger.info(`Session started: ${session._id} by user ${req.userId}`);

      return ApiResponse.success(res, session, 'Session started', 201);
    } catch (error) {
      next(error);
    }
  }

  async pauseSession(req, res, next) {
    try {
      const { sessionId } = req.params;
      const { reason = 'manual' } = req.body;

      const session = await Session.findOne({
        _id: sessionId,
        userId: req.userId,
        status: SESSION_STATUS.ACTIVE
      });

      if (!session) {
        return ApiResponse.error(res, 'Active session not found', 404);
      }

      session.status = SESSION_STATUS.PAUSED;
      session.pauseLog.push({
        pausedAt: new Date(),
        reason
      });
      session.analytics.totalPauses += 1;

      if (reason === 'manual') {
        session.analytics.totalDistractions += 0.5;
      }

      await session.save();

      const cacheKey = `user:${req.userId}:session:active`;
      await cacheService.set(cacheKey, session, 3600);

      if (global.io) {
        global.io.to(`user:${req.userId}`).emit('session:paused', { sessionId, reason });
      }

      return ApiResponse.success(res, session, 'Session paused');
    } catch (error) {
      next(error);
    }
  }

  async resumeSession(req, res, next) {
    try {
      const { sessionId } = req.params;

      const session = await Session.findOne({
        _id: sessionId,
        userId: req.userId,
        status: SESSION_STATUS.PAUSED
      });

      if (!session) {
        return ApiResponse.error(res, 'Paused session not found', 404);
      }

      session.status = SESSION_STATUS.ACTIVE;
      
      if (session.pauseLog.length > 0) {
        session.pauseLog[session.pauseLog.length - 1].resumedAt = new Date();
      }

      await session.save();

      const cacheKey = `user:${req.userId}:session:active`;
      await cacheService.set(cacheKey, session, 3600);

      if (global.io) {
        global.io.to(`user:${req.userId}`).emit('session:resumed', { sessionId });
      }

      return ApiResponse.success(res, session, 'Session resumed');
    } catch (error) {
      next(error);
    }
  }

  async endSession(req, res, next) {
    try {
      const { sessionId } = req.params;
      const { notes, status = SESSION_STATUS.COMPLETED } = req.body;

      const session = await Session.findOne({
        _id: sessionId,
        userId: req.userId,
        status: { $in: [SESSION_STATUS.ACTIVE, SESSION_STATUS.PAUSED] }
      });

      if (!session) {
        return ApiResponse.error(res, 'Session not found', 404);
      }

      session.endTime = new Date();
      session.status = status;
      if (notes) session.notes = notes;

      session.duration = Math.floor((session.endTime - session.startTime) / 1000);

      if (session.snapshots.length > 0) {
        const totalConcentration = session.snapshots.reduce(
          (sum, s) => sum + (s.concentrationScore || 0),
          0
        );
        session.analytics.avgConcentrationScore = totalConcentration / session.snapshots.length;
      }

      let totalPauseTime = 0;
      session.pauseLog.forEach(pause => {
        if (pause.resumedAt) {
          totalPauseTime += (pause.resumedAt - pause.pausedAt) / 1000;
        }
      });
      session.analytics.totalProductiveTime = session.duration - totalPauseTime;

      const pointsResult = pointsService.calculateSessionPoints(session);
      session.pointsEarned = pointsResult.earnedPoints;
      session.pointsLost = pointsResult.lostPoints;
      session.netPoints = pointsResult.netPoints;

      await session.save();

      const user = await User.findById(req.userId);
      const previousPoints = user.gamification.totalPoints;
      user.gamification.totalPoints += session.netPoints;
      user.gamification.level = pointsService.calculateLevelFromPoints(
        user.gamification.totalPoints
      );

      if (pointsService.shouldLoseHeart(session.analytics)) {
        user.gamification.currentHearts = Math.max(0, user.gamification.currentHearts - 1);
        
        await notificationService.create(
          req.userId,
          'session',
          '❤️ Heart Lost',
          'You lost a heart due to low concentration. Focus better next time!',
          { sessionId: session._id },
          'high'
        );
      }

      const today = new Date().setHours(0, 0, 0, 0);
      const lastSessionDate = user.gamification.lastSessionDate
        ? new Date(user.gamification.lastSessionDate).setHours(0, 0, 0, 0)
        : null;

      if (lastSessionDate === today) {
        // Same day
      } else if (lastSessionDate === today - 86400000) {
        user.gamification.streak += 1;
      } else {
        user.gamification.streak = 1;
      }
      user.gamification.lastSessionDate = new Date();

      await user.save();

      if (user.clanId) {
        const Clan = require('../models/Clan');
        const clan = await Clan.findById(user.clanId);
        if (clan) {
          clan.totalPoints += session.netPoints;
          clan.stats.totalSessions += 1;
          clan.stats.totalStudyTime += session.duration;
          
          const member = clan.members.find(m => m.userId.toString() === req.userId.toString());
          if (member) {
            member.contributionPoints = (member.contributionPoints || 0) + session.netPoints;
          }
          
          await clan.save();
          await cacheService.deletePattern(`clan:${user.clanId}:*`);
        }
      }

      await cacheService.delete(`user:${req.userId}:session:active`);
      await leaderboardService.updateUserRankCache(req.userId);
      await cacheService.invalidateLeaderboardCache();

      if (global.io) {
        global.io.to(`user:${req.userId}`).emit('session:ended', {
          sessionId: session._id,
          points: session.netPoints,
          level: user.gamification.level
        });
      }

      logger.info(`Session ended: ${session._id}, points: ${session.netPoints}`);

      return ApiResponse.success(res, {
        session,
        pointsBreakdown: pointsResult.breakdown,
        userStats: {
          totalPoints: user.gamification.totalPoints,
          pointsGained: session.netPoints,
          previousPoints,
          level: user.gamification.level,
          hearts: user.gamification.currentHearts,
          streak: user.gamification.streak
        }
      }, 'Session ended');
    } catch (error) {
      next(error);
    }
  }

  async getActiveSession(req, res, next) {
    try {
      const cacheKey = `user:${req.userId}:session:active`;
      let session = await cacheService.get(cacheKey);

      if (!session) {
        session = await Session.findOne({
          userId: req.userId,
          status: { $in: [SESSION_STATUS.ACTIVE, SESSION_STATUS.PAUSED] }
        });

        if (session) {
          await cacheService.set(cacheKey, session, 3600);
        }
      }

      if (!session) {
        return ApiResponse.success(res, null, 'No active session');
      }

      const elapsed = Math.floor((Date.now() - new Date(session.startTime)) / 1000);

      return ApiResponse.success(res, {
        ...session,
        elapsedTime: elapsed
      });
    } catch (error) {
      next(error);
    }
  }

  async getSessionHistory(req, res, next) {
    try {
      const { page = 1, limit = 20, status } = req.query;

      const query = { userId: req.userId };
      if (status) query.status = status;

      const sessions = await Session.find(query)
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .select('-snapshots');

      const total = await Session.countDocuments(query);

      return ApiResponse.paginated(res, sessions, page, limit, total);
    } catch (error) {
      next(error);
    }
  }

  async getSessionById(req, res, next) {
    try {
      const { sessionId } = req.params;

      const session = await Session.findOne({
        _id: sessionId,
        userId: req.userId
      });

      if (!session) {
        return ApiResponse.error(res, 'Session not found', 404);
      }

      return ApiResponse.success(res, session);
    } catch (error) {
      next(error);
    }
  }

  async getSessionStats(req, res, next) {
    try {
      const { period = 'week' } = req.query;

      const dateFilter = this._getDateFilter(period);

      const stats = await Session.aggregate([
        {
          $match: {
            userId: req.user._id,
            status: SESSION_STATUS.COMPLETED,
            createdAt: { $gte: dateFilter }
          }
        },
        {
          $group: {
            _id: null,
            totalSessions: { $sum: 1 },
            totalTime: { $sum: '$duration' },
            totalProductiveTime: { $sum: '$analytics.totalProductiveTime' },
            totalPoints: { $sum: '$netPoints' },
            avgConcentration: { $avg: '$analytics.avgConcentrationScore' },
            totalDistractions: { $sum: '$analytics.totalDistractions' },
            totalPauses: { $sum: '$analytics.totalPauses' }
          }
        }
      ]);

      const result = stats[0] || {
        totalSessions: 0,
        totalTime: 0,
        totalProductiveTime: 0,
        totalPoints: 0,
        avgConcentration: 0,
        totalDistractions: 0,
        totalPauses: 0
      };

      if (result.totalTime > 0) {
        result.efficiency = (result.totalProductiveTime / result.totalTime) * 100;
      } else {
        result.efficiency = 0;
      }

      return ApiResponse.success(res, result);
    } catch (error) {
      next(error);
    }
  }

  async deleteSession(req, res, next) {
    try {
      const { sessionId } = req.params;

      const session = await Session.findOne({
        _id: sessionId,
        userId: req.userId
      });

      if (!session) {
        return ApiResponse.error(res, 'Session not found', 404);
      }

      if (session.status === SESSION_STATUS.ACTIVE || session.status === SESSION_STATUS.PAUSED) {
        return ApiResponse.error(res, 'Cannot delete active session', 400);
      }

      await session.deleteOne();

      return ApiResponse.success(res, null, 'Session deleted');
    } catch (error) {
      next(error);
    }
  }

  _getDateFilter(period) {
    const now = new Date();
    switch (period) {
      case 'today':
        return new Date(now.setHours(0, 0, 0, 0));
      case 'week':
        return new Date(now.setDate(now.getDate() - 7));
      case 'month':
        return new Date(now.setMonth(now.getMonth() - 1));
      case 'year':
        return new Date(now.setFullYear(now.getFullYear() - 1));
      default:
        return new Date(0);
    }
  }
}

module.exports = new SessionController();