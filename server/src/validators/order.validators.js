const { body } = require('express-validator');

exports.createOrder = [
  body('customer.name').trim().isLength({ min: 2, max: 80 }).withMessage('Enter your full name'),
  body('customer.email').trim().toLowerCase().isEmail().withMessage('Enter a valid email'),
  body('customer.phone').trim().matches(/^[0-9+\-\s]{10,15}$/).withMessage('Enter a valid phone number'),
  body('shipping.line1').trim().isLength({ min: 5, max: 200 }).withMessage('Enter your address'),
  body('shipping.line2').optional({ checkFalsy: true }).trim().isLength({ max: 200 }),
  body('shipping.city').trim().notEmpty().withMessage('Enter your city'),
  body('shipping.state').trim().notEmpty().withMessage('Enter your state'),
  body('shipping.pincode').trim().matches(/^[0-9A-Za-z\- ]{4,10}$/).withMessage('Enter a valid pincode'),
  body('shipping.country').trim().notEmpty().withMessage('Enter your country'),
  body('paymentMethod').isIn(['COD', 'RAZORPAY']).withMessage('Choose a valid payment method'),
];

exports.cancel = [body('reason').optional({ checkFalsy: true }).trim().isLength({ max: 300 })];
