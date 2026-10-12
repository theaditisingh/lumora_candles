const { pricing } = require('../config/env');

const toPaise = (v) => Math.round(Number(v) * 100);
const effective = (p) =>
  p.discountPrice !== null && p.discountPrice !== undefined && Number(p.discountPrice) < Number(p.price) ? p.discountPrice : p.price;

// Single source of truth for cart and checkout totals. All maths in paise (integers) to avoid float errors.
// items: [{ product, quantity }]  couponDiscount: rupees
const computeTotals = (items, couponDiscount = 0) => {
  const subtotal = items.reduce((s, i) => s + toPaise(effective(i.product)) * i.quantity, 0);
  const discount = Math.min(toPaise(couponDiscount), subtotal);
  const taxable = subtotal - discount;
  const tax = Math.round((taxable * pricing.gstRate) / 100);
  const shipping = taxable === 0 || taxable >= pricing.freeShippingThreshold * 100 ? 0 : pricing.shippingFee * 100;
  const total = taxable + tax + shipping;
  const r = (n) => n / 100;
  return {
    subtotal: r(subtotal), discount: r(discount), tax: r(tax), shipping: r(shipping), total: r(total),
    gstRate: pricing.gstRate, freeShippingThreshold: pricing.freeShippingThreshold,
    amountForFreeShipping: taxable > 0 && shipping > 0 ? r(pricing.freeShippingThreshold * 100 - taxable) : 0,
  };
};

module.exports = { computeTotals, effective, toPaise };
