import type { Language } from '@/locales';
import { normalizeTimerSeconds, WRONG_ANSWER_RULES, type TimerSeconds } from '@/modes/wrong-answer/rules';

/**
 * Pure shape and defaults for the persisted settings, kept out of the React provider so
 * the storage round-trip can be unit-tested.
 */
export interface Settings {
  language: Language;
  haptics: boolean;
  /** The normal-question clock the group picked last; sudden death derives from it. */
  timerSeconds: TimerSeconds;
}

export const DEFAULT_SETTINGS: Settings = {
  // Armenian is the primary language of the app; English is the fallback for testing.
  language: 'hy',
  haptics: true,
  timerSeconds: WRONG_ANSWER_RULES.defaultTimerSeconds,
};

/**
 * Merges whatever storage returned over the defaults. Older installs have no timer saved,
 * and a stale value from a removed option must not leak into a game, so the timer is
 * re-validated against the rules.
 */
export const hydrateSettings = (stored: Partial<Settings> | null | undefined): Settings => {
  const merged = { ...DEFAULT_SETTINGS, ...(stored ?? {}) };
  return { ...merged, timerSeconds: normalizeTimerSeconds(merged.timerSeconds) };
};
