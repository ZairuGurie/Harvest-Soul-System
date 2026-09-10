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

    const scripture = await resolveGameScripture(scenario.scriptureReference);
    return NextResponse.json({
      scenario: publicScenarioView(scenario),
      scripture: scripture
        ? {
            reference: scripture.reference,
            text: scripture.text,
            translation: scripture.translation.abbreviation,
            href: scripture.href,
          }
        : null,
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

    const scripture = await resolveGameScripture(result.scenario.scriptureReference);

    return NextResponse.json({
      authenticated: Boolean(user),
      alreadyCompleted: result.alreadyCompleted,
      choice: {
        id: result.choice.id,
        choiceText: result.choice.choiceText,
        consequence: result.choice.consequence,
      },
      scenario: {
        id: result.scenario.id,
        title: result.scenario.title,
        explanation: result.scenario.explanation,
        reflectionPrompt: result.scenario.reflectionPrompt,
        scriptureReference: result.scenario.scriptureReference,
      },
      scripture: scripture
        ? {
            reference: scripture.reference,
            text: scripture.text,
            translation: scripture.translation.abbreviation,
            href: scripture.href,
          }
        : null,
      progress: {
        xpEarned: result.xpEarned,
        xp: result.xpTotal,
        level: result.level,
        leveledUp: result.leveledUp,
        newlyEarnedAchievements: result.newlyEarnedAchievements,
      },
      saved: Boolean(user) && !result.alreadyCompleted,
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to resolve this choice. Please try again." },
      { status: 500 }
    );
  }
}
