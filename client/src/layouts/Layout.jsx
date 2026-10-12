import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function Layout() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-paper focus:p-2">Skip to content</a>
      <div className="bg-gradient-to-r from-fig-dark via-fig to-fig-dark py-2.5 text-center text-sm text-paper/95">
        <span className="inline-flex items-center gap-1.5"><Sparkles size={14} className="text-wax" />Free shipping on orders above ₹999 · Use <b className="text-wax">WELCOME10</b> for 10% off your first order</span>
      </div>
      <Navbar />
      <main id="main"><Outlet /></main>
      <Footer />
    </>
  );
}
