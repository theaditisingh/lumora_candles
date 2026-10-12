const router = require('express').Router();

router.get('/health', (req, res) =>
  res.json({ success: true, message: 'Lumora Candles API is healthy', data: { time: new Date().toISOString() } })
);

router.use('/auth', require('./auth.routes'));
router.use('/products', require('./product.routes'));
router.use('/categories', require('./category.routes'));
router.use('/orders', require('./order.routes'));
router.use('/admin', require('./admin.routes'));
router.use('/payments', require('./payment.routes'));
router.use('/', require('./public.routes')); // newsletter, contact, profile
router.use('/', require('./shop.routes')); // cart, coupons, wishlist, reviews

// Mounted in later parts:

module.exports = router;
