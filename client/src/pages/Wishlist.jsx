import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import ProductImage from '../components/ProductImage';
import { money } from '../utils/format';
import usePageMeta from '../hooks/usePageMeta';

export default function Wishlist() {
  usePageMeta('Wishlist');
  const { user, loading } = useAuth();
  const { add } = useCart();
  const { ids, toggle } = useWishlist();
  const [items, setItems] = useState(null);
  useEffect(() => { if (user) api.get('/wishlist').then((r) => setItems(r.data.data.items)).catch(() => setItems([])); }, [user, ids]);

  if (loading) return null;
  if (!user) return (
    <div className="container-x py-24 text-center">
      <Heart size={48} className="mx-auto text-sand" />
      <h1 className="mt-4 section-title">Your wishlist</h1>
      <p className="mt-2 text-stone">Log in to save the candles you love.</p>
      <Link to="/login" state={{ from: '/wishlist' }} className="btn-primary mt-8">Log in</Link>
    </div>
  );
  if (items && items.length === 0) return (
    <div className="container-x py-24 text-center">
      <Heart size={48} className="mx-auto text-sand" />
      <h1 className="mt-4 section-title">Nothing saved yet</h1>
      <p className="mt-2 text-stone">Tap the heart on any candle to keep it here.</p>
      <Link to="/shop" className="btn-primary mt-8">Browse candles</Link>
    </div>
  );
  return (
    <div className="container-x py-10">
      <h1 className="section-title">Your wishlist</h1>
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
    </div>
  );
}
