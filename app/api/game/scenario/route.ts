import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/session";
import {
  EMPTY_PROGRESS,
  getScenario,
  publicScenarioView,
  resolveGameScripture,
  resolveScenarioChoice,
  type PlayerProgressState,
} from "@/lib/game";

type Body = {
  scenarioId?: string;
  choiceId?: string;
  localProgress?: PlayerProgressState;
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing scenario id." }, { status: 400 });
    }

    const scenario = await getScenario(id);
    if (!scenario) {
      return NextResponse.json({ error: "Scenario not found." }, { status: 404 });
    }

    const refs = [
      scenario.scriptureReference,
      ...(scenario.scriptureReferences ?? []),
    ].filter((v, i, arr) => v && arr.indexOf(v) === i);

    const scriptures = [];
    for (const ref of refs) {
      const scripture = await resolveGameScripture(ref);
      if (scripture) {
        scriptures.push({
          reference: scripture.reference,
          text: scripture.text,
          translation: scripture.translation.abbreviation,
          href: scripture.href,
        });
      }
    }

    return NextResponse.json({
      scenario: publicScenarioView(scenario),
      scripture: scriptures[0] ?? null,
      scriptures,
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to load this scenario." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Body;
    const scenarioId = String(body.scenarioId || "").trim();
    const choiceId = String(body.choiceId || "").trim();
    if (!scenarioId || !choiceId) {
      return NextResponse.json(
        { error: "scenarioId and choiceId are required." },
        { status: 400 }
      );
    }

    // Never accept client-submitted xp/level/achievements.
    const user = await getAuthUser();
    const result = await resolveScenarioChoice({
      userId: user?.id ?? null,
      scenarioId,
      choiceId,
      localProgress: body.localProgress ?? EMPTY_PROGRESS,
    });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const refs = [
      result.scenario.scriptureReference,
      ...(result.scenario.scriptureReferences ?? []),
    ].filter((v, i, arr) => v && arr.indexOf(v) === i);

    const scriptures = [];
    try {
      for (const ref of refs) {
        const scripture = await resolveGameScripture(ref);
        if (scripture) {
          scriptures.push({
            reference: scripture.reference,
            text: scripture.text,
            translation: scripture.translation.abbreviation,
            href: scripture.href,
          });
        }
      }
    } catch (err) {
      console.warn(
        "[api/game/scenario POST] scripture lookup failed:",
        err instanceof Error ? err.message : err
      );
    }

    return NextResponse.json({
      authenticated: Boolean(user),
      alreadyCompleted: result.alreadyCompleted,
      nextScenarioId: result.nextScenarioId,
      choice: {
        id: result.choice.id,
        choiceText: result.choice.choiceText,
        consequence: result.choice.consequence,
      },
      scenario: {
        id: result.scenario.id,
        title: result.scenario.title,
        levelNumber: result.scenario.levelNumber,
        chapter: result.scenario.chapter,
        explanation: result.scenario.explanation,
        reflectionPrompt: result.scenario.reflectionPrompt,
        scriptureReference: result.scenario.scriptureReference,
      },
      scripture: scriptures[0] ?? null,
      scriptures,
      progress: {
        xpEarned: result.xpEarned,
        xp: result.xpTotal,
        level: result.level,
        leveledUp: result.leveledUp,
        newlyEarnedAchievements: result.newlyEarnedAchievements,
        currentChapter: result.progress.currentChapter,
        completedScenarioIds: result.progress.completedScenarioIds,
        achievementIds: result.progress.achievementIds,
        choicesByScenario: result.progress.choicesByScenario,
        decisionFlags: result.progress.decisionFlags,
      },
      saved: Boolean(user) && !result.alreadyCompleted,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[api/game/scenario POST]", message, err);
    return NextResponse.json(
      {
        error: "Unable to resolve this choice. Please try again.",
        detail: message,
      },
      { status: 500 }
    );
  }
}
