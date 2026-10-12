import { useEffect, useState } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { Card, Err, Field, Head, Loading, Pager, Status, Table, Td, useDebounced, useLoad } from './ui';
import { money } from '../utils/format';

const useAct = (reload) => { const { toast } = useToast(); return async (fn, msg) => { try { const r = await fn(); toast(msg || r?.data?.message || 'Done'); reload(); } catch (e) { toast(e.userMessage, 'error'); } }; };

export function Customers() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const q = useDebounced(search);
  const { data, meta, error, loading, reload } = useLoad(`/admin/customers?page=${page}&search=${encodeURIComponent(q)}`);
  const act = useAct(reload);
  useEffect(() => setPage(1), [q]);
  return (
    <>
      <Head title="Customers"><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name, email or phone" aria-label="Search customers" className="input w-60" /></Head>
      {error ? <Err retry={reload}>{error}</Err> : loading && !data ? <Loading /> : (
        <><Table head={['Customer', 'Phone', 'Orders', 'Spent', 'Joined', 'Account']} empty="No customers yet.">
          {data?.customers.map((c) => <tr key={c.id}><Td className="font-medium">{c.name}<br /><span className="text-xs font-normal text-stone">{c.email}</span></Td><Td>{c.phone || '-'}</Td><Td>{c.orders}</Td><Td>{money(c.totalSpent)}</Td><Td>{new Date(c.createdAt).toLocaleDateString('en-IN')}</Td>
            <Td><button className={`rounded-full px-3 py-1 text-xs font-semibold ${c.isActive ? 'bg-green-100 text-green-900' : 'bg-red-100 text-red-900'}`} onClick={() => window.confirm(`${c.isActive ? 'Disable' : 'Enable'} ${c.name}?`) && act(() => api.put(`/admin/customers/${c.id}/status`, { isActive: !c.isActive }))}>{c.isActive ? 'Active' : 'Disabled'}</button></Td></tr>)}
        </Table><Pager meta={meta} onPage={setPage} /></>
      )}
    </>
  );
}

const BLANK = { code: '', discountType: 'PERCENTAGE', discountValue: '', minOrderAmount: '', maxDiscount: '', expiresAt: '', usageLimit: '', perUserLimit: '1' };
export function Coupons() {
  const { data, error, loading, reload } = useLoad('/admin/coupons');
  const act = useAct(reload);
  const [f, setF] = useState(BLANK);
  const [editId, setEditId] = useState(null);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = (e) => {
    e.preventDefault();
    const body = { ...f, discountValue: Number(f.discountValue), minOrderAmount: f.minOrderAmount === '' ? 0 : Number(f.minOrderAmount), maxDiscount: f.maxDiscount === '' ? '' : Number(f.maxDiscount), usageLimit: f.usageLimit === '' ? '' : Number(f.usageLimit), perUserLimit: f.perUserLimit === '' ? '' : Number(f.perUserLimit) };
    if (editId) delete body.code;
    act(() => (editId ? api.put(`/admin/coupons/${editId}` , body) : api.post('/admin/coupons', body)), 'Coupon saved').then(() => { setF(BLANK); setEditId(null); });
  };
  const edit = (c) => { setEditId(c.id); setF({ code: c.code, discountType: c.discountType, discountValue: String(c.discountValue), minOrderAmount: String(c.minOrderAmount), maxDiscount: c.maxDiscount ?? '', expiresAt: c.expiresAt ? c.expiresAt.slice(0, 10) : '', usageLimit: c.usageLimit ?? '', perUserLimit: c.perUserLimit ?? '' }); window.scrollTo(0, 0); };
  return (
    <>
      <Head title="Coupons" />
      <Card title={editId ? 'Edit coupon' : 'New coupon'} className="mb-5">
        <form onSubmit={submit} className="grid gap-3 sm:grid-cols-3">
          <Field label="Code"><input required disabled={!!editId} value={f.code} onChange={set('code')} className="input uppercase" /></Field>
          <Field label="Type"><select value={f.discountType} onChange={set('discountType')} className="input"><option value="PERCENTAGE">Percentage (%)</option><option value="FIXED">Fixed amount (₹)</option></select></Field>
          <Field label="Value"><input required type="number" min="1" step="any" value={f.discountValue} onChange={set('discountValue')} className="input" /></Field>
          <Field label="Minimum order (₹)"><input type="number" min="0" value={f.minOrderAmount} onChange={set('minOrderAmount')} className="input" /></Field>
          <Field label="Maximum discount (₹)"><input type="number" min="1" value={f.maxDiscount} onChange={set('maxDiscount')} className="input" /></Field>
          <Field label="Expires on"><input type="date" value={f.expiresAt} onChange={set('expiresAt')} className="input" /></Field>
          <Field label="Total usage limit"><input type="number" min="1" value={f.usageLimit} onChange={set('usageLimit')} className="input" /></Field>
          <Field label="Per customer limit"><input type="number" min="1" value={f.perUserLimit} onChange={set('perUserLimit')} className="input" /></Field>
          <div className="flex items-end gap-2"><button className="btn-primary">{editId ? 'Update' : 'Create'}</button>{editId && <button type="button" className="btn-ghost" onClick={() => { setEditId(null); setF(BLANK); }}>Cancel</button>}</div>
        </form>
      </Card>
      {error ? <Err retry={reload}>{error}</Err> : loading && !data ? <Loading /> : (
        <Table head={['Code', 'Discount', 'Min order', 'Used', 'Expires', 'Active', '']} empty="No coupons yet.">
          {data?.coupons.map((c) => <tr key={c.id}><Td className="font-semibold">{c.code}</Td><Td>{c.discountType === 'PERCENTAGE' ? `${Number(c.discountValue)}%` : money(c.discountValue)}{c.maxDiscount && ` (max ${money(c.maxDiscount)})`}</Td><Td>{money(c.minOrderAmount)}</Td><Td>{c.usedCount}{c.usageLimit ? ` / ${c.usageLimit}` : ''}</Td><Td>{c.expiresAt ? new Date(c.expiresAt).toLocaleDateString('en-IN') : 'Never'}</Td>
            <Td><input type="checkbox" aria-label={`${c.code} active`} checked={c.isActive} className="accent-fig" onChange={(e) => act(() => api.put(`/admin/coupons/${c.id}`, { isActive: e.target.checked }), 'Coupon updated')} /></Td>
            <Td className="whitespace-nowrap text-right"><button className="mr-3 font-semibold text-fig" onClick={() => edit(c)}>Edit</button><button className="text-red-800" onClick={() => window.confirm(`Delete ${c.code}?`) && act(() => api.delete(`/admin/coupons/${c.id}`))}>Delete</button></Td></tr>)}
        </Table>
      )}
    </>
  );
}

export function Inventory() {
  const { data, error, loading, reload } = useLoad('/admin/inventory');
  const act = useAct(reload);
  const [filter, setFilter] = useState('');
  const [vals, setVals] = useState({});
  const rows = (data?.products || []).filter((p) => !filter || p.status === filter);
  return (
    <>
      <Head title="Inventory"><select value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter stock" className="input w-auto"><option value="">All stock levels</option><option value="LOW">Low stock</option><option value="OUT">Out of stock</option><option value="OK">In stock</option></select></Head>
      {error ? <Err retry={reload}>{error}</Err> : loading && !data ? <Loading /> : (
        <Table head={['Product', 'SKU', 'Category', 'Level', 'Stock', '']}>
          {rows.map((p) => <tr key={p.id}><Td className="font-medium">{p.name}{!p.isActive && <span className="ml-2 text-xs text-stone">hidden</span>}</Td><Td>{p.sku}</Td><Td>{p.category.name}</Td><Td><Status s={p.status} /></Td>
            <Td><input type="number" min="0" aria-label={`Stock for ${p.name}`} value={vals[p.id] ?? p.stockQuantity} onChange={(e) => setVals({ ...vals, [p.id]: e.target.value })} className="input w-24 py-1.5" /></Td>
            <Td><button className="font-semibold text-fig disabled:opacity-40" disabled={vals[p.id] === undefined || Number(vals[p.id]) === p.stockQuantity} onClick={() => act(() => api.put(`/admin/inventory/${p.id}`, { stockQuantity: Number(vals[p.id]) }), 'Stock updated').then(() => setVals({ ...vals, [p.id]: undefined }))}>Save</button></Td></tr>)}
        </Table>
      )}
    </>
  );
}

export function Settings() {
  const { toast } = useToast();
  const { data, error, loading, reload } = useLoad('/admin/settings');
  const [s, setS] = useState({ storeName: '', supportEmail: '', supportPhone: '', announcement: '' });
  useEffect(() => { if (data) setS((x) => ({ ...x, ...data.settings })); }, [data]);
  const save = async (e) => { e.preventDefault(); try { await api.put('/admin/settings', s); toast('Settings saved'); reload(); } catch (er) { toast(er.userMessage, 'error'); } };
  if (loading && !data) return <Loading />;
  if (error) return <Err retry={reload}>{error}</Err>;
  const p = data.pricing;
  return (
    <>
      <Head title="Settings" />
      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="Store details"><form onSubmit={save} className="space-y-3">
          {[['storeName', 'Store name'], ['supportEmail', 'Support email'], ['supportPhone', 'Support phone'], ['announcement', 'Announcement text']].map(([k, l]) => <Field key={k} label={l}><input value={s[k]} onChange={(e) => setS({ ...s, [k]: e.target.value })} className="input" /></Field>)}
          <button className="btn-primary">Save settings</button></form></Card>
        <Card title="Pricing rules (read only)"><dl className="space-y-2 text-sm">{[['GST rate', `${p.gstRate}%`], ['Shipping fee', money(p.shippingFee)], ['Free shipping from', money(p.freeShippingThreshold)], ['Cash on delivery', p.codEnabled ? `On, up to ${money(p.codMaxOrderValue)}` : 'Off']].map(([k, v]) => <div key={k} className="flex justify-between"><dt>{k}</dt><dd className="font-medium">{v}</dd></div>)}</dl><p className="mt-3 text-xs text-stone">{p.note}. Restart the API after changing them.</p></Card>
      </div>
    </>
  );
}
