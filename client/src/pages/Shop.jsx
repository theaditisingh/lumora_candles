import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, X } from 'lucide-react';
import api from '../services/api';
import ProductCard, { ProductGridSkeleton } from '../components/ProductCard';
import usePageMeta from '../hooks/usePageMeta';

const FRAGRANCES = ['Vanilla', 'Lavender', 'Rose', 'Sandalwood', 'Citrus', 'Oud', 'Jasmine', 'Coffee', 'Ocean', 'Cinnamon', 'Spice', 'Eucalyptus'];
const WAX = ['Soy', 'Soy-Coconut', 'Paraffin Blend', 'Palm Wax'];
const SORTS = [['newest', 'Newest'], ['price_asc', 'Price: low to high'], ['price_desc', 'Price: high to low'], ['bestselling', 'Best selling'], ['rating', 'Highest rated']];

export default function Shop() {
  const [params, setParams] = useSearchParams();
  const [cats, setCats] = useState([]);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [price, setPrice] = useState({ min: params.get('minPrice') || '', max: params.get('maxPrice') || '' });
  const get = (k) => params.get(k) || '';
  const search = get('search');
  usePageMeta(search ? `Search: ${search}` : 'Shop candles', 'Browse scented candles, soy candles, gift sets and decor from Lumora Candles.');

  useEffect(() => { api.get('/categories').then((r) => setCats(r.data.data.categories)).catch(() => {}); }, []);
  useEffect(() => {
    setData(null); setError('');
    api.get(`/products?limit=12&${params.toString()}`).then((r) => setData(r.data.data.products && { products: r.data.data.products, meta: r.data.meta })).catch((e) => setError(e.userMessage));
  }, [params]);

  const set = (updates) => {
    const next = new URLSearchParams(params);
    Object.entries(updates).forEach(([k, v]) => (v === '' || v === false || v == null ? next.delete(k) : next.set(k, v)));
    if (!('page' in updates)) next.delete('page');
    setParams(next);
  };
  const toggle = (k, v) => set({ [k]: get(k) === v ? '' : v });
  const clear = () => { setPrice({ min: '', max: '' }); setParams(search ? { search } : {}); };
  const activeCat = cats.find((c) => c.slug === get('category'));
  const hasFilters = [...params.keys()].some((k) => !['search', 'page', 'sort'].includes(k));

  const Chip = ({ active, onClick, children }) => (
    <button onClick={onClick} aria-pressed={active} className={`rounded-full border px-3 py-1.5 text-sm transition-all ${active ? 'border-fig bg-fig text-paper shadow-sm' : 'border-sand/60 bg-paper hover:border-fig hover:text-fig'}`}>{children}</button>
  );
  const Check = ({ k, label }) => <label className="flex cursor-pointer items-center gap-2 text-sm hover:text-fig transition-colors"><input type="checkbox" checked={get(k) === 'true'} onChange={(e) => set({ [k]: e.target.checked ? 'true' : '' })} className="accent-fig" />{label}</label>;

  const filters = (
    <div className="space-y-7">
      <div><h3 className="mb-2.5 font-sans text-xs font-semibold uppercase tracking-wider text-stone">Category</h3><div className="flex flex-wrap gap-2">{cats.map((c) => <Chip key={c.id} active={get('category') === c.slug} onClick={() => toggle('category', c.slug)}>{c.name}</Chip>)}</div></div>
      <div><h3 className="mb-2.5 font-sans text-xs font-semibold uppercase tracking-wider text-stone">Fragrance</h3><div className="flex flex-wrap gap-2">{FRAGRANCES.map((f) => <Chip key={f} active={get('fragrance') === f} onClick={() => toggle('fragrance', f)}>{f}</Chip>)}</div></div>
      <div><h3 className="mb-2.5 font-sans text-xs font-semibold uppercase tracking-wider text-stone">Wax type</h3><div className="flex flex-wrap gap-2">{WAX.map((w) => <Chip key={w} active={get('waxType') === w} onClick={() => toggle('waxType', w)}>{w}</Chip>)}</div></div>
      <div>
        <h3 className="mb-2.5 font-sans text-xs font-semibold uppercase tracking-wider text-stone">Price (₹)</h3>
        <form onSubmit={(e) => { e.preventDefault(); set({ minPrice: price.min, maxPrice: price.max }); }} className="flex items-center gap-2">
          <input type="number" min="0" placeholder="Min" aria-label="Minimum price" value={price.min} onChange={(e) => setPrice({ ...price, min: e.target.value })} className="input" />
          <span className="text-stone">–</span>
          <input type="number" min="0" placeholder="Max" aria-label="Maximum price" value={price.max} onChange={(e) => setPrice({ ...price, max: e.target.value })} className="input" />
          <button className="btn-ghost btn-sm">Go</button>
        </form>
      </div>
      <div className="space-y-3"><Check k="inStock" label="In stock only" /><Check k="onSale" label="On sale" />
        <label className="flex cursor-pointer items-center gap-2 text-sm hover:text-fig transition-colors"><input type="checkbox" checked={get('minRating') === '4'} onChange={(e) => set({ minRating: e.target.checked ? '4' : '' })} className="accent-fig" />4 stars and above</label></div>
      {hasFilters && <button onClick={clear} className="text-sm font-semibold text-fig hover:underline">Clear all filters</button>}
    </div>
  );

  const meta = data?.meta;
  return (
    <div className="container-x py-10">
      <div className="mb-2">
        <h1 className="section-title">{search ? `Results for "${search}"` : activeCat?.name || 'All candles'}</h1>
        {activeCat?.description && <p className="section-sub">{activeCat.description}</p>}
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-[17rem_1fr]">
        <aside className="hidden rounded-2xl border border-sand/40 bg-paper p-5 shadow-sm lg:block lg:self-start">{filters}</aside>
        <div>
          <div className="mb-6 flex items-center justify-between gap-3">
            <button className="btn-ghost btn-sm lg:hidden" onClick={() => setShowFilters(!showFilters)} aria-expanded={showFilters}><SlidersHorizontal size={14} />Filters{hasFilters && <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-fig text-[10px] text-paper">✓</span>}</button>
            <p className="hidden text-sm text-stone sm:block">{meta ? `${meta.total} candle${meta.total === 1 ? '' : 's'}` : ''}</p>
            <label className="ml-auto flex items-center gap-2 text-sm">Sort by
              <select value={get('sort') || 'newest'} onChange={(e) => set({ sort: e.target.value })} className="input w-auto py-2">{SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
            </label>
          </div>
          {showFilters && <div className="mb-8 rounded-2xl border border-sand/40 bg-paper p-5 shadow-sm lg:hidden">{filters}</div>}

          {error ? <div className="card p-10 text-center"><p className="text-stone">{error}</p><button className="btn-primary mt-4" onClick={() => setParams(new URLSearchParams(params))}>Try again</button></div>
            : !data ? <ProductGridSkeleton count={8} />
            : data.products.length === 0 ? <div className="card p-12 text-center"><h2 className="text-2xl">No candles match</h2><p className="mt-2 text-stone">Try removing a filter or searching for something else.</p><button className="btn-primary mt-6" onClick={clear}>Clear filters</button></div>
            : <>
              <div className="grid grid-cols-2 gap-x-5 gap-y-9 md:grid-cols-3">{data.products.map((p) => <ProductCard key={p.id} product={p} />)}</div>
              {meta.totalPages > 1 && (
                <nav className="mt-12 flex flex-wrap items-center justify-center gap-2" aria-label="Pagination">
                  {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map((n) => (
                    <button key={n} onClick={() => set({ page: n === 1 ? '' : n })} aria-current={n === meta.page ? 'page' : undefined} className={`h-10 w-10 rounded-full text-sm font-medium transition-all ${n === meta.page ? 'bg-fig text-paper shadow-sm' : 'hover:bg-fig/10 hover:text-fig'}`}>{n}</button>
                  ))}
                </nav>
              )}
            </>}
        </div>
      </div>
    </div>
  );
}
