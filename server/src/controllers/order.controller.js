const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/response');
const { createOrderFromCart, releaseOrder } = require('../services/order.service');
const { order: ser, tracking } = require('../utils/serializeOrder');

const include = { items: true, payment: true };
const CANCELLABLE = ['PENDING', 'CONFIRMED', 'PROCESSING'];

const findOwn = async (req) => {
  const key = req.params.id;
  const o = await prisma.order.findFirst({
    where: { OR: [{ id: key }, { orderNumber: key }], ...(req.user.role === 'ADMIN' ? {} : { userId: req.user.id }) }, include,
  });
  if (!o) throw new ApiError(404, 'Order not found');
  return o;
};

exports.create = asyncHandler(async (req, res) => {
  const o = await createOrderFromCart(req.user, req.body);
  success(res, { order: ser(o) }, o.status === 'CONFIRMED' ? 'Order placed successfully' : 'Order created. Complete the payment to confirm it.', 201);
});

exports.list = asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Number(req.query.limit) || 10, 50);
  const where = { userId: req.user.id };
  const [total, orders] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({ where, include, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
  ]);
  success(res, { orders: orders.map(ser) }, 'Orders fetched', 200, { page, limit, total, totalPages: Math.ceil(total / limit) });
});

exports.getOne = asyncHandler(async (req, res) => success(res, { order: ser(await findOwn(req)) }));

exports.track = asyncHandler(async (req, res) => success(res, { tracking: tracking(await findOwn(req)) }));

exports.cancel = asyncHandler(async (req, res) => {
  const o = await findOwn(req);
  if (!CANCELLABLE.includes(o.status)) throw new ApiError(400, 'This order can no longer be cancelled because it has already been shipped or closed');
  const paid = o.payment?.status === 'PAID';
  const updated = await prisma.$transaction(async (tx) => {
    await releaseOrder(tx, o);
    return tx.order.update({
      where: { id: o.id },
      data: { status: 'CANCELLED', cancelReason: req.body.reason || 'Cancelled by customer', refundRequested: paid },
      include,
    });
  });
  success(res, { order: ser(updated) }, paid ? 'Order cancelled. Your refund will be processed shortly.' : 'Order cancelled');
});

exports.requestRefund = asyncHandler(async (req, res) => {
  const o = await findOwn(req);
  const eligible = o.payment?.status === 'PAID' && ['DELIVERED', 'CANCELLED'].includes(o.status);
  if (!eligible) throw new ApiError(400, 'A refund can only be requested for paid orders that were delivered or cancelled');
  if (o.refundRequested) throw new ApiError(409, 'A refund has already been requested for this order');
  const updated = await prisma.order.update({ where: { id: o.id }, data: { refundRequested: true }, include });
  success(res, { order: ser(updated) }, 'Refund request submitted');
});
