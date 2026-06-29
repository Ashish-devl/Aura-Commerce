import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Mail, Lock, User, Shield, CheckCircle, ArrowRight, AlertCircle } from 'lucide-react';

export default function Login() {
  const { loginWithEmail, loginWithGoogle, loginAsDemo } = useAuth();
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

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await loginWithGoogle(role);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed.');
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

        {error && (
          <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl flex flex-col space-y-2 text-rose-800 text-sm">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-500" />
              <span className="font-semibold">{error}</span>
            </div>
          </div>
        )}

        <div className="space-y-4 pt-4">
          {/* Google Authentication */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 py-3.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center space-x-3 shadow-sm hover:border-slate-350 active:scale-[0.98]"
          >
            <svg className="w-4.5 h-4.5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{loading ? 'Processing...' : 'Continue with Google'}</span>
          </button>

          {/* Quick Access Demo Admin Option */}
          <button
            type="button"
            onClick={() => handleDemoLogin('admin')}
            disabled={loading}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white py-3.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md shadow-amber-100 flex items-center justify-center space-x-2 active:scale-[0.98]"
          >
            <Shield className="w-4 h-4" />
            <span>{loading ? 'Logging in...' : 'Sign in as Demo Admin'}</span>
          </button>
        </div>

        <div className="pt-4 border-t border-slate-100 text-center">
          <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
            Interviewer Quick Access: Instantly sign in as an Admin to explore dashboards, manage products, and view orders.
          </p>
        </div>
      </div>
    </div>
  );
}
