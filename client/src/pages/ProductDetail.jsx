import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Minus, Plus, Heart, Truck, Shield, RotateCcw } from 'lucide-react';
import api from '../services/api';
import ProductImage from '../components/ProductImage';
import ProductCard from '../components/ProductCard';
import Stars from '../components/Stars';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { money } from '../utils/format';
import usePageMeta from '../hooks/usePageMeta';

const promises = [
  [Truck, 'Free shipping over ₹999'],
  [Shield, 'Secure checkout'],
  [RotateCcw, 'Easy returns'],
];

export default function ProductDetail() {
  const { slug } = useParams();
  const nav = useNavigate();
  const { add } = useCart();
  const { has, toggle } = useWishlist();
  const [state, setState] = useState({ loading: true });
  const [reviews, setReviews] = useState([]);
  const [active, setActive] = useState(0);
  const [qty, setQty] = useState(1);
  const p = state.product;
  usePageMeta(p?.name, p?.shortDescription);

  useEffect(() => {
    setState({ loading: true }); setActive(0); setQty(1);
    api.get(`/products/${slug}`).then((r) => {
      setState({ product: r.data.data.product, related: r.data.data.related });
      api.get(`/products/${r.data.data.product.id}/reviews`).then((x) => setReviews(x.data.data.reviews)).catch(() => {});
    }).catch((e) => setState({ error: e.response?.status === 404 ? 'We could not find that candle.' : e.userMessage }));
  }, [slug]);

  // Product structured data for search engines
  useEffect(() => {
    if (!p) return undefined;
    const el = document.createElement('script');
    el.type = 'application/ld+json';
    el.text = JSON.stringify({ '@context': 'https://schema.org', '@type': 'Product', name: p.name, description: p.shortDescription, sku: p.sku, brand: { '@type': 'Brand', name: p.brand },
      offers: { '@type': 'Offer', priceCurrency: 'INR', price: p.effectivePrice, availability: p.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock' } });
    document.head.appendChild(el);
    return () => el.remove();
  }, [p]);

  if (state.loading) return <div className="container-x grid animate-pulse gap-10 py-12 md:grid-cols-2"><div className="aspect-square rounded-2xl bg-sand/50" /><div className="space-y-4"><div className="h-8 w-2/3 rounded bg-sand/50" /><div className="h-5 w-1/3 rounded bg-sand/50" /><div className="h-24 rounded bg-sand/50" /></div></div>;
  if (state.error) return <div className="container-x py-24 text-center"><h1 className="text-3xl">{state.error}</h1><Link to="/shop" className="btn-primary mt-6">Back to shop</Link></div>;

  const specs = [['Fragrance', p.fragrance], ['Wax', p.waxType], ['Burn time', `${p.burnTimeHours} hours`], ['Weight', `${p.weightGrams} g`], ['Dimensions', p.dimensions], ['SKU', p.sku]];
  const buyNow = async () => { if (await add(p, qty)) nav('/cart'); };

  return (
    <div className="container-x py-10">
      <nav className="mb-6 text-sm text-stone" aria-label="Breadcrumb"><Link to="/shop" className="hover:text-fig transition-colors">Shop</Link> <span className="mx-1.5 text-sand">/</span> <Link to={`/shop?category=${p.category.slug}`} className="hover:text-fig transition-colors">{p.category.name}</Link> <span className="mx-1.5 text-sand">/</span> <span className="text-smoke">{p.name}</span></nav>
      <div className="grid gap-10 md:grid-cols-2 lg:gap-14">
        {/* Images */}
        <div>
          <ProductImage product={p} image={p.images[active]} className="aspect-square rounded-2xl shadow-sm border border-sand/30" />
          {p.images.length > 1 && (
            <div className="mt-3 flex gap-2">{p.images.map((img, i) => (
              <button key={img.id} onClick={() => setActive(i)} aria-label={`Show image ${i + 1}`} aria-current={i === active} className={`h-16 w-16 overflow-hidden rounded-xl border-2 transition-all ${i === active ? 'border-fig shadow-sm' : 'border-transparent hover:border-sand'}`}><ProductImage product={p} image={img} className="h-full w-full" /></button>
            ))}</div>
          )}
        </div>
        {/* Info */}
        <div>
          <h1 className="font-display text-3xl leading-tight sm:text-4xl">{p.name}</h1>
          <div className="mt-3"><Stars value={p.ratingAverage} count={p.reviewCount} size={16} /></div>
          <div className="mt-5 flex items-baseline gap-3">
            <p className="text-3xl font-semibold">{money(p.effectivePrice)}</p>
            {p.discountPercent > 0 && <><span className="text-lg text-stone line-through">{money(p.price)}</span><span className="badge-fig">{p.discountPercent}% off</span></>}
          </div>
          <p className="mt-1 text-xs text-stone">Inclusive of all taxes. Shipping calculated at checkout.</p>
          <p className="mt-6 leading-relaxed text-stone">{p.description}</p>
          <p className={`mt-5 text-sm font-medium ${p.inStock ? 'text-green-700' : 'text-red-700'}`}>{!p.inStock ? 'Out of stock' : p.lowStock ? `Only ${p.stockQuantity} left — order soon` : '✓ In stock'}</p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center rounded-full border border-sand bg-paper shadow-sm" role="group" aria-label="Quantity">
              <button className="p-3 hover:text-fig transition-colors" aria-label="Decrease quantity" onClick={() => setQty(Math.max(1, qty - 1))}><Minus size={16} /></button>
              <span className="w-8 text-center text-sm font-semibold" aria-live="polite">{qty}</span>
              <button className="p-3 hover:text-fig transition-colors" aria-label="Increase quantity" onClick={() => setQty(Math.min(p.stockQuantity, qty + 1))}><Plus size={16} /></button>
            </div>
            <button className="btn-primary flex-1 sm:flex-none" disabled={!p.inStock} onClick={() => add(p, qty)}>Add to cart</button>
            <button className="btn-ghost flex-1 sm:flex-none" disabled={!p.inStock} onClick={buyNow}>Buy now</button>
            <button onClick={() => toggle(p)} aria-label={has(p.id) ? 'Remove from wishlist' : 'Save to wishlist'} className="rounded-full border border-sand p-3 transition-all hover:border-fig hover:text-fig"><Heart size={18} className={has(p.id) ? 'fill-fig text-fig' : ''} /></button>
          </div>
          {/* Trust signals */}
          <div className="mt-8 flex flex-wrap gap-4 border-t border-sand/50 pt-6">
            {promises.map(([Icon, text]) => <span key={text} className="inline-flex items-center gap-1.5 text-xs text-stone"><Icon size={14} className="text-fig" />{text}</span>)}
          </div>
          {/* Specs */}
          <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-3 border-t border-sand/50 pt-6 text-sm">{specs.map(([k, v]) => <div key={k}><dt className="text-stone">{k}</dt><dd className="font-medium">{v}</dd></div>)}</dl>
        </div>
      </div>

      {/* Reviews */}
      <section className="mt-20">
        <h2 className="section-title">Customer reviews</h2>
        {reviews.length === 0 ? <p className="mt-4 text-stone">No reviews yet. Customers who have received this candle can review it from their orders.</p> : (
          <div className="mt-6 grid gap-4 md:grid-cols-2">{reviews.map((r) => (
            <article key={r.id} className="card"><Stars value={r.rating} />{r.title && <h3 className="mt-2 font-sans font-semibold">{r.title}</h3>}<p className="mt-1 text-sm leading-relaxed text-stone">{r.comment}</p><p className="mt-3 text-xs text-stone">{r.author}{r.isVerifiedPurchase && <span className="ml-1 text-fig">· Verified purchase</span>}</p></article>
          ))}</div>
        )}
      </section>

      {/* Related */}
      {state.related?.length > 0 && (
        <section className="mt-20"><h2 className="section-title mb-8">You may also like</h2><div className="grid grid-cols-2 gap-x-5 gap-y-8 md:grid-cols-4">{state.related.map((r) => <ProductCard key={r.id} product={r} />)}</div></section>
      )}
    </div>
  );
}
