const express = require('express');
const router = express.Router();
const clanController = require('../controllers/clanController');
const { auth } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');

router.post('/', auth, validate(schemas.createClan), clanController.createClan);
router.post('/join', auth, clanController.joinClan);
router.post('/leave', auth, clanController.leaveClan);
router.post('/transfer-leadership', auth, clanController.transferLeadership);
router.put('/', auth, clanController.updateClan);
router.delete('/members/:memberId', auth, clanController.kickMember);
router.get('/my-clan', auth, clanController.getMyClan);
router.get('/search', clanController.searchClans);
router.get('/leaderboard', clanController.getClanLeaderboard);
router.get('/:clanId', clanController.getClanDetails);

module.exports = router;