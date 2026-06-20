import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy, onSnapshot } from 'firebase/firestore';
import { Product, Order } from '../types';
import { formatCurrency } from '../lib/utils';
import { Plus, Trash2, Edit } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
  const { profile } = useAuth();
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
    if (profile && profile.role !== 'admin') {
      navigate('/');
      return;
    }

    if (!profile || profile.role !== 'admin') return;

    const qProducts = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    const unsubProducts = onSnapshot(qProducts, (snapshot) => {
      setProducts(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Product)));
    });

    const qOrders = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsubOrders = onSnapshot(qOrders, (snapshot) => {
      setOrders(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Order)));
      setLoading(false);
    });

    return () => {
      unsubProducts();
      unsubOrders();
    };
  }, [profile, navigate]);

  const handleSeedDemoProducts = async () => {
    const categories = ['T-Shirts', 'Outerwear', 'Sweatshirts', 'Pants', 'Accessories', 'Activewear'];
    const adjectives = ['Classic', 'Modern', 'Vintage', 'Essential', 'Premium', 'Minimalist', 'Urban', 'Cozy', 'Sleek', 'Casual'];
    const items = ['Tee', 'Jacket', 'Hoodie', 'Pants', 'Backpack', 'Joggers', 'Sweater', 'Shorts', 'Cap', 'Socks'];
    const colors = ['Black', 'White', 'Navy', 'Olive', 'Grey', 'Crimson', 'Beige', 'Charcoal', 'Indigo', 'Maroon'];
    const images = [
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1576871337622-98d48d1cf531?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1517438476312-10d79c077509?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1489987707023-afc82478163a?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1495105787522-5334e3ffa0ef?auto=format&fit=crop&q=80&w=800'
    ];

    const demoProducts = [];
    for(let i = 0; i < 50; i++) {
        const catObj = categories[i % categories.length];
        const adj = adjectives[i % adjectives.length];
        const item = items[i % items.length];
        const color = colors[i % colors.length];
        
        demoProducts.push({
            name: `${adj} ${color} ${item}`,
            description: `A ${adj.toLowerCase()} quality ${color.toLowerCase()} ${item.toLowerCase()} perfect for any occasion. Designed with comfort in mind.`,
            price: Math.floor(Math.random() * 4000) + 999,
            currency: 'INR',
            category: catObj,
            imageUrl: images[i % images.length],
            stock: Math.floor(Math.random() * 100) + 10,
        });
    }

    if (!window.confirm("Add 50 demo products?")) return;
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
          <h2 className="text-xl font-bold tracking-tight mb-6">Recent Orders</h2>
          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
            {orders.map(order => (
              <div key={order.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-xs font-mono text-slate-500">ID: {order.id}</p>
                    <p className="font-semibold">{formatCurrency(order.totalAmount)} • {order.items.length} items</p>
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
                <div className="text-sm text-slate-600 line-clamp-1">
                  {order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
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
