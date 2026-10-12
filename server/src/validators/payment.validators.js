const { body } = require('express-validator');

exports.createOrder = [body('orderId').isString().notEmpty().withMessage('Order is required')];
exports.verify = [
  body('orderId').isString().notEmpty(),
  body('razorpay_order_id').isString().notEmpty(),
  body('razorpay_payment_id').isString().notEmpty(),
  body('razorpay_signature').isString().notEmpty(),
];
exports.failed = [body('orderId').isString().notEmpty(), body('reason').optional({ checkFalsy: true }).trim().isLength({ max: 300 })];
