const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');
const { jwt: jwtCfg } = require('../config/env');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const extractToken = (req) => {
  const h = req.headers.authorization;
  if (h && h.startsWith('Bearer ')) return h.slice(7);
  return req.cookies?.token || null;
};

const loadUser = async (token) => {
  const payload = jwt.verify(token, jwtCfg.secret);
  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, name: true, email: true, phone: true, role: true, isActive: true },
  });
  if (!user || !user.isActive) throw new ApiError(401, 'Account not found or disabled');
  return user;
};

const authenticateToken = asyncHandler(async (req, res, next) => {
  const token = extractToken(req);
  if (!token) throw new ApiError(401, 'Authentication required');
  req.user = await loadUser(token);
  next();
});

// Attaches req.user when a valid token exists; otherwise continues as guest
const optionalAuth = asyncHandler(async (req, res, next) => {
  const token = extractToken(req);
  if (token) {
    try { req.user = await loadUser(token); } catch (_) { /* guest */ }
  }
  next();
});

const authorizeRole = (...roles) => (req, res, next) => {
  if (!req.user) return next(new ApiError(401, 'Authentication required'));
  if (!roles.includes(req.user.role)) {
    return next(new ApiError(403, 'You do not have permission to perform this action'));
  }
  next();
};

module.exports = { authenticateToken, optionalAuth, authorizeRole };
