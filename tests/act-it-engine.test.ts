import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createSeededRng } from '../src/lib/random';
import {
  buildSchedule,
  canSkip,
  createGame,
  currentActors,
  currentGuesser,
  currentTeam,
  go,
  isLastTurn,
  isTie,
  leaders,
  markCorrect,
  next,
  ready,
  restartGame,
  roundProgress,
  skip,
  skipsLeft,
  standings,
  teamPlayers,
  timeUp,
  turnProgress,
  turnsPerTeamFor,
  validateSetup,
  type ActItState,
  type Player,
  type TeamSetup,
} from '../src/modes/act-it/engine';
import { ACT_IT_RULES, goHoldMs, startCountdownMs, turnMs } from '../src/modes/act-it/rules';
import { countdownSchedule } from '../src/lib/time';

const roster: Player[] = [
  { id: 'A', name: 'Aram' },
  { id: 'B', name: 'Ani' },
  { id: 'C', name: 'Gor' },
  { id: 'D', name: 'Mari' },
  { id: 'E', name: 'Narek' },
  { id: 'F', name: 'Davit' },
  { id: 'G', name: 'Lilit' },
  { id: 'H', name: 'Karen' },
  { id: 'I', name: 'Mane' },
];

const cardIds = Array.from({ length: 200 }, (_, i) => `ai-${String(i + 1).padStart(3, '0')}`);

const setupOf = (teams: string[][]): TeamSetup => ({ selectedPlayerIds: teams.flat(), teams });

const newGame = (teams: string[][], seed = 1) =>
  createGame(roster, setupOf(teams), cardIds, createSeededRng(seed));

/** From the guesser screen into live play. */
const startTurn = (state: ActItState) => go(ready(state));

/** Plays a whole turn: `correct` right answers, `skips` skips, then the clock runs out. */
const playTurn = (state: ActItState, correct: number, skips = 0): ActItState => {
  let s = startTurn(state);
  for (let i = 0; i < correct; i += 1) s = markCorrect(s);
  for (let i = 0; i < skips; i += 1) s = skip(s);
  return next(timeUp(s));
};

/** Walks the whole schedule, recording who guessed for which team, one correct per turn. */
const traceGame = (state: ActItState) => {
  const trace: { team: number; guesser: string; round: number }[] = [];
  let s = state;
  while (s.phase !== 'results') {
    trace.push({
      team: currentTeam(s)!.number,
      guesser: currentGuesser(s)!.id,
      round: roundProgress(s).current,
    });
    s = playTurn(s, 1);
  }
  return { trace, state: s };
};

describe('setup validation', () => {
  it('rejects 3 total players', () => {
    assert.ok(validateSetup(setupOf([['A', 'B'], ['C']])).includes('tooFewPlayers'));
    assert.throws(() => newGame([['A', 'B'], ['C']]));
  });

  it('accepts 4 players as 2 + 2', () => {
    assert.deepEqual(validateSetup(setupOf([['A', 'B'], ['C', 'D']])), []);
    assert.equal(newGame([['A', 'B'], ['C', 'D']]).players.length, 4);
  });

  it('accepts 8 players', () => {
    const teams = [['A', 'B', 'C', 'D'], ['E', 'F', 'G', 'H']];
    assert.deepEqual(validateSetup(setupOf(teams)), []);
    assert.equal(newGame(teams).players.length, 8);
  });

  it('rejects 9 players', () => {
    const teams = [['A', 'B', 'C'], ['D', 'E', 'F'], ['G', 'H', 'I']];
    assert.ok(validateSetup(setupOf(teams)).includes('tooManyPlayers'));
    assert.throws(() => newGame(teams));
  });

  it('rejects a team with only one player', () => {
    assert.ok(validateSetup(setupOf([['A', 'B', 'C'], ['D']])).includes('teamTooSmall'));
    assert.throws(() => newGame([['A', 'B', 'C'], ['D']]));
  });

  it('accepts 2, 3 and 4 teams', () => {
    assert.deepEqual(validateSetup(setupOf([['A', 'B'], ['C', 'D']])), []);
    assert.deepEqual(validateSetup(setupOf([['A', 'B'], ['C', 'D'], ['E', 'F']])), []);
    assert.deepEqual(validateSetup(setupOf([['A', 'B'], ['C', 'D'], ['E', 'F'], ['G', 'H']])), []);
  });

  it('rejects 5 teams and 1 team', () => {
    const five = [['A', 'B'], ['C', 'D'], ['E', 'F'], ['G', 'H'], ['I', 'A']];
    assert.ok(validateSetup(setupOf(five)).includes('tooManyTeams'));
    assert.ok(validateSetup(setupOf([['A', 'B', 'C', 'D']])).includes('tooFewTeams'));
  });

  it('accepts uneven teams: 3+2+2, 3+3+2, 2+2+2+2', () => {
    assert.deepEqual(validateSetup(setupOf([['A', 'B', 'C'], ['D', 'E'], ['F', 'G']])), []);
    assert.deepEqual(validateSetup(setupOf([['A', 'B', 'C'], ['D', 'E', 'F'], ['G', 'H']])), []);
    assert.deepEqual(validateSetup(setupOf([['A', 'B'], ['C', 'D'], ['E', 'F'], ['G', 'H']])), []);
  });

  it('rejects a player on two teams', () => {
    assert.ok(validateSetup(setupOf([['A', 'B'], ['B', 'C']])).includes('duplicatePlayer'));
  });

  it('rejects a selected player without a team', () => {
    const errors = validateSetup({ selectedPlayerIds: ['A', 'B', 'C', 'D', 'E'], teams: [['A', 'B'], ['C', 'D']] });
    assert.ok(errors.includes('unassignedPlayer'));
  });

  it('refuses to start without cards or with an unknown player', () => {
    assert.throws(() => createGame(roster, setupOf([['A', 'B'], ['C', 'D']]), []));
    assert.throws(() => createGame(roster, setupOf([['A', 'B'], ['C', 'Z']]), cardIds));
  });
});

describe('turn count fairness', () => {
  const turnsByTeam = (teams: string[][]) => {
    const { trace } = traceGame(newGame(teams));
    const counts: Record<number, number> = {};
    for (const turn of trace) counts[turn.team] = (counts[turn.team] ?? 0) + 1;
    return counts;
  };

  it('2 vs 2: each team gets 2 turns', () => {
    assert.deepEqual(turnsByTeam([['A', 'B'], ['C', 'D']]), { 1: 2, 2: 2 });
  });

  it('3 vs 3: each team gets 3 turns', () => {
    assert.deepEqual(turnsByTeam([['A', 'B', 'C'], ['D', 'E', 'F']]), { 1: 3, 2: 3 });
  });

  it('3 vs 2: both teams get 3 turns and the small team repeats its first player', () => {
    const state = newGame([['A', 'B', 'C'], ['D', 'E']]);
    assert.equal(state.turnsPerTeam, 3);
    const { trace } = traceGame(state);
    assert.deepEqual(
      trace.map((turn) => turn.guesser),
      ['A', 'D', 'B', 'E', 'C', 'D'],
    );
  });

  it('3 vs 3 vs 2: all teams get 3 turns', () => {
    assert.deepEqual(
      turnsByTeam([['A', 'B', 'C'], ['D', 'E', 'F'], ['G', 'H']]),
      { 1: 3, 2: 3, 3: 3 },
    );
  });

  it('2 vs 2 vs 2 vs 2: all teams get 2 turns', () => {
    assert.deepEqual(
      turnsByTeam([['A', 'B'], ['C', 'D'], ['E', 'F'], ['G', 'H']]),
      { 1: 2, 2: 2, 3: 2, 4: 2 },
    );
  });

  it('turnsPerTeam is the size of the largest team', () => {
    assert.equal(turnsPerTeamFor([{ playerIds: ['A', 'B'] }, { playerIds: ['C', 'D', 'E', 'F'] }]), 4);
    assert.equal(newGame([['A', 'B', 'C', 'D'], ['E', 'F']]).turns.length, 8);
  });

  it('a 2-player team needing 4 turns alternates, a 3-player team wraps to its first', () => {
    const two = buildSchedule([
      { id: 't1', number: 1, playerIds: ['A', 'B', 'C', 'D'] },
      { id: 't2', number: 2, playerIds: ['G', 'H'] },
    ]).filter((turn) => turn.teamId === 't2');
    assert.deepEqual(two.map((turn) => turn.guesserId), ['G', 'H', 'G', 'H']);

    const three = buildSchedule([
      { id: 't1', number: 1, playerIds: ['A', 'B', 'C', 'D'] },
      { id: 't2', number: 2, playerIds: ['E', 'F', 'G'] },
    ]).filter((turn) => turn.teamId === 't2');
    assert.deepEqual(three.map((turn) => turn.guesserId), ['E', 'F', 'G', 'E']);
  });
});

describe('turn ordering', () => {
  it('goes round → team → guesser: A D G B E H C F G', () => {
    const state = newGame([['A', 'B', 'C'], ['D', 'E', 'F'], ['G', 'H']]);
    const { trace } = traceGame(state);
    assert.deepEqual(
      trace.map((turn) => turn.guesser),
      ['A', 'D', 'G', 'B', 'E', 'H', 'C', 'F', 'G'],
    );
    assert.deepEqual(
      trace.map((turn) => turn.team),
      [1, 2, 3, 1, 2, 3, 1, 2, 3],
    );
    assert.deepEqual(
      trace.map((turn) => turn.round),
      [1, 1, 1, 2, 2, 2, 3, 3, 3],
    );
  });

  it('keeps team order and player order exactly as set up — nothing shuffled', () => {
    const teams = [['C', 'A'], ['F', 'D', 'E']];
    for (const seed of [1, 2, 3, 4, 5]) {
      const state = newGame(teams, seed);
      assert.deepEqual(state.teams.map((team) => team.playerIds), teams);
      assert.deepEqual(
        state.turns.map((turn) => turn.guesserId),
        ['C', 'F', 'A', 'D', 'C', 'E'],
      );
    }
  });

  it('reports turn and round progress', () => {
    let state = newGame([['A', 'B', 'C'], ['D', 'E']]);
    assert.deepEqual(turnProgress(state), { current: 1, total: 6 });
    assert.deepEqual(roundProgress(state), { current: 1, total: 3 });
    state = playTurn(state, 0);
    state = playTurn(state, 0);
    assert.deepEqual(turnProgress(state), { current: 3, total: 6 });
    assert.deepEqual(roundProgress(state), { current: 2, total: 3 });
  });

  it('walks the in-turn phases in order', () => {
    let state = newGame([['A', 'B'], ['C', 'D']]);
    assert.equal(state.phase, 'guesser');
    assert.equal(state.cardId, null);
    state = ready(state);
    assert.equal(state.phase, 'countdown');
    assert.equal(state.cardId, null, 'no card before GO');
    state = go(state);
    assert.equal(state.phase, 'playing');
    assert.ok(state.cardId, 'first card dealt on GO');
    state = timeUp(state);
    assert.equal(state.phase, 'timeUp');
    assert.equal(state.cardId, null, 'card hidden once time is up');
    state = next(state);
    assert.equal(state.phase, 'guesser');
    assert.equal(state.turnIndex, 1);
  });

  it('ends after the final scheduled turn and not before', () => {
    let state = newGame([['A', 'B'], ['C', 'D']]);
    for (let i = 0; i < 3; i += 1) {
      assert.equal(isLastTurn(state), false);
      state = playTurn(state, 1);
      assert.equal(state.phase, 'guesser');
    }
    assert.equal(isLastTurn(state), true);
    state = playTurn(state, 1);
    assert.equal(state.phase, 'results');
  });

  it('ignores transitions from the wrong phase', () => {
    const state = newGame([['A', 'B'], ['C', 'D']]);
    assert.equal(go(state), state);
    assert.equal(timeUp(state), state);
    assert.equal(next(state), state);
    assert.equal(markCorrect(state), state);
    assert.equal(skip(state), state);
  });
});

describe('actors', () => {
  it('when A guesses, B and C act and A is not among them', () => {
    const state = newGame([['A', 'B', 'C'], ['D', 'E', 'F']]);
    assert.equal(currentGuesser(state)!.id, 'A');
    assert.deepEqual(currentActors(state).map((player) => player.id), ['B', 'C']);
  });

  it('on a 2-player team the single teammate acts', () => {
    let state = newGame([['A', 'B', 'C'], ['D', 'E', 'F'], ['G', 'H']]);
    state = playTurn(state, 0);
    state = playTurn(state, 0);
    assert.equal(currentGuesser(state)!.id, 'G');
    assert.deepEqual(currentActors(state).map((player) => player.id), ['H']);
  });

  it('never lists players from other teams as actors', () => {
    let state = newGame([['A', 'B'], ['C', 'D', 'E'], ['F', 'G']]);
    while (state.phase !== 'results') {
      const team = currentTeam(state)!;
      for (const actor of currentActors(state)) assert.ok(team.playerIds.includes(actor.id));
      assert.equal(currentActors(state).length, team.playerIds.length - 1);
      state = playTurn(state, 0);
    }
  });

  it('lists a team’s players in setup order', () => {
    const state = newGame([['B', 'A'], ['D', 'C']]);
    assert.deepEqual(teamPlayers(state, state.teams[0]).map((player) => player.id), ['B', 'A']);
  });
});

describe('scoring', () => {
  it('adds exactly one point to the active TEAM for CORRECT', () => {
    const state = markCorrect(startTurn(newGame([['A', 'B'], ['C', 'D']])));
    assert.deepEqual(state.scores, { t1: 1, t2: 0 });
    assert.equal(state.turnCorrect, 1);
    assert.equal(ACT_IT_RULES.correctPoints, 1);
  });

  it('keeps no per-player score at all', () => {
    const state = markCorrect(startTurn(newGame([['A', 'B'], ['C', 'D']])));
    assert.deepEqual(Object.keys(state.scores).sort(), ['t1', 't2']);
  });

  it('adds nothing for SKIP', () => {
    const state = skip(startTurn(newGame([['A', 'B'], ['C', 'D']])));
    assert.deepEqual(state.scores, { t1: 0, t2: 0 });
    assert.equal(state.turnCorrect, 0);
  });

  it('keeps the next team’s score independent', () => {
    let state = newGame([['A', 'B'], ['C', 'D']]);
    state = playTurn(state, 4);
    assert.deepEqual(state.scores, { t1: 4, t2: 0 });
    state = playTurn(state, 2);
    assert.deepEqual(state.scores, { t1: 4, t2: 2 });
  });

  it('accumulates a team’s score across different guessers', () => {
    let state = newGame([['A', 'B', 'C'], ['D', 'E']]);
    state = playTurn(state, 3); // A
    state = playTurn(state, 1); // D
    state = playTurn(state, 2); // B
    state = playTurn(state, 1); // E
    state = playTurn(state, 4); // C
    assert.equal(state.scores.t1, 9);
    assert.equal(state.scores.t2, 2);
  });
});

describe('current-turn score', () => {
  it('starts at 0, counts only CORRECT, resets on the next turn while the team total stays', () => {
    let state = startTurn(newGame([['A', 'B'], ['C', 'D']]));
    assert.equal(state.turnCorrect, 0);
    state = markCorrect(markCorrect(skip(state)));
    assert.equal(state.turnCorrect, 2);
    state = next(timeUp(state));
    assert.equal(state.turnCorrect, 0);
    assert.equal(state.scores.t1, 2);
  });
});

describe('skips', () => {
  it('allows the first and second skip, then refuses the third', () => {
    let state = startTurn(newGame([['A', 'B'], ['C', 'D']]));
    assert.equal(skipsLeft(state), 2);
    assert.ok(canSkip(state));

    state = skip(state);
    assert.equal(skipsLeft(state), 1);
    state = skip(state);
    assert.equal(skipsLeft(state), 0);
    assert.equal(canSkip(state), false);

    const refused = skip(state);
    assert.equal(refused, state, 'third skip must leave the state untouched');
  });

  it('deals a new card on a skip but not on a refused skip', () => {
    let state = startTurn(newGame([['A', 'B'], ['C', 'D']]));
    const first = state.cardId;
    state = skip(state);
    assert.notEqual(state.cardId, first);
    state = skip(state);
    const afterSecond = state.cardId;
    assert.equal(skip(state).cardId, afterSecond);
  });

  it('resets every turn', () => {
    let state = startTurn(newGame([['A', 'B'], ['C', 'D']]));
    state = next(timeUp(skip(skip(state))));
    assert.equal(state.skipsUsed, 0);
    assert.equal(skipsLeft(startTurn(state)), ACT_IT_RULES.maxSkipsPerTurn);
  });
});

describe('cards', () => {
  it('never repeats a card across the whole game, including across teams', () => {
    let state = newGame([['A', 'B', 'C'], ['D', 'E', 'F'], ['G', 'H']]);
    const dealt: string[] = [];
    while (state.phase !== 'results') {
      state = startTurn(state);
      // 18 correct + 2 skips a turn is far beyond a real 45 seconds.
      for (let i = 0; i < 18; i += 1) {
        dealt.push(state.cardId!);
        state = markCorrect(state);
      }
      dealt.push(state.cardId!);
      state = skip(state);
      dealt.push(state.cardId!);
      state = skip(state);
      state = next(timeUp(state));
    }
    assert.equal(dealt.length, 9 * 20);
    assert.equal(new Set(dealt).size, dealt.length);
  });

  it('does not reset the deck when the turn passes to another team', () => {
    let state = newGame([['A', 'B'], ['C', 'D']]);
    state = startTurn(state);
    const firstTeamCards = [state.cardId!];
    state = markCorrect(state);
    firstTeamCards.push(state.cardId!);
    state = next(timeUp(state));
    state = startTurn(state);
    assert.equal(state.deckIndex, 3);
    assert.ok(!firstTeamCards.includes(state.cardId!));
  });

  it('shuffles the deck instead of dealing in file order', () => {
    const state = newGame([['A', 'B'], ['C', 'D']]);
    assert.notDeepEqual(state.deck.slice(0, 20), cardIds.slice(0, 20));
  });

  it('deals a fresh card after every CORRECT', () => {
    let state = startTurn(newGame([['A', 'B'], ['C', 'D']]));
    const seen = new Set<string>();
    for (let i = 0; i < 10; i += 1) {
      seen.add(state.cardId!);
      state = markCorrect(state);
    }
    assert.equal(seen.size, 10);
  });
});

describe('results', () => {
  it('ranks teams and declares a single winning team', () => {
    let state = newGame([['A', 'B'], ['C', 'D'], ['E', 'F']]);
    state = playTurn(state, 7); // t1
    state = playTurn(state, 5); // t2
    state = playTurn(state, 4); // t3
    state = playTurn(state, 7); // t1
    state = playTurn(state, 6); // t2
    state = playTurn(state, 4); // t3
    assert.equal(state.phase, 'results');
    assert.deepEqual(state.winnerTeamIds, ['t1']);
    assert.equal(isTie(state), false);
    assert.deepEqual(
      standings(state).map((row) => [row.team.number, row.score, row.rank]),
      [
        [1, 14, 1],
        [2, 11, 2],
        [3, 8, 3],
      ],
    );
  });

  it('declares joint winning teams on a tie for first', () => {
    let state = newGame([['A', 'B'], ['C', 'D'], ['E', 'F']]);
    state = playTurn(state, 7); // t1
    state = playTurn(state, 5); // t2
    state = playTurn(state, 8); // t3
    state = playTurn(state, 7); // t1
    state = playTurn(state, 6); // t2
    state = playTurn(state, 6); // t3
    assert.equal(state.phase, 'results');
    assert.deepEqual(state.winnerTeamIds, ['t1', 't3']);
    assert.deepEqual(leaders(state), ['t1', 't3']);
    assert.ok(isTie(state));
    assert.deepEqual(
      standings(state).map((row) => [row.team.number, row.rank]),
      [
        [1, 1],
        [3, 1],
        [2, 3],
      ],
    );
  });

  it('has no individual winner: results hold only team ids', () => {
    let state = newGame([['A', 'B'], ['C', 'D']]);
    while (state.phase !== 'results') state = playTurn(state, 2);
    for (const id of state.winnerTeamIds) assert.ok(state.teams.some((team) => team.id === id));
    assert.ok(!('winnerIds' in state));
  });
});

describe('play again', () => {
  it('keeps the teams, assignments and order; resets scores, turn, skips and cards', () => {
    let state = newGame([['C', 'A', 'B'], ['E', 'D']], 3);
    state = playTurn(state, 4, 2);
    state = playTurn(state, 2, 1);
    state = playTurn(state, 6, 2);
    state = playTurn(state, 1, 0);
    state = playTurn(state, 3, 1);
    state = playTurn(state, 2, 2);
    assert.equal(state.phase, 'results');

    const again = restartGame(state, cardIds, createSeededRng(4));
    assert.equal(again.phase, 'guesser');
    assert.equal(again.turnIndex, 0);
    assert.equal(again.skipsUsed, 0);
    assert.equal(again.turnCorrect, 0);
    assert.equal(again.cardId, null);
    assert.equal(again.deckIndex, 0);
    assert.deepEqual(again.winnerTeamIds, []);
    assert.deepEqual(again.scores, { t1: 0, t2: 0 });

    assert.deepEqual(again.teams, state.teams, 'same teams, same assignments, same player order');
    assert.deepEqual(again.turns, state.turns, 'same schedule: round 1, team 1, first guesser');
    assert.equal(currentGuesser(again)!.id, 'C');
    assert.deepEqual(
      again.players.map((player) => player.id),
      state.players.map((player) => player.id),
    );
    assert.notDeepEqual(again.deck.slice(0, 20), state.deck.slice(0, 20), 'fresh deck');
  });
});

describe('timers', () => {
  it('gives each turn 45 seconds and counts in from 3', () => {
    assert.equal(ACT_IT_RULES.turnSeconds, 45);
    assert.equal(turnMs(), 45000);
    assert.equal(ACT_IT_RULES.startCountdownSeconds, 3);
    assert.deepEqual(countdownSchedule(startCountdownMs()), [3000, 2000, 1000, 0]);
    assert.ok(goHoldMs() > 0);
  });
});
