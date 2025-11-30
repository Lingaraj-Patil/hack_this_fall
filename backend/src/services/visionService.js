const axios = require('axios');
const logger = require('../utils/logger');
const { VISION_THRESHOLDS } = require('../config/constants');

class VisionService {
  constructor() {
    this.apiUrl = process.env.VISION_API_URL;
    this.timeout = parseInt(process.env.VISION_API_TIMEOUT) || 5000;
    this.retryAttempts = parseInt(process.env.VISION_API_RETRY_ATTEMPTS) || 3;
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

    // Calculate concentration score (0-1)
    const concentrationScore = this._calculateConcentrationScore(
      eye_tracking,
      posture
    );

    // Detect distractions
    const isDistracted = 
      eye_tracking.looking_away || 
      posture.slouch || 
      concentrationScore < VISION_THRESHOLDS.LOW_CONCENTRATION;

    // Detect if user left
    const userLeft = 
      posture.visibility_score < 0.5 ||
      (eye_tracking.looking_away && eye_tracking.duration > VISION_THRESHOLDS.AUTO_PAUSE_DELAY);

    return {
      concentrationScore,
      isDistracted,
      userLeft,
      shouldAlert: alert?.triggered || false,
      metrics: {
        eyeTracking: eye_tracking,
        posture: posture
      }
    };
  }

  _calculateConcentrationScore(eyeTracking, posture) {
    let score = 1.0;

    // Eye tracking penalties
    if (eyeTracking.looking_away) {
      score -= 0.3;
    }
    score -= eyeTracking.confidence * 0.1;

    // Posture penalties
    if (posture.slouch) {
      score -= 0.2;
    }
    score -= (1 - posture.interest_score) * 0.3;

    // Visibility factor
    score *= posture.visibility_score;

    return Math.max(0, Math.min(1, score));
  }

  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = new VisionService();
