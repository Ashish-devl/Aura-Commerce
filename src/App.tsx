/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Layout from './components/Layout';
import Home from './components/Home';
import ProductDetails from './components/ProductDetails';
import Cart from './components/Cart';
import CheckoutProcessing from './components/CheckoutProcessing';
import AdminDashboard from './components/AdminDashboard';
import AdminOrders from './components/AdminOrders';
import OrderHistory from './components/OrderHistory';
import Wishlist from './components/Wishlist';
import Login from './components/Login';
import Signup from './components/Signup';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="product/:id" element={<ProductDetails />} />
              <Route path="cart" element={<Cart />} />
              <Route path="checkout/processing" element={<CheckoutProcessing />} />
              <Route path="admin" element={<AdminDashboard />} />
              <Route path="admin/orders" element={<AdminOrders />} />
              <Route path="orders" element={<OrderHistory />} />
              <Route path="wishlist" element={<Wishlist />} />
              <Route path="login" element={<Login />} />
              <Route path="signup" element={<Signup />} />
            </Route>
          </Routes>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
