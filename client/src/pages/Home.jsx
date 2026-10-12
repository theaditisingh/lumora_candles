import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Gift, Leaf, Truck, Flame, ArrowRight } from 'lucide-react';
import api from '../services/api';
import ProductCard, { ProductGridSkeleton } from '../components/ProductCard';
import { CandleArt } from '../components/ProductImage';
import usePageMeta from '../hooks/usePageMeta';

function Section({ title, subtitle, query, to }) {
  const [items, setItems] = useState(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    api.get(`/products?limit=4&${query}`).then((r) => setItems(r.data.data.products)).catch(() => setError(true));
  }, [query]);
  return (
    <section className="container-x mt-24">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div><h2 className="section-title">{title}</h2><p className="section-sub">{subtitle}</p></div>
        <Link to={to} className="group hidden shrink-0 items-center gap-1 text-sm font-semibold text-fig hover:underline sm:inline-flex">View all <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" /></Link>
      </div>
      {error ? <p className="card p-8 text-center text-sm text-stone">We could not load these candles. Please refresh the page.</p> : !items ? <ProductGridSkeleton count={4} /> : (
        <div className="grid grid-cols-2 gap-x-5 gap-y-8 lg:grid-cols-4">{items.map((p) => <ProductCard key={p.id} product={p} />)}</div>
      )}
      <Link to={to} className="btn-ghost mt-6 sm:hidden">View all</Link>
    </section>
  );
}

const reasons = [
  [Leaf, 'Poured in small batches', 'Soy-based wax and cotton wicks, hand-poured so every candle burns clean and even.'],
  [Gift, 'Ready to gift', 'Gift sets arrive boxed and wrapped. Add a note at checkout and we will include it.'],
  [Truck, 'Free shipping over ₹999', 'Orders ship within two working days with tracking, all across India.'],
];
const quotes = [
  ['The Vanilla Dream fills the whole living room without being heavy. It burned evenly right to the end.', 'Priya S., Pune'],
  ['I ordered the gift set for my sister and she has already asked where to buy more.', 'Rohan M., Delhi'],
  ['Midnight Oud smells like a hotel lobby in the best way. Packaging was solid, nothing arrived damaged.', 'Ananya K., Bengaluru'],
];

export default function Home() {
  usePageMeta('', 'Handcrafted soy and scented candles, gift sets and decor from Lumora Candles. Free shipping above Rs 999.');
  const [cats, setCats] = useState([]);
  useEffect(() => { api.get('/categories').then((r) => setCats(r.data.data.categories.filter((c) => c.productCount > 0).slice(0, 6))).catch(() => {}); }, []);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-paper via-oat to-paper">
        <div className="container-x grid items-center gap-10 py-16 md:grid-cols-2 md:py-24 lg:py-28">
          <div className="relative z-10">
            <span className="badge-wax mb-4"><Flame size={12} className="mr-1" />Handcrafted with love</span>
            <h1 className="text-5xl font-medium leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">Light up your<br /><span className="text-fig">moments</span></h1>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-stone">Handcrafted candles designed to make every space feel warmer, calmer and more beautiful.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/shop" className="btn-primary px-8 py-3.5 text-base">Shop candles</Link>
              <Link to="/shop?category=gift-sets" className="btn-ghost px-8 py-3.5 text-base">Explore collections</Link>
            </div>
          </div>
          <div className="mx-auto aspect-square w-full max-w-md overflow-hidden rounded-[2rem] bg-paper shadow-lg ring-1 ring-sand/40"><CandleArt fragrance="Vanilla" name="Lumora hero candle" /></div>
        </div>
      </section>

      {/* Categories */}
      {cats.length > 0 && (
        <section className="container-x mt-20">
          <h2 className="section-title text-center">Find your scent</h2>
          <p className="section-sub mx-auto text-center">Explore our curated collections</p>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {cats.map((c) => <Link key={c.id} to={`/shop?category=${c.slug}`} className="group rounded-2xl border border-sand/40 bg-paper px-4 py-6 text-center shadow-sm transition-all hover:border-fig hover:shadow-md hover:bg-fig hover:text-paper"><span className="font-display text-lg">{c.name}</span><span className="mt-1 block text-xs opacity-60">{c.productCount} candles</span></Link>)}
          </div>
        </section>
      )}

      <Section title="Featured candles" subtitle="Our current favourites" query="featured=true" to="/shop?featured=true" />
      <Section title="Best sellers" subtitle="What customers order again and again" query="bestseller=true&sort=bestselling" to="/shop?bestseller=true&sort=bestselling" />

      {/* Why Lumora */}
      <section className="container-x mt-24">
        <div className="rounded-3xl border border-sand/30 bg-paper p-8 sm:p-12">
          <h2 className="section-title text-center">Why Lumora</h2>
          <div className="mt-10 grid gap-8 md:grid-cols-3">
            {reasons.map(([Icon, t, d]) => (
              <div key={t} className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-fig/10"><Icon className="text-fig" size={22} /></div>
                <h3 className="mt-4 text-xl">{t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-stone">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Section title="New arrivals" subtitle="Just poured" query="newArrival=true&sort=newest" to="/shop?newArrival=true" />

      {/* Promo Banner */}
      <section className="container-x mt-24">
        <div className="overflow-hidden rounded-3xl bg-gradient-to-r from-fig-dark via-fig to-fig-dark px-6 py-14 text-center text-paper shadow-lg sm:px-12">
          <span className="badge bg-wax/20 text-wax mb-4">Limited time</span>
          <h2 className="text-3xl sm:text-4xl">Festive season is here</h2>
          <p className="mx-auto mt-3 max-w-lg text-paper/80">Take 20% off orders above ₹1,499 with code <b className="text-wax">FESTIVE20</b>, on gift sets and festive candles.</p>
          <Link to="/shop?category=festive-collection" className="btn mt-8 bg-paper text-fig hover:bg-oat shadow-md">Shop festive collection</Link>
        </div>
      </section>

      {/* Testimonials */}
      <section className="container-x mt-24">
        <h2 className="section-title text-center">Kind words</h2>
        <p className="section-sub mx-auto text-center">What our customers say</p>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {quotes.map(([q, a]) => <figure key={a} className="card"><blockquote className="text-[15px] leading-relaxed italic text-stone">"{q}"</blockquote><figcaption className="mt-5 flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-fig/10 font-display text-sm font-semibold text-fig">{a[0]}</div><span className="text-sm font-medium">{a}</span></figcaption></figure>)}
        </div>
      </section>
    </>
  );
}
