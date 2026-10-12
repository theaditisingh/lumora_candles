const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/response');
const { product: ser } = require('../utils/serialize');

const getList = (userId) => prisma.wishlist.upsert({
  where: { userId }, update: {}, create: { userId },
  include: { items: { orderBy: { createdAt: 'desc' }, include: { product: { include: { images: { orderBy: { sortOrder: 'asc' }, take: 1 } } } } } },
});
const view = async (userId) => {
  const w = await getList(userId);
  const items = w.items.filter((i) => i.product.isActive).map((i) => ({ id: i.id, addedAt: i.createdAt, product: ser(i.product) }));
  return { items, productIds: items.map((i) => i.product.id) };
};

exports.get = asyncHandler(async (req, res) => success(res, await view(req.user.id)));

exports.add = asyncHandler(async (req, res) => {
  const p = await prisma.product.findUnique({ where: { id: req.body.productId } });
  if (!p || !p.isActive) throw new ApiError(404, 'Product not found');
  const w = await getList(req.user.id);
  await prisma.wishlistItem.upsert({
    where: { wishlistId_productId: { wishlistId: w.id, productId: p.id } }, update: {}, create: { wishlistId: w.id, productId: p.id },
  });
  success(res, await view(req.user.id), 'Added to wishlist', 201);
});

exports.remove = asyncHandler(async (req, res) => {
  const w = await getList(req.user.id);
  await prisma.wishlistItem.deleteMany({ where: { wishlistId: w.id, productId: req.params.productId } });
  success(res, await view(req.user.id), 'Removed from wishlist');
});
