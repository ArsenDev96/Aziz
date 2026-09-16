import { shuffle, type Rng } from '@/lib/random';
import { timerSecondsForRound, WRONG_ANSWER_RULES } from './rules';

export interface Player {
  id: string;
  name: string;
}

export type Verdict = 'pass' | 'fail';

export interface Turn {
  playerId: string;
  questionId: string;
  suddenDeathRound: number;
}

export type GamePhase = 'turn' | 'question' | 'judge' | 'results';

export interface GameState {
  players: Player[];
  /** Pre-shuffled question ids; turns consume this in order so nothing repeats. */
  deck: string[];
  deckIndex: number;
  turns: Turn[];
  turnIndex: number;
  scores: Record<string, number>;
  phase: GamePhase;
  /** 0 during normal play, 1 during the single sudden-death round. */
  suddenDeathRound: number;
  /** The players who were tied for first place when normal play ended. */
  tieBreakPlayerIds: string[];
  /** Tied leaders who passed their sudden-death question. */
  suddenDeathPassIds: string[];
  winnerIds: string[];
}

export interface Standing {
  player: Player;
  score: number;
  rank: number;
}

const drawQuestion = (
  deck: string[],
  deckIndex: number,
): { questionId: string; nextIndex: number } => ({
  // Wrapping keeps sudden death alive even if a long game exhausts the deck.
  questionId: deck[deckIndex % deck.length],
  nextIndex: deckIndex + 1,
});

export const createGame = (
  players: Player[],
  questionIds: string[],
  rng?: Rng,
): GameState => {
  if (players.length < WRONG_ANSWER_RULES.minPlayers) {
    throw new Error(`Need at least ${WRONG_ANSWER_RULES.minPlayers} players`);
  }
  if (players.length > WRONG_ANSWER_RULES.maxPlayers) {
    throw new Error(`Need at most ${WRONG_ANSWER_RULES.maxPlayers} players`);
  }
  if (questionIds.length === 0) {
    throw new Error('No questions available');
  }

  // Turn order is shuffled so the person who typed the names first isn't always first.
  const order = shuffle(players, rng);
  const deck = shuffle(questionIds, rng);

  const turns: Turn[] = [];
  let deckIndex = 0;
  for (let round = 0; round < WRONG_ANSWER_RULES.questionsPerPlayer; round += 1) {
    for (const player of order) {
      const draw = drawQuestion(deck, deckIndex);
      deckIndex = draw.nextIndex;
      turns.push({ playerId: player.id, questionId: draw.questionId, suddenDeathRound: 0 });
    }
  }

  return {
    players: order,
    deck,
    deckIndex,
    turns,
    turnIndex: 0,
    scores: Object.fromEntries(players.map((player) => [player.id, 0])),
    phase: 'turn',
    suddenDeathRound: 0,
    tieBreakPlayerIds: [],
    suddenDeathPassIds: [],
    winnerIds: [],
  };
};

export const currentTurn = (state: GameState): Turn | undefined => state.turns[state.turnIndex];

export const currentPlayer = (state: GameState): Player | undefined => {
  const turn = currentTurn(state);
  return turn ? state.players.find((player) => player.id === turn.playerId) : undefined;
};

/** 1-based position of the current turn within normal play, for "Question 7 of 20". */
export const turnProgress = (state: GameState) => {
  const total = state.players.length * WRONG_ANSWER_RULES.questionsPerPlayer;
  return { current: Math.min(state.turnIndex + 1, total), total };
};

/** Seconds on the clock for the turn being played. */
export const currentTimerSeconds = (state: GameState): number =>
  timerSecondsForRound(currentTurn(state)?.suddenDeathRound ?? 0);

export const startQuestion = (state: GameState): GameState =>
  state.phase === 'turn' ? { ...state, phase: 'question' } : state;

export const timeUp = (state: GameState): GameState =>
  state.phase === 'question' ? { ...state, phase: 'judge' } : state;

/** Records the group's verdict and moves on — into the next turn, sudden death, or results. */
export const judgeTurn = (state: GameState, verdict: Verdict): GameState => {
  const turn = currentTurn(state);
  if (state.phase !== 'judge' || !turn) return state;

  const points =
    verdict === 'pass' ? WRONG_ANSWER_RULES.passPoints : WRONG_ANSWER_RULES.failPoints;
  const scores = { ...state.scores, [turn.playerId]: state.scores[turn.playerId] + points };
  const suddenDeathPassIds =
    turn.suddenDeathRound > 0 && verdict === 'pass'
      ? [...state.suddenDeathPassIds, turn.playerId]
      : state.suddenDeathPassIds;
  const advanced: GameState = {
    ...state,
    scores,
    suddenDeathPassIds,
    turnIndex: state.turnIndex + 1,
  };

  if (advanced.turnIndex < advanced.turns.length) {
    return { ...advanced, phase: 'turn' };
  }
  return resolveEnd(advanced);
};

/**
 * All turns are used up: declare the winner, queue the one sudden-death round, or
 * read that round's result.
 */
const resolveEnd = (state: GameState): GameState => {
  if (state.suddenDeathRound > 0) {
    // The single sudden-death round is over. Whoever passed wins it, jointly if
    // several did; if nobody passed, the players who were tied share the win.
    const winnerIds =
      state.suddenDeathPassIds.length > 0 ? state.suddenDeathPassIds : state.tieBreakPlayerIds;
    return { ...state, phase: 'results', winnerIds };
  }

  const best = Math.max(...state.players.map((player) => state.scores[player.id]));
  const leaders = state.players
    .filter((player) => state.scores[player.id] === best)
    .map((player) => player.id);

  if (leaders.length === 1) {
    return { ...state, phase: 'results', winnerIds: leaders };
  }

  // Exactly one tie-break round, one question each, tied leaders only.
  let deckIndex = state.deckIndex;
  const turns = [...state.turns];
  for (const playerId of leaders) {
    const draw = drawQuestion(state.deck, deckIndex);
    deckIndex = draw.nextIndex;
    turns.push({ playerId, questionId: draw.questionId, suddenDeathRound: 1 });
  }

  return {
    ...state,
    deckIndex,
    turns,
    phase: 'turn',
    suddenDeathRound: 1,
    tieBreakPlayerIds: leaders,
  };
};

export const standings = (state: GameState): Standing[] => {
  const sorted = [...state.players].sort((a, b) => state.scores[b.id] - state.scores[a.id]);
  let lastScore = Number.NaN;
  let lastRank = 0;
  return sorted.map((player, index) => {
    const score = state.scores[player.id];
    const rank = score === lastScore ? lastRank : index + 1;
    lastScore = score;
    lastRank = rank;
    return { player, score, rank };
  });
};
