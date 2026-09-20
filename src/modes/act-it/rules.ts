/**
 * Act It! — V1 rules, locked with the product owner before build.
 * Every number the mode uses lives here: change it here, nowhere else.
 * See docs/RULES.md for the prose version.
 */
import { secondsToMs } from '@/lib/time';

export const ACT_IT_RULES = {
  /** Teams of at least two: one guesser plus at least one actor. */
  minPlayers: 4,
  maxPlayers: 8,
  minTeams: 2,
  maxTeams: 4,
  minPlayersPerTeam: 2,
  /** Each turn is one guesser for this long. Every team gets the same number of turns. */
  turnSeconds: 45,
  /** 3 → 2 → 1 → GO before the clock starts. */
  startCountdownSeconds: 3,
  /** How long GO stays on screen before the first card. */
  goHoldSeconds: 0.7,
  correctPoints: 1,
  maxSkipsPerTurn: 2,
} as const;

export type ActItRules = typeof ACT_IT_RULES;

export const turnMs = (): number => secondsToMs(ACT_IT_RULES.turnSeconds);

export const startCountdownMs = (): number => secondsToMs(ACT_IT_RULES.startCountdownSeconds);

export const goHoldMs = (): number => secondsToMs(ACT_IT_RULES.goHoldSeconds);
