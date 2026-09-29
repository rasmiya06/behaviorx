'use client';

import React from 'react';

// BUG 1: DEAD END STATE
// This view renders an isolated blank card with error code ERR_AUTH_RECOVERY_UNCONFIGURED.
// It deliberately contains ZERO outgoing links (no <a>, no <button> that navigates, no home link).
// The user is completely stranded.
export default function ForgotPasswordDeadEndPage() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="bg-zinc-950 border border-zinc-800 p-8 rounded-lg max-w-md w-full shadow-2xl">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-3 h-3 rounded-full bg-amber-500 animate-ping"></div>
          <span className="text-xs font-mono text-amber-400 font-semibold tracking-wide uppercase">
            State Anomaly: Terminal Node
          </span>
        </div>
        
        <h1 className="text-xl font-mono text-zinc-100 font-semibold mb-2">
          AUTH_RECOVERY_DISABLED
        </h1>
        
        <p className="text-zinc-400 text-xs font-mono mb-4 leading-relaxed">
          Error Code: <code>ERR_AUTH_RECOVERY_UNCONFIGURED</code>
          <br />
          Password reset dispatch pipeline has been disabled for non-SAML users.
          No recovery handler registered.
        </p>

        <div className="p-3 bg-zinc-900/80 border border-zinc-800 rounded font-mono text-[11px] text-zinc-500 mb-2">
          <div>Status: ORPHAN_STATE</div>
          <div>Outgoing Edges: 0</div>
          <div>Interactive Traversal: STRANDED</div>
        </div>

        {/* DELIBERATELY ZERO NAVIGATION BUTTONS OR LINKS */}
      </div>
    </div>
  );
}
