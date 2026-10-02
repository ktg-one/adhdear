/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  UserCognitiveProfile,
  TriageItem,
  AtomicStep,
  SessionMetrics,
  ScoutWorkerState,
  QuadrantType,
} from './types/synapse';
import { ScoutWorkerManager } from './services/scoutWorker';
import { KineticCanvasOverlay, triggerKineticBlast } from './components/KineticCanvasOverlay';
import { CyberWidgetDeck } from './components/CyberWidgetDeck';
import { MatrixGraphic2x2 } from './components/MatrixGraphic2x2';
import { BrainDumpMatrixPage } from './components/BrainDumpMatrixPage';
import { CognitiveBriefingModal } from './components/CognitiveBriefingModal';
import { HardStopLockout } from './components/HardStopLockout';
import { TauriArchitectureModal } from './components/TauriArchitectureModal';
import {
  Brain,
  Terminal,
  Share2,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Sparkles,
  GripHorizontal,
  Compass,
  Layers,
  X,
} from 'lucide-react';

const DEFAULT_PROFILE: UserCognitiveProfile = {
  profile_id: 'usr_alpha_01',
  active_north_star: 'Ship MVP of client automation portal',
  urgency_horizon: 'Current week release',
  archetype: {
    name: 'Divergent High-Velocity Architect',
    initiation_resistance: 'HIGH',
    divergent_rate: 'HIGH',
    subtask_granularity_seconds: 60,
    tangent_handling: 'INSTANT_INCUBATOR',
  },
  pomodoro: {
    work_duration_seconds: 300, // 05:00 default
    break_duration_seconds: 300, // 5 minutes
    hard_lock_on_finish: true,
    interruption_gate: 'HOLD_SPACE_3S',
  },
  audio_preference: {
    engine: 'brown',
    auto_couple_to_timer: true,
    volume: 0.5,
    spotify_connect_enabled: true,
  },
};

const INITIAL_TRIAGE_ITEMS: TriageItem[] = [
  {
    id: 'item-1-vss',
    raw_input: 'rebuild vector indexing with sqlite vss',
    created_at: Date.now() - 60000,
    classification: {
      quadrant: 'ACTIVE_PIPELINE',
      goal_relevance: 'ALIGNED',
      viability: 'STRONG',
      rationale: 'High performance vector query engine. Direct sprint priority.',
      confidence: 0.96,
    },
    atomic_tasks: [
      {
        id: 'step-1-vss',
        item_id: 'item-1-vss',
        project_title: 'sqlite vss indexing',
        prompt: 'rebuild vector indexing with sqlite vss',
        hint: '⚡ Takes ~2 mins. Review schema and write the initial virtual table initialization.',
        estimated_seconds: 120,
        completed: false,
        step_number: 1,
        total_steps: 2,
      },
      {
        id: 'step-2-vss',
        item_id: 'item-1-vss',
        project_title: 'sqlite vss indexing',
        prompt: 'Benchmark query latency against cosine similarity threshold',
        hint: '⚡ Verify under 10ms response time.',
        estimated_seconds: 180,
        completed: false,
        step_number: 2,
        total_steps: 2,
      },
    ],
  },
  {
    id: 'item-2-marketplace',
    raw_input: 'maybe add a plugin marketplace someday',
    created_at: Date.now() - 180000,
    classification: {
      quadrant: 'INCUBATOR_SCOUT',
      goal_relevance: 'TANGENT',
      viability: 'STRONG',
      rationale: 'High ecosystem leverage, but off-roadmap from current sprint milestone.',
      confidence: 0.91,
    },
    scout_worker: {
      project_slug: 'plugin-marketplace',
      title: 'maybe add a plugin marketplace someday',
      status: 'HALF_BUILT',
      progress: 68,
      runner_backend: 'VIRTUAL_FS',
      staged_files: ['poc/plugin_manifest.json', 'src/registry.rs', 'Cargo.toml'],
      dependencies: ['serde', 'wasmtime', 'tokio'],
      handoff_summary: 'Scaffolded plugin sandbox interface and JSON-RPC manifest. Ready when returning.',
      skeleton_code: `// Scout Staged Code for: plugin-marketplace\nuse serde::{Deserialize, Serialize};\n\n#[derive(Debug, Serialize, Deserialize)]\npub struct PluginManifest {\n    pub name: String,\n    pub version: String,\n    pub permissions: Vec<String>,\n}\n\npub struct PluginRegistry {\n    pub loaded_plugins: Vec<PluginManifest>,\n}`,
      logs: [
        'Captured tangent: "maybe add a plugin marketplace someday"',
        'Quadrant: Tangent + Strong. Dispatched to background Scout (Zero Idea Loss).',
        'Scouted dependencies: wasmtime sandbox & serde serialization.',
        'Staged half-built project files: 68% complete.',
      ],
      created_at: Date.now() - 180000,
    },
  },
  {
    id: 'item-3-portal',
    raw_input: 'ship the client portal MVP this week',
    created_at: Date.now() - 360000,
    classification: {
      quadrant: 'ACTIVE_PIPELINE',
      goal_relevance: 'ALIGNED',
      viability: 'STRONG',
      rationale: 'Primary North Star deliverable for current sprint.',
      confidence: 0.98,
    },
    atomic_tasks: [
      {
        id: 'step-portal-1',
        item_id: 'item-3-portal',
        project_title: 'Client Portal MVP',
        prompt: 'ship the client portal MVP this week',
        hint: '⚡ Polish deployment config and verify auth tokens.',
        estimated_seconds: 180,
        completed: false,
        step_number: 1,
        total_steps: 1,
      },
    ],
  },
];

type ViewMode = 'widget-center' | 'docked-desktop';

export default function App() {
  const [profile, setProfile] = useState<UserCognitiveProfile>(() => {
    try {
      const saved = localStorage.getItem('synapse:profile');
      return saved ? JSON.parse(saved) : DEFAULT_PROFILE;
    } catch {
      return DEFAULT_PROFILE;
    }
  });

  const [triageItems, setTriageItems] = useState<TriageItem[]>(() => {
    try {
      const saved = localStorage.getItem('synapse:items');
      return saved ? JSON.parse(saved) : INITIAL_TRIAGE_ITEMS;
    } catch {
      return INITIAL_TRIAGE_ITEMS;
    }
  });

  const [metrics, setMetrics] = useState<SessionMetrics>({
    xp: 1450,
    streak: 3,
    completed_count: 5,
    tangents_incubated: 2,
    active_focus_seconds: 1420,
  });

  const [viewMode, setViewMode] = useState<ViewMode>('widget-center');
  const [activeStepId, setActiveStepId] = useState<string>('step-1-vss');

  // Modals & Drawers
  const [isBrainDumpMatrixOpen, setIsBrainDumpMatrixOpen] = useState<boolean>(false);
  const [isMatrixDrawerOpen, setIsMatrixDrawerOpen] = useState<boolean>(false);
  const [matrixQuadrantFilter, setMatrixQuadrantFilter] = useState<QuadrantType | 'ALL'>('ALL');
  const [isBriefingOpen, setIsBriefingOpen] = useState<boolean>(false);
  const [isTauriModalOpen, setIsTauriModalOpen] = useState<boolean>(false);
  const [isHardStopActive, setIsHardStopActive] = useState<boolean>(false);
  const [inspectedScoutItem, setInspectedScoutItem] = useState<TriageItem | null>(null);

  const handleMoveItem = (itemId: string, targetQuadrant: QuadrantType) => {
    setTriageItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? {
              ...item,
              classification: {
                ...item.classification,
                quadrant: targetQuadrant,
              },
            }
          : item
      )
    );
    triggerKineticBlast({ message: `MOVED TO ${targetQuadrant.replace('_', ' ')}` });
  };

  // Sync profile to local storage
  const handleSaveProfile = (newProfile: UserCognitiveProfile) => {
    setProfile(newProfile);
    try {
      localStorage.setItem('synapse:profile', JSON.stringify(newProfile));
    } catch {
      // ignore
    }
  };

  // Sync triage items to local storage
  useEffect(() => {
    try {
      localStorage.setItem('synapse:items', JSON.stringify(triageItems));
    } catch {
      // ignore
    }
  }, [triageItems]);

  // Extract all pending atomic steps from ACTIVE_PIPELINE
  const activePipelineSteps = triageItems
    .filter((i) => i.classification.quadrant === 'ACTIVE_PIPELINE')
    .flatMap((i) => i.atomic_tasks || [])
    .filter((step) => !step.completed);

  // Derive currently active step
  const activeCurrentStep: AtomicStep | null =
    activePipelineSteps.find((s) => s.id === activeStepId) || activePipelineSteps[0] || null;

  // Background Scout Worker tick simulation
  useEffect(() => {
    const interval = setInterval(async () => {
      let hasChanges = false;
      const updated = await Promise.all(
        triageItems.map(async (item) => {
          if (item.classification.quadrant === 'INCUBATOR_SCOUT' && item.scout_worker) {
            if (item.scout_worker.progress < 95) {
              hasChanges = true;
              const newScout = await ScoutWorkerManager.tickWorker(item.scout_worker);
              return { ...item, scout_worker: newScout };
            }
          }
          return item;
        })
      );

      if (hasChanges) {
        setTriageItems(updated);
      }
    }, 5500);

    return () => clearInterval(interval);
  }, [triageItems]);

  // Handle triage of a newly dumped thought
  const handleItemTriaged = (item: TriageItem) => {
    setTriageItems((prev) => [item, ...prev]);

    setMetrics((m) => ({
      ...m,
      xp: m.xp + 25,
      tangents_incubated:
        item.classification.quadrant === 'INCUBATOR_SCOUT'
          ? m.tangents_incubated + 1
          : m.tangents_incubated,
    }));
  };

  // Select an item from Card 2 to focus on Card 3
  const handleSelectActiveTask = (item: TriageItem) => {
    if (item.classification.quadrant === 'INCUBATOR_SCOUT') {
      setInspectedScoutItem(item);
      return;
    }

    if (item.atomic_tasks && item.atomic_tasks.length > 0) {
      const pending = item.atomic_tasks.find((s) => !s.completed) || item.atomic_tasks[0];
      setActiveStepId(pending.id);
    }
  };

  // Complete an atomic step
  const handleCompleteStep = (stepId: string) => {
    setTriageItems((prev) =>
      prev.map((item) => {
        if (!item.atomic_tasks) return item;
        const hasStep = item.atomic_tasks.some((s) => s.id === stepId);
        if (!hasStep) return item;

        const updatedTasks = item.atomic_tasks.map((s) =>
          s.id === stepId ? { ...s, completed: true } : s
        );

        return { ...item, atomic_tasks: updatedTasks };
      })
    );

    setMetrics((m) => ({
      ...m,
      xp: m.xp + 150,
      streak: m.streak + 1,
      completed_count: m.completed_count + 1,
    }));
  };

  // Subdivide step into two 30-second micro actions to eliminate resistance (Scissors button ✂)
  const handleSubdivideStep = (stepId: string) => {
    setTriageItems((prev) =>
      prev.map((item) => {
        if (!item.atomic_tasks) return item;
        const stepIndex = item.atomic_tasks.findIndex((s) => s.id === stepId);
        if (stepIndex === -1) return item;

        const target = item.atomic_tasks[stepIndex];

        const micro1: AtomicStep = {
          id: `micro_1_${Date.now()}`,
          item_id: item.id,
          project_title: target.project_title,
          prompt: `open workspace and write initial line for ${target.prompt.slice(0, 30)}`,
          hint: '⚡ 30-second start. Just write one line.',
          estimated_seconds: 30,
          completed: false,
          step_number: target.step_number,
          total_steps: target.total_steps + 1,
        };

        const micro2: AtomicStep = {
          id: `micro_2_${Date.now()}`,
          item_id: item.id,
          project_title: target.project_title,
          prompt: `implement minimal functional logic for ${target.prompt.slice(0, 30)}`,
          hint: '⚡ Finish atomic chunk.',
          estimated_seconds: 60,
          completed: false,
          step_number: target.step_number + 1,
          total_steps: target.total_steps + 1,
        };

        const newTasks = [...item.atomic_tasks];
        newTasks.splice(stepIndex, 1, micro1, micro2);

        setActiveStepId(micro1.id);
        return { ...item, atomic_tasks: newTasks };
      })
    );

    triggerKineticBlast({ message: 'SUBDIVIDED: 30S MICRO-STEP ✂' });
  };

  // Promote an incubated tangent to Active Pipeline
  const handlePromoteToActive = (item: TriageItem) => {
    const updated: TriageItem = {
      ...item,
      classification: {
        ...item.classification,
        quadrant: 'ACTIVE_PIPELINE',
      },
      atomic_tasks: [
        {
          id: `promoted_${Date.now()}`,
          item_id: item.id,
          project_title: item.scout_worker?.project_slug || item.raw_input.slice(0, 24),
          prompt: item.raw_input.toLowerCase(),
          hint: '⚡ Scout already staged dependencies. Zero blank page restart cost!',
          estimated_seconds: 120,
          completed: false,
          step_number: 1,
          total_steps: 1,
        },
      ],
    };

    setTriageItems((prev) => [updated, ...prev.filter((i) => i.id !== item.id)]);
    setActiveStepId(`promoted_${Date.now()}`);
    setInspectedScoutItem(null);

    setMetrics((m) => ({
      ...m,
      xp: m.xp + 100,
    }));

    triggerKineticBlast({ message: 'PROMOTED TO SPRINT ⚡', color: '#00ff9d' });
  };

  const handleDeleteItem = (id: string) => {
    setTriageItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleCopyProof = () => {
    const proofText = `⚡ SYNAPSE Proof: Locked in ${metrics.completed_count} atomic micro-steps on [${profile.active_north_star}] | Streak: ${metrics.streak}x | XP: ${metrics.xp}`;
    navigator.clipboard.writeText(proofText);
    triggerKineticBlast({ message: 'PROOF COPIED!', color: '#ff007f' });
  };

  return (
    <div className="min-h-screen bg-[#070a10] text-slate-200 antialiased selection:bg-[#00f2fe] selection:text-black font-sans flex flex-col items-center justify-center p-3 sm:p-6 overflow-x-hidden relative">
      
      {/* High-Performance Canvas Particle Overlay */}
      <KineticCanvasOverlay />

      {/* Subtle top toolbar controls */}
      <header className="fixed top-3 left-4 right-4 max-w-4xl mx-auto flex items-center justify-between z-30 font-mono text-xs select-none">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#00f2fe] animate-pulse" />
          <span className="text-[#00f2fe] font-bold text-xs tracking-wider">
            SYNAPSE // HUD
          </span>
          <span className="text-[10px] text-slate-500 hidden sm:inline">
            · {profile.active_north_star}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode(viewMode === 'widget-center' ? 'docked-desktop' : 'widget-center')}
            className="px-2.5 py-1 rounded-lg bg-[#111726]/80 border border-[#1e273a] hover:border-cyan-500/50 text-[11px] text-slate-300 hover:text-white transition flex items-center gap-1.5"
            title="Toggle between Centered Widget View and Docked Desktop Companion"
          >
            {viewMode === 'widget-center' ? <Maximize2 className="w-3 h-3" /> : <Minimize2 className="w-3 h-3" />}
            <span className="hidden sm:inline">{viewMode === 'widget-center' ? 'Dock Beside IDE' : 'Centered Widget'}</span>
          </button>

          <button
            onClick={() => setIsBriefingOpen(true)}
            className="px-2.5 py-1 rounded-lg bg-[#111726]/80 border border-[#1e273a] hover:border-cyan-500/50 text-[11px] text-slate-300 hover:text-white transition flex items-center gap-1.5"
            title="Cognitive profile & ADHD habit calibration"
          >
            <Brain className="w-3 h-3 text-[#22d3ee]" />
            <span className="hidden sm:inline">Profile</span>
          </button>

          <button
            onClick={() => setIsTauriModalOpen(true)}
            className="px-2.5 py-1 rounded-lg bg-[#111726]/80 border border-[#1e273a] hover:border-purple-500/50 text-[11px] text-slate-300 hover:text-white transition flex items-center gap-1.5"
            title="Inspect native Tauri v2 + Rust backend code"
          >
            <Terminal className="w-3 h-3 text-[#a78bfa]" />
            <span className="hidden sm:inline">Rust IPC</span>
          </button>
        </div>
      </header>

      {/* Main Center Container */}
      <div className={`w-full flex items-center justify-center pt-10 sm:pt-6 ${viewMode === 'docked-desktop' ? 'max-w-6xl gap-6' : 'max-w-md'}`}>
        
        {/* Optional Simulated IDE Workspace when in 'docked-desktop' mode */}
        {viewMode === 'docked-desktop' && (
          <div className="flex-1 bg-[#090d16] border border-[#1e273a] rounded-3xl p-5 font-mono text-xs hidden lg:flex flex-col space-y-3 shadow-2xl">
            <div className="flex items-center justify-between text-slate-500 pb-2 border-b border-slate-800 text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                <span className="ml-2 text-slate-300 font-semibold">src/portal/service.rs</span>
              </div>
              <span>Anchor: {profile.active_north_star}</span>
            </div>

            <div className="space-y-1 text-slate-400 text-[11px] leading-relaxed select-none opacity-85 py-2">
              <p><span className="text-purple-400">use</span> std::sync::Arc;</p>
              <p><span className="text-purple-400">use</span> rusqlite::&#123;Connection, Result&#125;;</p>
              <br />
              <p><span className="text-[#00f2fe]">#[derive(Debug, Clone)]</span></p>
              <p><span className="text-purple-400">pub struct</span> <span className="text-amber-300">VssVectorIndex</span> &#123;</p>
              <p className="pl-4">dimensions: usize,</p>
              <p>&#125;</p>
              <br />
              <p><span className="text-purple-400">impl</span> <span className="text-amber-300">VssVectorIndex</span> &#123;</p>
              <p className="pl-4"><span className="text-purple-400">pub fn</span> <span className="text-[#00f2fe]">execute_query</span>(&amp;self) -&gt; Result&lt;()&gt; &#123;</p>
              <p className="pl-8 text-emerald-400">println!("// Connected to SYNAPSE // HUD floating overlay...");</p>
              <p className="pl-8">Ok(())</p>
              <p className="pl-4">&#125;</p>
              <p>&#125;</p>
            </div>

            <div className="bg-[#05070b] border border-[#1a2233] p-3 rounded-xl text-[10px] text-emerald-400 space-y-0.5">
              <span className="text-slate-500 block">&gt; cargo test -- --nocapture</span>
              <span>test tests::verify_vss_index ... ok</span>
              <span className="text-slate-400">test result: ok. 1 passed in 0.04s</span>
            </div>
          </div>
        )}

        {/* 
          ==========================================================
          THE EXACT 3-CARD CYBERNETIC DESKTOP WIDGET DECK
          (Exact aesthetic match to user's uploaded image.png)
          ========================================================== 
        */}
        <div className="flex flex-col items-center">
          <CyberWidgetDeck
            profile={profile}
            triageItems={triageItems}
            activeStep={activeCurrentStep}
            metrics={metrics}
            onItemTriaged={handleItemTriaged}
            onCompleteStep={handleCompleteStep}
            onSubdivideStep={handleSubdivideStep}
            onPromoteItem={handlePromoteToActive}
            onSelectActiveTask={handleSelectActiveTask}
            onInspectScout={(item) => setInspectedScoutItem(item)}
            onTriggerHardStop={() => setIsHardStopActive(true)}
            onOpenProfile={() => setIsBriefingOpen(true)}
            onOpenMatrix={() => setIsMatrixDrawerOpen(true)}
            onOpenBrainDumpMatrix={() => setIsBrainDumpMatrixOpen(true)}
          />
        </div>

      </div>

      {/* Full-Page Focus Matrix / Brain Dump Mode (Triggered by '+') */}
      <BrainDumpMatrixPage
        isOpen={isBrainDumpMatrixOpen}
        profile={profile}
        triageItems={triageItems}
        onClose={() => setIsBrainDumpMatrixOpen(false)}
        onUpdateGoal={(newGoal) => handleSaveProfile({ ...profile, active_north_star: newGoal })}
        onItemTriaged={handleItemTriaged}
        onDeleteItem={handleDeleteItem}
        onPromoteItem={handlePromoteToActive}
        onInspectScout={(item) => {
          setIsBrainDumpMatrixOpen(false);
          setInspectedScoutItem(item);
        }}
        onMoveItem={handleMoveItem}
      />

      {/* 2x2 Matrix Drawer / Popup */}
      {isMatrixDrawerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div className="bg-[#0e1420] border border-[#232d42] rounded-3xl max-w-md w-full p-5 shadow-2xl relative font-mono text-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#22d3ee]" />
                <span className="font-bold text-white uppercase text-xs">2x2 Matrix Vector Storage</span>
              </div>
              <button
                onClick={() => setIsMatrixDrawerOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <MatrixGraphic2x2
              items={triageItems}
              selectedQuadrant={matrixQuadrantFilter}
              onSelectQuadrant={setMatrixQuadrantFilter}
            />

            <div className="pt-2 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-800">
              <span>{triageItems.length} Total Classified Thoughts</span>
              <button
                onClick={() => setIsMatrixDrawerOpen(false)}
                className="px-3 py-1 bg-[#141b2d] hover:bg-slate-800 text-slate-300 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inspect Scout Project Modal */}
      {inspectedScoutItem && inspectedScoutItem.scout_worker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div className="bg-[#0e1420] border border-purple-500/50 rounded-3xl max-w-lg w-full p-5 shadow-2xl relative font-mono text-xs space-y-3">
            <div className="flex items-start justify-between border-b border-[#1e293b] pb-2">
              <div>
                <h4 className="text-sm font-bold text-white truncate max-w-sm">
                  {inspectedScoutItem.raw_input}
                </h4>
                <span className="text-[10px] text-[#a78bfa]">
                  Scout Progress: {inspectedScoutItem.scout_worker.progress}% Scaffolded (Never Culled)
                </span>
              </div>
              <button
                onClick={() => setInspectedScoutItem(null)}
                className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <span className="text-[10px] text-slate-500 uppercase block mb-1">Generated Rust Skeleton:</span>
              <pre className="bg-[#07090e] border border-[#1e293b] p-3 rounded-xl text-slate-300 text-[11px] max-h-48 overflow-y-auto">
                {inspectedScoutItem.scout_worker.skeleton_code}
              </pre>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-[#1e293b]">
              <button
                onClick={() => handlePromoteToActive(inspectedScoutItem)}
                className="bg-[#00ff9d] hover:bg-emerald-300 text-black font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1 cursor-pointer shadow-md shadow-emerald-500/20"
              >
                <span>Promote to Active Sprint (⚡)</span>
              </button>
              <span className="text-[10px] text-slate-500">Zero blank page restart</span>
            </div>
          </div>
        </div>
      )}

      {/* Cognitive Alignment Diagnostic Briefing Modal */}
      <CognitiveBriefingModal
        isOpen={isBriefingOpen}
        onClose={() => setIsBriefingOpen(false)}
        profile={profile}
        onSaveProfile={handleSaveProfile}
      />

      {/* Mandatory Hard-Stop Pomodoro Break Lockout */}
      <HardStopLockout
        isActive={isHardStopActive}
        onDismiss={() => setIsHardStopActive(false)}
        breakDurationSeconds={profile.pomodoro.break_duration_seconds}
      />

      {/* Tauri v2 + Rust Architecture Blueprint Modal */}
      <TauriArchitectureModal
        isOpen={isTauriModalOpen}
        onClose={() => setIsTauriModalOpen(false)}
      />

    </div>
  );
}
