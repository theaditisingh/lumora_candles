import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag, Lock } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import ProductImage from '../components/ProductImage';
import { money } from '../utils/format';
import usePageMeta from '../hooks/usePageMeta';

export function Summary({ totals, coupon }) {
  const row = (l, v, cls = '') => <div className={`flex justify-between ${cls}`}><dt>{l}</dt><dd>{v}</dd></div>;
  return (
    <dl className="space-y-2.5 text-sm">
      {row('Subtotal', money(totals.subtotal))}
      {totals.discount > 0 && row(`Discount${coupon ? ` (${coupon.code})` : ''}`, `−${money(totals.discount)}`, 'text-green-700')}
      {row(`GST (${totals.gstRate}%)`, money(totals.tax))}
      {row('Shipping', totals.shipping === 0 ? 'Free' : money(totals.shipping))}
      {totals.amountForFreeShipping > 0 && <p className="text-xs text-fig">Add {money(totals.amountForFreeShipping)} more for free shipping.</p>}
      {row('Total', money(totals.total), 'border-t border-sand/50 pt-3 text-lg font-semibold')}
    </dl>
  );
}

export default function Cart() {
  usePageMeta('Your cart');
  const { items, subtotal, totals, server, update, remove, applyCoupon, removeCoupon } = useCart();
  const { user } = useAuth();
  const nav = useNavigate();
  const [code, setCode] = useState('');

  if (items.length === 0) return (
    <div className="container-x py-24 text-center">
      <ShoppingBag size={48} className="mx-auto text-sand" />
      <h1 className="mt-4 section-title">Your cart is empty</h1>
      <p className="mt-2 text-stone">Find a scent you love and it will wait for you here.</p>
      <Link to="/shop" className="btn-primary mt-8">Browse candles</Link>
    </div>
  );

  const checkout = () => (user ? nav('/checkout') : nav('/login', { state: { from: '/checkout' } }));
  return (
    <div className="container-x py-10">
      <h1 className="section-title">Your cart</h1>
      <p className="section-sub">{items.length} item{items.length > 1 ? 's' : ''} in your cart</p>
      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_22rem]">
        <ul className="divide-y divide-sand/50">
          {items.map((l) => (
            <li key={l.id} className="flex gap-4 py-5 first:pt-0">
              <Link to={`/product/${l.product.slug}`}><ProductImage product={l.product} className="h-24 w-24 rounded-xl border border-sand/30 shadow-sm" /></Link>
              <div className="flex flex-1 flex-col">
                <Link to={`/product/${l.product.slug}`} className="font-display text-lg hover:text-fig transition-colors">{l.product.name}</Link>
                <p className="text-sm text-stone">{money(l.product.effectivePrice)} each</p>
                {l.available === false && <p className="mt-1 text-xs font-medium text-red-700">Not enough stock. Reduce the quantity to continue.</p>}
                <div className="mt-auto flex items-center justify-between gap-3 pt-3">
                  <div className="inline-flex items-center rounded-full border border-sand bg-paper shadow-sm" role="group" aria-label="Quantity">
                    <button className="p-2.5 hover:text-fig transition-colors" aria-label="Decrease quantity" disabled={l.quantity <= 1} onClick={() => update(l, l.quantity - 1)}><Minus size={14} /></button>
                    <span className="w-7 text-center text-sm font-semibold">{l.quantity}</span>
                    <button className="p-2.5 hover:text-fig transition-colors" aria-label="Increase quantity" onClick={() => update(l, l.quantity + 1)}><Plus size={14} /></button>
                  </div>
                  <p className="font-semibold">{money(l.product.effectivePrice * l.quantity)}</p>
                  <button onClick={() => remove(l)} aria-label={`Remove ${l.product.name}`} className="rounded-full p-2 text-stone transition-colors hover:bg-red-50 hover:text-red-700"><Trash2 size={16} /></button>
                </div>
              </div>
            </li>
          ))}
        </ul>
        <aside className="h-fit card">
          <h2 className="mb-4 font-display text-xl">Order summary</h2>
          {user && totals ? (
            <>
              <form onSubmit={(e) => { e.preventDefault(); if (code.trim()) applyCoupon(code.trim()).then(() => setCode('')); }} className="mb-5 flex gap-2">
                <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Coupon code" aria-label="Coupon code" className="input uppercase" />
                <button className="btn-ghost btn-sm">Apply</button>
              </form>
              {server?.coupon && <p className="mb-3 text-sm">Coupon <b className="text-fig">{server.coupon.code}</b> applied. <button className="font-semibold text-fig underline" onClick={removeCoupon}>Remove</button></p>}
              {server?.couponError && <p className="mb-3 text-xs text-red-700">{server.couponError}</p>}
              <Summary totals={totals} coupon={server?.coupon} />
            </>
          ) : (
            <><div className="flex justify-between text-sm"><span>Subtotal</span><span className="font-semibold">{money(subtotal)}</span></div><p className="mt-2 text-xs text-stone">Log in at checkout to apply coupons and see GST and shipping.</p></>
          )}
          <button className="btn-primary mt-6 w-full" onClick={checkout} disabled={server?.hasUnavailable}>
            <Lock size={14} />Checkout
          </button>
          <Link to="/shop" className="mt-3 block text-center text-sm text-fig hover:underline">Continue shopping</Link>
        </aside>
      </div>
    </div>
  );
}
