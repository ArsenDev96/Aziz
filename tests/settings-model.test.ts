import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { WRONG_ANSWER_RULES } from '../src/modes/wrong-answer/rules';
import { DEFAULT_SETTINGS, hasChosenLanguage, hydrateSettings } from '../src/state/settings-model';

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

  it('is not chosen when storage holds something that is not an object', () => {
    assert.equal(hasChosenLanguage('garbage' as never), false);
    assert.equal(hasChosenLanguage(12 as never), false);
    assert.equal(hasChosenLanguage([] as never), false);
  });

  it('still hydrates Armenian as the default until a choice is made', () => {
    assert.equal(hydrateSettings(null).language, 'hy');
  });
});

describe('hydrateSettings normalizes what storage returns', () => {
  it('keeps a valid Armenian choice', () => {
    assert.equal(hydrateSettings({ language: 'hy' }).language, 'hy');
  });

  it('keeps a valid English choice', () => {
    assert.equal(hydrateSettings({ language: 'en' }).language, 'en');
  });

  it('falls back to the default language for an unsupported code', () => {
    assert.equal(hydrateSettings({ language: 'ru' as never }).language, DEFAULT_SETTINGS.language);
    assert.equal(hydrateSettings({ language: '' as never }).language, DEFAULT_SETTINGS.language);
    assert.equal(hydrateSettings({ language: 42 as never }).language, DEFAULT_SETTINGS.language);
    assert.equal(hydrateSettings({ language: null as never }).language, DEFAULT_SETTINGS.language);
  });

  it('keeps the other settings when only the language was bad', () => {
    const hydrated = hydrateSettings({ language: 'ru' as never, haptics: false, timerSeconds: 3 });
    assert.deepEqual(hydrated, { language: 'hy', haptics: false, timerSeconds: 3 });
  });

  it('fills a partial object with the defaults', () => {
    assert.deepEqual(hydrateSettings({}), DEFAULT_SETTINGS);
    assert.deepEqual(hydrateSettings({ haptics: false }), { ...DEFAULT_SETTINGS, haptics: false });
  });

  it('coerces a malformed haptics value back to the default', () => {
    assert.equal(hydrateSettings({ haptics: 'yes' as never }).haptics, DEFAULT_SETTINGS.haptics);
    assert.equal(hydrateSettings({ haptics: 0 as never }).haptics, DEFAULT_SETTINGS.haptics);
    assert.equal(hydrateSettings({ haptics: false }).haptics, false);
  });

  it('re-validates the timer against the rules', () => {
    assert.equal(
      hydrateSettings({ timerSeconds: 99 as never }).timerSeconds,
      WRONG_ANSWER_RULES.defaultTimerSeconds,
    );
    assert.equal(
      hydrateSettings({ timerSeconds: '3' as never }).timerSeconds,
      WRONG_ANSWER_RULES.defaultTimerSeconds,
    );
  });

  it('survives storage that is not an object at all', () => {
    assert.deepEqual(hydrateSettings('garbage' as never), DEFAULT_SETTINGS);
    assert.deepEqual(hydrateSettings(12 as never), DEFAULT_SETTINGS);
    assert.deepEqual(hydrateSettings([] as never), DEFAULT_SETTINGS);
  });

  it('drops unknown keys instead of carrying them into the app', () => {
    assert.deepEqual(hydrateSettings({ language: 'en', extra: 1 } as never), {
      ...DEFAULT_SETTINGS,
      language: 'en',
    });
  });
});
