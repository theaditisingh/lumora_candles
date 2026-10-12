const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();
const slugify = (s) => s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const categories = [
  'Scented Candles', 'Soy Candles', 'Jar Candles', 'Luxury Candles', 'Decorative Candles', 'Gift Sets',
  'Floral Candles', 'Vanilla', 'Lavender', 'Rose', 'Sandalwood', 'Citrus', 'Festive Collection',
];

const NOTES = {
  Vanilla: 'warm vanilla bean with a creamy caramel finish',
  Lavender: 'soothing French lavender with soft herbal undertones',
  Rose: 'fresh-cut garden roses with a hint of musk',
  Sandalwood: 'smooth, woody sandalwood with amber warmth',
  Citrus: 'zesty orange, lemon peel and a sparkle of bergamot',
  Oud: 'deep smoky oud with leather and dark spice',
  Jasmine: 'night-blooming jasmine with sweet white florals',
  Coffee: 'freshly roasted coffee with a touch of hazelnut',
  Ocean: 'crisp sea salt, driftwood and cool marine air',
  Cinnamon: 'sweet cinnamon bark with clove and baked apple',
  Spice: 'cinnamon, orange peel and pine for the festive season',
  Eucalyptus: 'cool eucalyptus and spearmint for a spa-like calm',
  Sweet: 'a cheerful mix of fragrances in beautifully paired minis',
};

// [name, category, fragrance, wax, price, discountPrice, burnHrs, grams, stock, F(eatured) B(est) N(ew)]
const products = [
  ['Vanilla Dream Candle', 'Vanilla', 'Vanilla', 'Soy', 799, 699, 45, 220, 60, 'FB'],
  ['Lavender Calm Candle', 'Lavender', 'Lavender', 'Soy', 799, null, 45, 220, 55, 'FB'],
  ['Rose Garden Candle', 'Rose', 'Rose', 'Soy', 899, 799, 40, 200, 48, 'FN'],
  ['Sandalwood Luxe Candle', 'Sandalwood', 'Sandalwood', 'Soy', 1299, 1099, 55, 300, 35, 'FB'],
  ['Citrus Sunrise Candle', 'Citrus', 'Citrus', 'Soy', 599, null, 35, 180, 70, 'N'],
  ['Midnight Oud Candle', 'Luxury Candles', 'Oud', 'Soy-Coconut', 1499, 1299, 60, 350, 25, 'FB'],
  ['Jasmine Glow Candle', 'Floral Candles', 'Jasmine', 'Soy', 699, null, 40, 200, 50, 'N'],
  ['Coffee House Candle', 'Jar Candles', 'Coffee', 'Soy', 599, 499, 38, 190, 65, 'B'],
  ['Ocean Breeze Candle', 'Scented Candles', 'Ocean', 'Paraffin Blend', 499, null, 30, 150, 80, ''],
  ['Warm Cinnamon Candle', 'Scented Candles', 'Cinnamon', 'Soy', 649, 549, 40, 200, 45, 'B'],
  ['Christmas Spice Candle', 'Festive Collection', 'Spice', 'Soy', 799, 699, 42, 220, 40, 'FN'],
  ['Vanilla Bean Gift Set', 'Gift Sets', 'Vanilla', 'Soy', 1499, 1299, 90, 480, 30, 'FB'],
  ['Lavender Fields Soy Jar', 'Soy Candles', 'Lavender', 'Soy', 899, null, 50, 250, 42, ''],
  ['Rose and Sandalwood Luxe Jar', 'Luxury Candles', 'Rose', 'Soy-Coconut', 1299, 1199, 55, 300, 28, 'F'],
  ['Citrus Zest Mini Trio', 'Gift Sets', 'Citrus', 'Soy', 999, 899, 45, 300, 38, 'N'],
  ['Eucalyptus Spa Candle', 'Soy Candles', 'Eucalyptus', 'Soy', 749, null, 42, 210, 52, 'N'],
  ['Pillar Rose Petal Candle', 'Decorative Candles', 'Rose', 'Palm Wax', 399, null, 25, 160, 90, ''],
  ['Floating Jasmine Set of 6', 'Decorative Candles', 'Jasmine', 'Paraffin Blend', 449, 399, 20, 120, 75, ''],
  ['Diwali Sandalwood Diya Set', 'Festive Collection', 'Sandalwood', 'Palm Wax', 999, 799, 35, 400, 60, 'FB'],
  ['Amber Vanilla Luxe Candle', 'Luxury Candles', 'Vanilla', 'Soy-Coconut', 1499, null, 60, 350, 22, 'N'],
  ['Wellness Self-Care Gift Box', 'Gift Sets', 'Eucalyptus', 'Soy', 1499, 1299, 85, 520, 4, 'F'],
  ['Citrus Blossom Jar Candle', 'Jar Candles', 'Citrus', 'Soy', 599, 549, 38, 190, 58, ''],
];

const flavourKey = (f) => (NOTES[f] ? f : 'Sweet');

async function main() {
  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@lumora.test').toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || 'ChangeMe@123';
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      name: 'Lumora Admin', email: adminEmail, role: 'ADMIN',
      passwordHash: await bcrypt.hash(adminPassword, 12),
    },
  });

  const catMap = {};
  for (const [i, name] of categories.entries()) {
    const c = await prisma.category.upsert({
      where: { slug: slugify(name) },
      update: {},
      create: {
        name, slug: slugify(name), sortOrder: i,
        description: `Explore our ${name.toLowerCase()} range, handcrafted in small batches.`,
        imageUrl: `/images/categories/${slugify(name)}.svg`,
      },
    });
    catMap[name] = c.id;
  }

  for (const [i, p] of products.entries()) {
    const [name, cat, fragrance, wax, price, disc, burn, grams, stock, flags] = p;
    const slug = slugify(name);
    const note = NOTES[flavourKey(fragrance)];
    const data = {
      name, slug,
      shortDescription: `Hand-poured ${wax.toLowerCase()} wax candle with ${note}.`,
      description:
        `${name} is hand-poured in small batches using ${wax.toLowerCase()} wax and a cotton wick for a clean, even burn. ` +
        `Expect ${note}. Burns for up to ${burn} hours. Trim the wick to 5 mm before each use and never leave a burning candle unattended.`,
      price, discountPrice: disc, sku: `LUM-${String(i + 1).padStart(3, '0')}`,
      fragrance, waxType: wax, burnTimeHours: burn, weightGrams: grams,
      dimensions: grams > 300 ? '9 x 9 x 10 cm' : '8 x 8 x 9 cm',
      stockQuantity: stock,
      isFeatured: flags.includes('F'), isBestseller: flags.includes('B'), isNewArrival: flags.includes('N'),
      soldCount: flags.includes('B') ? 120 + i * 7 : 10 + i * 3,
      categoryId: catMap[cat],
    };
    const product = await prisma.product.upsert({ where: { slug }, update: {}, create: data });
    const existing = await prisma.productImage.count({ where: { productId: product.id } });
    if (!existing) {
      await prisma.productImage.createMany({
        data: [1, 2, 3].map((n) => ({
          productId: product.id, url: `/images/products/${slug}-${n}.svg`,
          alt: `${name} view ${n}`, sortOrder: n - 1, isPrimary: n === 1,
        })),
      });
    }
  }

  const nextYear = new Date(); nextYear.setFullYear(nextYear.getFullYear() + 1);
  const coupons = [
    { code: 'WELCOME10', description: '10% off your first order', discountType: 'PERCENTAGE', discountValue: 10, minOrderAmount: 499, maxDiscount: 200, perUserLimit: 1 },
    { code: 'SAVE15', description: '15% off orders above Rs 999', discountType: 'PERCENTAGE', discountValue: 15, minOrderAmount: 999, maxDiscount: 300, perUserLimit: 3 },
    { code: 'FESTIVE20', description: '20% off festive season orders', discountType: 'PERCENTAGE', discountValue: 20, minOrderAmount: 1499, maxDiscount: 500, perUserLimit: 2, usageLimit: 500, expiresAt: nextYear },
  ];
  for (const c of coupons) {
    await prisma.coupon.upsert({ where: { code: c.code }, update: {}, create: c });
  }

  console.log(`Seeded: ${categories.length} categories, ${products.length} products, ${coupons.length} coupons, admin ${adminEmail}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
