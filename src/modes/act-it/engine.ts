/**
 * Act It! game logic. No React, no storage, no Expo: state in, state out.
 * The provider in `src/state/act-it.tsx` is the only thing that should call this.
 * The 45 second clock itself runs in the UI; the engine only hears "time is up".
 *
 * Teams play. Each turn one teammate guesses while the rest of that team acts; the other
 * teams sit it out. Every team gets the same number of turns (the size of the largest team),
 * so a smaller team simply comes round to its first guesser again.
 */
import { shuffle, type Rng } from '@/lib/random';
import {
  validateTeamSetup,
  type TeamSetup,
  type TeamSetupError,
} from '@/lib/teams';
import { ACT_IT_RULES } from './rules';

export type { TeamSetup } from '@/lib/teams';
export type SetupError = TeamSetupError;

export interface Player {
  id: string;
  name: string;
}

export interface Team {
  id: string;
  /** 1-based, so "Team 1" is the first team in rotation. */
  number: number;
  /** Setup order — also the guesser order. */
  playerIds: string[];
}

/** One 45-second turn: which team, who holds the phone, and which round it belongs to. */
export interface Turn {
  /** 0-based; every team plays once per round. */
  round: number;
  teamId: string;
  guesserId: string;
}

/** Every reason the setup can't start, in the order the screen should report them. */
export const validateSetup = (setup: TeamSetup): SetupError[] =>
  validateTeamSetup(setup, ACT_IT_RULES);

export const isSetupValid = (setup: TeamSetup): boolean => validateSetup(setup).length === 0;

/**
 * guesser → countdown → playing → timeUp → (guesser … | results)
 * The four in-turn phases render inside one route; results has its own.
 */
export type ActItPhase = 'guesser' | 'countdown' | 'playing' | 'timeUp' | 'results';

export interface ActItState {
  players: Player[];
  /** Fixed rotation order: teams[0] plays first in every round. */
  teams: Team[];
  /** The whole schedule, built once at the start: round → team → guesser. */
  turns: Turn[];
  turnIndex: number;
  /** Turns each team gets — the size of the largest team. */
  turnsPerTeam: number;
  /** Pre-shuffled card ids; turns consume the front of the deck so nothing repeats. */
  deck: string[];
  deckIndex: number;
  /** Team id → points. */
  scores: Record<string, number>;
  phase: ActItPhase;
  /** The card the actors are showing right now, or null between cards. */
  cardId: string | null;
  skipsUsed: number;
  /** Correct guesses in the current turn — what the TIME! screen reports. */
  turnCorrect: number;
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

/** Every team plays as many turns as the largest team has players. */
export const turnsPerTeamFor = (teams: readonly { playerIds: string[] }[]): number =>
  Math.max(...teams.map((team) => team.playerIds.length));

/**
 * Round-robin schedule: round 1 is every team's first player in team order, round 2 every
 * team's second player, and so on. A team shorter than the round count wraps back to its
 * first player, so nobody on a smaller team gets fewer turns than the other teams.
 */
export const buildSchedule = (teams: Team[]): Turn[] => {
  const rounds = turnsPerTeamFor(teams);
  const turns: Turn[] = [];
  for (let round = 0; round < rounds; round += 1) {
    for (const team of teams) {
      turns.push({
        round,
        teamId: team.id,
        guesserId: team.playerIds[round % team.playerIds.length],
      });
    }
  }
  return turns;
};

export const createGame = (
  players: Player[],
  setup: TeamSetup,
  cardIds: string[],
  rng?: Rng,
): ActItState => {
  const errors = validateSetup(setup);
  if (errors.length > 0) throw new Error(`Invalid team setup: ${errors.join(', ')}`);
  if (cardIds.length === 0) throw new Error('No cards available');

  const known = new Set(players.map((player) => player.id));
  for (const playerId of setup.selectedPlayerIds) {
    if (!known.has(playerId)) throw new Error(`Unknown player ${playerId}`);
  }

  const teams = buildTeams(setup.teams);
  const turns = buildSchedule(teams);

  return {
    players: players.filter((player) => setup.selectedPlayerIds.includes(player.id)),
    teams,
    turns,
    turnIndex: 0,
    turnsPerTeam: turnsPerTeamFor(teams),
    deck: shuffle(cardIds, rng),
    deckIndex: 0,
    scores: Object.fromEntries(teams.map((team) => [team.id, 0])),
    phase: 'guesser',
    cardId: null,
    skipsUsed: 0,
    turnCorrect: 0,
    winnerTeamIds: [],
  };
};

/** Same teams in the same order, fresh deck — what PLAY AGAIN does. Nothing is reshuffled but the cards. */
export const restartGame = (state: ActItState, cardIds: string[], rng?: Rng): ActItState =>
  createGame(
    state.players,
    {
      selectedPlayerIds: state.players.map((player) => player.id),
      teams: state.teams.map((team) => team.playerIds),
    },
    cardIds,
    rng,
  );

export const currentTurn = (state: ActItState): Turn | undefined => state.turns[state.turnIndex];

export const currentTeam = (state: ActItState): Team | undefined => {
  const turn = currentTurn(state);
  return turn ? state.teams.find((team) => team.id === turn.teamId) : undefined;
};

const playerById = (state: ActItState, playerId: string): Player | undefined =>
  state.players.find((player) => player.id === playerId);

export const teamPlayers = (state: ActItState, team: Team): Player[] =>
  team.playerIds
    .map((playerId) => playerById(state, playerId))
    .filter((player): player is Player => player !== undefined);

export const currentGuesser = (state: ActItState): Player | undefined => {
  const turn = currentTurn(state);
  return turn ? playerById(state, turn.guesserId) : undefined;
};

/** The active team minus the guesser, in setup order. */
export const currentActors = (state: ActItState): Player[] => {
  const team = currentTeam(state);
  const turn = currentTurn(state);
  if (!team || !turn) return [];
  return teamPlayers(state, team).filter((player) => player.id !== turn.guesserId);
};

/** 1-based position of the current turn, for "Turn 4 of 9". */
export const turnProgress = (state: ActItState) => ({
  current: Math.min(state.turnIndex + 1, state.turns.length),
  total: state.turns.length,
});

/** Which round this turn belongs to, for "Round 2 of 3". */
export const roundProgress = (state: ActItState) => ({
  current: Math.min((currentTurn(state)?.round ?? state.turnsPerTeam - 1) + 1, state.turnsPerTeam),
  total: state.turnsPerTeam,
});

export const skipsLeft = (state: ActItState): number =>
  Math.max(ACT_IT_RULES.maxSkipsPerTurn - state.skipsUsed, 0);

export const canSkip = (state: ActItState): boolean =>
  state.phase === 'playing' && skipsLeft(state) > 0;

export const isLastTurn = (state: ActItState): boolean =>
  state.turnIndex >= state.turns.length - 1;

/** Takes the next card off the deck. Wraps if a very long game exhausts all 200. */
const dealCard = (state: ActItState): ActItState => ({
  ...state,
  cardId: state.deck[state.deckIndex % state.deck.length],
  deckIndex: state.deckIndex + 1,
});

export const ready = (state: ActItState): ActItState =>
  state.phase === 'guesser' ? { ...state, phase: 'countdown' } : state;

/** GO: the clock starts in the UI and the actors get their first card. */
export const go = (state: ActItState): ActItState =>
  state.phase === 'countdown' ? dealCard({ ...state, phase: 'playing' }) : state;

/** The actors confirmed the guess: one point to the active team, next card straight away. */
export const markCorrect = (state: ActItState): ActItState => {
  const team = currentTeam(state);
  if (state.phase !== 'playing' || !team) return state;
  return dealCard({
    ...state,
    scores: { ...state.scores, [team.id]: state.scores[team.id] + ACT_IT_RULES.correctPoints },
    turnCorrect: state.turnCorrect + ACT_IT_RULES.correctPoints,
  });
};

/** No point, next card — but only while the team still has skips this turn. */
export const skip = (state: ActItState): ActItState =>
  canSkip(state) ? dealCard({ ...state, skipsUsed: state.skipsUsed + 1 }) : state;

export const timeUp = (state: ActItState): ActItState =>
  state.phase === 'playing' ? { ...state, phase: 'timeUp', cardId: null } : state;

/** Leaves the TIME! screen: the next turn in the schedule is up, or the game is over. */
export const next = (state: ActItState): ActItState => {
  if (state.phase !== 'timeUp') return state;
  if (!isLastTurn(state)) {
    return {
      ...state,
      turnIndex: state.turnIndex + 1,
      phase: 'guesser',
      skipsUsed: 0,
      turnCorrect: 0,
    };
  }
  return { ...state, phase: 'results', winnerTeamIds: leaders(state) };
};

/** Every team on the top score — several when they tie, and all of them are joint winners. */
export const leaders = (state: ActItState): string[] => {
  const best = Math.max(...state.teams.map((team) => state.scores[team.id]));
  return state.teams.filter((team) => state.scores[team.id] === best).map((team) => team.id);
};

export const isTie = (state: ActItState): boolean => leaders(state).length > 1;

export const standings = (state: ActItState): TeamStanding[] => {
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
