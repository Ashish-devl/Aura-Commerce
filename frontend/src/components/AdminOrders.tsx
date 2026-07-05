import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { Order } from '../types';
import { formatCurrency } from '../lib/utils';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowUpDown, ArrowUp, ArrowDown, Search, Calendar, Clock, SlidersHorizontal, ArrowLeft, Eye, RefreshCw } from 'lucide-react';

export default function AdminOrders() {
  const { profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Sorting state
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc'); // default to newest first
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (authLoading) return;
    
    if (!profile || profile.role !== 'admin') {
      navigate('/');
      return;
    }

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
  }, [profile, authLoading, navigate]);

  const handleUpdateOrderStatus = async (id: string, status: string) => {
    try {
      const updated = await api.updateOrderStatus(id, status);
      setOrders(orders.map(o => o.id === id ? updated : o));
      if (selectedOrder?.id === id) {
        setSelectedOrder(updated);
      }
    } catch (err) {
      console.error("Error updating order status:", err);
    }
  };

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
  };

  // Client side sorting and filtering
  const sortedOrders = [...orders].sort((a, b) => {
    return sortOrder === 'desc' ? b.createdAt - a.createdAt : a.createdAt - b.createdAt;
  });

  const filteredOrders = sortedOrders.filter(order => {
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      order.id.toLowerCase().includes(searchLower) ||
      (order.userName && order.userName.toLowerCase().includes(searchLower)) ||
      (order.userEmail && order.userEmail.toLowerCase().includes(searchLower)) ||
      (order.shippingAddress && typeof order.shippingAddress === 'string' && order.shippingAddress.toLowerCase().includes(searchLower));

    return matchesStatus && matchesSearch;
  });

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
      </div>
    );
  }

  if (!profile || profile.role !== 'admin') return null;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center space-x-2">
            <Link to="/admin" className="text-slate-500 hover:text-black flex items-center text-sm font-medium transition-colors">
              <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
            </Link>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight mt-2">Admin Order History</h1>
          <p className="text-slate-500 mt-1">Detailed log of all purchases, sorting, and fulfillment management.</p>
        </div>
        
        {/* Sorting controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleSortOrder}
            className="flex items-center space-x-2 bg-white border border-slate-200 px-4 py-2.5 rounded-xl hover:bg-slate-50 transition-colors text-sm font-semibold shadow-sm"
          >
            <span>Sort by Date & Time:</span>
            {sortOrder === 'desc' ? (
              <span className="flex items-center text-indigo-600">
                Newest First <ArrowDown className="w-4 h-4 ml-1" />
              </span>
            ) : (
              <span className="flex items-center text-indigo-600">
                Oldest First <ArrowUp className="w-4 h-4 ml-1" />
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Search and Filter Panel */}
      <div className="bg-white border border-slate-200 p-4 sm:p-6 rounded-2xl shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
        {/* Search */}
        <div className="relative md:col-span-2">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Order ID, customer name, email, or address..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-black focus:border-black text-sm"
          />
        </div>

        {/* Status filter */}
        <div className="flex items-center space-x-2">
          <SlidersHorizontal className="text-slate-400 w-4 h-4 flex-shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 focus:bg-white focus:ring-2 focus:ring-black focus:border-black text-sm font-medium"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Main Grid: Order List & Detail Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Order List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center px-1">
            <span className="text-sm font-bold text-slate-700">
              Showing {filteredOrders.length} {filteredOrders.length === 1 ? 'order' : 'orders'}
            </span>
          </div>

          <div className="space-y-4">
            {filteredOrders.map(order => {
              const orderDate = new Date(order.createdAt);
              return (
                <div 
                  key={order.id} 
                  onClick={() => setSelectedOrder(order)}
                  className={`bg-white p-5 rounded-2xl border transition-all cursor-pointer shadow-sm relative group
                    ${selectedOrder?.id === order.id ? 'border-black ring-1 ring-black' : 'border-slate-200 hover:border-slate-400'}`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3 mb-3">
                    <div className="space-y-1">
                      <p className="text-xs font-mono text-slate-500 font-bold">ORDER ID: {order.id}</p>
                      <div className="flex items-center space-x-3 text-xs text-slate-500 font-medium">
                        <span className="flex items-center">
                          <Calendar className="w-3.5 h-3.5 mr-1 text-slate-400" />
                          {orderDate.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                        </span>
                        <span className="flex items-center">
                          <Clock className="w-3.5 h-3.5 mr-1 text-slate-400" />
                          {orderDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider
                        ${order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                          order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                          order.status === 'shipped' ? 'bg-indigo-100 text-indigo-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                        {order.status}
                      </span>
                      <select 
                        value={order.status}
                        onChange={e => handleUpdateOrderStatus(order.id, e.target.value)}
                        className="text-xs border-slate-200 rounded-lg py-1 pr-8 pl-2 bg-slate-50 font-medium focus:ring-black focus:border-black"
                      >
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Customer</p>
                      <p className="font-semibold text-slate-800 mt-0.5">{order.userName || 'Guest'}</p>
                      <p className="text-xs text-slate-500 line-clamp-1">{order.userEmail || 'N/A'}</p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Items</p>
                      <p className="font-semibold text-slate-800 mt-0.5">{order.items.length} unique items</p>
                      <p className="text-xs text-slate-500 line-clamp-1">
                        {order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Total Value</p>
                      <p className="font-extrabold text-slate-900 mt-0.5 text-base">{formatCurrency(order.totalAmount)}</p>
                      <span className="text-[10px] uppercase font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
                        {order.paymentStatus || 'completed'}
                      </span>
                    </div>
                  </div>

                  <div className="absolute right-4 bottom-4 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block">
                    <span className="text-xs text-indigo-600 font-semibold flex items-center">
                      View Details <Eye className="w-3.5 h-3.5 ml-1" />
                    </span>
                  </div>
                </div>
              );
            })}

            {filteredOrders.length === 0 && (
              <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500">
                <p className="font-medium text-base">No orders matched your filters.</p>
                <button 
                  onClick={() => { setSearchQuery(''); setStatusFilter('all'); }} 
                  className="mt-4 text-sm font-bold border-b border-black text-black pb-0.5 hover:border-slate-500"
                >
                  Reset all filters
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Detail Inspector Sidebar */}
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-6 lg:sticky lg:top-24">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg font-bold text-slate-900">Order Detail Inspector</h2>
            <p className="text-xs text-slate-500 mt-1">Select an order on the left to inspect its complete details.</p>
          </div>

          {selectedOrder ? (
            <div className="space-y-6 text-sm">
              <div className="space-y-3">
                <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="font-mono text-xs text-slate-500 font-bold">ID: {selectedOrder.id}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider
                    ${selectedOrder.status === 'delivered' ? 'bg-green-100 text-green-700' :
                      selectedOrder.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                      'bg-indigo-100 text-indigo-700'
                    }`}>
                    {selectedOrder.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="block text-xs text-slate-400 font-semibold uppercase">Date</span>
                    <span className="font-medium text-slate-800">
                      {new Date(selectedOrder.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs text-slate-400 font-semibold uppercase">Time</span>
                    <span className="font-medium text-slate-800">
                      {new Date(selectedOrder.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Customer */}
              <div className="border-t border-slate-100 pt-4 space-y-2">
                <h3 className="font-bold text-slate-900 uppercase text-xs tracking-wider">Customer Details</h3>
                <div className="bg-slate-50 p-3 rounded-xl space-y-1">
                  <p className="font-semibold text-slate-800">{selectedOrder.userName || 'Guest'}</p>
                  <p className="text-xs text-slate-600 font-mono">{selectedOrder.userEmail || 'No email provided'}</p>
                </div>
              </div>

              {/* Delivery Address */}
              <div className="border-t border-slate-100 pt-4 space-y-2">
                <h3 className="font-bold text-slate-900 uppercase text-xs tracking-wider">Shipping Address</h3>
                <div className="bg-slate-50 p-3 rounded-xl">
                  <p className="text-slate-700 whitespace-pre-line text-xs leading-relaxed">
                    {typeof selectedOrder.shippingAddress === 'object' 
                      ? JSON.stringify(selectedOrder.shippingAddress) 
                      : selectedOrder.shippingAddress || 'No shipping address provided.'}
                  </p>
                </div>
              </div>

              {/* Order Items */}
              <div className="border-t border-slate-100 pt-4 space-y-3">
                <h3 className="font-bold text-slate-900 uppercase text-xs tracking-wider">Purchased Items</h3>
                <div className="divide-y divide-slate-100 max-h-[220px] overflow-y-auto pr-2 space-y-2">
                  {selectedOrder.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center py-2 text-xs">
                      <div>
                        <p className="font-semibold text-slate-800 line-clamp-1">{item.name}</p>
                        <p className="text-slate-400 mt-0.5">Qty: {item.quantity} • {formatCurrency(item.price)} each</p>
                      </div>
                      <span className="font-bold text-slate-950">{formatCurrency(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary Total */}
              <div className="border-t-2 border-slate-200 pt-4 flex justify-between items-center">
                <span className="font-bold text-slate-900">Total Amount:</span>
                <span className="text-xl font-black text-indigo-600">{formatCurrency(selectedOrder.totalAmount)}</span>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400 space-y-2">
              <p className="text-sm">No order selected.</p>
              <p className="text-xs">Click on any order card on the left to see full details, delivery details and detailed line-items.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
