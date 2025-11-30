const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/sessionController');
const { auth } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');

router.post('/', auth, validate(schemas.createSession), sessionController.startSession.bind(sessionController));
router.post('/:sessionId/pause', auth, sessionController.pauseSession.bind(sessionController));
router.post('/:sessionId/resume', auth, sessionController.resumeSession.bind(sessionController));
router.post('/:sessionId/end', auth, sessionController.endSession.bind(sessionController));
router.get('/active', auth, sessionController.getActiveSession.bind(sessionController));
router.get('/history', auth, sessionController.getSessionHistory.bind(sessionController));
router.get('/stats', auth, sessionController.getSessionStats.bind(sessionController));
router.get('/:sessionId', auth, sessionController.getSessionById.bind(sessionController));
router.delete('/:sessionId', auth, sessionController.deleteSession.bind(sessionController));

module.exports = router;
