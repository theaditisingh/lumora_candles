const slugify = (s) =>
  String(s).toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

// Returns a slug not used by another record of the given Prisma model
const uniqueSlug = async (model, name, ignoreId) => {
  const base = slugify(name) || 'item';
  let slug = base;
  let n = 1;
  // eslint-disable-next-line no-await-in-loop
  while (await model.findFirst({ where: { slug, ...(ignoreId ? { NOT: { id: ignoreId } } : {}) }, select: { id: true } })) {
    n += 1;
    slug = `${base}-${n}`;
  }
  return slug;
};

module.exports = { slugify, uniqueSlug };
