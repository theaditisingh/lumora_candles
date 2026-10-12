import { lazy, Suspense } from 'react';
import { Link, Route, Routes } from 'react-router-dom';
import Layout from './layouts/Layout';
import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Wishlist from './pages/Wishlist';
import { Login, Register } from './pages/AuthPages';
import { ForgotPassword, ResetPassword } from './pages/PasswordPages';
import { RequireAuth, AccountLayout, AccountDashboard, AccountProfile, AccountSecurity, AccountWishlist, Orders, OrderDetail, OrderSuccess, PaymentFailed } from './pages/AccountPages';
import { About, Contact, Faq, Policy } from './pages/InfoPages';
import usePageMeta from './hooks/usePageMeta';

function NotFound() {
  usePageMeta('Page not found');
  return <div className="container-x py-24 text-center"><h1 className="text-4xl">Page not found</h1><p className="mx-auto mt-3 max-w-md text-stone">That page does not exist or has moved. Try the shop instead.</p><Link to="/shop" className="btn-primary mt-8">Browse candles</Link></div>;
}
const AdminRoutes = lazy(() => import('./admin/AdminRoutes')); // charts library only loads for admins
const guard = (el) => <RequireAuth>{el}</RequireAuth>;

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="shop" element={<Shop />} />
        <Route path="product/:slug" element={<ProductDetail />} />
        <Route path="cart" element={<Cart />} />
        <Route path="wishlist" element={<Wishlist />} />
        <Route path="checkout" element={<Checkout />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="forgot-password" element={<ForgotPassword />} />
        <Route path="reset-password" element={<ResetPassword />} />
        {/* Account area with sidebar layout */}
        <Route path="account" element={guard(<AccountLayout />)}>
          <Route index element={<AccountDashboard />} />
          <Route path="profile" element={<AccountProfile />} />
          <Route path="orders" element={<Orders />} />
          <Route path="orders/:id" element={<OrderDetail />} />
          <Route path="wishlist" element={<AccountWishlist />} />
          <Route path="security" element={<AccountSecurity />} />
        </Route>
        <Route path="order-success/:id" element={guard(<OrderSuccess />)} />
        <Route path="payment-failed" element={guard(<PaymentFailed />)} />
        <Route path="about" element={<About />} />
        <Route path="contact" element={<Contact />} />
        <Route path="faq" element={<Faq />} />
        <Route path="shipping-policy" element={<Policy slug="shipping-policy" />} />
        <Route path="refund-policy" element={<Policy slug="refund-policy" />} />
        <Route path="privacy-policy" element={<Policy slug="privacy-policy" />} />
        <Route path="terms" element={<Policy slug="terms" />} />
        <Route path="admin/*" element={<Suspense fallback={<div className="p-24 text-center text-stone">Loading…</div>}><AdminRoutes /></Suspense>} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
