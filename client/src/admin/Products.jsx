import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import ProductImage from '../components/ProductImage';
import { Card, Err, Field, Head, Loading, Pager, Table, Td, useDebounced, useLoad } from './ui';
import { money } from '../utils/format';

export function ProductList() {
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const q = useDebounced(search);
  const { data, meta, error, loading, reload } = useLoad(`/products?includeInactive=true&limit=15&page=${page}&search=${encodeURIComponent(q)}`);
  useEffect(() => setPage(1), [q]);
  const act = async (fn, msg) => { try { await fn(); toast(msg); reload(); } catch (e) { toast(e.userMessage, 'error'); } };
  return (
    <>
      <Head title="Products"><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products" aria-label="Search products" className="input w-56" /><Link to="/admin/products/new" className="btn-primary">Add product</Link></Head>
      {error ? <Err retry={reload}>{error}</Err> : loading && !data ? <Loading /> : (
        <>
          <Table head={['Product', 'SKU', 'Price', 'Stock', 'Active', '']} empty="No products found.">
            {data?.products.map((p) => (
              <tr key={p.id}>
                <Td><div className="flex items-center gap-3"><ProductImage product={p} className="h-10 w-10 shrink-0 rounded-md" /><span className="font-medium">{p.name}</span></div></Td>
                <Td>{p.sku}</Td><Td>{money(p.effectivePrice)}</Td>
                <Td className={p.stockQuantity === 0 ? 'font-semibold text-red-800' : p.lowStock ? 'text-amber-800' : ''}>{p.stockQuantity}</Td>
                <Td><input type="checkbox" aria-label={`${p.name} active`} checked={p.isActive} onChange={(e) => act(() => api.put(`/products/${p.id}`, { isActive: e.target.checked }), e.target.checked ? 'Product activated' : 'Product hidden')} className="accent-fig" /></Td>
                <Td className="whitespace-nowrap text-right"><Link to={`/admin/products/${p.id}`} className="mr-3 font-semibold text-fig">Edit</Link><button className="text-red-800" onClick={() => window.confirm(`Delete "${p.name}"?`) && act(async () => { const r = await api.delete(`/products/${p.id}`); toast(r.data.message); }, 'Done')}>Delete</button></Td>
              </tr>
            ))}
          </Table>
          <Pager meta={meta} onPage={setPage} />
        </>
      )}
    </>
  );
}

const NUM = ['price', 'burnTimeHours', 'weightGrams', 'stockQuantity'];
const FLAGS = [['isFeatured', 'Featured'], ['isBestseller', 'Bestseller'], ['isNewArrival', 'New arrival'], ['isActive', 'Active (visible in store)']];

export function ProductForm() {
  const { id } = useParams();
  const nav = useNavigate();
  const { toast } = useToast();
  const { register, handleSubmit, reset, formState: { errors } } = useForm({ defaultValues: { isActive: true } });
  const [cats, setCats] = useState([]);
  const [product, setProduct] = useState(null);
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => { api.get('/categories').then((r) => setCats(r.data.data.categories)); }, []);
  useEffect(() => {
    if (!id) return;
    api.get(`/products/${id}`).then((r) => { const p = r.data.data.product; setProduct(p); reset({ ...p, categoryId: p.categoryId, discountPrice: p.discountPrice ?? '' }); }).catch((e) => toast(e.userMessage, 'error'));
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = async (d) => {
    setBusy(true);
    try {
      const body = { ...d };
      NUM.forEach((k) => { body[k] = Number(d[k]); });
      body.discountPrice = d.discountPrice === '' || d.discountPrice == null ? null : Number(d.discountPrice);
      ['id', 'slug', 'createdAt', 'updatedAt', 'images', 'category', 'effectivePrice', 'discountPercent', 'inStock', 'lowStock', 'ratingAverage', 'reviewCount', 'soldCount'].forEach((k) => delete body[k]);
      const saved = (id ? await api.put(`/products/${id}`, body) : await api.post('/products', body)).data.data.product;
      if (files.length) { const fd = new FormData(); files.forEach((f) => fd.append('images', f)); await api.post(`/products/${saved.id}/images`, fd); }
      toast(id ? 'Product updated' : 'Product created'); nav('/admin/products');
    } catch (e) { toast(e.userMessage, 'error'); } finally { setBusy(false); }
  };
  const removeImage = async (img) => { try { await api.delete(`/products/${id}/images/${img.id}`); setProduct({ ...product, images: product.images.filter((i) => i.id !== img.id) }); } catch (e) { toast(e.userMessage, 'error'); } };

  const T = (name, label, opts = {}, type = 'text') => <Field label={label}><input type={type} step={type === 'number' ? 'any' : undefined} className="input" {...register(name, opts)} />{errors[name] && <span className="text-xs text-red-700">{errors[name].message}</span>}</Field>;
  const req = { required: 'Required' };
  return (
    <>
      <Head title={id ? 'Edit product' : 'Add product'}><Link to="/admin/products" className="btn-ghost">Back</Link></Head>
      <form onSubmit={handleSubmit(submit)} className="space-y-5" noValidate>
        <Card className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">{T('name', 'Name', req)}</div>
          <div className="sm:col-span-2">{T('shortDescription', 'Short description', req)}</div>
          <div className="sm:col-span-2"><Field label="Description"><textarea rows="4" className="input" {...register('description', { required: 'Required', minLength: { value: 10, message: 'Too short' } })} />{errors.description && <span className="text-xs text-red-700">{errors.description.message}</span>}</Field></div>
          {T('price', 'Price (₹)', { required: 'Required', min: { value: 1, message: 'Must be above 0' } }, 'number')}
          {T('discountPrice', 'Discount price (₹, optional)', {}, 'number')}
          {T('sku', 'SKU', req)}
          <Field label="Category"><select className="input" {...register('categoryId', req)}><option value="">Select…</option>{cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>{errors.categoryId && <span className="text-xs text-red-700">Required</span>}</Field>
          {T('fragrance', 'Fragrance', req)}{T('waxType', 'Wax type', req)}
          {T('burnTimeHours', 'Burn time (hours)', req, 'number')}{T('weightGrams', 'Weight (g)', req, 'number')}
          {T('dimensions', 'Dimensions', req)}{T('stockQuantity', 'Stock quantity', { required: 'Required', min: { value: 0, message: 'Cannot be negative' } }, 'number')}
        </Card>
        <Card title="Images">
          {product?.images?.length > 0 && <div className="mb-4 flex flex-wrap gap-3">{product.images.map((i) => <div key={i.id} className="relative"><ProductImage product={product} image={i} className="h-20 w-20 rounded-lg" /><button type="button" onClick={() => removeImage(i)} aria-label="Remove image" className="absolute -right-2 -top-2 h-6 w-6 rounded-full bg-red-800 text-xs text-white">×</button></div>)}</div>}
          <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(e) => setFiles([...e.target.files])} aria-label="Upload images" className="text-sm" />
          <p className="mt-2 text-xs text-stone">JPG, PNG or WebP, up to 5 MB each. Without uploads, a candle illustration is shown.</p>
        </Card>
        <Card className="flex flex-wrap gap-5">{FLAGS.map(([k, l]) => <label key={k} className="flex items-center gap-2 text-sm"><input type="checkbox" className="accent-fig" {...register(k)} />{l}</label>)}</Card>
        <button className="btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save product'}</button>
      </form>
    </>
  );
}

export function Categories() {
  const { toast } = useToast();
  const { data, error, loading, reload } = useLoad('/categories');
  const [edit, setEdit] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const save = async (e) => {
    e.preventDefault();
    try { await (edit ? api.put(`/categories/${edit.id}`, { name, description }) : api.post('/categories', { name, description })); toast('Category saved'); setEdit(null); setName(''); setDescription(''); reload(); } catch (er) { toast(er.userMessage, 'error'); }
  };
  const start = (c) => { setEdit(c); setName(c.name); setDescription(c.description || ''); };
  return (
    <>
      <Head title="Categories" />
      <Card className="mb-5"><form onSubmit={save} className="grid gap-3 sm:grid-cols-[1fr_2fr_auto]"><input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" aria-label="Category name" className="input" /><input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description (optional)" aria-label="Description" className="input" /><div className="flex gap-2"><button className="btn-primary">{edit ? 'Update' : 'Add'}</button>{edit && <button type="button" className="btn-ghost" onClick={() => { setEdit(null); setName(''); setDescription(''); }}>Cancel</button>}</div></form></Card>
      {error ? <Err retry={reload}>{error}</Err> : loading && !data ? <Loading /> : (
        <Table head={['Name', 'Products', 'Active', '']}>
          {data?.categories.map((c) => <tr key={c.id}><Td className="font-medium">{c.name}</Td><Td>{c.productCount}</Td>
            <Td><input type="checkbox" aria-label={`${c.name} active`} checked={c.isActive} className="accent-fig" onChange={async (e) => { try { await api.put(`/categories/${c.id}`, { isActive: e.target.checked }); reload(); } catch (er) { toast(er.userMessage, 'error'); } }} /></Td>
            <Td className="text-right"><button className="mr-3 font-semibold text-fig" onClick={() => start(c)}>Edit</button><button className="text-red-800" onClick={async () => { if (!window.confirm(`Delete "${c.name}"?`)) return; try { await api.delete(`/categories/${c.id}`); toast('Category deleted'); reload(); } catch (er) { toast(er.userMessage, 'error'); } }}>Delete</button></Td></tr>)}
        </Table>
      )}
    </>
  );
}
