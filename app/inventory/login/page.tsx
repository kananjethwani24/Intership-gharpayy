'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function InventoryLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const endpoint = isRegister
        ? '/api/inventory/auth/register'
        : '/api/inventory/auth/login';

      const body: any = { email, password };
      if (isRegister) {
        body.name = name;
        body.phone = phone;
        body.role = 'OWNER';
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Something went wrong');
        return;
      }

      // Store token and user info
      localStorage.setItem('inv_token', data.token);
      localStorage.setItem('inv_user', JSON.stringify(data.user));

      // Route based on role
      if (data.user.role === 'OWNER') {
        router.push('/inventory/owner');
      } else if (data.user.role === 'SALES') {
        router.push('/inventory/sales');
      } else {
        router.push('/inventory/admin');
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
    }}>
      <div className="w-full max-w-md mx-4">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4" style={{
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            boxShadow: '0 8px 32px rgba(99, 102, 241, 0.3)',
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Gharpayy Inventory OS</h1>
          <p className="text-slate-400 mt-2 text-sm">Real-time inventory truth. Zero ghost rooms.</p>
        </div>

        {/* Login Card */}
        <div className="rounded-2xl p-8" style={{
          background: 'rgba(30, 41, 59, 0.8)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(99, 102, 241, 0.2)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        }}>
          <h2 className="text-xl font-semibold text-white mb-6">
            {isRegister ? 'Create Account' : 'Sign In'}
          </h2>

          {error && (
            <div className="mb-4 p-3 rounded-lg text-sm" style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#fca5a5',
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-xl text-white placeholder-slate-500 outline-none transition-all duration-200"
                    style={{
                      background: 'rgba(15, 23, 42, 0.6)',
                      border: '1px solid rgba(99, 102, 241, 0.2)',
                    }}
                    onFocus={e => e.target.style.borderColor = 'rgba(99, 102, 241, 0.6)'}
                    onBlur={e => e.target.style.borderColor = 'rgba(99, 102, 241, 0.2)'}
                    placeholder="Suresh Patel"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Phone</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-white placeholder-slate-500 outline-none transition-all duration-200"
                    style={{
                      background: 'rgba(15, 23, 42, 0.6)',
                      border: '1px solid rgba(99, 102, 241, 0.2)',
                    }}
                    onFocus={e => e.target.style.borderColor = 'rgba(99, 102, 241, 0.6)'}
                    onBlur={e => e.target.style.borderColor = 'rgba(99, 102, 241, 0.2)'}
                    placeholder="9876543210"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl text-white placeholder-slate-500 outline-none transition-all duration-200"
                style={{
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(99, 102, 241, 0.2)',
                }}
                onFocus={e => e.target.style.borderColor = 'rgba(99, 102, 241, 0.6)'}
                onBlur={e => e.target.style.borderColor = 'rgba(99, 102, 241, 0.2)'}
                placeholder="owner@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl text-white placeholder-slate-500 outline-none transition-all duration-200"
                style={{
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(99, 102, 241, 0.2)',
                }}
                onFocus={e => e.target.style.borderColor = 'rgba(99, 102, 241, 0.6)'}
                onBlur={e => e.target.style.borderColor = 'rgba(99, 102, 241, 0.2)'}
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-white transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                boxShadow: '0 4px 20px rgba(99, 102, 241, 0.4)',
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {isRegister ? 'Creating...' : 'Signing in...'}
                </span>
              ) : (
                isRegister ? 'Create Account' : 'Sign In'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => { setIsRegister(!isRegister); setError(''); }}
              className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              {isRegister ? 'Already have an account? Sign In' : 'Need an account? Register'}
            </button>
          </div>

          {/* Quick access demo credentials */}
          <div className="mt-6 pt-6" style={{ borderTop: '1px solid rgba(99, 102, 241, 0.15)' }}>
            <p className="text-xs text-slate-500 mb-3 text-center">Demo Quick Login</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[
                { label: 'Supriya (Owner)', email: 'owner.clean.8884449621@gharpayy.com' },
                { label: 'Priyanka (Owner)', email: 'owner.clean.6364800803@gharpayy.com' },
                { label: 'Sales View', email: 'ravi@gharpayy.com' },
                { label: 'Admin View', email: 'admin@gharpayy.com' },
              ].map(demo => (
                <button
                  key={demo.label}
                  onClick={() => { setEmail(demo.email); setPassword('password123'); setIsRegister(false); }}
                  className="py-2 px-3 rounded-lg text-xs font-medium transition-all duration-200 hover:scale-105"
                  style={{
                    background: 'rgba(99, 102, 241, 0.1)',
                    border: '1px solid rgba(99, 102, 241, 0.2)',
                    color: '#a5b4fc',
                  }}
                >
                  {demo.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
