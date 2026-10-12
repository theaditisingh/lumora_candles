import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Lock, Shield } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { payOrder } from '../utils/razorpay';
import { Summary } from './Cart';
import ProductImage from '../components/ProductImage';
import { money } from '../utils/format';
import usePageMeta from '../hooks/usePageMeta';

const STEPS = ['Contact', 'Shipping', 'Payment'];
const FIELDS = [['name', 'email', 'phone'], ['line1', 'line2', 'city', 'state', 'pincode', 'country'], ['paymentMethod']];

function F({ label, error, children }) { return <label className="block text-sm font-medium">{label}<div className="mt-1.5">{children}</div>{error && <p className="mt-1 text-xs text-red-700" role="alert">{error.message}</p>}</label>; }

export default function Checkout() {
  usePageMeta('Checkout');
  const { user, loading } = useAuth();
  const { server, refresh } = useCart();
  const { toast } = useToast();
  const nav = useNavigate();
  const [step, setStep] = useState(0);
  const [cfg, setCfg] = useState(null);
  const [busy, setBusy] = useState(false);
  const { register, handleSubmit, trigger, watch, formState: { errors } } = useForm({ defaultValues: { name: user?.name || '', email: user?.email || '', phone: user?.phone || '', country: 'India', paymentMethod: '' } });

  useEffect(() => { api.get('/payments/config').then((r) => setCfg(r.data.data)).catch(() => {}); }, []);
  if (loading) return null;
  if (!user) return <Navigate to="/login" state={{ from: '/checkout' }} replace />;
  if (!server) return <div className="container-x py-24 text-center text-stone">Loading your cart…</div>;
  if (server.items.length === 0) return <div className="container-x py-24 text-center"><h1 className="text-3xl">Your cart is empty</h1><Link to="/shop" className="btn-primary mt-6">Browse candles</Link></div>;
  if (server.hasUnavailable) return <Navigate to="/cart" replace />;

  const total = server.totals.total;
  const india = (watch('country') || '').trim().toLowerCase() === 'india';
  const codOk = cfg?.codEnabled && india && total <= cfg.codMaxOrderValue;
  const next = async () => { if (await trigger(FIELDS[step])) setStep(step + 1); };

  const place = async (d) => {
    setBusy(true);
    try {
      const body = { customer: { name: d.name, email: d.email, phone: d.phone }, shipping: { line1: d.line1, line2: d.line2, city: d.city, state: d.state, pincode: d.pincode, country: d.country }, paymentMethod: d.paymentMethod };
      const order = (await api.post('/orders', body)).data.data.order;
      await refresh();
      if (d.paymentMethod === 'COD') nav(`/order-success/${order.id}`);
      else await payOrder({ orderId: order.id, navigate: nav, toast });
    } catch (e) { toast(e.userMessage, 'error'); } finally { setBusy(false); }
  };

  const req = (m) => ({ required: m });
  return (
    <div className="container-x py-10">
      <h1 className="section-title">Checkout</h1>
      <ol className="mt-6 flex gap-2 text-sm" aria-label="Checkout steps">{STEPS.map((s, i) => (
        <li key={s} aria-current={i === step ? 'step' : undefined} className={`flex items-center gap-1.5 rounded-full px-4 py-2 font-medium transition-colors ${i === step ? 'bg-fig text-paper shadow-sm' : i < step ? 'bg-fig/10 text-fig' : 'border border-sand/60 text-stone'}`}>{i < step && '✓ '}{s}</li>
      ))}</ol>
      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_22rem]">
        <form onSubmit={handleSubmit(place)} className="card space-y-5" noValidate>
          {step === 0 && <>
            <h2 className="font-display text-xl mb-1">Contact details</h2>
            <F label="Full name" error={errors.name}><input className="input" autoComplete="name" {...register('name', req('Enter your full name'))} /></F>
            <F label="Email" error={errors.email}><input type="email" className="input" autoComplete="email" {...register('email', { ...req('Enter your email'), pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email' } })} /></F>
            <F label="Phone" error={errors.phone}><input type="tel" className="input" autoComplete="tel" {...register('phone', { ...req('Enter your phone number'), pattern: { value: /^[0-9+\-\s]{10,15}$/, message: 'Enter a valid phone number' } })} /></F>
          </>}
          {step === 1 && <>
            <h2 className="font-display text-xl mb-1">Shipping address</h2>
            <F label="Address" error={errors.line1}><input className="input" autoComplete="address-line1" {...register('line1', { ...req('Enter your address'), minLength: { value: 5, message: 'Address is too short' } })} /></F>
            <F label="Apartment, suite (optional)"><input className="input" autoComplete="address-line2" {...register('line2')} /></F>
            <div className="grid gap-4 sm:grid-cols-2">
              <F label="City" error={errors.city}><input className="input" {...register('city', req('Enter your city'))} /></F>
              <F label="State" error={errors.state}><input className="input" {...register('state', req('Enter your state'))} /></F>
              <F label="Pincode" error={errors.pincode}><input className="input" inputMode="numeric" {...register('pincode', { ...req('Enter your pincode'), pattern: { value: /^[0-9A-Za-z\- ]{4,10}$/, message: 'Enter a valid pincode' } })} /></F>
              <F label="Country" error={errors.country}><input className="input" {...register('country', req('Enter your country'))} /></F>
            </div>
          </>}
          {step === 2 && <fieldset>
            <legend className="mb-4 font-display text-xl">Payment method</legend>
            {cfg?.razorpayEnabled && <label className="mb-3 flex cursor-pointer gap-3 rounded-xl border border-sand/60 bg-paper p-4 transition-all has-[:checked]:border-fig has-[:checked]:ring-1 has-[:checked]:ring-fig/20 has-[:checked]:shadow-sm"><input type="radio" value="RAZORPAY" className="mt-1 accent-fig" {...register('paymentMethod', req('Choose a payment method'))} /><span><b>Pay online</b><span className="block text-sm text-stone">UPI, credit and debit cards, net banking and wallets, through Razorpay.{cfg.testMode && ' Test mode: no real money is charged.'}</span></span></label>}
            {codOk && <label className="mb-3 flex cursor-pointer gap-3 rounded-xl border border-sand/60 bg-paper p-4 transition-all has-[:checked]:border-fig has-[:checked]:ring-1 has-[:checked]:ring-fig/20 has-[:checked]:shadow-sm"><input type="radio" value="COD" className="mt-1 accent-fig" {...register('paymentMethod', req('Choose a payment method'))} /><span><b>Cash on delivery</b><span className="block text-sm text-stone">Pay when your order arrives. Available in India for orders up to ₹{cfg.codMaxOrderValue.toLocaleString('en-IN')}.</span></span></label>}
            {cfg && !cfg.razorpayEnabled && !codOk && <p className="text-sm text-red-700">No payment method is available for this order right now.</p>}
            {errors.paymentMethod && <p className="text-xs text-red-700" role="alert">{errors.paymentMethod.message}</p>}
          </fieldset>}
          <div className="flex justify-between pt-3">
            {step > 0 ? <button type="button" className="btn-ghost" onClick={() => setStep(step - 1)}>Back</button> : <Link to="/cart" className="btn-ghost">Back to cart</Link>}
            {step < 2 ? <button type="button" className="btn-primary" onClick={next}>Continue</button> : <button className="btn-primary" disabled={busy}><Lock size={14} />{busy ? 'Placing order…' : 'Place order'}</button>}
          </div>
        </form>
        <aside className="h-fit card">
          <h2 className="mb-4 font-display text-xl">Your order</h2>
          <ul className="mb-4 space-y-2.5">{server.items.map((l) => (
            <li key={l.id} className="flex items-center gap-3 text-sm">
              <ProductImage product={l.product} className="h-12 w-12 rounded-lg border border-sand/30 shrink-0" />
              <div className="flex-1 min-w-0"><p className="font-medium truncate">{l.product.name}</p><p className="text-xs text-stone">×{l.quantity}</p></div>
              <span className="font-medium shrink-0">{money(l.product.effectivePrice * l.quantity)}</span>
            </li>
          ))}</ul>
          <div className="border-t border-sand/50 pt-4"><Summary totals={server.totals} coupon={server.coupon} /></div>
          <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-stone"><Shield size={12} />Secure checkout</div>
        </aside>
      </div>
    </div>
  );
}
