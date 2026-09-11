import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/session";
import {
  loadPlayerProgress,
  listAchievements,
  listAllScenarios,
  mergeGuestAndCloudProgress,
  persistMergedProgress,
  normalizeProgress,
  buildJourneySummary,
  xpIntoLevel,
  type PlayerProgressState,
} from "@/lib/game";

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({
        authenticated: false,
        progress: null,
        message: "Sign in to save and restore cloud progress.",
      });
    }

    const progress = await loadPlayerProgress(user.id);
    const scenarios = await listAllScenarios();
    const xpBar = xpIntoLevel(progress.xp);
    return NextResponse.json({
      authenticated: true,
      progress: { ...progress, xpInto: xpBar.into, xpNeed: xpBar.need },
      journey: buildJourneySummary(progress, scenarios),
      achievements: listAchievements().filter((a) =>
        progress.achievementIds.includes(a.id)
      ),
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to load progress." },
      { status: 500 }
    );
  }
}

type MergeBody = {
  guestProgress?: PlayerProgressState;
};

/**
 * Merge guest localStorage progress into authenticated cloud progress.
 * XP is recalculated from authoritative scenario choices — never summed blindly.
 */
export async function POST(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    }

    const body = (await request.json()) as MergeBody;
    const guest = normalizeProgress(body.guestProgress);
    const cloud = await loadPlayerProgress(user.id);
    const scenarios = await listAllScenarios();
    const merged = mergeGuestAndCloudProgress(guest, cloud, scenarios);
    await persistMergedProgress(user.id, merged);

    return NextResponse.json({
      ok: true,
      progress: merged,
      journey: buildJourneySummary(merged, scenarios),
      message:
        "Guest and cloud progress were merged. Completed scenarios were combined; conflicting choices kept the cloud choice.",
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to merge progress." },
      { status: 500 }
    );
  }
}
