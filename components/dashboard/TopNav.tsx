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
  LogOut,
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
  userEmail: string;
  onLogout: () => void;
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
  userEmail,
  onLogout,
}: TopNavProps) {
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  return (
    <header className="h-14 border-b border-zinc-800 bg-zinc-950/95 sticky top-0 z-30 px-4 flex items-center justify-between gap-4">
      {/* 1. Left: Brand & Status */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-zinc-100 text-zinc-950 font-black flex items-center justify-center text-xs tracking-tighter">
            BX
          </div>
          <span className="font-bold text-sm tracking-tight text-zinc-100">BehaviorX</span>
        </div>

        <div className="h-4 w-[1px] bg-zinc-800 hidden sm:block" />

        {/* Dynamic Status Pill */}
        <div className="hidden md:flex items-center">
          {status === 'IDLE' && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-zinc-400">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-500"></span>
              <span>READY</span>
            </div>
          )}

          {status === 'SCANNING' && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-950/60 border border-sky-800/60 text-[11px] font-mono text-sky-400 animate-pulse">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>EXPLORING...</span>
            </div>
          )}

          {status === 'COMPLETED' && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-950/40 border border-rose-900/60 text-[11px] font-mono text-rose-300">
              <AlertTriangle className="w-3 h-3 text-rose-400" />
              <span>{anomaliesCount} ANOMALIES</span>
            </div>
          )}

          {status === 'ERROR' && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-950/40 border border-amber-900/60 text-[11px] font-mono text-amber-300">
              <AlertTriangle className="w-3 h-3 text-amber-400" />
              <span>SCAN FAILED</span>
            </div>
          )}
        </div>
      </div>

      {/* 2. Center: Prominent Clean Universal URL Bar + Optional Target Auth */}
      <div className="flex-1 max-w-2xl flex items-center gap-2">
        {/* Clean URL Input */}
        <div className="relative flex-1 flex items-center">
          <Globe className="w-3.5 h-3.5 absolute left-3 text-zinc-500 pointer-events-none" />
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={isScanning}
            placeholder="Enter any website URL (e.g. https://example.com)..."
            className="w-full bg-zinc-900 border border-zinc-800 rounded-md pl-9 pr-3 py-1.5 text-xs font-mono text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-700 transition-colors disabled:opacity-50"
          />
        </div>

        {/* Target Site Auth Dropdown */}
        <div className="relative flex-shrink-0">
          <button
            type="button"
            onClick={() => setIsAuthOpen(!isAuthOpen)}
            className={`h-8 px-2.5 rounded-md border text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer ${
              enableAuth && authEmail
                ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
            title="Configure credentials if the target website requires login"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {enableAuth && authEmail ? 'Auth: On' : 'Target Auth'}
            </span>
            <ChevronDown className="w-3 h-3 opacity-60" />
          </button>

          {/* Auth Credentials Popover */}
          {isAuthOpen && (
            <div className="absolute right-0 top-10 w-72 bg-zinc-900 border border-zinc-800 rounded-lg p-4 shadow-2xl z-50 text-xs font-mono">
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-zinc-800">
                <div className="flex items-center gap-1.5 font-semibold text-zinc-200">
                  <Lock className="w-3.5 h-3.5 text-sky-400" />
                  <span>Target Website Login</span>
                </div>
                <button
                  onClick={() => setIsAuthOpen(false)}
                  className="text-zinc-500 hover:text-zinc-300"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <p className="text-[11px] text-zinc-400 mb-3 font-sans leading-relaxed">
                If the website requires sign-in, BehaviorX will inject these credentials into the login form:
              </p>

              <div className="space-y-2.5 mb-3">
                <div>
                  <label className="block text-[10px] text-zinc-400 mb-1">Email / Username</label>
                  <input
                    type="text"
                    placeholder="user@example.com"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-zinc-400 mb-1">Password</label>
                  <input
                    type="password"
                    placeholder="••••••••••••"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2.5 border-t border-zinc-800">
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
                  className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded text-[11px] font-semibold"
                >
                  Save
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. Right: User Profile & Primary CTA */}
      <div className="flex items-center gap-3 flex-shrink-0">
        {/* User Account Chip */}
        <div className="hidden lg:flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-2.5 py-1.5 rounded-md text-xs font-mono text-zinc-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span className="truncate max-w-[130px]">{userEmail || 'Engineer'}</span>
          <button
            onClick={onLogout}
            title="Sign out of BehaviorX"
            className="text-zinc-500 hover:text-rose-400 ml-1 p-0.5 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Primary Scan Button */}
        <button
          onClick={onStartScan}
          disabled={isScanning}
          className="h-9 px-4 rounded-md bg-zinc-100 hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-500 text-zinc-950 font-semibold text-xs font-mono flex items-center gap-2 transition-all cursor-pointer shadow-sm active:scale-[0.98] flex-shrink-0"
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
  );
}
