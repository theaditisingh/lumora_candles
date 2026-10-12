// End-to-end API check. Needs the API running and the database seeded:  npm run test:smoke
// Creates one throwaway customer account (smoke_<time>@example.com) and one order that it cancels again.
const API = process.env.API_URL || 'http://localhost:5000/api';
let pass = 0; let fail = 0;

const call = async (method, path, { body, token } = {}) => {
  const r = await fetch(API + path, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body ? JSON.stringify(body) : undefined });
  let j = {}; try { j = await r.json(); } catch (_) { /* no body */ }
  return { status: r.status, data: j.data, message: j.message };
};
const check = (name, ok, extra = '') => { if (ok) { pass += 1; console.log(`PASS  ${name}`); } else { fail += 1; console.log(`FAIL  ${name} ${extra}`); } };

(async () => {
  check('API is healthy', (await call('GET', '/health')).status === 200);
  const cats = await call('GET', '/categories');
  check('13 categories are seeded', cats.data?.categories?.length >= 13);
  const found = await call('GET', '/products?search=vanilla&sort=price_asc');
  check('product search and sorting', found.data?.products?.length > 0);
  const prod = found.data.products[0];

  check('guests are blocked from the admin API (401)', (await call('GET', '/admin/dashboard')).status === 401);
  const email = `smoke_${Date.now()}@example.com`;
  const reg = await call('POST', '/auth/register', { body: { name: 'Smoke Test', email, password: 'Smoke1234' } });
  check('customer registration', reg.status === 201, reg.message);
  const token = reg.data?.token;
  check('customers are blocked from the admin API (403)', (await call('GET', '/admin/dashboard', { token })).status === 403);
  check('wrong password is rejected', (await call('POST', '/auth/login', { body: { email, password: 'wrong' } })).status === 401);

  const stock = async () => (await call('GET', `/products/${prod.slug}`)).data.product.stockQuantity;
  const before = await stock();
  const add = await call('POST', '/cart', { token, body: { productId: prod.id, quantity: 2 } });
  check('add to cart', add.status === 201, add.message);
  check('cart subtotal is calculated by the server', add.data?.totals?.subtotal === prod.effectivePrice * 2);
  const cp = await call('POST', '/cart/coupon', { token, body: { code: 'WELCOME10' } });
  check('coupon WELCOME10 applies', cp.status === 200 && cp.data.totals.discount > 0, cp.message);

  const order = await call('POST', '/orders', { token, body: {
    customer: { name: 'Smoke Test', email, phone: '9876543210' },
    shipping: { line1: '12 MG Road', city: 'Ghaziabad', state: 'Uttar Pradesh', pincode: '201001', country: 'India' }, paymentMethod: 'COD' } });
  check('COD order is placed and confirmed', order.status === 201 && order.data?.order?.status === 'CONFIRMED', order.message);
  check('stock is reduced by the order', (await stock()) === before - 2);
  check('cart is emptied after ordering', (await call('GET', '/cart', { token })).data?.itemCount === 0);
  const cancel = await call('PUT', `/orders/${order.data.order.id}/cancel`, { token, body: {} });
  check('order can be cancelled', cancel.status === 200, cancel.message);
  check('stock is restored after cancelling', (await stock()) === before);

  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error('Could not run the tests. Is the API running?', e.message); process.exit(1); });
