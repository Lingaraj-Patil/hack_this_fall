const User = require('../models/User');
const leaderboardService = require('../services/leaderboardService');
const ApiResponse = require('../utils/response');
const Helpers = require('../utils/helpers');
const asyncHandler = require('../middleware/asycHandler');
const { LEADERBOARD_TYPES, HEARTS } = require('../config/constants');

class GamificationController {
  getLeaderboard = asyncHandler(async (req, res) => {
    const { type = LEADERBOARD_TYPES.WEEKLY, clanId } = req.query;

    if (!Object.values(LEADERBOARD_TYPES).includes(type)) {
      return ApiResponse.error(res, 'Invalid leaderboard type', 400);
    }

    const leaderboard = await leaderboardService.getOrGenerateLeaderboard(type, clanId);

    return ApiResponse.success(res, leaderboard);
  });

  getUserRank = asyncHandler(async (req, res) => {
    const { type = LEADERBOARD_TYPES.WEEKLY } = req.query;

    const leaderboard = await leaderboardService.getOrGenerateLeaderboard(type);

    const userEntry = leaderboard.entries.find(
      e => e.userId.toString() === req.userId.toString()
    );

    return ApiResponse.success(res, {
      rank: userEntry?.rank || null,
      total: leaderboard.entries.length,
      entry: userEntry,
      percentile: userEntry ? ((leaderboard.entries.length - userEntry.rank) / leaderboard.entries.length * 100).toFixed(1) : null
    });
  });

  getHearts = asyncHandler(async (req, res) => {
    const user = await User.findById(req.userId);

    // Calculate regenerated hearts
    const currentHearts = Helpers.calculateHeartRegen(
      user.gamification.lastHeartRegen,
      user.gamification.maxHearts,
      user.gamification.currentHearts
    );

    // Update if changed
    if (currentHearts !== user.gamification.currentHearts) {
      user.gamification.currentHearts = currentHearts;
      user.gamification.lastHeartRegen = new Date();
      await user.save();
    }

    // Calculate next regen time
    const msToNextRegen = (HEARTS.REGEN_HOURS * 60 * 60 * 1000) - 
                          (Date.now() - user.gamification.lastHeartRegen.getTime());
    
    const nextRegenTime = new Date(Date.now() + Math.max(0, msToNextRegen));

    return ApiResponse.success(res, {
      current: user.gamification.currentHearts,
      max: user.gamification.maxHearts,
      nextRegenAt: nextRegenTime,
      msToNextRegen: Math.max(0, msToNextRegen)
    });
  });

  getUserStats = asyncHandler(async (req, res) => {
    const user = await User.findById(req.userId);

    const stats = {
      totalPoints: user.gamification.totalPoints,
      level: user.gamification.level,
      currentHearts: user.gamification.currentHearts,
      maxHearts: user.gamification.maxHearts,
      streak: user.gamification.streak,
      lastSessionDate: user.gamification.lastSessionDate
    };

    // Get rank
    const leaderboard = await leaderboardService.getOrGenerateLeaderboard(LEADERBOARD_TYPES.ALL_TIME);
    const userEntry = leaderboard.entries.find(e => e.userId.toString() === req.userId.toString());
    
    stats.globalRank = userEntry?.rank || null;
    stats.globalTotal = leaderboard.entries.length;

    return ApiResponse.success(res, stats);
  });

  getAchievements = asyncHandler(async (req, res) => {
    const user = await User.findById(req.userId);
    const Session = require('../models/Session');

    // Calculate achievements
    const totalSessions = await Session.countDocuments({
      userId: req.userId,
      status: 'completed'
    });

    const achievements = [];

    // Session milestones
    if (totalSessions >= 1) achievements.push({ id: 'first_session', name: 'First Steps', description: 'Complete your first session', unlocked: true });
    if (totalSessions >= 10) achievements.push({ id: 'dedicated_learner', name: 'Dedicated Learner', description: 'Complete 10 sessions', unlocked: true });
    if (totalSessions >= 50) achievements.push({ id: 'study_master', name: 'Study Master', description: 'Complete 50 sessions', unlocked: true });
    if (totalSessions >= 100) achievements.push({ id: 'study_legend', name: 'Study Legend', description: 'Complete 100 sessions', unlocked: true });

    // Streak achievements
    if (user.gamification.streak >= 3) achievements.push({ id: 'streak_3', name: 'On Fire!', description: '3 day streak', unlocked: true });
    if (user.gamification.streak >= 7) achievements.push({ id: 'streak_7', name: 'Week Warrior', description: '7 day streak', unlocked: true });
    if (user.gamification.streak >= 30) achievements.push({ id: 'streak_30', name: 'Unstoppable', description: '30 day streak', unlocked: true });

    // Points achievements
    if (user.gamification.totalPoints >= 1000) achievements.push({ id: 'points_1k', name: 'Rising Star', description: 'Earn 1,000 points', unlocked: true });
    if (user.gamification.totalPoints >= 5000) achievements.push({ id: 'points_5k', name: 'Point Collector', description: 'Earn 5,000 points', unlocked: true });
    if (user.gamification.totalPoints >= 10000) achievements.push({ id: 'points_10k', name: 'Elite Scorer', description: 'Earn 10,000 points', unlocked: true });

    // Level achievements
    if (user.gamification.level >= 5) achievements.push({ id: 'level_5', name: 'Apprentice', description: 'Reach level 5', unlocked: true });
    if (user.gamification.level >= 10) achievements.push({ id: 'level_10', name: 'Expert', description: 'Reach level 10', unlocked: true });
    if (user.gamification.level >= 20) achievements.push({ id: 'level_20', name: 'Master', description: 'Reach level 20', unlocked: true });

    return ApiResponse.success(res, {
      achievements,
      totalUnlocked: achievements.length
    });
  });
}

module.exports = new GamificationController();
