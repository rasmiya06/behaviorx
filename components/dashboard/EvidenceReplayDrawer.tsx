'use client';

import React from 'react';
import { Anomaly } from '@/lib/types';
import {
  X,
  Play,
  AlertCircle,
  AlertTriangle,
  FileCode,
  ArrowRight,
  Database,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';

interface EvidenceReplayDrawerProps {
  anomaly: Anomaly | null;
  onClose: () => void;
  onLaunchReplay: (anomaly: Anomaly) => void;
}

export function EvidenceReplayDrawer({
  anomaly,
  onClose,
  onLaunchReplay,
}: EvidenceReplayDrawerProps) {
  if (!anomaly) return null;

  const { evidence } = anomaly;
  const isDeadEnd = anomaly.type === 'DEAD_END';

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full sm:w-[480px] bg-zinc-950 border-l border-zinc-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
      {/* Drawer Header */}
      <div className="h-14 px-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
        <div className="flex items-center gap-2">
          {isDeadEnd ? (
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400" />
          )}
          <span className="font-semibold text-xs text-zinc-100 uppercase tracking-wider font-mono">
            Observed Failure Evidence
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 text-zinc-400 hover:text-zinc-100 rounded hover:bg-zinc-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Drawer Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {/* Top Summary Banner */}
        <div className="p-4 bg-zinc-900/80 border border-zinc-800 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase font-semibold ${
                isDeadEnd
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
              }`}
            >
              {anomaly.type.replace('_', ' ')}
            </span>
            <span className="text-[10px] font-mono text-zinc-500">
              Severity: <strong className="text-zinc-300">{anomaly.severity}</strong>
            </span>
          </div>

          <h3 className="text-sm font-semibold text-zinc-100 mb-1 leading-snug">
            {anomaly.title}
          </h3>
          <p className="text-xs font-mono text-zinc-400 break-all">
            {anomaly.summary}
          </p>
        </div>

        {/* HERO CTA: ⚡ REPLAY BUG LIVE */}
        <div>
          <button
            onClick={() => onLaunchReplay(anomaly)}
            className="w-full py-3 px-4 bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-bold text-xs font-mono rounded-lg flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-[0.98] cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current text-sky-600" />
            <span>⚡ REPLAY BUG LIVE IN BROWSER</span>
          </button>
          <p className="text-[10px] font-mono text-zinc-500 text-center mt-1.5">
            Executes autonomous browser sequence and reproduces failure step-by-step
          </p>
        </div>

        {/* SECTION 1: OBSERVED EVIDENCE (RAW RUNTIME METRICS) */}
        <div className="space-y-3">
          <h4 className="text-xs font-mono text-zinc-400 uppercase tracking-wider font-semibold flex items-center gap-2">
            <ShieldAlert className="w-3.5 h-3.5 text-sky-400" />
            <span>Observed Failure Telemetry</span>
          </h4>

          <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden divide-y divide-zinc-800 text-xs font-mono">
            <div className="p-2.5 flex justify-between gap-4">
              <span className="text-zinc-500">Anomaly Type</span>
              <span className="text-zinc-200 font-semibold">{anomaly.type}</span>
            </div>

            <div className="p-2.5 flex justify-between gap-4">
              <span className="text-zinc-500">Route / URL</span>
              <span className="text-zinc-200 break-all text-right">{evidence.url}</span>
            </div>

            <div className="p-2.5 flex justify-between gap-4">
              <span className="text-zinc-500">Browser State</span>
              <span className="text-zinc-200">{evidence.stateName}</span>
            </div>

            <div className="p-2.5 flex justify-between gap-4">
              <span className="text-zinc-500">Trigger Action</span>
              <span className="text-zinc-200 text-right">{evidence.triggerAction}</span>
            </div>

            {evidence.targetSelector && (
              <div className="p-2.5 flex justify-between gap-4">
                <span className="text-zinc-500">Selector</span>
                <code className="text-sky-300 bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-800 text-[11px]">
                  {evidence.targetSelector}
                </code>
              </div>
            )}

            {evidence.responseStatus && (
              <div className="p-2.5 flex justify-between gap-4">
                <span className="text-zinc-500">HTTP Status</span>
                <span className="text-rose-400 font-bold">{evidence.responseStatus}</span>
              </div>
            )}

            {evidence.requestPayload && (
              <div className="p-2.5 space-y-1">
                <div className="text-zinc-500">Request Payload:</div>
                <pre className="p-2 bg-zinc-950 rounded border border-zinc-800 text-[11px] text-zinc-300 overflow-x-auto">
                  {typeof evidence.requestPayload === 'string'
                    ? evidence.requestPayload
                    : JSON.stringify(evidence.requestPayload, null, 2)}
                </pre>
              </div>
            )}

            {evidence.responseBody && (
              <div className="p-2.5 space-y-1">
                <div className="text-zinc-500">Response Body:</div>
                <pre className="p-2 bg-zinc-950 rounded border border-zinc-800 text-[11px] text-rose-300 overflow-x-auto">
                  {evidence.responseBody}
                </pre>
              </div>
            )}

            {evidence.stackTrace && (
              <div className="p-2.5 space-y-1">
                <div className="text-zinc-500">Stack Trace:</div>
                <pre className="p-2 bg-zinc-950 rounded border border-zinc-800 text-[10px] text-rose-300 overflow-x-auto leading-tight">
                  {evidence.stackTrace}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* SECTION 2: DIAGNOSTIC EXPLANATION */}
        <div className="space-y-2">
          <h4 className="text-xs font-mono text-zinc-400 uppercase tracking-wider font-semibold">
            Diagnostic Explanation
          </h4>
          <div className="p-3.5 bg-zinc-900/60 border border-zinc-800 rounded-lg text-xs text-zinc-300 leading-relaxed font-sans">
            {anomaly.explanation}
          </div>
        </div>

        {/* SECTION 3: REPRODUCTION BREADCRUMBS */}
        <div className="space-y-2">
          <h4 className="text-xs font-mono text-zinc-400 uppercase tracking-wider font-semibold">
            Action Breadcrumbs ({evidence.breadcrumbs.length} steps)
          </h4>
          <div className="space-y-2">
            {evidence.breadcrumbs.map((crumb, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 p-2.5 bg-zinc-900 border border-zinc-800 rounded-md text-xs font-mono"
              >
                <div className="w-5 h-5 rounded-full bg-zinc-800 text-zinc-400 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                  {crumb.step}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-zinc-200 font-semibold capitalize">
                    {crumb.action}
                  </div>
                  <div className="text-zinc-500 text-[11px] truncate">
                    {crumb.selector || crumb.url || crumb.value || crumb.targetText}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
