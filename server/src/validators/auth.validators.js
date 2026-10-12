const { body } = require('express-validator');

const email = body('email').trim().toLowerCase().isEmail().withMessage('Enter a valid email address');
const password = body('password')
  .isLength({ min: 8, max: 72 }).withMessage('Password must be 8 to 72 characters')
  .matches(/[A-Za-z]/).withMessage('Password must contain a letter')
  .matches(/\d/).withMessage('Password must contain a number');

exports.registerRules = [
  body('name').trim().isLength({ min: 2, max: 80 }).withMessage('Name must be 2 to 80 characters'),
  email,
  body('phone').optional({ checkFalsy: true }).trim().matches(/^[0-9+\-\s]{10,15}$/).withMessage('Enter a valid phone number'),
  password,
];

exports.loginRules = [
  email,
  body('password').notEmpty().withMessage('Password is required'),
];

exports.forgotRules = [email];

exports.resetRules = [
  body('token').isString().isLength({ min: 32 }).withMessage('Invalid reset token'),
  password,
];
