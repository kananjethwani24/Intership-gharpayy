'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function OwnerLoginPage() {
  const router = useRouter();
  const [emailOrUser, setEmailOrUser] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailOrUser, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Login failed. Please try again.');
        return;
      }

      // Redirect to owner portal or dashboard based on role
      if (data.user?.role === 'owner') {
        router.push('/owner-portal');
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#F8F9FA]">

      {/* Ambient background glows */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(249,115,22,0.05) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 80% 80%, rgba(249,115,22,0.03) 0%, transparent 60%)',
        }}
      />

      {/* Grid overlay */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            'linear-gradient(#E5E7EB 1px, transparent 1px), linear-gradient(90deg, #E5E7EB 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative w-full max-w-md mx-4">

        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-4"
            style={{ background: 'linear-gradient(135deg, #F97316 0%, #FB923C 100%)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M3 9.5L12 3L21 9.5V20C21 20.55 20.55 21 20 21H15V15H9V21H4C3.45 21 3 20.55 3 20V9.5Z"
                fill="white" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[#111827] tracking-tight">Owner Portal</h1>
          <p className="text-sm mt-1.5 text-[#4B5563]">
            Sign in to manage your GharPayy properties
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl border p-8"
          style={{
            background: '#FFF6F4',
            borderColor: '#FEE2E2',
            boxShadow: '0 4px 24px -12px rgba(0,0,0,0.05)',
          }}
        >

          {/* Error message */}
          {error && (
            <div
              className="flex items-center gap-2.5 p-3.5 rounded-xl mb-6 text-sm"
              style={{
                background: '#FEF2F2',
                border: '1px solid #FECACA',
                color: '#B91C1C',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="flex flex-col gap-5" id="owner-login-form">

            {/* Username/Email field */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="owner-email" className="text-sm font-semibold text-[#374151]">
                Username or Email
              </label>
              <input
                id="owner-email"
                type="text"
                placeholder="Enter username or email"
                value={emailOrUser}
                onChange={(e) => setEmailOrUser(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-150"

                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  color: '#111827',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#F97316';
                  e.target.style.boxShadow = '0 0 0 3px rgba(249,115,22,0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#E5E7EB';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Password field */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="owner-password" className="text-sm font-semibold text-[#374151]">
                Password
              </label>
              <div className="relative">
                <input
                  id="owner-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full px-4 py-3 pr-12 rounded-xl text-sm outline-none transition-all duration-150"
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #E5E7EB',
                    color: '#111827',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#F97316';
                    e.target.style.boxShadow = '0 0 0 3px rgba(249,115,22,0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#E5E7EB';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                <button
                  type="button"
                  id="toggle-password-visibility"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors duration-150"
                  style={{ color: '#9CA3AF' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#4B5563')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#9CA3AF')}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Submit button */}
            <button
              id="owner-login-submit"
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all duration-150 mt-2 relative overflow-hidden"
              style={{
                background: loading
                  ? '#FB923C'
                  : '#F97316',
                boxShadow: loading ? 'none' : '0 4px 12px rgba(249,115,22,0.2)',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
              onMouseEnter={(e) => {
                if (!loading) e.currentTarget.style.filter = 'brightness(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.filter = 'none';
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeOpacity="0.25" />
                    <path d="M21 12a9 9 0 00-9-9" />
                  </svg>
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>

          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-[#E5E7EB]" />
            <span className="text-xs text-[#9CA3AF]">or</span>
            <div className="flex-1 h-px bg-[#E5E7EB]" />
          </div>

          {/* Admin login link */}
          <p className="text-center text-xs text-[#6B7280]">
            Are you an admin?{' '}
            <a
              href="/auth"
              id="go-to-admin-login"
              className="font-bold transition-colors duration-150 text-[#F97316]"
              onMouseEnter={(e) => (e.currentTarget.style.color = '#FB923C')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#F97316')}
            >
              Sign in as Admin
            </a>
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-xs mt-8 text-[#9CA3AF]">
          © 2026 GharPayy Dashboard. Secure access.
        </p>
      </div>
    </div>
  );
}
