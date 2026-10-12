import { useEffect, useState } from 'react';
import { Link, Navigate, NavLink, Outlet, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { LayoutDashboard, Package, Heart, UserCircle, Shield, LogOut, ChevronRight, Menu, X } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useToast } from '../context/ToastContext';
import { payOrder } from '../utils/razorpay';
import { money } from '../utils/format';
import ProductImage from '../components/ProductImage';
import usePageMeta from '../hooks/usePageMeta';

export function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  const { pathname } = useLocation();
  if (loading) return <div className="container-x py-24 text-center text-stone">Loading…</div>;
  return user ? children : <Navigate to="/login" state={{ from: pathname }} replace />;
}

/* ─── Account sidebar layout ─── */
const NAV = [
  ['Dashboard', '/account', LayoutDashboard, true],
  ['My Orders', '/account/orders', Package],
  ['My Wishlist', '/account/wishlist', Heart],
  ['My Profile', '/account/profile', UserCircle],
  ['Account Security', '/account/security', Shield],
];

export function AccountLayout() {
  const { user, isAdmin, logout } = useAuth();
  const [mobileNav, setMobileNav] = useState(false);
  return (
    <div className="container-x py-8 lg:py-10">
      <div className="grid gap-8 lg:grid-cols-[15rem_1fr]">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 rounded-2xl border border-sand/40 bg-paper p-5 shadow-sm">
            <div className="mb-5 border-b border-sand/40 pb-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-fig/10 font-display text-lg font-semibold text-fig">{user?.name?.[0]?.toUpperCase()}</div>
              <p className="mt-2 font-display text-lg font-medium leading-tight">{user?.name}</p>
              <p className="text-xs text-stone truncate">{user?.email}</p>
            </div>
            <nav className="flex flex-col gap-0.5" aria-label="Account">
              {NAV.map(([label, to, Icon, end]) => (
                <NavLink key={to} to={to} end={end} className={({ isActive }) => `flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${isActive ? 'bg-fig/10 text-fig' : 'text-stone hover:bg-fig/5 hover:text-fig'}`}>
                  <Icon size={16} />{label}
                </NavLink>
              ))}
              {isAdmin && <Link to="/admin" className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-stone hover:bg-fig/5 hover:text-fig"><LayoutDashboard size={16} />Admin Panel</Link>}
              <button onClick={logout} className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-stone hover:bg-red-50 hover:text-red-700 mt-2">
                <LogOut size={16} />Log out
              </button>
            </nav>
          </div>
        </aside>

        {/* Mobile nav toggle */}
        <div className="lg:hidden">
          <button onClick={() => setMobileNav(!mobileNav)} className="btn-ghost btn-sm w-full justify-between" aria-expanded={mobileNav}>
            <span className="flex items-center gap-2"><Menu size={16} />Account menu</span>
            <ChevronRight size={14} className={`transition-transform ${mobileNav ? 'rotate-90' : ''}`} />
          </button>
          {mobileNav && (
            <nav className="mt-2 rounded-xl border border-sand/40 bg-paper p-3 shadow-sm" aria-label="Account mobile">
              {NAV.map(([label, to, Icon, end]) => (
                <NavLink key={to} to={to} end={end} onClick={() => setMobileNav(false)} className={({ isActive }) => `flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${isActive ? 'bg-fig/10 text-fig' : 'text-stone hover:bg-fig/5'}`}>
                  <Icon size={16} />{label}
                </NavLink>
              ))}
              {isAdmin && <Link to="/admin" onClick={() => setMobileNav(false)} className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-stone hover:bg-fig/5"><LayoutDashboard size={16} />Admin Panel</Link>}
              <button onClick={() => { logout(); setMobileNav(false); }} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-stone hover:bg-red-50 hover:text-red-700 mt-1"><LogOut size={16} />Log out</button>
            </nav>
          )}
        </div>

        {/* Content area */}
        <div className="min-w-0"><Outlet /></div>
      </div>
    </div>
  );
}

/* ─── Dashboard ─── */
export function AccountDashboard() {
  usePageMeta('My Dashboard');
  const { user } = useAuth();
  const [recentOrders, setRecentOrders] = useState(null);
  const [wishCount, setWishCount] = useState(0);
  useEffect(() => {
    api.get('/orders?page=1&limit=3').then((r) => setRecentOrders(r.data.data.orders)).catch(() => setRecentOrders([]));
    api.get('/wishlist').then((r) => setWishCount(r.data.data.items?.length || r.data.data.productIds?.length || 0)).catch(() => {});
  }, []);

  return (
    <>
      <h1 className="section-title">Welcome back, {user?.name?.split(' ')[0]}</h1>
      <p className="section-sub">Here's what's happening with your account.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Link to="/account/orders" className="card-hover flex items-center gap-4"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-fig/10"><Package size={20} className="text-fig" /></div><div><p className="text-2xl font-display font-semibold">{recentOrders?.length ?? '–'}</p><p className="text-xs text-stone">Recent orders</p></div></Link>
        <Link to="/account/wishlist" className="card-hover flex items-center gap-4"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-wax/15"><Heart size={20} className="text-wax" /></div><div><p className="text-2xl font-display font-semibold">{wishCount}</p><p className="text-xs text-stone">Saved items</p></div></Link>
        <Link to="/account/profile" className="card-hover flex items-center gap-4"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-fig/10"><UserCircle size={20} className="text-fig" /></div><div><p className="font-display text-sm font-semibold">{user?.name}</p><p className="text-xs text-stone">View profile</p></div></Link>
      </div>

      {/* Recent orders */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4"><h2 className="font-display text-xl">Recent Orders</h2><Link to="/account/orders" className="text-sm font-semibold text-fig hover:underline">View all</Link></div>
        {!recentOrders ? <p className="text-stone text-sm">Loading…</p> : recentOrders.length === 0 ? (
          <div className="card text-center py-10"><p className="text-stone">You haven't placed any orders yet.</p><Link to="/shop" className="btn-primary mt-4">Browse candles</Link></div>
        ) : (
          <ul className="space-y-3">{recentOrders.map((o) => (
            <li key={o.id}><Link to={`/account/orders/${o.id}`} className="card-hover flex flex-wrap items-center justify-between gap-3">
              <div><p className="font-semibold">{o.orderNumber}</p><p className="text-sm text-stone">{new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} · {o.items.length} item{o.items.length > 1 ? 's' : ''}</p></div>
              <div className="flex items-center gap-3"><Badge s={o.status} /><span className="font-semibold">{money(o.total)}</span><ChevronRight size={16} className="text-stone" /></div>
            </Link></li>
          ))}</ul>
        )}
      </div>
    </>
  );
}

/* ─── Profile ─── */
export function AccountProfile() {
  usePageMeta('My Profile');
  const { user, setUser } = useAuth();
  const { toast } = useToast();
  const { register, handleSubmit, formState: { errors } } = useForm({ defaultValues: { name: user.name, phone: user.phone || '' } });
  const save = async (d) => { try { const r = await api.put('/auth/me', d); setUser(r.data.data.user); toast('Profile updated'); } catch (e) { toast(e.userMessage, 'error'); } };
  return (
    <>
      <h1 className="section-title">My Profile</h1>
      <p className="section-sub">Manage your personal information.</p>
      <form onSubmit={handleSubmit(save)} className="mt-8 card space-y-5 max-w-xl" noValidate>
        <label className="block text-sm font-medium">Full name<input className="input mt-1.5" {...register('name', { required: 'Enter your name', minLength: { value: 2, message: 'Name is too short' } })} />{errors.name && <span className="mt-1 block text-xs text-red-700">{errors.name.message}</span>}</label>
        <label className="block text-sm font-medium">Email<input className="input mt-1.5 bg-oat/50 cursor-not-allowed" value={user.email} disabled readOnly /><span className="mt-1 block text-xs text-stone">Email cannot be changed.</span></label>
        <label className="block text-sm font-medium">Phone<input type="tel" className="input mt-1.5" {...register('phone', { pattern: { value: /^[0-9+\-\s]{10,15}$/, message: 'Enter a valid phone number' } })} />{errors.phone && <span className="mt-1 block text-xs text-red-700">{errors.phone.message}</span>}</label>
        <button className="btn-primary">Save changes</button>
      </form>
    </>
  );
}

/* ─── Security ─── */
export function AccountSecurity() {
  usePageMeta('Account Security');
  return (
    <>
      <h1 className="section-title">Account Security</h1>
      <p className="section-sub">Manage your password and account security.</p>
      <div className="mt-8 card max-w-xl">
        <h2 className="font-display text-xl">Password</h2>
        <p className="mt-2 text-sm text-stone">To change your password, use the reset link. We'll send an email with instructions to securely update your password.</p>
        <Link to="/forgot-password" className="btn-primary mt-5">Reset password</Link>
      </div>
    </>
  );
}

/* ─── Account Wishlist ─── */
export function AccountWishlist() {
  usePageMeta('My Wishlist');
  const { user } = useAuth();
  const { add } = useCart();
  const { ids, toggle } = useWishlist();
  const [items, setItems] = useState(null);
  useEffect(() => { if (user) api.get('/wishlist').then((r) => setItems(r.data.data.items)).catch(() => setItems([])); }, [user, ids]);

  if (items && items.length === 0) return (
    <>
      <h1 className="section-title">My Wishlist</h1>
      <p className="section-sub">Items you've saved for later.</p>
      <div className="mt-8 card py-12 text-center"><Heart size={40} className="mx-auto text-sand" /><p className="mt-4 text-stone">Nothing saved yet.</p><p className="mt-1 text-sm text-stone">Tap the heart on any candle to keep it here.</p><Link to="/shop" className="btn-primary mt-6">Browse candles</Link></div>
    </>
  );
  return (
    <>
      <h1 className="section-title">My Wishlist</h1>
      <p className="section-sub">{items ? `${items.length} saved item${items.length !== 1 ? 's' : ''}` : 'Loading…'}</p>
      <ul className="mt-8 space-y-3">
        {(items || []).map(({ id, product: p }) => (
          <li key={id} className="card-hover flex items-center gap-4">
            <Link to={`/product/${p.slug}`}><ProductImage product={p} className="h-20 w-20 rounded-xl" /></Link>
            <div className="flex-1 min-w-0">
              <Link to={`/product/${p.slug}`} className="font-display text-lg hover:text-fig transition-colors truncate block">{p.name}</Link>
              <p className="text-sm font-semibold mt-0.5">{money(p.effectivePrice)}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button className="btn-primary btn-sm" disabled={!p.inStock} onClick={async () => { if (await add(p)) toggle(p); }}>{p.inStock ? 'Move to cart' : 'Out of stock'}</button>
              <button className="text-sm text-stone hover:text-red-700 transition-colors" onClick={() => toggle(p)}>Remove</button>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}

/* ─── Badge and helpers ─── */
const Badge = ({ s }) => <span className={`badge ${['CANCELLED', 'REFUNDED'].includes(s) ? 'bg-red-100 text-red-800' : s === 'DELIVERED' ? 'bg-green-100 text-green-800' : 'bg-sand/70 text-smoke'}`}>{s.replace(/_/g, ' ')}</span>;
const date = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

/* ─── Orders ─── */
export function Orders() {
  usePageMeta('My Orders');
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  useEffect(() => { api.get(`/orders?page=${page}`).then((r) => setData({ orders: r.data.data.orders, meta: r.data.meta })).catch(() => setData({ orders: [], meta: {} })); }, [page]);
  return (
    <>
      <h1 className="section-title">My Orders</h1>
      <p className="section-sub">Track and manage your orders.</p>
      {!data ? <p className="mt-8 text-stone">Loading…</p> : data.orders.length === 0 ? (
        <div className="mt-8 card py-12 text-center"><Package size={40} className="mx-auto text-sand" /><p className="mt-4 text-stone">You haven't placed any orders yet.</p><Link to="/shop" className="btn-primary mt-5">Browse candles</Link></div>
      ) : (
        <>
          <ul className="mt-8 space-y-3">{data.orders.map((o) => (
            <li key={o.id}><Link to={`/account/orders/${o.id}`} className="card-hover flex flex-wrap items-center justify-between gap-3">
              <div><p className="font-semibold">{o.orderNumber}</p><p className="text-sm text-stone">{date(o.createdAt)} · {o.items.length} item{o.items.length > 1 ? 's' : ''}</p></div>
              <div className="flex items-center gap-3"><Badge s={o.status} /><span className="font-semibold">{money(o.total)}</span><ChevronRight size={16} className="text-stone" /></div>
            </Link></li>
          ))}</ul>
          {data.meta.totalPages > 1 && <div className="mt-6 flex justify-center gap-3"><button className="btn-ghost" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button><span className="btn text-sm">Page {page} of {data.meta.totalPages}</span><button className="btn-ghost" disabled={page >= data.meta.totalPages} onClick={() => setPage(page + 1)}>Next</button></div>}
        </>
      )}
    </>
  );
}

/* ─── Order detail ─── */
export function OrderDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { toast } = useToast();
  const [order, setOrder] = useState(null);
  const [track, setTrack] = useState(null);
  const [error, setError] = useState('');
  usePageMeta(order ? `Order ${order.orderNumber}` : 'Order');

  const load = () => Promise.all([api.get(`/orders/${id}`), api.get(`/orders/${id}/tracking`)])
    .then(([o, t]) => { setOrder(o.data.data.order); setTrack(t.data.data.tracking); }).catch((e) => setError(e.userMessage));
  useEffect(() => { load(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const act = async (fn, msg) => { try { await fn(); toast(msg); await load(); } catch (e) { toast(e.userMessage, 'error'); } };
  if (error) return <div className="py-16 text-center"><p className="text-stone">{error}</p><Link to="/account/orders" className="btn-primary mt-6">My orders</Link></div>;
  if (!order) return <div className="py-16 text-center text-stone">Loading…</div>;

  const a = order.shippingAddress;
  const canCancel = ['PENDING', 'CONFIRMED', 'PROCESSING'].includes(order.status);
  const unpaidOnline = order.payment?.method === 'RAZORPAY' && order.payment.status !== 'PAID' && order.status === 'PENDING';
  const canRefund = order.payment?.status === 'PAID' && ['DELIVERED', 'CANCELLED'].includes(order.status) && !order.refundRequested;
  return (
    <>
      <Link to="/account/orders" className="inline-flex items-center gap-1 text-sm text-fig hover:underline mb-4">← All orders</Link>
      <div className="flex flex-wrap items-center gap-3"><h1 className="font-display text-2xl sm:text-3xl">{order.orderNumber}</h1><Badge s={order.status} /></div>
      <p className="text-sm text-stone mt-1">Placed on {date(order.createdAt)}</p>

      {track && !track.closed && (
        <ol className="mt-6 grid gap-1.5 sm:grid-cols-5" aria-label="Order progress">{track.steps.map((s) => (
          <li key={s.key} className={`rounded-xl px-3 py-2.5 text-center text-sm font-medium transition-colors ${s.done ? 'bg-fig text-paper shadow-sm' : 'bg-paper text-stone border border-sand/40'}`}>{s.label}</li>
        ))}</ol>
      )}
      {order.trackingNumber && <p className="mt-3 text-sm">Tracking number: <b>{order.trackingNumber}</b></p>}

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_20rem]">
        <ul className="divide-y divide-sand/50 card">{order.items.map((i) => (
          <li key={i.id} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0"><ProductImage product={{ name: i.name, images: i.imageUrl ? [{ url: i.imageUrl }] : [] }} className="h-16 w-16 rounded-xl" /><div className="flex-1"><p className="font-display text-lg">{i.name}</p><p className="text-sm text-stone">{money(i.unitPrice)} × {i.quantity}</p></div><p className="font-semibold">{money(i.lineTotal)}</p></li>
        ))}</ul>
        <div className="space-y-4">
          <dl className="card space-y-2 text-sm">
            {[['Subtotal', money(order.subtotal)], ...(order.discount > 0 ? [[`Discount (${order.couponCode})`, `−${money(order.discount)}`]] : []), ['GST', money(order.tax)], ['Shipping', order.shippingFee ? money(order.shippingFee) : 'Free']].map(([k, v]) => <div key={k} className="flex justify-between"><dt>{k}</dt><dd>{v}</dd></div>)}
            <div className="flex justify-between border-t border-sand/50 pt-3 text-lg font-semibold"><dt>Total</dt><dd>{money(order.total)}</dd></div>
            <p className="pt-1 text-xs text-stone">{order.payment?.method === 'COD' ? 'Cash on delivery' : 'Online payment'} · {order.payment?.status}</p>
          </dl>
          <div className="card text-sm"><h2 className="mb-1 font-sans font-semibold">Shipping to</h2><p>{order.customer.name}<br />{a.line1}{a.line2 && `, ${a.line2}`}<br />{a.city}, {a.state} {a.pincode}<br />{a.country}</p></div>
          <div className="flex flex-col gap-2">
            {unpaidOnline && <button className="btn-primary" onClick={() => payOrder({ orderId: order.id, navigate: nav, toast })}>Pay now</button>}
            {canCancel && <button className="btn-ghost" onClick={() => window.confirm('Cancel this order? This cannot be undone.') && act(() => api.put(`/orders/${order.id}/cancel`, {}), 'Order cancelled')}>Cancel order</button>}
            {canRefund && <button className="btn-ghost" onClick={() => act(() => api.post(`/orders/${order.id}/refund-request`), 'Refund requested')}>Request refund</button>}
            {order.refundRequested && <p className="text-sm text-stone">Refund requested. We will update you by email.</p>}
          </div>
        </div>
      </div>
    </>
  );
}

/* ─── Order success & payment failed ─── */
export function OrderSuccess() {
  usePageMeta('Order confirmed');
  const { id } = useParams();
  const { refresh } = useCart();
  const [o, setO] = useState(null);
  useEffect(() => { refresh(); api.get(`/orders/${id}`).then((r) => setO(r.data.data.order)).catch(() => {}); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="container-x py-20 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mb-6"><Package size={28} className="text-green-700" /></div>
      <h1 className="section-title">Thank you for your order</h1>
      {o && <p className="mt-3 text-stone max-w-md mx-auto">Order <b>{o.orderNumber}</b> is {o.status === 'CONFIRMED' ? 'confirmed' : 'being processed'}. Total {money(o.total)} · {o.payment?.method === 'COD' ? 'pay on delivery' : o.payment?.status === 'PAID' ? 'paid online' : 'payment pending'}.</p>}
      <div className="mt-8 flex flex-wrap justify-center gap-3"><Link to={`/account/orders/${id}`} className="btn-primary">Track order</Link><Link to="/shop" className="btn-ghost">Keep shopping</Link></div>
    </div>
  );
}

export function PaymentFailed() {
  usePageMeta('Payment failed');
  const [p] = useSearchParams();
  const id = p.get('order');
  return (
    <div className="container-x py-20 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 mb-6"><X size={28} className="text-red-700" /></div>
      <h1 className="section-title">Payment did not go through</h1>
      <p className="mx-auto mt-3 max-w-md text-stone">No money was taken for this attempt. Your items are held for 30 minutes, so you can try again.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">{id && <Link to={`/account/orders/${id}`} className="btn-primary">Try payment again</Link>}<Link to="/cart" className="btn-ghost">Back to cart</Link></div>
    </div>
  );
}

/* ─── Legacy Account (redirect) ─── */
export function Account() { return <Navigate to="/account" replace />; }
