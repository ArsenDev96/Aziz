import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createSeededRng } from '../src/lib/random';
import {
  createGame,
  currentPlayer,
  currentTurn,
  judgeTurn,
  standings,
  startQuestion,
  timeUp,
  type GameState,
  type Player,
  type Verdict,
} from '../src/modes/wrong-answer/engine';
import { timerSecondsForRound, WRONG_ANSWER_RULES } from '../src/modes/wrong-answer/rules';

const players: Player[] = [
  { id: 'p1', name: 'Aram' },
  { id: 'p2', name: 'Ani' },
  { id: 'p3', name: 'Gor' },
  { id: 'p4', name: 'Narek' },
];

const questionIds = Array.from({ length: 50 }, (_, i) => `wa-${String(i + 1).padStart(3, '0')}`);

const newGame = (people: Player[] = players, seed = 1) =>
  createGame(people, questionIds, createSeededRng(seed));

/** Plays one turn end to end with the given verdict. */
const playTurn = (state: GameState, verdict: Verdict): GameState =>
  judgeTurn(timeUp(startQuestion(state)), verdict);

describe('createGame', () => {
  it('gives every player exactly the configured number of questions', () => {
    const state = newGame();
    const counts = state.turns.reduce<Record<string, number>>((acc, turn) => {
      acc[turn.playerId] = (acc[turn.playerId] ?? 0) + 1;
      return acc;
    }, {});
    for (const player of players) {
      assert.equal(counts[player.id], WRONG_ANSWER_RULES.questionsPerPlayer);
    }
    assert.equal(state.turns.length, players.length * WRONG_ANSWER_RULES.questionsPerPlayer);
  });

  it('never repeats a question while the deck lasts', () => {
    const state = newGame();
    const used = state.turns.map((turn) => turn.questionId);
    assert.equal(new Set(used).size, used.length);
  });

  it('shuffles the turn order instead of using entry order', () => {
    const orders = new Set(
      [1, 2, 3, 4, 5, 6, 7, 8].map((seed) =>
        newGame(players, seed)
          .players.map((player) => player.id)
          .join(','),
      ),
    );
    assert.ok(orders.size > 1, 'expected different turn orders across seeds');
  });

  it('rejects player counts outside the rules', () => {
    assert.throws(() => createGame([players[0]], questionIds));
    const tooMany = Array.from({ length: WRONG_ANSWER_RULES.maxPlayers + 1 }, (_, i) => ({
      id: `x${i}`,
      name: `X${i}`,
    }));
    assert.throws(() => createGame(tooMany, questionIds));
  });
});

describe('scoring', () => {
  it('awards a point for a pass and nothing for a fail', () => {
    let state = newGame();
    const first = currentPlayer(state)!;
    state = playTurn(state, 'pass');
    assert.equal(state.scores[first.id], WRONG_ANSWER_RULES.passPoints);

    const second = currentPlayer(state)!;
    state = playTurn(state, 'fail');
    assert.equal(state.scores[second.id], WRONG_ANSWER_RULES.failPoints);
  });

  it('ignores a verdict that arrives outside the judge phase', () => {
    const state = newGame();
    assert.equal(judgeTurn(state, 'pass'), state);
  });

  it('ranks tied players equally in the standings', () => {
    let state = newGame();
    while (state.phase !== 'results') {
      state = playTurn(state, 'pass');
    }
    const table = standings(state);
    assert.deepEqual(
      table.map((row) => row.rank),
      [1, 1, 1, 1],
    );
  });

  it('shares the win when nobody can be separated', () => {
    let state = newGame();
    while (state.phase !== 'results') {
      state = playTurn(state, 'pass');
    }
    assert.equal(state.suddenDeathRound, WRONG_ANSWER_RULES.maxSuddenDeathRounds);
    assert.equal(state.winnerIds.length, players.length);
  });

  it('speeds the clock up on every sudden-death round', () => {
    assert.equal(timerSecondsForRound(0), WRONG_ANSWER_RULES.timerSeconds);
    assert.equal(timerSecondsForRound(1), WRONG_ANSWER_RULES.timerSeconds);
    assert.equal(timerSecondsForRound(2), WRONG_ANSWER_RULES.timerSeconds - 1);
    assert.equal(
      timerSecondsForRound(99),
      WRONG_ANSWER_RULES.minSuddenDeathTimerSeconds,
    );
  });
});

describe('finishing the game', () => {
  it('ends with a single winner when one player leads', () => {
    let state = newGame();
    const target = state.players[0].id;
    while (state.phase !== 'results') {
      const turn = currentTurn(state)!;
      state = playTurn(state, turn.playerId === target ? 'pass' : 'fail');
    }
    assert.deepEqual(state.winnerIds, [target]);
    assert.equal(state.scores[target], WRONG_ANSWER_RULES.questionsPerPlayer);
    assert.equal(standings(state)[0].player.id, target);
  });

  it('goes to sudden death when the top score is tied', () => {
    let state = newGame();
    const [a, b] = state.players.map((player) => player.id);
    while (state.phase !== 'results' && state.suddenDeathRound === 0) {
      const turn = currentTurn(state)!;
      state = playTurn(state, turn.playerId === a || turn.playerId === b ? 'pass' : 'fail');
    }
    assert.equal(state.suddenDeathRound, 1);
    assert.deepEqual(state.tieBreakPlayerIds.slice().sort(), [a, b].sort());
    // Only the tied players get a sudden-death question.
    const suddenDeathTurns = state.turns.filter((turn) => turn.suddenDeathRound === 1);
    assert.equal(suddenDeathTurns.length, 2);
  });

  it('repeats sudden death until someone breaks the tie', () => {
    let state = newGame();
    const [a, b] = state.players.map((player) => player.id);
    const tiedTwo = (playerId: string) => playerId === a || playerId === b;

    while (state.suddenDeathRound === 0) {
      state = playTurn(state, tiedTwo(currentTurn(state)!.playerId) ? 'pass' : 'fail');
    }
    // Both fail the first sudden-death round: still tied, so a second round is queued.
    state = playTurn(state, 'fail');
    state = playTurn(state, 'fail');
    assert.equal(state.suddenDeathRound, 2);
    assert.equal(state.phase, 'turn');

    // Second round: the first of them passes, the other fails.
    const decider = currentTurn(state)!.playerId;
    state = playTurn(state, 'pass');
    state = playTurn(state, 'fail');
    assert.equal(state.phase, 'results');
    assert.deepEqual(state.winnerIds, [decider]);
  });

  it('keeps dealing questions when sudden death outlasts the deck', () => {
    let state = createGame(players, ['wa-001', 'wa-002'], createSeededRng(3));
    let guard = 0;
    while (state.phase !== 'results' && guard < 500) {
      state = playTurn(state, 'fail');
      guard += 1;
      if (state.suddenDeathRound >= 3) break;
    }
    assert.ok(state.turns.every((turn) => typeof turn.questionId === 'string'));
    assert.ok(state.suddenDeathRound >= 1);
  });
});

describe('phases', () => {
  it('walks turn -> question -> judge', () => {
    const state = newGame();
    assert.equal(state.phase, 'turn');
    const asking = startQuestion(state);
    assert.equal(asking.phase, 'question');
    const judging = timeUp(asking);
    assert.equal(judging.phase, 'judge');
    assert.equal(judgeTurn(judging, 'pass').phase, 'turn');
  });
});
