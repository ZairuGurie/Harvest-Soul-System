"use client";

import { useEffect } from "react";
import { clearStandFirmInput, standFirmInput } from "./standFirmInput";

type Dir = "up" | "down" | "left" | "right";

function setDir(dir: Dir, pressed: boolean) {
  standFirmInput[dir] = pressed;
}

function PadButton({
  label,
  dir,
  disabled,
}: {
  label: string;
  dir: Dir;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={`Move ${dir}`}
      disabled={disabled}
      className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/25 bg-[#0b1220]/90 text-sm font-semibold text-white shadow-md select-none touch-none active:scale-95 active:bg-harvest-blue disabled:opacity-40 sm:h-12 sm:w-12"
      onPointerDown={(e) => {
        if (disabled) return;
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.setPointerCapture(e.pointerId);
        setDir(dir, true);
      }}
      onPointerUp={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setDir(dir, false);
      }}
      onPointerCancel={(e) => {
        e.stopPropagation();
        setDir(dir, false);
      }}
      onPointerLeave={() => setDir(dir, false)}
      onContextMenu={(e) => e.preventDefault()}
    >
      {label}
    </button>
  );
}

/**
 * Movement UI owned by the game panel only.
 * Pointer events stay inside this panel so they never hit site MobileNav / page scroll.
 */
export default function GameMovementPanel({
  onInteract,
  disabled,
  canTalk,
}: {
  onInteract: () => void;
  disabled?: boolean;
  canTalk?: boolean;
}) {
  useEffect(() => {
    return () => clearStandFirmInput();
  }, []);

  useEffect(() => {
    if (disabled) clearStandFirmInput();
  }, [disabled]);

  return (
    <div
      className="pointer-events-none absolute inset-x-0 bottom-0 z-30 px-3 pb-3 pt-10 sm:px-4"
      // Isolate this layer from the page; gestures here must not scroll or hit nav.
      style={{ touchAction: "none" }}
      onPointerDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
    >
      <div className="pointer-events-auto flex items-end justify-between gap-3">
        <div
          role="group"
          aria-label="Game movement"
          className="grid grid-cols-3 gap-1.5 rounded-2xl border border-white/15 bg-[#0b1220]/55 p-2 shadow-lg backdrop-blur-sm"
        >
          <div />
          <PadButton label="▲" dir="up" disabled={disabled} />
          <div />
          <PadButton label="◀" dir="left" disabled={disabled} />
          <PadButton label="▼" dir="down" disabled={disabled} />
          <PadButton label="▶" dir="right" disabled={disabled} />
        </div>

        <button
          type="button"
          disabled={disabled || !canTalk}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onInteract();
          }}
          onPointerDown={(e) => e.stopPropagation()}
          className="hs-motion h-14 min-w-14 rounded-full bg-harvest-gradient px-4 text-sm font-semibold text-white shadow-lg select-none touch-none active:scale-95 disabled:opacity-40"
        >
          Talk
        </button>
      </div>
    </div>
  );
}
