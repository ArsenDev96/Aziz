import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createSeededRng } from '../src/lib/random';
import {
  createGame,
  currentMatchChoices,
  currentTeam,
  isTie,
  leaders,
  next,
  ready,
  recordMatch,
  restartGame,
  revealDone,
  roundProgress,
  sayItDone,
  standings,
  teamPlayers,
  thinkDone,
  turnProgress,
  validateSetup,
  type Player,
  type SameAnswerState,
  type TeamSetup,
} from '../src/modes/same-answer/engine';
import {
  pointsForMatch,
  revealCountdownMs,
  SAME_ANSWER_RULES,
  sayItHoldMs,
  thinkMs,
  validMatchChoices,
} from '../src/modes/same-answer/rules';
import { countdownSchedule } from '../src/lib/time';

const players: Player[] = [
  { id: 'p1', name: 'Aram' },
  { id: 'p2', name: 'Ani' },
  { id: 'p3', name: 'Gor' },
  { id: 'p4', name: 'Narek' },
  { id: 'p5', name: 'Lilit' },
  { id: 'p6', name: 'Tigran' },
  { id: 'p7', name: 'Mane' },
  { id: 'p8', name: 'Davit' },
];

const promptIds = Array.from({ length: 100 }, (_, i) => `sa-${String(i + 1).padStart(3, '0')}`);

/** A setup that uses the first N players split into the given team sizes. */
const setupOf = (...sizes: number[]): TeamSetup => {
  const teams: string[][] = [];
  let index = 0;
  for (const size of sizes) {
    teams.push(players.slice(index, index + size).map((player) => player.id));
    index += size;
  }
  return { selectedPlayerIds: teams.flat(), teams };
};

const newGame = (setup: TeamSetup = setupOf(2, 2), seed = 1) =>
  createGame(players, setup, promptIds, createSeededRng(seed));

/** Plays one full turn: READY → think → reveal → SAY IT → matched → NEXT. */
const playTurn = (state: SameAnswerState, matched: number): SameAnswerState =>
  next(recordMatch(sayItDone(revealDone(thinkDone(ready(state)))), matched));

describe('team setup validation', () => {
  it('accepts 4 players in 2 teams', () => {
    assert.deepEqual(validateSetup(setupOf(2, 2)), []);
  });

  it('accepts 5 players in 2 uneven teams', () => {
    assert.deepEqual(validateSetup(setupOf(2, 3)), []);
  });

  it('accepts 6 players in 3 teams', () => {
    assert.deepEqual(validateSetup(setupOf(2, 2, 2)), []);
  });

  it('accepts 8 players in 4 teams', () => {
    assert.deepEqual(validateSetup(setupOf(2, 2, 2, 2)), []);
  });

  it('accepts every uneven split from the product examples', () => {
    for (const sizes of [[2, 3], [3, 3], [2, 2, 3], [4, 4], [2, 3, 3]]) {
      assert.deepEqual(validateSetup(setupOf(...sizes)), [], sizes.join('v'));
    }
  });

  it('rejects a team with only 1 player', () => {
    const setup = setupOf(1, 3);
    assert.ok(validateSetup(setup).includes('teamTooSmall'));
    assert.throws(() => createGame(players, setup, promptIds));
  });

  it('rejects a selected player who is on no team', () => {
    const setup = setupOf(2, 2);
    setup.selectedPlayerIds.push('p5');
    assert.ok(validateSetup(setup).includes('unassignedPlayer'));
  });

  it('rejects a player who appears on two teams', () => {
    const setup: TeamSetup = {
      selectedPlayerIds: ['p1', 'p2', 'p3', 'p4'],
      teams: [
        ['p1', 'p2'],
        ['p2', 'p3', 'p4'],
      ],
    };
    assert.ok(validateSetup(setup).includes('duplicatePlayer'));
  });

  it('rejects more than 4 teams', () => {
    const setup: TeamSetup = {
      selectedPlayerIds: players.map((player) => player.id),
      teams: [['p1', 'p2'], ['p3', 'p4'], ['p5', 'p6'], ['p7'], ['p8']],
    };
    assert.ok(validateSetup(setup).includes('tooManyTeams'));
  });

  it('rejects fewer than 2 teams', () => {
    assert.ok(validateSetup(setupOf(4)).includes('tooFewTeams'));
  });

  it('rejects fewer than 4 players', () => {
    const setup: TeamSetup = { selectedPlayerIds: ['p1', 'p2', 'p3'], teams: [['p1', 'p2'], ['p3']] };
    assert.ok(validateSetup(setup).includes('tooFewPlayers'));
  });

  it('rejects more than 8 players', () => {
    const extra = [...players, { id: 'p9', name: 'Hasmik' }];
    const setup: TeamSetup = {
      selectedPlayerIds: extra.map((player) => player.id),
      teams: [extra.slice(0, 4).map((p) => p.id), extra.slice(4).map((p) => p.id)],
    };
    assert.ok(validateSetup(setup).includes('tooManyPlayers'));
  });
});

describe('scoring', () => {
  it('scores 0 for 0 matched', () => assert.equal(pointsForMatch(0), 0));
  it('scores 0 for 1 matched', () => assert.equal(pointsForMatch(1), 0));
  it('scores 1 for 2 matched', () => assert.equal(pointsForMatch(2), 1));
  it('scores 2 for 3 matched', () => assert.equal(pointsForMatch(3), 2));
  it('scores 3 for 4 matched', () => assert.equal(pointsForMatch(4), 3));

  it('only counts the largest matching subgroup, never the sum of pairs', () => {
    // Dolma, Dolma, Lavash, Lavash: two pairs, but the largest group is 2 → 1 point.
    const state = recordMatch(sayItDone(revealDone(thinkDone(ready(newGame(setupOf(4, 4)))))), 2);
    assert.equal(state.scores.t1, 1);
    assert.deepEqual(state.lastResult, { teamId: 't1', matched: 2, points: 1 });
  });

  it('offers 0 and 2..teamSize as match choices, never 1', () => {
    assert.deepEqual(validMatchChoices(2), [0, 2]);
    assert.deepEqual(validMatchChoices(3), [0, 2, 3]);
    assert.deepEqual(validMatchChoices(4), [0, 2, 3, 4]);
  });

  it('adapts the choices to the active team size', () => {
    const state = newGame(setupOf(2, 3));
    assert.deepEqual(currentMatchChoices(state), [0, 2]);
    assert.deepEqual(currentMatchChoices(playTurn(state, 0)), [0, 2, 3]);
  });

  it('refuses a match count the team could not have produced', () => {
    const state = sayItDone(revealDone(thinkDone(ready(newGame(setupOf(2, 2))))));
    assert.throws(() => recordMatch(state, 1));
    assert.throws(() => recordMatch(state, 3));
  });

  it('does not normalise scores for uneven teams', () => {
    let state = newGame(setupOf(2, 4));
    state = playTurn(state, 2); // 2-person team matches fully → 1
    state = playTurn(state, 4); // 4-person team matches fully → 3
    assert.equal(state.scores.t1, 1);
    assert.equal(state.scores.t2, 3);
  });
});

describe('turn progression', () => {
  it('rotates teams in a fixed order', () => {
    const state = newGame(setupOf(2, 2, 2));
    const order = state.turns.map((turn) => turn.teamId);
    assert.deepEqual(order.slice(0, 6), ['t1', 't2', 't3', 't1', 't2', 't3']);
  });

  it('gives every team exactly 5 turns', () => {
    const state = newGame(setupOf(2, 3, 3));
    for (const team of state.teams) {
      const count = state.turns.filter((turn) => turn.teamId === team.id).length;
      assert.equal(count, SAME_ANSWER_RULES.turnsPerTeam);
    }
  });

  it('plays 10 turns with 2 teams, 15 with 3, 20 with 4', () => {
    assert.equal(newGame(setupOf(2, 2)).turns.length, 10);
    assert.equal(newGame(setupOf(2, 2, 2)).turns.length, 15);
    assert.equal(newGame(setupOf(2, 2, 2, 2)).turns.length, 20);
  });

  it('walks through the in-turn phases in order', () => {
    let state = newGame();
    assert.equal(state.phase, 'team');
    state = ready(state);
    assert.equal(state.phase, 'think');
    state = thinkDone(state);
    assert.equal(state.phase, 'reveal');
    state = revealDone(state);
    assert.equal(state.phase, 'sayIt');
    state = sayItDone(state);
    assert.equal(state.phase, 'input');
    state = recordMatch(state, 2);
    assert.equal(state.phase, 'score');
    state = next(state);
    assert.equal(state.phase, 'team');
    assert.equal(state.turnIndex, 1);
  });

  it('ignores a transition from the wrong phase', () => {
    const state = newGame();
    assert.equal(thinkDone(state), state);
    assert.equal(recordMatch(state, 2), state);
    assert.equal(next(state), state);
  });

  it('ends only after every team has finished all its turns', () => {
    let state = newGame(setupOf(2, 2, 2));
    for (let i = 0; i < 14; i += 1) {
      state = playTurn(state, 0);
      assert.equal(state.phase, 'team', `turn ${i}`);
    }
    state = playTurn(state, 0);
    assert.equal(state.phase, 'results');
  });

  it('reports turn and round progress', () => {
    let state = newGame(setupOf(2, 2, 2));
    assert.deepEqual(turnProgress(state), { current: 1, total: 15 });
    assert.deepEqual(roundProgress(state), { current: 1, total: 5 });
    state = playTurn(playTurn(playTurn(state, 0), 0), 0);
    assert.deepEqual(turnProgress(state), { current: 4, total: 15 });
    assert.deepEqual(roundProgress(state), { current: 2, total: 5 });
  });

  it('knows who is on the active team', () => {
    const state = newGame(setupOf(2, 3));
    const team = currentTeam(state);
    assert.ok(team);
    assert.equal(team.number, 1);
    assert.deepEqual(
      teamPlayers(state, team).map((player) => player.name),
      ['Aram', 'Ani'],
    );
  });
});

describe('prompt dealing', () => {
  it('never repeats a prompt within a game', () => {
    for (const sizes of [[2, 2], [2, 2, 2], [2, 2, 2, 2]]) {
      const state = newGame(setupOf(...sizes));
      const used = state.turns.map((turn) => turn.promptId);
      assert.equal(new Set(used).size, used.length, sizes.join('v'));
    }
  });

  it('shuffles the deck instead of dealing in file order', () => {
    const state = newGame();
    assert.notDeepEqual(
      state.turns.map((turn) => turn.promptId),
      promptIds.slice(0, state.turns.length),
    );
  });

  it('refuses to start when the deck cannot cover the game', () => {
    assert.throws(() => createGame(players, setupOf(2, 2), promptIds.slice(0, 9)));
  });
});

describe('results', () => {
  it('accumulates scores across turns', () => {
    let state = newGame(setupOf(3, 3));
    state = playTurn(state, 3); // t1 +2
    state = playTurn(state, 0); // t2 +0
    state = playTurn(state, 2); // t1 +1
    state = playTurn(state, 3); // t2 +2
    assert.equal(state.scores.t1, 3);
    assert.equal(state.scores.t2, 2);
  });

  it('declares a single winner', () => {
    let state = newGame(setupOf(2, 2));
    for (let i = 0; i < 5; i += 1) {
      state = playTurn(state, 2);
      state = playTurn(state, 0);
    }
    assert.equal(state.phase, 'results');
    assert.deepEqual(state.winnerTeamIds, ['t1']);
    assert.equal(isTie(state), false);
    assert.deepEqual(
      standings(state).map((row) => [row.team.number, row.score, row.rank]),
      [
        [1, 5, 1],
        [2, 0, 2],
      ],
    );
  });

  it('declares joint winners on a tie for first', () => {
    let state = newGame(setupOf(2, 2, 2));
    for (let i = 0; i < 5; i += 1) {
      state = playTurn(state, 2);
      state = playTurn(state, 2);
      state = playTurn(state, 0);
    }
    assert.equal(state.phase, 'results');
    assert.deepEqual(state.winnerTeamIds, ['t1', 't2']);
    assert.equal(isTie(state), true);
    assert.deepEqual(leaders(state), ['t1', 't2']);
    assert.deepEqual(
      standings(state).map((row) => row.rank),
      [1, 1, 3],
    );
  });

  it('play again keeps the teams and resets score and turn state', () => {
    let state = newGame(setupOf(2, 3), 7);
    for (let i = 0; i < 10; i += 1) state = playTurn(state, 2);
    assert.equal(state.phase, 'results');

    const again = restartGame(state, promptIds, createSeededRng(8));
    assert.equal(again.phase, 'team');
    assert.equal(again.turnIndex, 0);
    assert.deepEqual(again.scores, { t1: 0, t2: 0 });
    assert.deepEqual(again.winnerTeamIds, []);
    assert.equal(again.lastResult, null);
    assert.deepEqual(again.teams, state.teams);
    assert.deepEqual(again.players, state.players);
    assert.notDeepEqual(
      again.turns.map((turn) => turn.promptId),
      state.turns.map((turn) => turn.promptId),
      'expected a fresh prompt sequence',
    );
  });
});

describe('timers', () => {
  it('thinks for 5 seconds and counts the reveal down from 3', () => {
    assert.equal(SAME_ANSWER_RULES.thinkSeconds, 5);
    assert.equal(SAME_ANSWER_RULES.revealCountdownSeconds, 3);
    assert.equal(thinkMs(), 5000);
    assert.equal(revealCountdownMs(), 3000);
    assert.ok(sayItHoldMs() > 0);
  });

  it('shows 3, 2, 1 before SAY IT', () => {
    assert.deepEqual(countdownSchedule(revealCountdownMs()), [3000, 2000, 1000, 0]);
  });
});
