import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildTeamSetup, hydrateSavedTeams } from '../src/lib/teams';

describe('saved teams', () => {
  it('starts empty on a fresh install', () => {
    assert.deepEqual(hydrateSavedTeams(null, 2), { teamCount: 2, assignments: {} });
    assert.deepEqual(hydrateSavedTeams('junk', 2), { teamCount: 2, assignments: {} });
  });

  it('keeps a valid saved split', () => {
    const saved = { teamCount: 3, assignments: { a: 0, b: 1, c: 2 } };
    assert.deepEqual(hydrateSavedTeams(saved, 2), saved);
  });

  it('drops bad entries without losing the good ones', () => {
    const stored = { teamCount: 3, assignments: { a: 0, b: -1, c: 1.5, d: '1', e: 2 } };
    assert.deepEqual(hydrateSavedTeams(stored, 2).assignments, { a: 0, e: 2 });
  });

  it('falls back to the default count when the saved one is unusable', () => {
    assert.equal(hydrateSavedTeams({ teamCount: 0 }, 2).teamCount, 2);
    assert.equal(hydrateSavedTeams({ teamCount: '3' }, 2).teamCount, 2);
  });

  it('ignores saved assignments for players no longer on the roster', () => {
    const { assignments, teamCount } = hydrateSavedTeams(
      { teamCount: 2, assignments: { gone: 0, a: 0, b: 1 } },
      2,
    );
    assert.deepEqual(buildTeamSetup(['a', 'b'], assignments, teamCount).teams, [['a'], ['b']]);
  });
});
