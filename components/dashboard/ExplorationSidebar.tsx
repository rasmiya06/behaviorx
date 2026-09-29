'use client';

import React from 'react';
import { Anomaly } from '@/lib/types';
import { AlertCircle, AlertTriangle, Play, ChevronRight, Activity, Layers, GitBranch, ArrowRight } from 'lucide-react';

interface ExplorationSidebarProps {
  statesCount: number;
  transitionsCount: number;
  anomalies: Anomaly[];
  selectedAnomalyId: string | null;
  onSelectAnomaly: (anomaly: Anomaly) => void;
  onTriggerReplay: (anomaly: Anomaly) => void;
}

export function ExplorationSidebar({
  statesCount,
  transitionsCount,
  anomalies,
  selectedAnomalyId,
  onSelectAnomaly,
  onTriggerReplay,
}: ExplorationSidebarProps) {
  return (
    <aside className="w-80 border-r border-zinc-800 bg-zinc-950 flex flex-col h-full overflow-hidden">
      {/* Exploration HUD Metrics */}
      <div className="p-4 border-b border-zinc-800 bg-zinc-900/40">
        <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-2.5 font-semibold flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-sky-400" />
          <span>Exploration Telemetry</span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="p-2.5 bg-zinc-900 border border-zinc-800 rounded">
            <div className="text-[10px] font-mono text-zinc-500 mb-0.5">States</div>
            <div className="text-base font-mono font-bold text-zinc-100">{statesCount}</div>
          </div>
          <div className="p-2.5 bg-zinc-900 border border-zinc-800 rounded">
            <div className="text-[10px] font-mono text-zinc-500 mb-0.5">Actions</div>
            <div className="text-base font-mono font-bold text-zinc-100">{transitionsCount}</div>
          </div>
          <div className="p-2.5 bg-zinc-900 border border-zinc-800 rounded">
            <div className="text-[10px] font-mono text-zinc-500 mb-0.5">Bugs</div>
            <div className={`text-base font-mono font-bold ${anomalies.length > 0 ? 'text-rose-400' : 'text-zinc-400'}`}>
              {anomalies.length}
            </div>
          </div>
        </div>
      </div>

      {/* Discovered Anomalies List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        <div className="flex items-center justify-between px-1 mb-1">
          <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider font-semibold">
            Discovered Bugs ({anomalies.length})
          </span>
          <span className="text-[10px] font-mono text-zinc-500">Autonomous Map</span>
        </div>

        {anomalies.length === 0 ? (
          <div className="p-6 border border-dashed border-zinc-800 rounded-lg text-center">
            <p className="text-xs text-zinc-500 font-mono">
              Click &quot;Run Autonomous Scan&quot; to discover application state and detect bugs.
            </p>
          </div>
        ) : (
          anomalies.map((anom) => {
            const isSelected = selectedAnomalyId === anom.id;
            const isCrash = anom.type === 'CLIENT_CRASH';
            const is500 = anom.type === 'SERVER_ERROR';
            const isDeadEnd = anom.type === 'DEAD_END';

            return (
              <div
                key={anom.id}
                onClick={() => onSelectAnomaly(anom)}
                className={`p-3.5 rounded-lg border text-left cursor-pointer transition-all ${
                  isSelected
                    ? 'border-sky-500/80 bg-zinc-900 shadow-md ring-1 ring-sky-500/50'
                    : 'border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 hover:border-zinc-700'
                }`}
              >
                {/* Header Badge */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-medium uppercase tracking-wider ${
                      isDeadEnd
                        ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                        : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                    }`}
                  >
                    {isDeadEnd ? (
                      <AlertTriangle className="w-3 h-3 text-amber-400" />
                    ) : (
                      <AlertCircle className="w-3 h-3 text-rose-400" />
                    )}
                    <span>{anom.type.replace('_', ' ')}</span>
                  </span>

                  <span className="text-[10px] font-mono text-zinc-500">
                    {anom.evidence.breadcrumbs?.length || 3} steps
                  </span>
                </div>

                {/* Title & Route */}
                <h4 className="text-xs font-semibold text-zinc-200 mb-1 leading-snug">
                  {anom.title}
                </h4>
                <div className="font-mono text-[11px] text-zinc-400 truncate mb-2">
                  {anom.route}
                </div>

                {/* Breadcrumb Path Preview */}
                <div className="text-[10px] font-mono text-zinc-500 truncate mb-3 bg-zinc-950 px-2 py-1 rounded border border-zinc-800/80">
                  {anom.evidence.breadcrumbs
                    ? anom.evidence.breadcrumbs.map((b) => b.action).join(' → ')
                    : 'explore → trigger'}
                </div>

                {/* Action CTAs */}
                <div className="flex items-center gap-2 pt-2 border-t border-zinc-800/80">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onTriggerReplay(anom);
                    }}
                    className="flex-1 py-1.5 px-2 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-[11px] font-mono font-semibold flex items-center justify-center gap-1.5 transition-colors border border-zinc-700"
                  >
                    <Play className="w-3 h-3 fill-current text-sky-400" />
                    <span>⚡ Replay Bug</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectAnomaly(anom);
                    }}
                    className="py-1.5 px-2 text-[11px] font-mono text-zinc-400 hover:text-zinc-200 transition-colors"
                  >
                    Evidence →
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}
