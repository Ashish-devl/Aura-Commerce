import React, { useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { Order } from '../types';
import { CheckCircle2 } from 'lucide-react';

export default function CheckoutProcessing() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { cart, clearCart, totalPrice } = useCart();
  const [status, setStatus] = React.useState('processing');

  const hasProcessed = React.useRef(false);

  useEffect(() => {
    if (authLoading) return; // Wait until auth state is loaded
    if (hasProcessed.current) return;

    const processOrder = async () => {
      const orderId = searchParams.get('orderId');
      if (!orderId || !user || cart.length === 0) {
        setStatus('failed');
        return;
      }

      hasProcessed.current = true;

      try {
        let name = user.email || 'Customer';
        let address = 'N/A';
        const rawData = localStorage.getItem('checkoutData');
        if (rawData) {
          const parsed = JSON.parse(rawData);
          name = parsed.name || name;
          address = parsed.address || address;
        }

        const orderInfo: Order = {
          id: orderId,
          userId: user.uid,
          userName: name,
          userEmail: user.email || '',
          items: cart.map(c => ({ productId: c.id, name: c.name, quantity: c.quantity, price: c.price })),
          totalAmount: totalPrice,
          status: 'pending',
          shippingAddress: address,
          paymentStatus: 'completed',
          createdAt: Date.now()
        };

        await setDoc(doc(db, 'orders', orderId), orderInfo);
        localStorage.removeItem('checkoutData');
        
        // Trigger email confirmation
        if (user.email) {
          fetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: user.email, orderId, totalAmount: totalPrice })
          }).catch(err => console.error('Failed to trigger email:', err));
        }

        clearCart();
        setStatus('success');
      } catch (err) {
        console.error(err);
        setStatus('failed');
      }
    };

    if (status === 'processing') {
      processOrder();
    }
  }, [searchParams, user, cart, clearCart, totalPrice, status, authLoading]);

  return (
    <div className="max-w-md mx-auto text-center py-20 space-y-6">
      {status === 'processing' && (
        <div className="animate-pulse space-y-4">
          <div className="w-16 h-16 bg-slate-200 rounded-full mx-auto"></div>
          <h2 className="text-xl font-bold">Processing Payment...</h2>
        </div>
      )}
      
      {status === 'success' && (
        <div className="space-y-6">
          <CheckCircle2 className="w-20 h-20 text-black mx-auto" />
          <h2 className="text-3xl font-extrabold tracking-tight">Order Confirmed!</h2>
          <p className="text-slate-500">Thank you for your purchase. We'll email you order updates.</p>
          <div className="pt-6 border-t border-slate-100 flex flex-col space-y-3">
            <Link to="/orders" className="bg-black text-white px-8 py-3 rounded-full font-semibold hover:bg-slate-800 transition-colors inline-block">
              View Order History
            </Link>
            <Link to="/" className="text-sm font-semibold hover:underline">
              Continue Shopping
            </Link>
          </div>
        </div>
      )}

      {status === 'failed' && (
        <div className="space-y-6">
          <h2 className="text-3xl font-extrabold tracking-tight text-red-500">Order Failed</h2>
          <p className="text-slate-500">Something went wrong during checkout. Missing cart data or invalid session.</p>
          <Link to="/cart" className="bg-black text-white px-8 py-3 rounded-full font-semibold inline-block">
            Return to Cart
          </Link>
        </div>
      )}
    </div>
  );
}
