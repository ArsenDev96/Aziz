import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createSeededRng } from '../src/lib/random';
import {
  createGame,
  currentPlayer,
  currentTimerSeconds,
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

  it('uses a two second clock in sudden death and three otherwise', () => {
    assert.equal(timerSecondsForRound(0), WRONG_ANSWER_RULES.timerSeconds);
    assert.equal(timerSecondsForRound(1), WRONG_ANSWER_RULES.suddenDeathTimerSeconds);
  });
});

describe('finishing the game', () => {
  /** Plays normal play so that the first `tiedCount` players finish level at the top. */
  const playToSuddenDeath = (tiedCount: number) => {
    let state = newGame();
    const tied = state.players.slice(0, tiedCount).map((player) => player.id);
    while (state.suddenDeathRound === 0 && state.phase !== 'results') {
      state = playTurn(state, tied.includes(currentTurn(state)!.playerId) ? 'pass' : 'fail');
    }
    return { state, tied };
  };

  it('ends with a single winner when one player leads', () => {
    let state = newGame();
    const target = state.players[0].id;
    while (state.phase !== 'results') {
      const turn = currentTurn(state)!;
      state = playTurn(state, turn.playerId === target ? 'pass' : 'fail');
    }
    assert.deepEqual(state.winnerIds, [target]);
    assert.equal(state.suddenDeathRound, 0);
    assert.equal(state.scores[target], WRONG_ANSWER_RULES.questionsPerPlayer);
    assert.equal(standings(state)[0].player.id, target);
  });

  it('skips sudden death when the tie is not for first place', () => {
    const { state } = playToSuddenDeath(1);
    assert.equal(state.phase, 'results');
    assert.equal(state.suddenDeathRound, 0);
    assert.equal(state.winnerIds.length, 1);
  });

  it('gives the tied leaders one question each on a two second clock', () => {
    const { state, tied } = playToSuddenDeath(2);
    assert.equal(state.suddenDeathRound, 1);
    assert.equal(state.phase, 'turn');
    assert.deepEqual(state.tieBreakPlayerIds, tied);

    const suddenDeathTurns = state.turns.filter((turn) => turn.suddenDeathRound > 0);
    assert.equal(suddenDeathTurns.length, tied.length);
    assert.deepEqual(
      suddenDeathTurns.map((turn) => turn.playerId),
      tied,
    );
    assert.equal(currentTimerSeconds(state), WRONG_ANSWER_RULES.suddenDeathTimerSeconds);
  });

  it('crowns the one player who passes sudden death', () => {
    let { state, tied } = playToSuddenDeath(2);
    state = playTurn(state, 'pass');
    state = playTurn(state, 'fail');
    assert.equal(state.phase, 'results');
    assert.deepEqual(state.winnerIds, [tied[0]]);
  });

  it('declares joint winners when several pass sudden death', () => {
    let { state, tied } = playToSuddenDeath(3);
    state = playTurn(state, 'pass');
    state = playTurn(state, 'pass');
    state = playTurn(state, 'fail');
    assert.equal(state.phase, 'results');
    assert.deepEqual(state.winnerIds, [tied[0], tied[1]]);
  });

  it('declares every tied player a joint winner when nobody passes', () => {
    let { state, tied } = playToSuddenDeath(3);
    for (let i = 0; i < tied.length; i += 1) {
      state = playTurn(state, 'fail');
    }
    assert.equal(state.phase, 'results');
    assert.deepEqual(state.winnerIds, tied);
  });

  it('never starts a second sudden-death round', () => {
    let { state, tied } = playToSuddenDeath(2);
    // Both pass, so they are still level — the game still ends here.
    state = playTurn(state, 'pass');
    state = playTurn(state, 'pass');
    assert.equal(state.phase, 'results');
    assert.equal(state.suddenDeathRound, 1);
    assert.deepEqual(state.winnerIds, tied);
    assert.ok(state.turns.every((turn) => turn.suddenDeathRound <= 1));
  });

  it('keeps dealing questions when the deck is smaller than the game', () => {
    let state = createGame(players, ['wa-001', 'wa-002'], createSeededRng(3));
    while (state.phase !== 'results') {
      state = playTurn(state, 'fail');
    }
    assert.ok(state.turns.every((turn) => typeof turn.questionId === 'string'));
    assert.equal(state.suddenDeathRound, 1);
    assert.equal(state.winnerIds.length, players.length);
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
