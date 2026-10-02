/**
 * BrainDumpMatrixPage
 * Dedicated full-page Focus Matrix opened by clicking '+' on the widget:
 * - Current Goal / North Star input (sets benchmark for relevance)
 * - X-Axis: DIVERGENT vs RELEVANT
 * - Y-Axis: STRONG vs WEAK
 * - 4 interactive quadrants:
 *     Top-Right: RELEVANT + STRONG (Active Pipeline ⚡)
 *     Top-Left:  DIVERGENT + STRONG (Scout Incubator Ψ - Never Cull)
 *     Bottom-Right: RELEVANT + WEAK (Micro Buffer)
 *     Bottom-Left:  DIVERGENT + WEAK (Parking Orbit ℧)
 */

import React, { useState, useRef } from 'react';
import {
  TriageItem,
  UserCognitiveProfile,
  QuadrantType,
} from '../types/synapse';
import { TriageEngine } from '../services/triageEngine';
import { triggerKineticBlast } from './KineticCanvasOverlay';
import {
  ArrowLeft,
  Compass,
  Sparkles,
  Mic,
  MicOff,
  Send,
  Plus,
  Trash2,
  ArrowRight,
  Cpu,
  CheckCircle2,
  Zap,
  Orbit,
  ExternalLink,
  ChevronRight,
  Move,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  profile: UserCognitiveProfile;
  triageItems: TriageItem[];
  onClose: () => void;
  onUpdateGoal: (newGoal: string) => void;
  onItemTriaged: (item: TriageItem) => void;
  onDeleteItem: (id: string) => void;
  onPromoteItem: (item: TriageItem) => void;
  onInspectScout: (item: TriageItem) => void;
  onMoveItem: (itemId: string, targetQuadrant: QuadrantType) => void;
}

export const BrainDumpMatrixPage: React.FC<Props> = ({
  isOpen,
  profile,
  triageItems,
  onClose,
  onUpdateGoal,
  onItemTriaged,
  onDeleteItem,
  onPromoteItem,
  onInspectScout,
  onMoveItem,
}) => {
  const [currentGoal, setCurrentGoal] = useState<string>(profile.active_north_star);
  const [isEditingGoal, setIsEditingGoal] = useState<boolean>(false);
  const [inputVal, setInputVal] = useState<string>('');
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [quickAddQuadrant, setQuickAddQuadrant] = useState<QuadrantType | null>(null);
  const [quickAddText, setQuickAddText] = useState<string>('');
  const recognitionRef = useRef<any>(null);

  if (!isOpen) return null;

  // Filter items into 4 quadrants
  const activeItems = triageItems.filter((i) => i.classification.quadrant === 'ACTIVE_PIPELINE');
  const scoutItems = triageItems.filter((i) => i.classification.quadrant === 'INCUBATOR_SCOUT');
  const bufferItems = triageItems.filter((i) => i.classification.quadrant === 'MICRO_BUFFER');
  const parkingItems = triageItems.filter((i) => i.classification.quadrant === 'PARKING_ORBIT');

  // Handle Goal Update
  const handleSaveGoal = () => {
    if (currentGoal.trim()) {
      onUpdateGoal(currentGoal.trim());
      setIsEditingGoal(false);
      triggerKineticBlast({ message: 'ANCHOR GOAL RECALIBRATED!' });
    }
  };

  // Voice recording toggle
  const handleToggleVoice = () => {
    if (isListening) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      alert('Speech-to-text not supported in this browser. Please type.');
      return;
    }

    try {
      const rec = new SpeechRec();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-US';

      rec.onstart = () => setIsListening(true);
      rec.onresult = (e: any) => {
        const transcript = Array.from(e.results)
          .map((res: any) => res[0].transcript)
          .join('');
        setInputVal(transcript);
      };
      rec.onerror = () => setIsListening(false);
      rec.onend = () => setIsListening(false);

      recognitionRef.current = rec;
      rec.start();
    } catch {
      setIsListening(false);
    }
  };

  // Main Brain Dump Submission (auto-routes into 2x2 matrix)
  const handleDumpSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const raw = inputVal.trim();
    if (!raw) return;

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    setIsAnalyzing(true);
    try {
      const result = await TriageEngine.triageInput(raw, {
        ...profile,
        active_north_star: currentGoal,
      });
      const item = TriageEngine.createTriageItem(raw, result);
      onItemTriaged(item);
      setInputVal('');

      const color =
        result.quadrant === 'ACTIVE_PIPELINE'
          ? '#34d399'
          : result.quadrant === 'INCUBATOR_SCOUT'
          ? '#a78bfa'
          : '#38bdf8';

      triggerKineticBlast({
        message: `PLOTTED TO: ${result.quadrant.replace('_', ' ')}`,
        color,
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Direct Add into specific quadrant
  const handleDirectAdd = (quadrant: QuadrantType) => {
    const text = quickAddText.trim();
    if (!text) return;

    let rationale = '';
    let relevance: 'ALIGNED' | 'TANGENT' = 'ALIGNED';
    let viability: 'STRONG' | 'WEAK' = 'STRONG';

    if (quadrant === 'ACTIVE_PIPELINE') {
      rationale = 'Manually plotted: Direct priority for active goal.';
      relevance = 'ALIGNED';
      viability = 'STRONG';
    } else if (quadrant === 'INCUBATOR_SCOUT') {
      rationale = 'Manually plotted: High leverage tangent, background scaffold.';
      relevance = 'TANGENT';
      viability = 'STRONG';
    } else if (quadrant === 'MICRO_BUFFER') {
      rationale = 'Manually plotted: Quick micro-action (<2 mins).';
      relevance = 'ALIGNED';
      viability = 'WEAK';
    } else {
      rationale = 'Manually plotted: Tangent saved in parking orbit.';
      relevance = 'TANGENT';
      viability = 'WEAK';
    }

    const item = TriageEngine.createTriageItem(text, {
      quadrant,
      goal_relevance: relevance,
      viability,
      rationale,
      confidence: 1.0,
      project_slug: text.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 24),
      scout_files: [`src/${text.slice(0, 12)}/mod.rs`],
      scout_deps: ['tokio'],
      atomic_tasks: [
        {
          prompt: text,
          hint: '⚡ Direct sprint step.',
          estimated_seconds: 60,
        },
      ],
    });

    onItemTriaged(item);
    setQuickAddText('');
    setQuickAddQuadrant(null);
    triggerKineticBlast({ message: `ADDED TO ${quadrant.replace('_', ' ')}` });
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#070a10]/95 backdrop-blur-xl flex flex-col font-mono text-xs text-slate-200 select-none overflow-y-auto animate-fadeIn">
      
      {/* Top Header Bar */}
      <header className="h-14 bg-[#0c101a] border-b border-[#1e273a] px-4 sm:px-8 flex items-center justify-between shrink-0 sticky top-0 z-20">
        
        {/* Back to Widget Button */}
        <button
          onClick={onClose}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#131926] border border-[#232d42] hover:border-[#22d3ee]/50 text-slate-300 hover:text-[#22d3ee] transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="font-bold text-xs tracking-wider">RETURN TO WIDGET</span>
        </button>

        {/* Title */}
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#22d3ee] led-glow-cyan" />
          <span className="font-bold text-sm text-white tracking-widest uppercase">
            Focus Matrix // Brain Dump Mode
          </span>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3 text-slate-400 text-[11px]">
          <span className="text-emerald-400 font-bold">{activeItems.length} Active</span>
          <span>·</span>
          <span className="text-purple-400 font-bold">{scoutItems.length} Scouted</span>
          <span>·</span>
          <span className="text-slate-500">{triageItems.length} Total</span>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="max-w-6xl w-full mx-auto p-4 sm:p-6 flex-1 flex flex-col space-y-5">
        
        {/* ========================================================
            1. USER'S CURRENT GOAL / NORTH STAR ANCHOR
            Sets the benchmark for RELEVANT vs DIVERGENT
            ======================================================== */}
        <div className="bg-[#111726] border border-[#1e273a] rounded-2xl p-4 sm:p-5 shadow-2xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2 text-[11px] text-[#ffaa00] font-bold uppercase tracking-wider">
                <Compass className="w-4 h-4" />
                <span>Current Goal Benchmark (Relevance Anchor)</span>
              </div>

              {isEditingGoal ? (
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={currentGoal}
                    onChange={(e) => setCurrentGoal(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveGoal()}
                    className="flex-1 bg-[#090d16] border border-[#22d3ee] rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none font-mono"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveGoal}
                    className="px-4 py-2 bg-[#22d3ee] text-black font-bold rounded-xl text-xs hover:bg-cyan-300 transition"
                  >
                    Save Goal
                  </button>
                  <button
                    onClick={() => {
                      setCurrentGoal(profile.active_north_star);
                      setIsEditingGoal(false);
                    }}
                    className="px-3 py-2 bg-[#1a2233] text-slate-400 rounded-xl text-xs hover:text-white"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3 pt-0.5">
                  <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                    {currentGoal}
                  </h2>
                  <button
                    onClick={() => setIsEditingGoal(true)}
                    className="text-[11px] text-[#22d3ee] hover:underline"
                  >
                    [Edit Benchmark]
                  </button>
                </div>
              )}

              <p className="text-[11px] text-slate-400">
                All brain dumped thoughts are plotted along <strong className="text-white">Conviction (Strong vs Weak)</strong> and <strong className="text-white">Goal Alignment (Relevant vs Divergent)</strong> relative to this anchor.
              </p>
            </div>

            {/* Quick Summary Pill */}
            <div className="bg-[#090d16] border border-[#1e273a] px-3.5 py-2 rounded-xl text-[11px] text-slate-400 shrink-0">
              <span className="text-[#a78bfa] font-bold">Zero Idea Loss:</span> Tangents auto-incubate
            </div>

          </div>
        </div>

        {/* ========================================================
            2. UNFILTERED BRAIN DUMP INPUT BAR
            Type or speak thoughts; instantly triaged onto matrix
            ======================================================== */}
        <div className="bg-[#111726] border border-[#1e273a] rounded-2xl p-4 shadow-xl">
          <form onSubmit={handleDumpSubmit} className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <input
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="Dump any thought, technical idea, or urge... (e.g. 'Build offline search daemon' or 'Fix auth token refresh')"
                className="w-full bg-[#090d16] border border-[#1e273a] focus:border-[#22d3ee] rounded-xl pl-4 pr-12 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition font-mono"
              />

              <button
                type="button"
                onClick={handleToggleVoice}
                className={`absolute right-2.5 top-2.5 p-1.5 rounded-lg text-xs transition ${
                  isListening
                    ? 'bg-rose-950 text-rose-400 border border-rose-600 animate-pulse'
                    : 'text-slate-500 hover:text-slate-200 hover:bg-[#141b2d]'
                }`}
                title="Dictate voice memo"
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
            </div>

            <button
              type="submit"
              disabled={isAnalyzing || !inputVal.trim()}
              className="bg-[#22d3ee] hover:bg-cyan-300 disabled:opacity-40 text-black font-bold font-mono text-xs uppercase px-6 py-3 rounded-xl transition shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 cursor-pointer active:scale-95 shrink-0"
            >
              {isAnalyzing ? (
                <span className="w-4 h-4 rounded-full border-2 border-black border-t-transparent animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Dump & Route</span>
                </>
              )}
            </button>
          </form>

          {isListening && (
            <div className="mt-2 text-rose-400 text-[11px] animate-pulse flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span>Listening to speech in real-time. Speak your thought, then click Dump...</span>
            </div>
          )}
        </div>

        {/* ========================================================
            3. THE 2X2 FOCUS MATRIX (COORDINATE GRID)
            X-Axis: DIVERGENT (Left) vs RELEVANT (Right)
            Y-Axis: STRONG CONVICTION (Top) vs WEAK CONVICTION (Bottom)
            ======================================================== */}
        <div className="flex-1 flex flex-col space-y-2">
          
          {/* Top Axis Label (X-Axis: Goal Relevance) */}
          <div className="grid grid-cols-2 px-3 text-[11px] font-bold tracking-wider uppercase">
            <div className="text-purple-400 flex items-center gap-1.5">
              <span>◀ DIVERGENT (OFF-ROADMAP TANGENT)</span>
            </div>
            <div className="text-emerald-400 flex items-center justify-end gap-1.5">
              <span>RELEVANT (GOAL ALIGNED) ▶</span>
            </div>
          </div>

          {/* 2x2 Matrix Container */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
            
            {/* QUADRANT 1 (TOP-LEFT): DIVERGENT + STRONG ➔ SCOUT INCUBATOR */}
            <div className="bg-[#111726]/90 border border-[#a78bfa]/50 rounded-2xl p-4 flex flex-col justify-between shadow-2xl relative group hover:border-[#a78bfa] transition min-h-[220px]">
              
              {/* Header */}
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-[#21293d]">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#a78bfa] led-glow-purple" />
                    <span className="text-xs font-bold text-[#a78bfa] tracking-wider uppercase">
                      Scout Incubator
                    </span>
                    <span className="text-[10px] text-slate-500">Ψ ℧</span>
                  </div>

                  <span className="px-2 py-0.5 rounded bg-purple-950/80 border border-purple-800/40 text-purple-300 font-bold text-[10px]">
                    {scoutItems.length} Tangents
                  </span>
                </div>

                <div className="text-[10px] text-slate-400 pt-1.5 pb-2">
                  <strong className="text-purple-300">Divergent × Strong:</strong> Autonomous Scout builds code skeletons & dependency manifests in background so no spark is lost.
                </div>

                {/* Items List */}
                <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                  {scoutItems.map((item) => (
                    <div
                      key={item.id}
                      className="p-2.5 rounded-xl bg-[#090d16] border border-[#a78bfa]/30 hover:border-[#a78bfa] transition space-y-1.5 group/item"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-white font-medium text-xs leading-snug">
                          {item.raw_input.toLowerCase()}
                        </span>
                        {item.scout_worker && (
                          <span className="text-[9px] text-[#a78bfa] bg-purple-950 px-1.5 py-0.5 rounded shrink-0">
                            {item.scout_worker.progress}% Scaffolded
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-900">
                        <button
                          onClick={() => onInspectScout(item)}
                          className="text-[#a78bfa] hover:text-purple-300 hover:underline cursor-pointer"
                        >
                          Inspect Skeleton ➔
                        </button>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => onPromoteItem(item)}
                            className="text-[#00ff9d] hover:underline cursor-pointer flex items-center gap-0.5"
                            title="Promote to Active Sprint"
                          >
                            <span>Promote ⚡</span>
                          </button>
                          <button
                            onClick={() => onDeleteItem(item.id)}
                            className="text-slate-600 hover:text-rose-400"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {scoutItems.length === 0 && (
                    <div className="py-6 text-center text-slate-600 text-[11px]">
                      No active tangents incubating.
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Add into Quadrant */}
              <div className="pt-2 border-t border-[#1e273a] mt-2">
                {quickAddQuadrant === 'INCUBATOR_SCOUT' ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={quickAddText}
                      onChange={(e) => setQuickAddText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleDirectAdd('INCUBATOR_SCOUT')}
                      placeholder="Add strong tangent..."
                      className="flex-1 bg-[#090d16] border border-purple-500 rounded-lg px-2 py-1 text-[11px] text-white focus:outline-none"
                      autoFocus
                    />
                    <button
                      onClick={() => handleDirectAdd('INCUBATOR_SCOUT')}
                      className="px-2 py-1 bg-purple-600 text-white rounded-lg text-[10px]"
                    >
                      Add
                    </button>
                    <button
                      onClick={() => setQuickAddQuadrant(null)}
                      className="text-slate-500 text-[10px]"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setQuickAddQuadrant('INCUBATOR_SCOUT');
                      setQuickAddText('');
                    }}
                    className="w-full py-1 text-slate-500 hover:text-[#a78bfa] border border-dashed border-[#232d42] rounded-lg text-[10px] flex items-center justify-center gap-1 transition"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Tangent to Scout</span>
                  </button>
                )}
              </div>
            </div>

            {/* QUADRANT 2 (TOP-RIGHT): RELEVANT + STRONG ➔ ACTIVE PIPELINE */}
            <div className="bg-[#111726]/90 border border-[#34d399]/50 rounded-2xl p-4 flex flex-col justify-between shadow-2xl relative group hover:border-[#34d399] transition min-h-[220px]">
              
              {/* Header */}
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-[#21293d]">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#34d399] led-glow-mint" />
                    <span className="text-xs font-bold text-[#34d399] tracking-wider uppercase">
                      Active Pipeline
                    </span>
                    <span className="text-[#f59e0b]">⚡</span>
                  </div>

                  <span className="px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-800/40 text-emerald-300 font-bold text-[10px]">
                    {activeItems.length} Actions
                  </span>
                </div>

                <div className="text-[10px] text-slate-400 pt-1.5 pb-2">
                  <strong className="text-emerald-300">Relevant × Strong:</strong> Primary sprint priorities directly advancing current North Star goal.
                </div>

                {/* Items List */}
                <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                  {activeItems.map((item) => (
                    <div
                      key={item.id}
                      className="p-2.5 rounded-xl bg-[#090d16] border border-[#34d399]/30 hover:border-[#34d399] transition space-y-1.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-white font-medium text-xs leading-snug">
                          {item.raw_input.toLowerCase()}
                        </span>
                        <span className="text-[#f59e0b] drop-shadow-[0_0_6px_rgba(245,158,11,0.8)]">
                          ⚡
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-900">
                        <span className="text-slate-500 text-[9px] truncate max-w-[180px]">
                          {item.classification.rationale}
                        </span>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onMoveItem(item.id, 'INCUBATOR_SCOUT')}
                            className="text-purple-400 hover:underline text-[9px]"
                            title="Shift to Scout Tangent"
                          >
                            Move to Scout
                          </button>
                          <button
                            onClick={() => onDeleteItem(item.id)}
                            className="text-slate-600 hover:text-rose-400"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {activeItems.length === 0 && (
                    <div className="py-6 text-center text-slate-600 text-[11px]">
                      No active pipeline tasks. Dump an aligned idea above!
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Add into Quadrant */}
              <div className="pt-2 border-t border-[#1e293a] mt-2">
                {quickAddQuadrant === 'ACTIVE_PIPELINE' ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={quickAddText}
                      onChange={(e) => setQuickAddText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleDirectAdd('ACTIVE_PIPELINE')}
                      placeholder="Add active sprint task..."
                      className="flex-1 bg-[#090d16] border border-emerald-500 rounded-lg px-2 py-1 text-[11px] text-white focus:outline-none"
                      autoFocus
                    />
                    <button
                      onClick={() => handleDirectAdd('ACTIVE_PIPELINE')}
                      className="px-2 py-1 bg-emerald-500 text-black font-bold rounded-lg text-[10px]"
                    >
                      Add
                    </button>
                    <button
                      onClick={() => setQuickAddQuadrant(null)}
                      className="text-slate-500 text-[10px]"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setQuickAddQuadrant('ACTIVE_PIPELINE');
                      setQuickAddText('');
                    }}
                    className="w-full py-1 text-slate-500 hover:text-[#34d399] border border-dashed border-[#232d42] rounded-lg text-[10px] flex items-center justify-center gap-1 transition"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Task to Active Pipeline</span>
                  </button>
                )}
              </div>
            </div>

            {/* QUADRANT 3 (BOTTOM-LEFT): DIVERGENT + WEAK ➔ PARKING ORBIT */}
            <div className="bg-[#111726]/90 border border-slate-700/60 rounded-2xl p-4 flex flex-col justify-between shadow-xl min-h-[200px]">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-[#21293d]">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
                    <span className="text-xs font-bold text-slate-300 tracking-wider uppercase">
                      Parking Orbit
                    </span>
                    <span className="text-slate-500">℧</span>
                  </div>

                  <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-400 font-bold text-[10px]">
                    {parkingItems.length} Parked
                  </span>
                </div>

                <div className="text-[10px] text-slate-400 pt-1.5 pb-2">
                  <strong className="text-slate-300">Divergent × Weak:</strong> Peripheral thoughts preserved in cold storage with zero guilt.
                </div>

                <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                  {parkingItems.map((item) => (
                    <div
                      key={item.id}
                      className="p-2.5 rounded-xl bg-[#090d16] border border-slate-800 flex items-center justify-between text-[11px]"
                    >
                      <span className="text-slate-300 truncate max-w-[200px]">
                        {item.raw_input.toLowerCase()}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => onMoveItem(item.id, 'INCUBATOR_SCOUT')}
                          className="text-[#a78bfa] text-[9px] hover:underline"
                        >
                          Scout
                        </button>
                        <button
                          onClick={() => onDeleteItem(item.id)}
                          className="text-slate-600 hover:text-rose-400"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {parkingItems.length === 0 && (
                    <div className="py-4 text-center text-slate-600 text-[10px]">
                      Orbit empty.
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-[#1e273a] mt-2">
                {quickAddQuadrant === 'PARKING_ORBIT' ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={quickAddText}
                      onChange={(e) => setQuickAddText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleDirectAdd('PARKING_ORBIT')}
                      placeholder="Park thought in orbit..."
                      className="flex-1 bg-[#090d16] border border-slate-600 rounded-lg px-2 py-1 text-[11px] text-white focus:outline-none"
                      autoFocus
                    />
                    <button
                      onClick={() => handleDirectAdd('PARKING_ORBIT')}
                      className="px-2 py-1 bg-slate-700 text-white rounded-lg text-[10px]"
                    >
                      Add
                    </button>
                    <button
                      onClick={() => setQuickAddQuadrant(null)}
                      className="text-slate-500 text-[10px]"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setQuickAddQuadrant('PARKING_ORBIT');
                      setQuickAddText('');
                    }}
                    className="w-full py-1 text-slate-500 hover:text-slate-300 border border-dashed border-[#232d42] rounded-lg text-[10px] flex items-center justify-center gap-1 transition"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Park Idea in Orbit</span>
                  </button>
                )}
              </div>
            </div>

            {/* QUADRANT 4 (BOTTOM-RIGHT): RELEVANT + WEAK ➔ MICRO BUFFER */}
            <div className="bg-[#111726]/90 border border-sky-500/50 rounded-2xl p-4 flex flex-col justify-between shadow-xl min-h-[200px]">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-[#21293d]">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
                    <span className="text-xs font-bold text-sky-400 tracking-wider uppercase">
                      Micro-Action Buffer
                    </span>
                    <span className="text-sky-400">⚡</span>
                  </div>

                  <span className="px-2 py-0.5 rounded bg-sky-950/80 border border-sky-800/40 text-sky-300 font-bold text-[10px]">
                    {bufferItems.length} Micro
                  </span>
                </div>

                <div className="text-[10px] text-slate-400 pt-1.5 pb-2">
                  <strong className="text-sky-300">Relevant × Weak:</strong> Low-friction quick cleanups under 2 minutes.
                </div>

                <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                  {bufferItems.map((item) => (
                    <div
                      key={item.id}
                      className="p-2.5 rounded-xl bg-[#090d16] border border-sky-900/40 flex items-center justify-between text-[11px]"
                    >
                      <span className="text-slate-300 truncate max-w-[200px]">
                        {item.raw_input.toLowerCase()}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => onPromoteItem(item)}
                          className="text-emerald-400 text-[9px] hover:underline"
                        >
                          Sprint ➔
                        </button>
                        <button
                          onClick={() => onDeleteItem(item.id)}
                          className="text-slate-600 hover:text-rose-400"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {bufferItems.length === 0 && (
                    <div className="py-4 text-center text-slate-600 text-[10px]">
                      Buffer empty.
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-[#1e273a] mt-2">
                {quickAddQuadrant === 'MICRO_BUFFER' ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={quickAddText}
                      onChange={(e) => setQuickAddText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleDirectAdd('MICRO_BUFFER')}
                      placeholder="Add micro-action (<2 mins)..."
                      className="flex-1 bg-[#090d16] border border-sky-500 rounded-lg px-2 py-1 text-[11px] text-white focus:outline-none"
                      autoFocus
                    />
                    <button
                      onClick={() => handleDirectAdd('MICRO_BUFFER')}
                      className="px-2 py-1 bg-sky-500 text-black font-bold rounded-lg text-[10px]"
                    >
                      Add
                    </button>
                    <button
                      onClick={() => setQuickAddQuadrant(null)}
                      className="text-slate-500 text-[10px]"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setQuickAddQuadrant('MICRO_BUFFER');
                      setQuickAddText('');
                    }}
                    className="w-full py-1 text-slate-500 hover:text-sky-400 border border-dashed border-[#232d42] rounded-lg text-[10px] flex items-center justify-center gap-1 transition"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add to Micro Buffer</span>
                  </button>
                )}
              </div>
            </div>

          </div>

          {/* Bottom Axis Indicator (Y-Axis: Conviction / Viability) */}
          <div className="flex items-center justify-between px-3 text-[10px] text-slate-500 pt-1">
            <span>▲ STRONG CONVICTION / STRUCTURAL LEVERAGE</span>
            <span>▼ WEAK CONVICTION / PERIPHERAL</span>
          </div>

        </div>

      </div>

    </div>
  );
};
