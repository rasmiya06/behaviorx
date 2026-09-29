'use client';

import React, { useState } from 'react';
import {
  Play,
  Loader2,
  Globe,
  ExternalLink,
  AlertTriangle,
  Lock,
  User,
  KeyRound,
  CheckCircle,
  X,
  ChevronDown,
} from 'lucide-react';

interface TopNavProps {
  url: string;
  setUrl: (url: string) => void;
  isScanning: boolean;
  onStartScan: () => void;
  status: 'IDLE' | 'SCANNING' | 'COMPLETED' | 'ERROR';
  anomaliesCount: number;
  authEmail: string;
  setAuthEmail: (email: string) => void;
  authPassword: string;
  setAuthPassword: (pwd: string) => void;
  enableAuth: boolean;
  setEnableAuth: (enabled: boolean) => void;
}

export function TopNav({
  url,
  setUrl,
  isScanning,
  onStartScan,
  status,
  anomaliesCount,
  authEmail,
  setAuthEmail,
  authPassword,
  setAuthPassword,
  enableAuth,
  setEnableAuth,
}: TopNavProps) {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isPlatformLoginOpen, setIsPlatformLoginOpen] = useState(false);
  const [platformUser, setPlatformUser] = useState<{ email: string } | null>(null);
  const [loginEmailInput, setLoginEmailInput] = useState('');
  const [loginPasswordInput, setLoginPasswordInput] = useState('');

  const handleLoadSample = () => {
    setUrl('http://localhost:3000/demo-app');
    setAuthEmail('alex@novastore.internal');
    setAuthPassword('password123');
    setEnableAuth(true);
  };

  const handlePlatformLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmailInput) return;
    setPlatformUser({ email: loginEmailInput });
    setIsPlatformLoginOpen(false);
  };

  return (
    <>
      <header className="h-14 border-b border-zinc-800 bg-zinc-950/95 sticky top-0 z-30 px-4 flex items-center justify-between gap-4">
        {/* Brand & Status */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-zinc-100 text-zinc-950 font-black flex items-center justify-center text-xs tracking-tighter">
              BX
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm tracking-tight text-zinc-100">BehaviorX</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800/80 text-zinc-400 border border-zinc-700/50">
                  Universal
                </span>
              </div>
            </div>
          </div>

          <div className="h-4 w-[1px] bg-zinc-800 mx-1 hidden sm:block" />

          {/* Dynamic Status Pill */}
          <div className="hidden md:flex items-center gap-2">
            {status === 'IDLE' && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-zinc-400">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-500"></span>
                <span>READY</span>
              </div>
            )}

            {status === 'SCANNING' && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-950/60 border border-sky-800/60 text-[11px] font-mono text-sky-400 animate-pulse">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>EXPLORING APPLICATION...</span>
              </div>
            )}

            {status === 'COMPLETED' && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-950/40 border border-rose-900/60 text-[11px] font-mono text-rose-300">
                <AlertTriangle className="w-3 h-3 text-rose-400" />
                <span>{anomaliesCount} ANOMALIES FLAGGED</span>
              </div>
            )}
          </div>
        </div>

        {/* Center: Target URL Input + Sign In / Auth Config in Front */}
        <div className="flex-1 max-w-2xl flex items-center gap-2">
          {/* Target Website Sign In / Credentials Config Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsAuthOpen(!isAuthOpen)}
              className={`h-8 px-2.5 rounded-md border text-xs font-mono flex items-center gap-1.5 transition-colors ${
                enableAuth && authEmail
                  ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
              title="Configure Sign In / Credentials for this website"
            >
              <KeyRound className="w-3.5 h-3.5 text-zinc-400" />
              <span className="hidden sm:inline">
                {enableAuth && authEmail ? 'Auth: On' : 'Target Sign In'}
              </span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>

            {/* Auth Credentials Popover */}
            {isAuthOpen && (
              <div className="absolute left-0 top-10 w-72 bg-zinc-900 border border-zinc-800 rounded-lg p-3.5 shadow-2xl z-50 text-xs font-mono">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-800">
                  <div className="flex items-center gap-1.5 font-semibold text-zinc-200">
                    <Lock className="w-3.5 h-3.5 text-sky-400" />
                    <span>Target Site Auth</span>
                  </div>
                  <button
                    onClick={() => setIsAuthOpen(false)}
                    className="text-zinc-500 hover:text-zinc-300"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <p className="text-[11px] text-zinc-400 mb-3 font-sans leading-normal">
                  If the target website requires login, BehaviorX will automatically detect the login form and enter these credentials:
                </p>

                <div className="space-y-2 mb-3">
                  <div>
                    <label className="block text-[10px] text-zinc-400 mb-1">Email / Username</label>
                    <input
                      type="text"
                      placeholder="e.g. user@example.com"
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-zinc-400 mb-1">Password</label>
                    <input
                      type="password"
                      placeholder="e.g. password123"
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
                  <label className="flex items-center gap-2 text-[11px] text-zinc-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enableAuth}
                      onChange={(e) => setEnableAuth(e.target.checked)}
                      className="rounded bg-zinc-950 border-zinc-700 text-sky-500 focus:ring-0"
                    />
                    <span>Enable Auto-Login</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsAuthOpen(false)}
                    className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded text-[11px]"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Clean Universal URL Input */}
          <div className="relative flex-1 flex items-center">
            <Globe className="w-3.5 h-3.5 absolute left-3 text-zinc-500" />
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={isScanning}
              placeholder="Enter any website URL (e.g. https://example.com)..."
              className="w-full bg-zinc-900/90 border border-zinc-800 rounded-md pl-9 pr-3 py-1.5 text-xs font-mono text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-700 transition-colors disabled:opacity-50"
            />
          </div>

          {/* Quick Real Websites Preset Dropdown */}
          <div className="relative">
            <select
              onChange={(e) => {
                const val = e.target.value;
                if (!val) return;
                setUrl(val);
                if (val.includes('demo-app')) {
                  setAuthEmail('alex@novastore.internal');
                  setAuthPassword('password123');
                  setEnableAuth(true);
                } else if (val.includes('quotes.toscrape.com')) {
                  setAuthEmail('admin');
                  setAuthPassword('admin');
                  setEnableAuth(true);
                }
              }}
              value=""
              className="h-8 px-2 bg-zinc-900 border border-zinc-800 rounded-md text-xs font-mono text-zinc-400 hover:text-zinc-200 focus:outline-none focus:border-zinc-700 cursor-pointer"
              title="Select a sample real website to test"
            >
              <option value="" disabled>Samples ▾</option>
              <option value="https://example.com">example.com (Clean)</option>
              <option value="https://news.ycombinator.com">news.ycombinator.com (HN)</option>
              <option value="https://quotes.toscrape.com">quotes.toscrape.com (Login Site)</option>
              <option value="http://localhost:3000/demo-app">NovaStore (3 Bugs Demo)</option>
            </select>
          </div>

          {url && (
            <a
              href={url.startsWith('http') ? url : `http://${url}`}
              target="_blank"
              rel="noreferrer"
              title="Open target URL in new window"
              className="p-2 text-zinc-400 hover:text-zinc-200 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-md transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>

        {/* Platform Account & Primary Scan CTA */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* BehaviorX Account Sign In Button */}
          {platformUser ? (
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 bg-zinc-900 border border-zinc-800 rounded text-xs font-mono text-zinc-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span className="truncate max-w-[100px]">{platformUser.email}</span>
            </div>
          ) : (
            <button
              onClick={() => setIsPlatformLoginOpen(true)}
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-mono text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 transition-colors"
            >
              <User className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}

          <button
            onClick={onStartScan}
            disabled={isScanning}
            className="h-9 px-4 rounded bg-zinc-100 hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-500 text-zinc-950 font-semibold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-sm active:scale-[0.98]"
          >
            {isScanning ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-800" />
                <span>Scanning...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Run Autonomous Scan</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* BehaviorX Platform Sign In Modal */}
      {isPlatformLoginOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg max-w-sm w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setIsPlatformLoginOpen(false)}
              className="absolute right-4 top-4 text-zinc-500 hover:text-zinc-300"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded bg-zinc-100 text-zinc-950 font-bold flex items-center justify-center text-xs">
                BX
              </div>
              <h3 className="text-base font-semibold text-zinc-100">Sign In to BehaviorX</h3>
            </div>
            <p className="text-xs text-zinc-400 mb-4">
              Access your test history, automated crawl suites, and team bug replays.
            </p>

            <form onSubmit={handlePlatformLogin} className="space-y-3">
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Email</label>
                <input
                  type="email"
                  required
                  placeholder="engineer@company.com"
                  value={loginEmailInput}
                  onChange={(e) => setLoginEmailInput(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={loginPasswordInput}
                  onChange={(e) => setLoginPasswordInput(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700"
                />
              </div>

              <button
                type="submit"
                className="w-full mt-2 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-semibold text-xs rounded transition-colors"
              >
                Sign In
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
