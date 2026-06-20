import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, User, Heart, Search, LogOut, Package } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function Layout() {
  const { user, profile, loginWithGoogle, logout } = useAuth();
  const { totalItems } = useCart();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-2">
              <ShoppingBag className="w-8 h-8 text-black" />
              <span className="font-sans font-bold text-xl tracking-tight">AURA</span>
            </Link>
            
            <div className="flex items-center space-x-6">
              {user ? (
                <>
                  {profile?.role === 'admin' && (
                    <Link to="/admin" className="text-slate-600 hover:text-black font-medium text-sm transition-colors">
                      Admin
                    </Link>
                  )}
                  <Link to="/orders" className="text-slate-600 hover:text-black">
                    <Package className="w-5 h-5" />
                  </Link>
                  <Link to="/wishlist" className="text-slate-600 hover:text-black">
                    <Heart className="w-5 h-5" />
                  </Link>
                  <Link to="/cart" className="text-slate-600 hover:text-black relative">
                    <ShoppingBag className="w-5 h-5" />
                    {totalItems > 0 && (
                      <span className="absolute -top-2 -right-2 bg-black text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                        {totalItems}
                      </span>
                    )}
                  </Link>
                  <button onClick={logout} className="text-slate-600 hover:text-black">
                    <LogOut className="w-5 h-5" />
                  </button>
                </>
              ) : (
                <>
                  <Link to="/cart" className="text-slate-600 hover:text-black relative">
                    <ShoppingBag className="w-5 h-5" />
                    {totalItems > 0 && (
                      <span className="absolute -top-2 -right-2 bg-black text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                        {totalItems}
                      </span>
                    )}
                  </Link>
                  <button onClick={loginWithGoogle} className="flex items-center space-x-2 text-sm font-medium text-slate-600 hover:text-black transition-colors">
                    <User className="w-5 h-5" />
                    <span className="hidden sm:inline">Sign In</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <Outlet />
      </main>

      <footer className="bg-white border-t border-slate-200 py-12 text-center text-sm text-slate-500">
        <div className="max-w-7xl mx-auto px-4">
          <p>© {new Date().getFullYear()} Aura Commerce. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
