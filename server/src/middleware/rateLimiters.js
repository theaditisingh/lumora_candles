const rateLimit = require('express-rate-limit');

const make = (windowMs, max, message) =>
  rateLimit({ windowMs, max, standardHeaders: true, legacyHeaders: false, message: { success: false, message } });

module.exports = {
  apiLimiter: make(15 * 60 * 1000, 600, 'Too many requests. Please try again later.'),
  authLimiter: make(15 * 60 * 1000, 20, 'Too many attempts. Please try again in 15 minutes.'),
};
