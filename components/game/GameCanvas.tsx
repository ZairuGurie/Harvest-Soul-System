"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { GameMapId, GameScenario, PlayerProgressState } from "@/lib/game/types";
import { applyChoiceToProgress } from "@/lib/game/progression";
import { listSeedScenarios, getSeedScenario } from "@/lib/game/content";
import {
  buildNpcBindingsForMap,
  defaultPlayerSpawn,
  isScenarioUnlocked,
  mapIdForChapter,
  normalizeProgress,
  xpIntoLevel,
} from "@/lib/game";
import { loadLocalProgress, saveLocalProgress } from "@/lib/game/localProgress";
import {
  loadGraphicsQuality,
  saveGraphicsQuality,
  type GraphicsQuality,
} from "@/lib/game/quality";
import GameMovementPanel from "./GameMovementPanel";
import ScenarioOverlay, { type ScenarioResolvePayload } from "./ScenarioOverlay";
import { npcSpotsFromBindings, type StandFirmBootData } from "./standFirmConfig";
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
  const startingProgress: PlayerProgressState = authenticated
    ? normalizeProgress(initialProgress)
    : initialProgress ?? loadLocalProgress();

  const progressRef = useRef<PlayerProgressState>(startingProgress);

  const [progress, setProgress] = useState<PlayerProgressState>(startingProgress);
  const [scenarios, setScenarios] = useState<GameScenario[]>(() => listSeedScenarios());
  const [mapId, setMapId] = useState<GameMapId | string>(() =>
    mapIdForChapter(startingProgress.currentChapter || 1)
  );
  const [ready, setReady] = useState(false);
  const [bootError, setBootError] = useState<string | null>(null);
  const [active, setActive] = useState<{ scenarioId: string; npcName: string } | null>(
    null
  );
  const [nearbyHint, setNearbyHint] = useState<string | null>(null);
  const [panelActive, setPanelActive] = useState(true);
  const [gfx, setGfx] = useState<GraphicsQuality>("medium");

  progressRef.current = progress;

  const xpBar = useMemo(() => xpIntoLevel(progress.xp), [progress.xp]);

  const openScenario = useCallback((scenarioId: string, npcName: string) => {
    nearbyRef.current = { scenarioId, name: npcName };
    overlayOpenRef.current = true;
    gameRef.current?.setLocked(true);
    gameRef.current?.focusNpc(scenarioId);
    setActive({ scenarioId, npcName });
  }, []);

  useEffect(() => {
    panelActiveRef.current = panelActive;
  }, [panelActive]);

  useEffect(() => {
    overlayOpenRef.current = Boolean(active);
  }, [active]);

  useEffect(() => {
    // Keep a device backup even when signed in so guest→cloud merge can recover
    // if a cloud write ever fails mid-session.
    saveLocalProgress(progress);
  }, [progress]);

  useEffect(() => {
    setGfx(loadGraphicsQuality());
  }, []);

  // Load catalog + authoritative progress (and merge guest saves once when signed in)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/game");
        const data = await res.json();
        if (!res.ok || cancelled) return;
        setScenarios(listSeedScenarios());

        if (!authenticated) return;

        let cloud = data.progress ? normalizeProgress(data.progress) : normalizeProgress(null);
        const guest = loadLocalProgress();
        const guestHasProgress =
          guest.completedScenarioIds.length > 0 ||
          Object.keys(guest.choicesByScenario).length > 0;

        if (guestHasProgress) {
          try {
            const mergeRes = await fetch("/api/game/progress", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ guestProgress: guest }),
            });
            const mergeData = await mergeRes.json();
            if (mergeRes.ok && mergeData.progress) {
              cloud = normalizeProgress(mergeData.progress);
            }
          } catch {
            // keep cloud snapshot
          }
        }

        if (cancelled) return;
        setProgress(cloud);
        progressRef.current = cloud;
        saveLocalProgress(cloud);

        const catalog = listSeedScenarios();
        const bindings = buildNpcBindingsForMap(mapId, catalog, {
          completedScenarioIds: cloud.completedScenarioIds,
          isUnlocked: (s) => isScenarioUnlocked(s, cloud, catalog),
        });
        const statuses: Record<string, "available" | "completed" | "locked"> = {};
        for (const b of bindings) statuses[b.scenarioId] = b.status;
        gameRef.current?.syncNpcStatuses(statuses);
      } catch {
        // keep seed
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authenticated]);

  // Keep chapter map in sync with progress
  useEffect(() => {
    const nextMap = mapIdForChapter(progress.currentChapter || 1);
    // Prefer map of current playable scenario if available
    const current = scenarios
      .filter((s) => s.isActive && !progress.completedScenarioIds.includes(s.id))
      .filter((s) => isScenarioUnlocked(s, progress, scenarios))
      .sort((a, b) => a.levelNumber - b.levelNumber)[0];
    const desired = current?.mapId || nextMap;
    if (desired !== mapId) {
      setMapId(desired);
    }
  }, [progress, scenarios, mapId]);

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
        setReady(false);

        const bindings = buildNpcBindingsForMap(mapId, scenarios, {
          completedScenarioIds: progressRef.current.completedScenarioIds,
          isUnlocked: (s) => isScenarioUnlocked(s, progressRef.current, scenarios),
        });

        const boot: StandFirmBootData = {
          mapId,
          npcs: npcSpotsFromBindings(bindings),
          playerSpawn: defaultPlayerSpawn(mapId),
          completedScenarioIds: progressRef.current.completedScenarioIds,
          graphicsQuality: loadGraphicsQuality(),
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
        if (!cancelled) setBootError("Unable to load the 3D world. Please try again.");
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
    // Remount when the active chapter map changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapId]);

  function closeOverlay() {
    overlayOpenRef.current = false;
    setActive(null);
    gameRef.current?.focusNpc(null);
    gameRef.current?.setLocked(false);
    shellRef.current?.focus({ preventScroll: true });
  }

  function syncWorldNpcStatuses(nextProgress: PlayerProgressState) {
    progressRef.current = nextProgress;
    const catalog = scenarios.length ? scenarios : listSeedScenarios();
    const bindings = buildNpcBindingsForMap(mapId, catalog, {
      completedScenarioIds: nextProgress.completedScenarioIds,
      isUnlocked: (s) => isScenarioUnlocked(s, nextProgress, catalog),
    });
    const statuses: Record<string, "available" | "completed" | "locked"> = {};
    for (const b of bindings) statuses[b.scenarioId] = b.status;
    gameRef.current?.syncNpcStatuses(statuses);
  }

  function handleResolved(data: ScenarioResolvePayload) {
    if (!data.scenario || !data.choice || !data.progress) return;

    let nextProgress: PlayerProgressState;

    if (!authenticated) {
      const scenario =
        scenarios.find((s) => s.id === data.scenario!.id) ??
        getSeedScenario(data.scenario!.id);
      if (!scenario) return;
      const applied = applyChoiceToProgress(progress, {
        scenario,
        choiceId: data.choice.id,
        xpReward: data.progress.xpEarned || 0,
        allScenarios: scenarios.length ? scenarios : listSeedScenarios(),
      });
      nextProgress = data.alreadyCompleted
        ? progress
        : {
            ...applied.next,
            xp: data.progress.xp,
            level: data.progress.level,
            currentChapter:
              data.progress.currentChapter ?? applied.next.currentChapter,
            decisionFlags:
              data.progress.decisionFlags ?? applied.next.decisionFlags,
            achievementIds: [
              ...new Set([
                ...applied.next.achievementIds,
                ...(data.progress.newlyEarnedAchievements?.map((a) => a.id) ?? []),
              ]),
            ],
          };
    } else {
      // Prefer authoritative cloud snapshot from the resolve response.
      nextProgress = normalizeProgress({
        xp: data.progress.xp,
        level: data.progress.level,
        currentChapter: data.progress.currentChapter,
        completedScenarioIds: data.progress.completedScenarioIds?.length
          ? data.progress.completedScenarioIds
          : progress.completedScenarioIds.includes(data.scenario.id)
            ? progress.completedScenarioIds
            : [...progress.completedScenarioIds, data.scenario.id],
        achievementIds: [
          ...new Set([
            ...(data.progress.achievementIds ?? progress.achievementIds),
            ...(data.progress.newlyEarnedAchievements?.map((a) => a.id) ?? []),
          ]),
        ],
        choicesByScenario: {
          ...progress.choicesByScenario,
          ...(data.progress.choicesByScenario ?? {}),
          [data.scenario.id]: data.choice.id,
        },
        decisionFlags: data.progress.decisionFlags ?? progress.decisionFlags ?? [],
      });
    }

    setProgress(nextProgress);
    saveLocalProgress(nextProgress);

    // Re-evaluate every NPC on this map so newly unlocked people
    // flip Locked → Available without a page refresh.
    syncWorldNpcStatuses(nextProgress);
  }

  function changeGfx(next: GraphicsQuality) {
    setGfx(next);
    saveGraphicsQuality(next);
    gameRef.current?.setGraphicsQuality(next);
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
            Journey Lv <strong className="text-white">{progress.level}</strong>
          </span>
          <span>
            XP{" "}
            <strong className="text-white">
              {xpBar.into}/{xpBar.need}
            </strong>
          </span>
          <span>
            Chapter <strong className="text-white">{progress.currentChapter}</strong>
          </span>
          <span className="hidden sm:inline text-slate-400">
            {progress.completedScenarioIds.length} completed
          </span>
          {!panelActive ? (
            <span className="text-amber-200/90">Click game to control</span>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-1 text-[11px] text-slate-400">
            Graphics
            <select
              className="rounded-md border border-white/20 bg-[#0b1220] px-1.5 py-0.5 text-slate-200"
              value={gfx}
              onChange={(e) => changeGfx(e.target.value as GraphicsQuality)}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </label>
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
            Loading world…
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
        speak. XP and journey level are game progression only — not spiritual status.
      </p>
    </div>
  );
}
