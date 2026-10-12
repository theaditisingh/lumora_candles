const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/response');
const { uniqueSlug } = require('../utils/slug');
const { product: ser } = require('../utils/serialize');

const SORTS = {
  price_asc: [{ price: 'asc' }],
  price_desc: [{ price: 'desc' }],
  newest: [{ createdAt: 'desc' }],
  bestselling: [{ soldCount: 'desc' }],
  rating: [{ ratingAverage: 'desc' }, { reviewCount: 'desc' }],
};
const FIELDS = ['name', 'description', 'shortDescription', 'price', 'discountPrice', 'sku', 'brand', 'fragrance', 'waxType',
  'burnTimeHours', 'weightGrams', 'dimensions', 'stockQuantity', 'lowStockAlert', 'isFeatured', 'isBestseller',
  'isNewArrival', 'isActive', 'categoryId'];
const pick = (src) => Object.fromEntries(FIELDS.filter((k) => src[k] !== undefined).map((k) => [k, src[k]]));
const isAdmin = (req) => req.user?.role === 'ADMIN';
const imageInclude = { images: { orderBy: { sortOrder: 'asc' } }, category: { select: { id: true, name: true, slug: true } } };

exports.list = asyncHandler(async (req, res) => {
  const q = req.query;
  const page = Number(q.page) || 1;
  const limit = Number(q.limit) || 12;
  const and = [];

  if (!(isAdmin(req) && q.includeInactive === 'true')) and.push({ isActive: true });
  if (q.search) {
    const s = String(q.search).trim();
    and.push({ OR: ['name', 'shortDescription', 'description', 'fragrance', 'sku'].map((f) => ({ [f]: { contains: s, mode: 'insensitive' } })) });
  }
  if (q.category) and.push({ category: { OR: [{ slug: String(q.category) }, { id: String(q.category) }] } });
  if (q.fragrance) and.push({ fragrance: { in: String(q.fragrance).split(',') } });
  if (q.waxType) and.push({ waxType: { in: String(q.waxType).split(',') } });
  if (q.minRating) and.push({ ratingAverage: { gte: Number(q.minRating) } });
  if (q.inStock === 'true') and.push({ stockQuantity: { gt: 0 } });
  if (q.onSale === 'true') and.push({ discountPrice: { not: null } });
  if (q.featured === 'true') and.push({ isFeatured: true });
  if (q.bestseller === 'true') and.push({ isBestseller: true });
  if (q.newArrival === 'true') and.push({ isNewArrival: true });
  if (q.lowStock === 'true' && isAdmin(req)) and.push({ stockQuantity: { lte: 5 } });

  if (q.minPrice || q.maxPrice) {
    // Filter on the price the customer actually pays (discount price when present)
    const range = {};
    if (q.minPrice) range.gte = Number(q.minPrice);
    if (q.maxPrice) range.lte = Number(q.maxPrice);
    and.push({ OR: [{ discountPrice: range }, { discountPrice: null, price: range }] });
  }

  const where = { AND: and };
  const [total, items] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where, include: imageInclude, orderBy: SORTS[q.sort] || SORTS.newest, skip: (page - 1) * limit, take: limit,
    }),
  ]);

  success(res, { products: items.map(ser) }, 'Products fetched', 200, {
    page, limit, total, totalPages: Math.ceil(total / limit),
  });
});

exports.getOne = asyncHandler(async (req, res) => {
  const key = req.params.id;
  const p = await prisma.product.findFirst({
    where: { OR: [{ id: key }, { slug: key }], ...(isAdmin(req) ? {} : { isActive: true }) },
    include: imageInclude,
  });
  if (!p) throw new ApiError(404, 'Product not found');
  const related = await prisma.product.findMany({
    where: { categoryId: p.categoryId, isActive: true, NOT: { id: p.id } },
    include: imageInclude, take: 4, orderBy: { soldCount: 'desc' },
  });
  success(res, { product: ser(p), related: related.map(ser) });
});

exports.create = asyncHandler(async (req, res) => {
  const category = await prisma.category.findUnique({ where: { id: req.body.categoryId } });
  if (!category) throw new ApiError(400, 'Selected category does not exist');
  const slug = await uniqueSlug(prisma.product, req.body.name);
  const images = Array.isArray(req.body.images) ? req.body.images.filter((i) => i && typeof i.url === 'string') : [];

  const created = await prisma.product.create({
    data: {
      ...pick(req.body), slug,
      images: { create: images.map((i, idx) => ({ url: i.url, alt: i.alt || req.body.name, sortOrder: idx, isPrimary: idx === 0 })) },
    },
    include: imageInclude,
  });
  success(res, { product: ser(created) }, 'Product created successfully', 201);
});

exports.update = asyncHandler(async (req, res) => {
  const existing = await prisma.product.findUnique({ where: { id: req.params.id } });
  if (!existing) throw new ApiError(404, 'Product not found');
  const data = pick(req.body);
  if (data.categoryId && !(await prisma.category.findUnique({ where: { id: data.categoryId } }))) {
    throw new ApiError(400, 'Selected category does not exist');
  }
  const effectivePrice = data.price ?? existing.price;
  const effectiveDiscount = data.discountPrice === undefined ? existing.discountPrice : data.discountPrice;
  if (effectiveDiscount && Number(effectiveDiscount) >= Number(effectivePrice)) {
    throw new ApiError(422, 'Discount price must be lower than the price');
  }
  if (data.discountPrice === '' || data.discountPrice === 0) data.discountPrice = null;
  if (data.name && data.name !== existing.name) data.slug = await uniqueSlug(prisma.product, data.name, existing.id);

  const updated = await prisma.product.update({ where: { id: existing.id }, data, include: imageInclude });
  success(res, { product: ser(updated) }, 'Product updated successfully');
});

exports.remove = asyncHandler(async (req, res) => {
  const existing = await prisma.product.findUnique({ where: { id: req.params.id } });
  if (!existing) throw new ApiError(404, 'Product not found');
  const ordered = await prisma.orderItem.count({ where: { productId: existing.id } });
  if (ordered > 0) {
    // Keep order history intact: hide the product instead of deleting it
    await prisma.product.update({ where: { id: existing.id }, data: { isActive: false } });
    return success(res, {}, 'Product has past orders, so it was deactivated instead of deleted');
  }
  await prisma.product.delete({ where: { id: existing.id } });
  success(res, {}, 'Product deleted successfully');
});

exports.addImages = asyncHandler(async (req, res) => {
  const p = await prisma.product.findUnique({ where: { id: req.params.id }, include: { images: true } });
  if (!p) throw new ApiError(404, 'Product not found');
  if (!req.files?.length) throw new ApiError(400, 'No images uploaded');
  const start = p.images.length;
  await prisma.productImage.createMany({
    data: req.files.map((f, i) => ({
      productId: p.id, url: `/uploads/products/${f.filename}`, alt: p.name, sortOrder: start + i, isPrimary: start + i === 0,
    })),
  });
  const fresh = await prisma.product.findUnique({ where: { id: p.id }, include: imageInclude });
  success(res, { product: ser(fresh) }, 'Images uploaded', 201);
});

exports.removeImage = asyncHandler(async (req, res) => {
  const img = await prisma.productImage.findFirst({ where: { id: req.params.imageId, productId: req.params.id } });
  if (!img) throw new ApiError(404, 'Image not found');
  await prisma.productImage.delete({ where: { id: img.id } });
  success(res, {}, 'Image removed');
});
