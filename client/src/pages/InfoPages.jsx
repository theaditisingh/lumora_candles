import { useState } from 'react';
import { useForm } from 'react-hook-form';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import usePageMeta from '../hooks/usePageMeta';

const Page = ({ title, intro, children }) => (
  <div className="container-x max-w-3xl py-14"><h1 className="text-4xl">{title}</h1>{intro && <p className="mt-3 text-lg text-stone">{intro}</p>}<div className="mt-8 space-y-5 leading-relaxed">{children}</div></div>
);
const H = ({ children }) => <h2 className="pt-2 text-2xl">{children}</h2>;

export function About() {
  usePageMeta('About us', 'Lumora Candles makes small-batch soy and scented candles, poured by hand.');
  return (
    <Page title="About Lumora" intro="We make candles for the quiet moments that make a home feel like yours.">
      <p>Lumora began with a simple idea: a candle should smell lovely, burn cleanly and look good on a shelf. Every candle is poured by hand in small batches, using soy-based wax, cotton wicks and fragrance oils chosen for a soft, lasting scent.</p>
      <H>How we make them</H><p>Wax is melted slowly, scented at the right temperature and poured by hand. Each candle then rests so it cures evenly, which is why it burns well from the first light to the last.</p>
      <H>Burn safely</H><p>Trim the wick to 5 mm before each burn, keep candles away from drafts and anything flammable, and never leave a burning candle unattended.</p>
    </Page>
  );
}

const FAQS = [
  ['How long do the candles burn?', 'Burn time is listed on every product page. Most of our candles burn for 35 to 60 hours.'],
  ['Do you ship across India?', 'Yes. Orders ship within two working days. Shipping is free above ₹999 and ₹99 below that.'],
  ['Can I pay on delivery?', 'Cash on delivery is available within India for orders up to the limit shown at checkout.'],
  ['Can I cancel an order?', 'Yes, until it has been shipped. Open the order in My account and choose Cancel order.'],
  ['What if my candle arrives damaged?', 'Write to us through the contact page within 48 hours with a photo, and we will arrange a replacement or refund.'],
  ['Are your candles soy?', 'Most are soy or soy-coconut. The wax type is shown on every product page.'],
];
export function Faq() {
  usePageMeta('FAQ', 'Answers about shipping, payment, cancellations and candle care.');
  return <Page title="Frequently asked questions">{FAQS.map(([q, a]) => <details key={q} className="rounded-xl bg-paper p-5"><summary className="cursor-pointer font-semibold">{q}</summary><p className="mt-2 text-stone">{a}</p></details>)}</Page>;
}

export function Contact() {
  usePageMeta('Contact us', 'Questions about an order or a candle? Write to Lumora Candles.');
  const { toast } = useToast();
  const [sent, setSent] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const submit = async (d) => { try { await api.post('/contact', d); setSent(true); reset(); } catch (e) { toast(e.userMessage, 'error'); } };
  const err = (k) => errors[k] && <span className="text-xs text-red-700">{errors[k].message}</span>;
  return (
    <Page title="Contact us" intro="Questions about an order or a candle? We usually reply within two working days.">
      {sent ? <p className="rounded-xl bg-paper p-6">Thank you. Your message has reached us.</p> : (
        <form onSubmit={handleSubmit(submit)} className="space-y-4 rounded-2xl bg-paper p-6" noValidate>
          <label className="block text-sm font-medium">Name<input className="input mt-1" {...register('name', { required: 'Enter your name' })} />{err('name')}</label>
          <label className="block text-sm font-medium">Email<input type="email" className="input mt-1" {...register('email', { required: 'Enter your email', pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email' } })} />{err('email')}</label>
          <label className="block text-sm font-medium">Subject (optional)<input className="input mt-1" {...register('subject')} /></label>
          <label className="block text-sm font-medium">Message<textarea rows="5" className="input mt-1" {...register('message', { required: 'Write a message', minLength: { value: 10, message: 'Message is too short' } })} />{err('message')}</label>
          <button className="btn-primary">Send message</button>
        </form>)}
    </Page>
  );
}

const POLICIES = {
  'shipping-policy': ['Shipping policy', [['Delivery', 'Orders are packed and dispatched within two working days. Delivery usually takes 3 to 7 working days depending on your location.'], ['Shipping charges', 'Shipping is free on orders of ₹999 and above. Below that, a flat ₹99 applies.'], ['Tracking', 'Once your order ships, a tracking number appears on the order page in My account.']]],
  'refund-policy': ['Refund & cancellation policy', [['Cancellations', 'You can cancel an order until it ships. Prepaid orders are refunded to the original payment method.'], ['Damaged or wrong items', 'Contact us within 48 hours of delivery with photos. We will replace the item or refund you.'], ['Refund timing', 'Approved refunds are processed within 5 to 7 working days, depending on your bank.']]],
  'privacy-policy': ['Privacy policy', [['What we collect', 'Your name, contact details, delivery address and order history, so we can fulfil your orders.'], ['Payments', 'Online payments are handled by Razorpay. We never see or store your card details.'], ['Your data', 'We do not sell your data. Write to us to access or delete your account information.']]],
  terms: ['Terms & conditions', [['Orders', 'An order is confirmed once payment succeeds, or when a cash-on-delivery order is placed. Prices are in Indian rupees and GST is added at checkout.'], ['Product use', 'Burn candles as directed and never leave them unattended.'], ['Changes', 'We may update these terms. The version published on this page applies.']]],
};
export function Policy({ slug }) {
  const [title, sections] = POLICIES[slug];
  usePageMeta(title);
  return <Page title={title}>{sections.map(([h, t]) => <div key={h}><H>{h}</H><p className="mt-1 text-stone">{t}</p></div>)}</Page>;
}

export function Newsletter() {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const submit = async (e) => { e.preventDefault(); try { await api.post('/newsletter', { email }); toast('Thanks for subscribing'); setEmail(''); } catch (er) { toast(er.userMessage, 'error'); } };
  return (
    <form onSubmit={submit} className="mt-5 flex max-w-xs gap-2">
      <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Your email" aria-label="Email for newsletter" className="input bg-paper/10 text-paper placeholder:text-paper/50" />
      <button className="btn bg-wax px-4 py-2.5 text-smoke hover:bg-wax/90">Join</button>
    </form>
  );
}
