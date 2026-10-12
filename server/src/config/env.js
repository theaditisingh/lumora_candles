const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });
require('dotenv').config(); // fallback: server/.env

const required = ['DATABASE_URL', 'JWT_SECRET'];
const missing = required.filter((k) => !process.env[k]);
if (missing.length) {
  throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
}
if (process.env.NODE_ENV === 'production' && process.env.JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters in production');
}

const num = (v, d) => (v !== undefined && v !== '' && !Number.isNaN(Number(v)) ? Number(v) : d);

module.exports = {
  isProd: process.env.NODE_ENV === 'production',
  port: num(process.env.PORT, 5000),
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  jwt: { secret: process.env.JWT_SECRET, expiresIn: process.env.JWT_EXPIRES_IN || '7d' },
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID || '',
    keySecret: process.env.RAZORPAY_KEY_SECRET || '',
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || '',
    isTestMode: (process.env.RAZORPAY_KEY_ID || '').startsWith('rzp_test_'),
  },
  pricing: {
    gstRate: num(process.env.GST_RATE, 18),
    shippingFee: num(process.env.SHIPPING_FEE, 99),
    freeShippingThreshold: num(process.env.FREE_SHIPPING_THRESHOLD, 999),
    codEnabled: process.env.COD_ENABLED !== 'false',
    codMaxOrderValue: num(process.env.COD_MAX_ORDER_VALUE, 10000),
  },
};
