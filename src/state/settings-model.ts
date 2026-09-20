import { LANGUAGES, type Language } from '@/locales';
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

const isLanguage = (value: unknown): value is Language =>
  typeof value === 'string' && (LANGUAGES as string[]).includes(value);

const asRecord = (stored: unknown): Record<string, unknown> =>
  stored !== null && typeof stored === 'object' && !Array.isArray(stored)
    ? (stored as Record<string, unknown>)
    : {};

/**
 * Rebuilds the settings from whatever storage returned, one field at a time. Older installs
 * have no timer saved, a stale value from a removed option must not leak into a game, and a
 * language code the app does not ship would leave every screen without strings — so each
 * scalar is validated and falls back to its default rather than trusted.
 */
export const hydrateSettings = (stored: Partial<Settings> | null | undefined): Settings => {
  const raw = asRecord(stored);
  return {
    language: isLanguage(raw.language) ? raw.language : DEFAULT_SETTINGS.language,
    haptics: typeof raw.haptics === 'boolean' ? raw.haptics : DEFAULT_SETTINGS.haptics,
    timerSeconds: normalizeTimerSeconds(raw.timerSeconds),
  };
};

/**
 * True once the player has picked a language (a valid one is in storage). A fresh install has
 * nothing stored — and a corrupt value counts as nothing — so the app asks first instead of
 * silently defaulting.
 */
export const hasChosenLanguage = (stored: Partial<Settings> | null | undefined): boolean =>
  isLanguage(asRecord(stored).language);
