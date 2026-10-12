const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');

// Validates a coupon for a user and subtotal (rupees). Returns { coupon, discount } or throws ApiError(400).
const validateCoupon = async (rawCode, userId, subtotal) => {
  const code = String(rawCode || '').trim().toUpperCase();
  const coupon = code && (await prisma.coupon.findUnique({ where: { code } }));
  if (!coupon || !coupon.isActive) throw new ApiError(400, 'This coupon code is not valid');
  if (coupon.expiresAt && coupon.expiresAt < new Date()) throw new ApiError(400, 'This coupon has expired');
  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) throw new ApiError(400, 'This coupon has reached its usage limit');
  if (subtotal < Number(coupon.minOrderAmount)) {
    throw new ApiError(400, `Add items worth Rs ${Number(coupon.minOrderAmount) - subtotal} more to use this coupon`);
  }
  if (coupon.perUserLimit !== null) {
    const used = await prisma.couponUsage.count({ where: { couponId: coupon.id, userId } });
    if (used >= coupon.perUserLimit) throw new ApiError(400, 'You have already used this coupon');
  }
  let discount = coupon.discountType === 'PERCENTAGE' ? (subtotal * Number(coupon.discountValue)) / 100 : Number(coupon.discountValue);
  if (coupon.maxDiscount !== null) discount = Math.min(discount, Number(coupon.maxDiscount));
  discount = Math.min(Math.round(discount * 100) / 100, subtotal);
  return { coupon, discount };
};

module.exports = { validateCoupon };
