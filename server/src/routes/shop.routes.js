const router = require('express').Router();
const cart = require('../controllers/cart.controller');
const wish = require('../controllers/wishlist.controller');
const rev = require('../controllers/review.controller');
const v = require('../validators/shop.validators');
const validate = require('../middleware/validate');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

const auth = authenticateToken;
const admin = [authenticateToken, authorizeRole('ADMIN')];

// Cart
router.get('/cart', auth, cart.get);
router.post('/cart', auth, v.addToCart, validate, cart.add);
router.post('/cart/merge', auth, v.mergeCart, validate, cart.merge);
router.post('/cart/coupon', auth, v.couponCode, validate, cart.applyCoupon);
router.delete('/cart/coupon', auth, cart.removeCoupon);
router.delete('/cart', auth, cart.clear);
router.put('/cart/:itemId', auth, v.updateCart, validate, cart.updateItem);
router.delete('/cart/:itemId', auth, cart.removeItem);

// Coupons
router.post('/coupons/validate', auth, v.couponCode, validate, cart.validateOnly);

// Wishlist
router.get('/wishlist', auth, wish.get);
router.post('/wishlist', auth, v.wishlistAdd, validate, wish.add);
router.delete('/wishlist/:productId', auth, wish.remove);

// Reviews
router.get('/products/:id/reviews', rev.listForProduct);
router.post('/products/:id/reviews', auth, v.review, validate, rev.create);
router.get('/admin/reviews', ...admin, rev.adminList);
router.put('/admin/reviews/:id/approve', ...admin, rev.approve);
router.delete('/admin/reviews/:id', ...admin, rev.remove);

module.exports = router;
