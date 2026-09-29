'use client';

import React, { useState } from 'react';
import { TopNav } from '@/components/dashboard/TopNav';
import { ExplorationSidebar } from '@/components/dashboard/ExplorationSidebar';
import { StateGraphCanvas } from '@/components/dashboard/StateGraphCanvas';
import { LiveActivityLog } from '@/components/dashboard/LiveActivityLog';
import { EvidenceReplayDrawer } from '@/components/dashboard/EvidenceReplayDrawer';
import { ReplayModal } from '@/components/dashboard/ReplayModal';
import {
  CrawlReport,
  StateNode,
  StateEdge,
  Anomaly,
  ActionEvent,
} from '@/lib/types';
import { AlertCircle, X } from 'lucide-react';

export default function BehaviorXDashboard() {
  // CLEAN DEFAULT: URL IS EMPTY UNTIL USER ENTERS IT OR CLICKS 'LOAD NOVASTORE'
  const [targetUrl, setTargetUrl] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState<'IDLE' | 'SCANNING' | 'COMPLETED' | 'ERROR'>('IDLE');
  const [validationError, setValidationError] = useState<string | null>(null);

  // TARGET WEBSITE AUTHENTICATION / SIGN IN CONFIGURATION IN FRONT
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [enableAuth, setEnableAuth] = useState(false);

  // CLEAN ZERO-STATE (0 nodes, 0 edges, 0 anomalies, 0 logs)
  const [nodes, setNodes] = useState<StateNode[]>([]);
  const [edges, setEdges] = useState<StateEdge[]>([]);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [logs, setLogs] = useState<ActionEvent[]>([]);

  // Inspector & Replay states
  const [selectedAnomaly, setSelectedAnomaly] = useState<Anomaly | null>(null);
  const [replayAnomaly, setReplayAnomaly] = useState<Anomaly | null>(null);

  // Trigger real autonomous crawl
  const handleStartScan = async () => {
    setValidationError(null);

    const cleanUrl = (targetUrl || '').trim();
    if (!cleanUrl) {
      setValidationError('Please enter a website URL to scan (e.g. https://example.com or click "Load NovaStore").');
      return;
    }

    try {
      if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://') && !cleanUrl.startsWith('/')) {
        new URL(`https://${cleanUrl}`);
      }
    } catch {
      setValidationError(`Invalid URL format: "${cleanUrl}". Please enter a valid HTTP or HTTPS address.`);
      return;
    }

    setIsScanning(true);
    setScanStatus('SCANNING');
    setSelectedAnomaly(null);
    setNodes([]);
    setEdges([]);
    setAnomalies([]);

    const startLog: ActionEvent = {
      id: `log_init_${Date.now()}`,
      timestamp: '00:00.00',
      level: 'INFO',
      message: `INITIATING REAL PLAYWRIGHT CRAWLER for ${cleanUrl}${enableAuth && authEmail ? ` [Auth: ${authEmail}]` : ''}`,
    };
    setLogs([startLog]);

    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUrl: cleanUrl,
          auth: {
            email: authEmail,
            password: authPassword,
            enabled: enableAuth,
          },
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || `HTTP ${res.status}: Crawler failed to explore target`);
      }

      const report: CrawlReport = data;

      setNodes(report.nodes || []);
      setEdges(report.edges || []);
      setAnomalies(report.anomalies || []);
      setLogs(report.actionLog || []);
      setScanStatus('COMPLETED');
    } catch (err: any) {
      setScanStatus('ERROR');
      setValidationError(err.message || 'Scan failed to connect to target URL.');
      setLogs((prev) => [
        ...prev,
        {
          id: `log_err_${Date.now()}`,
          timestamp: '00:01.50',
          level: 'ERROR',
          message: `FAILED TO SCAN: ${err.message}`,
        },
      ]);
    } finally {
      setIsScanning(false);
    }
  };

  const handleSelectNode = (nodeId: string) => {
    const matchingAnomaly = anomalies.find(
      (a) => a.evidence.stateId === nodeId || a.id === nodeId
    );
    if (matchingAnomaly) {
      setSelectedAnomaly(matchingAnomaly);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-zinc-950 text-zinc-100 font-sans">
      {/* Top Navigation with Target Sign In In Front */}
      <TopNav
        url={targetUrl}
        setUrl={(val) => {
          setTargetUrl(val);
          if (validationError) setValidationError(null);
        }}
        isScanning={isScanning}
        onStartScan={handleStartScan}
        status={scanStatus}
        anomaliesCount={anomalies.length}
        authEmail={authEmail}
        setAuthEmail={setAuthEmail}
        authPassword={authPassword}
        setAuthPassword={setAuthPassword}
        enableAuth={enableAuth}
        setEnableAuth={setEnableAuth}
      />

      {/* Validation Error Banner */}
      {validationError && (
        <div className="bg-rose-950/90 border-b border-rose-800 px-4 py-2 text-xs font-mono text-rose-200 flex items-center justify-between z-30">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{validationError}</span>
          </div>
          <button
            onClick={() => setValidationError(null)}
            className="text-rose-400 hover:text-rose-200 p-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Zone 1: Exploration Sidebar */}
        <ExplorationSidebar
          statesCount={nodes.length}
          transitionsCount={edges.length}
          anomalies={anomalies}
          selectedAnomalyId={selectedAnomaly?.id || null}
          onSelectAnomaly={(anom) => setSelectedAnomaly(anom)}
          onTriggerReplay={(anom) => setReplayAnomaly(anom)}
        />

        {/* Zone 2: Behavior State Graph Canvas + Zone 3: Bottom Live Activity Log */}
        <main className="flex-1 flex flex-col overflow-hidden relative">
          {/* State Machine Graph Canvas */}
          <div className="flex-1 relative overflow-hidden">
            <StateGraphCanvas
              nodes={nodes}
              edges={edges}
              onSelectNode={handleSelectNode}
              selectedNodeId={selectedAnomaly?.evidence.stateId || null}
            />
          </div>

          {/* Live Activity Terminal */}
          <LiveActivityLog logs={logs} isScanning={isScanning} />
        </main>
      </div>

      {/* Slide-in Evidence Drawer */}
      {selectedAnomaly && (
        <EvidenceReplayDrawer
          anomaly={selectedAnomaly}
          onClose={() => setSelectedAnomaly(null)}
          onLaunchReplay={(anom) => {
            setSelectedAnomaly(null);
            setReplayAnomaly(anom);
          }}
        />
      )}

      {/* Hero Feature: Deterministic Live Replay Modal */}
      {replayAnomaly && (
        <ReplayModal
          anomaly={replayAnomaly}
          onClose={() => setReplayAnomaly(null)}
        />
      )}
    </div>
  );
}
