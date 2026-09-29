'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ActionEvent } from '@/lib/types';
import { Terminal, ChevronUp, ChevronDown, Filter, Trash2 } from 'lucide-react';

interface LiveActivityLogProps {
  logs: ActionEvent[];
  isScanning: boolean;
}

export function LiveActivityLog({ logs, isScanning }: LiveActivityLogProps) {
  const [filter, setFilter] = useState<'ALL' | 'ACTION' | 'ERROR' | 'NETWORK'>('ALL');
  const [isExpanded, setIsExpanded] = useState(true);
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const filteredLogs = logs.filter((log) => {
    if (filter === 'ALL') return true;
    if (filter === 'ACTION') return log.level === 'ACTION';
    if (filter === 'ERROR') return log.level === 'ERROR';
    if (filter === 'NETWORK') return log.level === 'NETWORK';
    return true;
  });

  return (
    <div className={`border-t border-zinc-800 bg-zinc-950 flex flex-col transition-all duration-200 ${isExpanded ? 'h-48' : 'h-9'}`}>
      {/* Console Header Bar */}
      <div className="h-9 px-4 border-b border-zinc-800/80 bg-zinc-900/60 flex items-center justify-between flex-shrink-0 text-xs font-mono">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-zinc-400" />
          <span className="font-semibold text-zinc-300">Live Activity Stream</span>
          {isScanning && (
            <span className="flex items-center gap-1 text-[10px] text-sky-400">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping"></span>
              STREAMING
            </span>
          )}
          <span className="text-[10px] text-zinc-500">({logs.length} events)</span>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-zinc-950 p-0.5 rounded border border-zinc-800 text-[10px]">
            {(['ALL', 'ACTION', 'ERROR', 'NETWORK'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setFilter(mode)}
                className={`px-2 py-0.5 rounded transition-colors ${
                  filter === mode
                    ? 'bg-zinc-800 text-zinc-100 font-semibold'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 text-zinc-400 hover:text-zinc-200 transition-colors"
            title={isExpanded ? 'Collapse Console' : 'Expand Console'}
          >
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Log Feed */}
      {isExpanded && (
        <div
          ref={logContainerRef}
          className="flex-1 overflow-y-auto p-3 font-mono text-[11px] space-y-1 selection:bg-zinc-800 select-text"
        >
          {filteredLogs.length === 0 ? (
            <div className="text-zinc-600 italic">No telemetry recorded yet. Click &quot;Run Autonomous Scan&quot; to begin.</div>
          ) : (
            filteredLogs.map((log) => {
              let color = 'text-zinc-400';
              if (log.level === 'ACTION') color = 'text-zinc-200';
              if (log.level === 'ERROR') color = 'text-rose-400 font-medium';
              if (log.level === 'NETWORK') color = 'text-amber-400';

              return (
                <div key={log.id} className="flex items-start gap-2.5 leading-relaxed">
                  <span className="text-zinc-600 select-none flex-shrink-0">
                    [{log.timestamp}]
                  </span>
                  <span
                    className={`font-semibold flex-shrink-0 text-[10px] px-1 py-0.2 rounded border ${
                      log.level === 'ERROR'
                        ? 'border-rose-900 bg-rose-950/60 text-rose-400'
                        : log.level === 'ACTION'
                        ? 'border-zinc-700 bg-zinc-900 text-zinc-300'
                        : log.level === 'NETWORK'
                        ? 'border-amber-900 bg-amber-950/60 text-amber-400'
                        : 'border-zinc-800 text-zinc-500'
                    }`}
                  >
                    {log.level}
                  </span>
                  <span className={`break-all ${color}`}>{log.message}</span>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
