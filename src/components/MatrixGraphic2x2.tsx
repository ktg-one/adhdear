/**
 * 2x2 Visual Matrix Graphic (| + |)
 * Interactive quadrant visualization for Brain Dump mode:
 * - Y-Axis: Conviction (Strong / Weak)
 * - X-Axis: Relevance (Tangent / Aligned)
 */

import React from 'react';
import { QuadrantType, TriageItem } from '../types/synapse';
import { CheckCircle2, Cpu, Zap, Orbit } from 'lucide-react';

interface Props {
  items: TriageItem[];
  selectedQuadrant: QuadrantType | 'ALL';
  onSelectQuadrant: (q: QuadrantType | 'ALL') => void;
}

export const MatrixGraphic2x2: React.FC<Props> = ({
  items,
  selectedQuadrant,
  onSelectQuadrant,
}) => {
  const activeCount = items.filter((i) => i.classification.quadrant === 'ACTIVE_PIPELINE').length;
  const scoutCount = items.filter((i) => i.classification.quadrant === 'INCUBATOR_SCOUT').length;
  const bufferCount = items.filter((i) => i.classification.quadrant === 'MICRO_BUFFER').length;
  const parkingCount = items.filter((i) => i.classification.quadrant === 'PARKING_ORBIT').length;

  return (
    <div className="bg-[#07090e] border border-[#1e293b] rounded-xl p-3 font-mono text-xs select-none">
      
      {/* Top Header Labels */}
      <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1.5 px-1">
        <span className="text-purple-400">← TANGENT (OFF-ROADMAP)</span>
        <span className="text-emerald-400">ALIGNED (NORTH STAR) →</span>
      </div>

      {/* 2x2 Grid Container with crosshair */}
      <div className="relative grid grid-cols-2 gap-1.5 p-1 bg-[#05070a] rounded-lg border border-[#141b2d]">
        
        {/* Top-Left: Scout Incubator (Tangent + Strong) */}
        <button
          onClick={() => onSelectQuadrant(selectedQuadrant === 'INCUBATOR_SCOUT' ? 'ALL' : 'INCUBATOR_SCOUT')}
          className={`p-2 rounded-md text-left transition relative cursor-pointer ${
            selectedQuadrant === 'INCUBATOR_SCOUT'
              ? 'bg-purple-950/80 border border-purple-500 text-white shadow-sm'
              : 'bg-[#0c101a] border border-purple-900/30 hover:border-purple-500/50 text-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-[11px] font-bold text-purple-400">
            <span className="flex items-center gap-1">
              <Cpu className="w-3 h-3" />
              <span>Scout</span>
            </span>
            <span className="px-1.5 py-0.2 rounded bg-purple-950 text-[10px] font-bold">
              {scoutCount}
            </span>
          </div>
          <div className="text-[9px] text-slate-500 mt-0.5">Tangent + Strong</div>
          <div className="text-[8px] text-purple-400/80">Never Cull · Auto-Scaffold</div>
        </button>

        {/* Top-Right: Active Pipeline (Aligned + Strong) */}
        <button
          onClick={() => onSelectQuadrant(selectedQuadrant === 'ACTIVE_PIPELINE' ? 'ALL' : 'ACTIVE_PIPELINE')}
          className={`p-2 rounded-md text-left transition relative cursor-pointer ${
            selectedQuadrant === 'ACTIVE_PIPELINE'
              ? 'bg-emerald-950/80 border border-emerald-500 text-white shadow-sm'
              : 'bg-[#0c101a] border border-emerald-900/30 hover:border-emerald-500/50 text-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-[11px] font-bold text-emerald-400">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>Active</span>
            </span>
            <span className="px-1.5 py-0.2 rounded bg-emerald-950 text-[10px] font-bold">
              {activeCount}
            </span>
          </div>
          <div className="text-[9px] text-slate-500 mt-0.5">Aligned + Strong</div>
          <div className="text-[8px] text-emerald-400/80">Direct Pipeline · Sprint</div>
        </button>

        {/* Bottom-Left: Parking Orbit (Tangent + Weak) */}
        <button
          onClick={() => onSelectQuadrant(selectedQuadrant === 'PARKING_ORBIT' ? 'ALL' : 'PARKING_ORBIT')}
          className={`p-2 rounded-md text-left transition relative cursor-pointer ${
            selectedQuadrant === 'PARKING_ORBIT'
              ? 'bg-slate-900 border border-slate-500 text-white shadow-sm'
              : 'bg-[#0c101a] border border-slate-800 hover:border-slate-700 text-slate-400'
          }`}
        >
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
            <span className="flex items-center gap-1">
              <Orbit className="w-3 h-3" />
              <span>Parking</span>
            </span>
            <span className="px-1.5 py-0.2 rounded bg-slate-900 text-[10px] font-bold">
              {parkingCount}
            </span>
          </div>
          <div className="text-[9px] text-slate-500 mt-0.5">Tangent + Weak</div>
          <div className="text-[8px] text-slate-500">Zero Guilt Orbit</div>
        </button>

        {/* Bottom-Right: Micro-Action Buffer (Aligned + Weak) */}
        <button
          onClick={() => onSelectQuadrant(selectedQuadrant === 'MICRO_BUFFER' ? 'ALL' : 'MICRO_BUFFER')}
          className={`p-2 rounded-md text-left transition relative cursor-pointer ${
            selectedQuadrant === 'MICRO_BUFFER'
              ? 'bg-sky-950/80 border border-sky-500 text-white shadow-sm'
              : 'bg-[#0c101a] border border-sky-900/30 hover:border-sky-500/50 text-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-[11px] font-bold text-sky-400">
            <span className="flex items-center gap-1">
              <Zap className="w-3 h-3" />
              <span>Buffer</span>
            </span>
            <span className="px-1.5 py-0.2 rounded bg-sky-950 text-[10px] font-bold">
              {bufferCount}
            </span>
          </div>
          <div className="text-[9px] text-slate-500 mt-0.5">Aligned + Weak</div>
          <div className="text-[8px] text-sky-400/80">&lt;2min Quick Action</div>
        </button>

      </div>

      {/* Bottom Hint */}
      <div className="flex items-center justify-between text-[9px] text-slate-500 mt-1.5 px-1">
        <span>Click quadrant to filter transcription list</span>
        {selectedQuadrant !== 'ALL' && (
          <button
            onClick={() => onSelectQuadrant('ALL')}
            className="text-[#00f2fe] hover:underline"
          >
            [Show All ({items.length})]
          </button>
        )}
      </div>

    </div>
  );
};
