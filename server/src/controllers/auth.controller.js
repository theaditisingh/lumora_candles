const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');
const { jwt: jwtCfg, isProd, clientUrl } = require('../config/env');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/response');

const publicUser = (u) => ({ id: u.id, name: u.name, email: u.email, phone: u.phone, role: u.role });
const sha256 = (v) => crypto.createHash('sha256').update(v).digest('hex');

const issueToken = (res, user) => {
  const token = jwt.sign({ sub: user.id, role: user.role }, jwtCfg.secret, { expiresIn: jwtCfg.expiresIn });
  res.cookie('token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProd,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  return token;
};

exports.register = asyncHandler(async (req, res) => {
  const { name, email, phone, password } = req.body;
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) throw new ApiError(409, 'An account with this email already exists');

  const user = await prisma.user.create({
    data: { name, email, phone: phone || null, passwordHash: await bcrypt.hash(password, 12) },
  });
  const token = issueToken(res, user);
  success(res, { user: publicUser(user), token }, 'Account created successfully', 201);
});

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  // Same message for unknown email and wrong password (no account enumeration)
  const ok = user && (await bcrypt.compare(password, user.passwordHash));
  if (!ok) throw new ApiError(401, 'Invalid email or password');
  if (!user.isActive) throw new ApiError(403, 'This account has been disabled. Please contact support.');

  const token = issueToken(res, user);
  success(res, { user: publicUser(user), token }, 'Logged in successfully');
});

exports.logout = asyncHandler(async (req, res) => {
  res.clearCookie('token', { httpOnly: true, sameSite: 'lax', secure: isProd });
  success(res, {}, 'Logged out successfully');
});

exports.me = asyncHandler(async (req, res) => {
  success(res, { user: publicUser(req.user) });
});

exports.forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  const data = {};

  if (user && user.isActive) {
    const rawToken = crypto.randomBytes(32).toString('hex');
    await prisma.user.update({
      where: { id: user.id },
      data: { resetTokenHash: sha256(rawToken), resetTokenExpires: new Date(Date.now() + 60 * 60 * 1000) },
    });
    const link = `${clientUrl.split(',')[0]}/reset-password?token=${rawToken}`;
    // No email provider is configured yet. In development the link is printed and returned.
    // Production must send it by email (e.g. SMTP) and never return it.
    if (!isProd) {
      console.log(`\n[DEV] Password reset link for ${email}:\n${link}\n`);
      data.devResetLink = link;
    }
  }
  // Always the same response so attackers cannot discover which emails are registered
  success(res, data, 'If an account exists for this email, a reset link has been sent');
});

exports.resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  const user = await prisma.user.findFirst({
    where: { resetTokenHash: sha256(token), resetTokenExpires: { gt: new Date() } },
  });
  if (!user) throw new ApiError(400, 'This reset link is invalid or has expired');

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await bcrypt.hash(password, 12), resetTokenHash: null, resetTokenExpires: null },
  });
  success(res, {}, 'Password updated. You can now log in.');
});
