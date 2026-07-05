import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';

export default function CheckoutProcessing() {
  const [searchParams] = useSearchParams();
  const status = searchParams.get('status') || 'success';

  return (
    <div className="max-w-md mx-auto text-center py-20 space-y-6">
      {status === 'success' ? (
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
      ) : (
        <div className="space-y-6">
          <h2 className="text-3xl font-extrabold tracking-tight text-red-500">Order Failed</h2>
          <p className="text-slate-500">Something went wrong during checkout.</p>
          <Link to="/cart" className="bg-black text-white px-8 py-3 rounded-full font-semibold inline-block">
            Return to Cart
          </Link>
        </div>
      )}
    </div>
  );
}
