/**
 * Hard-Stop Pomodoro & Physical Release Barrier
 * Fullscreen lockout modal that abruptly cuts audio and enforces a
 * 3-second physical spacebar hold barrier before resuming.
 */

import React, { useEffect, useState, useRef } from 'react';
import { audioEngine } from '../services/audioEngine';
import { triggerKineticBlast } from './KineticCanvasOverlay';
import { ShieldAlert, Coffee, Unlock } from 'lucide-react';

interface Props {
  isActive: boolean;
  onDismiss: () => void;
  breakDurationSeconds?: number;
}

export const HardStopLockout: React.FC<Props> = ({
  isActive,
  onDismiss,
  breakDurationSeconds = 300,
}) => {
  const [holdProgress, setHoldProgress] = useState<number>(0);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(breakDurationSeconds);
  const holdStartRef = useRef<number | null>(null);
  const holdIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (isActive) {
      audioEngine.triggerHardStopCutoff();
      setSecondsRemaining(breakDurationSeconds);
    }
  }, [isActive, breakDurationSeconds]);

  // Break countdown timer
  useEffect(() => {
    if (!isActive) return;
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isActive]);

  // Physical spacebar hold barrier (3 seconds)
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat && holdStartRef.current === null) {
        e.preventDefault();
        holdStartRef.current = Date.now();

        holdIntervalRef.current = window.setInterval(() => {
          if (!holdStartRef.current) return;
          const elapsed = Date.now() - holdStartRef.current;
          const progress = Math.min(100, (elapsed / 3000) * 100);
          setHoldProgress(progress);

          if (elapsed >= 3000) {
            // Barrier cleared
            clearInterval(holdIntervalRef.current!);
            holdIntervalRef.current = null;
            holdStartRef.current = null;
            setHoldProgress(0);
            triggerKineticBlast({ message: 'BARRIER RELEASED! +50 XP' });
            onDismiss();
          }
        }, 30);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        if (holdIntervalRef.current) {
          clearInterval(holdIntervalRef.current);
          holdIntervalRef.current = null;
        }
        holdStartRef.current = null;
        setHoldProgress(0);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (holdIntervalRef.current) {
        clearInterval(holdIntervalRef.current);
      }
    };
  }, [isActive, onDismiss]);

  if (!isActive) return null;

  const mins = String(Math.floor(secondsRemaining / 60)).padStart(2, '0');
  const secs = String(secondsRemaining % 60).padStart(2, '0');

  // Circumference for 120px diameter circle: 2 * pi * 52 ≈ 326.7
  const circumference = 326.7;
  const strokeDashoffset = circumference - (holdProgress / 100) * circumference;

  return (
    <div className="fixed inset-0 z-[10000] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 select-none animate-fadeIn">
      <div className="max-w-md w-full text-center space-y-6">
        
        {/* Warning Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-950/80 border border-rose-500/40 text-rose-400 text-xs font-mono">
          <ShieldAlert className="w-4 h-4 animate-pulse" />
          <span>MANDATORY RECOVERY BARRIER</span>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Focus Block Complete
          </h1>
          <p className="text-sm text-slate-400 font-mono">
            Audio bed terminated. Disengage gaze, stretch neck muscles, and drink water.
          </p>
        </div>

        {/* Big Break Countdown */}
        <div className="p-6 rounded-2xl bg-[#0c101a] border border-[#1e293b] space-y-2">
          <div className="flex items-center justify-center gap-2 text-xs font-mono text-slate-500 uppercase tracking-wider">
            <Coffee className="w-4 h-4 text-[#ffaa00]" />
            <span>Recommended Recovery Time</span>
          </div>
          <div className="text-5xl font-mono font-bold text-[#ffaa00] tabular-nums">
            {mins}:{secs}
          </div>
        </div>

        {/* Physical Release Gate (Hold Space 3s) */}
        <div className="p-6 rounded-2xl bg-[#141b2d]/90 border border-[#1e293b] space-y-4">
          <div className="text-xs font-mono text-slate-300 font-semibold flex items-center justify-center gap-1.5">
            <Unlock className="w-4 h-4 text-[#00f2fe]" />
            <span>Physical Release Barrier</span>
          </div>

          <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
            {/* SVG Progress Circle */}
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
              <circle
                cx="60"
                cy="60"
                r="52"
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="8"
                fill="transparent"
              />
              <circle
                cx="60"
                cy="60"
                r="52"
                stroke="#00f2fe"
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-75"
              />
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-mono text-sm font-bold text-[#00f2fe]">
                {Math.round(holdProgress)}%
              </span>
              <span className="text-[10px] font-mono text-slate-500">HOLD</span>
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-xs font-mono text-slate-200">
              Press and hold <kbd className="px-2 py-1 bg-black border border-slate-700 rounded text-cyan-400 font-bold">SPACE</kbd> for 3s
            </div>
            <div className="text-[11px] text-slate-500 font-mono">
              Releasing early resets progress. Intentional tactile override only.
            </div>
          </div>
        </div>

        {/* Emergency Escape Button */}
        <button
          onClick={onDismiss}
          className="text-xs font-mono text-slate-600 hover:text-slate-400 transition underline underline-offset-4"
        >
          [Emergency Bypass Lockout]
        </button>

      </div>
    </div>
  );
};
