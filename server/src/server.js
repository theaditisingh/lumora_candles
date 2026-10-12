const { port, razorpay, isProd } = require('./config/env');
const prisma = require('./config/prisma');
const app = require('./app');
const { cancelStaleUnpaidOrders } = require('./services/order.service');

const server = app.listen(port, () => {
  console.log(`Lumora API running on port ${port} (${isProd ? 'production' : 'development'})`);
  if (!razorpay.keyId) console.warn('Razorpay keys not set: online payments disabled, COD still works.');
  else console.log(`Razorpay mode: ${razorpay.isTestMode ? 'TEST (sandbox)' : 'LIVE'}`);
});

// Every 10 minutes, release stock held by online orders that were never paid
const cleanup = setInterval(() => {
  cancelStaleUnpaidOrders().then((n) => n && console.log(`Cancelled ${n} unpaid order(s)`)).catch((e) => console.error('Cleanup failed:', e.message));
}, 10 * 60 * 1000);
cleanup.unref();

const shutdown = (signal) => {
  console.log(`${signal} received, shutting down...`);
  server.close(async () => { await prisma.$disconnect(); process.exit(0); });
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
