/**
 * Mini Floating Desktop Widget Mode
 * Compact always-on-top overlay simulation for ADHD desktop flow.
 * Provides minimal screen footprint with zero cognitive distraction.
 */

import React, { useState } from 'react';
import { AtomicStep, AudioTrackType } from '../types/synapse';
import { audioEngine } from '../services/audioEngine';
import { triggerKineticBlast } from './KineticCanvasOverlay';
import {
  Check,
  Maximize2,
  Volume2,
  VolumeX,
  Sparkles,
  Flame,
  Award,
  Plus,
} from 'lucide-react';

interface Props {
  activeStep: AtomicStep | null;
  xp: number;
  streak: number;
  audioTrack: AudioTrackType;
  onCompleteStep: (stepId: string) => void;
  onExpandToFullHud: () => void;
  onQuickDump: (thought: string) => void;
}

export const MiniWidgetOverlay: React.FC<Props> = ({
  activeStep,
  xp,
  streak,
  audioTrack,
  onCompleteStep,
  onExpandToFullHud,
  onQuickDump,
}) => {
  const [quickText, setQuickText] = useState<string>('');
  const [showInput, setShowInput] = useState<boolean>(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState<boolean>(false);

  const handleExecute = (e: React.MouseEvent) => {
    if (!activeStep) return;
    const rect = e.currentTarget.getBoundingClientRect();
    triggerKineticBlast({
      x: rect.left + rect.width / 2,
      y: rect.top,
      message: 'EXECUTE! +150 XP',
      color: '#00f2fe',
    });
    audioEngine.playCelebrationChime();
    onCompleteStep(activeStep.id);
  };

  const handleToggleAudio = () => {
    const state = audioEngine.toggle(audioTrack);
    setIsAudioPlaying(state);
  };

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickText.trim()) {
      onQuickDump(quickText.trim());
      setQuickText('');
      setShowInput(false);
      triggerKineticBlast({ message: 'TANGENT PRESERVED!' });
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-bounce-short">
      <div className="bg-[#0c101a]/95 border border-[#00f2fe]/40 rounded-2xl p-4 shadow-2xl backdrop-blur-xl w-80 sm:w-96 text-xs font-mono space-y-3 glow-cyan">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between text-slate-400 pb-2 border-b border-[#1e293b]">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#00f2fe] animate-ping" />
            <span className="text-[11px] font-bold text-white uppercase tracking-wider">
              SYNAPSE // MINI HUD
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-[#ff007f] font-bold text-[10px]">
              <Flame className="w-3 h-3" />
              <span>{streak}x</span>
            </div>

            <button
              onClick={handleToggleAudio}
              className="text-slate-400 hover:text-white p-1"
              title="Toggle focus audio"
            >
              {isAudioPlaying ? (
                <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <VolumeX className="w-3.5 h-3.5" />
              )}
            </button>

            <button
              onClick={onExpandToFullHud}
              className="text-slate-400 hover:text-[#00f2fe] p-1"
              title="Expand to Full Workspace"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Active Atomic Micro-Step */}
        {activeStep ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[10px] text-slate-500">
              <span className="truncate max-w-[170px] text-[#00f2fe]">
                {activeStep.project_title}
              </span>
              <span>
                Step {activeStep.step_number}/{activeStep.total_steps}
              </span>
            </div>

            <p className="text-white font-semibold text-xs leading-snug line-clamp-2">
              {activeStep.prompt}
            </p>

            <button
              onClick={handleExecute}
              className="w-full bg-[#00f2fe] hover:bg-cyan-400 text-black font-bold py-2 rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-md shadow-cyan-500/20 active:scale-95"
            >
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              <span>EXECUTE & BLAST (+150 XP)</span>
            </button>
          </div>
        ) : (
          <div className="text-center py-2 text-slate-400">
            Sprint cleared! Dump a thought below.
          </div>
        )}

        {/* Quick Capture Drawer */}
        {showInput ? (
          <form onSubmit={handleQuickSubmit} className="flex gap-1.5 pt-1">
            <input
              type="text"
              value={quickText}
              onChange={(e) => setQuickText(e.target.value)}
              placeholder="Dump sudden tangent..."
              className="flex-1 bg-[#07090e] border border-[#1e293b] rounded-lg px-2.5 py-1 text-[11px] text-white focus:outline-none focus:border-[#00f2fe]"
              autoFocus
            />
            <button
              type="submit"
              className="px-2.5 py-1 bg-[#141b2d] border border-[#1e293b] text-[#00f2fe] rounded-lg text-[11px]"
            >
              Add
            </button>
          </form>
        ) : (
          <button
            onClick={() => setShowInput(true)}
            className="w-full text-slate-500 hover:text-slate-300 py-1 border border-dashed border-[#1e293b] rounded-lg flex items-center justify-center gap-1 text-[11px] transition"
          >
            <Plus className="w-3 h-3" />
            <span>Offload Sudden Tangent</span>
          </button>
        )}

      </div>
    </div>
  );
};
