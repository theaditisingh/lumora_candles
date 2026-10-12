import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const Ctx = createContext(null);
export const useCart = () => useContext(Ctx);
const KEY = 'lumora_cart';
const readGuest = () => { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (_) { return []; } };

// Guests: cart lives in localStorage. Logged-in customers: cart lives on the server (source of truth for prices).
export function CartProvider({ children }) {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [guest, setGuest] = useState(readGuest);
  const [server, setServer] = useState(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setServer(null); return; }
    (async () => {
      try {
        const g = readGuest();
        const res = g.length
          ? await api.post('/cart/merge', { items: g.map((i) => ({ productId: i.productId, quantity: i.quantity })) })
          : await api.get('/cart');
        localStorage.removeItem(KEY); setGuest([]); setServer(res.data.data);
      } catch (_) { /* cart will load on next action */ }
    })();
  }, [user, authLoading]);

  useEffect(() => { if (!user) localStorage.setItem(KEY, JSON.stringify(guest)); }, [guest, user]);

  const items = user ? server?.items || [] : guest;
  const itemCount = items.reduce((s, i) => s + i.quantity, 0);
  const subtotal = user && server ? server.totals.subtotal : guest.reduce((s, i) => s + i.product.effectivePrice * i.quantity, 0);

  const run = async (fn, okMsg) => {
    try { const res = await fn(); setServer(res.data.data); if (okMsg) toast(okMsg); }
    catch (e) { toast(e.userMessage, 'error'); }
  };

  const add = useCallback(async (p, qty = 1) => {
    if (p.stockQuantity < 1) { toast('This candle is out of stock', 'error'); return false; }
    if (user) { await run(() => api.post('/cart', { productId: p.id, quantity: qty }), `${p.name} added to cart`); return true; }
    const existing = guest.find((i) => i.productId === p.id);
    const next = (existing?.quantity || 0) + qty;
    if (next > p.stockQuantity) { toast(`Only ${p.stockQuantity} of ${p.name} in stock`, 'error'); return false; }
    const snap = { id: p.id, productId: p.id, quantity: next, product: { id: p.id, name: p.name, slug: p.slug, price: p.price, effectivePrice: p.effectivePrice, stockQuantity: p.stockQuantity, fragrance: p.fragrance, images: (p.images || []).slice(0, 1) } };
    setGuest(existing ? guest.map((i) => (i.productId === p.id ? snap : i)) : [...guest, snap]);
    toast(`${p.name} added to cart`);
    return true;
  }, [user, guest]); // eslint-disable-line react-hooks/exhaustive-deps

  const update = async (line, qty) => {
    if (user) return run(() => api.put(`/cart/${line.id}`, { quantity: qty }));
    if (qty > line.product.stockQuantity) return toast(`Only ${line.product.stockQuantity} in stock`, 'error');
    setGuest(guest.map((i) => (i.productId === line.productId ? { ...i, quantity: qty } : i)));
  };
  const remove = async (line) => {
    if (user) return run(() => api.delete(`/cart/${line.id}`), 'Item removed');
    setGuest(guest.filter((i) => i.productId !== line.productId));
  };

  const refresh = async () => { if (!user) return; try { setServer((await api.get('/cart')).data.data); } catch (_) { /* ignore */ } };
  const applyCoupon = (code) => run(() => api.post('/cart/coupon', { code }), 'Coupon applied');
  const removeCoupon = () => run(() => api.delete('/cart/coupon'), 'Coupon removed');

  return <Ctx.Provider value={{ items, itemCount, subtotal, totals: user ? server?.totals : null, server, add, update, remove, refresh, applyCoupon, removeCoupon }}>{children}</Ctx.Provider>;
}
