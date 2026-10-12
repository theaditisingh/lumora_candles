import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { Card, Err, Head, Loading, Pager, Status, Table, Td, useDebounced, useLoad } from './ui';
import { money } from '../utils/format';

const STATUSES = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'REFUNDED'];
const FLOW = { PENDING: ['CONFIRMED', 'CANCELLED'], CONFIRMED: ['PROCESSING', 'CANCELLED'], PROCESSING: ['SHIPPED', 'CANCELLED'], SHIPPED: ['OUT_FOR_DELIVERY', 'DELIVERED'], OUT_FOR_DELIVERY: ['DELIVERED'], DELIVERED: ['REFUNDED'], CANCELLED: ['REFUNDED'], REFUNDED: [] };
const when = (d) => new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

export function OrderList() {
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const q = useDebounced(search);
  const { data, meta, error, loading, reload } = useLoad(`/admin/orders?page=${page}&status=${status}&search=${encodeURIComponent(q)}`);
  useEffect(() => setPage(1), [q, status]);
  return (
    <>
      <Head title="Orders">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Order, name or email" aria-label="Search orders" className="input w-56" />
        <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status" className="input w-auto"><option value="">All statuses</option>{STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}</select>
      </Head>
      {error ? <Err retry={reload}>{error}</Err> : loading && !data ? <Loading /> : (
        <><Table head={['Order', 'Customer', 'Date', 'Total', 'Payment', 'Status']} empty="No orders found.">
          {data?.orders.map((o) => <tr key={o.id}>
            <Td><Link to={`/admin/orders/${o.id}`} className="font-semibold text-fig">{o.orderNumber}</Link>{o.refundRequested && <span className="ml-2 text-xs text-red-800">refund asked</span>}</Td>
            <Td>{o.customer.name}<br /><span className="text-xs text-stone">{o.customer.email}</span></Td><Td>{when(o.createdAt)}</Td><Td>{money(o.total)}</Td>
            <Td>{o.payment?.method === 'COD' ? 'COD' : 'Online'} · {o.payment?.status}</Td><Td><Status s={o.status} /></Td>
          </tr>)}
        </Table><Pager meta={meta} onPage={setPage} /></>
      )}
    </>
  );
}

export function OrderDetail() {
  const { id } = useParams();
  const { toast } = useToast();
  const { data, error, loading, reload } = useLoad(`/admin/orders/${id}`);
  const [status, setStatus] = useState('');
  const [tracking, setTracking] = useState('');
  useEffect(() => { if (data) { setStatus(''); setTracking(data.order.trackingNumber || ''); } }, [data]);
  if (loading && !data) return <Loading />;
  if (error) return <Err retry={reload}>{error}</Err>;
  const { order: o, customer } = data;
  const save = async () => {
    try {
      if (status === 'CANCELLED' && !window.confirm('Cancel this order and return the stock?')) return;
      if (status === 'REFUNDED' && !window.confirm('Mark as refunded? Make sure you have refunded the customer (for online payments, in the Razorpay dashboard).')) return;
      await api.put(`/admin/orders/${id}`, { ...(status ? { status } : {}), trackingNumber: tracking });
      toast('Order updated'); reload();
    } catch (e) { toast(e.userMessage, 'error'); }
  };
  const a = o.shippingAddress;
  return (
    <>
      <Head title={o.orderNumber}><Link to="/admin/orders" className="btn-ghost">Back</Link></Head>
      <div className="grid gap-5 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-5">
          <Card title="Items"><ul className="divide-y divide-sand text-sm">{o.items.map((i) => <li key={i.id} className="flex justify-between py-2"><span>{i.name} × {i.quantity}</span><span>{money(i.lineTotal)}</span></li>)}</ul>
            <dl className="mt-3 space-y-1 border-t border-sand pt-3 text-sm">{[['Subtotal', o.subtotal], ['Discount', -o.discount], ['GST', o.tax], ['Shipping', o.shippingFee]].map(([k, v]) => <div key={k} className="flex justify-between"><dt>{k}</dt><dd>{money(v)}</dd></div>)}<div className="flex justify-between text-base font-semibold"><dt>Total</dt><dd>{money(o.total)}</dd></div></dl></Card>
          <Card title="Customer and shipping"><p className="text-sm">{customer.name} · {customer.email} · {o.customer.phone}</p><p className="mt-2 text-sm">{a.line1}{a.line2 && `, ${a.line2}`}, {a.city}, {a.state} {a.pincode}, {a.country}</p></Card>
        </div>
        <div className="space-y-5">
          <Card title="Status"><p className="mb-3"><Status s={o.status} /></p>
            {FLOW[o.status].length > 0 && <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Change status" className="input mb-3"><option value="">Change status…</option>{FLOW[o.status].map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}</select>}
            <input value={tracking} onChange={(e) => setTracking(e.target.value)} placeholder="Tracking number" aria-label="Tracking number" className="input mb-3" />
            <button className="btn-primary w-full" onClick={save}>Save</button></Card>
          <Card title="Payment"><p className="text-sm">{o.payment?.method === 'COD' ? 'Cash on delivery' : 'Razorpay'} · <b>{o.payment?.status}</b></p>{o.payment?.razorpayPaymentId && <p className="mt-1 break-all text-xs text-stone">{o.payment.razorpayPaymentId}</p>}{o.refundRequested && <p className="mt-2 text-sm font-semibold text-red-800">Customer requested a refund</p>}</Card>
        </div>
      </div>
    </>
  );
}
