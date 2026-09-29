'use client';

import React from 'react';
import { Play, Loader2, Globe, ExternalLink, CheckCircle, AlertTriangle, ShieldCheck } from 'lucide-react';

interface TopNavProps {
  url: string;
  setUrl: (url: string) => void;
  isScanning: boolean;
  onStartScan: () => void;
  status: 'IDLE' | 'SCANNING' | 'COMPLETED' | 'ERROR';
  anomaliesCount: number;
}

export function TopNav({
  url,
  setUrl,
  isScanning,
  onStartScan,
  status,
  anomaliesCount,
}: TopNavProps) {
  const handleLoadSample = () => {
    setUrl('http://localhost:3000/demo-app');
  };

  return (
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
                v1.0
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
              <span>{anomaliesCount} CRITICAL ANOMALIES FLAGGED</span>
            </div>
          )}
        </div>
      </div>

      {/* Target URL Input Bar */}
      <div className="flex-1 max-w-xl flex items-center gap-2">
        <div className="relative flex-1 flex items-center">
          <Globe className="w-3.5 h-3.5 absolute left-3 text-zinc-500" />
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={isScanning}
            placeholder="Target URL (e.g. http://localhost:3000/demo-app)"
            className="w-full bg-zinc-900/90 border border-zinc-800 rounded-md pl-9 pr-24 py-1.5 text-xs font-mono text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-700 transition-colors disabled:opacity-50"
          />
          <button
            onClick={handleLoadSample}
            type="button"
            className="absolute right-2 text-[10px] font-mono text-zinc-400 hover:text-zinc-200 bg-zinc-800/80 hover:bg-zinc-800 px-2 py-0.5 rounded transition-colors"
          >
            Load NovaStore
          </button>
        </div>

        <a
          href="/demo-app"
          target="_blank"
          rel="noreferrer"
          title="Open NovaStore in new window"
          className="p-2 text-zinc-400 hover:text-zinc-200 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-md transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Engine Status & Primary CTA */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="hidden lg:flex items-center gap-1.5 text-[11px] font-mono text-zinc-500">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          <span>Playwright Engine</span>
        </div>

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
  );
}
