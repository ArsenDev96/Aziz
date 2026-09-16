import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  COUNTDOWN_TICK_MS,
  countdownSchedule,
  formatSeconds,
  msToSeconds,
  nextTickDelayMs,
  secondsToMs,
} from '../src/lib/time';
import { suddenDeathTimerMs, TIMER_OPTIONS } from '../src/modes/wrong-answer/rules';

describe('seconds <-> milliseconds', () => {
  it('converts the timer options to whole milliseconds', () => {
    assert.equal(secondsToMs(2.5), 2500);
    assert.equal(secondsToMs(3), 3000);
    assert.equal(secondsToMs(3.5), 3500);
  });

  it('rounds float noise away instead of carrying it', () => {
    assert.equal(secondsToMs(2.4999999999), 2500);
    assert.equal(secondsToMs(0.1 + 0.2), 300);
  });

  it('round-trips every option exactly', () => {
    for (const option of TIMER_OPTIONS) {
      assert.equal(msToSeconds(secondsToMs(option)), option);
    }
  });
});

describe('formatSeconds', () => {
  it('shows whole seconds without a decimal', () => {
    assert.equal(formatSeconds(3), '3');
    assert.equal(formatSeconds(2), '2');
    assert.equal(formatSeconds(0), '0');
  });

  it('shows halves with one decimal', () => {
    assert.equal(formatSeconds(2.5), '2.5');
    assert.equal(formatSeconds(3.5), '3.5');
    assert.equal(formatSeconds(0.5), '0.5');
  });

  it('never leaks float artefacts like 2.499999', () => {
    assert.equal(formatSeconds(2.4999999), '2.5');
    assert.equal(formatSeconds(2.5000001), '2.5');
    assert.equal(formatSeconds(2.9999999), '3');
    assert.equal(formatSeconds(msToSeconds(2500 - 1000 - 1000)), '0.5');
  });
});

describe('countdown ticks', () => {
  it('ticks a full second while more than a second is left', () => {
    assert.equal(COUNTDOWN_TICK_MS, 1000);
    assert.equal(nextTickDelayMs(3500), 1000);
    assert.equal(nextTickDelayMs(1000), 1000);
  });

  it('shortens the final tick to whatever is left', () => {
    assert.equal(nextTickDelayMs(500), 500);
    assert.equal(nextTickDelayMs(1), 1);
    assert.equal(nextTickDelayMs(0), 0);
    assert.equal(nextTickDelayMs(-5), 0);
  });

  it('counts a 2.5 second clock down as 2.5 → 1.5 → 0.5 → 0', () => {
    assert.deepEqual(countdownSchedule(2500), [2500, 1500, 500, 0]);
    assert.deepEqual(countdownSchedule(2500).map((ms) => formatSeconds(msToSeconds(ms))), [
      '2.5',
      '1.5',
      '0.5',
      '0',
    ]);
  });

  it('counts a 3 second clock down as 3 → 2 → 1 → 0', () => {
    assert.deepEqual(countdownSchedule(3000), [3000, 2000, 1000, 0]);
  });

  it('counts a 3.5 second clock down as 3.5 → 2.5 → 1.5 → 0.5 → 0', () => {
    assert.deepEqual(countdownSchedule(3500), [3500, 2500, 1500, 500, 0]);
  });

  it('always takes exactly the requested duration to reach zero', () => {
    for (const option of TIMER_OPTIONS) {
      for (const durationMs of [secondsToMs(option), suddenDeathTimerMs(option)]) {
        const schedule = countdownSchedule(durationMs);
        const elapsed = schedule
          .slice(0, -1)
          .reduce((total, remaining) => total + nextTickDelayMs(remaining), 0);
        assert.equal(elapsed, durationMs);
        assert.equal(schedule.at(-1), 0);
        assert.ok(schedule.every(Number.isInteger));
      }
    }
  });

  it('ends immediately for a zero-length clock', () => {
    assert.deepEqual(countdownSchedule(0), [0]);
  });
});
