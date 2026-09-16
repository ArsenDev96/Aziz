/**
 * V1 rules — locked with the product owner before build.
 * Phase 6 tuning (timer length, questions per player) happens here and nowhere else.
 */
import { msToSeconds, secondsToMs } from '@/lib/time';

/** The clocks a group can pick from before a game, in seconds. */
export const TIMER_OPTIONS = [2.5, 3, 3.5] as const;

export type TimerSeconds = (typeof TIMER_OPTIONS)[number];

export const WRONG_ANSWER_RULES = {
  minPlayers: 2,
  maxPlayers: 8,
  questionsPerPlayer: 5,
  /** Used until the group picks a timer, and whenever a stored pick is unusable. */
  defaultTimerSeconds: 3 as TimerSeconds,
  passPoints: 1,
  failPoints: 0,
  /** The single tie-break round is played half a second faster, but never below the floor. */
  suddenDeathTimerOffsetSeconds: 0.5,
  minSuddenDeathTimerSeconds: 2,
} as const;

export type WrongAnswerRules = typeof WRONG_ANSWER_RULES;

export const isTimerSeconds = (value: unknown): value is TimerSeconds =>
  TIMER_OPTIONS.some((option) => option === value);

/**
 * Turns whatever storage handed back into a timer the rules allow. Values from a previous
 * option set (4, 5) fall back to the default rather than being remapped.
 */
export const normalizeTimerSeconds = (value: unknown): TimerSeconds =>
  isTimerSeconds(value) ? value : WRONG_ANSWER_RULES.defaultTimerSeconds;

/** Sudden death in whole milliseconds: the chosen clock minus the offset, floored. */
export const suddenDeathTimerMs = (timerSeconds: number): number =>
  Math.max(
    secondsToMs(timerSeconds) - secondsToMs(WRONG_ANSWER_RULES.suddenDeathTimerOffsetSeconds),
    secondsToMs(WRONG_ANSWER_RULES.minSuddenDeathTimerSeconds),
  );

/** Sudden death runs half a second faster than normal play, floored at the minimum. */
export const suddenDeathTimerSeconds = (timerSeconds: number): number =>
  msToSeconds(suddenDeathTimerMs(timerSeconds));

/** The chosen clock during normal play, the faster one in the sudden-death round. */
export const timerSecondsForRound = (
  suddenDeathRound: number,
  timerSeconds: number = WRONG_ANSWER_RULES.defaultTimerSeconds,
): number => (suddenDeathRound > 0 ? suddenDeathTimerSeconds(timerSeconds) : timerSeconds);

/** Same as `timerSecondsForRound`, in the milliseconds the countdown actually runs on. */
export const timerMsForRound = (
  suddenDeathRound: number,
  timerSeconds: number = WRONG_ANSWER_RULES.defaultTimerSeconds,
): number =>
  suddenDeathRound > 0 ? suddenDeathTimerMs(timerSeconds) : secondsToMs(timerSeconds);
