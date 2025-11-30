const Session = require('../models/Session');
const ApiResponse = require('../utils/response');
const visionService = require('../services/visionService');
const logger = require('../utils/logger');

class VisionController {
  async analyzeFrame(req, res) {
    const { image, sessionId } = req.body;

    // Verify session belongs to user
    const session = await Session.findOne({
      _id: sessionId,
      userId: req.userId,
      status: 'active'
    });

    if (!session) {
      return ApiResponse.error(res, 'Active session not found', 404);
    }

    // Call ML API
    const result = await visionService.analyzeFrame(image);

    if (!result.success) {
      return ApiResponse.error(res, 'Vision analysis failed', 500);
    }

    // Process result
    const analysis = visionService.processAnalysisResult(result.data);

    // Store snapshot
    session.snapshots.push({
      timestamp: new Date(),
      eyeTracking: analysis.metrics.eyeTracking,
      posture: analysis.metrics.posture,
      concentrationScore: analysis.concentrationScore
    });

    // Update analytics
    if (analysis.isDistracted) {
      session.analytics.totalDistractions += 1;
    }
    if (analysis.metrics.eyeTracking.looking_away) {
      session.analytics.eyeTrackingAlerts += 1;
    }
    if (analysis.metrics.posture.slouch) {
      session.analytics.postureAlerts += 1;
    }

    // Auto-pause if user left
    if (analysis.userLeft && session.status === 'active') {
      session.status = 'auto_paused';
      session.pauseLog.push({
        pausedAt: new Date(),
        reason: 'auto'
      });
      logger.info(`Session ${sessionId} auto-paused: user left`);
    }

    await session.save();

    return ApiResponse.success(res, {
      analysis,
      sessionStatus: session.status,
      latency: result.latency
    });
  }
}

module.exports = new VisionController();
