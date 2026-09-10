"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { PlayerProgressState } from "@/lib/game/types";
import { applyChoiceToProgress } from "@/lib/game/progression";
import { listSeedScenarios } from "@/lib/game/content";
import { loadLocalProgress, saveLocalProgress } from "@/lib/game/localProgress";
import GameMovementPanel from "./GameMovementPanel";
import ScenarioOverlay, { type ScenarioResolvePayload } from "./ScenarioOverlay";
import type { StandFirmBootData } from "./standFirmConfig";
import type { StandFirmGameHandle } from "./StandFirmWorld";

export default function GameCanvas({
  initialProgress,
  authenticated,
}: {
  initialProgress: PlayerProgressState | null;
  authenticated: boolean;
}) {
  const shellRef = useRef<HTMLDivElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<StandFirmGameHandle | null>(null);
  const nearbyRef = useRef<{ scenarioId: string; name: string } | null>(null);
  const panelActiveRef = useRef(true);
  const overlayOpenRef = useRef(false);

  const [progress, setProgress] = useState<PlayerProgressState>(() =>
    initialProgress ?? loadLocalProgress()
  );
  const [ready, setReady] = useState(false);
  const [bootError, setBootError] = useState<string | null>(null);
  const [active, setActive] = useState<{ scenarioId: string; npcName: string } | null>(
    null
  );
  const [nearbyHint, setNearbyHint] = useState<string | null>(null);
  const [panelActive, setPanelActive] = useState(true);

  const openScenario = useCallback((scenarioId: string, npcName: string) => {
    nearbyRef.current = { scenarioId, name: npcName };
    overlayOpenRef.current = true;
    gameRef.current?.setLocked(true);
    setActive({ scenarioId, npcName });
  }, []);

  useEffect(() => {
    panelActiveRef.current = panelActive;
  }, [panelActive]);

  useEffect(() => {
    overlayOpenRef.current = Boolean(active);
  }, [active]);

  useEffect(() => {
    if (!authenticated) {
      saveLocalProgress(progress);
    }
  }, [progress, authenticated]);

  useEffect(() => {
    let cancelled = false;
    let game: StandFirmGameHandle | null = null;

    (async () => {
      try {
        if (!hostRef.current) return;
        const { createStandFirmGame } = await import("./StandFirmWorld");
        if (cancelled || !hostRef.current) return;

        if (gameRef.current) {
          gameRef.current.destroy(true);
          gameRef.current = null;
        }
        hostRef.current.innerHTML = "";

        const boot: StandFirmBootData = {
          completedScenarioIds: progress.completedScenarioIds,
          isInputActive: () => panelActiveRef.current && !overlayOpenRef.current,
          onInteract: (scenarioId, npcName) => {
            openScenario(scenarioId, npcName);
          },
          onNearbyChange: (nearby) => {
            nearbyRef.current = nearby;
            setNearbyHint(nearby ? `Talk with ${nearby.name} (E)` : null);
          },
          onReady: () => {
            if (!cancelled) {
              setReady(true);
              // Own keyboard focus inside the game panel so arrows don't scroll the page.
              shellRef.current?.focus({ preventScroll: true });
            }
          },
          onError: (message) => {
            if (!cancelled) setBootError(message);
          },
        };

        game = createStandFirmGame(hostRef.current, boot);
        gameRef.current = game;
      } catch {
        if (!cancelled) setBootError("Unable to load the 3D village. Please try again.");
      }
    })();

    return () => {
      cancelled = true;
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      } else if (game) {
        game.destroy(true);
      }
    };
    // Mount once for the play session; progress updates handled via game API.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function closeOverlay() {
    overlayOpenRef.current = false;
    setActive(null);
    gameRef.current?.setLocked(false);
    shellRef.current?.focus({ preventScroll: true });
  }

  function handleResolved(data: ScenarioResolvePayload) {
    if (!data.scenario || !data.choice || !data.progress) return;

    const chapterIds = listSeedScenarios(1).map((s) => s.id);
    if (!authenticated) {
      const applied = applyChoiceToProgress(progress, {
        scenarioId: data.scenario.id,
        choiceId: data.choice.id,
        xpReward: data.progress.xpEarned || 0,
        theme: "",
        chapterScenarioIds: chapterIds,
      });
      const next: PlayerProgressState = data.alreadyCompleted
        ? progress
        : {
            ...applied.next,
            xp: data.progress.xp,
            level: data.progress.level,
            achievementIds: [
              ...new Set([
                ...applied.next.achievementIds,
                ...(data.progress.newlyEarnedAchievements?.map((a) => a.id) ?? []),
              ]),
            ],
          };
      setProgress(next);
      saveLocalProgress(next);
    } else {
      setProgress((prev) => ({
        ...prev,
        xp: data.progress!.xp,
        level: data.progress!.level,
        completedScenarioIds: prev.completedScenarioIds.includes(data.scenario!.id)
          ? prev.completedScenarioIds
          : [...prev.completedScenarioIds, data.scenario!.id],
        achievementIds: [
          ...new Set([
            ...prev.achievementIds,
            ...(data.progress!.newlyEarnedAchievements?.map((a) => a.id) ?? []),
          ]),
        ],
        choicesByScenario: {
          ...prev.choicesByScenario,
          [data.scenario!.id]: data.choice!.id,
        },
      }));
    }

    gameRef.current?.markCompleted(data.scenario.id);
  }

  return (
    <div
      ref={shellRef}
      tabIndex={0}
      role="application"
      aria-label="STAND FIRM game panel"
      className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-[#0b1220] shadow-xl outline-none focus-visible:ring-2 focus-visible:ring-harvest-gold/70 dark:border-white/10"
      style={{ overscrollBehavior: "contain", touchAction: "manipulation" }}
      onFocus={() => setPanelActive(true)}
      onBlur={(e) => {
        // Stay active while focus moves inside the panel (pad / Talk / overlay).
        if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
        setPanelActive(false);
      }}
      onPointerDown={() => {
        setPanelActive(true);
        shellRef.current?.focus({ preventScroll: true });
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-3 py-2.5 text-xs text-slate-200 sm:px-4">
        <div className="flex flex-wrap items-center gap-3">
          <span>
            Level <strong className="text-white">{progress.level}</strong>
          </span>
          <span>
            XP <strong className="text-white">{progress.xp}</strong>
          </span>
          <span>
            Completed{" "}
            <strong className="text-white">{progress.completedScenarioIds.length}</strong>
          </span>
          {!panelActive ? (
            <span className="text-amber-200/90">Click game to control</span>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          {!authenticated ? (
            <Link
              href="/login?next=/game/play"
              className="rounded-lg border border-white/20 px-2.5 py-1 hover:bg-white/10"
            >
              Sign in to save
            </Link>
          ) : (
            <span className="text-emerald-300">Cloud save on</span>
          )}
          <Link href="/game" className="rounded-lg border border-white/20 px-2.5 py-1 hover:bg-white/10">
            Exit
          </Link>
        </div>
      </div>

      <div className="relative aspect-3/2 w-full bg-[#9ec9ef]">
        <div ref={hostRef} className="absolute inset-0 [&_canvas]:h-full! [&_canvas]:w-full!" />
        {!ready && !bootError ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#0b1220]/40 text-sm text-white">
            Loading 3D village…
          </div>
        ) : null}
        {bootError ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#0b1220]/80 p-6 text-center text-sm text-white">
            <div>
              <p>{bootError}</p>
              <Link href="/game" className="mt-3 inline-block text-harvest-gold underline">
                Return to Game Center
              </Link>
            </div>
          </div>
        ) : null}

        {nearbyHint && !active ? (
          <div className="pointer-events-none absolute top-3 left-1/2 z-20 -translate-x-1/2 rounded-lg bg-[#0b1220]/85 px-3 py-1.5 text-xs font-medium text-white shadow-md">
            {nearbyHint}
          </div>
        ) : null}

        <GameMovementPanel
          disabled={Boolean(active)}
          canTalk={Boolean(nearbyHint)}
          onInteract={() => {
            if (nearbyRef.current) {
              openScenario(nearbyRef.current.scenarioId, nearbyRef.current.name);
            }
          }}
        />

        {active ? (
          <ScenarioOverlay
            scenarioId={active.scenarioId}
            npcName={active.npcName}
            localProgress={progress}
            onClose={closeOverlay}
            onResolved={handleResolved}
          />
        ) : null}
      </div>

      <p className="px-3 py-2 text-[11px] text-slate-400 sm:px-4">
        Use the on-screen pad or WASD / arrows while the game panel is focused. E or Talk to
        speak. Movement stays inside this panel and will not scroll the page or trigger site
        navigation. Progress is educational only — not spiritual status.
      </p>
    </div>
  );
}
