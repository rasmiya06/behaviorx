'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldCheck, ArrowRight, Lock, KeyRound, Terminal, CheckCircle2 } from 'lucide-react';

export default function PlatformLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('engineer@behaviorx.dev');
  const [password, setPassword] = useState('behaviorx2024');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      try {
        localStorage.setItem(
          'bx_auth',
          JSON.stringify({
            email,
            name: 'Principal QA Engineer',
            token: 'bx_' + Math.random().toString(36).substring(2, 9),
          })
        );
      } catch (e) {}

      setIsSubmitting(false);
      router.push('/');
    }, 400);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-center items-center p-4 selection:bg-zinc-800">
      {/* Brand Header */}
      <div className="mb-6 text-center max-w-sm">
        <div className="w-12 h-12 rounded-xl bg-zinc-100 text-zinc-950 font-black flex items-center justify-center text-lg tracking-tighter mx-auto mb-3 shadow-xl">
          BX
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-100">BehaviorX Console</h1>
        <p className="text-xs text-zinc-400 mt-1 font-mono">
          Sign in to launch autonomous browser scans & replay discovered bugs
        </p>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-sm bg-zinc-900/90 border border-zinc-800 rounded-xl p-6 shadow-2xl backdrop-blur">
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-zinc-400 mb-1.5">
              Engineer Email
            </label>
            <input
              id="bx-login-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="engineer@behaviorx.dev"
              className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-200 font-mono focus:outline-none focus:border-zinc-700"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-mono text-zinc-400">Password</label>
              <span className="text-[10px] font-mono text-zinc-500">Secure Access</span>
            </div>
            <input
              id="bx-login-password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-200 font-mono focus:outline-none focus:border-zinc-700"
            />
          </div>

          <button
            id="bx-btn-submit-login"
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 bg-zinc-100 hover:bg-zinc-200 disabled:opacity-50 text-zinc-950 font-semibold text-xs font-mono rounded flex items-center justify-center gap-2 transition-colors cursor-pointer mt-2 shadow-md"
          >
            <span>{isSubmitting ? 'Authenticating...' : 'Sign In to Console'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        <div className="mt-4 pt-4 border-t border-zinc-800 flex items-center justify-between text-[10px] font-mono text-zinc-500">
          <span>FirstCommit Hackathon Edition</span>
          <span className="text-emerald-400">● System Ready</span>
        </div>
      </div>
    </div>
  );
}
