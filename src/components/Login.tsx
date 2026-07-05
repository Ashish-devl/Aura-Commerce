import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Mail, Lock, User, Shield, ArrowRight, AlertCircle } from 'lucide-react';

export default function Login() {
  const { loginWithEmail, loginAsDemo } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'customer' | 'admin'>('customer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get redirect path
  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await loginWithEmail(email, password, role);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (selectedRole: 'admin' | 'customer') => {
    setLoading(true);
    setError(null);
    try {
      await loginAsDemo(selectedRole);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Demo login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-3xl border border-slate-200/80 shadow-xl shadow-slate-100">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Welcome back
          </h2>
          <p className="text-sm text-slate-500 font-medium">
            Sign in to explore Aura's features
          </p>
        </div>

        {/* Role Selector Tabs for Login */}
        <div className="bg-slate-100 p-1.5 rounded-2xl flex relative">
          <button
            type="button"
            onClick={() => setRole('customer')}
            className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all duration-300 flex items-center justify-center space-x-2
              ${role === 'customer' 
                ? 'bg-white text-black shadow-md shadow-slate-200/50' 
                : 'text-slate-500 hover:text-slate-800'}`}
          >
            <User className="w-4 h-4" />
            <span>Customer Login</span>
          </button>
          <button
            type="button"
            onClick={() => setRole('admin')}
            className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all duration-300 flex items-center justify-center space-x-2
              ${role === 'admin' 
                ? 'bg-white text-black shadow-md shadow-slate-200/50' 
                : 'text-slate-500 hover:text-slate-800'}`}
          >
            <Shield className="w-4 h-4" />
            <span>Admin Login</span>
          </button>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl flex flex-col space-y-2 text-rose-800 text-sm">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-500" />
              <span className="font-semibold">{error}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4.5 h-4.5" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-850 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-black focus:border-black text-sm transition-all"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label htmlFor="password" className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  Password
                </label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4.5 h-4.5" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-850 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-black focus:border-black text-sm transition-all"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-3.5 px-4 rounded-xl font-bold uppercase tracking-wider text-xs hover:bg-slate-800 transition-all shadow-lg shadow-slate-100 disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            <span>{loading ? 'Signing In...' : `Sign In as ${role === 'admin' ? 'Admin' : 'Customer'}`}</span>
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        <div className="relative flex items-center justify-center my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200"></div>
          </div>
          <span className="relative px-4 bg-white text-xs font-bold text-slate-400 uppercase tracking-widest">
            or use demo account
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Quick Access Demo Customer Option */}
          <button
            type="button"
            onClick={() => handleDemoLogin('customer')}
            disabled={loading}
            className="bg-slate-100 hover:bg-slate-200 text-slate-800 py-3.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center space-x-2 active:scale-[0.98]"
          >
            <User className="w-4 h-4" />
            <span>Demo Customer</span>
          </button>

          {/* Quick Access Demo Admin Option */}
          <button
            type="button"
            onClick={() => handleDemoLogin('admin')}
            disabled={loading}
            className="bg-amber-600 hover:bg-amber-700 text-white py-3.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md shadow-amber-100 flex items-center justify-center space-x-2 active:scale-[0.98]"
          >
            <Shield className="w-4 h-4" />
            <span>Demo Admin</span>
          </button>
        </div>

        <div className="text-center pt-2">
          <p className="text-sm text-slate-500 font-medium">
            Don't have an account?{' '}
            <Link to="/signup" className="text-black font-bold hover:underline">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

