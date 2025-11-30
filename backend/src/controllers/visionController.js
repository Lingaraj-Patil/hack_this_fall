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
      eyeTracking: analysis.metrics?.eyeTracking || {},
      posture: analysis.metrics?.posture || {},
      concentrationScore: analysis.concentrationScore || 0
    });

    // Update analytics
    if (analysis.isDistracted) {
      session.analytics.totalDistractions += 1;
    }
    if (analysis.metrics?.eyeTracking?.looking_away) {
      session.analytics.eyeTrackingAlerts += 1;
    }
    if (analysis.metrics?.posture?.slouch) {
      session.analytics.postureAlerts += 1;
    }

    // Auto-pause if user left — debounce + sliding-window smoothing to avoid false positives
    // User requirement: 12-15 seconds when user not in frame
    const AUTO_PAUSE_DELAY = parseInt(process.env.VISION_AUTO_PAUSE_DELAY) || 12; // seconds - user requirement (12-15s)
    const VISIBILITY_THRESHOLD = parseFloat(process.env.VISION_VISIBILITY_THRESHOLD) || 0.3; // visibility_score threshold (lowered for better detection)
    const VISIBILITY_FRACTION = parseFloat(process.env.VISION_VISIBILITY_FRACTION) || 0.3; // fraction below which we consider user absent (more strict)
    const DISTRACTION_PAUSE_DELAY = parseInt(process.env.VISION_DISTRACTION_PAUSE_DELAY) || 5; // seconds of continuous distraction before pause
    const NO_FRAME_TIMEOUT = parseInt(process.env.VISION_NO_FRAME_TIMEOUT) || 12; // seconds without frames = user away

    if (!session.metadata) session.metadata = {};

    const now = Date.now();

    // Track distraction window for auto-pause on distraction
    if (!session.metadata.distractionWindow) {
      session.metadata.distractionWindow = [];
    }
    
    const isDistracted = analysis.isDistracted || 
                        analysis.metrics?.eyeTracking?.looking_away || 
                        (analysis.concentrationScore < 0.3);
    
    session.metadata.distractionWindow.push({ ts: now, distracted: isDistracted });
    const distractionWindowStart = now - DISTRACTION_PAUSE_DELAY * 1000;
    session.metadata.distractionWindow = session.metadata.distractionWindow.filter(d => d.ts >= distractionWindowStart);
    
    const distractionCount = session.metadata.distractionWindow.reduce((s, d) => s + (d.distracted ? 1 : 0), 0);
    const distractionFraction = distractionCount / (session.metadata.distractionWindow.length || 1);
    
    // Auto-pause if user is continuously distracted
    if (distractionFraction > 0.8 && session.status === 'active') {
      if (!session.metadata.distractedSince) {
        session.metadata.distractedSince = new Date();
      } else {
        const distractedSince = new Date(session.metadata.distractedSince);
        const secondsDistracted = (Date.now() - distractedSince.getTime()) / 1000;
        if (secondsDistracted >= DISTRACTION_PAUSE_DELAY) {
          session.status = 'auto_paused';
          session.pauseLog.push({ pausedAt: new Date(), reason: 'distraction' });
          logger.info(`Session ${sessionId} auto-paused due to distraction (${Math.floor(secondsDistracted)}s)`);
          delete session.metadata.distractedSince;
          session.metadata.distractionWindow = [];
          
          if (global.io) {
            global.io.to(`user:${session.userId.toString()}`).emit('session:paused', {
              sessionId: session._id.toString(),
              reason: 'distraction',
              sessionStatus: 'auto_paused'
            });
          }
        }
      }
    } else if (distractionFraction < 0.5) {
      // User is focused again
      if (session.metadata.distractedSince) {
        delete session.metadata.distractedSince;
      }
    }

    // maintain a sliding window of recent visibility measurements
    if (!Array.isArray(session.metadata.visibilityWindow)) {
      session.metadata.visibilityWindow = [];
    }
    // Get visibility score - if 0 or very low, user is not in frame
    const visibilityScore = analysis.metrics?.posture?.visibility_score || 0;
    // User is visible if visibility_score > threshold (0.3 means user is somewhat visible)
    // If visibility_score is 0, user is definitely not in frame
    const visible = visibilityScore > VISIBILITY_THRESHOLD;

    // push current measurement
    session.metadata.visibilityWindow.push({ ts: now, visible });

    // trim old entries older than AUTO_PAUSE_DELAY seconds
    const windowStart = now - AUTO_PAUSE_DELAY * 1000;
    session.metadata.visibilityWindow = session.metadata.visibilityWindow.filter(v => v.ts >= windowStart);

    const totalSamples = session.metadata.visibilityWindow.length || 1;
    const visibleCount = session.metadata.visibilityWindow.reduce((s, v) => s + (v.visible ? 1 : 0), 0);
    const visibleFraction = visibleCount / totalSamples;

    // User is absent if less than 30% of recent samples show user as visible
    const userAbsenceCandidate = visibleFraction < VISIBILITY_FRACTION;
    
    // Log for debugging
    if (totalSamples > 0 && visibleFraction < 0.5) {
      logger.debug(`Session ${sessionId} - Visibility: ${(visibleFraction * 100).toFixed(1)}% (${visibleCount}/${totalSamples}), score: ${visibilityScore.toFixed(2)}`);
    }

    if (userAbsenceCandidate) {
      // mark when absence first detected
      if (!session.metadata.missingSince) {
        session.metadata.missingSince = new Date();
        logger.info(`User absence detected for session ${sessionId} - visibility: ${visibilityScore.toFixed(2)}, starting ${AUTO_PAUSE_DELAY}s timer`);
      } else {
        const missingSince = new Date(session.metadata.missingSince);
        const secondsMissing = (Date.now() - missingSince.getTime()) / 1000;
        
        // Auto-pause after AUTO_PAUSE_DELAY seconds (12-15s as per user requirement)
        if (secondsMissing >= AUTO_PAUSE_DELAY && session.status === 'active') {
          session.status = 'auto_paused';
          session.pauseLog.push({ pausedAt: new Date(), reason: 'auto' });
          logger.info(`⏸️ Session ${sessionId} auto-paused after ${Math.floor(secondsMissing)}s - user not in frame (visibility: ${visibilityScore.toFixed(2)}, fraction: ${(visibleFraction * 100).toFixed(1)}%)`);
          
          // clear missingSince so we don't repeatedly push pause logs
          delete session.metadata.missingSince;
          // also clear visibility window
          session.metadata.visibilityWindow = [];
          
          // Emit socket event for real-time update
          if (global.io) {
            global.io.to(`user:${session.userId.toString()}`).emit('session:paused', {
              sessionId: session._id.toString(),
              reason: 'auto',
              sessionStatus: 'auto_paused',
              visibilityScore: visibilityScore,
              secondsMissing: Math.floor(secondsMissing)
            });
          }
        } else if (secondsMissing >= AUTO_PAUSE_DELAY - 3) {
          // Log warning 3 seconds before auto-pause
          logger.warn(`⚠️ Session ${sessionId} will auto-pause in ${Math.ceil(AUTO_PAUSE_DELAY - secondsMissing)}s if user doesn't return (visibility: ${visibilityScore.toFixed(2)})`);
        }
      }
    } else {
      // user visible again — clear missing marker
      if (session.metadata.missingSince) {
        const wasMissing = (Date.now() - new Date(session.metadata.missingSince).getTime()) / 1000;
        logger.info(`✅ User visible again for session ${sessionId} after ${Math.floor(wasMissing)}s (visibility: ${visibilityScore.toFixed(2)})`);
        delete session.metadata.missingSince;
      }
    }

    // Track last frame timestamp for timeout detection
    session.metadata.lastFrameTime = now;
    
    await session.save();

    return ApiResponse.success(res, {
      analysis,
      sessionStatus: session.status,
      latency: result.latency
    });
  }

  // Background job to check for sessions with no frames (user switched tabs/minimized)
  async checkStaleSessions() {
    const NO_FRAME_TIMEOUT = parseInt(process.env.VISION_NO_FRAME_TIMEOUT) || 12; // seconds
    const now = Date.now();
    
    try {
      const staleSessions = await Session.find({
        status: 'active',
        'metadata.lastFrameTime': { 
          $exists: true,
          $lt: new Date(now - NO_FRAME_TIMEOUT * 1000)
        }
      });

      for (const session of staleSessions) {
        const lastFrameTime = new Date(session.metadata.lastFrameTime).getTime();
        const secondsSinceLastFrame = (now - lastFrameTime) / 1000;
        
        if (secondsSinceLastFrame >= NO_FRAME_TIMEOUT) {
          session.status = 'auto_paused';
          session.pauseLog.push({ pausedAt: new Date(), reason: 'no_frames' });
          logger.info(`Session ${session._id} auto-paused - no frames for ${Math.floor(secondsSinceLastFrame)}s`);
          
          // Clear metadata
          delete session.metadata.lastFrameTime;
          if (session.metadata.visibilityWindow) {
            session.metadata.visibilityWindow = [];
          }
          
          await session.save();
          
          // Emit socket event
          if (global.io) {
            global.io.to(`user:${session.userId.toString()}`).emit('session:paused', {
              sessionId: session._id.toString(),
              reason: 'no_frames',
              sessionStatus: 'auto_paused'
            });
          }
        }
      }
    } catch (error) {
      logger.error('Error checking stale sessions:', error);
    }
  }
}

module.exports = new VisionController();
