'use client';

import React, { useState, useEffect } from 'react';
import { Anomaly, ReplayStep } from '@/lib/types';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Globe,
  Lock,
  MousePointer,
  Terminal,
} from 'lucide-react';

interface ReplayModalProps {
  anomaly: Anomaly | null;
  onClose: () => void;
}

export function ReplayModal({ anomaly, onClose }: ReplayModalProps) {
  const [steps, setSteps] = useState<ReplayStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Fetch replay steps on mount
  useEffect(() => {
    if (!anomaly) return;

    let isMounted = true;
    setIsLoading(true);
    setLoadError(null);

    fetch('/api/replay', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        anomalyId: anomaly.id,
        anomaly,
        breadcrumbs: anomaly.evidence?.breadcrumbs || [],
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data.steps && data.steps.length > 0) {
          setSteps(data.steps);
          setCurrentStepIndex(0);
          setIsPlaying(true);
        } else {
          setLoadError('Failed to load replay sequence.');
        }
        setIsLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        setLoadError(err.message || 'Network error executing replay');
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [anomaly]);

  // Auto-play timer
  useEffect(() => {
    if (!isPlaying || isLoading || steps.length === 0) return;

    if (currentStepIndex >= steps.length - 1) {
      setIsPlaying(false);
      return;
    }

    const timer = setTimeout(() => {
      setCurrentStepIndex((prev) => Math.min(prev + 1, steps.length - 1));
    }, 1200);

    return () => clearTimeout(timer);
  }, [isPlaying, currentStepIndex, steps.length, isLoading]);

  if (!anomaly) return null;

  const currentStep = steps[currentStepIndex];
  const isFinalStep = currentStepIndex === steps.length - 1;
  const isFailedStep = currentStep?.status === 'FAILED';

  const handleRestart = () => {
    setCurrentStepIndex(0);
    setIsPlaying(true);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Replay Header */}
        <div className="h-14 px-5 border-b border-zinc-800 bg-zinc-900/80 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
              <span className="font-mono text-xs uppercase tracking-wider font-bold text-zinc-100">
                Deterministic Live Replay
              </span>
            </div>
            <div className="h-4 w-[1px] bg-zinc-700" />
            <span className="text-xs font-mono text-zinc-400 truncate max-w-md">
              {anomaly.title}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-zinc-100 rounded hover:bg-zinc-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Replay Body */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-4">
          {/* Left / Steps Timeline (1 col) */}
          <div className="border-r border-zinc-800 bg-zinc-900/30 p-4 flex flex-col overflow-y-auto">
            <div className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider font-semibold mb-3">
              Execution Timeline
            </div>

            {isLoading ? (
              <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
                <Loader2 className="w-6 h-6 animate-spin text-sky-400 mb-2" />
                <span className="text-xs font-mono text-zinc-400">Booting Playwright Session...</span>
              </div>
            ) : loadError ? (
              <div className="p-3 bg-rose-950/30 border border-rose-900 rounded text-xs font-mono text-rose-300">
                {loadError}
              </div>
            ) : (
              <div className="space-y-2 flex-1">
                {steps.map((st, idx) => {
                  const isActive = idx === currentStepIndex;
                  const isDone = idx < currentStepIndex;
                  const isError = st.status === 'FAILED';

                  return (
                    <button
                      key={st.stepNumber}
                      onClick={() => {
                        setCurrentStepIndex(idx);
                        setIsPlaying(false);
                      }}
                      className={`w-full p-2.5 rounded-lg border text-left font-mono transition-all flex items-start gap-2.5 ${
                        isActive
                          ? isError
                            ? 'bg-rose-950/40 border-rose-600 ring-1 ring-rose-500'
                            : 'bg-zinc-800 border-zinc-600 ring-1 ring-zinc-500'
                          : isDone
                          ? 'bg-zinc-950/60 border-zinc-800/80 text-zinc-400'
                          : 'bg-zinc-950/20 border-zinc-900 text-zinc-600'
                      }`}
                    >
                      <div className="mt-0.5 flex-shrink-0">
                        {isError ? (
                          <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                        ) : isDone ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <div
                            className={`w-3.5 h-3.5 rounded-full border text-[9px] flex items-center justify-center font-bold ${
                              isActive
                                ? 'border-sky-400 text-sky-400 bg-sky-950'
                                : 'border-zinc-700 text-zinc-600'
                            }`}
                          >
                            {st.stepNumber}
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="text-[11px] font-semibold text-zinc-200 truncate">
                          {st.description}
                        </div>
                        <div className="text-[10px] text-zinc-500 truncate">
                          {st.action.toUpperCase()}{' '}
                          {st.targetSelector || st.targetText || st.inputValue || ''}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right / Live Browser Viewport (3 cols) */}
          <div className="lg:col-span-3 flex flex-col bg-zinc-950 p-4 overflow-hidden">
            {/* Browser Window Frame */}
            <div className="flex-1 flex flex-col border border-zinc-800 rounded-lg overflow-hidden bg-zinc-900 shadow-xl">
              {/* Browser Address Bar */}
              <div className="h-9 px-3 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between gap-3 text-xs font-mono">
                <div className="flex items-center gap-1.5 text-zinc-600">
                  <div className="w-2.5 h-2.5 rounded-full bg-zinc-800"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-zinc-800"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-zinc-800"></div>
                </div>

                <div className="flex-1 max-w-lg bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1 flex items-center gap-2 text-zinc-400 text-[11px]">
                  <Lock className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                  <span className="truncate">{currentStep?.currentUrl || anomaly.route}</span>
                </div>

                <div className="text-[10px] text-zinc-500 font-mono">
                  1280 × 800
                </div>
              </div>

              {/* Viewport Content */}
              <div className="flex-1 relative bg-zinc-950 flex items-center justify-center overflow-hidden">
                {isLoading ? (
                  <div className="text-center p-8">
                    <Loader2 className="w-8 h-8 animate-spin text-sky-400 mx-auto mb-3" />
                    <p className="text-xs font-mono text-zinc-400">Launching headless session...</p>
                  </div>
                ) : currentStep?.screenshotBase64 ? (
                  <div className="relative w-full h-full flex items-center justify-center p-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={currentStep.screenshotBase64}
                      alt={currentStep.description}
                      className="max-h-full max-w-full object-contain rounded border border-zinc-800"
                    />

                    {/* Cursor / Pointer Overlay on interactive action */}
                    {currentStep.targetSelector && (
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none flex items-center gap-2 bg-sky-950/80 border border-sky-500/80 text-sky-300 px-3 py-1.5 rounded-full shadow-lg backdrop-blur text-xs font-mono animate-bounce">
                        <MousePointer className="w-4 h-4 fill-sky-400 text-sky-400" />
                        <span>Action: {currentStep.description}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Synthetic Viewport when screenshot is generating or in simulated state */
                  <div className="w-full h-full p-6 flex flex-col justify-between">
                    <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-lg">
                      <div className="text-xs font-mono text-zinc-500 mb-1">
                        VIEWPORT SIMULATION: {currentStep?.pageTitle || 'Active Route'}
                      </div>
                      <h3 className="text-lg font-semibold text-zinc-200 mb-2">
                        {currentStep?.description}
                      </h3>
                      <div className="font-mono text-xs text-sky-400 bg-zinc-950 p-2 rounded border border-zinc-800">
                        {currentStep?.action.toUpperCase()}: {currentStep?.targetSelector || currentStep?.currentUrl}
                      </div>
                    </div>

                    {isFailedStep && (
                      <div className="p-4 bg-rose-950/40 border border-rose-600 rounded-lg text-rose-300 font-mono text-xs space-y-2 animate-in fade-in">
                        <div className="flex items-center gap-2 font-bold text-sm">
                          <AlertCircle className="w-4 h-4 text-rose-400" />
                          <span>OBSERVED FAILURE REPRODUCED DETERMINISTICALLY</span>
                        </div>
                        <p>{currentStep.errorDetails?.message || anomaly.summary}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Crash Overlay Banner on Failure Step */}
                {isFailedStep && (
                  <div className="absolute bottom-4 left-4 right-4 z-20 bg-rose-950/90 border border-rose-600/80 p-3.5 rounded-lg shadow-2xl backdrop-blur flex items-start gap-3 text-xs font-mono text-rose-200">
                    <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-rose-100 uppercase tracking-wider mb-0.5">
                        {anomaly.type} DETECTED AT STEP {currentStep?.stepNumber}
                      </div>
                      <div className="text-rose-300 break-all">
                        {currentStep?.errorDetails?.message || anomaly.summary}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Playback Controls Footer */}
            <div className="h-14 mt-3 flex items-center justify-between border-t border-zinc-800/80 pt-3 flex-shrink-0">
              {/* Playback Step Controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setCurrentStepIndex((prev) => Math.max(prev - 1, 0));
                    setIsPlaying(false);
                  }}
                  disabled={currentStepIndex === 0}
                  className="p-2 rounded bg-zinc-900 hover:bg-zinc-800 disabled:opacity-30 border border-zinc-800 text-zinc-300 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="px-3 py-1.5 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-bold text-xs font-mono flex items-center gap-1.5 transition-colors"
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-3.5 h-3.5 fill-current" />
                      <span>Pause</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Play</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => {
                    setCurrentStepIndex((prev) => Math.min(prev + 1, steps.length - 1));
                    setIsPlaying(false);
                  }}
                  disabled={currentStepIndex >= steps.length - 1}
                  className="p-2 rounded bg-zinc-900 hover:bg-zinc-800 disabled:opacity-30 border border-zinc-800 text-zinc-300 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                <button
                  onClick={handleRestart}
                  className="p-2 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
                  title="Replay from start"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>

              {/* Step Counter Indicator */}
              <div className="font-mono text-xs text-zinc-400">
                Step <span className="font-bold text-zinc-100">{currentStepIndex + 1}</span> of{' '}
                <span className="text-zinc-500">{steps.length || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
