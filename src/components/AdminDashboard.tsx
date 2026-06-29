import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy, onSnapshot } from 'firebase/firestore';
import { Product, Order } from '../types';
import { formatCurrency } from '../lib/utils';
import { Plus, Trash2, Edit } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

export default function AdminDashboard() {
  const { profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // New product form
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [price, setPrice] = useState(0);
  const [category, setCategory] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [stock, setStock] = useState(0);

  useEffect(() => {
    if (authLoading) return;
    
    if (!profile || profile.role !== 'admin') {
      navigate('/');
      return;
    }

    const qProducts = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    const unsubProducts = onSnapshot(qProducts, (snapshot) => {
      setProducts(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Product)));
    }, (error) => {
      console.error("Error fetching products:", error);
    });

    const qOrders = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsubOrders = onSnapshot(qOrders, (snapshot) => {
      setOrders(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Order)));
      setLoading(false);
    }, (error) => {
      console.error("Error fetching orders:", error);
      setLoading(false);
    });

    return () => {
      unsubProducts();
      unsubOrders();
    };
  }, [profile, authLoading, navigate]);

  const handleSeedDemoProducts = async () => {
    const demoTemplates = [
      { name: "Classic White Tee", category: "T-Shirts", item: "T-Shirt", image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=800", price: 1499 },
      { name: "Urban Winter Jacket", category: "Outerwear", item: "Jacket", image: "https://images.unsplash.com/photo-1576871337622-98d48d1cf531?auto=format&fit=crop&q=80&w=800", price: 4599 },
      { name: "Essential Grey Hoodie", category: "Sweatshirts", item: "Hoodie", image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=800", price: 2999 },
      { name: "Premium Blue Denim", category: "Pants", item: "Jeans", image: "https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&q=80&w=800", price: 3499 },
      { name: "Vintage Leather Backpack", category: "Accessories", item: "Backpack", image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&q=80&w=800", price: 5999 },
      { name: "Activewear Running Shorts", category: "Activewear", item: "Shorts", image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&q=80&w=800", price: 1299 },
      { name: "Casual Striped Sweater", category: "Sweatshirts", item: "Sweater", image: "https://images.unsplash.com/photo-1434389651855-32eab9eeea86?auto=format&fit=crop&q=80&w=800", price: 2499 },
      { name: "Sleek Black Cap", category: "Accessories", item: "Cap", image: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&q=80&w=800", price: 899 },
      { name: "Cozy Knit Socks", category: "Accessories", item: "Socks", image: "https://images.unsplash.com/photo-1582966772680-860e372bb558?auto=format&fit=crop&q=80&w=800", price: 499 },
      { name: "Modern Chino Pants", category: "Pants", item: "Chinos", image: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&q=80&w=800", price: 2799 },
      { name: "Graphic Print Tee", category: "T-Shirts", item: "T-Shirt", image: "https://images.unsplash.com/photo-1503342394128-c104d54dba01?auto=format&fit=crop&q=80&w=800", price: 1699 },
      { name: "Windbreaker Pullover", category: "Outerwear", item: "Windbreaker", image: "https://images.unsplash.com/photo-1605518216938-7c31b7b14ad0?auto=format&fit=crop&q=80&w=800", price: 3299 }
    ];

    const demoProducts = [];
    // Generate 36 products by cloning the templates and slightly varying them or just duplicating.
    for(let i = 0; i < 36; i++) {
        const template = demoTemplates[i % demoTemplates.length];
        // Add a slight variance to name if it's a duplicate
        const isDuplicate = i >= demoTemplates.length;
        const variantSuffix = isDuplicate ? ` (Variant ${Math.floor(i / demoTemplates.length) + 1})` : '';
        
        demoProducts.push({
            name: `${template.name}${variantSuffix}`,
            description: `A quality ${template.item.toLowerCase()} perfect for any occasion. Designed with comfort in mind.`,
            price: template.price,
            currency: 'INR',
            category: template.category,
            imageUrl: template.image,
            stock: Math.floor(Math.random() * 100) + 10,
        });
    }

    if (!window.confirm("Add demo products?")) return;
    try {
      for (const product of demoProducts) {
        await addDoc(collection(db, 'products'), {
          ...product,
          createdAt: Date.now(),
          updatedAt: Date.now()
        });
      }
    } catch (err) {
      console.error(err);
      alert("Failed to add demo products.");
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        name,
        description: desc,
        price,
        currency: 'INR',
        category,
        imageUrl,
        stock,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      await addDoc(collection(db, 'products'), data);
      setName(''); setDesc(''); setPrice(0); setCategory(''); setImageUrl(''); setStock(0);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm("Delete this product?")) return;
    try {
      await deleteDoc(doc(db, 'products', id));
    } catch(err) {
      console.error(err);
    }
  };

  const handleUpdateStock = async (id: string, newStock: number) => {
    try {
      await updateDoc(doc(db, 'products', id), { stock: newStock, updatedAt: Date.now() });
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateOrderStatus = async (id: string, status: string) => {
    try {
      await updateDoc(doc(db, 'orders', id), { status });
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
