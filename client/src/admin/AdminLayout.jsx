import { useState } from 'react';
import { Link, NavLink, Navigate, Outlet } from 'react-router-dom';
import { LayoutDashboard, Package, Grid3X3, ShoppingCart, Users, Ticket, Warehouse, BarChart3, Settings, Store, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import usePageMeta from '../hooks/usePageMeta';

const NAV = [
  ['Dashboard', '/admin', LayoutDashboard, true],
  ['Products', '/admin/products', Package],
  ['Categories', '/admin/categories', Grid3X3],
  ['Orders', '/admin/orders', ShoppingCart],
  ['Customers', '/admin/customers', Users],
  ['Coupons', '/admin/coupons', Ticket],
  ['Inventory', '/admin/inventory', Warehouse],
  ['Analytics', '/admin/analytics', BarChart3],
  ['Settings', '/admin/settings', Settings],
];

export default function AdminLayout() {
  const { user, loading, isAdmin } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  usePageMeta('Admin');
  if (loading) return <div className="p-24 text-center text-stone">Loading…</div>;
  if (!user) return <Navigate to="/login" state={{ from: '/admin' }} replace />;
  if (!isAdmin) return <div className="container-x py-24 text-center"><h1 className="text-3xl">Admins only</h1><p className="mt-2 text-stone">Your account does not have access to this area.</p><Link to="/" className="btn-primary mt-6">Back to store</Link></div>;

  const linkClass = ({ isActive }) => `flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${isActive ? 'bg-fig text-paper shadow-sm' : 'text-stone hover:bg-fig/10 hover:text-fig'}`;

  return (
    <div className="container-x py-6 lg:py-8 lg:grid lg:grid-cols-[14rem_1fr] lg:gap-8">
      {/* Desktop sidebar */}
      <nav aria-label="Admin" className="hidden lg:block">
        <div className="sticky top-24 rounded-2xl border border-sand/40 bg-paper p-4 shadow-sm">
          <div className="mb-3 border-b border-sand/40 pb-3 px-1">
            <p className="font-display text-sm font-semibold text-fig">Admin Panel</p>
          </div>
          <div className="flex flex-col gap-0.5">
            {NAV.map(([l, to, Icon, end]) => <NavLink key={to} to={to} end={end} className={linkClass}><Icon size={16} />{l}</NavLink>)}
          </div>
          <div className="mt-4 border-t border-sand/40 pt-3">
            <Link to="/" className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-stone hover:bg-fig/10 hover:text-fig transition-colors"><Store size={16} />View store</Link>
          </div>
        </div>
      </nav>

      {/* Mobile nav */}
      <div className="lg:hidden mb-6">
        <button onClick={() => setMobileOpen(!mobileOpen)} className="btn-ghost btn-sm w-full justify-between" aria-expanded={mobileOpen}>
          <span className="flex items-center gap-2"><Menu size={16} />Admin menu</span>
          {mobileOpen ? <X size={14} /> : <span className="text-xs text-stone">▾</span>}
        </button>
        {mobileOpen && (
          <nav className="mt-2 rounded-xl border border-sand/40 bg-paper p-3 shadow-sm grid grid-cols-2 gap-1" aria-label="Admin mobile">
            {NAV.map(([l, to, Icon, end]) => <NavLink key={to} to={to} end={end} onClick={() => setMobileOpen(false)} className={linkClass}><Icon size={14} />{l}</NavLink>)}
            <Link to="/" onClick={() => setMobileOpen(false)} className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-stone hover:bg-fig/10 col-span-2"><Store size={14} />View store</Link>
          </nav>
        )}
      </div>

      <div className="min-w-0"><Outlet /></div>
    </div>
  );
}
