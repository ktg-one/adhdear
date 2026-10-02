/**
 * CyberWidgetDeck
 * Authentic reproduction of the user's reference design:
 * - Top Card: Glowing cyan LED, '+' capture icon and animated waveform bars (.lılı)
 * - Middle Card: Glowing mint LED, scrollable neon-bordered task pills with ⚡ and Ψ ℧ icons
 * - Bottom Card: Glowing purple LED, tactile radial focus player, 05:00 mono LCD, active task, ✂, ♪, ↺
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  TriageItem,
  AtomicStep,
  UserCognitiveProfile,
  SessionMetrics,
  AudioTrackType,
  QuadrantType,
} from '../types/synapse';
import { audioEngine } from '../services/audioEngine';
import { triggerKineticBlast } from './KineticCanvasOverlay';
import { TriageEngine } from '../services/triageEngine';
import {
  Scissors,
  Music,
  RotateCcw,
  Play,
  Pause,
  Check,
  Zap,
  Mic,
  MicOff,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Plus,
} from 'lucide-react';

interface Props {
  profile: UserCognitiveProfile;
  triageItems: TriageItem[];
  activeStep: AtomicStep | null;
  metrics: SessionMetrics;
  onItemTriaged: (item: TriageItem) => void;
  onCompleteStep: (stepId: string) => void;
  onSubdivideStep: (stepId: string) => void;
  onPromoteItem: (item: TriageItem) => void;
  onSelectActiveTask: (item: TriageItem) => void;
  onInspectScout: (item: TriageItem) => void;
  onTriggerHardStop: () => void;
  onOpenProfile: () => void;
  onOpenMatrix: () => void;
  onOpenBrainDumpMatrix: () => void;
}

export const CyberWidgetDeck: React.FC<Props> = ({
  profile,
  triageItems,
  activeStep,
  metrics,
  onItemTriaged,
  onCompleteStep,
  onSubdivideStep,
  onPromoteItem,
  onSelectActiveTask,
  onInspectScout,
  onTriggerHardStop,
  onOpenProfile,
  onOpenMatrix,
  onOpenBrainDumpMatrix,
}) => {
  // Card 1 Input state
  const [inputText, setInputText] = useState<string>('');
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const recognitionRef = useRef<any>(null);

  // Card 3 Timer state
  const [timerSeconds, setTimerSeconds] = useState<number>(300); // 05:00 default from image
  const [timerInitial, setTimerInitial] = useState<number>(300);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [soundModalOpen, setSoundModalOpen] = useState<boolean>(false);
  const [activeSound, setActiveSound] = useState<AudioTrackType>(profile.audio_preference.engine);
  const [volume, setVolume] = useState<number>(profile.audio_preference.volume || 0.5);

  // Pomodoro countdown loop
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

  // Handle Play/Pause
  const handleToggleTimer = () => {
    const nextState = !isTimerRunning;
    setIsTimerRunning(nextState);

    if (profile.audio_preference.auto_couple_to_timer) {
      if (nextState) {
        audioEngine.play(activeSound);
      } else {
        audioEngine.stop();
      }
    }
  };

  // Cycle timer presets: 05:00 -> 25:00 -> 50:00
  const handleCycleTimerPreset = () => {
    let nextDuration = 300;
    if (timerInitial === 300) nextDuration = 1500;
    else if (timerInitial === 1500) nextDuration = 3000;
    else nextDuration = 300;

    setTimerInitial(nextDuration);
    setTimerSeconds(nextDuration);
    setIsTimerRunning(false);
    audioEngine.stop();
    triggerKineticBlast({ message: `${Math.floor(nextDuration / 60)}M BLOCK` });
  };

  // Speech Recognition
  const handleToggleSpeech = () => {
    if (isRecording) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsRecording(false);
      return;
    }

    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      alert('Speech-to-text not supported in this browser. Please type your brain dump.');
      return;
    }

    try {
      const rec = new SpeechRec();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-US';

      rec.onstart = () => setIsRecording(true);
      rec.onresult = (e: any) => {
        const transcript = Array.from(e.results)
          .map((res: any) => res[0].transcript)
          .join('');
        setInputText(transcript);
      };
      rec.onerror = () => setIsRecording(false);
      rec.onend = () => setIsRecording(false);

      recognitionRef.current = rec;
      rec.start();
    } catch {
      setIsRecording(false);
    }
  };

  // Submit Brain Dump
  const handleDumpSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const raw = inputText.trim();
    if (!raw) return;

    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }

    setIsSubmitting(true);
    try {
      const result = await TriageEngine.triageInput(raw, profile);
      const item = TriageEngine.createTriageItem(raw, result);
      onItemTriaged(item);
      setInputText('');

      const color =
        result.quadrant === 'ACTIVE_PIPELINE'
          ? '#00ff9d'
          : result.quadrant === 'INCUBATOR_SCOUT'
          ? '#a78bfa'
          : '#38bdf8';

      triggerKineticBlast({
        message: result.quadrant === 'ACTIVE_PIPELINE' ? 'ACTIVE PIPELINE ⚡' : 'SCOUT INCUBATOR Ψ',
        color,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Execute Current Active Step
  const handleExecuteActive = () => {
    if (!activeStep) return;
    audioEngine.playCelebrationChime();
    triggerKineticBlast({
      message: 'EXECUTE! +150 XP',
      color: '#00f2fe',
    });
    onCompleteStep(activeStep.id);
  };

  // Sound switch
  const handleSelectSound = (snd: AudioTrackType) => {
    setActiveSound(snd);
    if (isTimerRunning) {
      audioEngine.play(snd);
    }
  };

  // Format MM:SS
  const formatTime = (secs: number) => {
    const m = String(Math.floor(secs / 60)).padStart(2, '0');
    const s = String(secs % 60).padStart(2, '0');
    return `${m}:${s}`;
  };

  // Progress percentage for radial circle
  const progressPercent = Math.max(0, Math.min(100, (1 - timerSeconds / timerInitial) * 100));
  // Circle circumference for r=54: 2 * pi * 54 ≈ 339.29
  const circumference = 339.29;
  const strokeOffset = circumference - (progressPercent / 100) * circumference;

  const currentTaskLabel =
    activeStep?.prompt ||
    triageItems.find((i) => i.classification.quadrant === 'ACTIVE_PIPELINE')?.raw_input ||
    'rebuild vector indexing with sqlite vss';

  return (
    <div className="w-[360px] sm:w-[380px] select-none font-mono text-xs flex flex-col space-y-3.5 tracking-tight">
      
      {/* ========================================================
          CARD 1: CAPTURE & WAVEFORM (Cyan LED)
          Exact match to top pill with cyan dot and "+ .lılı"
          ======================================================== */}
      <div className="bg-[#111726]/95 border border-[#1e273a] rounded-[28px] p-4 shadow-2xl relative flex flex-col justify-between min-h-[96px] group transition hover:border-[#2a3650]">
        
        {/* Top Row: Cyan LED Dot & Matrix link */}
        <div className="flex items-center justify-between">
          <div
            onClick={onOpenProfile}
            className="w-2.5 h-2.5 rounded-full bg-[#22d3ee] led-glow-cyan cursor-pointer transition transform hover:scale-125"
            title="Cyan LED · Click to open Cognitive Profile"
          />
          <button
            onClick={onOpenMatrix}
            className="text-[10px] text-slate-500 hover:text-[#22d3ee] transition flex items-center gap-1"
            title="Inspect 2x2 matrix"
          >
            <span>2x2 matrix</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        {/* Input / Dictation Area */}
        <form onSubmit={handleDumpSubmit} className="mt-2 flex items-center gap-2">
          {/* Plus icon and equalizer bars */}
          <div className="flex items-center gap-1.5 shrink-0 text-[#22d3ee]">
            <button
              type="button"
              onClick={onOpenBrainDumpMatrix}
              className="text-[#22d3ee] hover:text-cyan-300 hover:scale-110 transition cursor-pointer p-0.5"
              title="Open Focus Matrix (Brain Dump Mode)"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
            </button>

            {/* Audio Waveform Equalizer Bars (.lılı) */}
            <div
              onClick={handleToggleSpeech}
              className="flex items-end gap-[2.5px] h-4 cursor-pointer px-1 py-0.5 rounded hover:bg-cyan-950/40 transition"
              title={isRecording ? 'Listening (Click to stop)' : 'Click to dictate voice memo (.lılı)'}
            >
              <span className={`w-[2.5px] rounded-full bg-[#22d3ee] ${isRecording || isTimerRunning ? 'wave-bar' : 'h-1.5'}`} />
              <span className={`w-[2.5px] rounded-full bg-[#22d3ee] ${isRecording || isTimerRunning ? 'wave-bar' : 'h-3'}`} />
              <span className={`w-[2.5px] rounded-full bg-[#22d3ee] ${isRecording || isTimerRunning ? 'wave-bar' : 'h-4'}`} />
              <span className={`w-[2.5px] rounded-full bg-[#22d3ee] ${isRecording || isTimerRunning ? 'wave-bar' : 'h-2.5'}`} />
              <span className={`w-[2.5px] rounded-full bg-[#22d3ee] ${isRecording || isTimerRunning ? 'wave-bar' : 'h-3.5'}`} />
            </div>
          </div>

          {/* Textbox */}
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={isRecording ? 'Listening to speech...' : 'Type or dictate brain dump...'}
            className="flex-1 bg-transparent text-slate-100 placeholder-slate-600 text-xs focus:outline-none font-mono py-1 px-1.5"
          />

          {inputText.trim() && (
            <button
              type="submit"
              className="text-[10px] text-[#22d3ee] font-bold px-1.5 py-0.5 rounded bg-cyan-950/70 border border-cyan-800/40 hover:bg-cyan-900/80 transition cursor-pointer"
            >
              ↵
            </button>
          )}
        </form>
      </div>

      {/* ========================================================
          CARD 2: TASK STREAM (Mint Green LED)
          Pill items with glowing borders, ⚡ lightning & Ψ ℧ icons
          ======================================================== */}
      <div className="bg-[#111726]/95 border border-[#1e273a] rounded-[28px] p-4 shadow-2xl relative flex flex-col space-y-2.5 min-h-[160px] max-h-[220px]">
        
        {/* Top: Mint Green LED Dot */}
        <div className="flex items-center justify-between pb-1">
          <div
            className="w-2.5 h-2.5 rounded-full bg-[#34d399] led-glow-mint"
            title="Mint LED · Live Task Stream"
          />
          <span className="text-[10px] text-slate-600 font-mono">
            {triageItems.length} vectors
          </span>
        </div>

        {/* Scrollable Pill Items Stack */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1.5">
          {triageItems.map((item, index) => {
            const isScout = item.classification.quadrant === 'INCUBATOR_SCOUT';
            const isActive = item.classification.quadrant === 'ACTIVE_PIPELINE';
            const isSelected = activeStep?.item_id === item.id;

            return (
              <div
                key={item.id}
                onClick={() => onSelectActiveTask(item)}
                className={`group flex items-center justify-between px-3 py-2 rounded-xl transition cursor-pointer text-xs ${
                  isActive
                    ? 'bg-[#151d2c] border border-[#34d399]/70 text-slate-100 shadow-[0_0_12px_rgba(52,211,153,0.15)]'
                    : isScout
                    ? 'bg-[#151d2c] border border-[#a78bfa]/70 text-slate-200 shadow-[0_0_12px_rgba(167,139,250,0.15)]'
                    : 'bg-[#131926] border border-[#1f293d] text-slate-400 hover:border-slate-600'
                }`}
              >
                {/* Task Title (lowercase mono as shown in reference image) */}
                <span className="truncate max-w-[240px] text-[11px] font-mono leading-tight">
                  {item.raw_input.toLowerCase()}
                </span>

                {/* Right Icons: ⚡ (Active) or Ψ ℧ (Scout / Orbit) */}
                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  {isActive ? (
                    <span className="text-[#f59e0b] drop-shadow-[0_0_6px_rgba(245,158,11,0.8)]">
                      ⚡
                    </span>
                  ) : isScout ? (
                    <div className="flex items-center gap-1 text-[#a78bfa] text-[11px]">
                      <span title="Scout Tangent">Ψ</span>
                      <span title="Orbit">℧</span>
                    </div>
                  ) : (
                    <span className="text-slate-600 text-[10px]">·</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================
          CARD 3: FOCUS PLAYER & TIMER (Lavender/Purple LED)
          Tactile radial concentric ring + 05:00 mono LCD + active task + ✂, ♪, ↺
          ======================================================== */}
      <div className="bg-[#111726]/95 border border-[#1e273a] rounded-[28px] p-5 shadow-2xl relative flex flex-col justify-between min-h-[175px] space-y-3">
        
        {/* Top-left: Purple/Lavender LED Dot */}
        <div className="flex items-center justify-between">
          <div
            className="w-2.5 h-2.5 rounded-full bg-[#a78bfa] led-glow-purple"
            title="Purple LED · Focus Engine"
          />
          <span className="text-[10px] text-slate-600 font-mono">
            {metrics.streak}x combo
          </span>
        </div>

        {/* Horizontal Split: Radial Player (Left) + 05:00 Digital Clock & Active Task (Right) */}
        <div className="flex items-center gap-4">
          
          {/* Left: Concentric Radial Focus Player Button */}
          <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
            {/* Outer Glowing Lavender Ring */}
            <svg className="w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 120 120">
              {/* Background track circle */}
              <circle
                cx="60"
                cy="60"
                r="52"
                stroke="rgba(167, 139, 250, 0.15)"
                strokeWidth="5.5"
                fill="transparent"
              />
              {/* Glowing animated stroke */}
              <circle
                cx="60"
                cy="60"
                r="52"
                stroke="#a78bfa"
                strokeWidth="5.5"
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={isTimerRunning ? strokeOffset : 0}
                strokeLinecap="round"
                className="transition-all duration-300"
                style={{
                  filter: 'drop-shadow(0 0 8px rgba(167, 139, 250, 0.8))',
                }}
              />
            </svg>

            {/* Tactile Inset Dark Center Button */}
            <button
              onClick={handleToggleTimer}
              className="absolute w-20 h-20 rounded-full bg-[#131926] border border-[#232d42] hover:border-[#a78bfa]/50 flex items-center justify-center transition transform active:scale-95 shadow-inner cursor-pointer group"
              title={isTimerRunning ? 'Pause timer' : 'Start timer'}
            >
              {isTimerRunning ? (
                <Pause className="w-7 h-7 text-[#a78bfa] fill-current drop-shadow-[0_0_8px_rgba(167,139,250,0.8)]" />
              ) : (
                <Play className="w-7 h-7 text-[#a78bfa] fill-current ml-1 drop-shadow-[0_0_8px_rgba(167,139,250,0.8)]" />
              )}
            </button>
          </div>

          {/* Right: Digital Mono Readout & Task Subtitle */}
          <div className="flex-1 flex flex-col justify-center space-y-1">
            {/* Giant Mono Countdown (Exact font and spacing from image) */}
            <div className="text-4xl font-extrabold text-white font-mono tracking-widest tabular-nums leading-none">
              {formatTime(timerSeconds)}
            </div>

            {/* Active Task Prompt in lowercase mono */}
            <p
              onClick={handleExecuteActive}
              className="text-[11px] font-mono text-slate-300 leading-snug line-clamp-2 hover:text-[#00ff9d] cursor-pointer transition pt-1"
              title="Click to mark complete (+150 XP)"
            >
              {currentTaskLabel.toLowerCase()}
            </p>
          </div>

        </div>

        {/* Bottom Action Row: ✂ (Split smaller), ♪ (Sound), ↺ (Reset preset) */}
        <div className="flex items-center justify-between pt-1 border-t border-[#1a2233]">
          
          {/* Left: Scissors Button (Split task smaller) */}
          <button
            onClick={() => activeStep && onSubdivideStep(activeStep.id)}
            className="w-8 h-8 rounded-full bg-[#161c2a] border border-[#232c3f] hover:border-[#a78bfa]/50 text-slate-400 hover:text-white flex items-center justify-center transition active:scale-90 cursor-pointer"
            title="Split task smaller (30s micro-actions)"
          >
            <Scissors className="w-3.5 h-3.5 text-slate-300" />
          </button>

          {/* Right: Sound ♪ and Reset ↺ buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSoundModalOpen(!soundModalOpen)}
              className="w-8 h-8 rounded-full bg-[#161c2a] border border-[#232c3f] hover:border-[#a78bfa]/50 text-slate-400 hover:text-white flex items-center justify-center transition active:scale-90 cursor-pointer"
              title="Focus audio selector (♪)"
            >
              <Music className="w-3.5 h-3.5 text-slate-300" />
            </button>

            <button
              onClick={handleCycleTimerPreset}
              className="w-8 h-8 rounded-full bg-[#161c2a] border border-[#232c3f] hover:border-[#a78bfa]/50 text-slate-400 hover:text-white flex items-center justify-center transition active:scale-90 cursor-pointer"
              title="Cycle block: 05:00 -> 25:00 -> 50:00 (↺)"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-300" />
            </button>
          </div>

        </div>

        {/* Sound Selection Popover (when ♪ clicked) */}
        {soundModalOpen && (
          <div className="absolute right-4 bottom-14 bg-[#0e1420] border border-[#26324a] rounded-2xl p-3 shadow-2xl z-50 w-56 space-y-2 font-mono text-[11px]">
            <div className="flex items-center justify-between text-slate-400 pb-1 border-b border-slate-800">
              <span className="text-[#a78bfa] font-bold">Audio Engine</span>
              <button onClick={() => setSoundModalOpen(false)} className="text-slate-500 hover:text-white">✕</button>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {(
                [
                  { id: 'brown', label: 'Brown Noise' },
                  { id: 'alpha', label: '432Hz Drone' },
                  { id: 'cyber', label: 'Cyber Pulse' },
                  { id: 'white', label: 'White Noise' },
                ] as const
              ).map((snd) => (
                <button
                  key={snd.id}
                  onClick={() => handleSelectSound(snd.id)}
                  className={`p-1.5 rounded-lg border text-left transition ${
                    activeSound === snd.id
                      ? 'bg-[#182133] border-[#a78bfa] text-white'
                      : 'bg-[#111724] border-[#1e273a] text-slate-400 hover:text-white'
                  }`}
                >
                  {snd.label}
                </button>
              ))}
            </div>
            {/* Volume slider */}
            <div className="pt-1 flex items-center gap-1.5 text-slate-500 text-[10px]">
              <span>VOL</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setVolume(val);
                  audioEngine.setVolume(val);
                }}
                className="w-full accent-[#a78bfa] h-1"
              />
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
