const router = require('express').Router();
const c = require('../controllers/payment.controller');
const v = require('../validators/payment.validators');
const validate = require('../middleware/validate');
const { authenticateToken } = require('../middleware/auth');

router.get('/config', c.config);
router.post('/webhook', c.webhook); // public, protected by signature check
router.post('/create-order', authenticateToken, v.createOrder, validate, c.createOrder);
router.post('/verify', authenticateToken, v.verify, validate, c.verify);
router.post('/failed', authenticateToken, v.failed, validate, c.failed);

module.exports = router;
