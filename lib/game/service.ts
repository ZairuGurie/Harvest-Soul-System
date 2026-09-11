import { createAdminClient } from "@/lib/supabase/server";
import {
  SEED_ACHIEVEMENTS,
  getSeedScenario,
  listSeedScenarios,
} from "./content";
import { applyChoiceToProgress } from "./progression";
import { isScenarioUnlocked } from "./unlock";
import type {
  GameAchievement,
  GameChoice,
  GameScenario,
  PlayerProgressState,
  ScenarioResolveResult,
} from "./types";
import { EMPTY_PROGRESS } from "./types";

function mapChoiceRow(row: Record<string, unknown>): GameChoice {
  return {
    id: String(row.id),
    scenarioId: String(row.scenario_id),
    sortOrder: Number(row.sort_order) || 0,
    choiceText: String(row.choice_text || ""),
    consequence: String(row.consequence || ""),
    isPreferred: Boolean(row.is_preferred),
    xpReward: Math.max(0, Number(row.xp_reward) || 0),
    nextScenarioId: row.next_scenario_id ? String(row.next_scenario_id) : null,
    flagsGranted: Array.isArray(row.flags_granted)
      ? (row.flags_granted as string[])
      : typeof row.flags_granted === "string"
        ? (() => {
            try {
              return JSON.parse(row.flags_granted) as string[];
            } catch {
              return [];
            }
          })()
        : [],
  };
}

function mapScenarioRow(
  row: Record<string, unknown>,
  choices: GameChoice[]
): GameScenario {
  const mapSpot = String(row.map_spot || "square");
  const mapId = String(row.map_id || mapSpotToMapId(mapSpot));
  return {
    id: String(row.id),
    levelNumber: Number(row.level_number) || Number(row.sort_order) || 1,
    chapter: Number(row.chapter) || 1,
    sortOrder: Number(row.sort_order) || 0,
    theme: String(row.theme || ""),
    title: String(row.title || ""),
    situation: String(row.situation || ""),
    scriptureReference: String(row.scripture_reference || ""),
    scriptureReferences: row.scripture_references
      ? Array.isArray(row.scripture_references)
        ? (row.scripture_references as string[])
        : String(row.scripture_references)
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
      : undefined,
    explanation: String(row.explanation || ""),
    reflectionPrompt: String(row.reflection_prompt || ""),
    npcName: String(row.npc_name || "Friend"),
    npcId: String(row.npc_id || slugifyNpc(String(row.npc_name || "friend"))),
    mapId,
    spawnX: Number(row.spawn_x) || defaultSpawn(mapSpot).x,
    spawnZ: Number(row.spawn_z) || defaultSpawn(mapSpot).z,
    mapSpot,
    isActive: row.is_active !== false,
    prerequisiteScenarioId: row.prerequisite_scenario_id
      ? String(row.prerequisite_scenario_id)
      : null,
    requiredChoiceId: row.required_choice_id ? String(row.required_choice_id) : null,
    requiredFlags: Array.isArray(row.required_flags)
      ? (row.required_flags as string[])
      : [],
    choices,
  };
}

function slugifyNpc(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "npc";
}

function mapSpotToMapId(mapSpot: string): string {
  if (mapSpot === "market") return "market_district";
  if (mapSpot === "school") return "school_yard";
  return "village_center";
}

function defaultSpawn(mapSpot: string): { x: number; z: number } {
  if (mapSpot === "market") return { x: 220, z: 400 };
  if (mapSpot === "school") return { x: 760, z: 380 };
  return { x: 480, z: 220 };
}

function enrichFromSeed(scenario: GameScenario): GameScenario {
  const seed = getSeedScenario(scenario.id);
  if (!seed) return scenario;
  return {
    ...seed,
    ...scenario,
    // DB nulls must not wipe seed unlock / placement metadata.
    npcId: scenario.npcId || seed.npcId,
    mapId: scenario.mapId || seed.mapId,
    spawnX: scenario.spawnX || seed.spawnX,
    spawnZ: scenario.spawnZ || seed.spawnZ,
    levelNumber: scenario.levelNumber || seed.levelNumber,
    prerequisiteScenarioId:
      scenario.prerequisiteScenarioId ?? seed.prerequisiteScenarioId ?? null,
    requiredChoiceId: scenario.requiredChoiceId ?? seed.requiredChoiceId ?? null,
    requiredFlags:
      scenario.requiredFlags?.length ? scenario.requiredFlags : seed.requiredFlags ?? [],
    choices: scenario.choices.length ? scenario.choices : seed.choices,
  };
}

function assertNoSupabaseError(
  error: { message?: string } | null | undefined,
  action: string
) {
  if (error) {
    throw new Error(`${action}: ${error.message || "database error"}`);
  }
}

export async function listScenarios(chapter?: number): Promise<GameScenario[]> {
  try {
    const admin = createAdminClient();
    let query = admin
      .from("game_scenarios")
      .select("*")
      .eq("is_active", true)
      .order("level_number", { ascending: true })
      .order("sort_order", { ascending: true });
    if (chapter != null) query = query.eq("chapter", chapter);

    const { data: scenarios, error } = await query;
    if (error || !scenarios?.length) {
      return listSeedScenarios(chapter);
    }

    const ids = scenarios.map((s) => s.id as string);
    const { data: choiceRows } = await admin
      .from("game_choices")
      .select("*")
      .in("scenario_id", ids)
      .order("sort_order", { ascending: true });

    const byScenario = new Map<string, GameChoice[]>();
    for (const row of choiceRows ?? []) {
      const choice = mapChoiceRow(row as Record<string, unknown>);
      const list = byScenario.get(choice.scenarioId) ?? [];
      list.push(choice);
      byScenario.set(choice.scenarioId, list);
    }

    return scenarios.map((row) =>
      enrichFromSeed(
        mapScenarioRow(
          row as Record<string, unknown>,
          byScenario.get(String(row.id)) ?? []
        )
      )
    );
  } catch {
    return listSeedScenarios(chapter);
  }
}

export async function listAllScenarios(): Promise<GameScenario[]> {
  return listScenarios();
}

export async function getScenario(id: string): Promise<GameScenario | null> {
  try {
    const admin = createAdminClient();
    const { data: row, error } = await admin
      .from("game_scenarios")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error || !row) return getSeedScenario(id);

    const { data: choiceRows } = await admin
      .from("game_choices")
      .select("*")
      .eq("scenario_id", id)
      .order("sort_order", { ascending: true });

    const choices = (choiceRows ?? []).map((c) =>
      mapChoiceRow(c as Record<string, unknown>)
    );
    return enrichFromSeed(mapScenarioRow(row as Record<string, unknown>, choices));
  } catch {
    return getSeedScenario(id);
  }
}

export async function loadPlayerProgress(userId: string): Promise<PlayerProgressState> {
  try {
    const admin = createAdminClient();
    // Prefer core columns; decision_flags is expansion-only.
    let profile: Record<string, unknown> | null = null;
    const withFlags = await admin
      .from("game_profiles")
      .select("xp, level, current_chapter, decision_flags")
      .eq("user_id", userId)
      .maybeSingle();
    if (withFlags.error?.message?.toLowerCase().includes("decision_flags")) {
      const core = await admin
        .from("game_profiles")
        .select("xp, level, current_chapter")
        .eq("user_id", userId)
        .maybeSingle();
      profile = (core.data as Record<string, unknown> | null) ?? null;
    } else {
      profile = (withFlags.data as Record<string, unknown> | null) ?? null;
    }

    const { data: progressRows } = await admin
      .from("game_progress")
      .select("scenario_id, choice_id")
      .eq("user_id", userId);

    const { data: achievementRows } = await admin
      .from("game_player_achievements")
      .select("achievement_id")
      .eq("user_id", userId);

    if (!profile && !(progressRows ?? []).length) {
      return { ...EMPTY_PROGRESS };
    }

    const choicesByScenario: Record<string, string> = {};
    const completedScenarioIds: string[] = [];
    for (const row of progressRows ?? []) {
      const sid = String(row.scenario_id);
      completedScenarioIds.push(sid);
      choicesByScenario[sid] = String(row.choice_id);
    }

    let decisionFlags: string[] = [];
    if (Array.isArray(profile?.decision_flags)) {
      decisionFlags = (profile.decision_flags as string[]).map(String);
    }

    return {
      xp: Number(profile?.xp) || 0,
      level: Number(profile?.level) || 1,
      currentChapter: Number(profile?.current_chapter) || 1,
      completedScenarioIds,
      achievementIds: (achievementRows ?? []).map((r) => String(r.achievement_id)),
      choicesByScenario,
      decisionFlags,
    };
  } catch {
    return { ...EMPTY_PROGRESS };
  }
}

export async function resolveScenarioChoice(args: {
  userId: string | null;
  scenarioId: string;
  choiceId: string;
  localProgress?: PlayerProgressState;
}): Promise<ScenarioResolveResult | { error: string }> {
  const scenario = await getScenario(args.scenarioId);
  if (!scenario) return { error: "Scenario not found." };

  const choice = scenario.choices.find((c) => c.id === args.choiceId);
  if (!choice || choice.scenarioId !== scenario.id) {
    return { error: "Invalid choice for this scenario." };
  }

  const allScenarios = await listAllScenarios();
  const current =
    args.userId != null
      ? await loadPlayerProgress(args.userId)
      : { ...(args.localProgress ?? EMPTY_PROGRESS) };

  if (
    !current.completedScenarioIds.includes(scenario.id) &&
    !isScenarioUnlocked(scenario, current, allScenarios)
  ) {
    return {
      error:
        "This level is locked on your cloud save. Finish the previous conversation first, then try again.",
    };
  }

  const applied = applyChoiceToProgress(current, {
    scenario,
    choiceId: choice.id,
    xpReward: choice.xpReward,
    allScenarios,
  });

  if (args.userId && !applied.alreadyCompleted) {
    try {
      await persistProgress(args.userId, applied.next, {
        scenarioId: scenario.id,
        choiceId: choice.id,
        xpEarned: applied.xpEarned,
        newAchievements: applied.newlyEarnedAchievements,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to save progress.";
      console.error("[resolveScenarioChoice] persist failed:", message);
      return { error: message };
    }
  }

  // Always return cloud truth for signed-in players so the client cannot
  // drift ahead of what unlock checks will see on the next request.
  const progress =
    args.userId != null
      ? await loadPlayerProgress(args.userId)
      : applied.next;

  // If cloud reload lost the just-saved completion (rare read failure),
  // fall back to the in-memory applied state so unlock stays consistent.
  if (
    args.userId &&
    !applied.alreadyCompleted &&
    !progress.completedScenarioIds.includes(scenario.id)
  ) {
    console.warn(
      "[resolveScenarioChoice] cloud reload missing completion; using applied state"
    );
    return {
      scenario,
      choice,
      xpEarned: applied.xpEarned,
      xpTotal: applied.next.xp,
      level: applied.next.level,
      leveledUp: applied.leveledUp,
      newlyEarnedAchievements: applied.newlyEarnedAchievements,
      alreadyCompleted: applied.alreadyCompleted,
      nextScenarioId: applied.nextScenarioId,
      progress: applied.next,
    };
  }

  return {
    scenario,
    choice,
    xpEarned: applied.xpEarned,
    xpTotal: progress.xp,
    level: progress.level,
    leveledUp: applied.leveledUp,
    newlyEarnedAchievements: applied.newlyEarnedAchievements,
    alreadyCompleted: applied.alreadyCompleted,
    nextScenarioId: applied.nextScenarioId,
    progress,
  };
}

async function persistProgress(
  userId: string,
  next: PlayerProgressState,
  event: {
    scenarioId: string;
    choiceId: string;
    xpEarned: number;
    newAchievements: GameAchievement[];
  }
) {
  const admin = createAdminClient();
  const now = new Date().toISOString();

  // 1) Scenario completion first — this is what unlock checks read.
  const progressResult = await admin.from("game_progress").upsert(
    {
      user_id: userId,
      scenario_id: event.scenarioId,
      choice_id: event.choiceId,
      xp_earned: event.xpEarned,
      completed_at: now,
    },
    { onConflict: "user_id,scenario_id" }
  );
  assertNoSupabaseError(progressResult.error, "Saving scenario progress");

  // 2) Profile XP/level — write core columns first (works without expansion migration).
  const profileBase = {
    user_id: userId,
    xp: next.xp,
    level: next.level,
    current_chapter: next.currentChapter,
    updated_at: now,
  };
  const profileResult = await admin
    .from("game_profiles")
    .upsert(profileBase, { onConflict: "user_id" });
  assertNoSupabaseError(profileResult.error, "Saving game profile");

  // Optional expansion column — never block core progress if missing.
  if ((next.decisionFlags ?? []).length > 0) {
    const flagsResult = await admin
      .from("game_profiles")
      .update({ decision_flags: next.decisionFlags ?? [] })
      .eq("user_id", userId);
    if (flagsResult.error) {
      console.warn(
        "[persistProgress] decision_flags not saved:",
        flagsResult.error.message
      );
    }
  }

  // 3) Achievements — ensure catalog rows exist, skip soft failures.
  for (const achievement of event.newAchievements) {
    const catalogResult = await admin.from("game_achievements").upsert(
      {
        id: achievement.id,
        name: achievement.name,
        description: achievement.description,
      },
      { onConflict: "id" }
    );
    if (catalogResult.error) {
      console.warn(
        "[persistProgress] achievement catalog:",
        catalogResult.error.message
      );
      continue;
    }
    const achievementResult = await admin.from("game_player_achievements").upsert(
      {
        user_id: userId,
        achievement_id: achievement.id,
        earned_at: now,
      },
      { onConflict: "user_id,achievement_id" }
    );
    if (achievementResult.error) {
      console.warn(
        "[persistProgress] player achievement:",
        achievementResult.error.message
      );
    }
  }
}

/** Persist a server-derived merged progress snapshot (e.g. guest→cloud merge). */
export async function persistMergedProgress(
  userId: string,
  next: PlayerProgressState
): Promise<void> {
  const admin = createAdminClient();
  const now = new Date().toISOString();
  const allScenarios = await listAllScenarios();
  const choiceById = new Map<string, { scenarioId: string; xp: number }>();
  for (const s of allScenarios) {
    for (const c of s.choices) {
      choiceById.set(c.id, { scenarioId: s.id, xp: c.xpReward });
    }
  }

  for (const scenarioId of next.completedScenarioIds) {
    const choiceId = next.choicesByScenario[scenarioId];
    if (!choiceId) continue;
    const meta = choiceById.get(choiceId);
    const progressResult = await admin.from("game_progress").upsert(
      {
        user_id: userId,
        scenario_id: scenarioId,
        choice_id: choiceId,
        xp_earned: meta?.xp ?? 0,
        completed_at: now,
      },
      { onConflict: "user_id,scenario_id" }
    );
    assertNoSupabaseError(progressResult.error, "Saving merged scenario progress");
  }

  const profileResult = await admin.from("game_profiles").upsert(
    {
      user_id: userId,
      xp: next.xp,
      level: next.level,
      current_chapter: next.currentChapter,
      updated_at: now,
    },
    { onConflict: "user_id" }
  );
  assertNoSupabaseError(profileResult.error, "Saving merged game profile");

  if ((next.decisionFlags ?? []).length > 0) {
    const flagsResult = await admin
      .from("game_profiles")
      .update({ decision_flags: next.decisionFlags ?? [] })
      .eq("user_id", userId);
    if (flagsResult.error) {
      console.warn(
        "[persistMergedProgress] decision_flags not saved:",
        flagsResult.error.message
      );
    }
  }

  for (const achievementId of next.achievementIds) {
    const def = SEED_ACHIEVEMENTS.find((a) => a.id === achievementId);
    if (def) {
      await admin.from("game_achievements").upsert(
        { id: def.id, name: def.name, description: def.description },
        { onConflict: "id" }
      );
    }
    const achievementResult = await admin.from("game_player_achievements").upsert(
      {
        user_id: userId,
        achievement_id: achievementId,
        earned_at: now,
      },
      { onConflict: "user_id,achievement_id" }
    );
    if (achievementResult.error) {
      console.warn(
        "[persistMergedProgress] player achievement:",
        achievementResult.error.message
      );
    }
  }
}

export function listAchievements(): GameAchievement[] {
  return SEED_ACHIEVEMENTS;
}

export function publicScenarioView(scenario: GameScenario, opts?: { reveal?: boolean }) {
  const reveal = opts?.reveal === true;
  return {
    id: scenario.id,
    levelNumber: scenario.levelNumber,
    chapter: scenario.chapter,
    sortOrder: scenario.sortOrder,
    theme: scenario.theme,
    title: scenario.title,
    situation: scenario.situation,
    scriptureReference: scenario.scriptureReference,
    scriptureReferences: scenario.scriptureReferences,
    explanation: reveal ? scenario.explanation : undefined,
    reflectionPrompt: reveal ? scenario.reflectionPrompt : undefined,
    npcName: scenario.npcName,
    npcId: scenario.npcId,
    mapId: scenario.mapId,
    mapSpot: scenario.mapSpot,
    spawnX: scenario.spawnX,
    spawnZ: scenario.spawnZ,
    choices: scenario.choices.map((c) => ({
      id: c.id,
      sortOrder: c.sortOrder,
      choiceText: c.choiceText,
      // Hide scoring / preferred / branch metadata until after server resolve
    })),
  };
}
