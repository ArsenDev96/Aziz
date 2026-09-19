/**
 * Same Answer — V1 rules, locked with the product owner before build.
 * Every number the mode uses lives here: change it here, nowhere else.
 * See docs/RULES.md for the prose version.
 */
import { secondsToMs } from '@/lib/time';

export const SAME_ANSWER_RULES = {
  minPlayers: 4,
  maxPlayers: 8,
  minTeams: 2,
  maxTeams: 4,
  minPlayersPerTeam: 2,
  turnsPerTeam: 5,
  /** Silent thinking time after the prompt appears. */
  thinkSeconds: 5,
  /** The reveal counts down from here — 3, 2, 1, SAY IT. */
  revealCountdownSeconds: 3,
  /** How long SAY IT stays on screen before the match selector shows. */
  sayItHoldSeconds: 2,
} as const;

export type SameAnswerRules = typeof SAME_ANSWER_RULES;

export const thinkMs = (): number => secondsToMs(SAME_ANSWER_RULES.thinkSeconds);

export const revealCountdownMs = (): number =>
  secondsToMs(SAME_ANSWER_RULES.revealCountdownSeconds);

export const sayItHoldMs = (): number => secondsToMs(SAME_ANSWER_RULES.sayItHoldSeconds);

/**
 * Points for the largest group of teammates who said the same thing.
 * One player matching nobody is not a match, so 0 and 1 both score nothing.
 */
export const pointsForMatch = (matched: number): number => Math.max(matched - 1, 0);

/**
 * The match counts a team of `teamSize` can report: 0, then 2 up to the whole team.
 * "1" is never offered — a single player cannot match with themselves.
 */
export const validMatchChoices = (teamSize: number): number[] => {
  const choices = [0];
  for (let n = 2; n <= teamSize; n += 1) choices.push(n);
  return choices;
};
