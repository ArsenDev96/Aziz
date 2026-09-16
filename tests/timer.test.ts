import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createSeededRng } from '../src/lib/random';
import {
  createGame,
  currentTimerMs,
  currentTimerSeconds,
  currentTurn,
  judgeTurn,
  startQuestion,
  timeUp,
  type GameState,
  type Player,
  type Verdict,
} from '../src/modes/wrong-answer/engine';
import {
  isTimerSeconds,
  normalizeTimerSeconds,
  suddenDeathTimerMs,
  suddenDeathTimerSeconds,
  TIMER_OPTIONS,
  timerMsForRound,
  timerSecondsForRound,
  WRONG_ANSWER_RULES,
  type TimerSeconds,
} from '../src/modes/wrong-answer/rules';
import { DEFAULT_SETTINGS, hydrateSettings } from '../src/state/settings-model';

const players: Player[] = [
  { id: 'p1', name: 'Aram' },
  { id: 'p2', name: 'Ani' },
  { id: 'p3', name: 'Gor' },
];

const questionIds = Array.from({ length: 30 }, (_, i) => `wa-${String(i + 1).padStart(3, '0')}`);

const playTurn = (state: GameState, verdict: Verdict): GameState =>
  judgeTurn(timeUp(startQuestion(state)), verdict);

/** Plays normal play so that the first two players finish level at the top. */
const playToSuddenDeath = (timerSeconds: TimerSeconds): GameState => {
  let state = createGame(players, questionIds, createSeededRng(7), timerSeconds);
  const tied = state.players.slice(0, 2).map((player) => player.id);
  while (state.suddenDeathRound === 0 && state.phase !== 'results') {
    state = playTurn(state, tied.includes(currentTurn(state)!.playerId) ? 'pass' : 'fail');
  }
  assert.equal(state.suddenDeathRound, 1, 'expected the game to reach sudden death');
  return state;
};

describe('timer options', () => {
  it('offers exactly 2.5, 3 and 3.5 seconds', () => {
    assert.deepEqual([...TIMER_OPTIONS], [2.5, 3, 3.5]);
  });

  it('defaults to 3 seconds', () => {
    assert.equal(WRONG_ANSWER_RULES.defaultTimerSeconds, 3);
    assert.equal(timerSecondsForRound(0), 3);
    assert.equal(timerMsForRound(0), 3000);
  });

  it('accepts only the listed options', () => {
    for (const option of TIMER_OPTIONS) assert.ok(isTimerSeconds(option));
    assert.equal(isTimerSeconds(2), false);
    assert.equal(isTimerSeconds(4), false);
    assert.equal(isTimerSeconds(5), false);
    assert.equal(isTimerSeconds('3'), false);
    assert.equal(isTimerSeconds(undefined), false);
  });

  it('keeps a valid pick and falls back to 3 for anything else', () => {
    assert.equal(normalizeTimerSeconds(2.5), 2.5);
    assert.equal(normalizeTimerSeconds(3), 3);
    assert.equal(normalizeTimerSeconds(3.5), 3.5);
    assert.equal(normalizeTimerSeconds(undefined), 3);
    assert.equal(normalizeTimerSeconds(null), 3);
    assert.equal(normalizeTimerSeconds(9), 3);
    assert.equal(normalizeTimerSeconds('3'), 3);
    assert.equal(normalizeTimerSeconds(Number.NaN), 3);
  });

  it('sends the retired 4 and 5 second picks to the default', () => {
    assert.equal(normalizeTimerSeconds(4), 3);
    assert.equal(normalizeTimerSeconds(5), 3);
  });
});

describe('sudden-death timer', () => {
  it('is half a second shorter than the selected timer', () => {
    assert.equal(suddenDeathTimerSeconds(2.5), 2);
    assert.equal(suddenDeathTimerSeconds(3), 2.5);
    assert.equal(suddenDeathTimerSeconds(3.5), 3);
  });

  it('is computed in whole milliseconds', () => {
    assert.equal(suddenDeathTimerMs(2.5), 2000);
    assert.equal(suddenDeathTimerMs(3), 2500);
    assert.equal(suddenDeathTimerMs(3.5), 3000);
    for (const option of TIMER_OPTIONS) assert.ok(Number.isInteger(suddenDeathTimerMs(option)));
  });

  it('never drops below two seconds', () => {
    assert.equal(WRONG_ANSWER_RULES.minSuddenDeathTimerSeconds, 2);
    assert.equal(suddenDeathTimerSeconds(2.5), 2);
    assert.equal(suddenDeathTimerSeconds(2.4), 2);
    assert.equal(suddenDeathTimerSeconds(2), 2);
    assert.equal(suddenDeathTimerSeconds(1), 2);
    assert.equal(suddenDeathTimerSeconds(0), 2);
    assert.equal(suddenDeathTimerMs(0), 2000);
  });

  it('is what the per-round helpers report for the tie-break round', () => {
    for (const option of TIMER_OPTIONS) {
      assert.equal(timerSecondsForRound(0, option), option);
      assert.equal(timerSecondsForRound(1, option), suddenDeathTimerSeconds(option));
      assert.equal(timerMsForRound(0, option), option * 1000);
      assert.equal(timerMsForRound(1, option), suddenDeathTimerMs(option));
    }
  });
});

describe('the engine and the selected timer', () => {
  it('uses the default timer when a game is created without a selection', () => {
    const state = createGame(players, questionIds, createSeededRng(1));
    assert.equal(state.timerSeconds, 3);
    assert.equal(currentTimerSeconds(state), 3);
    assert.equal(currentTimerMs(state), 3000);
  });

  const expectedMs: Record<TimerSeconds, number> = { 2.5: 2500, 3: 3000, 3.5: 3500 };

  for (const option of TIMER_OPTIONS) {
    it(`runs every normal question on a ${option} second clock`, () => {
      let state = createGame(players, questionIds, createSeededRng(1), option);
      assert.equal(state.timerSeconds, option);
      while (state.phase !== 'results') {
        assert.equal(currentTurn(state)!.suddenDeathRound, 0);
        assert.equal(currentTimerSeconds(state), option);
        assert.equal(currentTimerMs(state), expectedMs[option]);
        // Rotate verdicts so the game ends without a tie and stays in normal play.
        state = playTurn(state, state.turnIndex % players.length === 0 ? 'pass' : 'fail');
      }
      assert.equal(state.suddenDeathRound, 0);
    });

    it(`runs sudden death on a ${suddenDeathTimerSeconds(option)} second clock when ${option} was selected`, () => {
      let state = playToSuddenDeath(option);
      const expected = suddenDeathTimerSeconds(option);
      assert.ok(expected >= WRONG_ANSWER_RULES.minSuddenDeathTimerSeconds);
      while (state.phase !== 'results') {
        assert.equal(currentTimerSeconds(state), expected);
        assert.equal(currentTimerMs(state), expected * 1000);
        state = playTurn(state, 'fail');
      }
    });
  }

  it('sanitises an out-of-rules timer instead of running the game on it', () => {
    const state = createGame(players, questionIds, createSeededRng(1), 4 as TimerSeconds);
    assert.equal(state.timerSeconds, 3);
  });
});

describe('settings persistence', () => {
  it('starts on 3 seconds when nothing has ever been saved', () => {
    assert.equal(DEFAULT_SETTINGS.timerSeconds, 3);
    assert.equal(hydrateSettings(null).timerSeconds, 3);
    assert.equal(hydrateSettings(undefined).timerSeconds, 3);
    assert.equal(hydrateSettings({}).timerSeconds, 3);
  });

  it('keeps the rest of an older blob that has no timer', () => {
    // A pre-timer settings blob has language and haptics but no timer.
    const settings = hydrateSettings({ language: 'en', haptics: false });
    assert.equal(settings.timerSeconds, 3);
    assert.equal(settings.language, 'en');
    assert.equal(settings.haptics, false);
  });

  for (const option of TIMER_OPTIONS) {
    it(`restores a saved ${option} second selection`, () => {
      assert.equal(hydrateSettings({ timerSeconds: option }).timerSeconds, option);
    });
  }

  const stored = (timerSeconds: unknown) =>
    ({ timerSeconds }) as unknown as Partial<typeof DEFAULT_SETTINGS>;

  it('normalises the retired 4 and 5 second picks to 3', () => {
    assert.equal(hydrateSettings(stored(4)).timerSeconds, 3);
    assert.equal(hydrateSettings(stored(5)).timerSeconds, 3);
  });

  it('discards an invalid saved value', () => {
    assert.equal(hydrateSettings(stored(7)).timerSeconds, 3);
    assert.equal(hydrateSettings(stored('3')).timerSeconds, 3);
    assert.equal(hydrateSettings(stored(null)).timerSeconds, 3);
  });

  it('survives a JSON round-trip the way storage does it', () => {
    for (const option of TIMER_OPTIONS) {
      const saved = JSON.parse(JSON.stringify({ ...DEFAULT_SETTINGS, timerSeconds: option }));
      assert.equal(hydrateSettings(saved).timerSeconds, option);
    }
  });
});
