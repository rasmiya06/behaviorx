'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Lock, ShieldCheck, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('alex@novastore.internal');
  const [password, setPassword] = useState('password123');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setAuthError(null);

    if (!email || !password) {
      setAuthError('Email and password are required.');
      setIsSubmitting(false);
      return;
    }

    // Authenticate
    setTimeout(() => {
      const user = {
        email,
        name: 'Alex Mercer',
        role: 'Verified Buyer',
        token: 'auth_' + Math.random().toString(36).substring(2, 9),
      };

      try {
        localStorage.setItem('novastore_user', JSON.stringify(user));
        document.cookie = `novastore_session=${user.token}; path=/`;
      } catch (e) {}

      setIsSubmitting(false);
      setAuthSuccess(true);

      // Redirect into the store catalog once authenticated
      setTimeout(() => {
        router.push('/demo-app');
      }, 600);
    }, 400);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-center items-center p-4">
      {/* Brand Header */}
      <div className="mb-6 text-center">
        <div className="w-10 h-10 rounded-lg bg-zinc-100 text-zinc-950 font-black flex items-center justify-center text-base tracking-tighter mx-auto mb-3">
          NV
        </div>
        <h1 className="text-xl font-bold tracking-tight text-zinc-100">NovaStore Gate</h1>
        <p className="text-xs text-zinc-400 mt-1 font-mono">
          Authentication Gateway • Sign in to access the store catalog
        </p>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-sm bg-zinc-900/90 border border-zinc-800 rounded-xl p-6 shadow-2xl backdrop-blur">
        {authSuccess ? (
          <div className="text-center py-6 space-y-3">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
            <h2 className="text-sm font-semibold text-zinc-100">Authenticated Successfully</h2>
            <p className="text-xs text-zinc-400 font-mono">Unlocking catalog and redirecting...</p>
          </div>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4">
            {authError && (
              <div className="p-2.5 bg-rose-950/40 border border-rose-800 rounded text-xs font-mono text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                <span>{authError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-mono text-zinc-400 mb-1.5">
                Email Address
              </label>
              <input
                id="login-email-input"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex@novastore.internal"
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-200 font-mono focus:outline-none focus:border-zinc-700"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-mono text-zinc-400">Password</label>
                {/* BUG 1: Dead End navigation link */}
                <Link
                  id="link-forgot-password"
                  href="/demo-app/forgot-password"
                  className="text-xs text-zinc-400 hover:text-zinc-200 underline underline-offset-2"
                >
                  Forgot password?
                </Link>
              </div>
              <input
                id="login-password-input"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="password123"
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-200 font-mono focus:outline-none focus:border-zinc-700"
              />
            </div>

            <button
              id="btn-submit-login"
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 bg-zinc-100 hover:bg-zinc-200 disabled:opacity-50 text-zinc-950 font-semibold text-xs font-mono rounded flex items-center justify-center gap-2 transition-colors cursor-pointer mt-2"
            >
              <span>{isSubmitting ? 'Authenticating...' : 'Sign In to Store'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        )}

        <div className="mt-4 pt-4 border-t border-zinc-800 text-[10px] font-mono text-zinc-500 text-center">
          Demo Credentials: <code>alex@novastore.internal</code> / <code>password123</code>
        </div>
      </div>
    </div>
  );
}
