/**
 * Cognitive Alignment Briefing & Archetype Diagnostic
 * Calibrates user's ADHD operating profile, initiation resistance,
 * sensory audio anchors, and hard-stop physical barriers.
 */

import React, { useState } from 'react';
import {
  UserCognitiveProfile,
  InitiationResistance,
  DivergentRate,
  AudioTrackType,
  InterruptionGate,
} from '../types/synapse';
import { triggerKineticBlast } from './KineticCanvasOverlay';
import { audioEngine } from '../services/audioEngine';
import {
  Compass,
  Zap,
  Volume2,
  ShieldAlert,
  Brain,
  Check,
  RotateCcw,
  Sparkles,
  Download,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  profile: UserCognitiveProfile;
  onSaveProfile: (profile: UserCognitiveProfile) => void;
}

export const CognitiveBriefingModal: React.FC<Props> = ({
  isOpen,
  onClose,
  profile,
  onSaveProfile,
}) => {
  const [step, setStep] = useState<number>(1);
  const [northStar, setNorthStar] = useState<string>(profile.active_north_star);
  const [horizon, setHorizon] = useState<string>(profile.urgency_horizon);
  const [initiationResistance, setInitiationResistance] = useState<InitiationResistance>(
    profile.archetype.initiation_resistance
  );
  const [divergentRate, setDivergentRate] = useState<DivergentRate>(
    profile.archetype.divergent_rate
  );
  const [subtaskGranularity, setSubtaskGranularity] = useState<number>(
    profile.archetype.subtask_granularity_seconds
  );
  const [audioEnginePref, setAudioEnginePref] = useState<AudioTrackType>(
    profile.audio_preference.engine
  );
  const [autoCoupleAudio, setAutoCoupleAudio] = useState<boolean>(
    profile.audio_preference.auto_couple_to_timer
  );
  const [workDuration, setWorkDuration] = useState<number>(
    profile.pomodoro.work_duration_seconds / 60
  );
  const [breakDuration, setBreakDuration] = useState<number>(
    profile.pomodoro.break_duration_seconds / 60
  );
  const [interruptionGate, setInterruptionGate] = useState<InterruptionGate>(
    profile.pomodoro.interruption_gate
  );

  if (!isOpen) return null;

  // Derive calculated archetype name
  const computeArchetype = (): string => {
    if (initiationResistance === 'PARALYZING' || initiationResistance === 'HIGH') {
      return divergentRate === 'HYPERFOCUS' || divergentRate === 'HIGH'
        ? 'Divergent High-Velocity Architect'
        : 'Atomic Kinetic Sprinter';
    }
    return divergentRate === 'HYPERFOCUS'
      ? 'Deep Flow System Builder'
      : 'Calibrated Full-Stack Producer';
  };

  const handleApplyPreset = (type: 'hyper' | 'dysfunction' | 'deep') => {
    if (type === 'hyper') {
      setInitiationResistance('HIGH');
      setDivergentRate('HYPERFOCUS');
      setSubtaskGranularity(60);
      setAudioEnginePref('brown');
      setAutoCoupleAudio(true);
      setWorkDuration(25);
      setBreakDuration(5);
    } else if (type === 'dysfunction') {
      setInitiationResistance('PARALYZING');
      setDivergentRate('HIGH');
      setSubtaskGranularity(30);
      setAudioEnginePref('alpha');
      setAutoCoupleAudio(true);
      setWorkDuration(15);
      setBreakDuration(3);
    } else {
      setInitiationResistance('MODERATE');
      setDivergentRate('MODERATE');
      setSubtaskGranularity(120);
      setAudioEnginePref('cyber');
      setAutoCoupleAudio(true);
      setWorkDuration(50);
      setBreakDuration(10);
    }
    triggerKineticBlast({ message: 'PRESET LOADED' });
  };

  const handleSave = () => {
    const updatedProfile: UserCognitiveProfile = {
      profile_id: profile.profile_id || `usr_${Date.now()}`,
      active_north_star: northStar.trim() || 'Ship Core Engine MVP',
      urgency_horizon: horizon.trim() || 'Current sprint release',
      archetype: {
        name: computeArchetype(),
        initiation_resistance: initiationResistance,
        divergent_rate: divergentRate,
        subtask_granularity_seconds: subtaskGranularity,
        tangent_handling: 'INSTANT_INCUBATOR',
      },
      pomodoro: {
        work_duration_seconds: workDuration * 60,
        break_duration_seconds: breakDuration * 60,
        hard_lock_on_finish: true,
        interruption_gate: interruptionGate,
      },
      audio_preference: {
        engine: audioEnginePref,
        auto_couple_to_timer: autoCoupleAudio,
        volume: profile.audio_preference.volume ?? 0.5,
        spotify_connect_enabled: true,
      },
    };

    onSaveProfile(updatedProfile);
    triggerKineticBlast({ message: 'COGNITIVE PROFILE CALIBRATED! +200 XP' });
    onClose();
  };

  const exportProfileJson = () => {
    const currentData = {
      profile_id: profile.profile_id,
      active_north_star: northStar,
      urgency_horizon: horizon,
      archetype: {
        name: computeArchetype(),
        initiation_resistance: initiationResistance,
        divergent_rate: divergentRate,
        subtask_granularity_seconds: subtaskGranularity,
      },
      pomodoro: {
        work_duration_seconds: workDuration * 60,
        break_duration_seconds: breakDuration * 60,
        hard_lock_on_finish: true,
        interruption_gate: interruptionGate,
      },
      audio_preference: {
        engine: audioEnginePref,
        auto_couple_to_timer: autoCoupleAudio,
      },
    };

    const blob = new Blob([JSON.stringify(currentData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'profile.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-[#0c101a] border border-[#1e293b] rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6 text-slate-200">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#1e293b] pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono text-[#00f2fe]">
              <Brain className="w-4 h-4" />
              <span>COGNITIVE ALIGNMENT BRIEFING</span>
              <span className="text-slate-500">·</span>
              <span className="text-slate-400">Step {step} of 4</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Calibrate Your Neuro-Divergent Operating System
            </h2>
            <p className="text-xs text-slate-400">
              SYNAPSE adjusts task granularity, incubation velocity, and audio coupling to eliminate initiation resistance.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleApplyPreset('dysfunction')}
              title="Apply Executive Dysfunction Preset"
              className="text-[11px] font-mono px-2.5 py-1 rounded bg-[#141b2d] border border-[#1e293b] text-slate-300 hover:text-[#00f2fe] transition"
            >
              Quick Preset
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white text-sm p-1 rounded-lg hover:bg-slate-800"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { id: 1, label: 'North Star', icon: Compass },
            { id: 2, label: 'Initiation & Tangents', icon: Zap },
            { id: 3, label: 'Sensory Audio', icon: Volume2 },
            { id: 4, label: 'Hard-Stop Lock', icon: ShieldAlert },
          ].map((s) => {
            const Icon = s.icon;
            const isActive = step === s.id;
            const isDone = step > s.id;
            return (
              <button
                key={s.id}
                onClick={() => setStep(s.id)}
                className={`flex items-center gap-2 p-2 rounded-lg text-left text-xs font-mono transition border ${
                  isActive
                    ? 'bg-[#141b2d] border-[#00f2fe] text-[#00f2fe]'
                    : isDone
                    ? 'bg-[#0f172a] border-emerald-500/40 text-emerald-400'
                    : 'bg-transparent border-[#1e293b] text-slate-500'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">{s.label}</span>
              </button>
            );
          })}
        </div>

        {/* Step Content */}
        <div className="min-h-[280px]">
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-300 uppercase tracking-wider mb-1">
                  1. Active North Star Anchor Milestone
                </label>
                <p className="text-xs text-slate-400 mb-2">
                  The primary deliverable for today. The 2x2 matrix compares all sudden brain dumps against this benchmark to determine whether they belong in the Active Pipeline or go to the Async Scout.
                </p>
                <input
                  type="text"
                  value={northStar}
                  onChange={(e) => setNorthStar(e.target.value)}
                  placeholder="e.g. Ship Core MVP of Client Automation Portal"
                  className="w-full bg-[#07090e] border border-[#1e293b] rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-[#00f2fe] font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 uppercase tracking-wider mb-1">
                  Urgency Horizon
                </label>
                <input
                  type="text"
                  value={horizon}
                  onChange={(e) => setHorizon(e.target.value)}
                  placeholder="e.g. End of sprint / Next 48 hours"
                  className="w-full bg-[#07090e] border border-[#1e293b] rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-[#00f2fe] font-mono"
                />
              </div>

              <div className="bg-[#141b2d] border border-[#1e293b] rounded-xl p-3.5 text-xs text-slate-400">
                <span className="text-[#00f2fe] font-mono font-semibold">Zero Loss Philosophy:</span> Any idea that doesn't align with this milestone is never culled. It is automatically handed off to the Scout worker to scaffold dependencies in the background.
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-mono text-slate-300 uppercase tracking-wider mb-1">
                  2. Initiation Resistance (Activation Barrier)
                </label>
                <p className="text-xs text-slate-400 mb-3">
                  How much friction do you experience when beginning a task from a dead stop?
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(
                    [
                      { id: 'LOW', label: 'Low', desc: 'Can start cleanly', sub: 180 },
                      { id: 'MODERATE', label: 'Moderate', desc: 'Mild hesitation', sub: 120 },
                      { id: 'HIGH', label: 'High', desc: 'Needs small starts', sub: 60 },
                      { id: 'PARALYZING', label: 'Paralyzing', desc: 'Severe dysfunction', sub: 30 },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => {
                        setInitiationResistance(opt.id);
                        setSubtaskGranularity(opt.sub);
                      }}
                      className={`p-3 rounded-xl border text-left font-mono text-xs transition ${
                        initiationResistance === opt.id
                          ? 'bg-[#141b2d] border-[#00f2fe] text-white shadow-md'
                          : 'bg-[#07090e] border-[#1e293b] text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="font-bold">{opt.label}</div>
                      <div className="text-[10px] text-slate-500 mt-1">{opt.desc}</div>
                      <div className="text-[10px] text-[#00f2fe] mt-1">{opt.sub}s micro-tasks</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 uppercase tracking-wider mb-1">
                  Divergent Tangent Velocity
                </label>
                <p className="text-xs text-slate-400 mb-3">
                  How frequently do novel ideas arise during an ongoing sprint?
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(
                    [
                      { id: 'LOW', label: 'Low', desc: 'Linear focus' },
                      { id: 'MODERATE', label: 'Moderate', desc: 'Occasional ideas' },
                      { id: 'HIGH', label: 'High', desc: 'Constant branches' },
                      { id: 'HYPERFOCUS', label: 'Hyperfocus', desc: 'Deep novelty spiral' },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setDivergentRate(opt.id)}
                      className={`p-3 rounded-xl border text-left font-mono text-xs transition ${
                        divergentRate === opt.id
                          ? 'bg-[#141b2d] border-purple-500 text-white shadow-md'
                          : 'bg-[#07090e] border-[#1e293b] text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="font-bold">{opt.label}</div>
                      <div className="text-[10px] text-slate-500 mt-1">{opt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-300 uppercase tracking-wider mb-1">
                  3. Sensory Focus Audio Engine (Procedural Web Audio)
                </label>
                <p className="text-xs text-slate-400 mb-3">
                  Direct synthetic sound beds with 0MB download footprint and zero streaming lag.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {(
                    [
                      { id: 'brown', label: 'Brown Noise', desc: 'Warm 1/f² sub-bass rumble' },
                      { id: 'alpha', label: '432Hz Drone', desc: 'Sine & alpha breathing swell' },
                      { id: 'white', label: 'White Noise', desc: 'Crisp static frequency curtain' },
                      { id: 'cyber', label: 'Cyber Pulse', desc: '60 BPM ambient lo-fi heartbeat' },
                    ] as const
                  ).map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setAudioEnginePref(item.id);
                        audioEngine.play(item.id);
                      }}
                      className={`p-3 rounded-xl border text-left font-mono text-xs transition ${
                        audioEnginePref === item.id
                          ? 'bg-[#141b2d] border-[#ffaa00] text-white'
                          : 'bg-[#07090e] border-[#1e293b] text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="font-bold text-slate-200">{item.label}</div>
                      <div className="text-[10px] text-slate-500 mt-1">{item.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between p-3.5 bg-[#07090e] border border-[#1e293b] rounded-xl text-xs font-mono">
                <div>
                  <div className="font-semibold text-slate-200">Auto-Couple Audio to Timer</div>
                  <div className="text-[11px] text-slate-500">Starts automatically on focus, cuts immediately during breaks</div>
                </div>
                <input
                  type="checkbox"
                  checked={autoCoupleAudio}
                  onChange={(e) => setAutoCoupleAudio(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-700 accent-[#00f2fe] cursor-pointer"
                />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-300 uppercase tracking-wider mb-1">
                  4. Hard-Stop Boundary & Interruption Barrier
                </label>
                <p className="text-xs text-slate-400 mb-3">
                  When hyperfocus takes over, cognitive inertia prevents stopping. SYNAPSE enforces an abrupt audio cutoff and physical barrier.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                  <div className="bg-[#07090e] border border-[#1e293b] p-3.5 rounded-xl text-xs font-mono space-y-1">
                    <span className="text-slate-400">Work Block Duration:</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="10"
                        max="60"
                        step="5"
                        value={workDuration}
                        onChange={(e) => setWorkDuration(Number(e.target.value))}
                        className="w-full accent-[#00f2fe]"
                      />
                      <span className="text-[#00f2fe] font-bold w-12 text-right">{workDuration}m</span>
                    </div>
                  </div>

                  <div className="bg-[#07090e] border border-[#1e293b] p-3.5 rounded-xl text-xs font-mono space-y-1">
                    <span className="text-slate-400">Mandatory Recovery Break:</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="2"
                        max="15"
                        step="1"
                        value={breakDuration}
                        onChange={(e) => setBreakDuration(Number(e.target.value))}
                        className="w-full accent-[#ff007f]"
                      />
                      <span className="text-[#ff007f] font-bold w-12 text-right">{breakDuration}m</span>
                    </div>
                  </div>
                </div>

                <div className="bg-[#141b2d] border border-[#1e293b] p-4 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-300 font-semibold">Physical Release Barrier</span>
                    <span className="text-emerald-400 font-bold">HOLD_SPACE_3S</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    When the work timer expires, the screen locks and audio immediately cuts out. You must physically press and hold the <kbd className="px-1.5 py-0.5 bg-black rounded border border-slate-700 text-slate-200">SPACEBAR</kbd> for 3 continuous seconds to release the lock, ensuring real physiological disengagement.
                  </p>
                </div>

                {/* Profile Summary Badge */}
                <div className="p-3 bg-[#07090e] border border-cyan-500/40 rounded-xl flex items-center justify-between text-xs font-mono">
                  <div>
                    <span className="text-slate-500">Synthesized Archetype:</span>
                    <div className="text-[#00f2fe] font-bold text-sm">{computeArchetype()}</div>
                  </div>
                  <button
                    onClick={exportProfileJson}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#141b2d] hover:bg-slate-800 border border-[#1e293b] rounded-lg text-slate-300 transition text-[11px]"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>profile.json</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="flex items-center justify-between border-t border-[#1e293b] pt-4">
          <div className="flex items-center gap-2">
            {step > 1 && (
              <button
                onClick={() => setStep(step - 1)}
                className="px-4 py-2 rounded-xl bg-[#141b2d] border border-[#1e293b] text-xs font-mono text-slate-300 hover:text-white transition"
              >
                Previous
              </button>
            )}
            <button
              onClick={() => handleApplyPreset('hyper')}
              className="text-[11px] font-mono text-slate-500 hover:text-slate-300 flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Defaults</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            {step < 4 ? (
              <button
                onClick={() => setStep(step + 1)}
                className="px-5 py-2.5 rounded-xl bg-[#00f2fe] hover:bg-cyan-400 text-black font-bold font-mono text-xs transition"
              >
                Next Step ➔
              </button>
            ) : (
              <button
                onClick={handleSave}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#00f2fe] to-emerald-400 hover:from-cyan-400 hover:to-emerald-300 text-black font-bold font-mono text-xs transition shadow-lg shadow-cyan-500/20 flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>Save & Lock Alignment (+200 XP)</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
