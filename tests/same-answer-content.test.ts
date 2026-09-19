import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  getSameAnswerPromptMap,
  getSameAnswerPrompts,
  type Prompt,
} from '../src/content/same-answer';
import { sameAnswerEn } from '../src/content/same-answer/en';
import { sameAnswerHy } from '../src/content/same-answer/hy';

const DECK_SIZE = 100;

/** A prompt is read out loud and has to fit on one screen above a countdown. */
const MAX_TEXT_LENGTH = 60;

const CATEGORIES = new Set([
  'everyday',
  'food',
  'armenia',
  'animals',
  'places',
  'objects',
  'entertainment',
  'technology',
  'travel',
  'social',
]);

const decks: { name: string; prompts: Prompt[] }[] = [
  { name: 'Armenian', prompts: sameAnswerHy },
  { name: 'English', prompts: sameAnswerEn },
];

const normalize = (text: string) => text.trim().replace(/\s+/g, ' ').toLocaleLowerCase();

const duplicates = (values: string[]): string[] => {
  const seen = new Set<string>();
  const found = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) found.add(value);
    seen.add(value);
  }
  return [...found];
};

describe('prompt deck size', () => {
  for (const { name, prompts } of decks) {
    it(`has exactly ${DECK_SIZE} ${name} prompts`, () => {
      assert.equal(prompts.length, DECK_SIZE);
    });
  }
});

describe('prompt ids', () => {
  for (const { name, prompts } of decks) {
    it(`${name} ids are unique`, () => {
      assert.deepEqual(duplicates(prompts.map((prompt) => prompt.id)), []);
    });

    it(`${name} ids follow the sa-NNN convention in order`, () => {
      prompts.forEach((prompt, index) => {
        assert.equal(prompt.id, `sa-${String(index + 1).padStart(3, '0')}`);
      });
    });
  }

  it('every Armenian prompt has an English twin with the same id', () => {
    const en = getSameAnswerPromptMap('en');
    for (const prompt of sameAnswerHy) {
      assert.ok(en[prompt.id], `no English prompt for ${prompt.id}`);
    }
  });

  it('every English prompt has an Armenian twin with the same id', () => {
    const hy = getSameAnswerPromptMap('hy');
    for (const prompt of sameAnswerEn) {
      assert.ok(hy[prompt.id], `no Armenian prompt for ${prompt.id}`);
    }
  });

  it('paired prompts share a category', () => {
    const en = getSameAnswerPromptMap('en');
    for (const prompt of sameAnswerHy) {
      assert.equal(prompt.category, en[prompt.id].category, prompt.id);
    }
  });
});

describe('prompt text', () => {
  for (const { name, prompts } of decks) {
    it(`no ${name} prompt is empty`, () => {
      for (const prompt of prompts) {
        assert.ok(prompt.text.trim().length > 0, `${prompt.id} is empty`);
      }
    });

    it(`no ${name} prompt text is repeated`, () => {
      assert.deepEqual(duplicates(prompts.map((prompt) => normalize(prompt.text))), []);
    });

    it(`every ${name} prompt is short enough to read at a glance`, () => {
      for (const prompt of prompts) {
        assert.ok(
          prompt.text.length <= MAX_TEXT_LENGTH,
          `${prompt.id} is ${prompt.text.length} characters: "${prompt.text}"`,
        );
      }
    });

    it(`every ${name} prompt has a known category`, () => {
      for (const prompt of prompts) {
        assert.ok(CATEGORIES.has(prompt.category), `${prompt.id}: ${prompt.category}`);
      }
    });
  }

  it('Armenian prompts are written in Armenian and end with a full stop', () => {
    for (const prompt of sameAnswerHy) {
      assert.match(prompt.text, /[԰-֏]/, `${prompt.id} has no Armenian letters`);
      assert.ok(prompt.text.endsWith('։'), `${prompt.id} does not end with ։`);
    }
  });

  it('Armenian prompts start with an Armenian capital and contain no lookalike letters', () => {
    // Greek Α (U+0391) and Latin A look like Armenian Ա (U+0531) but render in a different
    // font and break the "Ասա…" pattern; any Latin, Greek or Cyrillic letter is a paste error.
    for (const prompt of sameAnswerHy) {
      assert.match(prompt.text, /^[Ա-Ֆ]/, `${prompt.id} does not start with an Armenian capital`);
      assert.doesNotMatch(
        prompt.text,
        /[A-Za-zͰ-ϿЀ-ӿ]/,
        `${prompt.id} contains a Latin, Greek or Cyrillic letter`,
      );
    }
  });

  it('English prompts are written in Latin letters and end with a full stop', () => {
    for (const prompt of sameAnswerEn) {
      assert.doesNotMatch(prompt.text, /[԰-֏]/, `${prompt.id} has Armenian letters`);
      assert.ok(prompt.text.endsWith('.'), `${prompt.id} does not end with .`);
    }
  });
});

describe('deck access', () => {
  it('serves the deck for the requested language', () => {
    assert.equal(getSameAnswerPrompts('hy'), sameAnswerHy);
    assert.equal(getSameAnswerPrompts('en'), sameAnswerEn);
    assert.equal(getSameAnswerPrompts('hy').length, DECK_SIZE);
    assert.equal(getSameAnswerPrompts('en').length, DECK_SIZE);
  });

  it('builds a lookup map that covers every id', () => {
    assert.equal(Object.keys(getSameAnswerPromptMap('hy')).length, DECK_SIZE);
    assert.equal(Object.keys(getSameAnswerPromptMap('en')).length, DECK_SIZE);
  });

  it('is big enough for the largest possible game', () => {
    // 4 teams × 5 turns = 20 prompts, dealt with no repeats.
    assert.ok(DECK_SIZE >= 20);
  });
});
