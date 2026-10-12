const router = require('express').Router();
const c = require('../controllers/order.controller');
const v = require('../validators/order.validators');
const validate = require('../middleware/validate');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);
router.post('/', v.createOrder, validate, c.create);
router.get('/', c.list);
router.get('/:id', c.getOne);
router.get('/:id/tracking', c.track);
router.put('/:id/cancel', v.cancel, validate, c.cancel);
router.post('/:id/refund-request', c.requestRefund);

module.exports = router;
