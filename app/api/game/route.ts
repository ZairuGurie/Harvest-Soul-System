import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/session";
import {
  listScenarios,
  loadPlayerProgress,
  publicScenarioView,
  listAchievements,
} from "@/lib/game";

export async function GET() {
  try {
    const scenarios = await listScenarios(1);
    const user = await getAuthUser();
    const progress = user ? await loadPlayerProgress(user.id) : null;

    return NextResponse.json({
      title: "STAND FIRM",
      subtitle: "A Christian Choice & Adventure",
      note:
        "Game XP and achievements track learning progress only. They are not a measure of faith or salvation.",
      scenarios: scenarios.map((s) => publicScenarioView(s)),
      achievements: listAchievements(),
      progress,
      authenticated: Boolean(user),
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to load game content. Please try again." },
      { status: 500 }
    );
  }
}
