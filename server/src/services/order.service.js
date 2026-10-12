const crypto = require('crypto');
const prisma = require('../config/prisma');
const { pricing } = require('../config/env');
const ApiError = require('../utils/ApiError');
const { computeTotals, effective } = require('./pricing.service');
const { validateCoupon } = require('./coupon.service');

const makeOrderNumber = () => {
  const d = new Date();
  const ymd = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  return `LUM-${ymd}-${crypto.randomInt(10000, 99999)}`;
};

// Restores stock and coupon usage. Used on cancellation and failed payments (call inside a transaction).
const releaseOrder = async (tx, order) => {
  const items = order.items || (await tx.orderItem.findMany({ where: { orderId: order.id } }));
  for (const i of items) {
    await tx.product.update({ where: { id: i.productId }, data: { stockQuantity: { increment: i.quantity } } });
  }
  const usage = await tx.couponUsage.findUnique({ where: { orderId: order.id } });
  if (usage) {
    await tx.couponUsage.delete({ where: { id: usage.id } });
    await tx.coupon.update({ where: { id: usage.couponId }, data: { usedCount: { decrement: 1 } } });
  }
};

// Builds an order from the user's SERVER-SIDE cart. Prices and totals never come from the client.
const createOrderFromCart = async (user, { customer, shipping, paymentMethod }) => {
  const cart = await prisma.cart.findUnique({
    where: { userId: user.id },
    include: { items: { include: { product: { include: { images: { orderBy: { sortOrder: 'asc' }, take: 1 } } } } } },
  });
  const items = (cart?.items || []).filter((i) => i.product.isActive);
  if (!items.length) throw new ApiError(400, 'Your cart is empty');

  for (const i of items) {
    if (i.quantity > i.product.stockQuantity) {
      throw new ApiError(409, i.product.stockQuantity === 0 ? `${i.product.name} is out of stock` : `Only ${i.product.stockQuantity} of ${i.product.name} left in stock`);
    }
  }

  const rawSubtotal = items.reduce((s, i) => s + Number(effective(i.product)) * i.quantity, 0);
  let coupon = null;
  let couponDiscount = 0;
  if (cart.couponCode) {
    ({ coupon, discount: couponDiscount } = await validateCoupon(cart.couponCode, user.id, rawSubtotal));
  }
  const totals = computeTotals(items.map((i) => ({ product: i.product, quantity: i.quantity })), couponDiscount);

  if (paymentMethod === 'COD') {
    if (!pricing.codEnabled) throw new ApiError(400, 'Cash on Delivery is not available right now');
    if (shipping.country.trim().toLowerCase() !== 'india') throw new ApiError(400, 'Cash on Delivery is available only within India');
    if (totals.total > pricing.codMaxOrderValue) throw new ApiError(400, `Cash on Delivery is available for orders up to Rs ${pricing.codMaxOrderValue}`);
  }

  return prisma.$transaction(async (tx) => {
    // Atomic stock reservation: fails if another customer bought the last units meanwhile
    for (const i of items) {
      const r = await tx.product.updateMany({
        where: { id: i.productId, stockQuantity: { gte: i.quantity } }, data: { stockQuantity: { decrement: i.quantity } },
      });
      if (r.count === 0) throw new ApiError(409, `${i.product.name} just went out of stock. Please update your cart.`);
    }
    if (coupon) {
      const r = await tx.coupon.updateMany({
        where: { id: coupon.id, ...(coupon.usageLimit !== null ? { usedCount: { lt: coupon.usageLimit } } : {}) },
        data: { usedCount: { increment: 1 } },
      });
      if (r.count === 0) throw new ApiError(400, 'This coupon has reached its usage limit');
    }

    const order = await tx.order.create({
      data: {
        orderNumber: makeOrderNumber(), userId: user.id,
        customerName: customer.name, customerEmail: customer.email.toLowerCase(), customerPhone: customer.phone,
        shipLine1: shipping.line1, shipLine2: shipping.line2 || null, shipCity: shipping.city,
        shipState: shipping.state, shipPincode: shipping.pincode, shipCountry: shipping.country,
        subtotal: totals.subtotal, discount: totals.discount, tax: totals.tax, shippingFee: totals.shipping, total: totals.total,
        couponCode: coupon?.code || null,
        status: paymentMethod === 'COD' ? 'CONFIRMED' : 'PENDING',
        items: {
          create: items.map((i) => ({
            productId: i.productId, productName: i.product.name, productSku: i.product.sku,
            imageUrl: i.product.images[0]?.url || null, unitPrice: effective(i.product),
            quantity: i.quantity, lineTotal: Number(effective(i.product)) * i.quantity,
          })),
        },
        payment: { create: { method: paymentMethod, status: 'PENDING', amount: totals.total } },
        ...(coupon ? { couponUsage: { create: { couponId: coupon.id, userId: user.id } } } : {}),
      },
      include: { items: true, payment: true },
    });

    await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
    await tx.cart.update({ where: { id: cart.id }, data: { couponCode: null } });
    return order;
  });
};

// Cancels online-payment orders left unpaid for too long and returns their stock.
const cancelStaleUnpaidOrders = async (minutes = 30) => {
  const stale = await prisma.order.findMany({
    where: {
      status: 'PENDING', createdAt: { lt: new Date(Date.now() - minutes * 60 * 1000) },
      payment: { is: { method: 'RAZORPAY', status: { in: ['PENDING', 'FAILED'] } } },
    },
    include: { items: true },
  });
  for (const o of stale) {
    // eslint-disable-next-line no-await-in-loop
    await prisma.$transaction(async (tx) => {
      await releaseOrder(tx, o);
      await tx.order.update({ where: { id: o.id }, data: { status: 'CANCELLED', cancelReason: 'Payment was not completed in time' } });
      await tx.payment.update({ where: { orderId: o.id }, data: { status: 'FAILED', failureReason: 'Payment not completed in time' } });
    });
  }
  return stale.length;
};

module.exports = { createOrderFromCart, releaseOrder, cancelStaleUnpaidOrders };
