/**
 * Kinetic Single-Task Execution HUD
 * Isolated single-action view with dissolving task mechanics,
 * micro-step subdivider, particle blast feedback, and coupled Pomodoro timer.
 */

import React, { useState, useEffect } from 'react';
import { AtomicStep, SessionMetrics, UserCognitiveProfile } from '../types/synapse';
import { audioEngine } from '../services/audioEngine';
import { triggerKineticBlast } from './KineticCanvasOverlay';
import {
  Check,
  Split,
  Play,
  Pause,
  RotateCcw,
  ShieldAlert,
  Flame,
  Award,
  Clock,
  Sparkles,
} from 'lucide-react';

interface Props {
  activeStep: AtomicStep | null;
  pipelineQueueLength: number;
  metrics: SessionMetrics;
  profile: UserCognitiveProfile;
  onCompleteStep: (stepId: string) => void;
  onSubdivideStep: (stepId: string) => void;
  onTriggerHardStop: () => void;
}

export const ExecutionHUD: React.FC<Props> = ({
  activeStep,
  pipelineQueueLength,
  metrics,
  profile,
  onCompleteStep,
  onSubdivideStep,
  onTriggerHardStop,
}) => {
  const [isDissolving, setIsDissolving] = useState<boolean>(false);
  const [timerSeconds, setTimerSeconds] = useState<number>(
    profile.pomodoro.work_duration_seconds || 1500
  );
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [selectedBlockMode, setSelectedBlockMode] = useState<'work' | 'kickstart' | 'sprint'>('work');

  // Handle Pomodoro countdown
  useEffect(() => {
    let interval: number | null = null;
    if (isTimerRunning && timerSeconds > 0) {
      interval = window.setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            onTriggerHardStop();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, timerSeconds, onTriggerHardStop]);

  // Audio coupling
  const handleToggleTimer = () => {
    const nextState = !isTimerRunning;
    setIsTimerRunning(nextState);

    if (profile.audio_preference.auto_couple_to_timer) {
      if (nextState) {
        audioEngine.play(profile.audio_preference.engine);
      } else {
        audioEngine.stop();
      }
    }
  };

  const handleSetBlockMode = (mode: 'work' | 'kickstart' | 'sprint') => {
    setSelectedBlockMode(mode);
    setIsTimerRunning(false);
    if (profile.audio_preference.auto_couple_to_timer) {
      audioEngine.stop();
    }

    if (mode === 'kickstart') {
      setTimerSeconds(300); // 5 minutes
    } else if (mode === 'sprint') {
      setTimerSeconds(3000); // 50 minutes
    } else {
      setTimerSeconds(profile.pomodoro.work_duration_seconds || 1500);
    }
  };

  const handleExecute = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!activeStep) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const blastX = rect.left + rect.width / 2;
    const blastY = rect.top + rect.height / 2;

    setIsDissolving(true);
    audioEngine.playCelebrationChime();

    const slogans = [
      'EXECUTION UNLOCKED! +150 XP',
      'MOMENTUM PRESERVED! +150 XP',
      'DOPAMINE SURGE! +150 XP',
      'ATOMIC STEP BLASTED! +150 XP',
    ];
    const message = slogans[Math.floor(Math.random() * slogans.length)];

    triggerKineticBlast({
      x: blastX,
      y: blastY,
      message,
      color: '#00f2fe',
    });

    window.setTimeout(() => {
      onCompleteStep(activeStep.id);
      setIsDissolving(false);
    }, 320);
  };

  const handleSplit = () => {
    if (!activeStep) return;
    onSubdivideStep(activeStep.id);
    triggerKineticBlast({
      message: 'SUBDIVIDED: ZERO FRICTION START!',
      color: '#38bdf8',
    });
  };

  const formatTimer = (secs: number) => {
    const m = String(Math.floor(secs / 60)).padStart(2, '0');
    const s = String(secs % 60).padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="bg-[#0c101a] border border-[#1e293b] rounded-2xl p-6 sm:p-7 relative shadow-2xl space-y-6">
      
      {/* Top Bar Status */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#1e293b]">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#00f2fe] animate-ping" />
          <span className="text-xs font-mono font-bold text-[#00f2fe] tracking-wider uppercase">
            Kinetic Execution HUD
          </span>
          <span className="text-slate-600 hidden sm:inline">·</span>
          <span className="text-xs font-mono text-slate-400 hidden sm:inline">
            Single-Task Isolation Mode
          </span>
        </div>

        {/* Combo & XP Metrics */}
        <div className="flex items-center gap-3 font-mono text-xs">
          <div className="flex items-center gap-1.5 bg-[#141b2d] px-3 py-1 rounded-lg border border-[#1e293b]">
            <Flame className="w-3.5 h-3.5 text-[#ff007f]" />
            <span className="text-[#ff007f] font-bold tabular-nums">
              {metrics.streak}x COMBO
            </span>
          </div>

          <div className="flex items-center gap-1.5 bg-[#141b2d] px-3 py-1 rounded-lg border border-[#1e293b]">
            <Award className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-emerald-400 font-bold tabular-nums">
              {metrics.xp.toLocaleString()} XP
            </span>
          </div>
        </div>
      </div>

      {/* Dynamic Single-Action Focus Container */}
      <div
        className={`min-h-[190px] flex flex-col justify-between transition-all duration-300 ${
          isDissolving
            ? 'opacity-0 scale-95 blur-md translate-y-[-10px] filter brightness-150'
            : 'opacity-100 scale-100 blur-0 translate-y-0'
        }`}
      >
        {activeStep ? (
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400 mb-2">
              <span className="text-[#00f2fe] font-semibold">PROJECT:</span>
              <span className="text-slate-200 font-semibold">{activeStep.project_title}</span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-400">
                Step {activeStep.step_number} of {activeStep.total_steps}
              </span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-500">{pipelineQueueLength} queued</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-snug mb-3 max-w-3xl">
              {activeStep.prompt}
            </h2>

            <p className="text-xs sm:text-sm text-slate-400 font-mono flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-[#ffaa00] shrink-0 mt-0.5" />
              <span>{activeStep.hint}</span>
            </p>
          </div>
        ) : (
          <div className="py-6 text-center space-y-2">
            <div className="text-[#00f2fe] font-mono text-sm font-bold">
              🎉 ACTIVE SPRINT COMPLETE
            </div>
            <p className="text-xs text-slate-400 font-mono">
              All atomic steps cleared with zero unfinished residue. Promote a project from the Scout Incubator or dump your next idea into the capture bar!
            </p>
          </div>
        )}

        {/* Action Controls & Subdivider */}
        <div className="pt-4 flex flex-col gap-3 border-t border-[#1e293b]/70 mt-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <button
              onClick={handleExecute}
              disabled={!activeStep}
              className="flex-1 bg-gradient-to-r from-[#00f2fe] to-cyan-500 hover:from-cyan-400 hover:to-[#00f2fe] disabled:opacity-40 text-black font-bold font-mono text-xs sm:text-sm py-3 px-4 rounded-xl transition transform active:scale-95 shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>EXECUTE & BLAST (+150 XP)</span>
            </button>

            {activeStep && (
              <button
                onClick={handleSplit}
                title="Decompose current resistance into 30-second atomic micro-actions"
                className="text-xs font-mono text-slate-400 hover:text-[#00f2fe] py-2.5 px-3 rounded-xl border border-[#1e293b] hover:border-[#00f2fe]/50 bg-[#07090e] transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Split className="w-3.5 h-3.5 text-[#ffaa00]" />
                <span>Split smaller</span>
              </button>
            )}
          </div>

          {/* Pomodoro Focus Timer Controller */}
          <div className="flex items-center justify-between font-mono text-xs bg-[#07090e] border border-[#1e293b] p-2 rounded-xl">
            <div className="flex items-center gap-2">
              <button
                onClick={handleToggleTimer}
                className={`p-1.5 rounded-lg transition ${
                  isTimerRunning
                    ? 'bg-amber-950/80 text-[#ffaa00] border border-[#ffaa00]/40'
                    : 'bg-[#141b2d] text-slate-300 hover:text-white'
                }`}
                title={isTimerRunning ? 'Pause focus timer' : 'Start focus timer'}
              >
                {isTimerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              </button>

              <span className="font-bold text-slate-100 text-sm tabular-nums">
                {formatTimer(timerSeconds)}
              </span>
            </div>

            {/* Block Presets */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleSetBlockMode('kickstart')}
                className={`px-2 py-0.5 rounded text-[10px] transition ${
                  selectedBlockMode === 'kickstart'
                    ? 'bg-[#141b2d] text-[#00f2fe] border border-[#00f2fe]/40 font-bold'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
                title="5-minute low activation kickstart"
              >
                5m
              </button>
              <button
                onClick={() => handleSetBlockMode('work')}
                className={`px-2 py-0.5 rounded text-[10px] transition ${
                  selectedBlockMode === 'work'
                    ? 'bg-[#141b2d] text-[#00f2fe] border border-[#00f2fe]/40 font-bold'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
                title="25-minute calibrated focus block"
              >
                25m
              </button>
              <button
                onClick={() => handleSetBlockMode('sprint')}
                className={`px-2 py-0.5 rounded text-[10px] transition ${
                  selectedBlockMode === 'sprint'
                    ? 'bg-[#141b2d] text-[#00f2fe] border border-[#00f2fe]/40 font-bold'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
                title="50-minute hyperfocus sprint"
              >
                50m
              </button>

              {/* Trigger Hard Stop Preview */}
              <button
                onClick={onTriggerHardStop}
                className="text-[10px] text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 p-1 rounded transition ml-1"
                title="Test Mandatory Hard-Stop Break Lockout"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
