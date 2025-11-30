const express = require('express');
const router = express.Router();
const gamificationController = require('../controllers/gamificationController');
const { auth } = require('../middleware/auth');

router.get('/leaderboard', auth, gamificationController.getLeaderboard.bind(gamificationController));
router.get('/rank', auth, gamificationController.getUserRank.bind(gamificationController));
router.get('/hearts', auth, gamificationController.getHearts.bind(gamificationController));
router.get('/stats', auth, gamificationController.getUserStats.bind(gamificationController));
router.get('/achievements', auth, gamificationController.getAchievements.bind(gamificationController));

module.exports = router;
