const { POINTS } = require('../config/constants');
const logger = require('../utils/logger');

class PointsService {
  calculateSessionPoints(session) {
    const { duration, analytics, snapshots } = session;

    // Base points (1 point per 10 seconds)
    const basePoints = duration * POINTS.PER_SECOND;

    // Calculate average concentration from snapshots
    const avgConcentration = snapshots.length > 0
      ? snapshots.reduce((sum, s) => sum + (s.concentrationScore || 0), 0) / snapshots.length
      : 0;

    // Bonus points for high concentration
    const concentrationBonus = avgConcentration * POINTS.CONCENTRATION_BONUS_MULTIPLIER;

    // Penalties
    const distractionPenalty = analytics.totalDistractions * POINTS.DISTRACTION_PENALTY;
    const pausePenalty = analytics.totalPauses * POINTS.PAUSE_PENALTY;
    const blockedSitePenalty = analytics.blockedSiteAttempts * POINTS.BLOCKED_SITE_PENALTY;

    const totalPenalty = distractionPenalty + pausePenalty + blockedSitePenalty;

    // Calculate final points
    const earnedPoints = Math.floor(basePoints + concentrationBonus);
    const lostPoints = Math.floor(totalPenalty);
    const netPoints = Math.max(0, earnedPoints - lostPoints);

    logger.debug('Points calculation', {
      basePoints,
      concentrationBonus,
      totalPenalty,
      netPoints
    });

    return {
      earnedPoints,
      lostPoints,
      netPoints,
      breakdown: {
        base: Math.floor(basePoints),
        concentrationBonus: Math.floor(concentrationBonus),
        distractionPenalty: Math.floor(distractionPenalty),
        pausePenalty: Math.floor(pausePenalty),
        blockedSitePenalty: Math.floor(blockedSitePenalty)
      }
    };
  }

  shouldLoseHeart(analytics) {
    // Lose heart if too many major distractions
    const majorDistractions = 
      analytics.totalDistractions > 10 ||
      analytics.blockedSiteAttempts > 5 ||
      analytics.avgConcentrationScore < 0.3;

    return majorDistractions;
  }

  calculateLevelFromPoints(totalPoints) {
    // Level formula: level = floor(sqrt(totalPoints / 100))
    return Math.floor(Math.sqrt(totalPoints / 100)) + 1;
  }
}

module.exports = new PointsService();
