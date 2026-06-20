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
import OrderHistory from './components/OrderHistory';
import Wishlist from './components/Wishlist';

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
              <Route path="orders" element={<OrderHistory />} />
              <Route path="wishlist" element={<Wishlist />} />
            </Route>
          </Routes>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
