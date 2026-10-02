/**
 * 2x2 Matrix Vector Storage Overview
 * Live visual representation of:
 * - Active Pipeline (Aligned + Strong)
 * - Incubator Scout (Tangent + Strong)
 * - Micro-Action Buffer (Aligned + Weak)
 * - Parking Orbit (Tangent + Weak)
 */

import React, { useState } from 'react';
import { TriageItem, QuadrantType } from '../types/synapse';
import { LayoutGrid, CheckCircle2, Cpu, Zap, Orbit, Trash2, ArrowRight } from 'lucide-react';

interface Props {
  items: TriageItem[];
  onDeleteItem: (id: string) => void;
  onPromoteItem: (item: TriageItem) => void;
}

export const MatrixOverview: React.FC<Props> = ({
  items,
  onDeleteItem,
  onPromoteItem,
}) => {
  const [filter, setFilter] = useState<'ALL' | QuadrantType>('ALL');

  const activePipelineItems = items.filter((i) => i.classification.quadrant === 'ACTIVE_PIPELINE');
  const scoutItems = items.filter((i) => i.classification.quadrant === 'INCUBATOR_SCOUT');
  const bufferItems = items.filter((i) => i.classification.quadrant === 'MICRO_BUFFER');
  const parkingItems = items.filter((i) => i.classification.quadrant === 'PARKING_ORBIT');

  const filteredItems =
    filter === 'ALL'
      ? items
      : items.filter((i) => i.classification.quadrant === filter);

  return (
    <div className="bg-[#0c101a] border border-[#1e293b] rounded-2xl p-5 shadow-2xl space-y-4 font-mono text-xs">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#1e293b]">
        <div className="flex items-center gap-2">
          <LayoutGrid className="w-4 h-4 text-[#00f2fe]" />
          <h3 className="font-bold text-slate-200 uppercase tracking-wider">
            2x2 Cognitive Matrix Vector Storage
          </h3>
        </div>

        <span className="text-[11px] text-slate-400">
          Total Vectors: <strong className="text-[#00f2fe]">{items.length}</strong>
        </span>
      </div>

      {/* Quadrant Quick Summary Cards / Filter Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <button
          onClick={() => setFilter(filter === 'ACTIVE_PIPELINE' ? 'ALL' : 'ACTIVE_PIPELINE')}
          className={`p-3 rounded-xl border text-left transition cursor-pointer ${
            filter === 'ACTIVE_PIPELINE'
              ? 'bg-[#141b2d] border-emerald-500 text-white shadow-md'
              : 'bg-[#07090e] border-emerald-500/25 hover:border-emerald-500/50 text-slate-300'
          }`}
        >
          <div className="flex items-center justify-between font-bold text-emerald-400 mb-1">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Active</span>
            </span>
            <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-[10px] text-emerald-400 font-bold">
              {activePipelineItems.length}
            </span>
          </div>
          <div className="text-[10px] text-slate-500">Aligned + Strong</div>
        </button>

        <button
          onClick={() => setFilter(filter === 'INCUBATOR_SCOUT' ? 'ALL' : 'INCUBATOR_SCOUT')}
          className={`p-3 rounded-xl border text-left transition cursor-pointer ${
            filter === 'INCUBATOR_SCOUT'
              ? 'bg-[#141b2d] border-purple-500 text-white shadow-md'
              : 'bg-[#07090e] border-purple-500/25 hover:border-purple-500/50 text-slate-300'
          }`}
        >
          <div className="flex items-center justify-between font-bold text-purple-400 mb-1">
            <span className="flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5" />
              <span>Scout</span>
            </span>
            <span className="px-1.5 py-0.5 rounded bg-purple-950 text-[10px] text-purple-400 font-bold">
              {scoutItems.length}
            </span>
          </div>
          <div className="text-[10px] text-slate-500">Tangent + Strong</div>
        </button>

        <button
          onClick={() => setFilter(filter === 'MICRO_BUFFER' ? 'ALL' : 'MICRO_BUFFER')}
          className={`p-3 rounded-xl border text-left transition cursor-pointer ${
            filter === 'MICRO_BUFFER'
              ? 'bg-[#141b2d] border-sky-500 text-white shadow-md'
              : 'bg-[#07090e] border-sky-500/25 hover:border-sky-500/50 text-slate-300'
          }`}
        >
          <div className="flex items-center justify-between font-bold text-sky-400 mb-1">
            <span className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" />
              <span>Buffer</span>
            </span>
            <span className="px-1.5 py-0.5 rounded bg-sky-950 text-[10px] text-sky-400 font-bold">
              {bufferItems.length}
            </span>
          </div>
          <div className="text-[10px] text-slate-500">Aligned + Weak</div>
        </button>

        <button
          onClick={() => setFilter(filter === 'PARKING_ORBIT' ? 'ALL' : 'PARKING_ORBIT')}
          className={`p-3 rounded-xl border text-left transition cursor-pointer ${
            filter === 'PARKING_ORBIT'
              ? 'bg-[#141b2d] border-slate-600 text-white shadow-md'
              : 'bg-[#07090e] border-slate-800 hover:border-slate-700 text-slate-400'
          }`}
        >
          <div className="flex items-center justify-between font-bold text-slate-300 mb-1">
            <span className="flex items-center gap-1.5">
              <Orbit className="w-3.5 h-3.5" />
              <span>Parking</span>
            </span>
            <span className="px-1.5 py-0.5 rounded bg-slate-900 text-[10px] text-slate-400 font-bold">
              {parkingItems.length}
            </span>
          </div>
          <div className="text-[10px] text-slate-500">Tangent + Weak</div>
        </button>
      </div>

      {/* Filtered Item Cards */}
      <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
        {filteredItems.length > 0 ? (
          filteredItems.map((item) => {
            const isScout = item.classification.quadrant === 'INCUBATOR_SCOUT';
            const isActive = item.classification.quadrant === 'ACTIVE_PIPELINE';

            return (
              <div
                key={item.id}
                className="bg-[#141b2d] border border-[#1e293b] rounded-xl p-3 flex items-start justify-between gap-3 hover:border-slate-700 transition"
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        item.classification.quadrant === 'ACTIVE_PIPELINE'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/40'
                          : item.classification.quadrant === 'INCUBATOR_SCOUT'
                          ? 'bg-purple-950 text-purple-400 border border-purple-800/40'
                          : item.classification.quadrant === 'MICRO_BUFFER'
                          ? 'bg-sky-950 text-sky-400 border border-sky-800/40'
                          : 'bg-slate-900 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {item.classification.quadrant.replace('_', ' ')}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {new Date(item.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <p className="text-slate-200 text-xs font-medium">
                    {item.raw_input}
                  </p>

                  <p className="text-[11px] text-slate-400">
                    {item.classification.rationale}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 pt-1">
                  {!isActive && (
                    <button
                      onClick={() => onPromoteItem(item)}
                      className="px-2 py-1 rounded bg-[#07090e] border border-[#1e293b] hover:border-emerald-500/50 text-emerald-400 text-[10px] flex items-center gap-1 transition"
                      title="Promote to active pipeline"
                    >
                      <span>Promote</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                  <button
                    onClick={() => onDeleteItem(item.id)}
                    className="p-1 rounded text-slate-500 hover:text-rose-400 transition"
                    title="Remove item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-8 text-slate-500">
            No items in selected quadrant.
          </div>
        )}
      </div>

    </div>
  );
};
