/** Shared mutable input from React movement panel + keyboard. */
export const standFirmInput = {
  up: false,
  down: false,
  left: false,
  right: false,
};

export function clearStandFirmInput() {
  standFirmInput.up = false;
  standFirmInput.down = false;
  standFirmInput.left = false;
  standFirmInput.right = false;
}

/** Keys used only for STAND FIRM — never should scroll the page or trigger site UI. */
export const GAME_CONTROL_CODES = new Set([
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "KeyW",
  "KeyA",
  "KeyS",
  "KeyD",
  "KeyE",
  "Space",
]);
