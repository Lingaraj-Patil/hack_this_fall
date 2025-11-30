const express = require('express');
const router = express.Router();
const visionController = require('../controllers/visionController');
const { auth } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');
const { visionApiLimiter } = require('../middleware/rateLimit');

router.post(
  '/analyze',
  auth,
  visionApiLimiter,
  validate(schemas.visionAnalyze),
  visionController.analyzeFrame.bind(visionController)
);

module.exports = router;