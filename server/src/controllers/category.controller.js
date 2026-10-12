const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/response');
const { uniqueSlug } = require('../utils/slug');

exports.list = asyncHandler(async (req, res) => {
  const admin = req.user?.role === 'ADMIN';
  const categories = await prisma.category.findMany({
    where: admin ? {} : { isActive: true },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    include: { _count: { select: { products: { where: { isActive: true } } } } },
  });
  success(res, {
    categories: categories.map(({ _count, ...c }) => ({ ...c, productCount: _count.products })),
  });
});

exports.create = asyncHandler(async (req, res) => {
  const { name, description, imageUrl, sortOrder, isActive } = req.body;
  const category = await prisma.category.create({
    data: { name, description, imageUrl, sortOrder: sortOrder ?? 0, isActive: isActive ?? true, slug: await uniqueSlug(prisma.category, name) },
  });
  success(res, { category }, 'Category created successfully', 201);
});

exports.update = asyncHandler(async (req, res) => {
  const existing = await prisma.category.findUnique({ where: { id: req.params.id } });
  if (!existing) throw new ApiError(404, 'Category not found');
  const { name, description, imageUrl, sortOrder, isActive } = req.body;
  const data = { name, description, imageUrl, sortOrder, isActive };
  Object.keys(data).forEach((k) => data[k] === undefined && delete data[k]);
  if (name && name !== existing.name) data.slug = await uniqueSlug(prisma.category, name, existing.id);
  const category = await prisma.category.update({ where: { id: existing.id }, data });
  success(res, { category }, 'Category updated successfully');
});

exports.remove = asyncHandler(async (req, res) => {
  const count = await prisma.product.count({ where: { categoryId: req.params.id } });
  if (count > 0) throw new ApiError(409, `This category has ${count} product(s). Move or delete them first.`);
  await prisma.category.delete({ where: { id: req.params.id } });
  success(res, {}, 'Category deleted successfully');
});
