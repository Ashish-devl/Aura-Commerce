import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { Product, Order } from '../types';
import { formatCurrency } from '../lib/utils';
import { useNavigate, Link } from 'react-router-dom';
import { Plus, Trash2, Edit3, ShoppingBag, TrendingUp, Users, DollarSign, Package, Eye, ArrowLeft, RefreshCw, Layers } from 'lucide-react';

export default function AdminDashboard() {
  const { profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [price, setPrice] = useState<number>(0);
  const [category, setCategory] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [stock, setStock] = useState<number>(0);

  useEffect(() => {
    if (authLoading) return;
    
    if (!profile || profile.role !== 'admin') {
      navigate('/');
      return;
    }

    const fetchData = async () => {
      try {
        const [prodList, orderList] = await Promise.all([
          api.getProducts(),
          api.getOrders()
        ]);
        setProducts(prodList);
        setOrders(orderList);
      } catch (err) {
        console.error("Error fetching admin dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [profile, authLoading, navigate]);

  const handleSeedDemoProducts = async () => {
    if (!window.confirm("Add demo products?")) return;
    setLoading(true);
    try {
      await api.seedProducts();
      const prodList = await api.getProducts();
      setProducts(prodList);
    } catch (err) {
      console.error(err);
      alert("Failed to add demo products.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        name,
        description: desc,
        price,
        category,
        imageUrl,
        stock
      };
      const newProd = await api.addProduct(data);
      setProducts([newProd, ...products]);
      setName(''); setDesc(''); setPrice(0); setCategory(''); setImageUrl(''); setStock(0);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm("Delete this product?")) return;
    try {
      await api.deleteProduct(id);
      setProducts(products.filter(p => p.id !== id));
    } catch(err) {
      console.error(err);
    }
  };

  const handleUpdateStock = async (id: string, newStock: number) => {
    try {
      const updated = await api.updateProduct(id, { stock: newStock });
      setProducts(products.map(p => p.id === id ? updated : p));
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateOrderStatus = async (id: string, status: string) => {
    try {
      const updated = await api.updateOrderStatus(id, status);
      setOrders(orders.map(o => o.id === id ? updated : o));
    } catch (err) {
      console.error(err);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
      </div>
    );
  }

  if (!profile || profile.role !== 'admin') return null;

  return (
    <div className="space-y-12">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Admin Dashboard</h1>
        <p className="text-slate-500 mt-2">Manage products, inventory, and incoming orders.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Add Product */}
        <section className="bg-slate-50 p-6 sm:p-8 rounded-2xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold tracking-tight">Add New Product</h2>
            <button 
              onClick={handleSeedDemoProducts}
              className="px-3 py-1.5 text-xs font-semibold bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors"
            >
              Populate Demo Data
            </button>
          </div>
          <form onSubmit={handleAddProduct} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                <input required value={name} onChange={e=>setName(e.target.value)} type="text" className="w-full rounded-lg border-slate-200 py-2 sm:text-sm focus:ring-black focus:border-black" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Image URL</label>
                <input required value={imageUrl} onChange={e=>setImageUrl(e.target.value)} type="url" className="w-full rounded-lg border-slate-200 py-2 sm:text-sm focus:ring-black focus:border-black" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                <input required value={category} onChange={e=>setCategory(e.target.value)} type="text" className="w-full rounded-lg border-slate-200 py-2 sm:text-sm focus:ring-black focus:border-black" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Price (INR)</label>
                <input required value={price} onChange={e=>setPrice(Number(e.target.value))} type="number" min="0" step="0.01" className="w-full rounded-lg border-slate-200 py-2 sm:text-sm focus:ring-black focus:border-black" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Initial Stock</label>
                <input required value={stock} onChange={e=>setStock(Number(e.target.value))} type="number" min="0" className="w-full rounded-lg border-slate-200 py-2 sm:text-sm focus:ring-black focus:border-black" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <textarea required value={desc} onChange={e=>setDesc(e.target.value)} rows={3} className="w-full rounded-lg border-slate-200 py-2 sm:text-sm focus:ring-black focus:border-black" />
            </div>
            <button type="submit" className="w-full bg-black text-white px-4 py-3 rounded-xl justify-center flex items-center space-x-2 font-semibold">
              <Plus className="w-4 h-4" /> <span>Add Product</span>
            </button>
          </form>
        </section>

        {/* Orders */}
        <section className="bg-slate-50 p-6 sm:p-8 rounded-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6 border-b border-slate-200 pb-3">
            <h2 className="text-xl font-bold tracking-tight">Recent Orders</h2>
            <Link 
              to="/admin/orders"
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 uppercase tracking-wider bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors"
            >
              Full Order History &rarr;
            </Link>
          </div>
          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
            {orders.map(order => (
              <div key={order.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <div className="space-y-1">
                    <p className="text-xs font-mono text-slate-500">ID: {order.id}</p>
                    <p className="font-semibold">{formatCurrency(order.totalAmount)} • {order.items.length} items</p>
                    <div className="text-sm">
                      <span className="font-medium text-slate-800">{order.userName || 'Customer'}</span>
                      {order.userEmail && <span className="text-slate-500 ml-2 text-xs">({order.userEmail})</span>}
                    </div>
                  </div>
                  <select 
                    value={order.status}
                    onChange={e => handleUpdateOrderStatus(order.id, e.target.value)}
                    className="text-xs border-slate-200 rounded-md py-1 pr-8 bg-slate-50 font-medium"
                  >
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div className="mt-2 text-sm text-slate-600 bg-slate-50 p-3 rounded-md">
                  <p className="font-semibold text-slate-700 text-xs uppercase tracking-wider mb-1">Items</p>
                  <p className="line-clamp-2 mb-2">{order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}</p>
                  
                  {order.shippingAddress && (
                    <>
                      <p className="font-semibold text-slate-700 text-xs uppercase tracking-wider mt-3 mb-1">Delivery Address</p>
                      <p className="whitespace-pre-line">{typeof order.shippingAddress === 'object' ? JSON.stringify(order.shippingAddress) : order.shippingAddress}</p>
                    </>
                  )}
                </div>
              </div>
            ))}
            {orders.length === 0 && <p className="text-slate-500 text-sm">No orders yet.</p>}
          </div>
        </section>
      </div>

      {/* Inventory Management */}
      <section>
        <h2 className="text-xl font-bold tracking-tight mb-6">Inventory Management</h2>
        <div className="bg-white border text-left border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
              <tr>
                <th className="font-semibold py-3 px-4 text-left">Product</th>
                <th className="font-semibold py-3 px-4 text-left">Price</th>
                <th className="font-semibold py-3 px-4 text-left">Stock</th>
                <th className="font-semibold py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.map(product => (
                <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-3">
                      <img src={product.imageUrl} className="w-10 h-10 rounded-md object-cover bg-slate-200" alt="" />
                      <div>
                        <p className="font-medium text-slate-900 line-clamp-1">{product.name}</p>
                        <p className="text-xs text-slate-500">{product.category}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">{formatCurrency(product.price, product.currency)}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <input 
                        type="number"
                        defaultValue={product.stock}
                        min="0"
                        className="w-20 rounded-md border-slate-200 py-1 text-sm focus:border-black focus:ring-black"
                        onBlur={(e) => handleUpdateStock(product.id, Number(e.target.value))}
                      />
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button onClick={() => handleDeleteProduct(product.id)} className="text-slate-400 hover:text-red-500 p-2 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {products.length === 0 && <div className="p-8 text-center text-slate-500">No products configured.</div>}
        </div>
      </section>
    </div>
  );
}
