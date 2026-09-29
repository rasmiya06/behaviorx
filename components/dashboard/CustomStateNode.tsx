'use client';

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { StateNodeData } from '@/lib/types';
import { AlertCircle, AlertTriangle, CheckCircle, ExternalLink } from 'lucide-react';

export const CustomStateNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as unknown as StateNodeData;
  const status = nodeData.status || 'HEALTHY';

  let borderClass = 'border-zinc-800 bg-zinc-900/90 hover:border-zinc-700';
  let badgeColor = 'bg-zinc-800/80 text-zinc-400 border-zinc-700';
  let statusIcon = <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />;
  let statusText = 'NORMAL_STATE';

  if (status === 'ANOMALY_CRASH') {
    borderClass = 'border-rose-600/80 bg-rose-950/20 shadow-[0_0_15px_rgba(244,63,94,0.15)] ring-1 ring-rose-500/30';
    badgeColor = 'bg-rose-500/10 text-rose-400 border-rose-500/30';
    statusIcon = <AlertCircle className="w-3.5 h-3.5 text-rose-400" />;
    statusText = '🔴 CLIENT CRASH';
  } else if (status === 'ANOMALY_500') {
    borderClass = 'border-rose-600/80 bg-rose-950/20 shadow-[0_0_15px_rgba(244,63,94,0.15)] ring-1 ring-rose-500/30';
    badgeColor = 'bg-rose-500/10 text-rose-400 border-rose-500/30';
    statusIcon = <AlertCircle className="w-3.5 h-3.5 text-rose-400" />;
    statusText = '🔴 HTTP 500 ERROR';
  } else if (status === 'ANOMALY_DEAD_END') {
    borderClass = 'border-amber-600/80 bg-amber-950/20 shadow-[0_0_15px_rgba(245,158,11,0.15)] ring-1 ring-amber-500/30';
    badgeColor = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    statusIcon = <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />;
    statusText = '🟠 DEAD END';
  }

  if (selected) {
    borderClass += ' ring-2 ring-sky-500/80';
  }

  return (
    <div
      className={`w-64 rounded-lg border p-3.5 backdrop-blur-md transition-all text-left shadow-lg ${borderClass}`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!w-2 !h-2 !bg-zinc-600 !border-zinc-900"
      />

      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 min-w-0">
          {statusIcon}
          <span className="font-semibold text-xs text-zinc-100 truncate tracking-tight">
            {nodeData.label}
          </span>
        </div>
        <div
          className={`text-[9px] font-mono px-1.5 py-0.5 rounded border uppercase font-medium tracking-wider flex-shrink-0 ${badgeColor}`}
        >
          {statusText}
        </div>
      </div>

      <div className="font-mono text-[11px] text-zinc-400 truncate mb-2">
        {nodeData.route}
      </div>

      <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[10px] font-mono text-zinc-500">
        <span>{nodeData.interactiveCount} targets detected</span>
        {nodeData.landmarks && nodeData.landmarks.length > 0 && (
          <span className="truncate max-w-[110px]" title={nodeData.landmarks[0]}>
            {nodeData.landmarks[0]}
          </span>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!w-2 !h-2 !bg-zinc-600 !border-zinc-900"
      />
    </div>
  );
});

CustomStateNode.displayName = 'CustomStateNode';
