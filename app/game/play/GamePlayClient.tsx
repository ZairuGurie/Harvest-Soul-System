"use client";

import dynamic from "next/dynamic";
import type { PlayerProgressState } from "@/lib/game/types";

const GameCanvas = dynamic(() => import("@/components/game/GameCanvas"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-72 items-center justify-center rounded-2xl border border-slate-200/80 bg-slate-50 text-sm text-slate-600 dark:border-white/10 dark:bg-[#0b1220] dark:text-slate-300">
      Preparing STAND FIRM…
    </div>
  ),
});

export default function GamePlayClient({
  initialProgress,
  authenticated,
}: {
  initialProgress: PlayerProgressState | null;
  authenticated: boolean;
}) {
  return <GameCanvas initialProgress={initialProgress} authenticated={authenticated} />;
}
