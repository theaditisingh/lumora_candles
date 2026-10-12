const prisma = require('../config/prisma');
const { pricing } = require('../config/env');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/response');
const { releaseOrder } = require('../services/order.service');
const { order: serOrder } = require('../utils/serializeOrder');

const n = (v) => Number(v || 0);
// Orders that count as sales: not cancelled/refunded, and either paid online or placed as COD
const COUNTED = { status: { notIn: ['CANCELLED', 'REFUNDED'] }, payment: { is: { OR: [{ status: 'PAID' }, { method: 'COD' }] } } };
const dayKey = (d) => new Date(d).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
const page = (q, def = 15) => { const p = Math.max(Number(q.page) || 1, 1); const l = Math.min(Number(q.limit) || def, 100); return { p, l, skip: (p - 1) * l }; };
const meta = (p, l, total) => ({ page: p, limit: l, total, totalPages: Math.ceil(total / l) });

// ---------- Dashboard & sales ----------
const buildSeries = async (days) => {
  const since = new Date(Date.now() - (days - 1) * 86400000); since.setHours(0, 0, 0, 0);
  const where = { ...COUNTED, createdAt: { gte: since } };
  const [orders, items, payments, top] = await Promise.all([
    prisma.order.findMany({ where, select: { createdAt: true, total: true } }),
    prisma.orderItem.findMany({ where: { order: where }, select: { lineTotal: true, product: { select: { category: { select: { name: true } } } } } }),
    prisma.payment.groupBy({ by: ['method'], where: { order: where }, _count: true, _sum: { amount: true } }),
    prisma.orderItem.groupBy({ by: ['productId', 'productName'], where: { order: where }, _sum: { quantity: true, lineTotal: true }, orderBy: { _sum: { quantity: 'desc' } }, take: 5 }),
  ]);
  const byDay = {};
  for (let i = 0; i < days; i += 1) byDay[dayKey(new Date(since.getTime() + i * 86400000))] = { date: null, revenue: 0, orders: 0 };
  Object.keys(byDay).forEach((k) => { byDay[k].date = k; });
  orders.forEach((o) => { const b = byDay[dayKey(o.createdAt)]; if (b) { b.revenue += n(o.total); b.orders += 1; } });
  const cat = {};
  items.forEach((i) => { const name = i.product.category.name; cat[name] = (cat[name] || 0) + n(i.lineTotal); });
  return {
    daily: Object.values(byDay).map((d) => ({ ...d, revenue: Math.round(d.revenue * 100) / 100 })),
    topProducts: top.map((t) => ({ productId: t.productId, name: t.productName, quantity: t._sum.quantity, revenue: n(t._sum.lineTotal) })),
    salesByCategory: Object.entries(cat).map(([name, revenue]) => ({ name, revenue: Math.round(revenue * 100) / 100 })).sort((a, b) => b.revenue - a.revenue),
    paymentMethods: payments.map((p) => ({ method: p.method, orders: p._count, amount: n(p._sum.amount) })),
  };
};

exports.dashboard = asyncHandler(async (req, res) => {
  const startToday = new Date(); startToday.setHours(0, 0, 0, 0);
  const startMonth = new Date(startToday.getFullYear(), startToday.getMonth(), 1);
  const sum = (extra = {}) => prisma.order.aggregate({ where: { ...COUNTED, ...extra }, _sum: { total: true } }).then((r) => n(r._sum.total));
  const [revenue, today, month, totalOrders, pending, completed, customers, products, lowCandidates, series] = await Promise.all([
    sum(), sum({ createdAt: { gte: startToday } }), sum({ createdAt: { gte: startMonth } }),
    prisma.order.count(), prisma.order.count({ where: { status: { in: ['PENDING', 'CONFIRMED', 'PROCESSING'] } } }),
    prisma.order.count({ where: { status: 'DELIVERED' } }), prisma.user.count({ where: { role: 'CUSTOMER' } }),
    prisma.product.count(), prisma.product.findMany({ where: { isActive: true, stockQuantity: { lte: 25 } }, select: { id: true, name: true, sku: true, stockQuantity: true, lowStockAlert: true }, orderBy: { stockQuantity: 'asc' } }),
    buildSeries(30),
  ]);
  const lowStock = lowCandidates.filter((p) => p.stockQuantity <= p.lowStockAlert);
  success(res, { metrics: { revenue, todaySales: today, monthSales: month, totalOrders, pendingOrders: pending, completedOrders: completed, totalCustomers: customers, totalProducts: products, lowStockCount: lowStock.length }, lowStock, ...series });
});

exports.sales = asyncHandler(async (req, res) => {
  const days = [7, 30, 90, 365].includes(Number(req.query.days)) ? Number(req.query.days) : 30;
  success(res, { days, ...(await buildSeries(days)) });
});

// ---------- Orders ----------
const FLOW = {
  PENDING: ['CONFIRMED', 'CANCELLED'], CONFIRMED: ['PROCESSING', 'CANCELLED'], PROCESSING: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['OUT_FOR_DELIVERY', 'DELIVERED'], OUT_FOR_DELIVERY: ['DELIVERED'], DELIVERED: ['REFUNDED'], CANCELLED: ['REFUNDED'], REFUNDED: [],
};
const include = { items: true, payment: true };

exports.orders = asyncHandler(async (req, res) => {
  const { p, l, skip } = page(req.query);
  const where = {
    ...(req.query.status ? { status: req.query.status } : {}),
    ...(req.query.search ? { OR: ['orderNumber', 'customerName', 'customerEmail'].map((f) => ({ [f]: { contains: String(req.query.search), mode: 'insensitive' } })) } : {}),
  };
  const [total, orders] = await Promise.all([prisma.order.count({ where }), prisma.order.findMany({ where, include, orderBy: { createdAt: 'desc' }, skip, take: l })]);
  success(res, { orders: orders.map(serOrder) }, 'Orders fetched', 200, meta(p, l, total));
});

exports.order = asyncHandler(async (req, res) => {
  const o = await prisma.order.findUnique({ where: { id: req.params.id }, include: { ...include, user: { select: { id: true, name: true, email: true, phone: true } } } });
  if (!o) throw new ApiError(404, 'Order not found');
  success(res, { order: serOrder(o), customer: o.user });
});

exports.updateOrder = asyncHandler(async (req, res) => {
  const o = await prisma.order.findUnique({ where: { id: req.params.id }, include });
  if (!o) throw new ApiError(404, 'Order not found');
  const { status, trackingNumber } = req.body;
  const data = {};
  if (trackingNumber !== undefined) data.trackingNumber = trackingNumber || null;

  const updated = await prisma.$transaction(async (tx) => {
    if (status && status !== o.status) {
      if (!FLOW[o.status].includes(status)) throw new ApiError(400, `An order that is ${o.status} cannot be changed to ${status}`);
      if (status === 'REFUNDED' && o.payment?.status !== 'PAID') throw new ApiError(400, 'Only paid orders can be refunded');
      data.status = status;
      if (status === 'CANCELLED') { await releaseOrder(tx, o); data.cancelReason = req.body.reason || 'Cancelled by store'; }
      if (status === 'DELIVERED') {
        for (const i of o.items) await tx.product.update({ where: { id: i.productId }, data: { soldCount: { increment: i.quantity } } });
        if (o.payment.method === 'COD') await tx.payment.update({ where: { orderId: o.id }, data: { status: 'PAID', paidAt: new Date() } });
      }
      if (status === 'REFUNDED') { await tx.payment.update({ where: { orderId: o.id }, data: { status: 'REFUNDED' } }); data.refundRequested = false; }
    }
    return tx.order.update({ where: { id: o.id }, data, include });
  });
  success(res, { order: serOrder(updated) }, 'Order updated');
});

// ---------- Customers ----------
exports.customers = asyncHandler(async (req, res) => {
  const { p, l, skip } = page(req.query);
  const where = { role: 'CUSTOMER', ...(req.query.search ? { OR: ['name', 'email', 'phone'].map((f) => ({ [f]: { contains: String(req.query.search), mode: 'insensitive' } })) } : {}) };
  const [total, users] = await Promise.all([prisma.user.count({ where }), prisma.user.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: l, select: { id: true, name: true, email: true, phone: true, isActive: true, createdAt: true } })]);
  const spend = await prisma.order.groupBy({ by: ['userId'], where: { userId: { in: users.map((u) => u.id) }, ...COUNTED }, _sum: { total: true }, _count: true });
  const map = Object.fromEntries(spend.map((s) => [s.userId, s]));
  success(res, { customers: users.map((u) => ({ ...u, orders: map[u.id]?._count || 0, totalSpent: n(map[u.id]?._sum.total) })) }, 'Customers fetched', 200, meta(p, l, total));
});

exports.setCustomerStatus = asyncHandler(async (req, res) => {
  const u = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!u || u.role !== 'CUSTOMER') throw new ApiError(404, 'Customer not found');
  const updated = await prisma.user.update({ where: { id: u.id }, data: { isActive: Boolean(req.body.isActive) } });
  success(res, { id: updated.id, isActive: updated.isActive }, updated.isActive ? 'Account enabled' : 'Account disabled');
});

// ---------- Coupons ----------
const couponData = (b) => ({
  ...(b.code !== undefined ? { code: String(b.code).trim().toUpperCase() } : {}), description: b.description ?? undefined,
  discountType: b.discountType, discountValue: b.discountValue, minOrderAmount: b.minOrderAmount ?? undefined,
  maxDiscount: b.maxDiscount === '' ? null : b.maxDiscount, expiresAt: b.expiresAt === '' ? null : b.expiresAt ? new Date(b.expiresAt) : undefined,
  usageLimit: b.usageLimit === '' ? null : b.usageLimit, perUserLimit: b.perUserLimit === '' ? null : b.perUserLimit, isActive: b.isActive,
});
const clean = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined));

exports.coupons = asyncHandler(async (req, res) => success(res, { coupons: await prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } }) }));
exports.createCoupon = asyncHandler(async (req, res) => {
  if (req.body.discountType === 'PERCENTAGE' && req.body.discountValue > 100) throw new ApiError(422, 'A percentage discount cannot exceed 100');
  success(res, { coupon: await prisma.coupon.create({ data: clean(couponData(req.body)) }) }, 'Coupon created', 201);
});
exports.updateCoupon = asyncHandler(async (req, res) => success(res, { coupon: await prisma.coupon.update({ where: { id: req.params.id }, data: clean(couponData(req.body)) }) }, 'Coupon updated'));
exports.deleteCoupon = asyncHandler(async (req, res) => {
  const used = await prisma.couponUsage.count({ where: { couponId: req.params.id } });
  if (used > 0) { await prisma.coupon.update({ where: { id: req.params.id }, data: { isActive: false } }); return success(res, {}, 'Coupon has been used, so it was disabled instead of deleted'); }
  await prisma.coupon.delete({ where: { id: req.params.id } });
  return success(res, {}, 'Coupon deleted');
});

// ---------- Inventory ----------
exports.inventory = asyncHandler(async (req, res) => {
  const products = await prisma.product.findMany({ orderBy: { stockQuantity: 'asc' }, select: { id: true, name: true, sku: true, stockQuantity: true, lowStockAlert: true, isActive: true, category: { select: { name: true } } } });
  success(res, { products: products.map((p) => ({ ...p, status: p.stockQuantity === 0 ? 'OUT' : p.stockQuantity <= p.lowStockAlert ? 'LOW' : 'OK' })) });
});
exports.setStock = asyncHandler(async (req, res) => {
  const p = await prisma.product.update({ where: { id: req.params.id }, data: { stockQuantity: req.body.stockQuantity, ...(req.body.lowStockAlert !== undefined ? { lowStockAlert: req.body.lowStockAlert } : {}) }, select: { id: true, name: true, stockQuantity: true, lowStockAlert: true } });
  success(res, { product: p }, 'Stock updated');
});

// ---------- Settings ----------
const KEYS = ['storeName', 'supportEmail', 'supportPhone', 'announcement'];
exports.getSettings = asyncHandler(async (req, res) => {
  const rows = await prisma.setting.findMany();
  success(res, { settings: Object.fromEntries(rows.map((r) => [r.key, r.value])), pricing: { gstRate: pricing.gstRate, shippingFee: pricing.shippingFee, freeShippingThreshold: pricing.freeShippingThreshold, codEnabled: pricing.codEnabled, codMaxOrderValue: pricing.codMaxOrderValue, note: 'Pricing rules are set in server/.env' } });
});
exports.putSettings = asyncHandler(async (req, res) => {
  for (const k of KEYS) if (typeof req.body[k] === 'string') await prisma.setting.upsert({ where: { key: k }, update: { value: req.body[k] }, create: { key: k, value: req.body[k] } });
  success(res, {}, 'Settings saved');
});
