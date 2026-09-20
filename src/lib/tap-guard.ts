/**
 * Collapses a burst of taps into one action. Big party buttons get hit twice by excited
 * players; the engine must only ever see the first tap. Pure, so the lock can be unit-tested
 * with a fake clock. The guard updates synchronously — no React state, no re-render race.
 */
export interface TapGuard {
  /** Runs `action` and locks; returns false (and does nothing) while still locked. */
  accept: (action: () => void) => boolean;
}

export const createTapGuard = (lockMs: number, now: () => number = Date.now): TapGuard => {
  let lockedUntil = 0;
  return {
    accept: (action) => {
      const at = now();
      if (at < lockedUntil) return false;
      lockedUntil = at + lockMs;
      action();
      return true;
    },
  };
};
