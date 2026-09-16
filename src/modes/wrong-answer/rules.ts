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
  /**
   * Sudden death has to end. These questions are easy enough that a whole tied group
   * can pass round after round, so each round is one second faster than the last and
   * after `maxSuddenDeathRounds` the players still level share the win.
   * NEEDS PRODUCT OWNER SIGN-OFF — see docs/RULES.md.
   */
  maxSuddenDeathRounds: 5,
  minSuddenDeathTimerSeconds: 1,
} as const;

export type WrongAnswerRules = typeof WRONG_ANSWER_RULES;

/** 3s for normal play and the first tie-break, then 2s, then 1s. */
export const timerSecondsForRound = (suddenDeathRound: number): number =>
  Math.max(
    WRONG_ANSWER_RULES.minSuddenDeathTimerSeconds,
    WRONG_ANSWER_RULES.timerSeconds - Math.max(0, suddenDeathRound - 1),
  );
