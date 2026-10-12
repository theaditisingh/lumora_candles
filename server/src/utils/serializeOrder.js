const n = (v) => (v === null || v === undefined ? v : Number(v));

const order = (o) => ({
  id: o.id, orderNumber: o.orderNumber, status: o.status, trackingNumber: o.trackingNumber,
  customer: { name: o.customerName, email: o.customerEmail, phone: o.customerPhone },
  shippingAddress: { line1: o.shipLine1, line2: o.shipLine2, city: o.shipCity, state: o.shipState, pincode: o.shipPincode, country: o.shipCountry },
  subtotal: n(o.subtotal), discount: n(o.discount), tax: n(o.tax), shippingFee: n(o.shippingFee), total: n(o.total),
  couponCode: o.couponCode, refundRequested: o.refundRequested, cancelReason: o.cancelReason,
  createdAt: o.createdAt, updatedAt: o.updatedAt,
  items: (o.items || []).map((i) => ({
    id: i.id, productId: i.productId, name: i.productName, sku: i.productSku, imageUrl: i.imageUrl,
    unitPrice: n(i.unitPrice), quantity: i.quantity, lineTotal: n(i.lineTotal),
  })),
  payment: o.payment ? {
    method: o.payment.method, status: o.payment.status, amount: n(o.payment.amount), paidAt: o.payment.paidAt,
    razorpayOrderId: o.payment.razorpayOrderId, razorpayPaymentId: o.payment.razorpayPaymentId,
  } : null,
});

const STEPS = ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'];
const LABELS = { CONFIRMED: 'Order confirmed', PROCESSING: 'Being prepared', SHIPPED: 'Shipped', OUT_FOR_DELIVERY: 'Out for delivery', DELIVERED: 'Delivered' };

const tracking = (o) => {
  const idx = STEPS.indexOf(o.status);
  return {
    orderNumber: o.orderNumber, status: o.status, trackingNumber: o.trackingNumber,
    steps: STEPS.map((s, i) => ({ key: s, label: LABELS[s], done: idx >= i, current: idx === i })),
    closed: ['CANCELLED', 'REFUNDED'].includes(o.status),
  };
};

module.exports = { order, tracking };
