'use client';

import React, { useState, useEffect } from 'react';
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
import { AlertCircle, X, ArrowRight, ShieldCheck, Lock } from 'lucide-react';

export default function BehaviorXDashboard() {
  // 1. BEHAVIORX PLATFORM AUTHENTICATION (FIRST PAGE IS ALWAYS SIGN IN ON NEW SESSION)
  const [isPlatformLoggedIn, setIsPlatformLoggedIn] = useState(false);
  const [platformUserEmail, setPlatformUserEmail] = useState('engineer@behaviorx.dev');
  const [platformPassword, setPlatformPassword] = useState('behaviorx2024');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // 2. DASHBOARD CRAWLER STATE
  const [targetUrl, setTargetUrl] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState<'IDLE' | 'SCANNING' | 'COMPLETED' | 'ERROR'>('IDLE');
  const [validationError, setValidationError] = useState<string | null>(null);

  // 3. TARGET AUTH CREDENTIALS CONFIGURATION
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [enableAuth, setEnableAuth] = useState(false);

  // 4. CLEAN ZERO-STATE
  const [nodes, setNodes] = useState<StateNode[]>([]);
  const [edges, setEdges] = useState<StateEdge[]>([]);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [logs, setLogs] = useState<ActionEvent[]>([]);

  // 5. INSPECTION & REPLAY STATE
  const [selectedAnomaly, setSelectedAnomaly] = useState<Anomaly | null>(null);
  const [replayAnomaly, setReplayAnomaly] = useState<Anomaly | null>(null);

  // Check session storage on mount
  useEffect(() => {
    try {
      const session = sessionStorage.getItem('bx_session');
      if (session) {
        const u = JSON.parse(session);
        if (u?.email) {
          setIsPlatformLoggedIn(true);
          setPlatformUserEmail(u.email);
        }
      }
    } catch (e) {}
  }, []);

  const handlePlatformLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthenticating(true);

    setTimeout(() => {
      try {
        sessionStorage.setItem(
          'bx_session',
          JSON.stringify({
            email: platformUserEmail,
            name: 'Principal QA Engineer',
            token: 'bx_' + Math.random().toString(36).substring(2, 9),
          })
        );
      } catch (e) {}

      setIsAuthenticating(false);
      setIsPlatformLoggedIn(true);
    }, 400);
  };

  const handlePlatformLogout = () => {
    try {
      sessionStorage.removeItem('bx_session');
    } catch (e) {}
    setIsPlatformLoggedIn(false);
  };

  // Trigger universal autonomous crawl
  const handleStartScan = async () => {
    setValidationError(null);

    const cleanUrl = (targetUrl || '').trim();
    if (!cleanUrl) {
      setValidationError('Please enter a website URL to scan (e.g. https://news.ycombinator.com or http://localhost:3000/demo-app).');
      return;
    }

    try {
      if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://') && !cleanUrl.startsWith('/')) {
        new URL(`https://${cleanUrl}`);
      }
    } catch {
      setValidationError(`Invalid URL format: "${cleanUrl}". Please enter a valid web address.`);
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

  // ========================================================
  // 1. FIRST PAGE: SIGN IN PAGE (WHEN NOT LOGGED IN)
  // ========================================================
  if (!isPlatformLoggedIn) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-center items-center p-4 selection:bg-zinc-800 font-sans">
        <div className="mb-6 text-center max-w-sm">
          <div className="w-12 h-12 rounded-xl bg-zinc-100 text-zinc-950 font-black flex items-center justify-center text-lg tracking-tighter mx-auto mb-3 shadow-xl">
            BX
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">BehaviorX Console</h1>
          <p className="text-xs text-zinc-400 mt-1 font-mono">
            First Page: Sign in to access your autonomous exploration dashboard
          </p>
        </div>

        <div className="w-full max-w-sm bg-zinc-900/90 border border-zinc-800 rounded-xl p-6 shadow-2xl backdrop-blur">
          <form onSubmit={handlePlatformLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-zinc-400 mb-1.5">
                Engineer Email
              </label>
              <input
                id="bx-login-email"
                type="email"
                required
                value={platformUserEmail}
                onChange={(e) => setPlatformUserEmail(e.target.value)}
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
                value={platformPassword}
                onChange={(e) => setPlatformPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-200 font-mono focus:outline-none focus:border-zinc-700"
              />
            </div>

            <button
              id="bx-btn-submit-login"
              type="submit"
              disabled={isAuthenticating}
              className="w-full py-2.5 bg-zinc-100 hover:bg-zinc-200 disabled:opacity-50 text-zinc-950 font-semibold text-xs font-mono rounded flex items-center justify-center gap-2 transition-colors cursor-pointer mt-2 shadow-md"
            >
              <span>{isAuthenticating ? 'Authenticating...' : 'Sign In to Console'}</span>
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

  // ========================================================
  // 2. NEXT PAGE: CLEAN, SPACIOUS EXPLORER DASHBOARD
  // ========================================================
  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-zinc-950 text-zinc-100 font-sans">
      {/* Top Navigation */}
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
        userEmail={platformUserEmail}
        onLogout={handlePlatformLogout}
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
