import { Link } from 'react-router-dom';
import { Heart, ShoppingBag } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import ProductImage from './ProductImage';
import Stars from './Stars';
import { useCart } from '../context/CartContext';
import { money } from '../utils/format';

export default function ProductCard({ product: p }) {
  const { add } = useCart();
  const { has, toggle } = useWishlist();
  return (
    <article className="group flex flex-col">
      <div className="relative">
        <Link to={`/product/${p.slug}`} className="relative block aspect-square overflow-hidden rounded-2xl border border-sand/30 shadow-sm">
          <ProductImage product={p} className="h-full w-full transition-transform duration-500 group-hover:scale-105" />
          {p.discountPercent > 0 && <span className="absolute left-3 top-3 rounded-full bg-fig px-2.5 py-1 text-xs font-semibold text-paper shadow-sm">{p.discountPercent}% off</span>}
          {!p.inStock && <span className="absolute inset-x-0 bottom-0 bg-smoke/80 py-2 text-center text-xs font-medium text-paper backdrop-blur-sm">Out of stock</span>}
        </Link>
        <button onClick={() => toggle(p)} aria-label={has(p.id) ? 'Remove from wishlist' : 'Add to wishlist'} aria-pressed={has(p.id)} className="absolute right-3 top-3 rounded-full bg-paper/95 p-2 shadow-sm transition-all hover:shadow-md hover:scale-110"><Heart size={16} className={has(p.id) ? 'fill-fig text-fig' : 'text-stone'} /></button>
      </div>
      <div className="mt-3.5 flex flex-1 flex-col">
        <Link to={`/product/${p.slug}`} className="font-display text-[17px] leading-snug hover:text-fig transition-colors">{p.name}</Link>
        <p className="mt-1 text-sm text-stone">{p.waxType} wax · {p.burnTimeHours} hr burn</p>
        <div className="mt-1.5"><Stars value={p.ratingAverage} count={p.reviewCount} /></div>
        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          <p className="font-semibold text-smoke">{money(p.effectivePrice)} {p.discountPercent > 0 && <span className="ml-1 text-sm font-normal text-stone line-through">{money(p.price)}</span>}</p>
          <button onClick={() => add(p)} disabled={!p.inStock} aria-label={`Add ${p.name} to cart`} className="rounded-full border border-sand p-2.5 transition-all hover:bg-fig hover:border-fig hover:text-paper hover:shadow-sm disabled:opacity-40"><ShoppingBag size={16} /></button>
        </div>
        {p.lowStock && <p className="mt-1.5 text-xs font-medium text-fig">Only {p.stockQuantity} left</p>}
      </div>
    </article>
  );
}

export function ProductGridSkeleton({ count = 8 }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse"><div className="aspect-square rounded-2xl bg-sand/50" /><div className="mt-3.5 h-4 w-3/4 rounded bg-sand/50" /><div className="mt-2 h-3 w-1/2 rounded bg-sand/50" /></div>
      ))}
    </div>
  );
}
