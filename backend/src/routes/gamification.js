const express = require('express');
const router = express.Router();
const gamificationController = require('../controllers/gamificationController');
const { auth } = require('../middleware/auth');

router.get('/leaderboard', auth, gamificationController.getLeaderboard);
router.get('/rank', auth, gamificationController.getUserRank);
router.get('/hearts', auth, gamificationController.getHearts);
router.get('/stats', auth, gamificationController.getUserStats);
router.get('/achievements', auth, gamificationController.getAchievements);

module.exports = router;
