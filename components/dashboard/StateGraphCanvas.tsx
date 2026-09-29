'use client';

import React, { useMemo, useCallback, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
} from '@xyflow/react';
import { Map as MapIcon, X } from 'lucide-react';
import { CustomStateNode } from './CustomStateNode';
import { StateNode, StateEdge } from '@/lib/types';

interface StateGraphCanvasProps {
  nodes: StateNode[];
  edges: StateEdge[];
  onSelectNode?: (nodeId: string) => void;
  selectedNodeId?: string | null;
}

export function StateGraphCanvas({
  nodes: initialNodes,
  edges: initialEdges,
  onSelectNode,
  selectedNodeId,
}: StateGraphCanvasProps) {
  const [showMiniMap, setShowMiniMap] = useState(false);
  const nodeTypes = useMemo(() => ({ stateNode: CustomStateNode }), []);

  const formattedNodes = useMemo(() => {
    return initialNodes.map((n) => ({
      ...n,
      selected: n.id === selectedNodeId,
      data: {
        ...n.data,
      },
    }));
  }, [initialNodes, selectedNodeId]);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (onSelectNode) {
        onSelectNode(node.id);
      }
    },
    [onSelectNode]
  );

  return (
    <div className="w-full h-full relative bg-zinc-950">
      {initialNodes.length === 0 ? (
        <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-zinc-950">
          <div className="w-12 h-12 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4 text-zinc-500 font-mono text-lg font-bold">
            00
          </div>
          <h3 className="text-base font-semibold text-zinc-200 mb-1.5 font-mono">
            System Ready for Exploration
          </h3>
          <p className="text-xs text-zinc-500 max-w-md font-mono mb-6 leading-relaxed">
            Enter any target web application URL above and click &quot;Run Autonomous Scan&quot;.
            Playwright will drive a headless Chromium browser to explore routes, test forms, and map the behavioral state machine.
          </p>
          <div className="inline-flex items-center gap-3 px-3 py-1.5 bg-zinc-900/60 border border-zinc-800 rounded-md text-[11px] font-mono text-zinc-400">
            <span>● 0 States</span>
            <span>•</span>
            <span>● 0 Actions</span>
            <span>•</span>
            <span>● 0 Anomalies</span>
          </div>
        </div>
      ) : (
        <>
          {/* Subtle Graph Legend */}
          <div className="absolute top-3 right-3 z-10 bg-zinc-900/90 border border-zinc-800 rounded-md p-2.5 backdrop-blur text-[11px] font-mono text-zinc-400 space-y-1.5 shadow-lg">
            <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold mb-1">
              Graph Legend
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-zinc-600 border border-zinc-500"></span>
          <span>Normal State</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 border border-rose-400"></span>
          <span>Crash / 500 Failure</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 border border-amber-400"></span>
          <span>Dead End State</span>
        </div>
      </div>

      <ReactFlow
        nodes={formattedNodes}
        edges={initialEdges}
        nodeTypes={nodeTypes}
        onNodeClick={onNodeClick}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.4}
        maxZoom={1.5}
        defaultEdgeOptions={{
          style: { stroke: '#52525b', strokeWidth: 1.5 },
          labelStyle: { fill: '#a1a1aa', fontSize: 11, fontFamily: 'monospace' },
          labelBgStyle: { fill: '#18181b', stroke: '#27272a' },
          labelBgPadding: [6, 3],
          labelBgBorderRadius: 4,
        }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={18}
          size={1}
          color="#27272a"
        />
        <Controls
          showInteractive={false}
          className="!bottom-4 !left-4"
        />
        {showMiniMap ? (
          <div className="absolute bottom-4 right-4 z-20 bg-zinc-950/95 border border-zinc-800 rounded-lg p-2 shadow-2xl backdrop-blur-md flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 px-1 border-b border-zinc-800 pb-1">
              <span className="flex items-center gap-1 font-semibold text-zinc-300">
                <MapIcon className="w-3 h-3 text-zinc-400" />
                <span>OVERVIEW_MINIMAP</span>
              </span>
              <button
                onClick={() => setShowMiniMap(false)}
                className="text-zinc-500 hover:text-zinc-300 p-0.5 rounded cursor-pointer"
                title="Hide MiniMap"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
            <MiniMap
              nodeColor={(node) => {
                const status = (node.data as any)?.status;
                if (status === 'ANOMALY_CRASH' || status === 'ANOMALY_500') return '#f43f5e';
                if (status === 'ANOMALY_DEAD_END') return '#f59e0b';
                return '#10b981';
              }}
              maskColor="rgba(9, 9, 11, 0.75)"
              className="!static !m-0 !w-44 !h-28 !bg-zinc-900/90 !border !border-zinc-800/80 !rounded"
            />
          </div>
        ) : (
          <div className="absolute bottom-4 right-4 z-20">
            <button
              onClick={() => setShowMiniMap(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 rounded-md text-[11px] font-mono text-zinc-400 hover:text-zinc-200 transition-all shadow-lg backdrop-blur cursor-pointer"
              title="Open Overview MiniMap"
            >
              <MapIcon className="w-3.5 h-3.5 text-zinc-400" />
              <span>MiniMap</span>
            </button>
          </div>
        )}
      </ReactFlow>
        </>
      )}
    </div>
  );
}
