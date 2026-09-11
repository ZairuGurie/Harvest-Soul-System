import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/session";
import {
  listAllScenarios,
  loadPlayerProgress,
  publicScenarioView,
  listAchievements,
  buildJourneySummary,
  GAME_CHAPTERS,
  TARGET_LEVEL_COUNT,
  TARGET_CHAPTER_COUNT,
  xpIntoLevel,
} from "@/lib/game";

export async function GET() {
  try {
    const scenarios = await listAllScenarios();
    const user = await getAuthUser();
    const progress = user ? await loadPlayerProgress(user.id) : null;
    const journey = progress ? buildJourneySummary(progress, scenarios) : null;
    const xpBar = progress ? xpIntoLevel(progress.xp) : null;

    return NextResponse.json({
      title: "STAND FIRM",
      subtitle: "A Christian Choice & Adventure",
      note:
        "Game XP and levels track learning progress only. They are not a measure of faith, holiness, or salvation.",
      meta: {
        targetLevels: TARGET_LEVEL_COUNT,
        targetChapters: TARGET_CHAPTER_COUNT,
        playableLevels: scenarios.filter((s) => s.isActive).length,
      },
      chapters: GAME_CHAPTERS,
      journey,
      scenarios: scenarios.map((s) => publicScenarioView(s)),
      achievements: listAchievements(),
      progress: progress
        ? {
            ...progress,
            xpInto: xpBar?.into,
            xpNeed: xpBar?.need,
          }
        : null,
      authenticated: Boolean(user),
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to load game content. Please try again." },
      { status: 500 }
    );
  }
}
