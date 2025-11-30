const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { auth } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');
const { authLimiter } = require('../middleware/rateLimit');

router.post('/register', authLimiter, validate(schemas.register), authController.register.bind(authController));
router.post('/login', authLimiter, validate(schemas.login), authController.login.bind(authController));
router.post('/refresh', authController.refreshToken.bind(authController));
router.post('/logout', auth, authController.logout.bind(authController));
router.get('/profile', auth, authController.getProfile.bind(authController));
router.put('/profile', auth, authController.updateProfile.bind(authController));

module.exports = router;
