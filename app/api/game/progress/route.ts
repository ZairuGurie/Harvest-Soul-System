import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/session";
import { loadPlayerProgress, listAchievements } from "@/lib/game";

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
    return NextResponse.json({
      authenticated: true,
      progress,
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
