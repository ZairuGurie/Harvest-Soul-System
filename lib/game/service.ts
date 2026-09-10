import { createAdminClient } from "@/lib/supabase/server";
import { SEED_ACHIEVEMENTS, SEED_SCENARIOS, getSeedScenario, listSeedScenarios } from "./content";
import { applyChoiceToProgress } from "./progression";
import type {
  GameAchievement,
  GameChoice,
  GameScenario,
  PlayerProgressState,
  ScenarioResolveResult,
} from "./types";
import { EMPTY_PROGRESS } from "./types";

function mapScenarioRow(
  row: Record<string, unknown>,
  choices: GameChoice[]
): GameScenario {
  return {
    id: String(row.id),
    chapter: Number(row.chapter) || 1,
    sortOrder: Number(row.sort_order) || 0,
    theme: String(row.theme || ""),
    title: String(row.title || ""),
    situation: String(row.situation || ""),
    scriptureReference: String(row.scripture_reference || ""),
    explanation: String(row.explanation || ""),
    reflectionPrompt: String(row.reflection_prompt || ""),
    npcName: String(row.npc_name || "Friend"),
    mapSpot: String(row.map_spot || "square"),
    isActive: row.is_active !== false,
    choices,
  };
}

function mapChoiceRow(row: Record<string, unknown>): GameChoice {
  return {
    id: String(row.id),
    scenarioId: String(row.scenario_id),
    sortOrder: Number(row.sort_order) || 0,
    choiceText: String(row.choice_text || ""),
    consequence: String(row.consequence || ""),
    isPreferred: Boolean(row.is_preferred),
    xpReward: Math.max(0, Number(row.xp_reward) || 0),
  };
}

export async function listScenarios(chapter?: number): Promise<GameScenario[]> {
  try {
    const admin = createAdminClient();
    let query = admin
      .from("game_scenarios")
      .select("*")
      .eq("is_active", true)
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
      mapScenarioRow(row as Record<string, unknown>, byScenario.get(String(row.id)) ?? [])
    );
  } catch {
    return listSeedScenarios(chapter);
  }
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

    const choices = (choiceRows ?? []).map((c) => mapChoiceRow(c as Record<string, unknown>));
    return mapScenarioRow(row as Record<string, unknown>, choices);
  } catch {
    return getSeedScenario(id);
  }
}

export async function loadPlayerProgress(userId: string): Promise<PlayerProgressState> {
  try {
    const admin = createAdminClient();
    const { data: profile } = await admin
      .from("game_profiles")
      .select("xp, level, current_chapter")
      .eq("user_id", userId)
      .maybeSingle();

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

    return {
      xp: Number(profile?.xp) || 0,
      level: Number(profile?.level) || 1,
      currentChapter: Number(profile?.current_chapter) || 1,
      completedScenarioIds,
      achievementIds: (achievementRows ?? []).map((r) => String(r.achievement_id)),
      choicesByScenario,
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

  const chapterScenarios = (await listScenarios(scenario.chapter)).map((s) => s.id);
  const current =
    args.userId != null
      ? await loadPlayerProgress(args.userId)
      : { ...(args.localProgress ?? EMPTY_PROGRESS) };

  const applied = applyChoiceToProgress(current, {
    scenarioId: scenario.id,
    choiceId: choice.id,
    xpReward: choice.xpReward,
    theme: scenario.theme,
    chapterScenarioIds: chapterScenarios,
  });

  if (args.userId && !applied.alreadyCompleted) {
    await persistProgress(args.userId, applied.next, {
      scenarioId: scenario.id,
      choiceId: choice.id,
      xpEarned: applied.xpEarned,
      newAchievements: applied.newlyEarnedAchievements,
    });
  }

  return {
    scenario,
    choice,
    xpEarned: applied.xpEarned,
    xpTotal: applied.next.xp,
    level: applied.next.level,
    leveledUp: applied.leveledUp,
    newlyEarnedAchievements: applied.newlyEarnedAchievements,
    alreadyCompleted: applied.alreadyCompleted,
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

  await admin.from("game_profiles").upsert(
    {
      user_id: userId,
      xp: next.xp,
      level: next.level,
      current_chapter: next.currentChapter,
      updated_at: now,
    },
    { onConflict: "user_id" }
  );

  await admin.from("game_progress").upsert(
    {
      user_id: userId,
      scenario_id: event.scenarioId,
      choice_id: event.choiceId,
      xp_earned: event.xpEarned,
      completed_at: now,
    },
    { onConflict: "user_id,scenario_id" }
  );

  for (const achievement of event.newAchievements) {
    await admin.from("game_player_achievements").upsert(
      {
        user_id: userId,
        achievement_id: achievement.id,
        earned_at: now,
      },
      { onConflict: "user_id,achievement_id" }
    );
  }
}

export function listAchievements(): GameAchievement[] {
  return SEED_ACHIEVEMENTS;
}

export function publicScenarioView(scenario: GameScenario, opts?: { reveal?: boolean }) {
  const reveal = opts?.reveal === true;
  return {
    id: scenario.id,
    chapter: scenario.chapter,
    sortOrder: scenario.sortOrder,
    theme: scenario.theme,
    title: scenario.title,
    situation: scenario.situation,
    scriptureReference: scenario.scriptureReference,
    explanation: reveal ? scenario.explanation : undefined,
    reflectionPrompt: reveal ? scenario.reflectionPrompt : undefined,
    npcName: scenario.npcName,
    mapSpot: scenario.mapSpot,
    choices: scenario.choices.map((c) => ({
      id: c.id,
      sortOrder: c.sortOrder,
      choiceText: c.choiceText,
      // Hide scoring / preferred flag until after server resolve
    })),
  };
}
