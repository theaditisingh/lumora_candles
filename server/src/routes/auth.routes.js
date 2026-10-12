const router = require('express').Router();
const c = require('../controllers/auth.controller');
const v = require('../validators/auth.validators');
const validate = require('../middleware/validate');
const { authenticateToken } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiters');

router.post('/register', authLimiter, v.registerRules, validate, c.register);
router.post('/login', authLimiter, v.loginRules, validate, c.login);
router.post('/logout', c.logout);
router.post('/forgot-password', authLimiter, v.forgotRules, validate, c.forgotPassword);
router.post('/reset-password', authLimiter, v.resetRules, validate, c.resetPassword);
router.get('/me', authenticateToken, c.me);

module.exports = router;
