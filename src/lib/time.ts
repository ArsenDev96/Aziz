/**
 * Timer arithmetic lives in whole milliseconds so half-second clocks never drift into
 * 2.4999999 territory. Seconds are only used at the edges: rules and copy.
 */
export const secondsToMs = (seconds: number): number => Math.round(seconds * 1000);

export const msToSeconds = (ms: number): number => ms / 1000;

/** "3" for whole seconds, "2.5" for halves — never a float artefact. */
export const formatSeconds = (seconds: number): string => {
  const tenths = Math.round(seconds * 10);
  return tenths % 10 === 0 ? String(tenths / 10) : (tenths / 10).toFixed(1);
};

export const COUNTDOWN_TICK_MS = 1000;

/** The countdown ticks once a second, and the last tick soaks up any leftover half second. */
export const nextTickDelayMs = (remainingMs: number): number =>
  Math.max(0, Math.min(COUNTDOWN_TICK_MS, remainingMs));

/** Every value a countdown of `durationMs` shows, in order, ending at 0. */
export const countdownSchedule = (durationMs: number): number[] => {
  const values = [durationMs];
  let remaining = durationMs;
  while (remaining > 0) {
    remaining -= nextTickDelayMs(remaining);
    values.push(remaining);
  }
  return values;
};
