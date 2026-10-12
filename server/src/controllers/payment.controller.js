const prisma = require('../config/prisma');
const { pricing } = require('../config/env');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/response');
const rz = require('../services/razorpay.service');
const { order: ser } = require('../utils/serializeOrder');

const include = { items: true, payment: true };
const paise = (v) => Math.round(Number(v) * 100);

const loadOwnOrder = async (userId, orderId) => {
  const o = await prisma.order.findFirst({ where: { id: orderId, userId }, include });
  if (!o) throw new ApiError(404, 'Order not found');
  if (!o.payment || o.payment.method !== 'RAZORPAY') throw new ApiError(400, 'This order is not an online payment order');
  return o;
};

// Marks a payment as paid exactly once. Safe to call from both /verify and the webhook.
const markPaid = (razorpayOrderId, paymentId, signature) =>
  prisma.$transaction(async (tx) => {
    const pay = await tx.payment.findUnique({ where: { razorpayOrderId } });
    if (!pay) throw new ApiError(404, 'Payment record not found');
    if (pay.status === 'PAID') return pay.orderId;
    await tx.payment.update({
      where: { id: pay.id },
      data: { status: 'PAID', paidAt: new Date(), razorpayPaymentId: paymentId, ...(signature ? { razorpaySignature: signature } : {}), failureReason: null },
    });
    const order = await tx.order.findUnique({ where: { id: pay.orderId } });
    if (order.status === 'PENDING') await tx.order.update({ where: { id: order.id }, data: { status: 'CONFIRMED' } });
    // Customer paid after the order was auto-cancelled: keep it cancelled and flag it for refund
    else if (order.status === 'CANCELLED') await tx.order.update({ where: { id: order.id }, data: { refundRequested: true } });
    return pay.orderId;
  });

exports.config = asyncHandler(async (req, res) => {
  success(res, {
    razorpayEnabled: rz.isConfigured(), razorpayKeyId: rz.isConfigured() ? rz.keyId : null, testMode: rz.isTestMode,
    codEnabled: pricing.codEnabled, codMaxOrderValue: pricing.codMaxOrderValue,
  });
});

exports.createOrder = asyncHandler(async (req, res) => {
  const o = await loadOwnOrder(req.user.id, req.body.orderId);
  if (o.payment.status === 'PAID') throw new ApiError(409, 'This order is already paid');
  if (o.status !== 'PENDING') throw new ApiError(400, 'This order can no longer be paid for');

  // Amount always comes from the database order, never from the client
  const amount = paise(o.payment.amount);
  let rzOrderId = o.payment.razorpayOrderId;
  if (!rzOrderId) {
    const rzOrder = await rz.createOrder(amount, o.orderNumber, { orderId: o.id, orderNumber: o.orderNumber });
    rzOrderId = rzOrder.id;
  }
  await prisma.payment.update({ where: { id: o.payment.id }, data: { razorpayOrderId: rzOrderId, status: 'PENDING', failureReason: null } });

  success(res, {
    keyId: rz.keyId, razorpayOrderId: rzOrderId, amount, currency: 'INR', orderId: o.id, orderNumber: o.orderNumber,
    prefill: { name: o.customerName, email: o.customerEmail, contact: o.customerPhone },
  }, 'Payment started');
});

exports.verify = asyncHandler(async (req, res) => {
  const { orderId, razorpay_order_id: rzOrderId, razorpay_payment_id: rzPaymentId, razorpay_signature: sig } = req.body;
  const o = await loadOwnOrder(req.user.id, orderId);
  if (o.payment.status === 'PAID') return success(res, { order: ser(o) }, 'Payment already confirmed');
  if (o.payment.razorpayOrderId !== rzOrderId) throw new ApiError(400, 'Payment does not match this order');
  if (!rz.verifyCheckoutSignature(rzOrderId, rzPaymentId, sig)) {
    await prisma.payment.update({ where: { id: o.payment.id }, data: { status: 'FAILED', failureReason: 'Signature verification failed' } });
    throw new ApiError(400, 'Payment verification failed');
  }

  // Cross-check with Razorpay: same order, same amount as OUR database total, and actually paid
  let rzPayment = await rz.fetchPayment(rzPaymentId);
  if (rzPayment.order_id !== rzOrderId || Number(rzPayment.amount) !== paise(o.payment.amount) || rzPayment.currency !== 'INR') {
    throw new ApiError(400, 'Payment amount does not match the order');
  }
  if (rzPayment.status === 'authorized') rzPayment = await rz.capturePayment(rzPaymentId, paise(o.payment.amount));
  if (rzPayment.status !== 'captured') throw new ApiError(400, 'Payment was not completed');

  await markPaid(rzOrderId, rzPaymentId, sig);
  const fresh = await prisma.order.findUnique({ where: { id: o.id }, include });
  success(res, { order: ser(fresh) }, 'Payment successful');
});

// Called by the checkout page when the Razorpay popup reports a failure. The customer may retry.
exports.failed = asyncHandler(async (req, res) => {
  const o = await loadOwnOrder(req.user.id, req.body.orderId);
  if (o.payment.status === 'PENDING') {
    await prisma.payment.update({ where: { id: o.payment.id }, data: { status: 'FAILED', failureReason: req.body.reason || 'Payment failed' } });
  }
  success(res, {}, 'Payment failure recorded. You can try again.');
});

exports.webhook = asyncHandler(async (req, res) => {
  const raw = req.body; // Buffer (express.raw is mounted for this path in app.js)
  const signature = req.headers['x-razorpay-signature'];
  if (!Buffer.isBuffer(raw) || !rz.verifyWebhookSignature(raw, signature)) throw new ApiError(400, 'Invalid webhook signature');

  const event = JSON.parse(raw.toString('utf8'));
  const entity = event.payload?.payment?.entity;
  if (!entity?.order_id) return success(res, {}, 'Ignored');

  const pay = await prisma.payment.findUnique({ where: { razorpayOrderId: entity.order_id } });
  if (!pay) return success(res, {}, 'Unknown order, ignored');

  if (['payment.captured', 'order.paid'].includes(event.event)) {
    if (Number(entity.amount) === paise(pay.amount)) await markPaid(entity.order_id, entity.id, null);
    else console.error(`Webhook amount mismatch for ${entity.order_id}`);
  } else if (event.event === 'payment.failed' && pay.status !== 'PAID') {
    await prisma.payment.update({ where: { id: pay.id }, data: { status: 'FAILED', failureReason: entity.error_description || 'Payment failed' } });
  }
  success(res, {}, 'Webhook processed');
});
