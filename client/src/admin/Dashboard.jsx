import { useState } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, ShoppingCart, Users, Package, Clock, Truck, AlertTriangle, DollarSign } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, Err, Head, Loading, useLoad } from './ui';
import { money } from '../utils/format';

const COLORS = ['#5B3A4A', '#C8963E', '#8C7AA6', '#6C8A71', '#B66A7A', '#6E645D'];
const short = (d) => d.slice(5);
const axis = { fontSize: 11, fill: '#6E645D' };
const Empty = () => <p className="py-10 text-center text-sm text-stone">No sales in this period yet.</p>;

const ICONS = { 'Total revenue': DollarSign, "Today's sales": TrendingUp, 'This month': TrendingUp, 'Total orders': ShoppingCart, 'Pending orders': Clock, 'Delivered': Truck, 'Customers': Users, 'Products': Package };
const CARD_COLORS = { 'Total revenue': 'bg-fig/10 text-fig', "Today's sales": 'bg-wax/15 text-wax', 'This month': 'bg-green-100 text-green-700', 'Pending orders': 'bg-amber-100 text-amber-700' };

export function Charts({ d }) {
  const has = d.daily.some((x) => x.orders > 0);
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card title="Revenue (₹)">{!has ? <Empty /> : <ResponsiveContainer width="100%" height={240}><LineChart data={d.daily}><CartesianGrid stroke="#D9D0C1" vertical={false} /><XAxis dataKey="date" tickFormatter={short} tick={axis} minTickGap={24} /><YAxis tick={axis} width={48} /><Tooltip formatter={(v) => money(v)} /><Line type="monotone" dataKey="revenue" stroke="#5B3A4A" strokeWidth={2} dot={false} /></LineChart></ResponsiveContainer>}</Card>
      <Card title="Orders">{!has ? <Empty /> : <ResponsiveContainer width="100%" height={240}><BarChart data={d.daily}><CartesianGrid stroke="#D9D0C1" vertical={false} /><XAxis dataKey="date" tickFormatter={short} tick={axis} minTickGap={24} /><YAxis allowDecimals={false} tick={axis} width={32} /><Tooltip /><Bar dataKey="orders" fill="#C8963E" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer>}</Card>
      <Card title="Top selling products">{d.topProducts.length === 0 ? <Empty /> : <ol className="space-y-2.5 text-sm">{d.topProducts.map((p, i) => <li key={p.productId} className="flex justify-between gap-3"><span className="flex items-center gap-2"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-fig/10 text-xs font-semibold text-fig">{i + 1}</span>{p.name}</span><span className="text-stone whitespace-nowrap">{p.quantity} sold · {money(p.revenue)}</span></li>)}</ol>}</Card>
      <div className="grid gap-5 sm:grid-cols-2">
        <Card title="Sales by category">{d.salesByCategory.length === 0 ? <Empty /> : <ResponsiveContainer width="100%" height={200}><PieChart><Pie data={d.salesByCategory} dataKey="revenue" nameKey="name" outerRadius={70}>{d.salesByCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip formatter={(v) => money(v)} /></PieChart></ResponsiveContainer>}</Card>
        <Card title="Payment methods">{d.paymentMethods.length === 0 ? <Empty /> : <ResponsiveContainer width="100%" height={200}><PieChart><Pie data={d.paymentMethods} dataKey="orders" nameKey="method" outerRadius={70} label>{d.paymentMethods.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer>}</Card>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { data, error, loading, reload } = useLoad('/admin/dashboard');
  if (loading) return <Loading />;
  if (error) return <Err retry={reload}>{error}</Err>;
  const m = data.metrics;
  const cards = [['Total revenue', money(m.revenue)], ["Today's sales", money(m.todaySales)], ['This month', money(m.monthSales)], ['Total orders', m.totalOrders], ['Pending orders', m.pendingOrders], ['Delivered', m.completedOrders], ['Customers', m.totalCustomers], ['Products', m.totalProducts]];
  return (
    <>
      <Head title="Dashboard" />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">{cards.map(([l, v]) => {
        const Icon = ICONS[l] || Package;
        const color = CARD_COLORS[l] || 'bg-sand/50 text-stone';
        return (
          <div key={l} className="card flex items-start gap-3">
            <div className={`flex h-9 w-9 items-center justify-center rounded-xl shrink-0 ${color}`}><Icon size={16} /></div>
            <div><p className="text-xs text-stone">{l}</p><p className="mt-0.5 font-display text-xl font-semibold">{v}</p></div>
          </div>
        );
      })}</div>
      <div className="mt-6"><Charts d={data} /></div>
      <Card title={`Low stock (${m.lowStockCount})`} className="mt-6">
        {data.lowStock.length === 0 ? <p className="text-sm text-stone">All products are well stocked.</p> : <ul className="divide-y divide-sand/50 text-sm">{data.lowStock.map((p) => <li key={p.id} className="flex items-center justify-between py-2.5"><span className="flex items-center gap-2">{p.stockQuantity === 0 && <AlertTriangle size={14} className="text-red-600" />}{p.name} <span className="text-stone">({p.sku})</span></span><span className={p.stockQuantity === 0 ? 'font-semibold text-red-700' : 'text-amber-700'}>{p.stockQuantity} left</span></li>)}</ul>}
        <Link to="/admin/inventory" className="mt-3 inline-block text-sm font-semibold text-fig hover:underline">Manage inventory</Link>
      </Card>
    </>
  );
}

export function Analytics() {
  const [days, setDays] = useState(30);
  const { data, error, loading, reload } = useLoad(`/admin/sales?days=${days}`);
  return (
    <>
      <Head title="Sales analytics"><select aria-label="Period" value={days} onChange={(e) => setDays(Number(e.target.value))} className="input w-auto">{[[7, 'Last 7 days'], [30, 'Last 30 days'], [90, 'Last 90 days'], [365, 'Last year']].map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></Head>
      {loading ? <Loading /> : error ? <Err retry={reload}>{error}</Err> : <Charts d={data} />}
    </>
  );
}
