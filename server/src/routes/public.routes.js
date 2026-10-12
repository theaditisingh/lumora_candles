const router = require('express').Router();
const { body } = require('express-validator');
const prisma = require('../config/prisma');
const validate = require('../middleware/validate');
const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/response');
const { authenticateToken } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiters');

router.post('/newsletter', authLimiter, [body('email').trim().toLowerCase().isEmail().withMessage('Enter a valid email')], validate,
  asyncHandler(async (req, res) => {
    await prisma.newsletterSubscriber.upsert({ where: { email: req.body.email }, update: {}, create: { email: req.body.email } });
    success(res, {}, 'Thanks for subscribing', 201);
  }));

router.post('/contact', authLimiter, [
  body('name').trim().isLength({ min: 2, max: 80 }).withMessage('Enter your name'),
  body('email').trim().toLowerCase().isEmail().withMessage('Enter a valid email'),
  body('subject').optional({ checkFalsy: true }).trim().isLength({ max: 120 }),
  body('message').trim().isLength({ min: 10, max: 2000 }).withMessage('Message must be 10 to 2000 characters'),
], validate, asyncHandler(async (req, res) => {
  const { name, email, subject, message } = req.body;
  await prisma.contactMessage.create({ data: { name, email, subject: subject || null, message } });
  success(res, {}, 'Thanks for writing to us. We will reply within two working days.', 201);
}));

// Update own profile (name / phone)
router.put('/auth/me', authenticateToken, [
  body('name').trim().isLength({ min: 2, max: 80 }).withMessage('Enter your name'),
  body('phone').optional({ checkFalsy: true }).trim().matches(/^[0-9+\-\s]{10,15}$/).withMessage('Enter a valid phone number'),
], validate, asyncHandler(async (req, res) => {
  const u = await prisma.user.update({ where: { id: req.user.id }, data: { name: req.body.name, phone: req.body.phone || null } });
  success(res, { user: { id: u.id, name: u.name, email: u.email, phone: u.phone, role: u.role } }, 'Profile updated');
}));

module.exports = router;
