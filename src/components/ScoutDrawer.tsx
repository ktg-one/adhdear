/**
 * Asynchronous Scout Incubator Engine
 * Preserves strong tangents with zero idea loss.
 * Auto-generates file skeletons, dependency manifests, and staged handoff specs
 * via swappable backends (Virtual FS, CLI Aider, Composio, Tauri Bridge).
 */

import React, { useState } from 'react';
import { ScoutWorkerState, RunnerBackend, TriageItem } from '../types/synapse';
import { ScoutWorkerManager } from '../services/scoutWorker';
import { triggerKineticBlast } from './KineticCanvasOverlay';
import {
  Cpu,
  Layers,
  FileCode,
  Terminal,
  Play,
  ArrowRight,
  Copy,
  Check,
  FileText,
  Clock,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

interface Props {
  incubatingItems: TriageItem[];
  onPromoteToActive: (item: TriageItem) => void;
  onUpdateScoutState: (itemId: string, updatedState: ScoutWorkerState) => void;
}

export const ScoutDrawer: React.FC<Props> = ({
  incubatingItems,
  onPromoteToActive,
  onUpdateScoutState,
}) => {
  const [selectedItem, setSelectedItem] = useState<TriageItem | null>(null);
  const [modalTab, setModalTab] = useState<'log' | 'code' | 'manifest'>('code');
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const handleInspect = (item: TriageItem) => {
    setSelectedItem(item);
  };

  const handleCloseModal = () => {
    setSelectedItem(null);
  };

  const handleRunManualCycle = async () => {
    if (!selectedItem?.scout_worker) return;
    setIsProcessing(true);

    try {
      const updated = await ScoutWorkerManager.tickWorker(selectedItem.scout_worker);
      onUpdateScoutState(selectedItem.id, updated);
      setSelectedItem({ ...selectedItem, scout_worker: updated });
      triggerKineticBlast({ message: 'SCOUT WORKER ITERATED!' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBackendChange = (backend: RunnerBackend) => {
    if (!selectedItem?.scout_worker) return;
    const updated: ScoutWorkerState = {
      ...selectedItem.scout_worker,
      runner_backend: backend,
      logs: [
        ...selectedItem.scout_worker.logs,
        `[CONFIG] Switched runner backend to: ${backend}`,
      ],
    };
    onUpdateScoutState(selectedItem.id, updated);
    setSelectedItem({ ...selectedItem, scout_worker: updated });
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handlePromote = (item: TriageItem) => {
    onPromoteToActive(item);
    setSelectedItem(null);
    triggerKineticBlast({ message: 'PROMOTED TO ACTIVE SPRINT! +100 XP', color: '#10b981' });
  };

  return (
    <div className="bg-[#0c101a] border border-[#1e293b] rounded-2xl p-5 shadow-2xl space-y-4">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#1e293b]">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-pulse" />
          <h3 className="text-xs font-mono uppercase tracking-widest text-purple-400 font-bold flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5" />
            Async Scout Incubator
          </h3>
        </div>

        <span className="text-[10px] font-mono text-slate-400 bg-[#141b2d] px-2 py-0.5 rounded border border-[#1e293b]">
          Never Cull · {incubatingItems.length} Tangents Active
        </span>
      </div>

      <p className="text-xs text-slate-400 font-mono leading-relaxed">
        Strong tangents are <span className="text-slate-200 font-semibold">never deleted</span>. The autonomous worker gathers libraries, drafts file architectures, and stages a half-built playground so you never face a blank slate when returning.
      </p>

      {/* Incubator List */}
      <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
        {incubatingItems.length > 0 ? (
          incubatingItems.map((item) => {
            const scout = item.scout_worker;
            if (!scout) return null;

            return (
              <div
                key={item.id}
                className="bg-[#141b2d]/80 border border-[#1e293b] hover:border-purple-500/50 rounded-xl p-3.5 transition group relative overflow-hidden"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h4 className="text-xs font-mono font-semibold text-slate-100 line-clamp-2">
                    {item.raw_input}
                  </h4>
                  <span className="text-[10px] font-mono text-purple-400 bg-purple-950/70 border border-purple-800/40 px-2 py-0.5 rounded whitespace-nowrap">
                    {scout.progress}% Scaffolded
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-[#07090e] h-1.5 rounded-full overflow-hidden mb-2.5">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-[#00f2fe] h-full transition-all duration-500"
                    style={{ width: `${scout.progress}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span className="flex items-center gap-1.5 text-[10px] text-slate-400 truncate max-w-[180px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00f2fe] animate-ping" />
                    <span className="truncate">{scout.status}</span>
                  </span>

                  <button
                    onClick={() => handleInspect(item)}
                    className="text-[#00f2fe] hover:underline hover:text-cyan-300 text-[11px] cursor-pointer flex items-center gap-1"
                  >
                    <span>Inspect Skeleton</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-10 text-slate-500 font-mono text-xs border border-dashed border-[#1e293b] rounded-xl p-6">
            No active tangents incubating right now.
            <div className="mt-1 text-slate-600">
              Type an off-roadmap idea in the capture bar above to see the Scout immediately scaffold it!
            </div>
          </div>
        )}
      </div>

      {/* Inspect Skeleton Modal */}
      {selectedItem && selectedItem.scout_worker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-[#0c101a] border border-purple-500/50 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative font-mono text-xs space-y-4">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-[#1e293b] pb-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-purple-400 text-base">🤖</span>
                  <h4 className="text-sm font-bold text-white max-w-md truncate">
                    {selectedItem.raw_input}
                  </h4>
                </div>
                <div className="text-[11px] text-purple-400 flex items-center gap-2">
                  <span>Slug: {selectedItem.scout_worker.project_slug}</span>
                  <span>·</span>
                  <span>{selectedItem.scout_worker.progress}% Scaffolded</span>
                </div>
              </div>

              <button
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            {/* Runner Backend Switcher */}
            <div className="flex items-center justify-between bg-[#07090e] p-2.5 rounded-xl border border-[#1e293b]">
              <span className="text-slate-400 text-[11px]">Runner Engine:</span>
              <div className="flex items-center gap-1">
                {(['VIRTUAL_FS', 'CLI_AIDER', 'COMPOSIO', 'TAURI_BRIDGE'] as RunnerBackend[]).map(
                  (backend) => (
                    <button
                      key={backend}
                      onClick={() => handleBackendChange(backend)}
                      className={`px-2 py-1 rounded text-[10px] transition ${
                        selectedItem.scout_worker?.runner_backend === backend
                          ? 'bg-[#141b2d] text-[#00f2fe] border border-[#00f2fe]/40 font-bold'
                          : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {backend}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Modal Tabs */}
            <div className="flex items-center gap-2 border-b border-[#1e293b] pb-2">
              <button
                onClick={() => setModalTab('code')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                  modalTab === 'code'
                    ? 'bg-[#141b2d] text-[#00f2fe] border border-[#00f2fe]/30 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>Pre-Built Skeleton</span>
              </button>
              <button
                onClick={() => setModalTab('log')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                  modalTab === 'log'
                    ? 'bg-[#141b2d] text-purple-400 border border-purple-500/30 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>Worker Logs</span>
              </button>
              <button
                onClick={() => setModalTab('manifest')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                  modalTab === 'manifest'
                    ? 'bg-[#141b2d] text-emerald-400 border border-emerald-500/30 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>triage_output.json</span>
              </button>
            </div>

            {/* Tab 1: Code Skeleton */}
            {modalTab === 'code' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Staged Directory Structure & Rust Skeleton:</span>
                  <button
                    onClick={() => handleCopyCode(selectedItem.scout_worker!.skeleton_code)}
                    className="flex items-center gap-1 text-[#00f2fe] hover:underline"
                  >
                    {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedCode ? 'Copied!' : 'Copy Code'}</span>
                  </button>
                </div>
                <pre className="bg-[#07090e] border border-[#1e293b] p-3 rounded-xl text-slate-300 text-[11px] max-h-56 overflow-y-auto">
                  {selectedItem.scout_worker.skeleton_code}
                </pre>
              </div>
            )}

            {/* Tab 2: Worker Logs */}
            {modalTab === 'log' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Worker Activity Trace:</span>
                  <button
                    onClick={handleRunManualCycle}
                    disabled={isProcessing}
                    className="flex items-center gap-1 text-purple-400 hover:text-purple-300 transition"
                  >
                    <Play className="w-3 h-3" />
                    <span>Run Scout Cycle</span>
                  </button>
                </div>
                <div className="bg-[#07090e] border border-[#1e293b] p-3 rounded-xl space-y-1.5 text-slate-300 max-h-56 overflow-y-auto">
                  {selectedItem.scout_worker.logs.map((line, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="text-purple-400">✓</span>
                      <span className="text-[11px]">{line}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 3: Handoff Manifest */}
            {modalTab === 'manifest' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Handoff Manifest Contract:</span>
                  <button
                    onClick={() =>
                      handleCopyCode(
                        ScoutWorkerManager.exportHandoffManifest(
                          selectedItem.scout_worker!,
                          selectedItem.raw_input
                        )
                      )
                    }
                    className="flex items-center gap-1 text-[#00f2fe] hover:underline"
                  >
                    {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedCode ? 'Copied JSON!' : 'Copy Manifest'}</span>
                  </button>
                </div>
                <pre className="bg-[#07090e] border border-[#1e293b] p-3 rounded-xl text-slate-300 text-[11px] max-h-56 overflow-y-auto">
                  {ScoutWorkerManager.exportHandoffManifest(
                    selectedItem.scout_worker,
                    selectedItem.raw_input
                  )}
                </pre>
              </div>
            )}

            {/* Action Bar */}
            <div className="pt-3 border-t border-[#1e293b] flex items-center justify-between">
              <button
                onClick={() => handlePromote(selectedItem)}
                className="bg-emerald-400 hover:bg-emerald-300 text-black font-bold px-4 py-2.5 rounded-xl transition text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20"
              >
                <span>Promote to Active Pipeline Now (+100 XP)</span>
              </button>
              <span className="text-[11px] text-slate-500">
                Auto-polishing continues in background
              </span>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
