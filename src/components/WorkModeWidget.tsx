/**
 * Work Mode Widget Layout
 * Implements the user's exact specification:
 * |25m|  <--- Pomodoro
 * |===|  <--- Task list (Kinetic Single-Task + Queue)
 * |<>>|  <--- Sound selector
 * |-go-| <--- Start / Stop controls
 */

import React, { useState, useEffect } from 'react';
import { AtomicStep, AudioTrackType, SessionMetrics, UserCognitiveProfile } from '../types/synapse';
import { audioEngine } from '../services/audioEngine';
import { triggerKineticBlast } from './KineticCanvasOverlay';
import {
  Play,
  Pause,
  Check,
  Split,
  ShieldAlert,
  Volume2,
  VolumeX,
  Radio,
  Flame,
  Award,
  Sparkles,
  ChevronDown,
} from 'lucide-react';

interface Props {
  activeStep: AtomicStep | null;
  pipelineQueue: AtomicStep[];
  profile: UserCognitiveProfile;
  metrics: SessionMetrics;
  onCompleteStep: (stepId: string) => void;
  onSubdivideStep: (stepId: string) => void;
  onTriggerHardStop: () => void;
}

export const WorkModeWidget: React.FC<Props> = ({
  activeStep,
  pipelineQueue,
  profile,
  metrics,
  onCompleteStep,
  onSubdivideStep,
  onTriggerHardStop,
}) => {
  const [timerSeconds, setTimerSeconds] = useState<number>(
    profile.pomodoro.work_duration_seconds || 1500
  );
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [selectedBlockMode, setSelectedBlockMode] = useState<'work' | 'kickstart' | 'sprint'>('work');
  const [currentSound, setCurrentSound] = useState<AudioTrackType>(profile.audio_preference.engine);
  const [volume, setVolume] = useState<number>(profile.audio_preference.volume || 0.5);
  const [isDissolving, setIsDissolving] = useState<boolean>(false);

  // Pomodoro countdown timer loop
  useEffect(() => {
    let interval: number | null = null;
    if (isTimerRunning && timerSeconds > 0) {
      interval = window.setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            audioEngine.triggerHardStopCutoff();
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

  // Sync volume to audio engine
  useEffect(() => {
    audioEngine.setVolume(volume);
  }, [volume]);

  // Start / Stop toggle
  const handleTogglePlay = () => {
    const nextState = !isTimerRunning;
    setIsTimerRunning(nextState);

    if (profile.audio_preference.auto_couple_to_timer) {
      if (nextState) {
        audioEngine.play(currentSound);
      } else {
        audioEngine.stop();
      }
    }
  };

  const handleSelectBlockMode = (mode: 'kickstart' | 'work' | 'sprint') => {
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

  const handleSelectSound = (track: AudioTrackType) => {
    setCurrentSound(track);
    if (isTimerRunning) {
      audioEngine.play(track);
    }
  };

  const handleExecute = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!activeStep) return;

    const rect = e.currentTarget.getBoundingClientRect();
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
      x: rect.left + rect.width / 2,
      y: rect.top,
      message,
      color: '#00f2fe',
    });

    window.setTimeout(() => {
      onCompleteStep(activeStep.id);
      setIsDissolving(false);
    }, 320);
  };

  const formatTimer = (secs: number) => {
    const m = String(Math.floor(secs / 60)).padStart(2, '0');
    const s = String(secs % 60).padStart(2, '0');
    return `${m}:${s}`;
  };

  const soundOptions: Array<{ id: AudioTrackType; label: string; desc: string }> = [
    { id: 'brown', label: 'Brown Noise', desc: '1/f² sub-bass' },
    { id: 'alpha', label: '432Hz Drone', desc: 'Alpha wave' },
    { id: 'cyber', label: 'Cyber Pulse', desc: '60 BPM kick' },
    { id: 'white', label: 'White Noise', desc: 'Mask curtain' },
  ];

  return (
    <div className="flex-1 flex flex-col justify-between space-y-3 font-mono text-xs select-none">
      
      {/* ========================================================
          1. |25m| POMODORO DISPLAY (Top Tier)
          ======================================================== */}
      <div className="bg-[#07090e] border border-[#1e293b] rounded-xl p-3.5 flex flex-col items-center justify-center space-y-2 relative overflow-hidden">
        
        {/* Subtle timer glow */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#00f2fe]/5 to-transparent pointer-events-none" />

        {/* Top Badges: Streak & Mode Presets */}
        <div className="w-full flex items-center justify-between text-[11px] z-10">
          <div className="flex items-center gap-1.5 text-[#ff007f] font-bold">
            <Flame className="w-3.5 h-3.5" />
            <span>{metrics.streak}x COMBO</span>
          </div>

          {/* Quick Pomodoro Presets */}
          <div className="flex items-center gap-1 bg-[#0c101a] p-0.5 rounded-lg border border-[#1e293b]">
            <button
              onClick={() => handleSelectBlockMode('kickstart')}
              className={`px-2 py-0.5 rounded text-[10px] transition ${
                selectedBlockMode === 'kickstart'
                  ? 'bg-[#141b2d] text-[#00f2fe] border border-[#00f2fe]/40 font-bold'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              5m
            </button>
            <button
              onClick={() => handleSelectBlockMode('work')}
              className={`px-2 py-0.5 rounded text-[10px] transition ${
                selectedBlockMode === 'work'
                  ? 'bg-[#141b2d] text-[#00f2fe] border border-[#00f2fe]/40 font-bold'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              25m
            </button>
            <button
              onClick={() => handleSelectBlockMode('sprint')}
              className={`px-2 py-0.5 rounded text-[10px] transition ${
                selectedBlockMode === 'sprint'
                  ? 'bg-[#141b2d] text-[#00f2fe] border border-[#00f2fe]/40 font-bold'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              50m
            </button>
          </div>
        </div>

        {/* Big Tabular Countdown Timer */}
        <div className="text-4xl font-extrabold tracking-tight text-white font-mono tabular-nums my-1 z-10">
          {formatTimer(timerSeconds)}
        </div>

        {/* Timer State Label */}
        <div className="text-[10px] text-slate-500 flex items-center gap-1.5 z-10">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isTimerRunning ? 'bg-emerald-400 animate-ping' : 'bg-slate-600'
            }`}
          />
          <span className="uppercase text-slate-400 font-bold">
            {isTimerRunning ? 'FOCUS SPRINT ACTIVE' : 'PAUSED · CLICK -GO- TO START'}
          </span>
        </div>
      </div>

      {/* ========================================================
          2. |===| TASK LIST / KINETIC SINGLE-TASK FOCUS (Middle Tier)
          ======================================================== */}
      <div className="flex-1 flex flex-col justify-between bg-[#07090e] border border-[#1e293b] rounded-xl p-3.5 space-y-3 min-h-[160px]">
        
        {/* Dynamic Current Atomic Step */}
        <div
          className={`transition-all duration-300 space-y-2 ${
            isDissolving
              ? 'opacity-0 scale-95 blur-md translate-y-[-8px]'
              : 'opacity-100 scale-100 blur-0 translate-y-0'
          }`}
        >
          {activeStep ? (
            <div>
              <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                <span className="text-[#00f2fe] font-semibold truncate max-w-[200px]">
                  {activeStep.project_title}
                </span>
                <span>
                  Step {activeStep.step_number} of {activeStep.total_steps}
                </span>
              </div>

              <h3 className="text-sm font-bold text-white leading-snug">
                {activeStep.prompt}
              </h3>

              <p className="text-[11px] text-slate-400 font-mono flex items-start gap-1.5 mt-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#ffaa00] shrink-0 mt-0.5" />
                <span>{activeStep.hint}</span>
              </p>
            </div>
          ) : (
            <div className="py-4 text-center space-y-1">
              <span className="text-[#00f2fe] font-bold text-xs">🎉 SPRINT CLEARED!</span>
              <p className="text-[10px] text-slate-500">
                Zero pending micro-tasks. Switch to Braindump mode to add your next items.
              </p>
            </div>
          )}
        </div>

        {/* Atomic Action Buttons: Execute & Split */}
        <div className="pt-2 border-t border-[#1e293b] flex flex-col gap-2">
          <button
            onClick={handleExecute}
            disabled={!activeStep}
            className="w-full bg-[#00f2fe] hover:bg-cyan-400 disabled:opacity-40 text-black font-bold font-mono text-xs py-2.5 px-3 rounded-lg transition transform active:scale-95 shadow-md shadow-cyan-500/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>EXECUTE & BLAST (+150 XP)</span>
          </button>

          {activeStep && (
            <button
              onClick={() => onSubdivideStep(activeStep.id)}
              className="text-[11px] font-mono text-slate-400 hover:text-[#00f2fe] py-1.5 px-2 rounded-lg border border-[#1e293b] hover:border-[#00f2fe]/40 bg-[#0c101a] transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Split className="w-3 h-3 text-[#ffaa00]" />
              <span>Too hard? Split into 30s micro-actions</span>
            </button>
          )}
        </div>

        {/* Upcoming Queue Peek (if any) */}
        {pipelineQueue.length > 1 && (
          <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-900 flex items-center justify-between">
            <span>Next in queue:</span>
            <span className="truncate max-w-[200px] text-slate-400">
              {pipelineQueue[1].prompt}
            </span>
          </div>
        )}
      </div>

      {/* ========================================================
          3. |<>>| SOUND SELECTOR (Lower-Middle Tier)
          ======================================================== */}
      <div className="bg-[#07090e] border border-[#1e293b] rounded-xl p-2.5 space-y-2">
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5 text-slate-300 font-bold">
            <Radio className="w-3.5 h-3.5 text-[#ffaa00]" />
            Procedural Audio Bed
          </span>
          <span className="text-[10px] text-emerald-400">0MB Synthetic</span>
        </div>

        {/* 4 Sound Chips */}
        <div className="grid grid-cols-2 gap-1.5">
          {soundOptions.map((snd) => (
            <button
              key={snd.id}
              onClick={() => handleSelectSound(snd.id)}
              className={`p-1.5 rounded-lg border text-left transition cursor-pointer ${
                currentSound === snd.id
                  ? 'bg-[#141b2d] border-[#00f2fe] text-white shadow-sm'
                  : 'bg-[#0c101a] border-[#1e293b] text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="font-bold text-[10px] text-slate-200">{snd.label}</div>
              <div className="text-[8px] text-slate-500">{snd.desc}</div>
            </button>
          ))}
        </div>

        {/* Volume Slider */}
        <div className="flex items-center gap-2 pt-1">
          <VolumeX className="w-3 h-3 text-slate-600" />
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-full h-1 bg-[#141b2d] rounded-lg appearance-none cursor-pointer accent-[#00f2fe]"
          />
          <Volume2 className="w-3 h-3 text-slate-400" />
          <span className="text-[10px] text-slate-500 w-7 text-right">
            {Math.round(volume * 100)}%
          </span>
        </div>
      </div>

      {/* ========================================================
          4. |-go-| START / STOP CONTROLS (Bottom Tier)
          ======================================================== */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleTogglePlay}
          className={`flex-1 py-3.5 rounded-xl font-bold font-mono text-xs tracking-wider uppercase transition shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-95 ${
            isTimerRunning
              ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-amber-500/20'
              : 'bg-emerald-400 hover:bg-emerald-300 text-black shadow-emerald-500/20'
          }`}
        >
          {isTimerRunning ? (
            <>
              <Pause className="w-4 h-4 fill-current" />
              <span>- PAUSE -</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>- GO -</span>
            </>
          )}
        </button>

        {/* Emergency Lockout Trigger */}
        <button
          onClick={onTriggerHardStop}
          className="p-3.5 rounded-xl bg-[#0c101a] border border-rose-500/40 text-rose-400 hover:bg-rose-950/40 transition shrink-0"
          title="Trigger Mandatory Hard-Stop Break Lockout"
        >
          <ShieldAlert className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
};
