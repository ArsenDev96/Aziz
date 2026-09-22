import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { getActItCardMap, getActItCards, type Card } from '../src/content/act-it';
import { actItEn } from '../src/content/act-it/en';
import { actItHy } from '../src/content/act-it/hy';

const DECK_SIZE = 200;

/** A card is one word or a two-word concept, shown huge so actors can read it across the room. */
const MAX_TEXT_LENGTH = 24;

const CATEGORIES = new Set(['action', 'animal', 'people', 'sport', 'armenia', 'object']);

const decks: { name: string; cards: Card[] }[] = [
  { name: 'Armenian', cards: actItHy },
  { name: 'English', cards: actItEn },
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

describe('card deck size', () => {
  for (const { name, cards } of decks) {
    it(`has exactly ${DECK_SIZE} ${name} cards`, () => {
      assert.equal(cards.length, DECK_SIZE);
    });
  }
});

describe('card ids', () => {
  for (const { name, cards } of decks) {
    it(`${name} ids are unique`, () => {
      assert.deepEqual(duplicates(cards.map((card) => card.id)), []);
    });

    it(`${name} ids are exactly ai-001 … ai-200 in order`, () => {
      cards.forEach((card, index) => {
        assert.equal(card.id, `ai-${String(index + 1).padStart(3, '0')}`);
      });
    });
  }

  it('every Armenian card has an English twin with the same id', () => {
    const en = getActItCardMap('en');
    for (const card of actItHy) assert.ok(en[card.id], `no English card for ${card.id}`);
  });

  it('every English card has an Armenian twin with the same id', () => {
    const hy = getActItCardMap('hy');
    for (const card of actItEn) assert.ok(hy[card.id], `no Armenian card for ${card.id}`);
  });

  // The decks are deliberately not translations of each other (Armenian is Armenia-first,
  // English is international), so nothing here compares the meaning or category of a pair.
});

describe('card text', () => {
  for (const { name, cards } of decks) {
    it(`no ${name} card is empty`, () => {
      for (const card of cards) {
        assert.ok(card.text.trim().length > 0, `${card.id} is empty`);
        assert.equal(card.text, card.text.trim(), `${card.id} has stray whitespace`);
      }
    });

    it(`no ${name} card text is repeated`, () => {
      assert.deepEqual(duplicates(cards.map((card) => normalize(card.text))), []);
    });

    it(`every ${name} card is short enough to show huge`, () => {
      for (const card of cards) {
        assert.ok(
          card.text.length <= MAX_TEXT_LENGTH,
          `${card.id} is ${card.text.length} characters: "${card.text}"`,
        );
        assert.ok(card.text.split(' ').length <= 3, `${card.id} is more than three words`);
      }
    });

    it(`every ${name} card has a known category`, () => {
      for (const card of cards) {
        assert.ok(CATEGORIES.has(card.category), `${card.id}: ${card.category}`);
      }
    });

    it(`no ${name} card ends with punctuation`, () => {
      for (const card of cards) {
        assert.doesNotMatch(card.text, /[.։!?]$/, `${card.id} ends with punctuation`);
      }
    });
  }

  it('Armenian cards start with an Armenian capital and contain no lookalike letters', () => {
    // Greek Α (U+0391) and Latin A look like Armenian Ա (U+0531); any Latin, Greek or
    // Cyrillic letter is a paste error.
    for (const card of actItHy) {
      assert.match(card.text, /^[Ա-Ֆ]/, `${card.id} does not start with an Armenian capital`);
      assert.doesNotMatch(
        card.text,
        /[A-Za-zͰ-ϿЀ-ӿ]/,
        `${card.id} contains a Latin, Greek or Cyrillic letter`,
      );
    }
  });

  it('English cards start with a capital and use Latin letters only', () => {
    for (const card of actItEn) {
      assert.match(card.text, /^[A-Z]/, `${card.id} does not start with a capital`);
      assert.match(card.text, /^[A-Za-z' -]+$/, `${card.id} has non-Latin characters`);
    }
  });
});

describe('deck access', () => {
  it('serves the deck for the requested language', () => {
    assert.equal(getActItCards('hy'), actItHy);
    assert.equal(getActItCards('en'), actItEn);
  });

  it('builds a lookup map that covers every id', () => {
    assert.equal(Object.keys(getActItCardMap('hy')).length, DECK_SIZE);
    assert.equal(Object.keys(getActItCardMap('en')).length, DECK_SIZE);
  });
});
