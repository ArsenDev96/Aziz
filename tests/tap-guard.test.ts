import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createTapGuard } from '../src/lib/tap-guard';

const clock = (start = 0) => {
  let t = start;
  return { now: () => t, advance: (ms: number) => (t += ms) };
};

describe('tap guard', () => {
  it('runs the first tap and ignores a second one inside the lock window', () => {
    const c = clock();
    const guard = createTapGuard(350, c.now);
    let runs = 0;
    assert.equal(guard.accept(() => runs++), true);
    c.advance(100);
    assert.equal(guard.accept(() => runs++), false);
    c.advance(200);
    assert.equal(guard.accept(() => runs++), false);
    assert.equal(runs, 1);
  });

  it('accepts again once the lock has elapsed', () => {
    const c = clock();
    const guard = createTapGuard(350, c.now);
    let runs = 0;
    guard.accept(() => runs++);
    c.advance(350);
    assert.equal(guard.accept(() => runs++), true);
    assert.equal(runs, 2);
  });

  it('locks CORRECT and SKIP together - one guard covers both buttons', () => {
    const c = clock();
    const guard = createTapGuard(350, c.now);
    const log: string[] = [];
    guard.accept(() => log.push('correct'));
    c.advance(50);
    guard.accept(() => log.push('skip'));
    c.advance(50);
    guard.accept(() => log.push('correct'));
    assert.deepEqual(log, ['correct']);
  });

  it('a rejected tap does not extend the lock', () => {
    const c = clock();
    const guard = createTapGuard(350, c.now);
    let runs = 0;
    guard.accept(() => runs++);
    c.advance(300);
    guard.accept(() => runs++);
    c.advance(50);
    assert.equal(guard.accept(() => runs++), true);
    assert.equal(runs, 2);
  });

  it('uses the real clock by default', () => {
    const guard = createTapGuard(1000);
    let runs = 0;
    guard.accept(() => runs++);
    guard.accept(() => runs++);
    assert.equal(runs, 1);
  });
});
