const crypto = require('crypto');
const Razorpay = require('razorpay');
const { razorpay: cfg } = require('../config/env');
const ApiError = require('../utils/ApiError');

let client = null;
const isConfigured = () => Boolean(cfg.keyId && cfg.keySecret);

const getClient = () => {
  if (!isConfigured()) throw new ApiError(503, 'Online payments are not available right now. Please choose Cash on Delivery.');
  if (!client) client = new Razorpay({ key_id: cfg.keyId, key_secret: cfg.keySecret });
  return client;
};

const safeEqualHex = (a, b) => {
  const x = Buffer.from(String(a || ''), 'utf8');
  const y = Buffer.from(String(b || ''), 'utf8');
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};

// Checkout signature: HMAC_SHA256(razorpay_order_id|razorpay_payment_id, key_secret)
const verifyCheckoutSignature = (orderId, paymentId, signature) => {
  const expected = crypto.createHmac('sha256', cfg.keySecret).update(`${orderId}|${paymentId}`).digest('hex');
  return safeEqualHex(expected, signature);
};

// Webhook signature: HMAC_SHA256(raw request body, webhook_secret)
const verifyWebhookSignature = (rawBody, signature) => {
  if (!cfg.webhookSecret) return false;
  const expected = crypto.createHmac('sha256', cfg.webhookSecret).update(rawBody).digest('hex');
  return safeEqualHex(expected, signature);
};

const wrap = async (fn, msg) => {
  try { return await fn(); } catch (e) {
    if (e instanceof ApiError) throw e;
    console.error('Razorpay error:', e?.error?.description || e?.message || e);
    throw new ApiError(502, msg);
  }
};

const createOrder = (amountPaise, receipt, notes) =>
  wrap(() => getClient().orders.create({ amount: amountPaise, currency: 'INR', receipt: receipt.slice(0, 40), notes }),
    'Could not start the payment. Please try again.');

const fetchPayment = (paymentId) => wrap(() => getClient().payments.fetch(paymentId), 'Could not confirm the payment with Razorpay.');
const capturePayment = (paymentId, amountPaise) =>
  wrap(() => getClient().payments.capture(paymentId, amountPaise, 'INR'), 'Could not capture the payment.');

module.exports = { isConfigured, verifyCheckoutSignature, verifyWebhookSignature, createOrder, fetchPayment, capturePayment, keyId: cfg.keyId, isTestMode: cfg.isTestMode };
