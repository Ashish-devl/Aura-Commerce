import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { Product, Order } from '../types';
import { formatCurrency } from '../lib/utils';
import { useNavigate, Link } from 'react-router-dom';
import { Plus, Trash2, Edit3, ShoppingBag, TrendingUp, Users, DollarSign, Package, Eye, ArrowLeft, RefreshCw, Layers } from 'lucide-react';

const getStartDate = (range: '7days' | 'month' | 'year') => {
  const d = new Date();
  d.setHours(0, 0, 0, 0); // start of today
  if (range === '7days') {
    d.setDate(d.getDate() - 6);
  } else if (range === 'month') {
    d.setDate(d.getDate() - 29);
  } else if (range === 'year') {
    d.setDate(d.getDate() - 364);
  }
  return d;
};

export default function AdminDashboard() {
  const { profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7days' | 'month' | 'year'>('7days');
  const [maxRangeFetched, setMaxRangeFetched] = useState<'none' | '7days' | 'month' | 'year'>('none');

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
      const currentHierarchy: Record<'7days' | 'month' | 'year', number> = { '7days': 1, 'month': 2, 'year': 3 };
      const maxHierarchy: Record<'none' | '7days' | 'month' | 'year', number> = { 'none': 0, '7days': 1, 'month': 2, 'year': 3 };
      
      const needsFetch = maxHierarchy[maxRangeFetched] < currentHierarchy[timeRange];
      
      if (needsFetch) {
        try {
          if (maxRangeFetched === 'none') {
            setLoading(true);
          }
          
          const startStamp = getStartDate(timeRange).getTime();
          const [prodList, orderList] = await Promise.all([
            products.length === 0 ? api.getProducts() : Promise.resolve(products),
            api.getOrders(startStamp)
          ]);
          
          if (products.length === 0) {
            setProducts(prodList);
          }
          setOrders(orderList);
          setMaxRangeFetched(timeRange);
        } catch (err) {
          console.error("Error fetching admin dashboard data:", err);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, authLoading, navigate, timeRange, maxRangeFetched, products.length]);

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

  // Analytics Calculations
  const getFilteredOrders = () => {
    const active = orders.filter(o => o.status !== 'cancelled');
    const startDate = getStartDate(timeRange);
    return active.filter(o => new Date(o.createdAt) >= startDate);
  };

  const activeOrders = getFilteredOrders();
  
  const filteredOrdersList = orders.filter(o => {
    const startDate = getStartDate(timeRange);
    return new Date(o.createdAt) >= startDate;
  });
  const totalRevenue = activeOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalOrdersCount = activeOrders.length;
  const aov = totalOrdersCount > 0 ? totalRevenue / totalOrdersCount : 0;
  const lowStockProducts = products.filter(p => p.stock <= 5);
  const lowStockCount = lowStockProducts.length;

  // Generate Sales Trend based on selected timeRange
  const getSalesTrend = () => {
    const trend = [];
    const now = new Date();

    if (timeRange === '7days') {
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        const dateString = d.toISOString().split('T')[0]; // YYYY-MM-DD
        const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
        const dateLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        
        const dailyOrders = activeOrders.filter(o => {
          const orderDate = new Date(o.createdAt).toISOString().split('T')[0];
          return orderDate === dateString;
        });
        const amount = dailyOrders.reduce((sum, o) => sum + o.totalAmount, 0);
        trend.push({ dateString, dayName, dateLabel, amount });
      }
    } else if (timeRange === 'month') {
      for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        const dateString = d.toISOString().split('T')[0]; // YYYY-MM-DD
        const dayName = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const dateLabel = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        
        const dailyOrders = activeOrders.filter(o => {
          const orderDate = new Date(o.createdAt).toISOString().split('T')[0];
          return orderDate === dateString;
        });
        const amount = dailyOrders.reduce((sum, o) => sum + o.totalAmount, 0);
        trend.push({ dateString, dayName, dateLabel, amount });
      }
    } else if (timeRange === 'year') {
      for (let i = 11; i >= 0; i--) {
        const d = new Date();
        d.setDate(1); // prevent month overflow
        d.setMonth(now.getMonth() - i);
        const monthIndex = d.getMonth();
        const year = d.getFullYear();
        
        const dayName = d.toLocaleDateString('en-US', { month: 'short' });
        const dateLabel = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        
        const monthlyOrders = activeOrders.filter(o => {
          const orderDate = new Date(o.createdAt);
          return orderDate.getMonth() === monthIndex && orderDate.getFullYear() === year;
        });
        const amount = monthlyOrders.reduce((sum, o) => sum + o.totalAmount, 0);
        trend.push({ dateString: `${year}-${String(monthIndex + 1).padStart(2, '0')}`, dayName, dateLabel, amount });
      }
    }
    return trend;
  };
  const salesTrend = getSalesTrend();

  // Category Sales calculation
  const getCategorySales = () => {
    const categoryTotals: Record<string, number> = {};
    const productCategoryMap = new Map<string, string>(
      products.map(p => [p.id, p.category] as [string, string])
    );

    activeOrders.forEach(o => {
      o.items.forEach(item => {
        const category = productCategoryMap.get(item.productId) || 'Uncategorized';
        const saleAmount = item.price * item.quantity;
        categoryTotals[category] = (categoryTotals[category] || 0) + saleAmount;
      });
    });

    const categoryList = Object.entries(categoryTotals).map(([name, amount]) => ({ name, amount }));
    categoryList.sort((a, b) => b.amount - a.amount);
    return categoryList;
  };
  const categorySales = getCategorySales();

  // Top Selling Products calculation
  const getTopSellingProducts = () => {
    const productSalesQty: Record<string, { qty: number; revenue: number }> = {};
    activeOrders.forEach(o => {
      o.items.forEach(item => {
        const current = productSalesQty[item.productId] || { qty: 0, revenue: 0 };
        productSalesQty[item.productId] = {
          qty: current.qty + item.quantity,
          revenue: current.revenue + (item.price * item.quantity)
        };
      });
    });

    const topProducts = Object.entries(productSalesQty).map(([productId, stats]) => {
      const prod = products.find(p => p.id === productId);
      return {
        id: productId,
        name: prod?.name || 'Deleted Product',
        imageUrl: prod?.imageUrl || '',
        price: prod?.price || 0,
        currency: prod?.currency || 'INR',
        quantitySold: stats.qty,
        revenue: stats.revenue
      };
    });

    topProducts.sort((a, b) => b.quantitySold - a.quantitySold);
    return topProducts.slice(0, 5);
  };
  const topSellers = getTopSellingProducts();

  // SVG Line Chart math
  const maxAmount = Math.max(...salesTrend.map(t => t.amount), 1000);
  const chartHeight = 160;
  const chartWidth = 500;
  const paddingLeft = 55;
  const paddingRight = 15;
  const paddingTop = 15;
  const paddingBottom = 25;

  const usableWidth = chartWidth - paddingLeft - paddingRight;
  const usableHeight = chartHeight - paddingTop - paddingBottom;

  const points = salesTrend.map((t, i) => {
    const x = paddingLeft + (i * usableWidth) / (salesTrend.length - 1);
    const y = chartHeight - paddingBottom - (t.amount / maxAmount) * usableHeight;
    return { x, y, ...t };
  });

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = points.length > 0 ? `${linePath} L ${points[points.length - 1].x} ${chartHeight - paddingBottom} L ${points[0].x} ${chartHeight - paddingBottom} Z` : '';

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Admin Dashboard</h1>
          <p className="text-slate-500 mt-2">Manage products, inventory, and incoming orders.</p>
        </div>
        <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl self-start sm:self-center">
          <button
            onClick={() => setTimeRange('7days')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              timeRange === '7days'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Last 7 Days
          </button>
          <button
            onClick={() => setTimeRange('month')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              timeRange === 'month'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Last Month
          </button>
          <button
            onClick={() => setTimeRange('year')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              timeRange === 'year'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Last Year
          </button>
        </div>
      </div>

      {/* Analytics Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Revenue */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Revenue</p>
            <p className="text-2xl font-bold text-slate-900">{formatCurrency(totalRevenue)}</p>
          </div>
        </div>

        {/* Card 2: Orders */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Orders</p>
            <p className="text-2xl font-bold text-slate-900">{totalOrdersCount}</p>
          </div>
        </div>

        {/* Card 3: AOV */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Avg. Order Value</p>
            <p className="text-2xl font-bold text-slate-900">{formatCurrency(aov)}</p>
          </div>
        </div>

        {/* Card 4: Low Stock */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-4">
          <div className={`p-3 rounded-xl ${lowStockCount > 0 ? 'bg-rose-50 text-rose-600 animate-pulse' : 'bg-slate-50 text-slate-600'}`}>
            <Package className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Low Stock Items</p>
            <p className={`text-2xl font-bold ${lowStockCount > 0 ? 'text-rose-600' : 'text-slate-900'}`}>{lowStockCount}</p>
          </div>
        </div>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Sales Trend Chart */}
        <div className="lg:col-span-3 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-900">
              {timeRange === '7days' ? 'Weekly Revenue Trend' : timeRange === 'month' ? 'Monthly Revenue Trend' : 'Yearly Revenue Trend'}
            </h2>
            <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
              {timeRange === '7days' ? 'Last 7 Days' : timeRange === 'month' ? 'Last Month' : 'Last Year'}
            </span>
          </div>
          <div className="relative w-full h-48">
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              {[0, 0.5, 1].map((ratio) => {
                const y = chartHeight - paddingBottom - ratio * usableHeight;
                const value = ratio * maxAmount;
                return (
                  <g key={ratio} className="opacity-40">
                    <line 
                      x1={paddingLeft} 
                      y1={y} 
                      x2={chartWidth - paddingRight} 
                      y2={y} 
                      stroke="#cbd5e1" 
                      strokeDasharray="4 4" 
                      strokeWidth="1" 
                    />
                    <text 
                      x={paddingLeft - 8} 
                      y={y + 4} 
                      textAnchor="end" 
                      className="text-[10px] fill-slate-400 font-mono font-medium"
                    >
                      {ratio === 0 ? '0' : formatCurrency(value).replace(/\.00$/, '')}
                    </text>
                  </g>
                );
              })}

              {/* Area Path */}
              {areaPath && (
                <path 
                  d={areaPath} 
                  fill="url(#chartGradient)" 
                />
              )}

              {/* Line Path */}
              {linePath && (
                <path 
                  d={linePath} 
                  fill="none" 
                  stroke="#4f46e5" 
                  strokeWidth="2.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                />
              )}

              {/* Data Points */}
              {points.map((p, i) => (
                <g key={i} className="group/dot cursor-pointer">
                  <circle 
                    cx={p.x} 
                    cy={p.y} 
                    r={timeRange === 'month' ? '2.5' : '4'} 
                    className="fill-indigo-600 stroke-white stroke-2 transition-all duration-200 hover:r-6" 
                  />
                  <title>{`${p.dateLabel}: ${formatCurrency(p.amount)}`}</title>
                </g>
              ))}

              {/* X Axis Labels */}
              {points.map((p, i) => {
                if (timeRange === 'month' && i % 5 !== 0) {
                  return null;
                }
                return (
                  <text 
                    key={i} 
                    x={p.x} 
                    y={chartHeight - 8} 
                    textAnchor="middle" 
                    className="text-[10px] fill-slate-500 font-medium"
                  >
                    {p.dayName}
                  </text>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Sales by Category */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Sales by Category</h2>
            <div className="space-y-4">
              {categorySales.map((c) => {
                const maxCategoryAmount = Math.max(...categorySales.map(item => item.amount), 1);
                const percent = (c.amount / maxCategoryAmount) * 100;
                return (
                  <div key={c.name} className="space-y-1.5">
                    <div className="flex justify-between text-xs sm:text-sm font-medium">
                      <span className="text-slate-600">{c.name}</span>
                      <span className="text-slate-950 font-semibold">{formatCurrency(c.amount)}</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-slate-900 h-full rounded-full transition-all duration-500 ease-out" 
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              {categorySales.length === 0 && (
                <div className="text-slate-400 text-sm text-center py-8">
                  No sales recorded yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Top Sellers & Low Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Top Sellers */}
        <div className="bg-slate-50 p-6 sm:p-8 rounded-2xl space-y-6">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">Top Selling Products</h2>
            <p className="text-slate-500 text-xs mt-1">Based on total quantities ordered.</p>
          </div>
          <div className="space-y-4">
            {topSellers.map((item, idx) => (
              <div key={item.id} className="flex items-center justify-between p-3.5 bg-white rounded-xl border border-slate-100 shadow-sm">
                <div className="flex items-center space-x-3.5">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                    #{idx + 1}
                  </div>
                  {item.imageUrl && (
                    <img 
                      src={item.imageUrl} 
                      className="w-10 h-10 rounded-lg object-cover bg-slate-100 flex-shrink-0" 
                      alt="" 
                    />
                  )}
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 line-clamp-1">{item.name}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{item.quantitySold} units sold</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-900">{formatCurrency(item.revenue)}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Revenue</p>
                </div>
              </div>
            ))}
            {topSellers.length === 0 && (
              <div className="text-slate-500 text-sm py-6 text-center bg-white rounded-xl border border-slate-100">
                No product sales data.
              </div>
            )}
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-slate-50 p-6 sm:p-8 rounded-2xl space-y-6">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">Low Stock Alerts</h2>
            <p className="text-slate-500 text-xs mt-1">Items with stock level of 5 or less.</p>
          </div>
          <div className="space-y-4 max-h-[320px] overflow-y-auto pr-1">
            {lowStockProducts.map((p) => (
              <div key={p.id} className="flex items-center justify-between p-3.5 bg-white rounded-xl border border-slate-100 shadow-sm">
                <div className="flex items-center space-x-3">
                  {p.imageUrl && (
                    <img 
                      src={p.imageUrl} 
                      className="w-10 h-10 rounded-lg object-cover bg-slate-100 flex-shrink-0" 
                      alt="" 
                    />
                  )}
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 line-clamp-1">{p.name}</h3>
                    <span className={`inline-flex items-center px-2 py-0.5 mt-1 rounded-full text-[10px] font-bold ${p.stock === 0 ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-amber-50 text-amber-700 border border-amber-100'}`}>
                      {p.stock === 0 ? 'Out of stock' : `${p.stock} remaining`}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <input 
                    type="number"
                    min="0"
                    defaultValue={p.stock}
                    className="w-16 rounded-lg border-slate-200 py-1 px-2 text-xs focus:ring-black focus:border-black text-center font-semibold"
                    onBlur={(e) => handleUpdateStock(p.id, Number(e.target.value))}
                  />
                  <span className="text-xs text-slate-400 font-medium">pcs</span>
                </div>
              </div>
            ))}
            {lowStockProducts.length === 0 && (
              <div className="text-slate-500 text-sm py-6 text-center bg-white rounded-xl border border-slate-100">
                All products are well stocked.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Add Product */}
        <section className="bg-slate-50 p-6 sm:p-8 rounded-2xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold tracking-tight">Add New Product</h2>
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
            {filteredOrdersList.map(order => (
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
            {filteredOrdersList.length === 0 && <p className="text-slate-500 text-sm">No orders yet.</p>}
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
