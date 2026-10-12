const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/response');

const recalc = async (productId) => {
  const agg = await prisma.review.aggregate({ where: { productId, isApproved: true }, _avg: { rating: true }, _count: true });
  await prisma.product.update({
    where: { id: productId },
    data: { ratingAverage: Math.round((agg._avg.rating || 0) * 100) / 100, reviewCount: agg._count },
  });
};

exports.listForProduct = asyncHandler(async (req, res) => {
  const reviews = await prisma.review.findMany({
    where: { productId: req.params.id, isApproved: true }, orderBy: { createdAt: 'desc' },
    include: { user: { select: { name: true } } },
  });
  success(res, {
    reviews: reviews.map((r) => ({ id: r.id, rating: r.rating, title: r.title, comment: r.comment,
      isVerifiedPurchase: r.isVerifiedPurchase, createdAt: r.createdAt, author: r.user.name.split(' ')[0] })),
  });
});

exports.create = asyncHandler(async (req, res) => {
  const productId = req.params.id;
  if (!(await prisma.product.findUnique({ where: { id: productId } }))) throw new ApiError(404, 'Product not found');
  const purchased = await prisma.orderItem.findFirst({
    where: { productId, order: { userId: req.user.id, status: 'DELIVERED' } }, select: { id: true },
  });
  if (!purchased) throw new ApiError(403, 'Only customers who received this product can review it');
  const { rating, title, comment } = req.body;
  const dup = await prisma.review.findUnique({ where: { productId_userId: { productId, userId: req.user.id } } });
  if (dup) throw new ApiError(409, 'You have already reviewed this product');
  await prisma.review.create({ data: { productId, userId: req.user.id, rating, title, comment, isVerifiedPurchase: true } });
  success(res, {}, 'Thank you! Your review will appear after moderation.', 201);
});

// ---- Admin moderation ----
exports.adminList = asyncHandler(async (req, res) => {
  const where = req.query.status === 'approved' ? { isApproved: true } : req.query.status === 'all' ? {} : { isApproved: false };
  const reviews = await prisma.review.findMany({
    where, orderBy: { createdAt: 'desc' },
    include: { user: { select: { name: true, email: true } }, product: { select: { name: true, slug: true } } },
  });
  success(res, { reviews });
});

exports.approve = asyncHandler(async (req, res) => {
  const r = await prisma.review.update({ where: { id: req.params.id }, data: { isApproved: true } });
  await recalc(r.productId);
  success(res, {}, 'Review approved');
});

exports.remove = asyncHandler(async (req, res) => {
  const r = await prisma.review.delete({ where: { id: req.params.id } });
  await recalc(r.productId);
  success(res, {}, 'Review deleted');
});
