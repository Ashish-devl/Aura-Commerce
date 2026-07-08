import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, User, Heart, Search, LogOut, Package, ChevronDown } from 'lucide-react';
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
            <div className="flex items-center space-x-8">
              <Link to="/" className="flex items-center space-x-2">
                <ShoppingBag className="w-8 h-8 text-black" />
                <span className="font-sans font-bold text-xl tracking-tight">AURA</span>
              </Link>
              
              <nav className="hidden md:flex items-center space-x-6 h-full">
                {/* Men */}
                <div className="relative group h-full flex items-center">
                  <Link to="/?category=Men" className="text-slate-600 hover:text-black font-semibold text-sm transition-colors uppercase tracking-wider py-5 flex items-center">
                    Men <ChevronDown className="w-3.5 h-3.5 ml-1" />
                  </Link>
                  <div className="absolute left-0 top-[calc(100%-12px)] w-44 bg-white border border-slate-100 shadow-md rounded-xl py-2 hidden group-hover:block z-50">
                    <Link to="/?category=Men&sub=Shirts" className="block px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-black rounded-lg mx-1 transition-colors">
                      Shirts & Tops
                    </Link>
                    <Link to="/?category=Men&sub=Pants" className="block px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-black rounded-lg mx-1 transition-colors">
                      Pants & Jeans
                    </Link>
                    <Link to="/?category=Men&sub=Accessories" className="block px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-black rounded-lg mx-1 transition-colors">
                      Accessories
                    </Link>
                  </div>
                </div>

                {/* Women */}
                <div className="relative group h-full flex items-center">
                  <Link to="/?category=Women" className="text-slate-600 hover:text-black font-semibold text-sm transition-colors uppercase tracking-wider py-5 flex items-center">
                    Women <ChevronDown className="w-3.5 h-3.5 ml-1" />
                  </Link>
                  <div className="absolute left-0 top-[calc(100%-12px)] w-44 bg-white border border-slate-100 shadow-md rounded-xl py-2 hidden group-hover:block z-50">
                    <Link to="/?category=Women&sub=Shirts" className="block px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-black rounded-lg mx-1 transition-colors">
                      Shirts & Tops
                    </Link>
                    <Link to="/?category=Women&sub=Pants" className="block px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-black rounded-lg mx-1 transition-colors">
                      Pants & Jeans
                    </Link>
                    <Link to="/?category=Women&sub=Accessories" className="block px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-black rounded-lg mx-1 transition-colors">
                      Accessories
                    </Link>
                  </div>
                </div>

                {/* Kids */}
                <div className="relative group h-full flex items-center">
                  <Link to="/?category=Kids" className="text-slate-600 hover:text-black font-semibold text-sm transition-colors uppercase tracking-wider py-5 flex items-center">
                    Kids <ChevronDown className="w-3.5 h-3.5 ml-1" />
                  </Link>
                  <div className="absolute left-0 top-[calc(100%-12px)] w-44 bg-white border border-slate-100 shadow-md rounded-xl py-2 hidden group-hover:block z-50">
                    <Link to="/?category=Kids&sub=Shirts" className="block px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-black rounded-lg mx-1 transition-colors">
                      Shirts & Tops
                    </Link>
                    <Link to="/?category=Kids&sub=Pants" className="block px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-black rounded-lg mx-1 transition-colors">
                      Pants & Jeans
                    </Link>
                    <Link to="/?category=Kids&sub=Accessories" className="block px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-black rounded-lg mx-1 transition-colors">
                      Accessories
                    </Link>
                  </div>
                </div>

                {/* Accessories */}
                <Link to="/?category=Accessories" className="text-slate-600 hover:text-black font-semibold text-sm transition-colors uppercase tracking-wider">
                  Accessories
                </Link>

                {/* Footwear */}
                <Link to="/?category=Footwear" className="text-slate-600 hover:text-black font-semibold text-sm transition-colors uppercase tracking-wider">
                  Footwear
                </Link>
              </nav>
            </div>
            
            <div className="flex items-center space-x-6">
              {user ? (
                <>
                  {profile?.role === 'admin' && (
                    <>
                      <Link to="/admin" className="text-slate-600 hover:text-black font-medium text-sm transition-colors">
                        Admin
                      </Link>
                      <Link to="/admin/orders" className="text-slate-600 hover:text-black font-medium text-sm transition-colors">
                        Admin Orders
                      </Link>
                    </>
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
                  <Link to="/login" className="flex items-center space-x-2 text-sm font-medium text-slate-600 hover:text-black transition-colors">
                    <User className="w-5 h-5" />
                    <span className="hidden sm:inline">Sign In</span>
                  </Link>
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
          <p className="mt-2 text-slate-400">Developed by Ashish</p>
        </div>
      </footer>
    </div>
  );
}
