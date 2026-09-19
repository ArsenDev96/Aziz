/**
 * Same Answer game logic. No React, no storage, no Expo: state in, state out.
 * The provider in `src/state/same-answer.tsx` is the only thing that should call this.
 */
import { shuffle, type Rng } from '@/lib/random';
import { pointsForMatch, SAME_ANSWER_RULES, validMatchChoices } from './rules';

export interface Player {
  id: string;
  name: string;
}

export interface Team {
  id: string;
  /** 1-based, so "Team 1" is the first team in rotation. */
  number: number;
  playerIds: string[];
}

/** What the setup screen hands over: who is playing and how they are split up. */
export interface TeamSetup {
  selectedPlayerIds: string[];
  /** One entry per team, each a list of player ids, in rotation order. */
  teams: string[][];
}

export type SetupError =
  | 'tooFewPlayers'
  | 'tooManyPlayers'
  | 'tooFewTeams'
  | 'tooManyTeams'
  | 'teamTooSmall'
  | 'unassignedPlayer'
  | 'duplicatePlayer';

/** Every reason the setup can't start, in the order the screen should report them. */
export const validateSetup = (setup: TeamSetup): SetupError[] => {
  const errors: SetupError[] = [];
  const selected = new Set(setup.selectedPlayerIds);

  if (selected.size < SAME_ANSWER_RULES.minPlayers) errors.push('tooFewPlayers');
  if (selected.size > SAME_ANSWER_RULES.maxPlayers) errors.push('tooManyPlayers');
  if (setup.teams.length < SAME_ANSWER_RULES.minTeams) errors.push('tooFewTeams');
  if (setup.teams.length > SAME_ANSWER_RULES.maxTeams) errors.push('tooManyTeams');
  if (setup.teams.some((team) => team.length < SAME_ANSWER_RULES.minPlayersPerTeam)) {
    errors.push('teamTooSmall');
  }

  const assigned = setup.teams.flat();
  const seen = new Set<string>();
  let duplicate = false;
  for (const playerId of assigned) {
    if (seen.has(playerId)) duplicate = true;
    seen.add(playerId);
  }
  if (duplicate) errors.push('duplicatePlayer');
  if ([...selected].some((playerId) => !seen.has(playerId))) errors.push('unassignedPlayer');

  return errors;
};

export const isSetupValid = (setup: TeamSetup): boolean => validateSetup(setup).length === 0;

export interface Turn {
  teamId: string;
  promptId: string;
}

export interface TurnResult {
  teamId: string;
  matched: number;
  points: number;
}

/**
 * team → think → reveal → sayIt → input → score → (team … | results)
 * The five in-turn phases render inside one route; results has its own.
 */
export type SameAnswerPhase =
  | 'team'
  | 'think'
  | 'reveal'
  | 'sayIt'
  | 'input'
  | 'score'
  | 'results';

export interface SameAnswerState {
  players: Player[];
  /** Fixed rotation order: teams[0] plays first, then teams[1], and so on. */
  teams: Team[];
  /** Pre-shuffled prompt ids; turns consume the front of the deck so nothing repeats. */
  deck: string[];
  turns: Turn[];
  turnIndex: number;
  scores: Record<string, number>;
  phase: SameAnswerPhase;
  /** What the team just scored, shown on the score phase. */
  lastResult: TurnResult | null;
  winnerTeamIds: string[];
}

export interface TeamStanding {
  team: Team;
  score: number;
  rank: number;
}

const buildTeams = (teams: string[][]): Team[] =>
  teams.map((playerIds, index) => ({
    id: `t${index + 1}`,
    number: index + 1,
    playerIds: [...playerIds],
  }));

export const createGame = (
  players: Player[],
  setup: TeamSetup,
  promptIds: string[],
  rng?: Rng,
): SameAnswerState => {
  const errors = validateSetup(setup);
  if (errors.length > 0) throw new Error(`Invalid team setup: ${errors.join(', ')}`);

  const teams = buildTeams(setup.teams);
  const totalTurns = teams.length * SAME_ANSWER_RULES.turnsPerTeam;
  if (promptIds.length < totalTurns) {
    throw new Error(`Need ${totalTurns} prompts, have ${promptIds.length}`);
  }

  const known = new Set(players.map((player) => player.id));
  for (const playerId of setup.selectedPlayerIds) {
    if (!known.has(playerId)) throw new Error(`Unknown player ${playerId}`);
  }

  const deck = shuffle(promptIds, rng);
  const turns: Turn[] = [];
  for (let round = 0; round < SAME_ANSWER_RULES.turnsPerTeam; round += 1) {
    for (const team of teams) {
      turns.push({ teamId: team.id, promptId: deck[turns.length] });
    }
  }

  return {
    players: players.filter((player) => setup.selectedPlayerIds.includes(player.id)),
    teams,
    deck,
    turns,
    turnIndex: 0,
    scores: Object.fromEntries(teams.map((team) => [team.id, 0])),
    phase: 'team',
    lastResult: null,
    winnerTeamIds: [],
  };
};

/** Same players, same teams, fresh prompts — what PLAY AGAIN does. */
export const restartGame = (state: SameAnswerState, promptIds: string[], rng?: Rng) =>
  createGame(
    state.players,
    {
      selectedPlayerIds: state.players.map((player) => player.id),
      teams: state.teams.map((team) => team.playerIds),
    },
    promptIds,
    rng,
  );

export const currentTurn = (state: SameAnswerState): Turn | undefined =>
  state.turns[state.turnIndex];

export const currentTeam = (state: SameAnswerState): Team | undefined => {
  const turn = currentTurn(state);
  return turn ? state.teams.find((team) => team.id === turn.teamId) : undefined;
};

export const teamPlayers = (state: SameAnswerState, team: Team): Player[] =>
  team.playerIds
    .map((playerId) => state.players.find((player) => player.id === playerId))
    .filter((player): player is Player => player !== undefined);

/** 1-based position of the current turn, for "Turn 7 of 15". */
export const turnProgress = (state: SameAnswerState) => ({
  current: Math.min(state.turnIndex + 1, state.turns.length),
  total: state.turns.length,
});

/** Which of the team's five turns this is, for "Round 2 of 5". */
export const roundProgress = (state: SameAnswerState) => ({
  current: Math.min(Math.floor(state.turnIndex / state.teams.length) + 1, SAME_ANSWER_RULES.turnsPerTeam),
  total: SAME_ANSWER_RULES.turnsPerTeam,
});

/** The match counts the active team can report, or [] between turns. */
export const currentMatchChoices = (state: SameAnswerState): number[] => {
  const team = currentTeam(state);
  return team ? validMatchChoices(team.playerIds.length) : [];
};

const advance = (
  state: SameAnswerState,
  from: SameAnswerPhase,
  to: SameAnswerPhase,
): SameAnswerState => (state.phase === from ? { ...state, phase: to } : state);

export const ready = (state: SameAnswerState) => advance(state, 'team', 'think');
export const thinkDone = (state: SameAnswerState) => advance(state, 'think', 'reveal');
export const revealDone = (state: SameAnswerState) => advance(state, 'reveal', 'sayIt');
export const sayItDone = (state: SameAnswerState) => advance(state, 'sayIt', 'input');

/** Records the size of the largest matching group and scores it for the active team. */
export const recordMatch = (state: SameAnswerState, matched: number): SameAnswerState => {
  const team = currentTeam(state);
  if (state.phase !== 'input' || !team) return state;
  if (!validMatchChoices(team.playerIds.length).includes(matched)) {
    throw new Error(`${matched} is not a valid match count for a team of ${team.playerIds.length}`);
  }

  const points = pointsForMatch(matched);
  return {
    ...state,
    scores: { ...state.scores, [team.id]: state.scores[team.id] + points },
    lastResult: { teamId: team.id, matched, points },
    phase: 'score',
  };
};

/** Leaves the score phase: the next team is up, or the game is over. */
export const next = (state: SameAnswerState): SameAnswerState => {
  if (state.phase !== 'score') return state;
  const turnIndex = state.turnIndex + 1;
  if (turnIndex < state.turns.length) {
    return { ...state, turnIndex, phase: 'team' };
  }
  return { ...state, turnIndex, phase: 'results', winnerTeamIds: leaders(state) };
};

/** Every team on the top score — several when they tie, and all of them are joint winners. */
export const leaders = (state: SameAnswerState): string[] => {
  const best = Math.max(...state.teams.map((team) => state.scores[team.id]));
  return state.teams.filter((team) => state.scores[team.id] === best).map((team) => team.id);
};

export const isTie = (state: SameAnswerState): boolean => leaders(state).length > 1;

export const standings = (state: SameAnswerState): TeamStanding[] => {
  const sorted = [...state.teams].sort((a, b) => state.scores[b.id] - state.scores[a.id]);
  let lastScore = Number.NaN;
  let lastRank = 0;
  return sorted.map((team, index) => {
    const score = state.scores[team.id];
    const rank = score === lastScore ? lastRank : index + 1;
    lastScore = score;
    lastRank = rank;
    return { team, score, rank };
  });
};
