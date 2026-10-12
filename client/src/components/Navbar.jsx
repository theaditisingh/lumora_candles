import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Heart, Menu, Search, ShoppingBag, User, X, ChevronDown } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const links = [['Shop', '/shop'], ['Gift sets', '/shop?category=gift-sets'], ['New arrivals', '/shop?newArrival=true'], ['About', '/about'], ['Contact', '/contact']];

export default function Navbar() {
  const { itemCount } = useCart();
  const { user, isAdmin, logout } = useAuth();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');

  const search = (e) => { e.preventDefault(); if (q.trim()) { nav(`/shop?search=${encodeURIComponent(q.trim())}`); setOpen(false); } };
  const icon = 'relative rounded-full p-2 transition-colors hover:bg-fig/10 hover:text-fig';

  return (
    <header className="sticky top-0 z-40 border-b border-sand/70 bg-paper/95 backdrop-blur-md shadow-sm">
      <div className="container-x flex h-16 items-center gap-4">
        <button className="rounded-full p-2 hover:bg-fig/10 lg:hidden" aria-label="Open menu" onClick={() => setOpen(true)}><Menu size={22} /></button>
        <Link to="/" className="font-display text-2xl font-semibold tracking-wide">Lumora<span className="text-wax"> Candles</span></Link>
        <nav className="ml-8 hidden gap-1 text-sm font-medium lg:flex" aria-label="Main">
          {links.map(([label, to]) => <NavLink key={label} to={to} className={({ isActive }) => `rounded-full px-3.5 py-2 transition-colors ${isActive ? 'bg-fig/10 text-fig' : 'hover:bg-fig/5 hover:text-fig'}`}>{label}</NavLink>)}
        </nav>
        <form onSubmit={search} className="ml-auto hidden max-w-xs flex-1 md:block" role="search">
          <div className="relative"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search candles…" aria-label="Search candles" className="input pl-9 bg-oat/60 border-sand/50 focus:bg-paper" /></div>
        </form>
        <div className="ml-auto flex items-center gap-0.5 md:ml-0">
          <Link to="/wishlist" className={icon} aria-label="Wishlist"><Heart size={20} /></Link>
          <Link to={user ? '/account' : '/login'} className={icon} aria-label={user ? 'My account' : 'Log in'}><User size={20} /></Link>
          <Link to="/cart" className={icon} aria-label={`Cart, ${itemCount} items`}>
            <ShoppingBag size={20} />
            {itemCount > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-fig px-1 text-[11px] font-semibold text-paper shadow-sm">{itemCount}</span>}
          </Link>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="absolute inset-0 bg-smoke/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 flex h-full w-4/5 max-w-xs flex-col bg-paper shadow-xl">
            <div className="flex items-center justify-between border-b border-sand/50 px-5 py-4">
              <span className="font-display text-xl font-semibold">Lumora<span className="text-wax"> Candles</span></span>
              <button className="rounded-full p-2 hover:bg-fig/10" aria-label="Close menu" onClick={() => setOpen(false)}><X size={22} /></button>
            </div>
            <div className="px-5 pt-4">
              <form onSubmit={search} role="search"><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search candles…" aria-label="Search candles" className="input" /></form>
            </div>
            <nav className="mt-2 flex flex-col gap-0.5 px-3 text-[15px] font-display" aria-label="Mobile">
              {links.map(([label, to]) => <Link key={label} to={to} onClick={() => setOpen(false)} className="rounded-lg px-3 py-2.5 hover:bg-fig/10 hover:text-fig transition-colors">{label}</Link>)}
              {isAdmin && <Link to="/admin" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2.5 hover:bg-fig/10 hover:text-fig transition-colors">Admin</Link>}
            </nav>
            <div className="mt-auto border-t border-sand/50 p-5">
              {user ? (
                <div className="space-y-2">
                  <Link to="/account" onClick={() => setOpen(false)} className="btn-ghost w-full">My account</Link>
                  <button className="btn-ghost w-full" onClick={() => { logout(); setOpen(false); }}>Log out</button>
                </div>
              ) : <Link to="/login" onClick={() => setOpen(false)} className="btn-primary w-full">Log in</Link>}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
