const axios = require('axios');
const logger = require('../utils/logger');
const { VISION_THRESHOLDS } = require('../config/constants');

class VisionService {
  constructor() {
    // Default to the deployed ML API URL
    this.apiUrl = process.env.VISION_API_URL || 'https://posture-analyzer.onrender.com';
    // Decrease timeout and retries for faster failure and to avoid long blocking requests
    this.timeout = parseInt(process.env.VISION_API_TIMEOUT) || 7000; // ms
    this.retryAttempts = parseInt(process.env.VISION_API_RETRY_ATTEMPTS) || 1;
  }

  async analyzeFrame(base64Image, attempt = 1) {
    try {
      const startTime = Date.now();

      const response = await axios.post(
        `${this.apiUrl}/api/analyze`,
        { image: base64Image },
        { 
          timeout: this.timeout,
          headers: { 'Content-Type': 'application/json' }
        }
      );

      const latency = Date.now() - startTime;
      
      logger.debug('Vision API response', { 
        latency, 
        status: response.status 
      });

      // Add latency warning
      if (latency > 3000) {
        logger.warn(`High vision API latency: ${latency}ms`);
      }

      return {
        success: true,
        data: response.data,
        latency
      };

    } catch (error) {
      logger.error(`Vision API error (attempt ${attempt}):`, error.message);

      // Retry logic with exponential backoff
      if (attempt < this.retryAttempts) {
        const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
        await this._sleep(delay);
        return this.analyzeFrame(base64Image, attempt + 1);
      }

      return {
        success: false,
        error: error.message,
        latency: null
      };
    }
  }

  processAnalysisResult(visionData) {
    const { eye_tracking, posture, alert } = visionData;

    // CRITICAL: If posture is null/undefined, user is NOT in frame
    // The ML model returns null for posture when no pose landmarks detected
    const userInFrame = posture !== null && posture !== undefined;
    
    // If user not in frame, set visibility_score to 0
    const visibilityScore = userInFrame ? (posture.visibility_score || 0) : 0;

    // Calculate concentration score (0-1) - only if user is in frame
    const concentrationScore = userInFrame 
      ? this._calculateConcentrationScore(eye_tracking, posture)
      : 0;

    // Detect distractions - only if user is in frame
    const isDistracted = userInFrame && (
      eye_tracking?.looking_away || 
      posture.slouch || 
      concentrationScore < VISION_THRESHOLDS.LOW_CONCENTRATION
    );

    // Detect if user left - user is not in frame OR visibility is very low
    const userLeft = !userInFrame || visibilityScore < 0.3;

    return {
      concentrationScore,
      isDistracted,
      userLeft,
      shouldAlert: alert?.triggered || false,
      metrics: {
        eyeTracking: eye_tracking || null,
        posture: userInFrame ? {
          ...posture,
          visibility_score: visibilityScore
        } : {
          visibility_score: 0,
          interest_score: 0,
          interest_level: 'none',
          spine_angle: 0,
          slouch: false
        }
      }
    };
  }

  _calculateConcentrationScore(eyeTracking, posture) {
    // If posture is null/undefined, user is not in frame - return 0
    if (!posture || !eyeTracking) {
      return 0;
    }

    let score = 1.0;

    // Eye tracking penalties
    if (eyeTracking.looking_away) {
      score -= 0.3;
    }
    if (eyeTracking.confidence !== undefined) {
      score -= eyeTracking.confidence * 0.1;
    }

    // Posture penalties
    if (posture.slouch) {
      score -= 0.2;
    }
    if (posture.interest_score !== undefined) {
      score -= (1 - posture.interest_score) * 0.3;
    }

    // Visibility factor - if visibility is 0, user is not in frame
    if (posture.visibility_score !== undefined) {
      score *= posture.visibility_score;
    } else {
      score = 0; // No visibility score = not in frame
    }

    return Math.max(0, Math.min(1, score));
  }

  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = new VisionService();
