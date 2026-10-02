/**
 * Braindump Task List & Live Transcription Stream (|===|)
 * Lists down tasks categorized by the 2x2 Matrix with transcription logs,
 * atomic step preview, and 1-click promotion to active sprint.
 */

import React from 'react';
import { TriageItem, QuadrantType } from '../types/synapse';
import {
  CheckCircle2,
  Cpu,
  Zap,
  Orbit,
  Trash2,
  ArrowRight,
  Mic,
  Clock,
  Sparkles,
} from 'lucide-react';

interface Props {
  items: TriageItem[];
  selectedQuadrant: QuadrantType | 'ALL';
  isListening: boolean;
  liveTranscription: string;
  onPromoteItem: (item: TriageItem) => void;
  onDeleteItem: (id: string) => void;
  onInspectScout: (item: TriageItem) => void;
}

export const BrainDumpTaskList: React.FC<Props> = ({
  items,
  selectedQuadrant,
  isListening,
  liveTranscription,
  onPromoteItem,
  onDeleteItem,
  onInspectScout,
}) => {
  const filtered =
    selectedQuadrant === 'ALL'
      ? items
      : items.filter((i) => i.classification.quadrant === selectedQuadrant);

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#07090e] border border-[#1e293b] rounded-xl p-3 font-mono text-xs overflow-hidden">
      
      {/* Stream Header */}
      <div className="flex items-center justify-between pb-2 border-b border-[#1e293b] shrink-0 text-[11px]">
        <div className="flex items-center gap-1.5 text-slate-300 font-bold">
          <span>Captured Task Stream</span>
          <span className="text-slate-500">({filtered.length})</span>
        </div>

        {selectedQuadrant !== 'ALL' && (
          <span className="text-[10px] text-[#00f2fe] uppercase">
            Filter: {selectedQuadrant.replace('_', ' ')}
          </span>
        )}
      </div>

      {/* Live Voice Memo Transcribing Indicator */}
      {isListening && (
        <div className="my-2 p-2.5 rounded-lg bg-rose-950/60 border border-rose-500/40 text-rose-300 text-[11px] flex items-start gap-2 shrink-0 animate-pulse">
          <Mic className="w-3.5 h-3.5 mt-0.5 text-rose-400 shrink-0" />
          <div className="flex-1 truncate">
            <span className="font-bold text-rose-400 uppercase text-[10px] block">
              Transcribing Voice Memo...
            </span>
            <span className="text-slate-200 italic">
              {liveTranscription || 'Listening for speech input...'}
            </span>
          </div>
        </div>
      )}

      {/* Scrollable Tasks */}
      <div className="flex-1 overflow-y-auto space-y-2 pt-2 pr-1 min-h-[140px]">
        {filtered.length > 0 ? (
          filtered.map((item) => {
            const isScout = item.classification.quadrant === 'INCUBATOR_SCOUT';
            const isActive = item.classification.quadrant === 'ACTIVE_PIPELINE';
            const isBuffer = item.classification.quadrant === 'MICRO_BUFFER';

            return (
              <div
                key={item.id}
                className="p-2.5 rounded-lg bg-[#0c101a] border border-[#1e293b] hover:border-slate-700 transition space-y-1.5 group"
              >
                {/* Badge Row */}
                <div className="flex items-center justify-between text-[10px]">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`px-1.5 py-0.2 rounded font-bold uppercase text-[9px] ${
                        isActive
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/40'
                          : isScout
                          ? 'bg-purple-950 text-purple-400 border border-purple-800/40'
                          : isBuffer
                          ? 'bg-sky-950 text-sky-400 border border-sky-800/40'
                          : 'bg-slate-900 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {item.classification.quadrant.replace('_', ' ')}
                    </span>

                    {isScout && item.scout_worker && (
                      <span className="text-purple-400 text-[9px]">
                        {item.scout_worker.progress}% Scaffolded
                      </span>
                    )}
                  </div>

                  <span className="text-slate-500 text-[9px]">
                    {new Date(item.created_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                {/* Prompt Text */}
                <p className="text-slate-200 text-xs font-semibold leading-snug line-clamp-2">
                  {item.raw_input}
                </p>

                {/* Rationale & Action Buttons */}
                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-900">
                  <span className="truncate max-w-[200px] text-slate-500 text-[9px]">
                    {item.classification.rationale}
                  </span>

                  <div className="flex items-center gap-1 shrink-0">
                    {isScout && item.scout_worker && (
                      <button
                        onClick={() => onInspectScout(item)}
                        className="text-purple-400 hover:text-purple-300 px-1.5 py-0.5 rounded bg-purple-950/60 border border-purple-800/40 text-[9px] cursor-pointer"
                        title="Inspect generated code & handoff"
                      >
                        Inspect
                      </button>
                    )}

                    {!isActive && (
                      <button
                        onClick={() => onPromoteItem(item)}
                        className="text-emerald-400 hover:text-emerald-300 px-1.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/40 text-[9px] cursor-pointer flex items-center gap-0.5"
                        title="Promote directly to active sprint"
                      >
                        <span>Promote</span>
                        <ArrowRight className="w-2.5 h-2.5" />
                      </button>
                    )}

                    <button
                      onClick={() => onDeleteItem(item.id)}
                      className="text-slate-600 hover:text-rose-400 p-0.5 transition"
                      title="Delete"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-8 text-slate-500 text-[11px]">
            No thoughts in this quadrant yet.
            <div className="text-slate-600 text-[10px] mt-1">
              Dump a thought in the box below to auto-classify!
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
