// Prisma returns Decimal as strings; the API returns plain numbers.
const num = (v) => (v === null || v === undefined ? v : Number(v));

const product = (p) => {
  if (!p) return p;
  const price = num(p.price);
  const discountPrice = num(p.discountPrice);
  const effectivePrice = discountPrice !== null && discountPrice !== undefined && discountPrice < price ? discountPrice : price;
  return {
    ...p,
    price,
    discountPrice: discountPrice ?? null,
    effectivePrice,
    discountPercent: effectivePrice < price ? Math.round(((price - effectivePrice) / price) * 100) : 0,
    ratingAverage: num(p.ratingAverage),
    inStock: p.stockQuantity > 0,
    lowStock: p.stockQuantity > 0 && p.stockQuantity <= p.lowStockAlert,
  };
};

module.exports = { num, product };
