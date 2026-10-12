const router = require('express').Router();
const { body } = require('express-validator');
const c = require('../controllers/admin.controller');
const validate = require('../middleware/validate');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

router.use(authenticateToken, authorizeRole('ADMIN')); // every /api/admin route is admin-only

const STATUSES = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'REFUNDED'];
const couponRules = (create) => {
  const r = (ch) => (create ? ch : ch.optional());
  return [
    r(body('code').trim().isLength({ min: 3, max: 30 }).matches(/^[A-Za-z0-9_-]+$/)).withMessage('Code must be 3 to 30 letters or numbers'),
    r(body('discountType').isIn(['PERCENTAGE', 'FIXED'])).withMessage('Choose a discount type'),
    r(body('discountValue').isFloat({ gt: 0 })).withMessage('Discount must be greater than 0'),
    body('minOrderAmount').optional({ checkFalsy: true }).isFloat({ min: 0 }),
    body('maxDiscount').optional({ checkFalsy: true }).isFloat({ gt: 0 }),
    body('usageLimit').optional({ checkFalsy: true }).isInt({ min: 1 }),
    body('perUserLimit').optional({ checkFalsy: true }).isInt({ min: 1 }),
    body('expiresAt').optional({ checkFalsy: true }).isISO8601().withMessage('Enter a valid expiry date'),
    body('isActive').optional().isBoolean(),
  ];
};

router.get('/dashboard', c.dashboard);
router.get('/sales', c.sales);

router.get('/orders', c.orders);
router.get('/orders/:id', c.order);
router.put('/orders/:id', [body('status').optional().isIn(STATUSES).withMessage('Invalid status'), body('trackingNumber').optional({ nullable: true }).isString().isLength({ max: 80 }), body('reason').optional().isString().isLength({ max: 300 })], validate, c.updateOrder);

router.get('/customers', c.customers);
router.put('/customers/:id/status', [body('isActive').isBoolean().withMessage('isActive must be true or false')], validate, c.setCustomerStatus);

router.get('/coupons', c.coupons);
router.post('/coupons', couponRules(true), validate, c.createCoupon);
router.put('/coupons/:id', couponRules(false), validate, c.updateCoupon);
router.delete('/coupons/:id', c.deleteCoupon);

router.get('/inventory', c.inventory);
router.put('/inventory/:id', [body('stockQuantity').isInt({ min: 0 }).withMessage('Stock must be 0 or more'), body('lowStockAlert').optional().isInt({ min: 0 })], validate, c.setStock);

router.get('/settings', c.getSettings);
router.put('/settings', [body('storeName').optional().isLength({ max: 80 }), body('supportEmail').optional({ checkFalsy: true }).isEmail(), body('supportPhone').optional().isLength({ max: 20 }), body('announcement').optional().isLength({ max: 200 })], validate, c.putSettings);

module.exports = router;
