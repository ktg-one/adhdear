/**
 * Low-Friction Ingestion & 2x2 Triage Input Bar
 * Unfiltered brain dump input with Web Speech API voice capture,
 * autonomous 2x2 matrix classification, and zero-loss offloading.
 */

import React, { useState, useRef } from 'react';
import { UserCognitiveProfile, TriageItem } from '../types/synapse';
import { TriageEngine } from '../services/triageEngine';
import { triggerKineticBlast } from './KineticCanvasOverlay';
import { Mic, MicOff, Send, Sparkles, Compass } from 'lucide-react';

interface Props {
  profile: UserCognitiveProfile;
  onItemTriaged: (item: TriageItem) => void;
  onEditGoal: () => void;
}

export const IngestionBar: React.FC<Props> = ({
  profile,
  onItemTriaged,
  onEditGoal,
}) => {
  const [inputVal, setInputVal] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const recognitionRef = useRef<any>(null);

  // Toggle voice dictation using browser Web Speech API
  const handleToggleVoice = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please type your thought.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((res: any) => res[0].transcript)
          .join('');
        setInputVal(transcript);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  const handleSubmit = async (textToSubmit?: string) => {
    const raw = (textToSubmit || inputVal).trim();
    if (!raw) return;

    setIsAnalyzing(true);

    try {
      const result = await TriageEngine.triageInput(raw, profile);
      const item = TriageEngine.createTriageItem(raw, result);

      onItemTriaged(item);
      setInputVal('');

      let message = 'OFFLOADED!';
      let color = '#00f2fe';

      if (result.quadrant === 'ACTIVE_PIPELINE') {
        message = 'ALIGNED ➔ ACTIVE PIPELINE (+50 XP)';
        color = '#10b981';
      } else if (result.quadrant === 'INCUBATOR_SCOUT') {
        message = 'TANGENT ➔ SCOUT INCUBATOR (ZERO LOSS!)';
        color = '#9d4edd';
      } else if (result.quadrant === 'MICRO_BUFFER') {
        message = 'BUFFERED ➔ MICRO-ACTION';
        color = '#38bdf8';
      } else {
        message = 'PARKED IN ORBIT (NO GUILT)';
        color = '#94a3b8';
      }

      triggerKineticBlast({ message, color });
    } catch {
      // Fallback
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="bg-gradient-to-r from-[#0c101a] via-[#141b2d] to-[#0c101a] border border-[#1e293b] rounded-2xl p-5 shadow-2xl relative overflow-hidden">
      
      {/* Background ambient blur */}
      <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-[#00f2fe]/5 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header & North Star Anchor */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-[#00f2fe] font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            Unfiltered Capture Bar
          </span>
          <span className="text-slate-600 hidden sm:inline">|</span>
          <span className="text-slate-400 hidden sm:inline text-[11px]">
            Zero loss. Offload intrusive thoughts instantly.
          </span>
        </div>

        {/* Current Anchor Benchmark */}
        <div className="flex items-center gap-1.5 text-xs font-mono bg-[#07090e] border border-[#1e293b] px-3 py-1 rounded-xl">
          <Compass className="w-3.5 h-3.5 text-[#ffaa00]" />
          <span className="text-slate-400">Anchor:</span>
          <span
            onClick={onEditGoal}
            className="text-slate-200 font-semibold cursor-pointer hover:text-[#00f2fe] hover:underline underline-offset-2 transition truncate max-w-[200px] sm:max-w-none"
            title="Click to recalibrate 2x2 matrix bias"
          >
            {profile.active_north_star}
          </span>
        </div>
      </div>

      {/* Main Input Control Bar */}
      <div className="flex flex-col gap-2">
        <div className="relative">
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Dump any thought, architecture idea, or sudden urge..."
            className="w-full bg-[#07090e] border border-[#1e293b] focus:border-[#00f2fe] rounded-xl pl-3.5 pr-20 py-3 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-[#00f2fe] transition font-mono"
          />

          <div className="absolute right-1.5 top-1.5 flex items-center gap-1">
            <button
              onClick={handleToggleVoice}
              className={`p-1.5 rounded-lg text-xs font-mono transition ${
                isListening
                  ? 'bg-rose-950 text-rose-400 border border-rose-600 animate-pulse'
                  : 'text-slate-500 hover:text-slate-200 hover:bg-[#141b2d]'
              }`}
              title="Dictate voice memo"
            >
              {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => handleSubmit()}
              disabled={isAnalyzing || !inputVal.trim()}
              className="bg-[#00f2fe] hover:bg-cyan-400 disabled:opacity-40 text-black font-mono font-bold text-xs p-1.5 rounded-lg transition shadow-md shadow-cyan-500/20 flex items-center justify-center cursor-pointer active:scale-95"
              title="Dump & Scout"
            >
              {isAnalyzing ? (
                <span className="w-3.5 h-3.5 rounded-full border-2 border-black border-t-transparent animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* Quick routing indicator */}
        <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
          <span>Zero loss · 2x2 Auto-Router</span>
          <span className="text-purple-400">Never Cull Tangents</span>
        </div>
      </div>

      {/* Autonomous Matrix Routing Guidance */}
      <div className="flex flex-wrap items-center gap-2 pt-3 text-[11px] font-mono text-slate-500">
        <span>2x2 Autonomous Routing:</span>
        <span className="text-emerald-400">Aligned + Strong ➔ Active Pipeline</span>
        <span className="text-slate-600">·</span>
        <span className="text-purple-400">Tangent + Strong ➔ Incubator Scout</span>
        <span className="text-slate-600">·</span>
        <span className="text-sky-400">Aligned + Weak ➔ Micro Buffer</span>
        <span className="text-slate-600">·</span>
        <span className="text-slate-400">Tangent + Weak ➔ Parking Orbit</span>
      </div>

      {/* Quick Ingestion Chips */}
      <div className="flex flex-wrap items-center gap-2 pt-2 text-[10px] font-mono">
        <span className="text-slate-600">Test Prompts:</span>
        <button
          onClick={() => handleSubmit("We should rebuild the vector indexing using SQLite vss instead of LanceDB")}
          className="px-2 py-0.5 rounded bg-[#07090e] border border-[#1e293b] text-slate-400 hover:text-[#00f2fe] hover:border-[#00f2fe]/40 transition"
        >
          Tangent: "Rebuild indexing with SQLite vss"
        </button>
        <button
          onClick={() => handleSubmit("Fix button animation glitch and adjust timer countdown")}
          className="px-2 py-0.5 rounded bg-[#07090e] border border-[#1e293b] text-slate-400 hover:text-emerald-400 hover:border-emerald-500/40 transition"
        >
          Aligned: "Fix button animation & timer"
        </button>
      </div>

    </div>
  );
};
