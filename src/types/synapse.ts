/**
 * SYNAPSE // HUD Core Type Definitions
 * Data contracts for Cognitive Profile, 2x2 Triage Matrix, Scout Incubator,
 * Audio Engine, and Execution HUD.
 */

export type InitiationResistance = 'LOW' | 'MODERATE' | 'HIGH' | 'PARALYZING';
export type DivergentRate = 'LOW' | 'MODERATE' | 'HIGH' | 'HYPERFOCUS';
export type InterruptionGate = 'HOLD_SPACE_3S' | 'TYPE_GROUNDING';
export type AudioTrackType = 'brown' | 'white' | 'alpha' | 'cyber' | 'off';

export interface UserCognitiveProfile {
  profile_id: string;
  active_north_star: string;
  urgency_horizon: string;
  archetype: {
    name: string;
    initiation_resistance: InitiationResistance;
    divergent_rate: DivergentRate;
    subtask_granularity_seconds: number;
    tangent_handling: 'INSTANT_INCUBATOR' | 'STRICT_QUEUE';
  };
  pomodoro: {
    work_duration_seconds: number;
    break_duration_seconds: number;
    hard_lock_on_finish: boolean;
    interruption_gate: InterruptionGate;
  };
  audio_preference: {
    engine: AudioTrackType;
    auto_couple_to_timer: boolean;
    volume: number;
    spotify_connect_enabled: boolean;
  };
}

export type QuadrantType =
  | 'ACTIVE_PIPELINE' // Aligned + Strong
  | 'INCUBATOR_SCOUT' // Tangent + Strong
  | 'MICRO_BUFFER'    // Aligned + Weak
  | 'PARKING_ORBIT';  // Tangent + Weak

export type RunnerBackend = 'VIRTUAL_FS' | 'CLI_AIDER' | 'COMPOSIO' | 'TAURI_BRIDGE';

export interface ScoutWorkerState {
  project_slug: string;
  title: string;
  status: 'ANALYZING' | 'SCOUTING_DEPS' | 'SCAFFOLDING_TREE' | 'HALF_BUILT' | 'READY_FOR_SPRINT';
  progress: number; // 0 - 100
  runner_backend: RunnerBackend;
  staged_files: string[];
  dependencies: string[];
  handoff_summary: string;
  skeleton_code: string;
  logs: string[];
  created_at: number;
}

export interface AtomicStep {
  id: string;
  item_id: string;
  project_title: string;
  prompt: string;
  hint: string;
  estimated_seconds: number;
  completed: boolean;
  step_number: number;
  total_steps: number;
}

export interface TriageItem {
  id: string;
  raw_input: string;
  created_at: number;
  classification: {
    quadrant: QuadrantType;
    goal_relevance: 'ALIGNED' | 'TANGENT';
    viability: 'STRONG' | 'WEAK';
    rationale: string;
    confidence: number;
  };
  scout_worker?: ScoutWorkerState;
  atomic_tasks?: AtomicStep[];
}

export interface SessionMetrics {
  xp: number;
  streak: number;
  completed_count: number;
  tangents_incubated: number;
  active_focus_seconds: number;
}
