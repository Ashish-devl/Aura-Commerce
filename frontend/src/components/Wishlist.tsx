import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { Product } from '../types';
import { Link } from 'react-router-dom';
import { formatCurrency } from '../lib/utils';
import { HeartOff } from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function Wishlist() {
  const { user, profile, refreshProfile } = useAuth();
  const { addToCart } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.wishlist) {
      setLoading(false);
      return;
    }

    const fetchWishlist = async () => {
      try {
        const data = await api.getWishlist();
        setProducts(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchWishlist();
  }, [profile]);

  const handleRemove = async (productId: string) => {
    if (!user || !profile) return;
    try {
      const newWishlist = profile.wishlist.filter(id => id !== productId);
      await api.updateWishlist(newWishlist);
      setProducts(products.filter(p => p.id !== productId));
      await refreshProfile();
    } catch (err) {
      console.error(err);
    }
  };

  if (!user) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-bold tracking-tight">Sign in to view your wishlist</h2>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Your Wishlist</h1>
        <p className="text-slate-500 mt-2">Saved items that you love.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse flex flex-col space-y-4">
              <div className="bg-slate-200 aspect-[3/4] rounded-xl"></div>
              <div className="h-4 bg-slate-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map(product => (
            <div key={product.id} className="group flex flex-col gap-3 relative">
              <Link to={`/product/${product.id}`} className="block relative aspect-[3/4] overflow-hidden rounded-xl bg-slate-100">
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                />
              </Link>
              <button 
                onClick={() => handleRemove(product.id)}
                className="absolute top-4 right-4 p-2 bg-white/80 backdrop-blur-sm rounded-full text-slate-400 hover:text-red-500 shadow-sm transition-colors"
                title="Remove from wishlist"
              >
                <HeartOff className="w-4 h-4" />
              </button>
              <div className="flex flex-col items-start gap-1">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-widest">{product.category}</p>
                <Link to={`/product/${product.id}`} className="text-sm font-semibold text-slate-900 line-clamp-1">{product.name}</Link>
                <p className="text-sm font-medium text-slate-900">{formatCurrency(product.price, product.currency)}</p>
              </div>
              <button 
                onClick={() => addToCart(product)}
                disabled={product.stock <= 0}
                className="mt-2 w-full bg-black text-white px-4 py-2 rounded-full font-semibold text-sm uppercase tracking-wider hover:bg-slate-800 disabled:opacity-50 transition-colors"
              >
                Add to Cart
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-slate-50 rounded-2xl">
          <p className="text-slate-500 mb-4">Your wishlist is empty.</p>
          <Link to="/" className="text-black font-semibold uppercase tracking-wider text-sm border-b border-black">Discover items</Link>
        </div>
      )}
    </div>
  );
}
