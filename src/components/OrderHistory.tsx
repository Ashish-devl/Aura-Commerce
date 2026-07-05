import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { Order } from '../types';
import { formatCurrency } from '../lib/utils';
import { Package } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function OrderHistory() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchOrders = async () => {
      try {
        const data = await api.getOrders();
        setOrders(data);
      } catch (err) {
        console.error("Error fetching orders:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [user]);

  if (!user) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-bold tracking-tight">Sign in to view your orders</h2>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Order History</h1>
        <p className="text-slate-500 mt-2">Check the status of your recent purchases.</p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => <div key={i} className="h-32 bg-slate-100 rounded-2xl animate-pulse"></div>)}
        </div>
      ) : orders.length > 0 ? (
        <div className="space-y-6">
          {orders.map(order => (
            <div key={order.id} className="bg-white border text-left border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="bg-slate-50 px-6 py-4 flex flex-wrap justify-between items-center border-b text-sm border-slate-200 gap-4">
                <div>
                  <p className="text-slate-500 font-medium">Order Placed</p>
                  <p className="font-semibold text-slate-900">{new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-slate-500 font-medium">Total</p>
                  <p className="font-semibold text-slate-900">{formatCurrency(order.totalAmount)}</p>
                </div>
                <div>
                  <p className="text-slate-500 font-medium">Order # {order.id}</p>
                </div>
                <div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider
                    ${order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                      order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                    {order.status}
                  </span>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4 text-sm">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <div className="flex items-center space-x-4">
                        <div className="bg-slate-100 w-12 h-12 flex items-center justify-center rounded-lg">
                          <Package className="w-5 h-5 text-slate-400" />
                        </div>
                        <span className="font-medium text-slate-900 line-clamp-1">{item.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-500 mr-4 text-xs font-medium uppercase tracking-wider">Qty: {item.quantity}</span>
                        <span className="font-semibold">{formatCurrency(item.price)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-slate-50 rounded-2xl">
          <p className="text-slate-500 mb-4">You have no previous orders.</p>
          <Link to="/" className="text-black font-semibold uppercase tracking-wider text-sm border-b border-black">Start Shopping</Link>
        </div>
      )}
    </div>
  );
}
