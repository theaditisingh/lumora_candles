import { Route, Routes } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import Dashboard, { Analytics } from './Dashboard';
import { ProductList, ProductForm, Categories } from './Products';
import { OrderList, OrderDetail } from './Orders';
import { Customers, Coupons, Inventory, Settings } from './Manage';

export default function AdminRoutes() {
  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="products" element={<ProductList />} />
        <Route path="products/new" element={<ProductForm />} />
        <Route path="products/:id" element={<ProductForm />} />
        <Route path="categories" element={<Categories />} />
        <Route path="orders" element={<OrderList />} />
        <Route path="orders/:id" element={<OrderDetail />} />
        <Route path="customers" element={<Customers />} />
        <Route path="coupons" element={<Coupons />} />
        <Route path="inventory" element={<Inventory />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}
