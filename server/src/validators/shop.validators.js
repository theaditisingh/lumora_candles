const { body } = require('express-validator');

const qty = (f = 'quantity') => body(f).isInt({ min: 1, max: 20 }).withMessage('Quantity must be between 1 and 20').toInt();

exports.addToCart = [body('productId').isString().notEmpty().withMessage('Product is required'), body('quantity').optional().isInt({ min: 1, max: 20 }).withMessage('Quantity must be between 1 and 20').toInt()];
exports.updateCart = [qty()];
exports.mergeCart = [
  body('items').isArray({ max: 50 }).withMessage('Invalid cart'),
  body('items.*.productId').isString().notEmpty(),
  body('items.*.quantity').isInt({ min: 1, max: 20 }).toInt(),
];
exports.couponCode = [body('code').trim().notEmpty().withMessage('Enter a coupon code').isLength({ max: 40 })];
exports.wishlistAdd = [body('productId').isString().notEmpty().withMessage('Product is required')];
exports.review = [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be 1 to 5').toInt(),
  body('title').optional({ checkFalsy: true }).trim().isLength({ max: 100 }),
  body('comment').trim().isLength({ min: 5, max: 1500 }).withMessage('Review must be 5 to 1500 characters'),
];
