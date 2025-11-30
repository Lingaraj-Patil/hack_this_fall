const express = require('express');
const router = express.Router();
const clanController = require('../controllers/clanController');
const { auth } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');

router.post('/', auth, validate(schemas.createClan), clanController.createClan.bind(clanController));
router.post('/join', auth, clanController.joinClan.bind(clanController));
router.post('/leave', auth, clanController.leaveClan.bind(clanController));
router.post('/transfer-leadership', auth, clanController.transferLeadership.bind(clanController));
router.put('/', auth, clanController.updateClan.bind(clanController));
router.delete('/members/:memberId', auth, clanController.kickMember.bind(clanController));
router.get('/my-clan', auth, clanController.getMyClan.bind(clanController));
router.get('/search', clanController.searchClans.bind(clanController));
router.get('/leaderboard', clanController.getClanLeaderboard.bind(clanController));
router.get('/:clanId', clanController.getClanDetails.bind(clanController));

module.exports = router;