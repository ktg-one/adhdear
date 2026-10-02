/**
 * 2x2 Matrix Triage Engine
 * Classifies raw, unfiltered brain dumps into 4 Quadrants based on Goal Relevance x Conviction:
 * - ACTIVE_PIPELINE (Aligned + Strong)
 * - INCUBATOR_SCOUT (Tangent + Strong) -> "Never Cull"
 * - MICRO_BUFFER (Aligned + Weak)
 * - PARKING_ORBIT (Tangent + Weak)
 */

import { GoogleGenAI } from '@google/genai';
import { QuadrantType, TriageItem, UserCognitiveProfile } from '../types/synapse';

export interface TriageResult {
  quadrant: QuadrantType;
  goal_relevance: 'ALIGNED' | 'TANGENT';
  viability: 'STRONG' | 'WEAK';
  rationale: string;
  confidence: number;
  project_slug: string;
  scout_files?: string[];
  scout_deps?: string[];
  atomic_tasks?: Array<{ prompt: string; hint: string; estimated_seconds: number }>;
}

export class TriageEngine {
  private static geminiClient: GoogleGenAI | null = null;

  private static getClient(): GoogleGenAI | null {
    if (!this.geminiClient) {
      const apiKey = process.env.GEMINI_API_KEY || (import.meta as unknown as { env?: { VITE_GEMINI_API_KEY?: string } }).env?.VITE_GEMINI_API_KEY;
      if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
        this.geminiClient = new GoogleGenAI({ apiKey });
      }
    }
    return this.geminiClient;
  }

  /**
   * Fast rule-based semantic heuristic matching
   */
  public static classifyHeuristic(rawInput: string, profile: UserCognitiveProfile): TriageResult {
    const text = rawInput.trim();
    const lower = text.toLowerCase();
    const northStar = profile.active_north_star.toLowerCase();

    // Extract keywords from North Star
    const northStarKeywords = northStar
      .split(/\s+/)
      .filter((w) => w.length > 3)
      .map((w) => w.replace(/[^a-z0-9]/g, ''));

    // Check alignment
    let alignmentScore = 0;
    northStarKeywords.forEach((kw) => {
      if (lower.includes(kw)) alignmentScore += 2;
    });

    const techAlignmentWords = ['bug', 'fix', 'ui', 'refactor', 'test', 'deploy', 'hud', 'synapse', 'core', 'button', 'api'];
    techAlignmentWords.forEach((tw) => {
      if (lower.includes(tw)) alignmentScore += 1;
    });

    const isAligned = alignmentScore >= 2 || (northStarKeywords.length > 0 && northStarKeywords.some((k) => lower.includes(k)));

    // Check conviction / substance
    const hasCodeOrTech = /rust|wasm|sqlite|postgres|python|docker|pipeline|engine|scout|indexer|daemon|cli|ai|llm|audio|synth/i.test(text);
    const isLongOrDetailed = text.length > 30 || text.includes(' because ') || text.includes(' instead of ') || text.includes('should ');
    const isStrong = hasCodeOrTech || isLongOrDetailed;

    let quadrant: QuadrantType;
    let rationale: string;

    if (isAligned && isStrong) {
      quadrant = 'ACTIVE_PIPELINE';
      rationale = `Directly serves [${profile.active_north_star}]. High architectural clarity. Sliced into atomic steps for immediate flow.`;
    } else if (!isAligned && isStrong) {
      quadrant = 'INCUBATOR_SCOUT';
      rationale = `High structural leverage, but off-roadmap from current milestone. Handed off to Autonomous Scout so no spark is lost.`;
    } else if (isAligned && !isStrong) {
      quadrant = 'MICRO_BUFFER';
      rationale = `Aligned with anchor goal, but low activation energy. Buffered for quick 2-minute warmup or cool-down.`;
    } else {
      quadrant = 'PARKING_ORBIT';
      rationale = `Peripheral tangent with low urgency. Safely preserved in orbit with zero guilt.`;
    }

    const slug = text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .slice(0, 32)
      .replace(/\s+/g, '-');

    return {
      quadrant,
      goal_relevance: isAligned ? 'ALIGNED' : 'TANGENT',
      viability: isStrong ? 'STRONG' : 'WEAK',
      rationale,
      confidence: 0.88,
      project_slug: slug || 'tangent-project',
      scout_files: [
        `src/${slug}/mod.rs`,
        `src/${slug}/config.toml`,
        `tests/${slug}_bench.rs`
      ],
      scout_deps: ['tokio', 'serde', 'tracing'],
      atomic_tasks: [
        {
          prompt: `Atomic Action 1: Open workspace and verify interface inputs for "${text.slice(0, 40)}"`,
          hint: '⚡ 60-second start. Just write the first type definition.',
          estimated_seconds: 60,
        },
        {
          prompt: `Atomic Action 2: Wire handler logic and verify execution tests`,
          hint: '⚡ Momentum is unlocked once Action 1 passes.',
          estimated_seconds: 120,
        },
      ],
    };
  }

  /**
   * Main triage method: tries Gemini API if available, falls back to heuristic engine
   */
  public static async triageInput(rawInput: string, profile: UserCognitiveProfile): Promise<TriageResult> {
    const client = this.getClient();
    if (!client) {
      return this.classifyHeuristic(rawInput, profile);
    }

    try {
      const prompt = `
You are the 2x2 Matrix Classifier for SYNAPSE // HUD, an ADHD desktop execution engine.
Current User North Star Anchor Goal: "${profile.active_north_star}"
Urgency Horizon: "${profile.urgency_horizon}"
Initiation Resistance: "${profile.archetype.initiation_resistance}"

User Brain Dump: "${rawInput}"

Classify into one of these 4 quadrants:
1. "ACTIVE_PIPELINE": Goal Relevance = ALIGNED, Viability = STRONG
2. "INCUBATOR_SCOUT": Goal Relevance = TANGENT, Viability = STRONG (Crucial for ADHD: strong ideas are never culled; they are handed to the background scout)
3. "MICRO_BUFFER": Goal Relevance = ALIGNED, Viability = WEAK (Quick minor tasks, under 3 minutes)
4. "PARKING_ORBIT": Goal Relevance = TANGENT, Viability = WEAK (Safe cold storage, zero guilt)

Respond in pure valid JSON without markdown fences:
{
  "quadrant": "ACTIVE_PIPELINE" | "INCUBATOR_SCOUT" | "MICRO_BUFFER" | "PARKING_ORBIT",
  "goal_relevance": "ALIGNED" | "TANGENT",
  "viability": "STRONG" | "WEAK",
  "rationale": "one concise sentence explaining why",
  "confidence": 0.95,
  "project_slug": "short-kebab-slug",
  "scout_files": ["file1.ext", "file2.ext"],
  "scout_deps": ["dep1", "dep2"],
  "atomic_tasks": [
    {"prompt": "Micro task 1", "hint": "quick hint", "estimated_seconds": 60},
    {"prompt": "Micro task 2", "hint": "quick hint", "estimated_seconds": 120}
  ]
}
`;

      const response = await client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      const responseText = response.text?.trim() || '';
      const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson) as TriageResult;

      return parsed;
    } catch {
      return this.classifyHeuristic(rawInput, profile);
    }
  }

  /**
   * Helper to convert triage result into a complete TriageItem
   */
  public static createTriageItem(rawInput: string, result: TriageResult): TriageItem {
    const id = `item_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

    const item: TriageItem = {
      id,
      raw_input: rawInput,
      created_at: Date.now(),
      classification: {
        quadrant: result.quadrant,
        goal_relevance: result.goal_relevance,
        viability: result.viability,
        rationale: result.rationale,
        confidence: result.confidence,
      },
    };

    if (result.quadrant === 'INCUBATOR_SCOUT') {
      item.scout_worker = {
        project_slug: result.project_slug,
        title: rawInput,
        status: 'ANALYZING',
        progress: 18,
        runner_backend: 'VIRTUAL_FS',
        staged_files: result.scout_files || [`poc/${result.project_slug}.rs`, `Cargo.toml`],
        dependencies: result.scout_deps || ['tokio', 'anyhow'],
        handoff_summary: `Scaffolded initial harness and dependencies for "${rawInput.slice(0, 45)}". Ready to iterate without starting from scratch.`,
        skeleton_code: `// Autonomous Scout Skeleton\n// Project: ${result.project_slug}\n// Target: Half-built prototype staging\n\n#[derive(Debug, Clone)]\npub struct ${result.project_slug.split('-').map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join('')}Engine {\n    pub initialized: bool,\n}\n\nimpl ${result.project_slug.split('-').map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join('')}Engine {\n    pub async fn bootstrap() -> Result<Self, Box<dyn std::error::Error>> {\n        tracing::info!("Incubated engine starting up...");\n        Ok(Self { initialized: true })\n    }\n}`,
        logs: [
          `Triaged raw thought: "${rawInput.slice(0, 50)}..."`,
          `Classification: Tangent + High Conviction. Prevented cognitive loss.`,
          `Scouted candidate dependencies and mapped module boundaries.`,
          `Staging boilerplate directory structure and test harness...`,
        ],
        created_at: Date.now(),
      };
    }

    if (result.quadrant === 'ACTIVE_PIPELINE') {
      item.atomic_tasks = (result.atomic_tasks || []).map((t, idx, arr) => ({
        id: `step_${id}_${idx + 1}`,
        item_id: id,
        project_title: rawInput.slice(0, 32),
        prompt: t.prompt,
        hint: t.hint,
        estimated_seconds: t.estimated_seconds,
        completed: false,
        step_number: idx + 1,
        total_steps: arr.length,
      }));
    }

    return item;
  }
}
