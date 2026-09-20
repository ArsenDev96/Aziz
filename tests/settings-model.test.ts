import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { hasChosenLanguage, hydrateSettings } from '../src/state/settings-model';

describe('first-launch language choice', () => {
  it('is not chosen on a fresh install (nothing in storage)', () => {
    assert.equal(hasChosenLanguage(null), false);
    assert.equal(hasChosenLanguage(undefined), false);
    assert.equal(hasChosenLanguage({}), false);
    assert.equal(hasChosenLanguage({ haptics: false }), false);
  });

  it('is chosen once a supported language was saved', () => {
    assert.equal(hasChosenLanguage({ language: 'hy' }), true);
    assert.equal(hasChosenLanguage({ language: 'en', haptics: true }), true);
  });

  it('ignores a language the app no longer supports', () => {
    assert.equal(hasChosenLanguage({ language: 'ru' as never }), false);
  });

  it('still hydrates Armenian as the default until a choice is made', () => {
    assert.equal(hydrateSettings(null).language, 'hy');
  });
});
