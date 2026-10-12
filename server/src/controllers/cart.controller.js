const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/response');
const { product: ser } = require('../utils/serialize');
const { computeTotals, effective } = require('../services/pricing.service');
const { validateCoupon } = require('../services/coupon.service');

const include = {
  items: { orderBy: { createdAt: 'asc' }, include: { product: { include: { images: { orderBy: { sortOrder: 'asc' }, take: 1 } } } } },
};
const getCart = (userId) => prisma.cart.upsert({ where: { userId }, update: {}, create: { userId }, include });

const buildView = async (cart, userId) => {
  const live = cart.items.filter((i) => i.product.isActive);
  const lines = live.map((i) => ({
    id: i.id, productId: i.productId, quantity: i.quantity, product: ser(i.product),
    lineTotal: Number(effective(i.product)) * i.quantity,
    available: i.product.stockQuantity >= i.quantity,
  }));
  let discount = 0;
  let coupon = null;
  let couponError = null;
  if (cart.couponCode) {
    const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
    try {
      const r = await validateCoupon(cart.couponCode, userId, subtotal);
      discount = r.discount;
      coupon = { code: r.coupon.code, description: r.coupon.description };
    } catch (e) {
      couponError = e.message; // coupon no longer applies (e.g. subtotal dropped); keep it stored but not applied
    }
  }
  const totals = computeTotals(live.map((i) => ({ product: i.product, quantity: i.quantity })), discount);
  return { items: lines, itemCount: lines.reduce((s, l) => s + l.quantity, 0), coupon, couponError, totals,
    hasUnavailable: lines.some((l) => !l.available) };
};
const respond = async (res, userId, message = 'Cart updated', status = 200) =>
  success(res, await buildView(await getCart(userId), userId), message, status);

const checkProduct = async (productId, qty) => {
  const p = await prisma.product.findUnique({ where: { id: productId } });
  if (!p || !p.isActive) throw new ApiError(404, 'Product not found');
  if (qty > p.stockQuantity) {
    throw new ApiError(409, p.stockQuantity === 0 ? `${p.name} is out of stock` : `Only ${p.stockQuantity} of ${p.name} left in stock`);
  }
  return p;
};

exports.get = asyncHandler(async (req, res) => respond(res, req.user.id, 'Cart fetched'));

exports.add = asyncHandler(async (req, res) => {
  const { productId, quantity = 1 } = req.body;
  const cart = await getCart(req.user.id);
  const existing = cart.items.find((i) => i.productId === productId);
  await checkProduct(productId, (existing?.quantity || 0) + quantity);
  await prisma.cartItem.upsert({
    where: { cartId_productId: { cartId: cart.id, productId } },
    update: { quantity: { increment: quantity } },
    create: { cartId: cart.id, productId, quantity },
  });
  await respond(res, req.user.id, 'Added to cart', 201);
});

exports.updateItem = asyncHandler(async (req, res) => {
  const cart = await getCart(req.user.id);
  const item = cart.items.find((i) => i.id === req.params.itemId);
  if (!item) throw new ApiError(404, 'Cart item not found');
  await checkProduct(item.productId, req.body.quantity);
  await prisma.cartItem.update({ where: { id: item.id }, data: { quantity: req.body.quantity } });
  await respond(res, req.user.id);
});

exports.removeItem = asyncHandler(async (req, res) => {
  const cart = await getCart(req.user.id);
  const item = cart.items.find((i) => i.id === req.params.itemId);
  if (!item) throw new ApiError(404, 'Cart item not found');
  await prisma.cartItem.delete({ where: { id: item.id } });
  await respond(res, req.user.id, 'Item removed');
});

exports.clear = asyncHandler(async (req, res) => {
  const cart = await getCart(req.user.id);
  await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  await prisma.cart.update({ where: { id: cart.id }, data: { couponCode: null } });
  await respond(res, req.user.id, 'Cart cleared');
});

// Merge a guest (localStorage) cart after login. Quantities are capped to available stock.
exports.merge = asyncHandler(async (req, res) => {
  const cart = await getCart(req.user.id);
  for (const { productId, quantity } of req.body.items) {
    const p = await prisma.product.findUnique({ where: { id: productId } });
    if (!p || !p.isActive || p.stockQuantity === 0) continue;
    const have = cart.items.find((i) => i.productId === productId)?.quantity || 0;
    const qty = Math.min(have + quantity, p.stockQuantity);
    await prisma.cartItem.upsert({
      where: { cartId_productId: { cartId: cart.id, productId } },
      update: { quantity: qty }, create: { cartId: cart.id, productId, quantity: qty },
    });
  }
  await respond(res, req.user.id, 'Cart merged');
});

exports.applyCoupon = asyncHandler(async (req, res) => {
  const cart = await getCart(req.user.id);
  const subtotal = cart.items.filter((i) => i.product.isActive).reduce((s, i) => s + Number(effective(i.product)) * i.quantity, 0);
  const { coupon } = await validateCoupon(req.body.code, req.user.id, subtotal);
  await prisma.cart.update({ where: { id: cart.id }, data: { couponCode: coupon.code } });
  await respond(res, req.user.id, `Coupon ${coupon.code} applied`);
});

exports.removeCoupon = asyncHandler(async (req, res) => {
  await prisma.cart.update({ where: { id: (await getCart(req.user.id)).id }, data: { couponCode: null } });
  await respond(res, req.user.id, 'Coupon removed');
});

// POST /api/coupons/validate: checks a code against the current cart without applying it
exports.validateOnly = asyncHandler(async (req, res) => {
  const cart = await getCart(req.user.id);
  const subtotal = cart.items.filter((i) => i.product.isActive).reduce((s, i) => s + Number(effective(i.product)) * i.quantity, 0);
  const { coupon, discount } = await validateCoupon(req.body.code, req.user.id, subtotal);
  success(res, { code: coupon.code, description: coupon.description, discount }, 'Coupon is valid');
});
