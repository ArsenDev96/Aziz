/**
 * V1 rules — locked with the product owner before build.
 * Phase 6 tuning (timer length, questions per player) happens here and nowhere else.
 */
export const WRONG_ANSWER_RULES = {
  minPlayers: 2,
  maxPlayers: 8,
  questionsPerPlayer: 5,
  timerSeconds: 3,
  passPoints: 1,
  failPoints: 0,
  /** The single tie-break round is played on a faster clock. */
  suddenDeathTimerSeconds: 2,
} as const;

export type WrongAnswerRules = typeof WRONG_ANSWER_RULES;

/** 3 seconds during normal play, 2 seconds in the one sudden-death round. */
export const timerSecondsForRound = (suddenDeathRound: number): number =>
  suddenDeathRound > 0
    ? WRONG_ANSWER_RULES.suddenDeathTimerSeconds
    : WRONG_ANSWER_RULES.timerSeconds;
