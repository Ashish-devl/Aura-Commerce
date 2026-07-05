import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../lib/utils';
import { Minus, Plus, Trash2, ArrowRight } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { api } from '../lib/api';

export default function Cart() {
  const { cart, updateQuantity, removeFromCart, totalItems, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');

  // Automatically pre-populate customer name from their sign-up profile
  useEffect(() => {
    if (user && user.displayName) {
      setName(user.displayName);
    }
  }, [user]);

  const handleCheckout = async () => {
    if (!user) {
      navigate('/login', { state: { from: location } });
      return;
    }
    if (!name.trim() || !address.trim()) {
      alert("Please provide your name and delivery address.");
      return;
    }
    setLoading(true);
    try {
      const orderId = "order_" + Math.random().toString(36).substring(2, 9);
      const orderInfo = {
        id: orderId,
        items: cart.map(c => ({ productId: c.id, name: c.name, quantity: c.quantity, price: c.price })),
        totalAmount: totalPrice,
        status: 'pending',
        shippingAddress: address,
        paymentStatus: 'completed'
      };

      await api.createOrder(orderInfo);

      // Trigger email confirmation
      if (user.email) {
        fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: user.email, orderId, totalAmount: totalPrice })
        }).catch(err => console.error('Failed to trigger email:', err));
      }

      clearCart();
      navigate(`/checkout/processing?orderId=${orderId}&status=success`);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Checkout failed.");
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="text-center py-32 space-y-6">
        <h2 className="text-2xl font-bold tracking-tight">Your cart is empty</h2>
        <p className="text-slate-500">Looks like you haven't added anything yet.</p>
        <Link to="/" className="inline-flex items-center space-x-2 bg-black text-white px-8 py-3 rounded-full font-semibold hover:bg-slate-800 transition-colors">
          <span>Continue Shopping</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="lg:grid lg:grid-cols-12 gap-12">
      <div className="lg:col-span-8 space-y-8">
        <h1 className="text-3xl font-extrabold tracking-tight">Shopping Bag ({totalItems})</h1>

        <div className="space-y-6">
          {cart.map(item => (
            <div key={item.id} className="flex gap-6 border-b border-slate-100 pb-6">
              <Link to={`/product/${item.id}`} className="w-24 h-32 shrink-0 bg-slate-100 rounded-lg overflow-hidden block">
                <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
              </Link>

              <div className="flex-1 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <div>
                    <Link to={`/product/${item.id}`} className="font-semibold text-slate-900 line-clamp-1">{item.name}</Link>
                    <p className="text-sm text-slate-500 mt-1 uppercase tracking-wider">{item.category}</p>
                  </div>
                  <p className="font-medium">{formatCurrency(item.price, item.currency)}</p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center border border-slate-200 rounded-full">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="p-2 text-slate-400 hover:text-black transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="p-2 text-slate-400 hover:text-black transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-slate-400 hover:text-red-500 transition-colors flex items-center space-x-1 py-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="text-xs font-medium uppercase tracking-wider">Remove</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="lg:col-span-4 mt-8 lg:mt-0">
        <div className="bg-slate-50 rounded-2xl p-6 md:p-8 space-y-6 sticky top-24">
          <h2 className="text-xl font-bold tracking-tight">Order Summary</h2>

          <div className="space-y-3 text-sm text-slate-600">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="text-slate-900 font-medium">{formatCurrency(totalPrice)}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping</span>
              <span className="text-slate-900 font-medium">Free</span>
            </div>
            <div className="flex justify-between">
              <span>Tax</span>
              <span className="text-slate-900 font-medium whitespace-nowrap">Calculated at checkout</span>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-4 flex justify-between items-center text-lg font-bold text-slate-900">
            <span>Total</span>
            <span>{formatCurrency(totalPrice)}</span>
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-200">
            <h3 className="font-semibold text-slate-900">Delivery Details</h3>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. John Doe"
                className="w-full rounded-lg border-slate-200 py-2 px-3 sm:text-sm focus:ring-black focus:border-black"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Delivery Address</label>
              <textarea
                required
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="123 Main St, City, Country, ZIP"
                rows={3}
                className="w-full rounded-lg border-slate-200 py-2 px-3 sm:text-sm focus:ring-black focus:border-black resize-none"
              ></textarea>
            </div>
          </div>

          <button
            onClick={handleCheckout}
            disabled={loading}
            className="w-full bg-black text-white px-8 py-4 rounded-full font-bold uppercase tracking-wider text-sm hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            {loading ? 'Processing...' : !user ? 'Sign in to Checkout' : 'Checkout'}
          </button>

          {!user && (
            <p className="text-xs text-center text-slate-500 mt-4">
              You must be signed in to complete your purchase.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
